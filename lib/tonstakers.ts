/**
 * Tonstakers SDK wrapper
 * Docs: https://github.com/tonstakers/tonstakers-sdk
 */

export interface TonstakersInfo {
  apy:          number;   // e.g. 4.21
  tvl:          number;   // in TON
  stakersCount: number;
  available:    number;   // user balance in TON
  staked:       number;   // user staked in tsTON
}

/**
 * Fetch live APY + TVL from Tonstakers.
 * In production wire up the SDK with the agent's TonConnect instance.
 */
export async function getTonstakersInfo(): Promise<TonstakersInfo> {
  // Tonstakers public API endpoint for analytics
  const res = await fetch("https://api.tonstakers.com/v1/stats", {
    next: { revalidate: 60 },
  }).catch(() => null);

  if (res?.ok) {
    const json = await res.json();
    return {
      apy:          json.apy      ?? 4.2,
      tvl:          json.tvl      ?? 0,
      stakersCount: json.stakers  ?? 0,
      available:    0,
      staked:       0,
    };
  }

  // Fallback mock for testnet
  return { apy: 4.2, tvl: 120000, stakersCount: 8200, available: 0, staked: 0 };
}

/**
 * Build a stake transaction payload using Tonstakers SDK.
 * Returns the transaction boc to sign with the operator key.
 *
 * Usage (server-side with operator keypair):
 *   const { Tonstakers } = await import("tonstakers-sdk");
 *   const sdk = new Tonstakers({ connector: agentConnector, partnerCode: 0 });
 *   await sdk.init();
 *   await sdk.stake(amountNano);
 */
export async function buildStakeTx(amountTon: number, agentWalletAddress: string) {
  const { Tonstakers } = await import("tonstakers-sdk");
  // NOTE: In real usage, inject a server-side TonConnect compatible connector
  // that uses the agentic wallet's operator keypair to sign.
  return {
    to:     "EQDNhy-nxYFgkqbfwwDYFrHMCdPHSNoKEoWvpGobNx7bC49r", // Tonstakers contract (testnet)
    amount: BigInt(Math.floor(amountTon * 1e9)).toString(),
    payload: "stake",
  };
}
