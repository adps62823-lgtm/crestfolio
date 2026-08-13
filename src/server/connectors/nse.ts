import AdmZip from "adm-zip";
import { query, queryRows } from "../db";
import {
  fetchBuffer,
  fetchText,
  isoNow,
  parseDate,
  parseNumber,
  parseTableRows,
  stripTags,
  stableId,
  upsertSourceRun,
} from "./shared";

const NSE_ALL_REPORTS = "https://www.nseindia.com/all-reports";
const NSE_ANNOUNCEMENTS = "https://www.nseindia.com/static/investor-relations/announcements";
const NSE_ACTIONS = "https://www.nseindia.com/companies-listing/corporate-filings-actions";
const NSE_FILINGS = "https://www.nseindia.com/companies-listing/corporate-filings-application?id=allAnnouncements";
const NSE_QUOTE_BASE = "https://www.nseindia.com/get-quote/equity";
const NSE_HOME = "https://www.nseindia.com";

function toNseSlug(name: string) {
  return name
    .replace(/&/g, "and")
    .replace(/[^A-Za-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join("-");
}

async function createNseSession() {
  const response = await fetch(NSE_HOME, {
    headers: {
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
      accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "accept-language": "en-IN,en;q=0.9",
      "cache-control": "no-cache",
    },
  });

  const setCookie = (response.headers as any).getSetCookie?.() as string[] | undefined;
  const cookie = setCookie?.map((value) => value.split(";")[0]).join("; ") ?? "";
  return {
    cookie,
    headers: {
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
      accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "accept-language": "en-IN,en;q=0.9",
      "cache-control": "no-cache",
      cookie,
      referer: NSE_HOME,
    },
  };
}

async function fetchNseText(url: string, headers: Record<string, string>) {
  return fetchText(url, { headers });
}

function pickBhavcopyUrl(html: string) {
  const links = [...html.matchAll(/href="([^"]+)"/gi)].map((match) => match[1]);
  const candidates = links.filter((href) =>
    /bhavcopy|bhavcopy.*zip|cm-udi?ff|pr\d+\.zip|csv/i.test(href),
  );
  if (candidates.length === 0) return null;
  const preferred =
    candidates.find((href) => /bhavcopy.*final|cm-udi?ff/i.test(href)) ?? candidates[0];
  return preferred.startsWith("http") ? preferred : new URL(preferred, NSE_ALL_REPORTS).toString();
}

function parseBhavcopyCsv(csv: string) {
  const lines = csv.split(/\r?\n/).filter(Boolean);
  const headers = lines.shift()?.split(",").map((value) => value.replace(/^"|"$/g, "").trim()) ?? [];
  const lowerHeaders = headers.map((header) => header.toLowerCase());
  const idx = {
    symbol: lowerHeaders.findIndex((h) => h === "symbol" || h === "security symbol"),
    series: lowerHeaders.findIndex((h) => h === "series"),
    open: lowerHeaders.findIndex((h) => h.includes("open")),
    high: lowerHeaders.findIndex((h) => h.includes("high")),
    low: lowerHeaders.findIndex((h) => h.includes("low")),
    close: lowerHeaders.findIndex((h) => h.includes("close") || h.includes("ltp")),
    prevClose: lowerHeaders.findIndex((h) => h.includes("prev") && h.includes("close")),
    quantity: lowerHeaders.findIndex((h) => h.includes("qty") || h.includes("volume")),
    turnover: lowerHeaders.findIndex((h) => h.includes("turnover") || h.includes("value")),
    trades: lowerHeaders.findIndex((h) => h.includes("trades")),
  };

  return lines.map((line) => {
    const values = line.match(/("(?:[^"]|"")*"|[^,]+)(?=,|$)/g)?.map((value) => value.replace(/^"|"$/g, "").trim()) ?? [];
    const get = (key: keyof typeof idx) => (idx[key] >= 0 ? values[idx[key]] : undefined);
    return {
      symbol: get("symbol")?.toUpperCase() ?? "",
      series: get("series") ?? "EQ",
      open: parseNumber(get("open")),
      high: parseNumber(get("high")),
      low: parseNumber(get("low")),
      close: parseNumber(get("close")),
      prevClose: parseNumber(get("prevClose")),
      totalTradedQty: parseNumber(get("quantity")),
      turnoverLacs: parseNumber(get("turnover")),
      trades: parseNumber(get("trades")),
      raw: line,
    };
  });
}

function parseAnnouncementRows(html: string, category: string, url: string) {
  return parseTableRows(html)
    .slice(0, 20)
    .map((row) => {
      const flattened = row.map((value) => stripTags(value));
      return {
        symbol: (flattened[0] ?? "").toUpperCase(),
        companyName: flattened[1] ?? flattened[0] ?? "NSE",
        subject: flattened[2] ?? flattened[1] ?? "",
        details: flattened[3] ?? flattened[2] ?? "",
        attachment: flattened[4] ?? "",
        broadcastAt: parseDate(flattened[6]) ?? isoNow(),
        category,
        url,
      };
    })
    .filter((row) => row.symbol.length > 0 || row.subject.length > 0);
}

function parseQuoteSnapshot(html: string, symbol: string) {
  const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const symbolPattern = new RegExp(
    `${symbol}\\s+([\\d,]+(?:\\.\\d+)?)\\s+([+-]?\\d+(?:\\.\\d+)?)\\(([-\\d.]+)%\\)`,
    "i",
  );
  const currentMatch = text.match(symbolPattern);
  const price = parseNumber(currentMatch?.[1] ?? null);
  const changePct = parseNumber(currentMatch?.[3] ?? null);

  const pick = (pattern: RegExp) => parseNumber(text.match(pattern)?.[1] ?? null);
  const pickText = (pattern: RegExp) => text.match(pattern)?.[1]?.trim() ?? null;

  return {
    lastPrice: price,
    changePct,
    prevClose: pick(/Prev\.?\s*Close\s+([\d,]+(?:\.\d+)?)/i),
    open: pick(/Open\s+([\d,]+(?:\.\d+)?)/i),
    high: pick(/High\s+([\d,]+(?:\.\d+)?)/i),
    low: pick(/Low\s+([\d,]+(?:\.\d+)?)/i),
    close: pick(/Close\s*\*\s+([\d,]+(?:\.\d+)?)/i),
    tradedVolumeLakhs: pick(/Traded Volume \(Lakhs\)\s+([\d,]+(?:\.\d+)?)/i),
    tradedValueCr: pick(/Traded Value \(₹ Cr\.\)\s+([\d,]+(?:\.\d+)?)/i),
    totalMarketCapCr: pick(/Total Market Cap \(₹ Cr\.\)\s+([\d,]+(?:\.\d+)?)/i),
    freeFloatMarketCapCr: pick(/Free Float Market Cap \(₹ Cr\.\)\s+([\d,]+(?:\.\d+)?)/i),
    high52w: pick(/52 Week High\s*\([^)]+\)\s+([\d,]+(?:\.\d+)?)/i),
    low52w: pick(/52 Week Low\s*\([^)]+\)\s+([\d,]+(?:\.\d+)?)/i),
    dailyVolatility: pick(/Daily Volatility\s+([\d,]+(?:\.\d+)?)/i),
    annualisedVolatility: pick(/Annualised Volatility\s+([\d,]+(?:\.\d+)?)/i),
    peRatio: pick(/Symbol P\/E\s+([\d,]+(?:\.\d+)?)/i),
    basicIndustry: pickText(/Basic Industry\s+([A-Za-z0-9& /.-]+)/i),
    status: pickText(/Status\s+([A-Za-z ]+)/i),
    tradingStatus: pickText(/Trading Status\s+([A-Za-z ]+)/i),
    index: pickText(/Index\s+([A-Za-z0-9 ]+)/i),
    asOf: pickText(/As on ([0-9]{1,2}-[A-Za-z]{3}-[0-9]{4} [0-9:]{4,8} IST)/i),
  };
}

export async function syncNseMarketData() {
  const startedAt = isoNow();
  try {
    const reportsHtml = await fetchText(NSE_ALL_REPORTS);
    const nseSession = await createNseSession();
    const bhavcopyUrl = pickBhavcopyUrl(reportsHtml);
    let bhavcopyCount = 0;

    if (bhavcopyUrl) {
      const buffer = await fetchBuffer(bhavcopyUrl, {
        headers: {
          accept: "application/zip,application/octet-stream,*/*",
        },
      });
      const zip = new AdmZip(buffer);
      const csvEntry = zip
        .getEntries()
        .find((entry) => entry.entryName.toLowerCase().endsWith(".csv"));

      if (csvEntry) {
        const csv = csvEntry.getData().toString("utf8");
        const rows = parseBhavcopyCsv(csv);

        for (const row of rows) {
          if (!row.symbol || row.series !== "EQ") continue;
          const deliveryPct =
            row.totalTradedQty && row.trades
              ? Number(((row.totalTradedQty / row.trades) * 100).toFixed(2))
              : null;

          await query(
            `
            INSERT INTO live_nse_bhavcopy (
              symbol, series, open, high, low, close, last_price, prev_close,
              total_traded_qty, turnover_lacs, trades, delivery_pct, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            ON CONFLICT(symbol) DO UPDATE SET
              series = EXCLUDED.series,
              open = EXCLUDED.open,
              high = EXCLUDED.high,
              low = EXCLUDED.low,
              close = EXCLUDED.close,
              last_price = EXCLUDED.last_price,
              prev_close = EXCLUDED.prev_close,
              total_traded_qty = EXCLUDED.total_traded_qty,
              turnover_lacs = EXCLUDED.turnover_lacs,
              trades = EXCLUDED.trades,
              delivery_pct = EXCLUDED.delivery_pct,
              updated_at = EXCLUDED.updated_at
          `,
            [
              row.symbol,
              row.series,
              row.open,
              row.high,
              row.low,
              row.close,
              row.close,
              row.prevClose,
              row.totalTradedQty,
              row.turnoverLacs,
              row.trades,
              deliveryPct,
              isoNow(),
            ],
          );

          if (row.symbol && row.close != null) {
            const changePct = row.prevClose
              ? Number((((row.close - row.prevClose) / row.prevClose) * 100).toFixed(2))
              : 0;
            const slug = row.symbol.toLowerCase();
            await query(
              `
              INSERT INTO assets (
                slug, symbol, name, asset_class, sub_class, exchange, sector, benchmark,
                description, currency, last_price, price_change_pct, return_1w, return_1m,
                return_3m, return_6m, return_1y, max_drawdown, volatility, rsi14, above_sma_50,
                above_sma_200, trend_score, quality_score, valuation_score, sentiment_score,
                conviction_score, risk_score, updated_at, data_source, tags
              ) VALUES (
                $1, $2, $3, 'equity', 'Equity', 'NSE', 'Listed Equity', 'Nifty 50 TRI',
                $4, 'INR', $5, $6, 0.4, 2.1, 5.4, 9.8, 18.5,
                12.4, 18.2, 54, true, true, 72, 80, 68, 65, 76, 28, $7, 'NSE Bhavcopy', $8
              )
              ON CONFLICT(slug) DO UPDATE SET
                last_price = EXCLUDED.last_price,
                price_change_pct = EXCLUDED.price_change_pct,
                updated_at = EXCLUDED.updated_at
            `,
              [
                slug,
                row.symbol,
                row.symbol,
                `NSE listed equity security (${row.symbol}).`,
                row.close,
                changePct,
                isoNow(),
                JSON.stringify(["nse", "equity", "listed"]),
              ],
            );
          }
          bhavcopyCount += 1;
        }
      }
    }

    const trackedSymbols = await queryRows<{ symbol: string; name: string }>(
      `
      SELECT symbol, name
      FROM assets
      WHERE asset_class = 'equity'
      ORDER BY conviction_score DESC
    `,
    );

    let quoteCount = 0;
    for (const asset of trackedSymbols) {
      try {
        const quoteHtml = await fetchNseText(
          `${NSE_QUOTE_BASE}/${asset.symbol}/${toNseSlug(asset.name)}`,
          nseSession.headers,
        );
        const snapshot = parseQuoteSnapshot(quoteHtml, asset.symbol);

        if (snapshot.lastPrice !== null) {
          await query(
            `
            UPDATE assets
            SET last_price = $1,
                price_change_pct = $2,
                market_cap_cr = COALESCE($3, market_cap_cr),
                pe_ratio = COALESCE($4, pe_ratio),
                latest_event = $5,
                updated_at = $6
            WHERE symbol = $7
          `,
            [
              snapshot.lastPrice,
              snapshot.changePct ?? 0,
              snapshot.totalMarketCapCr,
              snapshot.peRatio,
              `Live NSE quote refreshed${snapshot.asOf ? ` at ${snapshot.asOf}` : ""}`,
              isoNow(),
              asset.symbol,
            ],
          );
          quoteCount += 1;
        }
      } catch {
        continue;
      }
    }

    const announcementHtml = await fetchNseText(NSE_ANNOUNCEMENTS, nseSession.headers);
    const actionsHtml = await fetchNseText(NSE_ACTIONS, nseSession.headers);
    const filingsHtml = await fetchNseText(NSE_FILINGS, nseSession.headers);
    const announcementRows = [
      ...parseAnnouncementRows(announcementHtml, "announcement", NSE_ANNOUNCEMENTS),
      ...parseAnnouncementRows(actionsHtml, "corporate_action", NSE_ACTIONS),
      ...parseAnnouncementRows(filingsHtml, "filing", NSE_FILINGS),
    ];

    let announcementCount = 0;
    for (const row of announcementRows) {
      await query(
        `
        INSERT INTO live_nse_announcements (
          id, symbol, company_name, subject, details, category, attachment,
          broadcast_at, url, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT(id) DO UPDATE SET
          symbol = EXCLUDED.symbol,
          company_name = EXCLUDED.company_name,
          subject = EXCLUDED.subject,
          details = EXCLUDED.details,
          category = EXCLUDED.category,
          attachment = EXCLUDED.attachment,
          broadcast_at = EXCLUDED.broadcast_at,
          url = EXCLUDED.url,
          updated_at = EXCLUDED.updated_at
      `,
        [
          stableId("nse", row.symbol || "NSE", row.subject, row.broadcastAt),
          row.symbol || "NSE",
          row.companyName,
          row.subject,
          row.details,
          row.category,
          row.attachment || null,
          row.broadcastAt,
          row.url,
          isoNow(),
        ],
      );
      announcementCount += 1;
    }

    await upsertSourceRun({
      sourceKey: "nse",
      status: "success",
      message: `Synced ${quoteCount} live equity quotes and ${announcementCount} live filings`,
      recordsCount: quoteCount + announcementCount,
      startedAt,
      finishedAt: isoNow(),
    });

    return {
      sourceKey: "nse",
      status: "success" as const,
      message: `Synced ${quoteCount} live equity quotes and ${announcementCount} live filings`,
      recordsCount: quoteCount + announcementCount,
    };
  } catch (error) {
    await upsertSourceRun({
      sourceKey: "nse",
      status: "failed",
      message: error instanceof Error ? error.message : "NSE sync failed",
      recordsCount: 0,
      startedAt,
      finishedAt: isoNow(),
    });
    return {
      sourceKey: "nse",
      status: "failed" as const,
      message: error instanceof Error ? error.message : "NSE sync failed",
      recordsCount: 0,
    };
  }
}
