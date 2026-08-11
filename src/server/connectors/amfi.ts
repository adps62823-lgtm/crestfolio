import { getDb } from "../db";
import { fetchText, isoNow, upsertSourceRun } from "./shared";

const AMFI_NAV_URL = "https://www.amfiindia.com/spages/NAVAll.txt";

function categorizeScheme(name: string) {
  const lower = name.toLowerCase();
  if (lower.includes("liquid")) return ["Debt", "Liquid"] as const;
  if (lower.includes("overnight")) return ["Debt", "Overnight"] as const;
  if (lower.includes("index")) return ["Equity", "Index Fund"] as const;
  if (lower.includes("large cap")) return ["Equity", "Large Cap"] as const;
  if (lower.includes("mid cap")) return ["Equity", "Mid Cap"] as const;
  if (lower.includes("small cap")) return ["Equity", "Small Cap"] as const;
  if (lower.includes("flexi cap")) return ["Equity", "Flexi Cap"] as const;
  if (lower.includes("multi cap")) return ["Equity", "Multi Cap"] as const;
  if (lower.includes("hybrid")) return ["Hybrid", "Hybrid"] as const;
  if (lower.includes("gold")) return ["Commodity", "Gold"] as const;
  if (lower.includes("debt") || lower.includes("bond")) return ["Debt", "Debt"] as const;
  return ["Other", "Other"] as const;
}

export async function syncAmfiNavs() {
  const startedAt = isoNow();
  try {
    const text = await fetchText(AMFI_NAV_URL);
    const lines = text.split(/\r?\n/).filter(Boolean);
    const db = getDb();
    const statement = db.prepare(`
      INSERT INTO live_mf_nav (
        scheme_code, scheme_name, amc, category, sub_category, nav, nav_date, raw_line, updated_at
      ) VALUES (
        @schemeCode, @schemeName, @amc, @category, @subCategory, @nav, @navDate, @rawLine, @updatedAt
      )
      ON CONFLICT(scheme_code) DO UPDATE SET
        scheme_name = excluded.scheme_name,
        amc = excluded.amc,
        category = excluded.category,
        sub_category = excluded.sub_category,
        nav = excluded.nav,
        nav_date = excluded.nav_date,
        raw_line = excluded.raw_line,
        updated_at = excluded.updated_at
    `);

    let count = 0;
    for (const line of lines) {
      if (!line.includes(";")) continue;
      const parts = line.split(";");
      if (parts.length < 6) continue;
      const schemeCode = parts[0]?.trim();
      const schemeName = parts[3]?.trim();
      const nav = Number.parseFloat(parts[5]?.trim() ?? "");
      if (!schemeCode || !schemeName) continue;
      const [category, subCategory] = categorizeScheme(schemeName);

      statement.run({
        schemeCode,
        schemeName,
        amc: schemeName.split(" - ")[0] ?? "AMFI",
        category,
        subCategory,
        nav: Number.isFinite(nav) ? nav : null,
        navDate: parts[4]?.trim() ?? null,
        rawLine: line,
        updatedAt: isoNow(),
      });
      count += 1;
    }

    upsertSourceRun({
      sourceKey: "amfi",
      status: "success",
      message: `Synced ${count} NAV rows from AMFI NAVAll.txt`,
      recordsCount: count,
      startedAt,
      finishedAt: isoNow(),
    });

    return { sourceKey: "amfi", status: "success" as const, message: `Synced ${count} NAV rows`, recordsCount: count };
  } catch (error) {
    upsertSourceRun({
      sourceKey: "amfi",
      status: "failed",
      message: error instanceof Error ? error.message : "AMFI sync failed",
      recordsCount: 0,
      startedAt,
      finishedAt: isoNow(),
    });
    return { sourceKey: "amfi", status: "failed" as const, message: error instanceof Error ? error.message : "AMFI sync failed", recordsCount: 0 };
  }
}
