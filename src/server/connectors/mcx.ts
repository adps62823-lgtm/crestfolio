import { query } from "../db";
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
    const rows = parseTableRows(spotHtml);
    let count = 0;
    for (const row of rows) {
      if (row.length < 4) continue;
      const commodity = row[0];
      if (/commodity/i.test(commodity)) continue;
      const id = stableId("mcx", commodity, row[2] ?? "India");
      const location = row[2] ?? "India";
      const spotPrice = parseNumber(row[3]);
      const upDown = row[4] ?? "";
      const asOf = new Date().toISOString();
      const session = "public-page";
      const updatedAt = isoNow();

      await query(
        `
        INSERT INTO live_mcx_spot (
          id, commodity, location, spot_price, up_down, as_of, session, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT(id) DO UPDATE SET
          commodity = EXCLUDED.commodity,
          location = EXCLUDED.location,
          spot_price = EXCLUDED.spot_price,
          up_down = EXCLUDED.up_down,
          as_of = EXCLUDED.as_of,
          session = EXCLUDED.session,
          updated_at = EXCLUDED.updated_at
      `,
        [id, commodity, location, spotPrice, upDown, asOf, session, updatedAt],
      );
      count += 1;
    }

    await query(
      `
      INSERT INTO live_macro (id, source_key, metric, value, unit, as_of, notes, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT(id) DO UPDATE SET
        value = EXCLUDED.value,
        unit = EXCLUDED.unit,
        as_of = EXCLUDED.as_of,
        notes = EXCLUDED.notes,
        updated_at = EXCLUDED.updated_at
    `,
      [
        stableId("mcxmacro", "historical_page_status"),
        "mcx",
        "historical_page_status",
        "available",
        "status",
        new Date().toISOString(),
        `Historical data page fetched successfully. ${histHtml.includes("Historical Data") ? "Official page confirmed." : "Historical page content parsed with fallback."}`,
        isoNow(),
      ],
    );

    await upsertSourceRun({
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
    await upsertSourceRun({
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
