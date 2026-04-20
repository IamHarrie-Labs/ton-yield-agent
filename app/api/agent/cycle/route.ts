/**
 * POST /api/agent/cycle
 *
 * Fully stateless — client sends current position, server runs ONE
 * AI reasoning cycle and returns logs + updated position + pools.
 * No in-memory store, no setTimeout. Works on Vercel serverless.
 *
 * Body: { goal, capitalTon, position, pools, walletAddress }
 * Returns: { logs, position, pools }
 */
import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const ANTHROPIC_KEY  = process.env.ANTHROPIC_API_KEY ?? "";
const TONSTAKERS_URL = "https://api.tonstakers.com/v1/stats";
const STONFI_URL     = "https://api.ston.fi/v1/pools?limit=100";

// ─── helpers ─────────────────────────────────────────────────────────────────

function mkLog(type: string, message: string, txHash?: string) {
  return { id: crypto.randomUUID(), ts: Date.now(), type, message, ...(txHash ? { txHash } : {}) };
}

async function fetchTonstakersApy(): Promise<number> {
  try {
    const r = await fetch(TONSTAKERS_URL, { cache: "no-store" });
    if (!r.ok) return 4.2;
    const j = await r.json();
    // try common field names
    const v = j.apy ?? j.apr ?? j.stakingApy ?? j.data?.apy ?? j.data?.apr;
    return typeof v === "number" ? v : parseFloat(String(v)) || 4.2;
  } catch { return 4.2; }
}

async function fetchPools() {
  try {
    const r = await fetch(STONFI_URL, { cache: "no-store" });
    if (!r.ok) throw new Error(`STON.fi ${r.status}`);
    const j = await r.json();
    const list: any[] = j.pool_list ?? j.pools ?? j.data ?? [];

    const mapped = list
      .map((p: any) => ({
        address: p.address ?? p.pool_address ?? "",
        token0:  p.token0_metadata?.symbol ?? p.token0_symbol ?? p.token0 ?? "TON",
        token1:  p.token1_metadata?.symbol ?? p.token1_symbol ?? p.token1 ?? "USDT",
        apy:     Math.min(
          parseFloat(p.apy_1d ?? p.apy_7d ?? p.apy_30d ?? p.apy ?? p.lp_fee_1d ?? "0"),
          500
        ),
        tvlUsd: parseFloat(p.lp_total_supply_usd ?? p.tvl_usd ?? p.tvl ?? p.reserve_usd ?? "0"),
      }))
      .filter(p => p.apy > 0 && p.tvlUsd > 5_000 && p.address)
      .sort((a, b) => b.apy - a.apy)
      .slice(0, 5);

    if (mapped.length > 0) return mapped;
    throw new Error("no valid pools");
  } catch {
    return [
      { address: "EQA_fallback_1", token0: "TON", token1: "USDT", apy: 6.8,  tvlUsd: 4_200_000 },
      { address: "EQA_fallback_2", token0: "TON", token1: "STON", apy: 5.1,  tvlUsd: 1_800_000 },
    ];
  }
}

function fakeTx(): string {
  return `sim_${Date.now().toString(16)}${Math.random().toString(16).slice(2, 8)}`;
}

// ─── main handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  if (!ANTHROPIC_KEY) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY not configured" }, { status: 500 });
  }

  const { goal = "balanced", capitalTon = 10, position: pos, pools: existingPools = [], walletAddress = "" }
    = await req.json();

  const logs: ReturnType<typeof mkLog>[] = [];
  let position = pos ?? { staked: 0, lpValue: 0, totalTon: capitalTon, pnl: 0 };
  let pools: any[] = existingPools;

  // ── 1. Fetch market data ──────────────────────────────────────────────────
  logs.push(mkLog("thought", "Fetching live yield data from Tonstakers and STON.fi…"));
  const [tonstakerApy, topPools] = await Promise.all([fetchTonstakersApy(), fetchPools()]);
  const topPool = topPools[0];

  logs.push(mkLog("thought",
    `Market snapshot → Tonstakers: ${tonstakerApy.toFixed(2)}% | ` +
    `Best pool: ${topPool ? `${topPool.token0}/${topPool.token1} @ ${topPool.apy.toFixed(2)}%` : "none"}`
  ));

  // ── 2. Build context for Claude ───────────────────────────────────────────
  const ctx = `
Tonstakers liquid staking APY: ${tonstakerApy.toFixed(2)}%
Top STON.fi pools:
${topPools.map(p => `  - ${p.token0}/${p.token1}: ${p.apy.toFixed(2)}% APY, $${(p.tvlUsd/1e6).toFixed(2)}M TVL`).join("\n")}

Current position:
  Staked: ${position.staked.toFixed(4)} tsTON
  LP value: $${position.lpValue.toFixed(2)}
  Available capital: ${position.totalTon.toFixed(4)} TON
  PnL: ${position.pnl >= 0 ? "+" : ""}${position.pnl.toFixed(6)} TON
  Goal: ${goal}

Rules:
- conservative → stake ONLY
- balanced → mix staking and LP
- maximize → chase highest APY
- If available < 0.1 TON → action must be "hold"
- Never deploy more than available capital
`.trim();

  // ── 3. Ask Claude ─────────────────────────────────────────────────────────
  let decision: any = { action: "hold", amount: 0, poolIndex: 0, reasoning: "Default hold." };
  try {
    const anthropic = new Anthropic({ apiKey: ANTHROPIC_KEY });
    const resp = await anthropic.messages.create({
      model:      "claude-haiku-4-5-20251001",
      max_tokens: 256,
      system:     `You are Surge, an autonomous DeFi yield agent. Reply with ONLY a raw JSON object, no markdown, no backticks.
Schema: {"action":"stake"|"provide_lp"|"hold","amount":number,"poolIndex":0,"reasoning":"short string"}`,
      messages:   [{ role: "user", content: ctx }],
    });
    const raw     = resp.content[0].type === "text" ? resp.content[0].text.trim() : "{}";
    const cleaned = raw.replace(/```[a-z]*\n?/gi, "").replace(/```/g, "").trim();
    decision = JSON.parse(cleaned);
  } catch (err: any) {
    logs.push(mkLog("error", `AI parse error — holding. (${err.message})`));
  }

  logs.push(mkLog("thought", `Decision: ${decision.action?.toUpperCase()} — ${decision.reasoning ?? "…"}`));

  const deployAmount = Math.min(Math.max(parseFloat(decision.amount) || 0, 0), position.totalTon);

  // ── 4. Execute decision ───────────────────────────────────────────────────
  if (decision.action === "stake" && deployAmount >= 0.1) {
    logs.push(mkLog("action", `Staking ${deployAmount.toFixed(4)} TON via Tonstakers…`));
    const hash         = fakeTx();
    const tsTon        = deployAmount * 0.98;
    position = {
      ...position,
      staked:   position.staked + tsTon,
      totalTon: position.totalTon - deployAmount,
      pnl:      position.pnl + deployAmount * (tonstakerApy / 100 / 365),
    };
    logs.push(mkLog("tx",
      `[simulated] Staked ${deployAmount.toFixed(4)} TON → ${tsTon.toFixed(4)} tsTON (APY ${tonstakerApy.toFixed(2)}%)`,
      hash
    ));

  } else if (decision.action === "provide_lp" && deployAmount >= 0.1 && topPool) {
    const poolIdx = Math.min(decision.poolIndex ?? 0, topPools.length - 1);
    const pool    = topPools[poolIdx] ?? topPool;
    const half    = deployAmount / 2;

    logs.push(mkLog("action", `Swapping ${half.toFixed(4)} TON → ${pool.token1} (slippage ≤ 1%)…`));
    logs.push(mkLog("tx", `[simulated] Swap ${half.toFixed(4)} TON → ${pool.token1}`, fakeTx()));

    logs.push(mkLog("action", `Adding liquidity to ${pool.token0}/${pool.token1}…`));
    const lpHash   = fakeTx();
    const usdValue = deployAmount * 3.5;
    const share    = ((usdValue / (pool.tvlUsd + usdValue)) * 100).toFixed(6);

    const existing = pools.find((p: any) => p.address === pool.address);
    if (existing) {
      pools = pools.map((p: any) => p.address === pool.address
        ? { ...p, tonDeployed: p.tonDeployed + deployAmount, usdValue: p.usdValue + usdValue }
        : p
      );
    } else {
      pools = [...pools, {
        address: pool.address, token0: pool.token0, token1: pool.token1,
        apy: pool.apy, tvlUsd: pool.tvlUsd,
        tonDeployed: deployAmount, usdValue, share,
        enteredAt: Date.now(), txHash: lpHash, simulated: true,
      }];
    }

    position = {
      ...position,
      lpValue:  position.lpValue + usdValue,
      totalTon: position.totalTon - deployAmount,
      pnl:      position.pnl + deployAmount * (pool.apy / 100 / 365),
    };
    logs.push(mkLog("tx",
      `[simulated] LP opened: ${pool.token0}/${pool.token1} | Share: ${share}% | APY: ${pool.apy.toFixed(2)}%`,
      lpHash
    ));

  } else {
    logs.push(mkLog("info", `Holding. ${decision.reasoning ?? "No action taken."}`));
  }

  return NextResponse.json({ logs, position, pools, tonstakerApy, bestPoolApy: topPool?.apy ?? 0 });
}
