/**
 * POST /api/agent  → deploy agentic wallet, return address
 * (Cycle logic moved to /api/agent/cycle — fully stateless, client-driven)
 */
import { NextRequest, NextResponse } from "next/server";
import { deployAgenticWallet } from "@/lib/agenticWallet";

export async function POST(req: NextRequest) {
  try {
    const { ownerAddress } = await req.json();
    const result = await deployAgenticWallet(ownerAddress ?? "");
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
