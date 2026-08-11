import { NextResponse } from "next/server";
import { listAssets } from "@/server/repository";
import type { ScreenerFilters } from "@/lib/types";

function numberParam(value: string | null) {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const filters: ScreenerFilters = {
    query: url.searchParams.get("query") ?? undefined,
    assetClass: (url.searchParams.get("assetClass") as ScreenerFilters["assetClass"]) ?? "all",
    sector: url.searchParams.get("sector") ?? "all",
    minTrendScore: numberParam(url.searchParams.get("minTrendScore")),
    minQualityScore: numberParam(url.searchParams.get("minQualityScore")),
    minSentimentScore: numberParam(url.searchParams.get("minSentimentScore")),
    minConvictionScore: numberParam(url.searchParams.get("minConvictionScore")),
    maxRiskScore: numberParam(url.searchParams.get("maxRiskScore")),
    minAumCr: numberParam(url.searchParams.get("minAumCr")),
    minMarketCapCr: numberParam(url.searchParams.get("minMarketCapCr")),
    minReturn1M: numberParam(url.searchParams.get("minReturn1M")),
    minReturn6M: numberParam(url.searchParams.get("minReturn6M")),
    minReturn1Y: numberParam(url.searchParams.get("minReturn1Y")),
  };

  const assets = await listAssets(filters);
  return NextResponse.json({ assets });
}
