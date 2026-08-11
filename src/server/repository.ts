import { seedDatabase } from "@/server/seed";
import { getDb } from "@/server/db";
import type {
  AppSettings,
  AssetClass,
  AssetDetail,
  AssetRecord,
  DashboardSummary,
  LiveOverview,
  EventItem,
  NewsItem,
  ResearchNote,
  ScreenerFilters,
  ScreenerPreset,
  SourceRun,
  WatchlistItem,
} from "@/lib/types";
import { formatCompactDate } from "@/lib/format";

let seedPromise: Promise<unknown> | null = null;

export async function ensureSeeded() {
  if (!seedPromise) {
    seedPromise = seedDatabase();
  }
  await seedPromise;
}

function parseTags(tags: string | null | undefined) {
  try {
    const parsed = tags ? (JSON.parse(tags) as string[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function toAsset(row: any): AssetRecord {
  return {
    slug: row.slug,
    symbol: row.symbol,
    name: row.name,
    assetClass: row.asset_class as AssetClass,
    subClass: row.sub_class,
    exchange: row.exchange,
    sector: row.sector,
    benchmark: row.benchmark,
    description: row.description,
    currency: row.currency,
    lastPrice: row.last_price,
    priceChangePct: row.price_change_pct,
    aumCr: row.aum_cr,
    marketCapCr: row.market_cap_cr,
    peRatio: row.pe_ratio,
    pbRatio: row.pb_ratio,
    roe: row.roe,
    divYield: row.div_yield,
    expenseRatio: row.expense_ratio,
    nav: row.nav,
    trendScore: row.trend_score,
    qualityScore: row.quality_score,
    valuationScore: row.valuation_score,
    sentimentScore: row.sentiment_score,
    convictionScore: row.conviction_score,
    riskScore: row.risk_score,
    updatedAt: row.updated_at,
    dataSource: row.data_source,
    tags: parseTags(row.tags),
    return1W: row.return_1w,
    return1M: row.return_1m,
    return3M: row.return_3m,
    return6M: row.return_6m,
    return1Y: row.return_1y,
    maxDrawdown: row.max_drawdown,
    volatility: row.volatility,
    rsi14: row.rsi14,
    aboveSma50: Boolean(row.above_sma_50),
    aboveSma200: Boolean(row.above_sma_200),
    latestEvent: row.latest_event ?? undefined,
  };
}

function toNews(row: any): NewsItem {
  return {
    id: row.id,
    assetSlug: row.asset_slug,
    headline: row.headline,
    summary: row.summary,
    source: row.source,
    url: row.url,
    publishedAt: row.published_at,
    sentiment: row.sentiment,
    relevance: row.relevance,
    impact: row.impact,
    tags: parseTags(row.tags),
  };
}

function toEvent(row: any): EventItem {
  return {
    id: row.id,
    assetSlug: row.asset_slug,
    type: row.type,
    title: row.title,
    detail: row.detail,
    eventDate: row.event_date,
    severity: row.severity,
    score: row.score,
    source: row.source,
  };
}

function toNote(row: any): ResearchNote {
  return {
    id: row.id,
    title: row.title,
    assetSlug: row.asset_slug,
    body: row.body,
    thesis: row.thesis,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    tags: parseTags(row.tags),
  };
}

function parseFilters(filters?: ScreenerFilters) {
  return filters ?? {};
}

export async function getSettings(): Promise<AppSettings> {
  await ensureSeeded();
  const db = getDb();
  const rows = db.prepare("SELECT key, value FROM settings").all() as Array<{
    key: string;
    value: string;
  }>;
  const map = Object.fromEntries(rows.map((row) => [row.key, row.value]));
  return {
    appName: map.appName ?? "Crestfolio",
    defaultPersona: map.defaultPersona ?? "conservative_institutional",
    defaultCurrency: map.defaultCurrency ?? "INR",
    ollamaBaseUrl: map.ollamaBaseUrl ?? "http://localhost:11434",
    ollamaModel: map.ollamaModel ?? "llama3.1:8b-instruct",
    theme: map.theme ?? "carbon-amber",
    dataFreshness: map.dataFreshness ?? "daily-public-plus-delayed-free",
  };
}

export async function getSources() {
  await ensureSeeded();
  const db = getDb();
  return db.prepare("SELECT * FROM sources ORDER BY key ASC").all() as Array<{
    key: string;
    name: string;
    status: string;
    cadence: string;
    freshness: string;
    notes: string;
    url: string;
  }>;
}

export async function getLiveOverview(): Promise<LiveOverview> {
  await ensureSeeded();
  const db = getDb();
  const amfiLatest = db
    .prepare(
      `
      SELECT scheme_code, scheme_name, amc, category, sub_category, nav, nav_date, updated_at
      FROM live_mf_nav
      ORDER BY COALESCE(nav_date, updated_at) DESC
      LIMIT 12
    `,
    )
    .all()
    .map((row: any) => ({
      schemeCode: row.scheme_code,
      schemeName: row.scheme_name,
      amc: row.amc,
      category: row.category,
      subCategory: row.sub_category,
      nav: row.nav,
      navDate: row.nav_date,
      updatedAt: row.updated_at,
    }));

  const nseBhavcopy = db
    .prepare(
      `
      SELECT symbol, series, open, high, low, close, last_price, prev_close,
             total_traded_qty, turnover_lacs, trades, delivery_pct, updated_at
      FROM live_nse_bhavcopy
      ORDER BY updated_at DESC
      LIMIT 12
    `,
    )
    .all()
    .map((row: any) => ({
      symbol: row.symbol,
      series: row.series,
      open: row.open,
      high: row.high,
      low: row.low,
      close: row.close,
      lastPrice: row.last_price,
      prevClose: row.prev_close,
      totalTradedQty: row.total_traded_qty,
      turnoverLacs: row.turnover_lacs,
      trades: row.trades,
      deliveryPct: row.delivery_pct,
      updatedAt: row.updated_at,
    }));

  const nseAnnouncements = db
    .prepare(
      `
      SELECT id, symbol, company_name, subject, details, category, attachment, broadcast_at, url, updated_at
      FROM live_nse_announcements
      ORDER BY broadcast_at DESC
      LIMIT 12
    `,
    )
    .all()
    .map((row: any) => ({
      id: row.id,
      symbol: row.symbol,
      companyName: row.company_name,
      subject: row.subject,
      details: row.details,
      category: row.category,
      attachment: row.attachment,
      broadcastAt: row.broadcast_at,
      url: row.url,
      updatedAt: row.updated_at,
    }));

  const mcxSpots = db
    .prepare(
      `
      SELECT id, commodity, location, spot_price, up_down, as_of, session, updated_at
      FROM live_mcx_spot
      ORDER BY updated_at DESC
      LIMIT 12
    `,
    )
    .all()
    .map((row: any) => ({
      id: row.id,
      commodity: row.commodity,
      location: row.location,
      spotPrice: row.spot_price,
      upDown: row.up_down,
      asOf: row.as_of,
      session: row.session,
      updatedAt: row.updated_at,
    }));

  const macros = db
    .prepare(
      `
      SELECT id, source_key, metric, value, unit, as_of, notes, updated_at
      FROM live_macro
      ORDER BY updated_at DESC
      LIMIT 20
    `,
    )
    .all()
    .map((row: any) => ({
      id: row.id,
      sourceKey: row.source_key,
      metric: row.metric,
      value: row.value,
      unit: row.unit,
      asOf: row.as_of,
      notes: row.notes,
      updatedAt: row.updated_at,
    }));

  const sourceRuns = db
    .prepare(
      `
      SELECT id, source_key, started_at, finished_at, status, message, records_count
      FROM source_runs
      ORDER BY finished_at DESC
      LIMIT 10
    `,
    )
    .all()
    .map((row: any) => ({
      id: row.id,
      sourceKey: row.source_key,
      startedAt: row.started_at,
      finishedAt: row.finished_at,
      status: row.status,
      message: row.message,
      recordsCount: row.records_count,
    })) as SourceRun[];

  return { amfiLatest, nseBhavcopy, nseAnnouncements, mcxSpots, macros, sourceRuns };
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  await ensureSeeded();
  const db = getDb();
  const assets = db
    .prepare("SELECT * FROM assets ORDER BY conviction_score DESC, trend_score DESC")
    .all()
    .map(toAsset);
  const events = db
    .prepare("SELECT * FROM events ORDER BY event_date DESC, score DESC")
    .all()
    .map(toEvent);
  const news = db
    .prepare("SELECT * FROM news_items ORDER BY published_at DESC, relevance DESC")
    .all()
    .map(toNews);
  const notes = db
    .prepare("SELECT * FROM research_notes ORDER BY updated_at DESC")
    .all()
    .map(toNote);
  const watchlistRows = db
    .prepare(
      `
      SELECT a.*
      FROM watchlist_items w
      JOIN assets a ON a.slug = w.asset_slug
      ORDER BY w.priority ASC
    `,
    )
    .all()
    .map(toAsset);
  const sources = await getSources();

  const marketPulseScore =
    Math.round(
      assets.slice(0, 5).reduce((sum, asset) => sum + asset.trendScore + asset.sentimentScore, 0) /
        10,
    ) ?? 0;

  const headline =
    marketPulseScore >= 70
      ? "Broad risk-on posture with selective opportunity pockets."
      : marketPulseScore >= 55
        ? "Mixed regime. Quality and relative strength matter most."
        : "Defensive setup. Focus on balance sheets and hedges.";

  const stats = [
    {
      label: "Watchlist names",
      value: String(watchlistRows.length),
      delta: "+2 this week",
      tone: "positive" as const,
    },
    {
      label: "High-conviction ideas",
      value: String(assets.filter((asset) => asset.convictionScore >= 80).length),
      delta: "screened from universe",
      tone: "positive" as const,
    },
    {
      label: "Recent events",
      value: String(events.length),
      delta: "new signals captured",
      tone: "neutral" as const,
    },
    {
      label: "Fresh research notes",
      value: String(notes.length),
      delta: "ready for review",
      tone: "neutral" as const,
    },
  ];

  return {
    marketPulse: {
      headline,
      score: marketPulseScore,
      note: "Computed from the highest-ranked cross-asset ideas in the current seeded universe.",
    },
    stats,
    spotlight: assets.slice(0, 6),
    recentEvents: events.slice(0, 6),
    recentNews: news.slice(0, 6),
    watchlist: watchlistRows,
    researchQueue: notes.filter((note) => note.status !== "exit").slice(0, 5),
    sources: sources.map((source) => ({
      name: source.name,
      status: source.status,
      cadence: source.cadence,
      freshness: source.freshness,
      notes: source.notes,
      url: source.url,
    })),
  };
}

export async function listAssets(filters?: ScreenerFilters): Promise<AssetRecord[]> {
  await ensureSeeded();
  const db = getDb();
  const rows = db.prepare("SELECT * FROM assets").all().map(toAsset);
  const f = parseFilters(filters);

  return rows
    .filter((asset) => {
      if (f.query) {
        const query = f.query.toLowerCase();
        const haystack = `${asset.name} ${asset.symbol} ${asset.sector} ${asset.description} ${asset.tags.join(" ")}`.toLowerCase();
        if (!haystack.includes(query)) return false;
      }

      if (f.assetClass && f.assetClass !== "all" && asset.assetClass !== f.assetClass) {
        return false;
      }

      if (f.sector && f.sector !== "all" && asset.sector !== f.sector) {
        return false;
      }

      if (
        typeof f.minTrendScore === "number" &&
        asset.trendScore < f.minTrendScore
      ) {
        return false;
      }

      if (
        typeof f.minQualityScore === "number" &&
        asset.qualityScore < f.minQualityScore
      ) {
        return false;
      }

      if (
        typeof f.minSentimentScore === "number" &&
        asset.sentimentScore < f.minSentimentScore
      ) {
        return false;
      }

      if (
        typeof f.minConvictionScore === "number" &&
        asset.convictionScore < f.minConvictionScore
      ) {
        return false;
      }

      if (typeof f.maxRiskScore === "number" && asset.riskScore > f.maxRiskScore) {
        return false;
      }

      if (typeof f.minAumCr === "number" && (asset.aumCr ?? 0) < f.minAumCr) {
        return false;
      }

      if (
        typeof f.minMarketCapCr === "number" &&
        (asset.marketCapCr ?? 0) < f.minMarketCapCr
      ) {
        return false;
      }

      if (typeof f.minReturn1M === "number" && asset.return1M < f.minReturn1M) {
        return false;
      }

      if (typeof f.minReturn6M === "number" && asset.return6M < f.minReturn6M) {
        return false;
      }

      if (typeof f.minReturn1Y === "number" && asset.return1Y < f.minReturn1Y) {
        return false;
      }

      if (f.tags?.length) {
        const tagSet = new Set(asset.tags);
        if (!f.tags.some((tag) => tagSet.has(tag))) return false;
      }

      if (f.onlyWatchlist) {
        const watchlisted = db
          .prepare("SELECT 1 FROM watchlist_items WHERE asset_slug = ?")
          .get(asset.slug);
        if (!watchlisted) return false;
      }

      if (f.onlyRecentEvents) {
        const event = db
          .prepare("SELECT 1 FROM events WHERE asset_slug = ? ORDER BY event_date DESC LIMIT 1")
          .get(asset.slug);
        if (!event) return false;
      }

      return true;
    })
    .sort((a, b) => b.convictionScore - a.convictionScore || b.trendScore - a.trendScore);
}

export async function getUniverseFacets() {
  const assets = await listAssets();
  const sectors = [...new Set(assets.map((asset) => asset.sector))].sort();
  const assetClasses = [...new Set(assets.map((asset) => asset.assetClass))];
  const tags = [...new Set(assets.flatMap((asset) => asset.tags))].sort();
  return { sectors, assetClasses, tags };
}

export async function getAssetDetail(slug: string): Promise<AssetDetail | null> {
  await ensureSeeded();
  const db = getDb();
  const assetRow = db.prepare("SELECT * FROM assets WHERE slug = ?").get(slug);
  if (!assetRow) return null;

  const asset = toAsset(assetRow);
  const bars = db
    .prepare("SELECT * FROM price_bars WHERE asset_slug = ? ORDER BY bar_date ASC")
    .all(slug);
  const news = db
    .prepare("SELECT * FROM news_items WHERE asset_slug = ? ORDER BY published_at DESC")
    .all(slug)
    .map(toNews);
  const events = db
    .prepare("SELECT * FROM events WHERE asset_slug = ? ORDER BY event_date DESC")
    .all(slug)
    .map(toEvent);
  const notes = db
    .prepare("SELECT * FROM research_notes WHERE asset_slug = ? ORDER BY updated_at DESC")
    .all(slug)
    .map(toNote);
  const related = db
    .prepare("SELECT * FROM assets WHERE sector = ? AND slug != ? ORDER BY conviction_score DESC LIMIT 5")
    .all(asset.sector, slug)
    .map(toAsset);
  const watchlisted = Boolean(
    db.prepare("SELECT 1 FROM watchlist_items WHERE asset_slug = ?").get(slug),
  );

  return {
    asset,
    bars: bars.map((row: any) => ({
      assetSlug: row.asset_slug,
      barDate: row.bar_date,
      open: row.open,
      high: row.high,
      low: row.low,
      close: row.close,
      volume: row.volume,
    })),
    news,
    events,
    related,
    notes,
    watchlisted,
  };
}

export async function getWatchlistItems() {
  await ensureSeeded();
  const db = getDb();
  return db
    .prepare(
      `
      SELECT w.asset_slug, w.priority, w.note, w.created_at, a.name, a.symbol
      FROM watchlist_items w
      JOIN assets a ON a.slug = w.asset_slug
      ORDER BY w.priority ASC
    `,
    )
    .all()
    .map((row: any) => ({
      assetSlug: row.asset_slug,
      priority: row.priority,
      note: row.note,
      createdAt: row.created_at,
      name: row.name,
      symbol: row.symbol,
    })) as Array<{
    assetSlug: string;
    priority: number;
    note: string;
    createdAt: string;
    name: string;
    symbol: string;
  }>;
}

export async function getResearchNotes() {
  await ensureSeeded();
  const db = getDb();
  return db.prepare("SELECT * FROM research_notes ORDER BY updated_at DESC").all().map(toNote);
}

export async function createResearchNote(input: {
  title: string;
  assetSlug?: string | null;
  body: string;
  thesis?: string;
  status?: string;
  tags?: string[];
}) {
  await ensureSeeded();
  const db = getDb();
  const id = `note_${Date.now()}`;
  const now = new Date().toISOString();
  db.prepare(
    `
    INSERT INTO research_notes (id, title, asset_slug, body, thesis, status, created_at, updated_at, tags)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `,
  ).run(
    id,
    input.title,
    input.assetSlug ?? null,
    input.body,
    input.thesis ?? "",
    input.status ?? "idea",
    now,
    now,
    JSON.stringify(input.tags ?? []),
  );
  return id;
}

export async function listScreenerPresets(): Promise<ScreenerPreset[]> {
  await ensureSeeded();
  const db = getDb();
  return db
    .prepare("SELECT * FROM screener_presets ORDER BY name ASC")
    .all()
    .map((row: any) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      filters: JSON.parse(row.filters) as ScreenerFilters,
    }));
}

export async function getAssetListPageData(filters?: ScreenerFilters) {
  const assets = await listAssets(filters);
  const facets = await getUniverseFacets();
  const watchlist = await getWatchlistItems();
  return { assets, facets, watchlist };
}

export async function getAssetBrief(slug: string) {
  const detail = await getAssetDetail(slug);
  if (!detail) return null;
  return {
    asset: detail.asset,
    latestNews: detail.news.slice(0, 3),
    latestEvents: detail.events.slice(0, 3),
    latestNote: detail.notes[0] ?? null,
  };
}

export async function getChartHeadline(slug: string) {
  const detail = await getAssetDetail(slug);
  if (!detail) return null;
  const lastEvent = detail.events[0];
  return {
    title: `${detail.asset.name} research canvas`,
    subtitle: `${detail.asset.sector} | ${detail.asset.assetClass} | Updated ${formatCompactDate(detail.asset.updatedAt)}`,
    event: lastEvent?.title ?? "No fresh event",
  };
}
