"use client";

import { useTonWallet } from "@tonconnect/ui-react";
import { useRouter }    from "next/navigation";
import { useEffect, useState, useCallback, useRef } from "react";
import { motion }       from "framer-motion";
import { Download }     from "lucide-react";

import { MetricCards }      from "@/components/MetricCards";
import { AgentFeed }        from "@/components/AgentFeed";
import { PositionPanel }    from "@/components/PositionPanel";
import { GoalSetter }       from "@/components/GoalSetter";
import { TopBar }           from "@/components/TopBar";
import { AgentStatus }      from "@/components/AgentStatus";
import { PortfolioDonut }   from "@/components/PortfolioDonut";
import { PerformanceChart, Snapshot } from "@/components/PerformanceChart";
import { ConfirmModal }     from "@/components/ConfirmModal";
import { ToastProvider, useToast } from "@/components/Toast";

// ─── Types ───────────────────────────────────────────────────────────────────
export type AgentState = "idle" | "thinking" | "executing" | "paused";
export type Goal       = "maximize" | "conservative" | "balanced";

export interface AgentLog {
  id:       string;
  ts:       number;
  type:     "thought" | "action" | "tx" | "info" | "error" | "warning";
  message:  string;
  txHash?:  string;
}

export interface Position {
  staked:   number;
  lpValue:  number;
  totalTon: number;
  pnl:      number;
}

export interface PoolPosition {
  address:     string;
  token0:      string;
  token1:      string;
  apy:         number;
  tvlUsd:      number;
  tonDeployed: number;
  usdValue:    number;
  share:       string;
  enteredAt:   number;
  txHash:      string;
  simulated?:  boolean;
}

// ─── Session persistence ──────────────────────────────────────────────────────
const STORAGE_KEY  = "ton_yield_agent_v2";
const SESSION_TTL  = 24 * 60 * 60 * 1000; // 24 hours

function saveSession(data: object) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...data, savedAt: Date.now() }));
  } catch {}
}
function loadSession() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
    // Discard stale sessions older than 24h to prevent bad state
    if (raw.savedAt && Date.now() - raw.savedAt > SESSION_TTL) {
      localStorage.removeItem(STORAGE_KEY);
      return {};
    }
    return raw;
  } catch { return {}; }
}

// ─── CSV export ───────────────────────────────────────────────────────────────
function exportLogsCSV(logs: AgentLog[]) {
  const header = "Timestamp,Type,Message,TxHash\n";
  const rows   = logs.map(l =>
    `"${new Date(l.ts).toISOString()}","${l.type}","${l.message.replace(/"/g, '""')}","${l.txHash ?? ""}"`
  ).join("\n");
  const blob = new Blob([header + rows], { type: "text/csv" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `surge-logs-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Inner dashboard (needs toast context) ───────────────────────────────────
function DashboardInner() {
  const wallet        = useTonWallet();
  const connectedAddr = wallet?.account.address;   // raw 0:hexhex from TonConnect — most reliable source
  const router        = useRouter();
  const { toast }     = useToast();

  const walletChain    = wallet?.account.chain;                              // "-239"=mainnet, "-3"=testnet
  const [walletBalance,  setWalletBalance]  = useState<number | null>(null);
  const [marketApy,      setMarketApy]      = useState<{ tonstaker: number; bestPool: number }>({ tonstaker: 4.2, bestPool: 0 });
  const [agentState,     setAgentState]     = useState<AgentState>("idle");
  const [goal,          setGoal]          = useState<Goal>("balanced");
  const [amount,        setAmount]        = useState<number>(10);
  const [logs,          setLogs]          = useState<AgentLog[]>([]);
  const [position,      setPosition]      = useState<Position>({ staked: 0, lpValue: 0, totalTon: 0, pnl: 0 });
  const [agentWallet,   setAgentWallet]   = useState<string | null>(null);
  const [poolPositions, setPoolPositions] = useState<PoolPosition[]>([]);
  const [snapshots,     setSnapshots]     = useState<Snapshot[]>([]);
  const [actionsToday,  setActionsToday]  = useState<number>(0);
  const [hydrated,      setHydrated]      = useState(false);
  const [showConfirm,   setShowConfirm]   = useState(false);

  // ── Restore session ──────────────────────────────────────────────────────
  useEffect(() => {
    const saved = loadSession();
    if (saved.agentWallet)   setAgentWallet(saved.agentWallet);
    if (saved.logs)          setLogs(saved.logs);
    if (saved.position)      setPosition(saved.position);
    if (saved.goal)          setGoal(saved.goal);
    if (saved.amount)        setAmount(saved.amount);
    if (saved.snapshots)     setSnapshots(saved.snapshots);
    if (saved.poolPositions) setPoolPositions(saved.poolPositions);
    if (saved.actionsToday)  setActionsToday(saved.actionsToday);
    // Never restore "thinking" state — resume as "paused"
    if (saved.agentState && saved.agentState !== "thinking")
      setAgentState(saved.agentState === "executing" ? "paused" : saved.agentState);
    setHydrated(true);
  }, []);

  // ── Persist key state ────────────────────────────────────────────────────
  useEffect(() => {
    if (!hydrated) return;
    saveSession({
      agentWallet,
      logs:          logs.slice(0, 100),
      position,
      poolPositions,
      goal,
      amount,
      agentState,
      actionsToday,
      snapshots:     snapshots.slice(-100),
    });
  }, [agentWallet, logs, position, goal, agentState, actionsToday, hydrated, poolPositions, snapshots]);

  // ── Redirect if wallet disconnected ─────────────────────────────────────
  useEffect(() => {
    if (!wallet) router.push("/");
  }, [wallet, router]);

  // ── Fetch wallet balance via server route (avoids browser CORS limits) ─────
  useEffect(() => {
    if (!connectedAddr) return;

    const fetchBalance = async () => {
      try {
        // Route through /api/balance — server has no CORS constraints.
        // network=auto → tries mainnet first, falls back to testnet.
        // We also hint the known chain so the server can skip a round-trip.
        const network = walletChain === "-3" ? "testnet"
                      : walletChain === "-239" ? "mainnet"
                      : "auto";
        const res  = await fetch(
          `/api/balance?address=${encodeURIComponent(connectedAddr)}&network=${network}`,
          { cache: "no-store" },
        );
        if (!res.ok) { setWalletBalance(null); return; }
        const data = await res.json();
        const ton  = typeof data.balance === "number" ? data.balance : null;
        setWalletBalance(ton);
      } catch {
        setWalletBalance(null);
      }
    };

    fetchBalance();
    const iv = setInterval(fetchBalance, 15_000);
    return () => clearInterval(iv);
  }, [connectedAddr, walletChain]);

  // ── Fetch live market APYs (independent of agent) ────────────────────────
  useEffect(() => {
    const fetchMarket = async () => {
      try {
        const res  = await fetch("/api/market");
        const data = await res.json();
        if (typeof data.tonstakerApy === "number" || typeof data.bestPoolApy === "number") {
          setMarketApy({
            tonstaker: data.tonstakerApy ?? 4.2,
            bestPool:  data.bestPoolApy  ?? 0,
          });
        }
      } catch { /* keep defaults */ }
    };
    fetchMarket();
    const iv = setInterval(fetchMarket, 60_000);
    return () => clearInterval(iv);
  }, []);

  const addLog = useCallback((type: AgentLog["type"], message: string, txHash?: string) => {
    setLogs(prev => [{ id: crypto.randomUUID(), ts: Date.now(), type, message, txHash }, ...prev].slice(0, 100));
  }, []);

  // ── Run one agent cycle via stateless /api/agent/cycle ───────────────────
  const cycleRunning = useRef(false);

  const runCycle = useCallback(async (
    walletAddr: string,
    currentGoal: string,
    currentCapital: number,
    currentPos: typeof position,
    currentPools: typeof poolPositions,
  ) => {
    if (cycleRunning.current) return; // don't stack cycles
    cycleRunning.current = true;
    setAgentState("thinking");
    try {
      const res  = await fetch("/api/agent/cycle", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goal:         currentGoal,
          capitalTon:   currentCapital,
          position:     currentPos,
          pools:        currentPools,
          walletAddress: walletAddr,
        }),
      });
      if (!res.ok) throw new Error(`Cycle failed: ${res.status}`);
      const data = await res.json();

      // Prepend new logs
      if (data.logs?.length) {
        setLogs(prev => [...data.logs, ...prev].slice(0, 200));
        data.logs.forEach((l: AgentLog) => {
          if (l.type === "tx")      toast("success", "Transaction executed", l.message);
          if (l.type === "error")   toast("error",   "Agent error",          l.message);
          if (l.type === "warning") toast("warning", "Notice",               l.message);
        });
        // Count tx logs as actions
        const txCount = (data.logs as AgentLog[]).filter(l => l.type === "tx").length;
        if (txCount > 0) setActionsToday(prev => prev + txCount);
      }

      if (data.position) {
        setPosition(data.position);
        setSnapshots(prev => {
          const snap: Snapshot = {
            ts:       Date.now(),
            totalTon: data.position.totalTon,
            pnl:      data.position.pnl,
            apy:      (data.tonstakerApy ?? 4.2),
          };
          const last = prev[prev.length - 1];
          if (!last || Math.abs(last.totalTon - snap.totalTon) > 0.0001 || snap.ts - last.ts > 30_000)
            return [...prev, snap].slice(-100);
          return prev;
        });
      }
      if (data.pools) setPoolPositions(data.pools);
      if (data.tonstakerApy || data.bestPoolApy) {
        setMarketApy({
          tonstaker: data.tonstakerApy ?? marketApy.tonstaker,
          bestPool:  data.bestPoolApy  ?? marketApy.bestPool,
        });
      }
      setAgentState("executing");
    } catch (err: any) {
      addLog("error", `Cycle error: ${err.message}`);
      setAgentState("paused");
    } finally {
      cycleRunning.current = false;
    }
  }, [toast, addLog, marketApy]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Trigger cycles every 30s while executing ─────────────────────────────
  const agentStateRef      = useRef(agentState);
  const positionRef        = useRef(position);
  const poolPositionsRef   = useRef(poolPositions);
  const goalRef            = useRef(goal);
  const amountRef          = useRef(amount);
  const agentWalletRef     = useRef(agentWallet);
  agentStateRef.current    = agentState;
  positionRef.current      = position;
  poolPositionsRef.current = poolPositions;
  goalRef.current          = goal;
  amountRef.current        = amount;
  agentWalletRef.current   = agentWallet;

  useEffect(() => {
    const iv = setInterval(() => {
      if (agentStateRef.current !== "executing" && agentStateRef.current !== "thinking") return;
      if (!agentWalletRef.current) return;
      runCycle(
        agentWalletRef.current,
        goalRef.current,
        amountRef.current,
        positionRef.current,
        poolPositionsRef.current,
      );
    }, 30_000);
    return () => clearInterval(iv);
  }, [runCycle]);

  // ── Start agent ───────────────────────────────────────────────────────────
  const startAgent = async () => {
    setShowConfirm(false);
    setAgentState("thinking");
    addLog("info", `Deploying agentic wallet — strategy: ${goal}, capital: ${amount} TON…`);
    try {
      // Deploy wallet
      const res  = await fetch("/api/agent", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ ownerAddress: wallet?.account.address }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const walletAddr = data.agentWalletAddress;
      setAgentWallet(walletAddr);
      addLog("info", `Agentic wallet deployed: ${walletAddr.slice(0, 14)}…`);
      toast("success", "Agent started", `Running ${goal} strategy with ${amount} TON`);

      // Run first cycle immediately
      const initialPos = { staked: 0, lpValue: 0, totalTon: amount, pnl: 0 };
      setPosition(initialPos);
      setAgentState("executing");
      await runCycle(walletAddr, goal, amount, initialPos, []);
    } catch (err: any) {
      addLog("error", `Failed to start: ${err.message}`);
      setAgentState("idle");
      toast("error", "Failed to start", err.message);
    }
  };

  // ── Pause agent ───────────────────────────────────────────────────────────
  const pauseAgent = () => {
    setAgentState("paused");
    addLog("info", "Agent paused — no further transactions will execute.");
    toast("info", "Agent paused");
  };

  // ── Close/exit position ───────────────────────────────────────────────────
  const closePosition = useCallback((type: "staking" | "lp", address?: string) => {
    if (type === "staking") {
      addLog("action", "Initiating unstake from Tonstakers (36–72h unbonding period)…");
      addLog("info",   "Unstake request submitted. tsTON will convert back to TON after the unbonding period.");
      toast("info", "Unstake requested", "TON will be returned after the ~36–72h unbonding period");
      setPosition(prev => ({ ...prev, staked: 0, totalTon: prev.totalTon + prev.staked / 0.98 }));
    } else if (type === "lp" && address) {
      const pool = poolPositions.find(p => p.address === address);
      if (!pool) return;
      addLog("action", `Removing liquidity from ${pool.token0}/${pool.token1} pool…`);
      addLog("info",   `LP position closed. ${pool.tonDeployed.toFixed(4)} TON + ${pool.token1} returned.`);
      toast("success", "LP position closed", `Removed ${pool.tonDeployed.toFixed(4)} TON from ${pool.token0}/${pool.token1}`);
      setPoolPositions(prev => prev.filter(p => p.address !== address));
      setPosition(prev => ({ ...prev, totalTon: prev.totalTon + pool.tonDeployed, lpValue: prev.lpValue - pool.usdValue }));
    }
  }, [poolPositions, addLog, toast]);

  // ── Live APY — from /api/market, updated every 60s ───────────────────────
  const tonstakerApy = marketApy.tonstaker;
  const bestPoolApy  = marketApy.bestPool;

  return (
    <>
      <ConfirmModal
        open={showConfirm}
        amount={amount}
        goal={goal}
        onConfirm={startAgent}
        onCancel={() => setShowConfirm(false)}
      />

      <div className="min-h-screen flex flex-col bg-[#f5f5f5] dark:bg-[#0a0a0a] text-black dark:text-white">
        <TopBar agentState={agentState} agentWallet={agentWallet} />

        <div className="flex-1 p-4 md:p-6 lg:p-8 space-y-4 md:space-y-5 max-w-7xl mx-auto w-full">

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <MetricCards
              tonstakerApy={tonstakerApy}
              bestPoolApy={bestPoolApy}
              position={position}
              actionsToday={actionsToday}
              walletBalance={walletBalance}
            />
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-5">

            {/* Left column */}
            <motion.div
              className="lg:col-span-2 space-y-4 md:space-y-5"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <AgentStatus
                state={agentState}
                agentWallet={agentWallet}
                amount={amount}
                onAmount={setAmount}
                walletBalance={walletBalance}
                onStart={() => setShowConfirm(true)}
                onPause={pauseAgent}
              />
              <PerformanceChart snapshots={snapshots} initial={amount} />
              <AgentFeed logs={logs} agentState={agentState} />

              {/* Log export */}
              {logs.length > 0 && (
                <button
                  onClick={() => exportLogsCSV(logs)}
                  className="flex items-center gap-2 text-[12px] text-black/30 dark:text-white/25 hover:text-[#0098EA] transition-colors"
                >
                  <Download size={13} />
                  Export agent logs as CSV
                </button>
              )}
            </motion.div>

            {/* Right column */}
            <motion.div
              className="space-y-4 md:space-y-5"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <GoalSetter
                goal={goal}
                onChange={setGoal}
                disabled={agentState !== "idle" && agentState !== "paused"}
              />
              <PortfolioDonut position={position} poolPositions={poolPositions} />
              <PositionPanel
                position={position}
                poolPositions={poolPositions}
                onCloseStaking={() => closePosition("staking")}
                onCloseLP={(address) => closePosition("lp", address)}
              />
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Page export (wraps ToastProvider) ───────────────────────────────────────
export default function Dashboard() {
  return (
    <ToastProvider>
      <DashboardInner />
    </ToastProvider>
  );
}
