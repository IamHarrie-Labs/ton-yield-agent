import { NextRequest, NextResponse } from "next/server";
import { getTonClient } from "@/lib/agenticWallet";
import { Address } from "@ton/ton";

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get("address") ?? "";
  if (!address) return NextResponse.json({ balance: 0 });

  try {
    const client = getTonClient();
    const parsed = Address.parse(address);
    const nano   = await client.getBalance(parsed);
    return NextResponse.json({ balance: Number(nano) / 1e9 });
  } catch {
    return NextResponse.json({ balance: 0 });
  }
}
