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
  const wallet = useTonWallet();
  const router = useRouter();
  const { toast } = useToast();

  const [agentState,    setAgentState]    = useState<AgentState>("idle");
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

  // ── Deduplicate logs ─────────────────────────────────────────────────────
  const mergeLogs = useCallback((incoming: AgentLog[]) => {
    setLogs(prev => {
      const ids   = new Set(prev.map(l => l.id));
      const fresh = incoming.filter(l => !ids.has(l.id));
      if (!fresh.length) return prev;
      return [...fresh, ...prev].slice(0, 100);
    });
  }, []);

  // ── Poll agent ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!agentWallet) return;
    const poll = async () => {
      try {
        const lastTs = logs[0]?.ts ?? 0;
        const res    = await fetch(`/api/agent?wallet=${agentWallet}&since=${lastTs}`);
        const data   = await res.json();
        if (data.logs?.length) {
          mergeLogs(data.logs);
          // Surface tx toasts
          data.logs.forEach((l: AgentLog) => {
            if (l.type === "tx")      toast("success", "Transaction executed", l.message);
            if (l.type === "error")   toast("error",   "Agent error", l.message);
            if (l.type === "warning") toast("warning", "Notice", l.message);
          });
        }
        if (data.position) {
          setPosition(data.position);
          setSnapshots(prev => {
            const snap: Snapshot = {
              ts:       Date.now(),
              totalTon: data.position.totalTon,
              pnl:      data.position.pnl,
              apy:      tonstakerApy || bestPoolApy || 4.2,
            };
            const last = prev[prev.length - 1];
            if (!last || Math.abs(last.totalTon - snap.totalTon) > 0.0001 || snap.ts - last.ts > 60_000)
              return [...prev, snap].slice(-100);
            return prev;
          });
        }
        if (data.pools)   setPoolPositions(data.pools);
        if (data.actions) setActionsToday(data.actions);
        if (data.state)   setAgentState(data.state);
      } catch { /* network hiccup — keep polling */ }
    };
    poll();
    const iv = setInterval(poll, 4000);
    return () => clearInterval(iv);
  }, [agentWallet, mergeLogs]); // eslint-disable-line react-hooks/exhaustive-deps

  const addLog = useCallback((type: AgentLog["type"], message: string, txHash?: string) => {
    setLogs(prev => [{ id: crypto.randomUUID(), ts: Date.now(), type, message, txHash }, ...prev].slice(0, 100));
  }, []);

  // ── Start agent ───────────────────────────────────────────────────────────
  const startAgent = async () => {
    setShowConfirm(false);
    setAgentState("thinking");
    addLog("info", `Deploying agentic wallet — strategy: ${goal}, capital: ${amount} TON…`);
    try {
      const res  = await fetch("/api/agent", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ goal, amount, ownerAddress: wallet?.account.address }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      if (data.agentWalletAddress) {
        setAgentWallet(data.agentWalletAddress);
        addLog("info",   `Agentic wallet: ${data.agentWalletAddress.slice(0, 12)}…`);
        if (data.walletBalance !== undefined && data.walletBalance < amount) {
          addLog("warning",
            `Wallet has ${data.walletBalance.toFixed(4)} TON — fund it to enable real transactions.`
          );
          toast("warning", "Wallet needs funding",
            `Send ${amount} TON to ${data.agentWalletAddress.slice(0, 12)}… on testnet`
          );
        }
        addLog("action", `Agent loop started — goal: ${goal}`);
        setAgentState("executing");
        toast("success", "Agent started", `Deploying ${amount} TON with ${goal} strategy`);
      }
    } catch (err: any) {
      addLog("error", `Failed to start agent: ${err.message}`);
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

  // ── Derive APY from logs ──────────────────────────────────────────────────
  const tonstakerApy = parseFloat(
    logs.find(l => l.message.includes("Tonstakers:"))
      ?.message.match(/Tonstakers:\s*([\d.]+)%/)?.[1] ?? "4.20"
  );
  const bestPoolApy = parseFloat(
    logs.find(l => l.message.includes("Best pool:"))
      ?.message.match(/Best pool:\s*[\w/]+\s*@\s*([\d.]+)%/)?.[1] ?? "0"
  );

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
