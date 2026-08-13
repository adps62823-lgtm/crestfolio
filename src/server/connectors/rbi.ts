import { query } from "../db";
import { fetchText, isoNow, parseNumber, stableId, upsertSourceRun } from "./shared";

const RBI_CURRENT = "https://m.rbi.org.in/scripts/bs_viewcontent.aspx?Id=426";

export async function syncRbiRates() {
  const startedAt = isoNow();
  try {
    const html = await fetchText(RBI_CURRENT);
    const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");

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
          stableId("rbi", metric),
          "rbi",
          metric,
          value,
          unit,
          new Date().toISOString(),
          "Current RBI rates page snapshot",
          isoNow(),
        ],
      );
      count += 1;
    }

    const usdInrVal = parseNumber(text.match(/INR \/ 1 USD\s*\|\s*:\s*([\d.]+)/i)?.[1]) ?? 0;
    if (usdInrVal > 0) {
      await query(
        `
        UPDATE assets
        SET last_price = $1, updated_at = $2
        WHERE symbol = 'USDINR'
      `,
        [usdInrVal, isoNow()],
      );
    }

    await upsertSourceRun({
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
    await upsertSourceRun({
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
