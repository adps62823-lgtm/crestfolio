import { query } from "../db";
import { isoNow } from "./shared";
import { computeSeriesMetrics, scoreTrend, scoreConviction } from "../analytics";
import type { PriceBar } from "@/lib/types";

function toYahooSymbol(symbol: string, assetClass: string) {
  if (assetClass === "commodity") {
    if (symbol === "GOLD") return "GC=F";
    if (symbol === "SILVER") return "SI=F";
    if (symbol === "CRUDEOIL") return "CL=F";
    if (symbol === "NATGAS") return "NG=F";
    if (symbol === "COPPER") return "HG=F";
  }
  if (assetClass === "index") {
    if (symbol === "NIFTY50") return "^NSEI";
    if (symbol === "SENSEX") return "^BSESN";
    if (symbol === "BANKNIFTY") return "^NSEBANK";
    if (symbol === "INDIAVIX") return "^INDIAVIX";
  }
  if (assetClass === "macro") {
    if (symbol === "USDINR") return "USDINR=X";
  }

  // Equities & ETFs on NSE
  if (!symbol.includes(".") && !symbol.includes("=")) {
    return `${symbol.toUpperCase()}.NS`;
  }
  return symbol;
}

export async function fetchLiveYahooAsset(
  symbol: string,
  assetClass = "equity",
  name?: string,
  sector?: string,
) {
  const yahooSymbol = toYahooSymbol(symbol, assetClass);
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol)}?interval=1d&range=1y`;

  try {
    const res = await fetch(url, {
      headers: {
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
      },
    });

    if (!res.ok) return null;

    const data = await res.json();
    const result = data?.chart?.result?.[0];
    if (!result) return null;

    const meta = result.meta;
    const timestamps: number[] = result.timestamp ?? [];
    const quote = result.indicators?.quote?.[0] ?? {};

    const lastPrice = meta.regularMarketPrice ?? meta.chartPreviousClose ?? 0;
    const prevClose = meta.chartPreviousClose ?? lastPrice;
    const priceChangePct = prevClose
      ? Number((((lastPrice - prevClose) / prevClose) * 100).toFixed(2))
      : 0;

    const slug = symbol.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const assetName = name || meta.shortName || meta.longName || symbol;
    const cleanSector = sector || meta.sector || "General Market";

    const bars: PriceBar[] = [];
    for (let i = 0; i < timestamps.length; i++) {
      const open = quote.open?.[i];
      const high = quote.high?.[i];
      const low = quote.low?.[i];
      const close = quote.close?.[i];
      const volume = quote.volume?.[i] ?? 0;

      if (open != null && high != null && low != null && close != null) {
        const dateStr = new Date(timestamps[i] * 1000).toISOString().slice(0, 10);
        bars.push({
          assetSlug: slug,
          barDate: dateStr,
          open: Number(open.toFixed(2)),
          high: Number(high.toFixed(2)),
          low: Number(low.toFixed(2)),
          close: Number(close.toFixed(2)),
          volume: Math.round(volume),
        });
      }
    }

    const metrics = computeSeriesMetrics(bars);
    const trendScore = scoreTrend(metrics);
    const convictionScore = scoreConviction({
      trend: trendScore,
      quality: 80,
      valuation: 70,
      sentiment: 65,
      risk: Math.round(metrics.volatility),
    });

    // Insert or update asset in PostgreSQL
    await query(
      `
      INSERT INTO assets (
        slug, symbol, name, asset_class, sub_class, exchange, sector, benchmark,
        description, currency, last_price, price_change_pct, market_cap_cr, pe_ratio,
        nav, return_1w, return_1m, return_3m, return_6m, return_1y, max_drawdown,
        volatility, rsi14, above_sma_50, above_sma_200, trend_score, quality_score,
        valuation_score, sentiment_score, conviction_score, risk_score, updated_at,
        data_source, tags
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8,
        $9, $10, $11, $12, $13, $14,
        $15, $16, $17, $18, $19, $20, $21,
        $22, $23, $24, $25, $26, $27,
        $28, $29, $30, $31, $32,
        $33, $34
      )
      ON CONFLICT(slug) DO UPDATE SET
        last_price = EXCLUDED.last_price,
        price_change_pct = EXCLUDED.price_change_pct,
        return_1w = EXCLUDED.return_1w,
        return_1m = EXCLUDED.return_1m,
        return_3m = EXCLUDED.return_3m,
        return_6m = EXCLUDED.return_6m,
        return_1y = EXCLUDED.return_1y,
        max_drawdown = EXCLUDED.max_drawdown,
        volatility = EXCLUDED.volatility,
        rsi14 = EXCLUDED.rsi14,
        above_sma_50 = EXCLUDED.above_sma_50,
        above_sma_200 = EXCLUDED.above_sma_200,
        trend_score = EXCLUDED.trend_score,
        conviction_score = EXCLUDED.conviction_score,
        updated_at = EXCLUDED.updated_at
    `,
      [
        slug,
        symbol.toUpperCase(),
        assetName,
        assetClass,
        assetClass === "equity" ? "Equity" : assetClass === "commodity" ? "Commodity" : "Macro",
        assetClass === "equity" ? "NSE" : assetClass === "commodity" ? "MCX" : "RBI",
        cleanSector,
        "Nifty 50 TRI",
        `Live market asset tracked via Yahoo Finance real-time feed (${yahooSymbol}).`,
        meta.currency || "INR",
        metrics.lastPrice || lastPrice,
        priceChangePct,
        meta.marketCap ? Math.round(meta.marketCap / 10000000) : null,
        meta.trailingPE ? Number(meta.trailingPE.toFixed(2)) : null,
        assetClass === "mutual_fund" ? metrics.lastPrice : null,
        metrics.return1W,
        metrics.return1M,
        metrics.return3M,
        metrics.return6M,
        metrics.return1Y,
        metrics.maxDrawdown,
        metrics.volatility,
        metrics.rsi14,
        Boolean(metrics.aboveSma50),
        Boolean(metrics.aboveSma200),
        trendScore,
        80,
        70,
        65,
        convictionScore,
        Math.round(metrics.volatility),
        isoNow(),
        "Live Yahoo Finance",
        JSON.stringify(["live", assetClass, cleanSector.toLowerCase()]),
      ],
    );

    // Save historical bars in bulk
    if (bars.length > 0) {
      const BATCH_SIZE = 100;
      for (let i = 0; i < bars.length; i += BATCH_SIZE) {
        const chunk = bars.slice(i, i + BATCH_SIZE);
        const valueStrings: string[] = [];
        const params: any[] = [];
        chunk.forEach((bar, idx) => {
          const offset = idx * 7;
          valueStrings.push(
            `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7})`,
          );
          params.push(
            bar.assetSlug,
            bar.barDate,
            bar.open,
            bar.high,
            bar.low,
            bar.close,
            bar.volume,
          );
        });

        await query(
          `
          INSERT INTO price_bars (asset_slug, bar_date, open, high, low, close, volume)
          VALUES ${valueStrings.join(", ")}
          ON CONFLICT(asset_slug, bar_date) DO UPDATE SET
            open = EXCLUDED.open,
            high = EXCLUDED.high,
            low = EXCLUDED.low,
            close = EXCLUDED.close,
            volume = EXCLUDED.volume
        `,
          params,
        );
      }
    }

    return {
      slug,
      symbol: symbol.toUpperCase(),
      name: assetName,
      lastPrice: metrics.lastPrice || lastPrice,
      barsCount: bars.length,
    };
  } catch (err) {
    console.error(`Failed to fetch Yahoo asset for ${symbol}:`, err);
    return null;
  }
}
