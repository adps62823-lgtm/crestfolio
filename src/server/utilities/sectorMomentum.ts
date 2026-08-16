// Utility 2 — Sector Rotation & Market Money-Flow Treemap
import { getDb } from "../db";
import type { SectorMomentum } from "@/lib/types";

// NSE sectoral index constituents are grouped by category tag we assign
// during equity ingestion (extend assets.category for equities via your
// own classification pass — e.g. from NSE's official sector master list —
// since NSE bhavcopy alone doesn't carry a sector field).
const TRACKED_SECTORS = ["IT", "Bank", "Auto", "FMCG", "Pharma", "Capital Goods", "Realty", "Defense", "Energy"];

export function computeSectorMomentum(): SectorMomentum[] {
  const db = getDb();
  const results: SectorMomentum[] = [];
  for (const sector of TRACKED_SECTORS) {
    const rows = db.prepare(`
      SELECT r.r1w as r1w, r.r1m as r1m, r.r3m as r3m
      FROM assets a
      JOIN rolling_returns r ON r.asset_id = a.id AND r.as_of = (SELECT MAX(as_of) FROM rolling_returns r2 WHERE r2.asset_id = a.id)
      WHERE a.asset_class = 'EQUITY' AND a.category = ?
    `).all(sector) as { r1w: number | null; r1m: number | null; r3m: number | null }[];

    if (rows.length === 0) {
      results.push({ sector, r1w: 0, r1m: 0, r3m: 0, flowDirection: "neutral" });
      continue;
    }
    const avg = (key: "r1w" | "r1m" | "r3m") => {
      const vals = rows.map((r) => r[key]).filter((v): v is number => v !== null);
      return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    };
    const r1w = avg("r1w"), r1m = avg("r1m"), r3m = avg("r3m");
    const flowDirection: SectorMomentum["flowDirection"] = r1w > 0.5 ? "inflow" : r1w < -0.5 ? "outflow" : "neutral";
    results.push({ sector, r1w: Math.round(r1w * 100) / 100, r1m: Math.round(r1m * 100) / 100, r3m: Math.round(r3m * 100) / 100, flowDirection });
  }
  return results.sort((a, b) => (b.r1m ?? 0) - (a.r1m ?? 0));
}
