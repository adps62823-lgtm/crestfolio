import { NextRequest, NextResponse } from "next/server";
import { runBacktest } from "@/server/utilities/backtest";
import type { BacktestRequest } from "@/lib/types";

export async function POST(req: NextRequest) {
  const body = (await req.json()) as BacktestRequest;
  if (!body.basket?.length) return NextResponse.json({ error: "basket is required" }, { status: 400 });
  const totalWeight = body.basket.reduce((s, b) => s + b.weightPct, 0);
  if (Math.abs(totalWeight - 100) > 0.5) return NextResponse.json({ error: `Basket weights must sum to 100 (got ${totalWeight})` }, { status: 400 });
  try {
    const result = runBacktest(body);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Backtest failed" }, { status: 400 });
  }
}
