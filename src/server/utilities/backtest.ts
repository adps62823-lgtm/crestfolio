// Utility 1 — Portfolio Stress Testing & SIP Backtester Engine
import { getDb } from "../db";
import { maxDrawdown, trailingVolatility, cagr } from "../analytics";
import type { BacktestRequest, BacktestResult, BasketAllocation, ShockEvent, ShockTestResult } from "@/lib/types";

function getNavSeries(assetId: string, start: string, end: string): { date: string; close: number }[] {
  const db = getDb();
  return db.prepare(`SELECT date, close FROM bars WHERE asset_id = ? AND date BETWEEN ? AND ? ORDER BY date ASC`).all(assetId, start, end) as { date: string; close: number }[];
}

export function runBacktest(req: BacktestRequest): BacktestResult {
  const series = new Map(req.basket.map((b) => [b.assetId, getNavSeries(b.assetId, req.startDate, req.endDate)]));
  for (const [assetId, s] of series) {
    if (s.length === 0) throw new Error(`No price history for ${assetId} in range ${req.startDate}..${req.endDate}. Run a sync first.`);
  }
  const allDates = Array.from(new Set(Array.from(series.values()).flatMap((s) => s.map((p) => p.date)))).sort();

  const navAt = (assetId: string, date: string): number | null => {
    const s = series.get(assetId)!;
    let found: number | null = null;
    for (let i = s.length - 1; i >= 0; i--) { if (s[i]!.date <= date) { found = s[i]!.close; break; } }
    return found;
  };

  const units: Record<string, number> = {};
  for (const b of req.basket) units[b.assetId] = 0;
  let invested = 0;
  const navSeries: { date: string; value: number }[] = [];

  if (req.mode === "lumpsum") {
    const amount = req.lumpsumAmount ?? 100000;
    const firstDate = allDates[0]!;
    for (const b of req.basket) {
      const nav = navAt(b.assetId, firstDate);
      if (nav) units[b.assetId] = (amount * (b.weightPct / 100)) / nav;
    }
    invested = amount;
  }

  let lastMonth = "";
  for (const date of allDates) {
    const month = date.slice(0, 7);
    if (req.mode === "sip" && month !== lastMonth) {
      lastMonth = month;
      const amount = req.monthlyAmount ?? 10000;
      for (const b of req.basket) {
        const nav = navAt(b.assetId, date);
        if (nav) units[b.assetId] = (units[b.assetId] ?? 0) + (amount * (b.weightPct / 100)) / nav;
      }
      invested += amount;
    }
    let value = 0;
    for (const b of req.basket) {
      const nav = navAt(b.assetId, date);
      if (nav) value += units[b.assetId]! * nav;
    }
    navSeries.push({ date, value: Math.round(value * 100) / 100 });
  }

  const finalValue = navSeries[navSeries.length - 1]?.value ?? invested;
  const years = (new Date(req.endDate).getTime() - new Date(req.startDate).getTime()) / (365 * 24 * 3600 * 1000);
  const cagrResult = req.mode === "lumpsum" ? cagr(invested, finalValue, years) : approximateXirr(navSeries, req.monthlyAmount ?? 10000);

  const values = navSeries.map((p) => p.value);
  const dailyReturns: number[] = [];
  for (let i = 1; i < values.length; i++) if (values[i - 1]! > 0) dailyReturns.push((values[i]! - values[i - 1]!) / values[i - 1]!);
  const meanRet = dailyReturns.reduce((a, b) => a + b, 0) / (dailyReturns.length || 1);
  const stdRet = Math.sqrt(dailyReturns.reduce((a, b) => a + (b - meanRet) ** 2, 0) / (dailyReturns.length - 1 || 1));
  const downside = dailyReturns.filter((r) => r < 0);
  const downsideStd = Math.sqrt(downside.reduce((a, b) => a + b ** 2, 0) / (downside.length || 1));
  const riskFreeDailyRate = 0.06 / 252;

  const sharpe = stdRet > 0 ? ((meanRet - riskFreeDailyRate) / stdRet) * Math.sqrt(252) : 0;
  const sortino = downsideStd > 0 ? ((meanRet - riskFreeDailyRate) / downsideStd) * Math.sqrt(252) : 0;

  return {
    mode: req.mode,
    investedAmount: Math.round(invested),
    finalValue: Math.round(finalValue),
    cagr: cagrResult !== null ? Math.round(cagrResult * 100) / 100 : 0,
    xirr: req.mode === "sip" ? Math.round((cagrResult ?? 0) * 100) / 100 : null,
    sharpeRatio: Math.round(sharpe * 100) / 100,
    sortinoRatio: Math.round(sortino * 100) / 100,
    maxDrawdown: Math.round(maxDrawdown(values) * 100) / 100,
    volatilityAnnualized: Math.round((trailingVolatility(values, Math.min(21, values.length - 1)) ?? 0) * 100) / 100,
    navSeries,
  };
}

function approximateXirr(navSeries: { date: string; value: number }[], monthlyAmount: number): number | null {
  if (navSeries.length < 2) return null;
  const cashflows: { date: Date; amount: number }[] = [];
  let lastMonth = "";
  for (const p of navSeries) {
    const month = p.date.slice(0, 7);
    if (month !== lastMonth) { lastMonth = month; cashflows.push({ date: new Date(p.date), amount: -monthlyAmount }); }
  }
  cashflows.push({ date: new Date(navSeries[navSeries.length - 1]!.date), amount: navSeries[navSeries.length - 1]!.value });
  const t0 = cashflows[0]!.date.getTime();
  const years = (cf: { date: Date }) => (cf.date.getTime() - t0) / (365 * 24 * 3600 * 1000);
  const npv = (rate: number) => cashflows.reduce((sum, cf) => sum + cf.amount / Math.pow(1 + rate, years(cf)), 0);
  let rate = 0.12;
  for (let i = 0; i < 50; i++) {
    const h = 1e-6;
    const f = npv(rate);
    const fPrime = (npv(rate + h) - f) / h;
    if (Math.abs(fPrime) < 1e-9) break;
    const next = rate - f / fPrime;
    if (!Number.isFinite(next)) break;
    if (Math.abs(next - rate) < 1e-6) { rate = next; break; }
    rate = next;
  }
  return rate * 100;
}

export const SHOCK_EVENTS: ShockEvent[] = [
  { id: "covid-2020", name: "COVID-19 Crash", startDate: "2020-02-20", endDate: "2020-03-23", description: "Nifty 50 fell roughly 38% peak-to-trough as global markets priced in the pandemic shutdown." },
  { id: "election-2024", name: "June 2024 Election Volatility", startDate: "2024-06-03", endDate: "2024-06-04", description: "Nifty fell sharply intraday on exit-poll-implied vs actual Lok Sabha result mismatch before recovering over following sessions." },
  { id: "rate-hike-2022", name: "2022 Global Rate Hike Regime", startDate: "2022-01-01", endDate: "2022-06-30", description: "Aggressive Fed/RBI rate hikes and FII outflows pressured Indian equities and bonds through H1 2022." },
];

export function runShockTest(basket: BasketAllocation[], shock: ShockEvent): ShockTestResult {
  const legResults = basket.map((b) => {
    const series = getNavSeries(b.assetId, shock.startDate, shock.endDate);
    if (series.length < 2) return { assetId: b.assetId, drawdownPct: 0 };
    const start = series[0]!.close, end = series[series.length - 1]!.close;
    return { assetId: b.assetId, drawdownPct: ((end - start) / start) * 100 };
  });
  const weightedDrawdown = basket.reduce((sum, b, i) => sum + (legResults[i]!.drawdownPct * b.weightPct) / 100, 0);
  const sorted = [...legResults].sort((a, b) => a.drawdownPct - b.drawdownPct);
  return {
    shock,
    basketDrawdownPct: Math.round(weightedDrawdown * 100) / 100,
    recoveryDays: null,
    worstAsset: sorted[0]!,
    bestAsset: sorted[sorted.length - 1]!,
  };
}
