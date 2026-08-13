import https from "node:https";
import { query } from "../db";
import { isoNow, stableId, upsertSourceRun } from "./shared";

const MOSPI_CPI = "https://cpi.mospi.gov.in/";
const MOSPI_DASHBOARD = "https://www.mospi.gov.in/dashboard/dashboard/cpi";

function fetchInsecureText(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const request = https.get(
      url,
      {
        headers: {
          "user-agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
          accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
        rejectUnauthorized: false,
      },
      (response) => {
        const status = response.statusCode ?? 0;
        if (status >= 300 && status < 400 && response.headers.location) {
          const redirectUrl = new URL(response.headers.location, url).toString();
          response.resume();
          resolve(fetchInsecureText(redirectUrl));
          return;
        }

        if (status >= 400) {
          const error = new Error(`MoSPI request failed with status ${status}`);
          response.resume();
          reject(error);
          return;
        }

        const chunks: Buffer[] = [];
        response.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
        response.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
      },
    );

    request.on("error", reject);
  });
}

export async function syncMospiCpi() {
  const startedAt = isoNow();
  try {
    const [cpiHtml, dashboardHtml] = await Promise.all([
      fetchInsecureText(MOSPI_CPI),
      fetchInsecureText(MOSPI_DASHBOARD),
    ]);
    const combined = `${cpiHtml} ${dashboardHtml}`.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");

    const upsertMacro = async (
      id: string,
      sourceKey: string,
      metric: string,
      value: string,
      unit: string,
      asOf: string,
      notes: string,
      updatedAt: string,
    ) => {
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
        [id, sourceKey, metric, value, unit, asOf, notes, updatedAt],
      );
    };

    const inflation =
      combined.match(/inflation[^%]{0,120}?(\d+(?:\.\d+)?)\s*%/i)?.[1] ??
      combined.match(/CPI[^%]{0,80}?(\d+(?:\.\d+)?)\s*%/i)?.[1] ??
      null;

    const foodInflation =
      combined.match(/food inflation[^%]{0,120}?(\d+(?:\.\d+)?)\s*%/i)?.[1] ??
      combined.match(/CFPI[^%]{0,80}?(\d+(?:\.\d+)?)\s*%/i)?.[1] ??
      null;

    let count = 0;
    if (inflation) {
      await upsertMacro(
        stableId("mospi", "cpi_general"),
        "mospi",
        "cpi_general",
        inflation,
        "%",
        new Date().toISOString(),
        "Captured from official CPI dashboard text snapshot",
        isoNow(),
      );
      count += 1;
    }
    if (foodInflation) {
      await upsertMacro(
        stableId("mospi", "cpi_food"),
        "mospi",
        "cpi_food",
        foodInflation,
        "%",
        new Date().toISOString(),
        "Captured from official CPI dashboard text snapshot",
        isoNow(),
      );
      count += 1;
    }

    await upsertMacro(
      stableId("mospi", "dashboard_snapshot"),
      "mospi",
      "dashboard_snapshot",
      "available",
      "status",
      new Date().toISOString(),
      "Official MoSPI CPI dashboard page accessible for live tracking",
      isoNow(),
    );
    count += 1;

    await upsertSourceRun({
      sourceKey: "mospi",
      status: inflation || foodInflation ? "success" : "partial",
      message:
        inflation || foodInflation
          ? `Captured CPI snapshot${foodInflation ? " and food inflation" : ""}`
          : "Dashboard accessible, but live inflation figure was not extracted",
      recordsCount: count,
      startedAt,
      finishedAt: isoNow(),
    });

    return {
      sourceKey: "mospi",
      status: inflation || foodInflation ? "success" : "partial",
      message:
        inflation || foodInflation
          ? `Captured CPI snapshot${foodInflation ? " and food inflation" : ""}`
          : "Dashboard accessible, but live inflation figure was not extracted",
      recordsCount: count,
    };
  } catch (error) {
    await upsertSourceRun({
      sourceKey: "mospi",
      status: "failed",
      message: error instanceof Error ? error.message : "MoSPI sync failed",
      recordsCount: 0,
      startedAt,
      finishedAt: isoNow(),
    });
    return {
      sourceKey: "mospi",
      status: "failed" as const,
      message: error instanceof Error ? error.message : "MoSPI sync failed",
      recordsCount: 0,
    };
  }
}
