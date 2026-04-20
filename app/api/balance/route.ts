import { NextRequest, NextResponse } from "next/server";

// TonCenter v3 — accepts raw 0:hexhex addresses, no key needed for light usage
// ?network=mainnet (default) | testnet
const TONCENTER_MAINNET = "https://toncenter.com/api/v3/addressInformation";
const TONCENTER_TESTNET = "https://testnet.toncenter.com/api/v3/addressInformation";
const TONAPI_MAINNET    = "https://tonapi.io/v2/accounts";
const TONAPI_TESTNET    = "https://testnet.tonapi.io/v2/accounts";

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get("address") ?? "";
  const network = req.nextUrl.searchParams.get("network") ?? "mainnet"; // mainnet | testnet
  if (!address) return NextResponse.json({ balance: null });

  const toncenterUrl = network === "testnet" ? TONCENTER_TESTNET : TONCENTER_MAINNET;
  const tonapiUrl    = network === "testnet" ? TONAPI_TESTNET    : TONAPI_MAINNET;

  // Try TonCenter first
  try {
    const res = await fetch(`${toncenterUrl}?address=${encodeURIComponent(address)}`, {
      headers: { "Accept": "application/json" },
      cache: "no-store",
    });
    if (res.ok) {
      const json = await res.json();
      const raw  = json.balance ?? json.result?.balance ?? "0";
      const ton  = Number(raw) / 1e9;
      if (!isNaN(ton)) return NextResponse.json({ balance: ton });
    }
  } catch { /* fall through */ }

  // Fallback: TonAPI
  try {
    const res2 = await fetch(`${tonapiUrl}/${encodeURIComponent(address)}`, {
      headers: { "Accept": "application/json" },
      cache: "no-store",
    });
    if (res2.ok) {
      const json2 = await res2.json();
      const ton2  = Number(json2.balance ?? 0) / 1e9;
      return NextResponse.json({ balance: isNaN(ton2) ? null : ton2 });
    }
  } catch { /* give up */ }

  console.error(`Balance fetch failed for ${address} on ${network}`);
  return NextResponse.json({ balance: null });
}
