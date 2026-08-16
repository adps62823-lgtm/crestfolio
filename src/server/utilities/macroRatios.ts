// Utility 4 — Multi-Asset Ratio Radar (Macro Inter-Market Indicators)
import { getDb } from "../db";
import type { MacroRatio } from "@/lib/types";

interface RatioDef { name: MacroRatio["name"]; numeratorId: string; denominatorId: string; interpretHigh: string; interpretLow: string }

const RATIOS: RatioDef[] = [
  { name: "gold_nifty", numeratorId: "CMDX-GOLD", denominatorId: "IDX-NIFTY50", interpretHigh: "Gold outperforming equities — risk-off hedging demand rising.", interpretLow: "Equities outperforming gold — risk-on regime." },
  { name: "nifty_usdinr", numeratorId: "IDX-NIFTY50", denominatorId: "MACRO-USDINR", interpretHigh: "Nifty strong in USD terms — supportive of FII inflows.", interpretLow: "Nifty weak in USD terms — FII outflow risk / rupee drag on returns." },
  { name: "crude_nifty", numeratorId: "CMDX-CRUDEOIL", denominatorId: "IDX-NIFTY50", interpretHigh: "Crude rising faster than Nifty — margin compression risk for oil-importing corporates.", interpretLow: "Crude soft relative to Nifty — tailwind for margins and current account." },
];

function latestSeries(assetId: string, days: number): { date: string; close: number }[] {
  const db = getDb();
  return (db.prepare(`SELECT date, close FROM bars WHERE asset_id = ? ORDER BY date DESC LIMIT ?`).all(assetId, days) as { date: string; close: number }[]).reverse();
}

export function computeMacroRatios(): MacroRatio[] {
  const results: MacroRatio[] = [];
  for (const def of RATIOS) {
    const num = latestSeries(def.numeratorId, 252);
    const den = latestSeries(def.denominatorId, 252);
    if (num.length === 0 || den.length === 0) continue;
    const denMap = new Map(den.map((d) => [d.date, d.close]));
    const ratioSeries: number[] = [];
    let latestDate = "";
    let latestValue = 0;
    for (const n of num) {
      const d = denMap.get(n.date);
      if (!d) continue;
      const ratio = n.close / d;
      ratioSeries.push(ratio);
      latestDate = n.date;
      latestValue = ratio;
    }
    if (ratioSeries.length === 0) continue;
    const mean = ratioSeries.reduce((a, b) => a + b, 0) / ratioSeries.length;
    const std = Math.sqrt(ratioSeries.reduce((a, b) => a + (b - mean) ** 2, 0) / ratioSeries.length);
    const z = std > 0 ? (latestValue - mean) / std : 0;
    results.push({
      name: def.name, date: latestDate, value: Math.round(latestValue * 10000) / 10000,
      zScore1y: Math.round(z * 100) / 100,
      interpretation: z > 1 ? def.interpretHigh : z < -1 ? def.interpretLow : "Within normal 1-year range — no strong regime signal.",
    });
  }
  return results;
}
