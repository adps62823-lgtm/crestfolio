import { getDb } from "../db";
import {
  fetchText,
  isoNow,
  parseNumber,
  parseTableRows,
  stableId,
  upsertSourceRun,
} from "./shared";

const MCX_SPOT = "https://www.mcxindia.com/market-data/spot-market-price";
const MCX_HISTORICAL = "https://www.mcxindia.com/market-data/historical-data";

export async function syncMcxData() {
  const startedAt = isoNow();
  try {
    const [spotHtml, histHtml] = await Promise.all([fetchText(MCX_SPOT), fetchText(MCX_HISTORICAL)]);
    const db = getDb();
    const insertSpot = db.prepare(`
      INSERT INTO live_mcx_spot (
        id, commodity, location, spot_price, up_down, as_of, session, updated_at
      ) VALUES (
        @id, @commodity, @location, @spotPrice, @upDown, @asOf, @session, @updatedAt
      )
      ON CONFLICT(id) DO UPDATE SET
        commodity = excluded.commodity,
        location = excluded.location,
        spot_price = excluded.spot_price,
        up_down = excluded.up_down,
        as_of = excluded.as_of,
        session = excluded.session,
        updated_at = excluded.updated_at
    `);
    const rows = parseTableRows(spotHtml);
    let count = 0;
    for (const row of rows) {
      if (row.length < 4) continue;
      const commodity = row[0];
      if (/commodity/i.test(commodity)) continue;
      insertSpot.run({
        id: stableId("mcx", commodity, row[2] ?? "India"),
        commodity,
        location: row[2] ?? "India",
        spotPrice: parseNumber(row[3]),
        upDown: row[4] ?? "",
        asOf: new Date().toISOString(),
        session: "public-page",
        updatedAt: isoNow(),
      });
      count += 1;
    }

    db.prepare(`
      INSERT INTO live_macro (id, source_key, metric, value, unit, as_of, notes, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        value = excluded.value,
        unit = excluded.unit,
        as_of = excluded.as_of,
        notes = excluded.notes,
        updated_at = excluded.updated_at
    `).run(
      stableId("mcxmacro", "historical_page_status"),
      "mcx",
      "historical_page_status",
      "available",
      "status",
      new Date().toISOString(),
      `Historical data page fetched successfully. ${histHtml.includes("Historical Data") ? "Official page confirmed." : "Historical page content parsed with fallback."}`,
      isoNow(),
    );

    upsertSourceRun({
      sourceKey: "mcx",
      status: "partial",
      message: `Captured ${count} public MCX spot rows and historical page status`,
      recordsCount: count,
      startedAt,
      finishedAt: isoNow(),
    });

    return {
      sourceKey: "mcx",
      status: "partial" as const,
      message: `Captured ${count} public MCX spot rows and historical page status`,
      recordsCount: count,
    };
  } catch (error) {
    upsertSourceRun({
      sourceKey: "mcx",
      status: "failed",
      message: error instanceof Error ? error.message : "MCX sync failed",
      recordsCount: 0,
      startedAt,
      finishedAt: isoNow(),
    });
    return {
      sourceKey: "mcx",
      status: "failed" as const,
      message: error instanceof Error ? error.message : "MCX sync failed",
      recordsCount: 0,
    };
  }
}
