import { NextRequest, NextResponse } from "next/server";
import { runShockTest, SHOCK_EVENTS } from "@/server/utilities/backtest";
import type { BasketAllocation } from "@/lib/types";

export async function GET() {
  return NextResponse.json({ shocks: SHOCK_EVENTS });
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as { basket: BasketAllocation[]; shockId: string };
  const shock = SHOCK_EVENTS.find((s) => s.id === body.shockId);
  if (!shock) return NextResponse.json({ error: "Unknown shock event id" }, { status: 400 });
  try {
    const result = runShockTest(body.basket, shock);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Shock test failed" }, { status: 400 });
  }
}
