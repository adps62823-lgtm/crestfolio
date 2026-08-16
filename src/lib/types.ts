export type AssetClass =
  | "mutual_fund"
  | "equity"
  | "commodity"
  | "index"
  | "macro"
  | "etf";

export type NoteStatus = "idea" | "monitor" | "conviction" | "trim" | "exit";

export type EventSeverity = "low" | "medium" | "high" | "critical";

export type ScreenerFilters = {
  query?: string;
  assetClass?: AssetClass | "all";
  sector?: string | "all";
  minTrendScore?: number;
  minQualityScore?: number;
  minSentimentScore?: number;
  minConvictionScore?: number;
  maxRiskScore?: number;
  minAumCr?: number;
  minMarketCapCr?: number;
  minReturn1M?: number;
  minReturn6M?: number;
  minReturn1Y?: number;
  onlyWatchlist?: boolean;
  onlyRecentEvents?: boolean;
  tags?: string[];
};

export type AssetRecord = {
  slug: string;
  symbol: string;
  name: string;
  assetClass: AssetClass;
  subClass: string;
  exchange: string;
  sector: string;
  benchmark: string;
  description: string;
  currency: string;
  lastPrice: number;
  priceChangePct: number;
  aumCr?: number | null;
  marketCapCr?: number | null;
  peRatio?: number | null;
  pbRatio?: number | null;
  roe?: number | null;
  divYield?: number | null;
  expenseRatio?: number | null;
  nav?: number | null;
  trendScore: number;
  qualityScore: number;
  valuationScore: number;
  sentimentScore: number;
  convictionScore: number;
  riskScore: number;
  updatedAt: string;
  dataSource: string;
  tags: string[];
  return1W: number;
  return1M: number;
  return3M: number;
  return6M: number;
  return1Y: number;
  maxDrawdown: number;
  volatility: number;
  rsi14: number;
  aboveSma50: boolean;
  aboveSma200: boolean;
  latestEvent?: string;
};

export type PriceBar = {
  assetSlug: string;
  barDate: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type NewsItem = {
  id: string;
  assetSlug: string;
  headline: string;
  summary: string;
  source: string;
  url: string;
  publishedAt: string;
  sentiment: number;
  relevance: number;
  impact: string;
  tags: string[];
};

export type EventItem = {
  id: string;
  assetSlug: string;
  type: string;
  title: string;
  detail: string;
  eventDate: string;
  severity: EventSeverity;
  score: number;
  source: string;
};

export type ResearchNote = {
  id: string;
  title: string;
  assetSlug?: string | null;
  assetId?: string | null;
  body: string;
  bodyMarkdown?: string;
  thesis?: string;
  thesisTags?: string[];
  conviction?: number;
  persona?: string;
  version?: number;
  previousVersionId?: string | null;
  status: NoteStatus;
  createdAt: string;
  updatedAt: string;
  tags: string[];
};

export type WatchlistItem = {
  assetSlug: string;
  priority: number;
  note: string;
  createdAt: string;
};

export type ScreenerPreset = {
  id: string;
  name: string;
  description: string;
  filters: ScreenerFilters;
};

export type DashboardSummary = {
  marketPulse: {
    headline: string;
    score: number;
    note: string;
  };
  stats: Array<{
    label: string;
    value: string;
    delta: string;
    tone: "positive" | "negative" | "neutral";
  }>;
  spotlight: AssetRecord[];
  recentEvents: EventItem[];
  recentNews: NewsItem[];
  watchlist: AssetRecord[];
  researchQueue: ResearchNote[];
  sources: Array<{
    name: string;
    status: string;
    cadence: string;
    freshness: string;
    notes?: string;
    url?: string;
  }>;
};

export type AssetDetail = {
  asset: AssetRecord;
  bars: PriceBar[];
  news: NewsItem[];
  events: EventItem[];
  related: AssetRecord[];
  notes: ResearchNote[];
  watchlisted: boolean;
};

export type AppSettings = {
  appName: string;
  defaultPersona: string;
  defaultCurrency: string;
  ollamaBaseUrl: string;
  ollamaModel: string;
  theme: string;
  dataFreshness: string;
};

export type SourceRun = {
  id: string;
  sourceKey: string;
  startedAt: string;
  finishedAt: string;
  status: string;
  message: string;
  recordsCount: number;
};

export type SchemeOverlapResult = {
  schemeA: { slug: string; name: string; symbol: string };
  schemeB: { slug: string; name: string; symbol: string };
  overlapPercentage: number;
  commonHoldings: Array<{ companyName: string; weightA: number; weightB: number }>;
  uniqueToA: string[];
  uniqueToB: string[];
};

export type FormulaScreenRequest = {
  formula: string;
  assetClass?: AssetClass | "all";
};

export type LiveOverview = {
  amfiLatest: Array<{
    schemeCode: string;
    schemeName: string;
    amc: string;
    category: string;
    subCategory: string;
    nav: number | null;
    navDate: string | null;
    updatedAt: string;
  }>;
  nseBhavcopy: Array<{
    symbol: string;
    series: string;
    open: number | null;
    high: number | null;
    low: number | null;
    close: number | null;
    lastPrice: number | null;
    prevClose: number | null;
    totalTradedQty: number | null;
    turnoverLacs: number | null;
    trades: number | null;
    deliveryPct: number | null;
    updatedAt: string;
  }>;
  nseAnnouncements: Array<{
    id: string;
    symbol: string;
    companyName: string;
    subject: string;
    details: string;
    category: string;
    attachment: string | null;
    broadcastAt: string;
    url: string;
    updatedAt: string;
  }>;
  mcxSpots: Array<{
    id: string;
    commodity: string;
    location: string;
    spotPrice: number | null;
    upDown: string | null;
    asOf: string;
    session: string;
    updatedAt: string;
  }>;
  macros: Array<{
    id: string;
    sourceKey: string;
    metric: string;
    value: string;
    unit: string;
    asOf: string;
    notes: string;
    updatedAt: string;
  }>;
  sourceRuns: SourceRun[];
};

export type BasketAllocation = {
  assetId: string;
  weightPct: number;
};

export type BacktestRequest = {
  mode: "sip" | "lumpsum";
  startDate: string;
  endDate: string;
  basket: BasketAllocation[];
  lumpsumAmount?: number;
  monthlyAmount?: number;
};

export type BacktestResult = {
  mode: "sip" | "lumpsum";
  investedAmount: number;
  finalValue: number;
  cagr: number;
  xirr: number | null;
  sharpeRatio: number;
  sortinoRatio: number;
  maxDrawdown: number;
  volatilityAnnualized: number;
  navSeries: { date: string; value: number }[];
};

export type ShockEvent = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  description: string;
};

export type ShockTestResult = {
  shock: ShockEvent;
  basketDrawdownPct: number;
  recoveryDays: number | null;
  worstAsset: { assetId: string; drawdownPct: number };
  bestAsset: { assetId: string; drawdownPct: number };
};

export type ScenarioInput = {
  variable: string;
  delta: number;
  rateHikeBps?: number;
  oilPriceChangePct?: number;
  niftyChangePct?: number;
};

export type ScenarioImpact = {
  sector: string;
  direction: "positive" | "negative";
  magnitude: "low" | "medium" | "high";
  rationale: string;
  affectedNames: string[];
  name?: string;
  estimatedReturnPct?: number;
  confidence?: string;
};

export type TaxLot = {
  assetId: string;
  buyPrice: number;
  currentPrice: number;
  units: number;
  buyDate: string;
  isEquityOriented: boolean;
  purchaseDate?: string;
  quantity?: number;
};

export type TaxHarvestSuggestion = {
  lot: TaxLot;
  gainType?: "LTCG" | "STCG";
  unrealizedGainLoss: number;
  action: string;
  rationale?: string;
  taxType?: "STCG" | "LTCG";
};

export type AlertBriefing = {
  date?: string;
  bullets: string[];
  dispatchedTo: string[];
  dispatchedAt?: string | null;
  smaCrosses?: string[];
  navUpdates?: number;
};

export type ForensicFlag = {
  metric?: string;
  severity: "low" | "medium" | "high" | "red" | "amber" | "green";
  detail?: string;
  message?: string;
};

export type ForensicScore = {
  overallScore?: number;
  assetId?: string;
  asOf?: string;
  altmanZScore?: number | null;
  altmanZone?: "safe" | "grey" | "distress" | null;
  beneishMScore?: number | null;
  beneishFlag?: "likely_manipulator" | "unlikely" | null;
  promoterPledgePct?: number | null;
  workingCapitalDaysYoyChangePct?: number | null;
  receivableDaysYoyChangePct?: number | null;
  revenueGrowthYoyPct?: number | null;
  flags: ForensicFlag[];
};

export type LayoutPreset = {
  id: string;
  name: string;
  hotkey?: string;
  panels?: Array<{ component: string; position: string }>;
  components?: string[];
};

export type MacroRatio = {
  name: string;
  date?: string;
  value?: number;
  ratio?: number;
  zScore1y?: number;
  interpretation: string;
};

export type SectorMomentum = {
  sector: string;
  momentumScore?: number;
  relativeStrength?: number;
  r1w?: number;
  r1m?: number;
  r3m?: number;
  flowDirection?: "inflow" | "outflow" | "neutral";
};
