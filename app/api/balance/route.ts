import { NextRequest, NextResponse } from "next/server";

// TonAPI testnet — free, no key needed, handles all address formats
const TONAPI = "https://testnet.tonapi.io/v2/accounts";

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get("address") ?? "";
  if (!address) return NextResponse.json({ balance: null });

  try {
    const res = await fetch(`${TONAPI}/${encodeURIComponent(address)}`, {
      headers: { "Accept": "application/json" },
      cache: "no-store",
    });

    if (!res.ok) {
      console.error(`TonAPI balance error: ${res.status} for ${address}`);
      return NextResponse.json({ balance: null });
    }

    const json = await res.json();
    // TonAPI returns balance in nanoTON as a number
    const nanoton = json.balance ?? 0;
    const ton = Number(nanoton) / 1e9;
    return NextResponse.json({ balance: ton });
  } catch (err) {
    console.error("Balance fetch failed:", err);
    return NextResponse.json({ balance: null });
  }
}
