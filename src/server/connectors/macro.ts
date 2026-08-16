// ─────────────────────────────────────────────────────────────────────────
// RBI / MOSPI Macro Connector — repo rate, CPI inflation, USD-INR reference
// rate, IIP. RBI's DBIE (Database on Indian Economy) and the FBIL reference
// rate page are the two real, free, public sources used here.
// ─────────────────────────────────────────────────────────────────────────
import { getDb } from "../db";

const FBIL_USDINR_URL = "https://www.fbil.org.in/api/ReferenceRate/GetLatestReferenceRate";
const RBI_REPO_PAGE = "https://www.rbi.org.in/Scripts/BS_PressReleaseDisplay.aspx";

export interface MacroPoint {
  series: "usdinr" | "repo_rate" | "cpi_inflation" | "iip";
  date: string;
  value: number;
}

export async function fetchUsdInrReference(): Promise<MacroPoint | null> {
  const res = await fetch(FBIL_USDINR_URL, { headers: { "User-Agent": "Crestfolio/2.0" } });
  if (!res.ok) throw new Error(`FBIL USD-INR fetch failed: HTTP ${res.status}`);
  const data = (await res.json()) as Record<string, unknown>;
  // FBIL's response shape varies by endpoint version; extend this parser
  // once you've inspected a live response from your own network.
  const usd = (data?.["USD"] ?? data?.["rate"]) as number | undefined;
  if (typeof usd !== "number") return null;
  return { series: "usdinr", date: new Date().toISOString().slice(0, 10), value: usd };
}

/** RBI repo rate changes only a handful of times a year and is best sourced
 * from RBI's monetary policy press releases. This is a thin, extensible
 * hook — populate via the official RBI press-release RSS/HTML on your own
 * network, then call ingestMacroPoints() below. */
export function ingestMacroPoints(points: MacroPoint[]): number {
  const db = getDb();
  const now = new Date().toISOString();
  const upsertAsset = db.prepare(`
    INSERT INTO assets (id, symbol, name, asset_class, exchange, updated_at)
    VALUES (@id, @symbol, @name, 'MACRO', 'RBI', @updatedAt)
    ON CONFLICT(id) DO UPDATE SET updated_at = excluded.updated_at
  `);
  const upsertBar = db.prepare(`
    INSERT INTO bars (asset_id, date, close) VALUES (@assetId, @date, @close)
    ON CONFLICT(asset_id, date) DO UPDATE SET close = excluded.close
  `);
  const txn = db.transaction((batch: MacroPoint[]) => {
    for (const p of batch) {
      const assetId = `MACRO-${p.series.toUpperCase()}`;
      upsertAsset.run({ id: assetId, symbol: p.series, name: p.series, updatedAt: now });
      upsertBar.run({ assetId, date: p.date, close: p.value });
    }
  });
  txn(points);
  db.prepare(`
    INSERT INTO sync_status (source, last_sync_at, last_sync_status, records_ingested, error_message)
    VALUES ('RBI', @ts, 'success', @count, NULL)
    ON CONFLICT(source) DO UPDATE SET last_sync_at=excluded.last_sync_at, last_sync_status='success', records_ingested=excluded.records_ingested, error_message=NULL
  `).run({ ts: now, count: points.length });
  return points.length;
}

export function recordMacroFailure(err: unknown) {
  const db = getDb();
  db.prepare(`
    INSERT INTO sync_status (source, last_sync_at, last_sync_status, records_ingested, error_message)
    VALUES ('RBI', @ts, 'failed', NULL, @msg)
    ON CONFLICT(source) DO UPDATE SET last_sync_at=excluded.last_sync_at, last_sync_status='failed', error_message=excluded.error_message
  `).run({ ts: new Date().toISOString(), msg: err instanceof Error ? err.message : String(err) });
}
