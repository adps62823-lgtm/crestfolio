try {
  process.loadEnvFile?.(".env");
} catch {}

import { Pool, QueryResult, QueryResultRow } from "pg";

type GlobalDb = typeof globalThis & {
  __crestfolioPool?: Pool;
  __crestfolioReadyPromise?: Promise<void>;
};

const globalDb = globalThis as GlobalDb;

export function getPool(): Pool {
  if (!globalDb.__crestfolioPool) {
    const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error(
        "DATABASE_URL or DIRECT_URL environment variable is missing for Supabase Postgres.",
      );
    }
    globalDb.__crestfolioPool = new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false,
      },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });
  }
  return globalDb.__crestfolioPool;
}

export async function ensureSchema(): Promise<void> {
  if (!globalDb.__crestfolioReadyPromise) {
    globalDb.__crestfolioReadyPromise = (async () => {
      const pool = getPool();
      await pool.query(`
        CREATE TABLE IF NOT EXISTS assets (
          slug TEXT PRIMARY KEY,
          symbol TEXT NOT NULL UNIQUE,
          name TEXT NOT NULL,
          asset_class TEXT NOT NULL,
          sub_class TEXT NOT NULL,
          exchange TEXT NOT NULL,
          sector TEXT NOT NULL,
          benchmark TEXT NOT NULL,
          description TEXT NOT NULL,
          currency TEXT NOT NULL,
          last_price DOUBLE PRECISION NOT NULL,
          price_change_pct DOUBLE PRECISION NOT NULL,
          aum_cr DOUBLE PRECISION,
          market_cap_cr DOUBLE PRECISION,
          pe_ratio DOUBLE PRECISION,
          pb_ratio DOUBLE PRECISION,
          roe DOUBLE PRECISION,
          div_yield DOUBLE PRECISION,
          expense_ratio DOUBLE PRECISION,
          nav DOUBLE PRECISION,
          return_1w DOUBLE PRECISION,
          return_1m DOUBLE PRECISION,
          return_3m DOUBLE PRECISION,
          return_6m DOUBLE PRECISION,
          return_1y DOUBLE PRECISION,
          max_drawdown DOUBLE PRECISION,
          volatility DOUBLE PRECISION,
          rsi14 DOUBLE PRECISION,
          above_sma_50 BOOLEAN NOT NULL DEFAULT FALSE,
          above_sma_200 BOOLEAN NOT NULL DEFAULT FALSE,
          latest_event TEXT,
          trend_score INT NOT NULL,
          quality_score INT NOT NULL,
          valuation_score INT NOT NULL,
          sentiment_score INT NOT NULL,
          conviction_score INT NOT NULL,
          risk_score INT NOT NULL,
          updated_at TEXT NOT NULL,
          data_source TEXT NOT NULL,
          tags TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS price_bars (
          asset_slug TEXT NOT NULL,
          bar_date TEXT NOT NULL,
          open DOUBLE PRECISION NOT NULL,
          high DOUBLE PRECISION NOT NULL,
          low DOUBLE PRECISION NOT NULL,
          close DOUBLE PRECISION NOT NULL,
          volume DOUBLE PRECISION NOT NULL,
          PRIMARY KEY (asset_slug, bar_date),
          FOREIGN KEY (asset_slug) REFERENCES assets(slug) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS news_items (
          id TEXT PRIMARY KEY,
          asset_slug TEXT NOT NULL,
          headline TEXT NOT NULL,
          summary TEXT NOT NULL,
          source TEXT NOT NULL,
          url TEXT NOT NULL,
          published_at TEXT NOT NULL,
          sentiment DOUBLE PRECISION NOT NULL,
          relevance DOUBLE PRECISION NOT NULL,
          impact TEXT NOT NULL,
          tags TEXT NOT NULL,
          FOREIGN KEY (asset_slug) REFERENCES assets(slug) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS events (
          id TEXT PRIMARY KEY,
          asset_slug TEXT NOT NULL,
          type TEXT NOT NULL,
          title TEXT NOT NULL,
          detail TEXT NOT NULL,
          event_date TEXT NOT NULL,
          severity TEXT NOT NULL,
          score DOUBLE PRECISION NOT NULL,
          source TEXT NOT NULL,
          FOREIGN KEY (asset_slug) REFERENCES assets(slug) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS research_notes (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          asset_slug TEXT,
          body TEXT NOT NULL,
          thesis TEXT NOT NULL,
          status TEXT NOT NULL,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          tags TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS watchlist_items (
          asset_slug TEXT PRIMARY KEY,
          priority INT NOT NULL,
          note TEXT NOT NULL,
          created_at TEXT NOT NULL,
          FOREIGN KEY (asset_slug) REFERENCES assets(slug) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS screener_presets (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT NOT NULL,
          filters TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS settings (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS sources (
          key TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          status TEXT NOT NULL,
          cadence TEXT NOT NULL,
          freshness TEXT NOT NULL,
          notes TEXT NOT NULL,
          url TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS source_runs (
          id TEXT PRIMARY KEY,
          source_key TEXT NOT NULL,
          started_at TEXT NOT NULL,
          finished_at TEXT NOT NULL,
          status TEXT NOT NULL,
          message TEXT NOT NULL,
          records_count INT NOT NULL DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS live_mf_nav (
          scheme_code TEXT PRIMARY KEY,
          scheme_name TEXT NOT NULL,
          amc TEXT NOT NULL,
          category TEXT NOT NULL,
          sub_category TEXT NOT NULL,
          nav DOUBLE PRECISION,
          nav_date TEXT,
          raw_line TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS live_nse_bhavcopy (
          symbol TEXT PRIMARY KEY,
          series TEXT NOT NULL,
          open DOUBLE PRECISION,
          high DOUBLE PRECISION,
          low DOUBLE PRECISION,
          close DOUBLE PRECISION,
          last_price DOUBLE PRECISION,
          prev_close DOUBLE PRECISION,
          total_traded_qty DOUBLE PRECISION,
          turnover_lacs DOUBLE PRECISION,
          trades DOUBLE PRECISION,
          delivery_pct DOUBLE PRECISION,
          updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS live_nse_announcements (
          id TEXT PRIMARY KEY,
          symbol TEXT NOT NULL,
          company_name TEXT NOT NULL,
          subject TEXT NOT NULL,
          details TEXT NOT NULL,
          category TEXT NOT NULL,
          attachment TEXT,
          broadcast_at TEXT NOT NULL,
          url TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS live_mcx_spot (
          id TEXT PRIMARY KEY,
          commodity TEXT NOT NULL,
          location TEXT NOT NULL,
          spot_price DOUBLE PRECISION,
          up_down TEXT,
          as_of TEXT NOT NULL,
          session TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS live_macro (
          id TEXT PRIMARY KEY,
          source_key TEXT NOT NULL,
          metric TEXT NOT NULL,
          value TEXT NOT NULL,
          unit TEXT NOT NULL,
          as_of TEXT NOT NULL,
          notes TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );
      `);
    })();
  }
  return globalDb.__crestfolioReadyPromise;
}

export async function query<R extends QueryResultRow = any>(
  text: string,
  params?: any[],
): Promise<QueryResult<R>> {
  await ensureSchema();
  const pool = getPool();
  return pool.query<R>(text, params);
}

export async function queryOne<R extends QueryResultRow = any>(
  text: string,
  params?: any[],
): Promise<R | null> {
  const result = await query<R>(text, params);
  return result.rows[0] ?? null;
}

export async function queryRows<R extends QueryResultRow = any>(
  text: string,
  params?: any[],
): Promise<R[]> {
  const result = await query<R>(text, params);
  return result.rows;
}

export async function resetDatabaseForSeed(): Promise<void> {
  await ensureSchema();
  const pool = getPool();
  await pool.query(`
    TRUNCATE price_bars, news_items, events, research_notes, watchlist_items, screener_presets, settings, sources, assets CASCADE;
  `);
}
