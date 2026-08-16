// Utility 3 — Financial Red-Flag & Accounting Anomaly Scanner
// Altman Z-Score (manufacturing formula) + Beneish M-Score, both standard
// published formulas, computed from fundamentals stored per-asset per-period.
import { getDb } from "../db";
import type { ForensicScore, ForensicFlag } from "@/lib/types";

interface FundRow {
  as_of: string; total_assets_cr: number | null; total_liabilities_cr: number | null;
  current_assets_cr: number | null; current_liabilities_cr: number | null;
  retained_earnings_cr: number | null; ebit_cr: number | null; revenue_cr: number | null;
  receivables_cr: number | null; working_capital_days: number | null;
  market_cap_cr: number | null; promoter_pledge_pct: number | null;
}

export function computeForensicScore(assetId: string): ForensicScore {
  const db = getDb();
  const rows = db.prepare(`SELECT * FROM fundamentals WHERE asset_id = ? ORDER BY as_of DESC LIMIT 2`).all(assetId) as FundRow[];
  if (rows.length === 0) {
    throw new Error(`No fundamentals data for ${assetId}. Requires an annual-report ingestion pass (NSE XBRL filings) beyond the daily bhavcopy sync.`);
  }
  const cur = rows[0]!;
  const prev = rows[1] ?? null;

  // Altman Z-Score (manufacturing): 1.2*A + 1.4*B + 3.3*C + 0.6*D + 1.0*E
  //  A = Working Capital / Total Assets, B = Retained Earnings / Total Assets
  //  C = EBIT / Total Assets, D = Market Cap / Total Liabilities, E = Revenue / Total Assets
  let altmanZScore: number | null = null;
  if (cur.total_assets_cr && cur.total_liabilities_cr) {
    const workingCapital = (cur.current_assets_cr ?? 0) - (cur.current_liabilities_cr ?? 0);
    const A = workingCapital / cur.total_assets_cr;
    const B = (cur.retained_earnings_cr ?? 0) / cur.total_assets_cr;
    const C = (cur.ebit_cr ?? 0) / cur.total_assets_cr;
    const D = (cur.market_cap_cr ?? 0) / cur.total_liabilities_cr;
    const E = (cur.revenue_cr ?? 0) / cur.total_assets_cr;
    altmanZScore = Math.round((1.2 * A + 1.4 * B + 3.3 * C + 0.6 * D + 1.0 * E) * 100) / 100;
  }
  const altmanZone: ForensicScore["altmanZone"] = altmanZScore === null ? null
    : altmanZScore > 2.99 ? "safe" : altmanZScore > 1.81 ? "grey" : "distress";

  // Beneish M-Score requires 8 sub-indices (DSRI, GMI, AQI, SGI, DEPI, SGAI,
  // LVGI, TATA) computed from two consecutive years of full financials.
  // We compute the subset derivable from the fields we store (revenue,
  // receivables, EBIT) and flag as partial when prior-year data is missing.
  let beneishMScore: number | null = null;
  let revenueGrowthYoyPct: number | null = null;
  let receivableDaysYoyChangePct: number | null = null;
  let workingCapitalDaysYoyChangePct: number | null = null;

  if (prev && prev.revenue_cr && cur.revenue_cr) {
    revenueGrowthYoyPct = Math.round(((cur.revenue_cr - prev.revenue_cr) / prev.revenue_cr) * 10000) / 100;
  }
  if (prev?.receivables_cr && cur.receivables_cr && prev.revenue_cr && cur.revenue_cr) {
    const dsriCur = (cur.receivables_cr / cur.revenue_cr);
    const dsriPrev = (prev.receivables_cr / prev.revenue_cr);
    receivableDaysYoyChangePct = Math.round(((dsriCur - dsriPrev) / dsriPrev) * 10000) / 100;
    // Simplified DSRI-driven M-Score proxy — full 8-variable model needs
    // depreciation, SG&A, and leverage series not yet in the schema.
    const dsri = dsriPrev !== 0 ? dsriCur / dsriPrev : 1;
    const sgi = prev.revenue_cr !== 0 ? cur.revenue_cr / prev.revenue_cr : 1;
    beneishMScore = Math.round((-4.84 + 0.92 * dsri + 0.528 * sgi) * 100) / 100;
  }
  if (prev?.working_capital_days && cur.working_capital_days) {
    workingCapitalDaysYoyChangePct = Math.round(((cur.working_capital_days - prev.working_capital_days) / prev.working_capital_days) * 10000) / 100;
  }

  const flags: ForensicFlag[] = [];
  if (altmanZone === "distress") flags.push({ severity: "red", message: `Altman Z-Score ${altmanZScore} is below 1.81 — statistically elevated bankruptcy risk zone.` });
  else if (altmanZone === "grey") flags.push({ severity: "amber", message: `Altman Z-Score ${altmanZScore} sits in the grey zone (1.81–2.99) — monitor leverage and profitability trend.` });
  else if (altmanZone === "safe") flags.push({ severity: "green", message: `Altman Z-Score ${altmanZScore} is above 2.99 — low near-term bankruptcy risk by this model.` });

  if (beneishMScore !== null && beneishMScore > -1.78) flags.push({ severity: "red", message: `Beneish M-Score proxy ${beneishMScore} exceeds the -1.78 threshold — earnings-manipulation risk flag (partial model, verify against full 8-variable version before acting).` });

  if (receivableDaysYoyChangePct !== null && revenueGrowthYoyPct !== null && receivableDaysYoyChangePct > 20 && revenueGrowthYoyPct < 10) {
    flags.push({ severity: "amber", message: `Receivable days rose ${receivableDaysYoyChangePct}% while revenue grew only ${revenueGrowthYoyPct}% — possible channel-stuffing or collection slowdown.` });
  }
  if (cur.promoter_pledge_pct !== null && cur.promoter_pledge_pct > 25) {
    flags.push({ severity: cur.promoter_pledge_pct > 50 ? "red" : "amber", message: `Promoter pledge at ${cur.promoter_pledge_pct}% of holding — elevated forced-selling risk on price weakness.` });
  }

  return {
    assetId, asOf: cur.as_of, altmanZScore, altmanZone, beneishMScore,
    beneishFlag: beneishMScore === null ? null : beneishMScore > -1.78 ? "likely_manipulator" : "unlikely",
    promoterPledgePct: cur.promoter_pledge_pct, workingCapitalDaysYoyChangePct, receivableDaysYoyChangePct,
    revenueGrowthYoyPct, flags,
  };
}
