import { NextRequest, NextResponse } from "next/server";
import { computeForensicScore } from "@/server/utilities/forensics";

export async function GET(req: NextRequest) {
  const assetId = req.nextUrl.searchParams.get("assetId");
  if (!assetId) return NextResponse.json({ error: "assetId query param required" }, { status: 400 });
  try {
    return NextResponse.json(computeForensicScore(assetId));
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Forensic scan failed" }, { status: 400 });
  }
}
