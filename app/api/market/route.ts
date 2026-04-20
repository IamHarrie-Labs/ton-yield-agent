/**
 * GET /api/market
 * Returns live Tonstakers APY + top STON.fi pools.
 * Called directly by the dashboard on mount so APY shows before agent starts.
 */
import { NextResponse } from "next/server";

const TONSTAKERS_API = "https://api.tonstakers.com/v1/stats";
const STONFI_API     = "https://api.ston.fi/v1";

async function fetchTonstakerApy(): Promise<number> {
  try {
    const res  = await fetch(TONSTAKERS_API, { cache: "no-store" });
    if (!res.ok) return 4.2;
    const json = await res.json();
    const v = json.apy ?? json.apr ?? json.stakingApy ?? json.data?.apy;
    return typeof v === "number" ? v : parseFloat(String(v ?? "4.2")) || 4.2;
  } catch {
    return 4.2;
  }
}

interface PoolInfo { address: string; token0: string; token1: string; apy: number; }

async function fetchTopPools(): Promise<PoolInfo[]> {
  try {
    const res  = await fetch(`${STONFI_API}/pools?limit=100`, { cache: "no-store" });
    if (!res.ok) throw new Error(`STON.fi ${res.status}`);
    const json = await res.json();
    const list: any[] = json.pool_list ?? json.pools ?? json.data ?? [];

    return list
      .map((p: any) => ({
        address: String(p.address ?? p.pool_address ?? ""),
        token0:  String(p.token0_metadata?.symbol ?? p.token0_symbol ?? p.token0 ?? "TON"),
        token1:  String(p.token1_metadata?.symbol ?? p.token1_symbol ?? p.token1 ?? "USDT"),
        apy:     Math.min(parseFloat(p.apy_1d ?? p.apy_7d ?? p.apy ?? p.lp_fee_1d ?? "0"), 500),
        tvlUsd:  parseFloat(p.lp_total_supply_usd ?? p.tvl_usd ?? p.tvl ?? "0"),
      }))
      .filter(p => p.apy > 0 && p.tvlUsd > 5_000 && p.address)
      .sort((a, b) => b.apy - a.apy)
      .slice(0, 5)
      .map(({ tvlUsd: _tvl, ...rest }): PoolInfo => rest);
  } catch {
    return [
      { address: "EQA-fallback", token0: "TON", token1: "USDT", apy: 6.8 },
      { address: "EQB-fallback", token0: "TON", token1: "STON", apy: 5.1 },
    ];
  }
}

export async function GET() {
  const [tonstakerApy, pools] = await Promise.all([fetchTonstakerApy(), fetchTopPools()]);
  return NextResponse.json({ tonstakerApy, bestPoolApy: pools[0]?.apy ?? 0, pools });
}
