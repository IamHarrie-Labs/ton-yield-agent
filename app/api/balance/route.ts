import { NextRequest, NextResponse } from "next/server";
import { TonClient }  from "@ton/ton";
import { Address }    from "@ton/core";

/**
 * GET /api/balance?address=<raw|friendly>&network=mainnet|testnet|auto
 *
 * Uses @ton/ton TonClient (v2 JSON-RPC) — most reliable, handles all
 * address formats including raw 0:hexhex and friendly UQ/EQ/kQ/0Q.
 * Falls back to TonCenter v2 REST, then TonAPI.
 */

const TONCENTER_JSONRPC_MAINNET = "https://toncenter.com/api/v2/jsonRPC";
const TONCENTER_JSONRPC_TESTNET = "https://testnet.toncenter.com/api/v2/jsonRPC";

async function balanceViaTonClient(raw: string, testnet: boolean): Promise<number | null> {
  try {
    const client  = new TonClient({ endpoint: testnet ? TONCENTER_JSONRPC_TESTNET : TONCENTER_JSONRPC_MAINNET });
    const addr    = Address.parse(raw);
    const balance = await client.getBalance(addr);     // returns bigint in nanoTON
    return Number(balance) / 1e9;
  } catch {
    return null;
  }
}

async function balanceViaTonCenterRest(raw: string, testnet: boolean): Promise<number | null> {
  const base = testnet
    ? "https://testnet.toncenter.com/api/v2"
    : "https://toncenter.com/api/v2";
  try {
    const res  = await fetch(`${base}/getAddressInformation?address=${encodeURIComponent(raw)}`, {
      headers: { Accept: "application/json" },
      cache:   "no-store",
    });
    if (!res.ok) return null;
    const json = await res.json();
    if (!json.ok) return null;
    const ton  = Number(json.result?.balance ?? 0) / 1e9;
    return isNaN(ton) ? null : ton;
  } catch {
    return null;
  }
}

async function balanceViaTonApi(raw: string, testnet: boolean): Promise<number | null> {
  const base = testnet ? "https://testnet.tonapi.io/v2" : "https://tonapi.io/v2";
  try {
    const res  = await fetch(`${base}/accounts/${encodeURIComponent(raw)}`, {
      headers: { Accept: "application/json" },
      cache:   "no-store",
    });
    if (!res.ok) return null;
    const json = await res.json();
    const ton  = Number(json.balance ?? 0) / 1e9;
    return isNaN(ton) ? null : ton;
  } catch {
    return null;
  }
}

async function resolveBalance(raw: string, testnet: boolean): Promise<number | null> {
  // 1. TonClient (JSON-RPC) — most reliable, handles all address formats
  const v1 = await balanceViaTonClient(raw, testnet);
  if (v1 !== null) return v1;

  // 2. TonCenter v2 REST
  const v2 = await balanceViaTonCenterRest(raw, testnet);
  if (v2 !== null) return v2;

  // 3. TonAPI
  return balanceViaTonApi(raw, testnet);
}

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get("address") ?? "";
  const network = req.nextUrl.searchParams.get("network") ?? "auto";
  if (!address) return NextResponse.json({ balance: null, error: "no address" });

  let balance: number | null = null;
  let resolvedNetwork         = network;

  if (network === "testnet") {
    balance = await resolveBalance(address, true);
    resolvedNetwork = "testnet";
  } else if (network === "mainnet") {
    balance = await resolveBalance(address, false);
    resolvedNetwork = "mainnet";
  } else {
    // auto: try testnet first (hint from chain=-3 most common for demos),
    // then mainnet — return whichever gives a non-zero result
    const testnetBal = await resolveBalance(address, true);
    if (testnetBal !== null && testnetBal > 0) {
      balance = testnetBal;
      resolvedNetwork = "testnet";
    } else {
      const mainnetBal = await resolveBalance(address, false);
      balance = mainnetBal ?? testnetBal; // prefer mainnet if non-null, otherwise testnet (even if 0)
      resolvedNetwork = mainnetBal !== null ? "mainnet" : "testnet";
    }
  }

  return NextResponse.json({ balance, network: resolvedNetwork });
}
