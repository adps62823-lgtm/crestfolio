import AdmZip from "adm-zip";
import { getDb } from "../db";
import {
  fetchBuffer,
  fetchText,
  isoNow,
  makeId,
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
    const db = getDb();

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
        const insertBhavcopy = db.prepare(`
          INSERT INTO live_nse_bhavcopy (
            symbol, series, open, high, low, close, last_price, prev_close,
            total_traded_qty, turnover_lacs, trades, delivery_pct, updated_at
          ) VALUES (
            @symbol, @series, @open, @high, @low, @close, @lastPrice, @prevClose,
            @totalTradedQty, @turnoverLacs, @trades, @deliveryPct, @updatedAt
          )
          ON CONFLICT(symbol) DO UPDATE SET
            series = excluded.series,
            open = excluded.open,
            high = excluded.high,
            low = excluded.low,
            close = excluded.close,
            last_price = excluded.last_price,
            prev_close = excluded.prev_close,
            total_traded_qty = excluded.total_traded_qty,
            turnover_lacs = excluded.turnover_lacs,
            trades = excluded.trades,
            delivery_pct = excluded.delivery_pct,
            updated_at = excluded.updated_at
        `);
        const updateAsset = db.prepare(`
          UPDATE assets
          SET last_price = ?, price_change_pct = ?, updated_at = ?
          WHERE symbol = ?
        `);

        for (const row of rows) {
          if (!row.symbol) continue;
          const deliveryPct = row.totalTradedQty && row.trades ? Number(((row.totalTradedQty / row.trades) * 100).toFixed(2)) : null;
          insertBhavcopy.run({
            symbol: row.symbol,
            series: row.series,
            open: row.open,
            high: row.high,
            low: row.low,
            close: row.close,
            lastPrice: row.close,
            prevClose: row.prevClose,
            totalTradedQty: row.totalTradedQty,
            turnoverLacs: row.turnoverLacs,
            trades: row.trades,
            deliveryPct,
            updatedAt: isoNow(),
          });

          if (row.symbol && row.close != null && row.prevClose != null) {
            const changePct = row.prevClose === 0 ? 0 : Number((((row.close - row.prevClose) / row.prevClose) * 100).toFixed(2));
            updateAsset.run(row.close, changePct, isoNow(), row.symbol);
          }
          bhavcopyCount += 1;
        }
      }
    }

    const trackedSymbols = db
      .prepare(
        `
        SELECT symbol, name
        FROM assets
        WHERE asset_class = 'equity'
        ORDER BY conviction_score DESC
      `,
      )
      .all() as Array<{ symbol: string; name: string }>;

    let quoteCount = 0;
    const updateQuoteAsset = db.prepare(`
      UPDATE assets
      SET last_price = ?,
          price_change_pct = ?,
          market_cap_cr = COALESCE(?, market_cap_cr),
          pe_ratio = COALESCE(?, pe_ratio),
          latest_event = ?,
          updated_at = ?
      WHERE symbol = ?
    `);

    for (const asset of trackedSymbols) {
      try {
        const quoteHtml = await fetchNseText(
          `${NSE_QUOTE_BASE}/${asset.symbol}/${toNseSlug(asset.name)}`,
          nseSession.headers,
        );
        const snapshot = parseQuoteSnapshot(quoteHtml, asset.symbol);

        if (snapshot.lastPrice !== null) {
          updateQuoteAsset.run(
            snapshot.lastPrice,
            snapshot.changePct ?? 0,
            snapshot.totalMarketCapCr,
            snapshot.peRatio,
            `Live NSE quote refreshed${snapshot.asOf ? ` at ${snapshot.asOf}` : ""}`,
            isoNow(),
            asset.symbol,
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

    const insertAnnouncement = db.prepare(`
      INSERT INTO live_nse_announcements (
        id, symbol, company_name, subject, details, category, attachment,
        broadcast_at, url, updated_at
      ) VALUES (
        @id, @symbol, @companyName, @subject, @details, @category, @attachment,
        @broadcastAt, @url, @updatedAt
      )
      ON CONFLICT(id) DO UPDATE SET
        symbol = excluded.symbol,
        company_name = excluded.company_name,
        subject = excluded.subject,
        details = excluded.details,
        category = excluded.category,
        attachment = excluded.attachment,
        broadcast_at = excluded.broadcast_at,
        url = excluded.url,
        updated_at = excluded.updated_at
    `);

    let announcementCount = 0;
    for (const row of announcementRows) {
      insertAnnouncement.run({
        id: stableId("nse", row.symbol || "NSE", row.subject, row.broadcastAt),
        symbol: row.symbol || "NSE",
        companyName: row.companyName,
        subject: row.subject,
        details: row.details,
        category: row.category,
        attachment: row.attachment || null,
        broadcastAt: row.broadcastAt,
        url: row.url,
        updatedAt: isoNow(),
      });
      announcementCount += 1;
    }

    upsertSourceRun({
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
    upsertSourceRun({
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
