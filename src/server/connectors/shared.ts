import { createHash, randomUUID } from "node:crypto";
import { query } from "../db";

export type SyncOutcome = {
  sourceKey: string;
  status: "success" | "partial" | "failed";
  message: string;
  recordsCount: number;
};

const DEFAULT_HEADERS = {
  "user-agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
};

export function makeId(prefix: string) {
  return `${prefix}_${randomUUID()}`;
}

export function stableId(prefix: string, ...parts: string[]) {
  const digest = createHash("sha1").update(parts.join("|")).digest("hex").slice(0, 16);
  return `${prefix}_${digest}`;
}

export async function fetchText(url: string, init: RequestInit = {}) {
  const response = await fetch(url, {
    ...init,
    headers: {
      ...DEFAULT_HEADERS,
      ...(init.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Request failed for ${url}: ${response.status} ${response.statusText}`);
  }

  return response.text();
}

export async function fetchBuffer(url: string, init: RequestInit = {}) {
  const response = await fetch(url, {
    ...init,
    headers: {
      ...DEFAULT_HEADERS,
      ...(init.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Request failed for ${url}: ${response.status} ${response.statusText}`);
  }

  return Buffer.from(await response.arrayBuffer());
}

export function stripTags(input: string) {
  return input
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

export function parseTableRows(html: string) {
  const rows: string[][] = [];
  const rowMatches = [...html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)];
  for (const rowMatch of rowMatches) {
    const cells = [...rowMatch[1].matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)].map((cell) =>
      stripTags(cell[1]),
    );
    if (cells.length > 0) rows.push(cells);
  }
  return rows;
}

export function parseNumber(value: string | undefined | null) {
  if (!value) return null;
  const normalized = value.replace(/,/g, "").replace(/[^0-9.\-]/g, "");
  if (!normalized) return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

export function parseDate(value: string | undefined | null) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
}

export async function upsertSourceRun(run: {
  sourceKey: string;
  status: "success" | "partial" | "failed";
  message: string;
  recordsCount: number;
  startedAt: string;
  finishedAt: string;
}) {
  await query(
    `
      INSERT INTO source_runs (id, source_key, started_at, finished_at, status, message, records_count)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `,
    [
      makeId("run"),
      run.sourceKey,
      run.startedAt,
      run.finishedAt,
      run.status,
      run.message,
      run.recordsCount,
    ],
  );
}

export function isoNow() {
  return new Date().toISOString();
}
