import { NextRequest, NextResponse } from "next/server";

// TonCenter v3 testnet — accepts raw 0:hexhex addresses, no key needed for light usage
const TONCENTER_V3 = "https://testnet.toncenter.com/api/v3/addressInformation";

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get("address") ?? "";
  if (!address) return NextResponse.json({ balance: null });

  try {
    const url = `${TONCENTER_V3}?address=${encodeURIComponent(address)}`;
    const res = await fetch(url, {
      headers: { "Accept": "application/json" },
      cache: "no-store",
    });

    if (!res.ok) {
      console.error(`TonCenter balance error ${res.status} for ${address}`);
      return NextResponse.json({ balance: null });
    }

    const json = await res.json();
    // v3 returns balance as a string in nanoTON: { "balance": "1234567890", ... }
    const raw = json.balance ?? json.result?.balance ?? "0";
    const ton = Number(raw) / 1e9;
    return NextResponse.json({ balance: isNaN(ton) ? null : ton });
  } catch (err) {
    console.error("Balance fetch failed:", err);
    return NextResponse.json({ balance: null });
  }
}
