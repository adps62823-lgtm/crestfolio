import { seedDatabase } from "@/server/seed";
import { query, queryOne, queryRows } from "@/server/db";
import { fetchLiveYahooAsset } from "@/server/connectors/yahoo";
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
} from "@/lib/types";
import { formatCompactDate } from "@/lib/format";

let seedPromise: Promise<unknown> | null = null;

export async function ensureSeeded() {
  const countRow = await queryOne<{ count: string | number }>("SELECT COUNT(*) as count FROM assets");
  const count = countRow ? Number(countRow.count) : 0;
  if (count > 0) {
    return;
  }
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
    lastPrice: Number(row.last_price),
    priceChangePct: Number(row.price_change_pct),
    aumCr: row.aum_cr != null ? Number(row.aum_cr) : null,
    marketCapCr: row.market_cap_cr != null ? Number(row.market_cap_cr) : null,
    peRatio: row.pe_ratio != null ? Number(row.pe_ratio) : null,
    pbRatio: row.pb_ratio != null ? Number(row.pb_ratio) : null,
    roe: row.roe != null ? Number(row.roe) : null,
    divYield: row.div_yield != null ? Number(row.div_yield) : null,
    expenseRatio: row.expense_ratio != null ? Number(row.expense_ratio) : null,
    nav: row.nav != null ? Number(row.nav) : null,
    trendScore: Number(row.trend_score),
    qualityScore: Number(row.quality_score),
    valuationScore: Number(row.valuation_score),
    sentimentScore: Number(row.sentiment_score),
    convictionScore: Number(row.conviction_score),
    riskScore: Number(row.risk_score),
    updatedAt: row.updated_at,
    dataSource: row.data_source,
    tags: parseTags(row.tags),
    return1W: row.return_1w != null ? Number(row.return_1w) : 0,
    return1M: row.return_1m != null ? Number(row.return_1m) : 0,
    return3M: row.return_3m != null ? Number(row.return_3m) : 0,
    return6M: row.return_6m != null ? Number(row.return_6m) : 0,
    return1Y: row.return_1y != null ? Number(row.return_1y) : 0,
    maxDrawdown: row.max_drawdown != null ? Number(row.max_drawdown) : 0,
    volatility: row.volatility != null ? Number(row.volatility) : 0,
    rsi14: row.rsi14 != null ? Number(row.rsi14) : 50,
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
    sentiment: Number(row.sentiment),
    relevance: Number(row.relevance),
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
    score: Number(row.score),
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
  const rows = await queryRows<{ key: string; value: string }>("SELECT key, value FROM settings");
  const map = Object.fromEntries(rows.map((row) => [row.key, row.value]));
  return {
    appName: map.appName ?? "Crestfolio",
    defaultPersona: map.defaultPersona ?? "conservative_institutional",
    defaultCurrency: map.defaultCurrency ?? "INR",
    ollamaBaseUrl: map.ollamaBaseUrl ?? "http://localhost:11434",
    ollamaModel: map.ollamaModel ?? "llama3.1:8b-instruct",
    theme: map.theme ?? "dark",
    dataFreshness: map.dataFreshness ?? "realtime-live-public",
  };
}

export async function getSources() {
  await ensureSeeded();
  return queryRows<{
    key: string;
    name: string;
    status: string;
    cadence: string;
    freshness: string;
    notes: string;
    url: string;
  }>("SELECT * FROM sources ORDER BY key ASC");
}

export async function getLiveOverview(): Promise<LiveOverview> {
  await ensureSeeded();
  const amfiRows = await queryRows(
    `
      SELECT scheme_code, scheme_name, amc, category, sub_category, nav, nav_date, updated_at
      FROM live_mf_nav
      ORDER BY COALESCE(nav_date, updated_at) DESC
      LIMIT 12
    `,
  );
  const amfiLatest = amfiRows.map((row: any) => ({
    schemeCode: row.scheme_code,
    schemeName: row.scheme_name,
    amc: row.amc,
    category: row.category,
    subCategory: row.sub_category,
    nav: row.nav != null ? Number(row.nav) : null,
    navDate: row.nav_date,
    updatedAt: row.updated_at,
  }));

  const nseRows = await queryRows(
    `
      SELECT symbol, series, open, high, low, close, last_price, prev_close,
             total_traded_qty, turnover_lacs, trades, delivery_pct, updated_at
      FROM live_nse_bhavcopy
      ORDER BY updated_at DESC
      LIMIT 12
    `,
  );
  const nseBhavcopy = nseRows.map((row: any) => ({
    symbol: row.symbol,
    series: row.series,
    open: row.open != null ? Number(row.open) : null,
    high: row.high != null ? Number(row.high) : null,
    low: row.low != null ? Number(row.low) : null,
    close: row.close != null ? Number(row.close) : null,
    lastPrice: row.last_price != null ? Number(row.last_price) : null,
    prevClose: row.prev_close != null ? Number(row.prev_close) : null,
    totalTradedQty: row.total_traded_qty != null ? Number(row.total_traded_qty) : null,
    turnoverLacs: row.turnover_lacs != null ? Number(row.turnover_lacs) : null,
    trades: row.trades != null ? Number(row.trades) : null,
    deliveryPct: row.delivery_pct != null ? Number(row.delivery_pct) : null,
    updatedAt: row.updated_at,
  }));

  const announcementRows = await queryRows(
    `
      SELECT id, symbol, company_name, subject, details, category, attachment, broadcast_at, url, updated_at
      FROM live_nse_announcements
      ORDER BY broadcast_at DESC
      LIMIT 12
    `,
  );
  const nseAnnouncements = announcementRows.map((row: any) => ({
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

  const mcxRows = await queryRows(
    `
      SELECT id, commodity, location, spot_price, up_down, as_of, session, updated_at
      FROM live_mcx_spot
      ORDER BY updated_at DESC
      LIMIT 12
    `,
  );
  const mcxSpots = mcxRows.map((row: any) => ({
    id: row.id,
    commodity: row.commodity,
    location: row.location,
    spotPrice: row.spot_price != null ? Number(row.spot_price) : null,
    upDown: row.up_down,
    asOf: row.as_of,
    session: row.session,
    updatedAt: row.updated_at,
  }));

  const macroRows = await queryRows(
    `
      SELECT id, source_key, metric, value, unit, as_of, notes, updated_at
      FROM live_macro
      ORDER BY updated_at DESC
      LIMIT 20
    `,
  );
  const macros = macroRows.map((row: any) => ({
    id: row.id,
    sourceKey: row.source_key,
    metric: row.metric,
    value: row.value,
    unit: row.unit,
    asOf: row.as_of,
    notes: row.notes,
    updatedAt: row.updated_at,
  }));

  const runRows = await queryRows(
    `
      SELECT id, source_key, started_at, finished_at, status, message, records_count
      FROM source_runs
      ORDER BY finished_at DESC
      LIMIT 10
    `,
  );
  const sourceRuns = runRows.map((row: any) => ({
    id: row.id,
    sourceKey: row.source_key,
    startedAt: row.started_at,
    finishedAt: row.finished_at,
    status: row.status,
    message: row.message,
    recordsCount: Number(row.records_count),
  })) as SourceRun[];

  return { amfiLatest, nseBhavcopy, nseAnnouncements, mcxSpots, macros, sourceRuns };
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  await ensureSeeded();
  const assetRows = await queryRows("SELECT * FROM assets ORDER BY conviction_score DESC, trend_score DESC");
  const assets = assetRows.map(toAsset);

  const eventRows = await queryRows("SELECT * FROM events ORDER BY event_date DESC, score DESC");
  const events = eventRows.map(toEvent);

  const newsRows = await queryRows("SELECT * FROM news_items ORDER BY published_at DESC, relevance DESC");
  const news = newsRows.map(toNews);

  const noteRows = await queryRows("SELECT * FROM research_notes ORDER BY updated_at DESC");
  const notes = noteRows.map(toNote);

  const watchlistRows = (
    await queryRows(
      `
      SELECT a.*
      FROM watchlist_items w
      JOIN assets a ON a.slug = w.asset_slug
      ORDER BY w.priority ASC
    `,
    )
  ).map(toAsset);

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
      note: "Computed from the highest-ranked cross-asset ideas in the live universe.",
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
  const f = parseFilters(filters);

  // Dynamic on-demand search fetch from Yahoo Finance if query matches a symbol not yet in DB
  if (f.query && f.query.trim().length >= 2) {
    const symbolQuery = f.query.toUpperCase().trim();
    const existing = await queryOne("SELECT 1 FROM assets WHERE symbol = $1 OR slug = $2", [
      symbolQuery,
      f.query.toLowerCase(),
    ]);
    if (!existing) {
      await fetchLiveYahooAsset(symbolQuery);
    }
  }

  let sql = "SELECT * FROM assets WHERE 1=1";
  const params: any[] = [];

  if (f.query && f.query.trim()) {
    const q = `%${f.query.trim()}%`;
    sql += ` AND (name ILIKE $${params.length + 1} OR symbol ILIKE $${params.length + 2} OR sector ILIKE $${params.length + 3})`;
    params.push(q, q, q);
  }

  if (f.assetClass && f.assetClass !== "all") {
    sql += ` AND asset_class = $${params.length + 1}`;
    params.push(f.assetClass);
  }

  if (f.sector && f.sector !== "all") {
    sql += ` AND sector = $${params.length + 1}`;
    params.push(f.sector);
  }

  if (typeof f.minTrendScore === "number") {
    sql += ` AND trend_score >= $${params.length + 1}`;
    params.push(f.minTrendScore);
  }

  if (typeof f.minQualityScore === "number") {
    sql += ` AND quality_score >= $${params.length + 1}`;
    params.push(f.minQualityScore);
  }

  if (typeof f.minConvictionScore === "number") {
    sql += ` AND conviction_score >= $${params.length + 1}`;
    params.push(f.minConvictionScore);
  }

  if (typeof f.maxRiskScore === "number") {
    sql += ` AND risk_score <= $${params.length + 1}`;
    params.push(f.maxRiskScore);
  }

  sql +=
    " ORDER BY (CASE WHEN asset_class != 'mutual_fund' THEN 0 ELSE 1 END), conviction_score DESC, trend_score DESC LIMIT 500";

  const rows = await queryRows(sql, params);
  return rows.map(toAsset);
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
  let assetRow = await queryOne("SELECT * FROM assets WHERE slug = $1", [slug]);

  // If asset not in local DB, attempt dynamic live fetch from Yahoo Finance!
  if (!assetRow) {
    const fetched = await fetchLiveYahooAsset(slug.toUpperCase());
    if (fetched) {
      assetRow = await queryOne("SELECT * FROM assets WHERE slug = $1", [slug]);
    }
  }

  if (!assetRow) return null;

  const asset = toAsset(assetRow);
  const bars = await queryRows(
    "SELECT * FROM price_bars WHERE asset_slug = $1 ORDER BY bar_date ASC",
    [slug],
  );
  const news = (
    await queryRows(
      "SELECT * FROM news_items WHERE asset_slug = $1 ORDER BY published_at DESC",
      [slug],
    )
  ).map(toNews);
  const events = (
    await queryRows("SELECT * FROM events WHERE asset_slug = $1 ORDER BY event_date DESC", [
      slug,
    ])
  ).map(toEvent);
  const notes = (
    await queryRows("SELECT * FROM research_notes WHERE asset_slug = $1 ORDER BY updated_at DESC", [
      slug,
    ])
  ).map(toNote);
  const related = (
    await queryRows(
      "SELECT * FROM assets WHERE sector = $1 AND slug != $2 ORDER BY conviction_score DESC LIMIT 5",
      [asset.sector, slug],
    )
  ).map(toAsset);
  const watchlistedRow = await queryOne("SELECT 1 FROM watchlist_items WHERE asset_slug = $1", [
    slug,
  ]);
  const watchlisted = Boolean(watchlistedRow);

  return {
    asset,
    bars: bars.map((row: any) => ({
      assetSlug: row.asset_slug,
      barDate: row.bar_date,
      open: Number(row.open),
      high: Number(row.high),
      low: Number(row.low),
      close: Number(row.close),
      volume: Number(row.volume),
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
  const rows = await queryRows(
    `
      SELECT w.asset_slug, w.priority, w.note, w.created_at, a.name, a.symbol
      FROM watchlist_items w
      JOIN assets a ON a.slug = w.asset_slug
      ORDER BY w.priority ASC
    `,
  );
  return rows.map((row: any) => ({
    assetSlug: row.asset_slug,
    priority: Number(row.priority),
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
  const rows = await queryRows("SELECT * FROM research_notes ORDER BY updated_at DESC");
  return rows.map(toNote);
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
  const id = `note_${Date.now()}`;
  const now = new Date().toISOString();
  await query(
    `
    INSERT INTO research_notes (id, title, asset_slug, body, thesis, status, created_at, updated_at, tags)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
  `,
    [
      id,
      input.title,
      input.assetSlug ?? null,
      input.body,
      input.thesis ?? "",
      input.status ?? "idea",
      now,
      now,
      JSON.stringify(input.tags ?? []),
    ],
  );
  return id;
}

export async function listScreenerPresets(): Promise<ScreenerPreset[]> {
  await ensureSeeded();
  const rows = await queryRows("SELECT * FROM screener_presets ORDER BY name ASC");
  return rows.map((row: any) => ({
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
