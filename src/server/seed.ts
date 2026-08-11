import { randomUUID } from "node:crypto";
import { getDb, resetDatabaseForSeed } from "@/server/db";
import {
  assetSeeds,
  baseNewsTemplates,
  eventTemplateMap,
  screenerPresetSeeds,
  settingsSeeds,
  sourceSeeds,
  watchlistSlugs,
} from "@/server/seed-data";
import {
  annualizedVolatility,
  computeSeriesMetrics,
  maxDrawdown,
  round,
  scoreConviction,
  scoreTrend,
} from "@/server/analytics";
import type { AssetSeed } from "@/server/seed-data";

const BUSINESS_DAYS = 300;

function hashString(input: string) {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mulberry32(seed: number) {
  return function random() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function businessDaysBack(count: number) {
  const days: Date[] = [];
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  while (days.length < count) {
    const day = cursor.getDay();
    if (day !== 0 && day !== 6) {
      days.push(new Date(cursor));
    }
    cursor.setDate(cursor.getDate() - 1);
  }
  return days.reverse();
}

function generateSeries(seed: AssetSeed) {
  const rand = mulberry32(hashString(seed.slug));
  const days = businessDaysBack(BUSINESS_DAYS);
  const bars = [];
  let price = seed.basePrice;
  let momentum = seed.drift;

  for (let i = 0; i < days.length; i += 1) {
    const shock = (rand() - 0.5) * seed.volatility;
    const regimePulse = Math.sin(i / 18) * seed.volatility * 0.18;
    momentum = momentum * 0.985 + seed.drift * 0.015;
    const change = momentum + shock + regimePulse;
    const open = price;
    const close = Math.max(0.5, price * (1 + change));
    const high = Math.max(open, close) * (1 + rand() * seed.volatility * 0.4);
    const low = Math.min(open, close) * (1 - rand() * seed.volatility * 0.4);
    const volume = Math.round(
      (seed.assetClass === "commodity" ? 120000 : 1000000) *
        (1 + rand() * 2.4) *
        (1 + Math.abs(change) * 10),
    );

    bars.push({
      assetSlug: seed.slug,
      barDate: days[i].toISOString().slice(0, 10),
      open: round(open, 2),
      high: round(high, 2),
      low: round(low, 2),
      close: round(close, 2),
      volume,
    });

    price = close;
  }

  return bars;
}

function makeNews(seed: AssetSeed, bars: ReturnType<typeof generateSeries>) {
  const recentBars = bars.slice(-3);
  const templates = baseNewsTemplates[seed.assetClass];
  return recentBars.map((bar, index) => {
    const headline =
      index === 0
        ? `${seed.name}: ${seed.classNote}`
        : `${seed.symbol} update: ${templates[index % templates.length]}`;

    return {
      id: randomUUID(),
      assetSlug: seed.slug,
      headline,
      summary: `${seed.description} ${templates[index % templates.length]}`,
      source:
        seed.assetClass === "mutual_fund"
          ? "AMFI public NAV"
          : seed.assetClass === "commodity"
            ? "MCX public market pages"
            : seed.assetClass === "macro"
              ? "RBI / MoSPI"
              : "NSE corporate / market reports",
      url: "https://crestfolio.local/research",
      publishedAt: new Date(`${bar.barDate}T17:45:00+05:30`).toISOString(),
      sentiment: round(0.2 + (seed.sentimentScore - 50) / 100 + index * 0.05, 2),
      relevance: round(0.6 + seed.convictionScore / 250, 2),
      impact:
        seed.assetClass === "macro"
          ? "macro regime"
          : seed.riskScore > 50
            ? "watch closely"
            : "thesis support",
      tags: JSON.stringify(seed.tags.slice(0, 3)),
    };
  });
}

function makeEvents(seed: AssetSeed, bars: ReturnType<typeof generateSeries>) {
  const templates = eventTemplateMap[seed.assetClass];
  return templates.map((template, index) => {
    const bar = bars[bars.length - (index + 8)] ?? bars.at(-1)!;
    return {
      id: randomUUID(),
      assetSlug: seed.slug,
      type: template.type,
      title: `${seed.symbol} - ${template.title}`,
      detail:
        seed.assetClass === "equity"
          ? "Event impact should be checked against relative strength, ownership changes, and peer moves."
          : seed.assetClass === "mutual_fund"
            ? "Review NAV persistence, style drift, and category-relative ranking."
            : "Assess how the move changes the current market regime narrative.",
      eventDate: new Date(`${bar.barDate}T09:15:00+05:30`).toISOString(),
      severity: template.severity,
      score: round(58 + seed.trendScore * 0.2 - seed.riskScore * 0.1 + index * 2, 2),
      source:
        seed.assetClass === "mutual_fund"
          ? "AMFI"
          : seed.assetClass === "commodity"
            ? "MCX"
            : seed.assetClass === "macro"
              ? "RBI / MoSPI"
              : "NSE",
    };
  });
}

function makeResearchNotes(seed: AssetSeed) {
  const notes = [
    {
      title: `${seed.name} - base thesis`,
      body: `${seed.description} This note captures the starting point for long-term research review.`,
      thesis: "Monitor quality, relative strength, and fresh catalysts.",
      status: "monitor" as const,
      tags: ["thesis", "monitor"],
    },
    {
      title: `${seed.name} - bear case`,
      body: "Watch for valuation compression, drawdown acceleration, and thesis fatigue.",
      thesis: "Invalidate if trend and quality break down together.",
      status: "idea" as const,
      tags: ["risk", "bear-case"],
    },
  ];

  return notes.map((note) => ({
    id: randomUUID(),
    title: note.title,
    assetSlug: seed.slug,
    body: note.body,
    thesis: note.thesis,
    status: note.status,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tags: JSON.stringify(note.tags),
  }));
}

export async function seedDatabase() {
  const db = getDb();
  const assetCount = db.prepare("SELECT COUNT(*) as count FROM assets").get() as {
    count: number;
  };
  if (assetCount.count > 0) {
    return { seeded: false, assets: assetCount.count };
  }

  resetDatabaseForSeed();

  const insertAsset = db.prepare(`
    INSERT INTO assets (
      slug, symbol, name, asset_class, sub_class, exchange, sector, benchmark,
      description, currency, last_price, price_change_pct, aum_cr, market_cap_cr,
      pe_ratio, pb_ratio, roe, div_yield, expense_ratio, nav, return_1w, return_1m,
      return_3m, return_6m, return_1y, max_drawdown, volatility, rsi14, above_sma_50,
      above_sma_200, latest_event, trend_score, quality_score, valuation_score,
      sentiment_score, conviction_score, risk_score,
      updated_at, data_source, tags
    ) VALUES (
      @slug, @symbol, @name, @asset_class, @sub_class, @exchange, @sector, @benchmark,
      @description, @currency, @last_price, @price_change_pct, @aum_cr, @market_cap_cr,
      @pe_ratio, @pb_ratio, @roe, @div_yield, @expense_ratio, @nav, @return_1w, @return_1m,
      @return_3m, @return_6m, @return_1y, @max_drawdown, @volatility, @rsi14, @above_sma_50,
      @above_sma_200, @latest_event, @trend_score, @quality_score, @valuation_score,
      @sentiment_score, @conviction_score, @risk_score,
      @updated_at, @data_source, @tags
    )
  `);
  const insertBar = db.prepare(`
    INSERT INTO price_bars (asset_slug, bar_date, open, high, low, close, volume)
    VALUES (@assetSlug, @barDate, @open, @high, @low, @close, @volume)
  `);
  const insertNews = db.prepare(`
    INSERT INTO news_items (
      id, asset_slug, headline, summary, source, url, published_at, sentiment,
      relevance, impact, tags
    ) VALUES (
      @id, @assetSlug, @headline, @summary, @source, @url, @publishedAt, @sentiment,
      @relevance, @impact, @tags
    )
  `);
  const insertEvent = db.prepare(`
    INSERT INTO events (
      id, asset_slug, type, title, detail, event_date, severity, score, source
    ) VALUES (
      @id, @assetSlug, @type, @title, @detail, @eventDate, @severity, @score, @source
    )
  `);
  const insertNote = db.prepare(`
    INSERT INTO research_notes (
      id, title, asset_slug, body, thesis, status, created_at, updated_at, tags
    ) VALUES (
      @id, @title, @assetSlug, @body, @thesis, @status, @createdAt, @updatedAt, @tags
    )
  `);
  const insertWatchlist = db.prepare(`
    INSERT INTO watchlist_items (asset_slug, priority, note, created_at)
    VALUES (@asset_slug, @priority, @note, @created_at)
  `);
  const insertPreset = db.prepare(`
    INSERT INTO screener_presets (id, name, description, filters)
    VALUES (@id, @name, @description, @filters)
  `);
  const insertSetting = db.prepare(`
    INSERT INTO settings (key, value)
    VALUES (?, ?)
  `);
  const insertSource = db.prepare(`
    INSERT INTO sources (key, name, status, cadence, freshness, notes, url)
    VALUES (@key, @name, @status, @cadence, @freshness, @notes, @url)
  `);

  db.exec("BEGIN TRANSACTION;");
  try {
    for (const seed of assetSeeds) {
      const bars = generateSeries(seed);
      const metrics = computeSeriesMetrics(bars);
      const latestEvent = `${seed.symbol} ${seed.classNote}`;
      const asset = {
        slug: seed.slug,
        symbol: seed.symbol,
        name: seed.name,
        asset_class: seed.assetClass,
        sub_class: seed.subClass,
        exchange: seed.exchange,
        sector: seed.sector,
        benchmark: seed.benchmark,
        description: seed.description,
        currency: seed.currency,
        last_price: metrics.lastPrice,
        price_change_pct: metrics.priceChangePct,
        aum_cr: seed.aumCr ?? null,
        market_cap_cr: seed.marketCapCr ?? null,
        pe_ratio: seed.peRatio ?? null,
        pb_ratio: seed.pbRatio ?? null,
        roe: seed.roe ?? null,
        div_yield: seed.divYield ?? null,
        expense_ratio: seed.expenseRatio ?? null,
        nav: seed.nav ?? null,
        return_1w: metrics.return1W,
        return_1m: metrics.return1M,
        return_3m: metrics.return3M,
        return_6m: metrics.return6M,
        return_1y: metrics.return1Y,
        max_drawdown: metrics.maxDrawdown,
        volatility: metrics.volatility,
        rsi14: metrics.rsi14,
        above_sma_50: metrics.aboveSma50 ? 1 : 0,
        above_sma_200: metrics.aboveSma200 ? 1 : 0,
        latest_event: latestEvent,
        trend_score: scoreTrend(metrics),
        quality_score: seed.qualityScore,
        valuation_score: seed.valuationScore,
        sentiment_score: seed.sentimentScore,
        conviction_score: scoreConviction({
          trend: seed.trendScore,
          quality: seed.qualityScore,
          valuation: seed.valuationScore,
          sentiment: seed.sentimentScore,
          risk: seed.riskScore,
        }),
        risk_score: seed.riskScore,
        updated_at: new Date().toISOString(),
        data_source: seed.assetClass === "mutual_fund" ? "AMFI" : seed.exchange,
        tags: JSON.stringify(seed.tags),
      };

      insertAsset.run(asset);

      for (const bar of bars) {
        insertBar.run(bar);
      }

      const news = makeNews(seed, bars);
      for (const item of news) {
        insertNews.run(item);
      }

      const events = makeEvents(seed, bars);
      for (const event of events) {
        insertEvent.run(event);
      }

      const notes = makeResearchNotes(seed);
      for (const note of notes) {
        insertNote.run(note);
      }
    }

    watchlistSlugs.forEach((slug, index) => {
      insertWatchlist.run({
        asset_slug: slug,
        priority: index + 1,
        note:
          index === 0
            ? "Anchor thesis and benchmark signal."
            : index === 1
              ? "Core large-cap tracking name."
              : "Keep on radar for regime and valuation changes.",
        created_at: new Date().toISOString(),
      });
    });

    screenerPresetSeeds.forEach((preset) => {
      insertPreset.run({
        id: preset.id,
        name: preset.name,
        description: preset.description,
        filters: JSON.stringify(preset.filters),
      });
    });

    settingsSeeds.forEach(([key, value]) => insertSetting.run(key, value));
    sourceSeeds.forEach((source) => insertSource.run(source));
    db.exec("COMMIT;");
  } catch (error) {
    db.exec("ROLLBACK;");
    throw error;
  }
  return { seeded: true, assets: assetSeeds.length };
}
