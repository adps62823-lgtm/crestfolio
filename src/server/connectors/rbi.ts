import { getDb } from "../db";
import { fetchText, isoNow, parseNumber, stableId, upsertSourceRun } from "./shared";

const RBI_CURRENT = "https://m.rbi.org.in/scripts/bs_viewcontent.aspx?Id=426";

function matchValue(text: string, label: RegExp) {
  const match = text.match(label);
  if (!match) return null;
  return parseNumber(match[1]);
}

export async function syncRbiRates() {
  const startedAt = isoNow();
  try {
    const html = await fetchText(RBI_CURRENT);
    const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
    const db = getDb();
    const insertMacro = db.prepare(`
      INSERT INTO live_macro (id, source_key, metric, value, unit, as_of, notes, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        value = excluded.value,
        unit = excluded.unit,
        as_of = excluded.as_of,
        notes = excluded.notes,
        updated_at = excluded.updated_at
    `);

    const metrics = [
      ["policy_repo_rate", /Repo Rate\s*\|\s*:\s*([\d.]+)/i, "%"],
      ["sdf_rate", /Standing Deposit Facility Rate\s*\|\s*:\s*([\d.]+)/i, "%"],
      ["msf_rate", /Marginal Standing Facility Rate\s*\|\s*:\s*([\d.]+)/i, "%"],
      ["bank_rate", /Bank Rate\s*\|\s*:\s*([\d.]+)/i, "%"],
      ["usd_inr", /INR \/ 1 USD\s*\|\s*:\s*([\d.]+)/i, "INR"],
      ["gbp_inr", /INR \/ 1 GBP\s*\|\s*:\s*([\d.]+)/i, "INR"],
      ["eur_inr", /INR \/ 1 EUR\s*\|\s*:\s*([\d.]+)/i, "INR"],
      ["gsec_10y", /6\.94% GS 2036\s*\|\s*:\s*([\d.]+)/i, "%"],
      ["tbill_91d", /91 day T-bills\s*\|\s*:\s*([\d.]+)/i, "%"],
      ["tbill_182d", /182 day T-bills\s*\|\s*:\s*([\d.]+)/i, "%"],
      ["tbill_364d", /364 day T-bills\s*\|\s*:\s*([\d.]+)/i, "%"],
    ] as const;

    let count = 0;
    for (const [metric, regex, unit] of metrics) {
      const value = text.match(regex)?.[1];
      if (!value) continue;
      insertMacro.run(
        stableId("rbi", metric),
        "rbi",
        metric,
        value,
        unit,
        new Date().toISOString(),
        "Current RBI rates page snapshot",
        isoNow(),
      );
      count += 1;
    }

    db.prepare(`
      UPDATE assets
      SET last_price = ?, updated_at = ?
      WHERE symbol = 'USDINR'
    `).run(parseNumber(text.match(/INR \/ 1 USD\s*\|\s*:\s*([\d.]+)/i)?.[1]) ?? 0, isoNow());

    upsertSourceRun({
      sourceKey: "rbi",
      status: "success",
      message: `Captured ${count} RBI market metrics`,
      recordsCount: count,
      startedAt,
      finishedAt: isoNow(),
    });

    return {
      sourceKey: "rbi",
      status: "success" as const,
      message: `Captured ${count} RBI market metrics`,
      recordsCount: count,
    };
  } catch (error) {
    upsertSourceRun({
      sourceKey: "rbi",
      status: "failed",
      message: error instanceof Error ? error.message : "RBI sync failed",
      recordsCount: 0,
      startedAt,
      finishedAt: isoNow(),
    });
    return {
      sourceKey: "rbi",
      status: "failed" as const,
      message: error instanceof Error ? error.message : "RBI sync failed",
      recordsCount: 0,
    };
  }
}
