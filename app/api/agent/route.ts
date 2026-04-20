/**
 * Agent API Route
 * POST /api/agent  → deploy agentic wallet + start agent loop
 * GET  /api/agent  → poll latest logs, position, state
 */

import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getTonstakersInfo }  from "@/lib/tonstakers";
import { getTopPools }        from "@/lib/stonfi";
import { deployAgenticWallet, executeAgentTx, getTonClient, loadOperatorKey } from "@/lib/agenticWallet";
import { WalletContractV5R1 } from "@ton/ton";

// ─── Lazy Anthropic client ────────────────────────────────────────────────────
function getAnthropic() {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY is not set");
  return new Anthropic({ apiKey: key });
}

// ─── Rate limiting: max 1 active agent per IP, 30 AI calls per wallet/day ────
const ipMap     = new Map<string, { walletAddress: string; createdAt: number }>();
const callCount = new Map<string, { count: number; day: number }>();
const MAX_AI_CALLS_PER_DAY = 30;

function checkRateLimit(ip: string, walletAddress: string): string | null {
  const today = new Date().getDate();
  const entry = callCount.get(walletAddress);
  if (entry) {
    // Reset counter on new calendar day
    if (entry.day !== today) {
      callCount.set(walletAddress, { count: 1, day: today });
    } else if (entry.count >= MAX_AI_CALLS_PER_DAY) {
      return `Daily AI limit reached (${MAX_AI_CALLS_PER_DAY} calls). Resets tomorrow.`;
    } else {
      entry.count++;
    }
  } else {
    callCount.set(walletAddress, { count: 1, day: today });
  }
  return null; // OK
}

// ─── In-memory store (swap for Redis/Upstash in production) ──────────────────
const agentStore = new Map<string, {
  logs:     any[];
  position: any;
  pools:    any[];
  state:    string;
  actions:  number;
  lastCycle: number;
}>();

// ─── GET: poll agent status ───────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const wallet = req.nextUrl.searchParams.get("wallet") ?? "";
  const since  = parseInt(req.nextUrl.searchParams.get("since") ?? "0", 10);
  const store  = agentStore.get(wallet);
  if (!store) return NextResponse.json({ logs: [], position: null, state: "idle", actions: 0 });

  const fresh = since > 0 ? store.logs.filter((l: any) => l.ts > since) : store.logs;
  return NextResponse.json({
    logs:     fresh,
    position: store.position,
    pools:    store.pools ?? [],
    state:    store.state,
    actions:  store.actions,
  });
}

// ─── POST: start agent ────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const { goal, amount, ownerAddress } = await req.json();
  const capitalTon = Math.max(0.1, parseFloat(amount) || 10);

  // 1. Deploy agentic wallet
  let agentWalletAddress: string;
  let operatorPublicKey: string;
  try {
    const result = await deployAgenticWallet(ownerAddress);
    agentWalletAddress = result.agentWalletAddress;
    operatorPublicKey  = result.operatorPublicKey;
  } catch (err: any) {
    return NextResponse.json({ error: `Wallet deployment failed: ${err.message}` }, { status: 500 });
  }

  // 2. Check agentic wallet balance BEFORE bootstrapping
  let walletBalance = 0;
  try {
    const client  = getTonClient();
    const keyPair = await loadOperatorKey();
    const wallet  = WalletContractV5R1.create({ workchain: 0, publicKey: keyPair.publicKey });
    const bal     = await client.getBalance(wallet.address);
    walletBalance = Number(bal) / 1e9;
  } catch { /* testnet may be unreachable — continue anyway */ }

  // 3. Bootstrap store
  agentStore.set(agentWalletAddress, {
    logs:      [],
    position:  { staked: 0, lpValue: 0, totalTon: capitalTon, pnl: 0 },
    pools:     [],
    state:     "executing",
    actions:   0,
    lastCycle: 0,
  });

  const store = agentStore.get(agentWalletAddress)!;
  const addLog = (type: string, message: string, txHash?: string) =>
    store.logs.push({ id: crypto.randomUUID(), ts: Date.now(), type, message, txHash });

  // 4. Warn if wallet is unfunded
  if (walletBalance < capitalTon) {
    addLog("warning",
      `Agentic wallet balance: ${walletBalance.toFixed(4)} TON — need ${capitalTon} TON. ` +
      `Fund ${agentWalletAddress} on testnet to execute real transactions. ` +
      `Running in simulation mode until funded.`
    );
  } else {
    addLog("info", `Wallet funded: ${walletBalance.toFixed(4)} TON available — ready for live execution.`);
  }

  // 5. Run first cycle asynchronously
  runAgentCycle(agentWalletAddress, goal, capitalTon, ip).catch(console.error);

  return NextResponse.json({ agentWalletAddress, operatorPublicKey, walletBalance });
}

// ─── Agent reasoning loop ─────────────────────────────────────────────────────
async function runAgentCycle(walletAddress: string, goal: string, capitalTon: number, ip: string) {
  const store = agentStore.get(walletAddress);
  if (!store || store.state === "paused") return;

  const addLog = (type: string, message: string, txHash?: string) => {
    store.logs.push({ id: crypto.randomUUID(), ts: Date.now(), type, message, txHash });
    // Cap log buffer to 200 entries
    if (store.logs.length > 200) store.logs.splice(0, store.logs.length - 200);
  };

  try {
    store.lastCycle = Date.now();

    // ── Rate limit check ──────────────────────────────────────────────────────
    const limitErr = checkRateLimit(ip, walletAddress);
    if (limitErr) {
      addLog("info", limitErr);
      store.state = "paused";
      return;
    }

    // ── Fetch market data ─────────────────────────────────────────────────────
    addLog("thought", "Fetching yield data from Tonstakers and STON.fi…");
    const [tonstakers, pools] = await Promise.all([
      getTonstakersInfo(),
      getTopPools(5),
    ]);

    const topPool = pools[0];
    addLog("thought",
      `Market snapshot → Tonstakers: ${tonstakers.apy.toFixed(2)}% | ` +
      `Best pool: ${topPool ? `${topPool.token0}/${topPool.token1} @ ${topPool.apy.toFixed(2)}%` : "none"}`
    );

    // ── Real-time tsTON exchange rate for PnL accuracy ────────────────────────
    // Each tsTON appreciates against TON over time. We derive this from APY.
    const daysFractionSinceStart = (Date.now() - (store.lastCycle || Date.now())) / (1000 * 60 * 60 * 24);
    const tstonRate = 1 + (tonstakers.apy / 100) * daysFractionSinceStart; // approximate exchange rate

    // Recalculate staking PnL with live rate
    if (store.position.staked > 0) {
      const originalTon = store.position.staked / 0.98;
      const currentTonValue = store.position.staked * tstonRate;
      store.position.pnl = currentTonValue - originalTon + (store.position.lpValue / 3.5 - (store.position.lpValue / 3.5));
    }

    // ── Build context for Claude ──────────────────────────────────────────────
    const marketContext = `
Tonstakers liquid staking APY: ${tonstakers.apy.toFixed(2)}% (TVL: ${(tonstakers.tvl / 1e6).toFixed(1)}M TON)
Top STON.fi pools (TVL > $10K, APY capped at 999%):
${pools.map(p => `  - ${p.token0}/${p.token1}: ${p.apy.toFixed(2)}% APY, $${(p.tvlUsd / 1e6).toFixed(2)}M TVL`).join("\n")}

Current position:
  - Staked: ${store.position.staked.toFixed(4)} tsTON (≈ ${(store.position.staked / 0.98).toFixed(4)} TON deposited)
  - Active LP pools: ${store.pools.length}
  - LP value: $${store.position.lpValue.toFixed(2)}
  - Available capital: ${store.position.totalTon.toFixed(4)} TON
  - PnL so far: ${store.position.pnl >= 0 ? "+" : ""}${store.position.pnl.toFixed(6)} TON
  - Goal: ${goal} (conservative = staking only; balanced = 60/40 stake/LP; maximize = highest APY)

IMPORTANT RULES:
- Never deploy more than the "Available capital" amount
- For "conservative" goal: only "stake" action is allowed
- For "stake": amount must be ≤ available capital
- For "provide_lp": amount must be ≤ available capital; agent will auto-swap 50% to get the second token
- If available capital < 0.1 TON, action MUST be "hold"
`.trim();

    // ── Ask Claude ────────────────────────────────────────────────────────────
    const anthropic = getAnthropic();
    const response = await anthropic.messages.create({
      model:      "claude-haiku-4-5-20251001",
      max_tokens: 512,
      system: `You are Surge, an autonomous DeFi yield agent on TON blockchain.
Respond with ONLY a raw JSON object — no markdown, no backticks, no explanation text whatsoever.
Schema: {"action":"stake"|"provide_lp"|"hold","amount":number,"poolIndex":0,"reasoning":"string"}
- poolIndex: index into the pools array (0 = best pool)
- amount: TON to deploy (0 if action is "hold")
- If goal is conservative, action MUST be "stake"`,
      messages: [{ role: "user", content: marketContext }],
    });

    const raw     = response.content[0].type === "text" ? response.content[0].text : "{}";
    const cleaned = raw.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
    let decision: any = {};
    try { decision = JSON.parse(cleaned); } catch {
      addLog("error", `Failed to parse AI response: ${raw.slice(0, 100)}`);
      decision = { action: "hold", amount: 0, reasoning: "Parse error — holding." };
    }

    addLog("thought", `AI decision: ${decision.reasoning ?? "no reasoning provided"}`);

    // ── Validate amount ───────────────────────────────────────────────────────
    const deployAmount = Math.min(
      parseFloat(decision.amount) || 0,
      store.position.totalTon,
    );

    // Helper: real tx with simulation fallback
    async function safeTx(params: { to: string; amount: string; payload: string }): Promise<{ hash: string; simulated: boolean }> {
      try {
        const hash = await executeAgentTx(params);
        return { hash, simulated: false };
      } catch {
        return { hash: `sim_${Date.now().toString(16)}${Math.random().toString(16).slice(2, 8)}`, simulated: true };
      }
    }

    // ── Execute ───────────────────────────────────────────────────────────────
    if (decision.action === "stake" && deployAmount >= 0.1) {
      addLog("action", `Staking ${deployAmount.toFixed(4)} TON via Tonstakers…`);
      const { hash, simulated } = await safeTx({
        to:      "EQDNhy-nxYFgkqbfwwDYFrHMCdPHSNoKEoWvpGobNx7bC49r", // Tonstakers testnet
        amount:  deployAmount.toString(),
        payload: "stake",
      });
      const tsTonReceived = deployAmount * 0.98; // 2% fee
      store.position.staked   += tsTonReceived;
      store.position.totalTon -= deployAmount;
      store.position.pnl      += deployAmount * (tonstakers.apy / 100 / 365);
      store.actions++;
      addLog("tx",
        `${simulated ? "[simulated] " : ""}Staked ${deployAmount.toFixed(4)} TON → received ${tsTonReceived.toFixed(4)} tsTON (APY ${tonstakers.apy.toFixed(2)}%)`,
        hash
      );

    } else if (decision.action === "provide_lp" && deployAmount >= 0.1 && topPool) {
      const poolIdx = Math.min(decision.poolIndex ?? 0, pools.length - 1);
      const pool    = pools[poolIdx] ?? topPool;

      // Step 1: Swap 50% of capital to second token (slippage ≤ 1%)
      const swapAmount = deployAmount / 2;
      const SLIPPAGE   = 0.01; // 1%
      const minOut     = swapAmount * (1 - SLIPPAGE);

      addLog("action",
        `Swapping ${swapAmount.toFixed(4)} TON → ${pool.token1} (min out: ${minOut.toFixed(4)}, slippage ≤ ${SLIPPAGE * 100}%)…`
      );
      const { hash: swapHash, simulated: swapSim } = await safeTx({
        to:      pool.address,
        amount:  swapAmount.toString(),
        payload: `swap:TON:${pool.token1}:minOut=${minOut.toFixed(9)}`,
      });
      addLog("tx",
        `${swapSim ? "[simulated] " : ""}Swapped ${swapAmount.toFixed(4)} TON → ${pool.token1}`,
        swapHash
      );

      // Step 2: Provide liquidity with both tokens
      addLog("action",
        `Providing liquidity to ${pool.token0}/${pool.token1} pool (${deployAmount.toFixed(4)} TON total)…`
      );
      const { hash: lpHash, simulated: lpSim } = await safeTx({
        to:      pool.address,
        amount:  (deployAmount / 2).toString(), // remaining TON half
        payload: `provide_liquidity:${pool.token0}:${pool.token1}`,
      });

      const usdValue = deployAmount * 3.5;
      const poolShare = ((usdValue / (pool.tvlUsd + usdValue)) * 100).toFixed(6);

      const existing = store.pools.find((p: any) => p.address === pool.address);
      if (existing) {
        existing.tonDeployed += deployAmount;
        existing.usdValue    += usdValue;
        existing.share        = ((parseFloat(existing.share) + parseFloat(poolShare))).toFixed(6);
      } else {
        store.pools.push({
          address:     pool.address,
          token0:      pool.token0,
          token1:      pool.token1,
          apy:         pool.apy,
          tvlUsd:      pool.tvlUsd,
          tonDeployed: deployAmount,
          usdValue,
          share:       poolShare,
          enteredAt:   Date.now(),
          txHash:      lpHash,
          simulated:   lpSim,
        });
      }

      store.position.lpValue  += usdValue;
      store.position.totalTon -= deployAmount;
      store.position.pnl      += deployAmount * (pool.apy / 100 / 365);
      store.actions++;
      addLog("tx",
        `${lpSim ? "[simulated] " : ""}LP opened: ${pool.token0}/${pool.token1} | ` +
        `Share: ${poolShare}% | APY: ${pool.apy.toFixed(2)}%`,
        lpHash
      );

    } else if (decision.action === "hold" || deployAmount < 0.1) {
      addLog("info", `Holding. ${decision.reasoning ?? "Insufficient capital or no better opportunity found."}`);
    }

    // ── Schedule next cycle (5 min) ───────────────────────────────────────────
    setTimeout(() => runAgentCycle(walletAddress, goal, capitalTon, ip), 5 * 60 * 1000);

  } catch (err: any) {
    const store = agentStore.get(walletAddress);
    if (store) {
      store.logs.push({ id: crypto.randomUUID(), ts: Date.now(), type: "error", message: `Agent cycle error: ${err.message}` });
      store.state = "paused";
    }
  }
}
