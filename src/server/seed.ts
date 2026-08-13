import { query, queryOne, resetDatabaseForSeed } from "@/server/db";
import {
  screenerPresetSeeds,
  settingsSeeds,
  sourceSeeds,
  watchlistSlugs,
} from "@/server/seed-data";
import { fetchLiveYahooAsset } from "./connectors/yahoo";
import { syncAmfiNavs } from "./connectors/amfi";
import { syncNseUniverse } from "./connectors/nse-universe";

const CORE_LIVE_UNIVERSE = [
  { symbol: "RELIANCE", assetClass: "equity", name: "Reliance Industries", sector: "Energy & Retail" },
  { symbol: "TCS", assetClass: "equity", name: "Tata Consultancy Services", sector: "IT Services" },
  { symbol: "HDFCBANK", assetClass: "equity", name: "HDFC Bank", sector: "Financials" },
  { symbol: "INFY", assetClass: "equity", name: "Infosys", sector: "IT Services" },
  { symbol: "ITC", assetClass: "equity", name: "ITC", sector: "Consumer Staples" },
  { symbol: "SBIN", assetClass: "equity", name: "State Bank of India", sector: "Financials" },
  { symbol: "BHARTIARTL", assetClass: "equity", name: "Bharti Airtel", sector: "Telecom" },
  { symbol: "LT", assetClass: "equity", name: "Larsen & Toubro", sector: "Industrials" },
  { symbol: "TITAN", assetClass: "equity", name: "Titan Company", sector: "Consumer Discretionary" },
  { symbol: "MARUTI", assetClass: "equity", name: "Maruti Suzuki India", sector: "Automobile" },
  { symbol: "SUNPHARMA", assetClass: "equity", name: "Sun Pharmaceutical", sector: "Healthcare" },
  { symbol: "GOLD", assetClass: "commodity", name: "Gold Futures (MCX)", sector: "Precious Metals" },
  { symbol: "SILVER", assetClass: "commodity", name: "Silver Futures (MCX)", sector: "Precious Metals" },
  { symbol: "CRUDEOIL", assetClass: "commodity", name: "Crude Oil Futures (MCX)", sector: "Energy" },
  { symbol: "NIFTY50", assetClass: "index", name: "Nifty 50 Index", sector: "Indian Equities" },
  { symbol: "INDIAVIX", assetClass: "index", name: "India VIX", sector: "Market Risk" },
  { symbol: "USDINR", assetClass: "macro", name: "USD / INR", sector: "FX" },
];

export async function seedDatabase() {
  const assetCountRow = await queryOne<{ count: string | number }>("SELECT COUNT(*) as count FROM assets");
  const assetCount = assetCountRow ? Number(assetCountRow.count) : 0;

  // If database already contains assets (> 1000), return immediately
  if (assetCount > 1000) {
    return { seeded: false, assets: assetCount };
  }

  await resetDatabaseForSeed();

  for (const preset of screenerPresetSeeds) {
    await query(
      `
      INSERT INTO screener_presets (id, name, description, filters)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (id) DO NOTHING
    `,
      [preset.id, preset.name, preset.description, JSON.stringify(preset.filters)],
    );
  }

  for (const [key, value] of settingsSeeds) {
    await query(
      `
      INSERT INTO settings (key, value)
      VALUES ($1, $2)
      ON CONFLICT (key) DO NOTHING
    `,
      [key, value],
    );
  }

  for (const source of sourceSeeds) {
    await query(
      `
      INSERT INTO sources (key, name, status, cadence, freshness, notes, url)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (key) DO NOTHING
    `,
      [
        source.key,
        source.name,
        source.status,
        source.cadence,
        source.freshness,
        source.notes,
        source.url,
      ],
    );
  }

  // Fetch real live quotes and real OHLCV candlestick bars for core assets
  console.log("Initial seed: Fetching live market data for core universe...");
  for (const item of CORE_LIVE_UNIVERSE) {
    await fetchLiveYahooAsset(item.symbol, item.assetClass, item.name, item.sector);
  }

  // Sync real live AMFI Mutual Fund NAVs
  console.log("Initial seed: Syncing live AMFI Mutual Fund NAVs...");
  await syncAmfiNavs();

  // Sync all 2,400+ listed NSE equity stocks
  console.log("Initial seed: Syncing 2,400+ listed NSE equities...");
  await syncNseUniverse();

  for (let index = 0; index < watchlistSlugs.length; index++) {
    const slug = watchlistSlugs[index];
    try {
      await query(
        `
        INSERT INTO watchlist_items (asset_slug, priority, note, created_at)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (asset_slug) DO NOTHING
      `,
        [slug, index + 1, "Core institutional tracking asset.", new Date().toISOString()],
      );
    } catch {}
  }

  return { seeded: true, assets: CORE_LIVE_UNIVERSE.length };
}
