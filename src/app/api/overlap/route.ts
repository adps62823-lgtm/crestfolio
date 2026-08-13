import { NextResponse } from "next/server";
import { computeSchemeOverlap } from "@/server/overlap";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const slugA = url.searchParams.get("slugA") ?? "parag-parikh-flexi-cap";
  const slugB = url.searchParams.get("slugB") ?? "hdfc-top-100";

  const result = await computeSchemeOverlap(slugA, slugB);
  if (!result) {
    return NextResponse.json({ error: "Invalid scheme slugs" }, { status: 400 });
  }

  return NextResponse.json(result);
}
