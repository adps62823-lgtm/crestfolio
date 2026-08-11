import type { PriceBar } from "@/lib/types";

export function round(value: number, digits = 2) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

export function pctChange(current: number, previous: number) {
  if (!Number.isFinite(current) || !Number.isFinite(previous) || previous === 0) {
    return 0;
  }
  return round(((current - previous) / previous) * 100, 2);
}

export function movingAverage(values: number[], period: number) {
  if (values.length < period) return null;
  const slice = values.slice(values.length - period);
  return round(slice.reduce((sum, value) => sum + value, 0) / period, 2);
}

export function rsi(values: number[], period = 14) {
  if (values.length <= period) return 50;
  let gains = 0;
  let losses = 0;
  for (let i = values.length - period; i < values.length - 1; i += 1) {
    const delta = values[i + 1] - values[i];
    if (delta >= 0) gains += delta;
    else losses += Math.abs(delta);
  }
  if (losses === 0) return 100;
  const rs = gains / losses;
  return round(100 - 100 / (1 + rs), 2);
}

export function maxDrawdown(values: number[]) {
  let peak = values[0] ?? 0;
  let maxDd = 0;
  for (const value of values) {
    if (value > peak) peak = value;
    const dd = peak === 0 ? 0 : ((value - peak) / peak) * 100;
    if (dd < maxDd) maxDd = dd;
  }
  return round(Math.abs(maxDd), 2);
}

export function annualizedVolatility(values: number[]) {
  if (values.length < 3) return 0;
  const returns: number[] = [];
  for (let i = 1; i < values.length; i += 1) {
    returns.push((values[i] - values[i - 1]) / values[i - 1]);
  }
  const mean = returns.reduce((sum, value) => sum + value, 0) / returns.length;
  const variance =
    returns.reduce((sum, value) => sum + (value - mean) ** 2, 0) / returns.length;
  return round(Math.sqrt(variance) * Math.sqrt(252) * 100, 2);
}

export function computeSeriesMetrics(bars: PriceBar[]) {
  const closes = bars.map((bar) => bar.close);
  if (closes.length < 3) {
    return {
      lastPrice: closes.at(-1) ?? 0,
      priceChangePct: 0,
      return1W: 0,
      return1M: 0,
      return3M: 0,
      return6M: 0,
      return1Y: 0,
      maxDrawdown: 0,
      volatility: 0,
      rsi14: 50,
      aboveSma50: false,
      aboveSma200: false,
    };
  }

  const latest = closes.at(-1) ?? 0;
  const prev = closes.at(-2) ?? latest;
  const calcReturn = (period: number) => {
    const idx = Math.max(0, closes.length - 1 - period);
    const base = closes[idx];
    return base ? round(((latest - base) / base) * 100, 2) : 0;
  };
  const sma50 = movingAverage(closes, 50);
  const sma200 = movingAverage(closes, 200);
  const oneWeek = calcReturn(5);
  const oneMonth = calcReturn(21);
  const threeMonth = calcReturn(63);
  const sixMonth = calcReturn(126);
  const oneYear = calcReturn(252);

  return {
    lastPrice: round(latest, 2),
    priceChangePct: pctChange(latest, prev),
    return1W: oneWeek,
    return1M: oneMonth,
    return3M: threeMonth,
    return6M: sixMonth,
    return1Y: oneYear,
    maxDrawdown: maxDrawdown(closes),
    volatility: annualizedVolatility(closes),
    rsi14: rsi(closes, 14),
    aboveSma50: sma50 ? latest >= sma50 : false,
    aboveSma200: sma200 ? latest >= sma200 : false,
  };
}

export function scoreTrend(metrics: ReturnType<typeof computeSeriesMetrics>) {
  const trend = 50 + metrics.return1M * 0.8 + metrics.return3M * 0.35 + metrics.return6M * 0.2;
  const penalty = metrics.maxDrawdown * 0.4 + metrics.volatility * 0.08;
  return Math.max(0, Math.min(100, Math.round(trend - penalty)));
}

export function scoreConviction(args: {
  trend: number;
  quality: number;
  valuation: number;
  sentiment: number;
  risk: number;
}) {
  const base =
    args.trend * 0.28 +
    args.quality * 0.22 +
    args.valuation * 0.16 +
    args.sentiment * 0.18 +
    (100 - args.risk) * 0.16;
  return Math.max(0, Math.min(100, Math.round(base)));
}
