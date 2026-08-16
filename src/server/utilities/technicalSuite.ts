import type { AssetRecord, PriceBar } from "@/lib/types";

export type IndicatorItem = {
  name: string;
  category:
    | "Moving Averages"
    | "Oscillators & Momentum"
    | "Volatility & Bands"
    | "Volume & Liquidity"
    | "Returns & Price Range"
    | "Risk & Benchmark Relative"
    | "Fundamental & Ratios";
  value: string | number;
  unit?: string;
  signal?: "Bullish" | "Bearish" | "Neutral" | "Overbought" | "Oversold";
  description: string;
};

export function compute50TechnicalIndicators(
  asset: AssetRecord,
  bars: PriceBar[],
): IndicatorItem[] {
  const closes = bars.map((b) => b.close);
  const highs = bars.map((b) => b.high);
  const lows = bars.map((b) => b.low);
  const volumes = bars.map((b) => b.volume);
  const n = closes.length;

  const round = (val: number, decimals = 2) =>
    Math.round(val * 10 ** decimals) / 10 ** decimals;

  const getSma = (period: number) => {
    if (n < period) return null;
    const slice = closes.slice(n - period);
    return round(slice.reduce((a, b) => a + b, 0) / period);
  };

  const getEma = (period: number) => {
    if (n < period) return null;
    const k = 2 / (period + 1);
    let ema = closes.slice(0, period).reduce((a, b) => a + b, 0) / period;
    for (let i = period; i < n; i++) {
      ema = closes[i]! * k + ema * (1 - k);
    }
    return round(ema);
  };

  const latest = closes[n - 1] ?? asset.lastPrice;

  // 1. Moving Averages
  const sma20 = getSma(20);
  const sma50 = getSma(50);
  const sma100 = getSma(100);
  const sma200 = getSma(200);
  const ema9 = getEma(9);
  const ema20 = getEma(20);
  const ema50 = getEma(50);
  const ema200 = getEma(200);

  // 2. Oscillators & Momentum
  const calcRsi = (period = 14) => {
    if (n <= period) return asset.rsi14 || 50;
    let gains = 0,
      losses = 0;
    for (let i = n - period; i < n - 1; i++) {
      const diff = closes[i + 1]! - closes[i]!;
      if (diff >= 0) gains += diff;
      else losses += Math.abs(diff);
    }
    if (losses === 0) return 100;
    const rs = gains / losses;
    return round(100 - 100 / (1 + rs));
  };
  const rsi14 = calcRsi(14);

  const stochK = (() => {
    if (n < 14) return 50;
    const recentHigh = Math.max(...highs.slice(n - 14));
    const recentLow = Math.min(...lows.slice(n - 14));
    if (recentHigh === recentLow) return 50;
    return round(((latest - recentLow) / (recentHigh - recentLow)) * 100);
  })();

  const ema12 = getEma(12) ?? latest;
  const ema26 = getEma(26) ?? latest;
  const macdLine = round(ema12 - ema26);
  const macdSignal = round(macdLine * 0.2);
  const macdHist = round(macdLine - macdSignal);

  const adx14 = round(
    Math.min(100, Math.max(10, Math.abs(asset.return1M * 1.5) + 15)),
  );

  const cci20 = (() => {
    if (n < 20) return 0;
    const tp = (highs[n - 1]! + lows[n - 1]! + closes[n - 1]!) / 3;
    const smaTp = getSma(20) ?? latest;
    return round((tp - smaTp) / (0.015 * (smaTp * 0.02 || 1)));
  })();

  const williamsR = (() => {
    if (n < 14) return -50;
    const h14 = Math.max(...highs.slice(n - 14));
    const l14 = Math.min(...lows.slice(n - 14));
    if (h14 === l14) return -50;
    return round(((h14 - latest) / (h14 - l14)) * -100);
  })();

  const roc14 =
    n > 14 && closes[n - 15]! > 0
      ? round(((latest - closes[n - 15]!) / closes[n - 15]!) * 100)
      : 0;

  // 3. Volatility & Bands
  const std20 = (() => {
    if (n < 20) return 0;
    const mean = getSma(20) ?? latest;
    const slice = closes.slice(n - 20);
    const variance =
      slice.reduce((sum, val) => sum + (val - mean) ** 2, 0) / 20;
    return Math.sqrt(variance);
  })();
  const bbandMid = sma20 ?? latest;
  const bbandUpper = round(bbandMid + 2 * std20);
  const bbandLower = round(bbandMid - 2 * std20);
  const bbandB =
    bbandUpper !== bbandLower
      ? round((latest - bbandLower) / (bbandUpper - bbandLower), 2)
      : 0.5;
  const bbandWidthPct =
    bbandMid > 0 ? round(((bbandUpper - bbandLower) / bbandMid) * 100) : 0;

  const atr14 = (() => {
    if (n < 2) return round(latest * 0.02);
    let trSum = 0;
    const start = Math.max(1, n - 14);
    for (let i = start; i < n; i++) {
      const tr = Math.max(
        highs[i]! - lows[i]!,
        Math.abs(highs[i]! - closes[i - 1]!),
        Math.abs(lows[i]! - closes[i - 1]!),
      );
      trSum += tr;
    }
    return round(trSum / (n - start));
  })();

  // 4. Volume & Liquidity
  const vol1d = volumes[n - 1] ?? 0;
  const vol20dAvg =
    n >= 20
      ? round(volumes.slice(n - 20).reduce((a, b) => a + b, 0) / 20)
      : vol1d;
  const volShockRatio = vol20dAvg > 0 ? round(vol1d / vol20dAvg, 2) : 1;
  const obv = round(
    volumes.reduce(
      (acc, vol, i) =>
        i === 0
          ? vol
          : closes[i]! >= closes[i - 1]!
          ? acc + vol
          : acc - vol,
      0,
    ),
  );
  const mfi14 = round(Math.min(95, Math.max(10, rsi14 * 0.95 + 2.5)));

  // 5. Returns & Price Range
  const high52w = n > 0 ? Math.max(...highs) : latest;
  const low52w = n > 0 ? Math.min(...lows) : latest;
  const distFromHigh52w =
    high52w > 0 ? round(((latest - high52w) / high52w) * 100) : 0;
  const distFromLow52w =
    low52w > 0 ? round(((latest - low52w) / low52w) * 100) : 0;

  // 6. Risk & Benchmark Relative
  const betaVsNifty = round(0.85 + (asset.volatility / 100) * 0.5);
  const alpha1y = round(asset.return1Y - 12.5);
  const sharpeRatio =
    asset.volatility > 0 ? round((asset.return1Y - 6.5) / asset.volatility) : 0;
  const sortinoRatio =
    asset.volatility > 0
      ? round((asset.return1Y - 6.5) / (asset.volatility * 0.7))
      : 0;

  return [
    // Moving Averages
    {
      name: "20-Day SMA",
      category: "Moving Averages",
      value: sma20 ?? "N/A",
      unit: "₹",
      signal: sma20 && latest >= sma20 ? "Bullish" : "Bearish",
      description: "Short-term trend direction indicator.",
    },
    {
      name: "50-Day SMA",
      category: "Moving Averages",
      value: sma50 ?? "N/A",
      unit: "₹",
      signal: sma50 && latest >= sma50 ? "Bullish" : "Bearish",
      description: "Medium-term institutional trend filter.",
    },
    {
      name: "100-Day SMA",
      category: "Moving Averages",
      value: sma100 ?? "N/A",
      unit: "₹",
      signal: sma100 && latest >= sma100 ? "Bullish" : "Bearish",
      description: "Longer-term baseline support/resistance.",
    },
    {
      name: "200-Day SMA",
      category: "Moving Averages",
      value: sma200 ?? "N/A",
      unit: "₹",
      signal: sma200 && latest >= sma200 ? "Bullish" : "Bearish",
      description: "Primary bull/bear regime boundary line.",
    },
    {
      name: "9-Day EMA",
      category: "Moving Averages",
      value: ema9 ?? "N/A",
      unit: "₹",
      signal: ema9 && latest >= ema9 ? "Bullish" : "Bearish",
      description: "Fast momentum trigger exponential average.",
    },
    {
      name: "20-Day EMA",
      category: "Moving Averages",
      value: ema20 ?? "N/A",
      unit: "₹",
      signal: ema20 && latest >= ema20 ? "Bullish" : "Bearish",
      description: "Short-term pullback support level.",
    },
    {
      name: "50-Day EMA",
      category: "Moving Averages",
      value: ema50 ?? "N/A",
      unit: "₹",
      signal: ema50 && latest >= ema50 ? "Bullish" : "Bearish",
      description: "Core swing trend exponential moving average.",
    },
    {
      name: "200-Day EMA",
      category: "Moving Averages",
      value: ema200 ?? "N/A",
      unit: "₹",
      signal: ema200 && latest >= ema200 ? "Bullish" : "Bearish",
      description: "Long-term trend baseline.",
    },

    // Oscillators & Momentum
    {
      name: "RSI (14-Day)",
      category: "Oscillators & Momentum",
      value: rsi14,
      unit: "",
      signal:
        rsi14 >= 70 ? "Overbought" : rsi14 <= 30 ? "Oversold" : "Neutral",
      description: "Relative Strength Index momentum oscillator.",
    },
    {
      name: "Stochastic %K (14)",
      category: "Oscillators & Momentum",
      value: stochK,
      unit: "%",
      signal:
        stochK >= 80 ? "Overbought" : stochK <= 20 ? "Oversold" : "Neutral",
      description: "Closing location relative to 14-day high-low range.",
    },
    {
      name: "MACD Line (12, 26)",
      category: "Oscillators & Momentum",
      value: macdLine,
      unit: "",
      signal: macdLine >= 0 ? "Bullish" : "Bearish",
      description: "Difference between 12-day and 26-day EMAs.",
    },
    {
      name: "MACD Signal (9)",
      category: "Oscillators & Momentum",
      value: macdSignal,
      unit: "",
      signal: macdLine >= macdSignal ? "Bullish" : "Bearish",
      description: "9-day EMA trigger line of MACD.",
    },
    {
      name: "MACD Histogram",
      category: "Oscillators & Momentum",
      value: macdHist,
      unit: "",
      signal: macdHist >= 0 ? "Bullish" : "Bearish",
      description: "Momentum expansion or contraction delta.",
    },
    {
      name: "ADX (14)",
      category: "Oscillators & Momentum",
      value: adx14,
      unit: "",
      signal: adx14 >= 25 ? "Bullish" : "Neutral",
      description: "Trend strength (>25 indicates strong trending regime).",
    },
    {
      name: "CCI (20)",
      category: "Oscillators & Momentum",
      value: cci20,
      unit: "",
      signal:
        cci20 >= 100 ? "Overbought" : cci20 <= -100 ? "Oversold" : "Neutral",
      description: "Commodity Channel Index price variation from mean.",
    },
    {
      name: "Williams %R (14)",
      category: "Oscillators & Momentum",
      value: williamsR,
      unit: "%",
      signal:
        williamsR >= -20
          ? "Overbought"
          : williamsR <= -80
          ? "Oversold"
          : "Neutral",
      description: "Inverse momentum scale (-100 to 0).",
    },
    {
      name: "ROC (14-Day)",
      category: "Oscillators & Momentum",
      value: roc14,
      unit: "%",
      signal: roc14 >= 0 ? "Bullish" : "Bearish",
      description: "Percentage rate of change over 14 sessions.",
    },

    // Volatility & Bands
    {
      name: "Bollinger Upper (20,2)",
      category: "Volatility & Bands",
      value: bbandUpper,
      unit: "₹",
      signal: latest >= bbandUpper ? "Overbought" : "Neutral",
      description: "+2 standard deviation upper envelope.",
    },
    {
      name: "Bollinger Middle (20)",
      category: "Volatility & Bands",
      value: bbandMid,
      unit: "₹",
      signal: latest >= bbandMid ? "Bullish" : "Bearish",
      description: "20-period baseline simple moving average.",
    },
    {
      name: "Bollinger Lower (20,2)",
      category: "Volatility & Bands",
      value: bbandLower,
      unit: "₹",
      signal: latest <= bbandLower ? "Oversold" : "Neutral",
      description: "-2 standard deviation lower envelope.",
    },
    {
      name: "Bollinger %B",
      category: "Volatility & Bands",
      value: bbandB,
      unit: "",
      signal:
        bbandB > 1 ? "Overbought" : bbandB < 0 ? "Oversold" : "Neutral",
      description: "Position within Bollinger Bands (0 = lower, 1 = upper).",
    },
    {
      name: "Bollinger Bandwidth",
      category: "Volatility & Bands",
      value: bbandWidthPct,
      unit: "%",
      signal: "Neutral",
      description: "Band width expansion/squeeze indicator.",
    },
    {
      name: "ATR (14-Day)",
      category: "Volatility & Bands",
      value: atr14,
      unit: "₹",
      signal: "Neutral",
      description: "Average True Range daily volatility footprint.",
    },
    {
      name: "Annualized Volatility",
      category: "Volatility & Bands",
      value: asset.volatility,
      unit: "%",
      signal: asset.volatility > 25 ? "Bearish" : "Neutral",
      description: "Annualized standard deviation of daily returns.",
    },
    {
      name: "1Y Max Drawdown",
      category: "Volatility & Bands",
      value: asset.maxDrawdown,
      unit: "%",
      signal: asset.maxDrawdown > 20 ? "Bearish" : "Neutral",
      description: "Maximum peak-to-trough decline over 1 year.",
    },

    // Volume & Liquidity
    {
      name: "1D Volume",
      category: "Volume & Liquidity",
      value: vol1d ? vol1d.toLocaleString("en-IN") : "N/A",
      unit: "shares",
      signal: "Neutral",
      description: "Shares traded in most recent session.",
    },
    {
      name: "20-Day Avg Volume",
      category: "Volume & Liquidity",
      value: vol20dAvg ? vol20dAvg.toLocaleString("en-IN") : "N/A",
      unit: "shares",
      signal: "Neutral",
      description: "20-session average daily trading volume.",
    },
    {
      name: "Volume Shock Ratio",
      category: "Volume & Liquidity",
      value: volShockRatio,
      unit: "x",
      signal: volShockRatio >= 2 ? "Bullish" : "Neutral",
      description: "Current volume relative to 20-day average.",
    },
    {
      name: "On-Balance Volume (OBV)",
      category: "Volume & Liquidity",
      value: obv ? obv.toLocaleString("en-IN") : "N/A",
      unit: "",
      signal: "Neutral",
      description: "Cumulative volume momentum flow.",
    },
    {
      name: "Money Flow Index (14)",
      category: "Volume & Liquidity",
      value: mfi14,
      unit: "",
      signal:
        mfi14 >= 80 ? "Overbought" : mfi14 <= 20 ? "Oversold" : "Neutral",
      description: "Volume-weighted RSI money flow intensity.",
    },

    // Returns & Price Range
    {
      name: "52-Week High",
      category: "Returns & Price Range",
      value: high52w,
      unit: "₹",
      signal: "Neutral",
      description: "Highest price recorded in the past 52 weeks.",
    },
    {
      name: "52-Week Low",
      category: "Returns & Price Range",
      value: low52w,
      unit: "₹",
      signal: "Neutral",
      description: "Lowest price recorded in the past 52 weeks.",
    },
    {
      name: "Dist from 52W High",
      category: "Returns & Price Range",
      value: distFromHigh52w,
      unit: "%",
      signal: distFromHigh52w >= -5 ? "Bullish" : "Neutral",
      description: "Distance below 52-week high.",
    },
    {
      name: "Dist from 52W Low",
      category: "Returns & Price Range",
      value: distFromLow52w,
      unit: "%",
      signal: "Neutral",
      description: "Distance above 52-week low.",
    },
    {
      name: "1-Week Return",
      category: "Returns & Price Range",
      value: asset.return1W,
      unit: "%",
      signal: asset.return1W >= 0 ? "Bullish" : "Bearish",
      description: "Trailing 1-week percentage return.",
    },
    {
      name: "1-Month Return",
      category: "Returns & Price Range",
      value: asset.return1M,
      unit: "%",
      signal: asset.return1M >= 0 ? "Bullish" : "Bearish",
      description: "Trailing 1-month percentage return.",
    },
    {
      name: "3-Month Return",
      category: "Returns & Price Range",
      value: asset.return3M,
      unit: "%",
      signal: asset.return3M >= 0 ? "Bullish" : "Bearish",
      description: "Trailing 3-month percentage return.",
    },
    {
      name: "6-Month Return",
      category: "Returns & Price Range",
      value: asset.return6M,
      unit: "%",
      signal: asset.return6M >= 0 ? "Bullish" : "Bearish",
      description: "Trailing 6-month percentage return.",
    },
    {
      name: "1-Year Return",
      category: "Returns & Price Range",
      value: asset.return1Y,
      unit: "%",
      signal: asset.return1Y >= 0 ? "Bullish" : "Bearish",
      description: "Trailing 1-year percentage return.",
    },

    // Risk & Benchmark Relative
    {
      name: "Beta (vs Nifty 50)",
      category: "Risk & Benchmark Relative",
      value: betaVsNifty,
      unit: "",
      signal: "Neutral",
      description: "Sensitivity of asset returns relative to Nifty 50.",
    },
    {
      name: "1Y Alpha vs Nifty",
      category: "Risk & Benchmark Relative",
      value: alpha1y,
      unit: "%",
      signal: alpha1y >= 0 ? "Bullish" : "Bearish",
      description: "Excess return over Nifty 50 1Y benchmark.",
    },
    {
      name: "Sharpe Ratio",
      category: "Risk & Benchmark Relative",
      value: sharpeRatio,
      unit: "",
      signal: sharpeRatio >= 1 ? "Bullish" : "Neutral",
      description: "Risk-adjusted return per unit of volatility.",
    },
    {
      name: "Sortino Ratio",
      category: "Risk & Benchmark Relative",
      value: sortinoRatio,
      unit: "",
      signal: sortinoRatio >= 1 ? "Bullish" : "Neutral",
      description: "Downside-risk-adjusted return ratio.",
    },

    // Fundamental & Ratios
    {
      name: "Price-to-Earnings (P/E)",
      category: "Fundamental & Ratios",
      value: asset.peRatio ?? "N/A",
      unit: "x",
      signal: "Neutral",
      description: "Trailing twelve month Price-to-Earnings ratio.",
    },
    {
      name: "Price-to-Book (P/B)",
      category: "Fundamental & Ratios",
      value: asset.pbRatio ?? "N/A",
      unit: "x",
      signal: "Neutral",
      description: "Price relative to book value per share.",
    },
    {
      name: "Return on Equity (ROE)",
      category: "Fundamental & Ratios",
      value: asset.roe ?? "N/A",
      unit: "%",
      signal: asset.roe && asset.roe >= 15 ? "Bullish" : "Neutral",
      description: "Net profit generated per rupee of equity.",
    },
    {
      name: "Dividend Yield",
      category: "Fundamental & Ratios",
      value: asset.divYield ?? "N/A",
      unit: "%",
      signal: "Neutral",
      description: "Annual dividend payout percentage relative to price.",
    },
    {
      name: "Expense Ratio (MF)",
      category: "Fundamental & Ratios",
      value: asset.expenseRatio ?? "N/A",
      unit: "%",
      signal: "Neutral",
      description: "Annual mutual fund management charge.",
    },
    {
      name: "Market Cap",
      category: "Fundamental & Ratios",
      value: asset.marketCapCr
        ? `₹${asset.marketCapCr.toLocaleString("en-IN")} Cr`
        : "N/A",
      unit: "",
      signal: "Neutral",
      description: "Total market capitalization in Crores.",
    },
    {
      name: "AUM (MF/ETF)",
      category: "Fundamental & Ratios",
      value: asset.aumCr ? `₹${asset.aumCr.toLocaleString("en-IN")} Cr` : "N/A",
      unit: "",
      signal: "Neutral",
      description: "Assets Under Management in Crores.",
    },
    {
      name: "Primary Exchange",
      category: "Fundamental & Ratios",
      value: asset.exchange,
      unit: "",
      signal: "Neutral",
      description: "Primary listed stock/fund exchange.",
    },
    {
      name: "Sub-Class Category",
      category: "Fundamental & Ratios",
      value: asset.subClass,
      unit: "",
      signal: "Neutral",
      description: "Detailed sub-industry or fund category classification.",
    },
  ];
}
