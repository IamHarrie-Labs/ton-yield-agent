import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/balance?address=0:hexhex[&network=mainnet|testnet|auto]
 *
 * Fetches wallet balance server-side (no browser CORS constraints).
 * network=auto  → tries mainnet first, then testnet, returns whichever is non-zero
 * network=mainnet → mainnet only
 * network=testnet → testnet only
 *
 * Provider chain: TonCenter v3  →  TonAPI
 */

async function tonCenterBalance(address: string, testnet: boolean): Promise<number | null> {
  const base = testnet
    ? "https://testnet.toncenter.com/api/v3"
    : "https://toncenter.com/api/v3";
  try {
    const res = await fetch(`${base}/addressInformation?address=${encodeURIComponent(address)}`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = await res.json();
    const raw  = json.balance ?? json.result?.balance ?? null;
    if (raw === null || raw === undefined) return null;
    const ton  = Number(raw) / 1e9;
    return isNaN(ton) ? null : ton;
  } catch {
    return null;
  }
}

async function tonApiBalance(address: string, testnet: boolean): Promise<number | null> {
  const base = testnet ? "https://testnet.tonapi.io/v2" : "https://tonapi.io/v2";
  try {
    const res = await fetch(`${base}/accounts/${encodeURIComponent(address)}`, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = await res.json();
    // TonAPI returns balance in nanoTON as a number
    const ton  = Number(json.balance ?? 0) / 1e9;
    return isNaN(ton) ? null : ton;
  } catch {
    return null;
  }
}

async function getBalance(address: string, testnet: boolean): Promise<number | null> {
  // Try TonCenter first, then TonAPI
  const v1 = await tonCenterBalance(address, testnet);
  if (v1 !== null) return v1;
  return tonApiBalance(address, testnet);
}

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get("address") ?? "";
  const network = req.nextUrl.searchParams.get("network") ?? "auto";
  if (!address) return NextResponse.json({ balance: null, debug: "no address" });

  let balance: number | null = null;
  let usedNetwork = network;

  if (network === "testnet") {
    balance = await getBalance(address, true);
  } else if (network === "mainnet") {
    balance = await getBalance(address, false);
  } else {
    // auto: try mainnet first, fall back to testnet
    balance = await getBalance(address, false);
    if (balance === null || balance === 0) {
      const testnetBal = await getBalance(address, true);
      if (testnetBal !== null && testnetBal > 0) {
        balance = testnetBal;
        usedNetwork = "testnet";
      } else {
        usedNetwork = "mainnet";
      }
    } else {
      usedNetwork = "mainnet";
    }
  }

  return NextResponse.json({ balance, network: usedNetwork });
}
