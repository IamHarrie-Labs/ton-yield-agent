import { NextRequest, NextResponse } from "next/server";

const TONCENTER = "https://testnet.toncenter.com/api/v2";

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get("address") ?? "";
  if (!address) return NextResponse.json({ balance: null });

  try {
    const apiKey = process.env.TONCENTER_API_KEY ?? "";
    const url    = `${TONCENTER}/getAddressBalance?address=${encodeURIComponent(address)}${apiKey ? `&api_key=${apiKey}` : ""}`;
    const res    = await fetch(url, { next: { revalidate: 10 } });

    if (!res.ok) return NextResponse.json({ balance: null });

    const json = await res.json();
    // Response: { "ok": true, "result": "1234567890" }  (nanoTON string)
    if (!json.ok || json.result == null) return NextResponse.json({ balance: null });

    const ton = Number(json.result) / 1e9;
    return NextResponse.json({ balance: ton });
  } catch {
    return NextResponse.json({ balance: null });
  }
}
