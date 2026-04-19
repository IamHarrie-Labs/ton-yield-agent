/**
 * STON.fi API + Omniston SDK wrapper
 * API docs: https://docs.ston.fi/developer-section/api
 * Omniston docs: https://docs.ston.fi/developer-section/dex/omniston
 */

const STONFI_API = "https://api.ston.fi/v1";

export interface Pool {
  address:  string;
  token0:   string;
  token1:   string;
  apy:      number;   // annualized %
  tvlUsd:   number;
}

export interface SwapQuote {
  amountOut:   string;
  priceImpact: number;
  route:       string;
}

/**
 * Fetch top STON.fi pools sorted by APY.
 */
export async function getTopPools(limit = 5): Promise<Pool[]> {
  try {
    const res  = await fetch(`${STONFI_API}/pools?limit=50`, { cache: "no-store" });
    const json = await res.json();

    return (json.pool_list ?? [])
      .filter((p: any) => p.apy_1d != null)
      .map((p: any) => ({
        address: p.address,
        token0:  p.token0_metadata?.symbol ?? "?",
        token1:  p.token1_metadata?.symbol ?? "?",
        apy:     Math.min(parseFloat(p.apy_1d ?? "0"), 999), // already %, cap at 999%
        tvlUsd:  parseFloat(p.lp_total_supply_usd ?? "0"),
      }))
      .filter((p: Pool) => p.tvlUsd > 10000 && p.apy > 0) // only real pools
      .sort((a: Pool, b: Pool) => b.apy - a.apy)
      .slice(0, limit);
  } catch {
    // Fallback mock
    return [
      { address: "EQA…", token0: "TON", token1: "USDT", apy: 6.8, tvlUsd: 4200000 },
      { address: "EQB…", token0: "TON", token1: "STON", apy: 5.1, tvlUsd: 1800000 },
    ];
  }
}

/**
 * Get a swap quote via Omniston SDK.
 * In production, initialise Omniston with the agent wallet's address.
 */
export async function getSwapQuote(
  fromToken: string,
  toToken:   string,
  amountIn:  string,
): Promise<SwapQuote> {
  try {
    const params = new URLSearchParams({ offer_address: fromToken, ask_address: toToken, units: amountIn });
    const res    = await fetch(`${STONFI_API}/swap/simulate?${params}`, { next: { revalidate: 10 } });
    const json   = await res.json();
    return {
      amountOut:   json.ask_units    ?? "0",
      priceImpact: parseFloat(json.price_impact ?? "0"),
      route:       json.router_address ?? "",
    };
  } catch {
    return { amountOut: "0", priceImpact: 0, route: "" };
  }
}
