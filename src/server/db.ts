import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

const DB_PATH =
  process.env.CRESTFOLIO_DB_PATH ??
  path.join(process.cwd(), "data", "crestfolio.db");

type GlobalDb = typeof globalThis & {
  __crestfolioDb?: DatabaseSync;
  __crestfolioReady?: boolean;
};

const globalDb = globalThis as GlobalDb;

function ensureDirectory(filePath: string) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

export function getDb() {
  if (!globalDb.__crestfolioDb) {
    ensureDirectory(DB_PATH);
    globalDb.__crestfolioDb = new DatabaseSync(DB_PATH);
    globalDb.__crestfolioDb.exec("PRAGMA journal_mode = WAL;");
    globalDb.__crestfolioDb.exec("PRAGMA synchronous = NORMAL;");
  }

  if (!globalDb.__crestfolioReady) {
    initializeSchema(globalDb.__crestfolioDb);
    globalDb.__crestfolioReady = true;
  }

  return globalDb.__crestfolioDb;
}

function initializeSchema(db: DatabaseSync) {
  db.exec(`
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
      last_price REAL NOT NULL,
      price_change_pct REAL NOT NULL,
      aum_cr REAL,
      market_cap_cr REAL,
      pe_ratio REAL,
      pb_ratio REAL,
      roe REAL,
      div_yield REAL,
      expense_ratio REAL,
      nav REAL,
      return_1w REAL,
      return_1m REAL,
      return_3m REAL,
      return_6m REAL,
      return_1y REAL,
      max_drawdown REAL,
      volatility REAL,
      rsi14 REAL,
      above_sma_50 INTEGER NOT NULL DEFAULT 0,
      above_sma_200 INTEGER NOT NULL DEFAULT 0,
      latest_event TEXT,
      trend_score INTEGER NOT NULL,
      quality_score INTEGER NOT NULL,
      valuation_score INTEGER NOT NULL,
      sentiment_score INTEGER NOT NULL,
      conviction_score INTEGER NOT NULL,
      risk_score INTEGER NOT NULL,
      updated_at TEXT NOT NULL,
      data_source TEXT NOT NULL,
      tags TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS price_bars (
      asset_slug TEXT NOT NULL,
      bar_date TEXT NOT NULL,
      open REAL NOT NULL,
      high REAL NOT NULL,
      low REAL NOT NULL,
      close REAL NOT NULL,
      volume REAL NOT NULL,
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
      sentiment REAL NOT NULL,
      relevance REAL NOT NULL,
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
      score REAL NOT NULL,
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
      priority INTEGER NOT NULL,
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
      records_count INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS live_mf_nav (
      scheme_code TEXT PRIMARY KEY,
      scheme_name TEXT NOT NULL,
      amc TEXT NOT NULL,
      category TEXT NOT NULL,
      sub_category TEXT NOT NULL,
      nav REAL,
      nav_date TEXT,
      raw_line TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS live_nse_bhavcopy (
      symbol TEXT PRIMARY KEY,
      series TEXT NOT NULL,
      open REAL,
      high REAL,
      low REAL,
      close REAL,
      last_price REAL,
      prev_close REAL,
      total_traded_qty REAL,
      turnover_lacs REAL,
      trades REAL,
      delivery_pct REAL,
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
      spot_price REAL,
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
}

export function resetDatabaseForSeed() {
  const db = getDb();
  db.exec(`
    DELETE FROM price_bars;
    DELETE FROM news_items;
    DELETE FROM events;
    DELETE FROM research_notes;
    DELETE FROM watchlist_items;
    DELETE FROM screener_presets;
    DELETE FROM settings;
    DELETE FROM sources;
    DELETE FROM assets;
  `);
}
