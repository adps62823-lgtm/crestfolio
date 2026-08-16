import { NextRequest, NextResponse } from "next/server";
import { analyzeTaxHarvest } from "@/server/utilities/taxHarvest";
import type { TaxLot } from "@/lib/types";

export async function POST(req: NextRequest) {
  const body = (await req.json()) as { lots: TaxLot[]; realizedLtcgAlreadyThisFy?: number };
  if (!body.lots?.length) return NextResponse.json({ error: "lots array required" }, { status: 400 });
  const suggestions = analyzeTaxHarvest(body.lots, body.realizedLtcgAlreadyThisFy ?? 0);
  return NextResponse.json({ suggestions });
}
