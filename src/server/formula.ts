import type { AssetClass, AssetRecord } from "@/lib/types";
import { listAssets } from "./repository";

export async function executeFormulaScreen(formulaString: string, assetClass = "all") {
  const universe = await listAssets({ assetClass: assetClass as AssetClass | "all" });
  if (!formulaString.trim()) return universe;

  const normalized = formulaString.toLowerCase();

  return universe.filter((asset: AssetRecord) => {
    try {
      const pe = asset.peRatio ?? 999;
      const pb = asset.pbRatio ?? 999;
      const roe = asset.roe ?? 0;
      const divYield = asset.divYield ?? 0;
      const trend = asset.trendScore;
      const quality = asset.qualityScore;
      const valuation = asset.valuationScore;
      const conviction = asset.convictionScore;
      const risk = asset.riskScore;
      const return1m = asset.return1M;
      const return6m = asset.return6M;
      const return1y = asset.return1Y;
      const rsi = asset.rsi14;

      if (normalized.includes("pe <") || normalized.includes("pe_ratio <")) {
        const match = normalized.match(/pe(?:_ratio)?\s*<\s*(\d+(?:\.\d+)?)/);
        if (match && pe >= Number.parseFloat(match[1])) return false;
      }
      if (normalized.includes("roe >")) {
        const match = normalized.match(/roe\s*>\s*(\d+(?:\.\d+)?)/);
        if (match && roe <= Number.parseFloat(match[1])) return false;
      }
      if (normalized.includes("trend >") || normalized.includes("trend_score >")) {
        const match = normalized.match(/trend(?:_score)?\s*>\s*(\d+)/);
        if (match && trend <= Number.parseInt(match[1], 10)) return false;
      }
      if (normalized.includes("conviction >") || normalized.includes("conviction_score >")) {
        const match = normalized.match(/conviction(?:_score)?\s*>\s*(\d+)/);
        if (match && conviction <= Number.parseInt(match[1], 10)) return false;
      }
      if (normalized.includes("risk <") || normalized.includes("risk_score <")) {
        const match = normalized.match(/risk(?:_score)?\s*<\s*(\d+)/);
        if (match && risk >= Number.parseInt(match[1], 10)) return false;
      }
      if (normalized.includes("return_1m >") || normalized.includes("return1m >")) {
        const match = normalized.match(/return_?1m\s*>\s*(-?\d+(?:\.\d+)?)/);
        if (match && return1m <= Number.parseFloat(match[1])) return false;
      }
      if (normalized.includes("rsi >")) {
        const match = normalized.match(/rsi\s*>\s*(\d+)/);
        if (match && rsi <= Number.parseInt(match[1], 10)) return false;
      }
      if (normalized.includes("rsi <")) {
        const match = normalized.match(/rsi\s*<\s*(\d+)/);
        if (match && rsi >= Number.parseInt(match[1], 10)) return false;
      }

      return true;
    } catch {
      return true;
    }
  });
}
