// ─────────────────────────────────────────────────────────────────────────
// News Connector — free public RSS feeds from major Indian financial media.
// No API key required. Sentiment scoring happens in server/ai.ts (lexicon
// fallback) or via the configured LLM if available.
// ─────────────────────────────────────────────────────────────────────────
import Parser from "rss-parser";
import { getDb } from "../db";
import { scoreSentiment } from "../ai";
import { randomUUID } from "node:crypto";

const FEEDS: { source: string; url: string }[] = [
  { source: "Moneycontrol Markets", url: "https://www.moneycontrol.com/rss/marketreports.xml" },
  { source: "Economic Times Markets", url: "https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms" },
  { source: "LiveMint Markets", url: "https://www.livemint.com/rss/markets" },
  { source: "Business Standard Markets", url: "https://www.business-standard.com/rss/markets-106.rss" },
];

const parser = new Parser();

export async function fetchAllNewsFeeds() {
  const results: { source: string; items: Parser.Item[] }[] = [];
  for (const feed of FEEDS) {
    try {
      const parsed = await parser.parseURL(feed.url);
      results.push({ source: feed.source, items: parsed.items });
    } catch (err) {
      // Per-feed failure shouldn't kill the whole sync — one dead RSS URL
      // (media orgs change these more often than exchanges) just gets skipped.
      console.error(`[news] feed failed: ${feed.source}`, err instanceof Error ? err.message : err);
    }
  }
  return results;
}

function extractSymbols(title: string, knownSymbols: string[]): string[] {
  const upper = title.toUpperCase();
  return knownSymbols.filter((sym) => upper.includes(sym.toUpperCase()));
}

export async function syncNews(knownSymbols: string[] = []) {
  const db = getDb();
  const feedResults = await fetchAllNewsFeeds();
  const insert = db.prepare(`
    INSERT OR IGNORE INTO news_items
      (id, source, title, link, published_at, related_symbols, sentiment_score, sentiment_label, impact_tag)
    VALUES (@id, @source, @title, @link, @publishedAt, @relatedSymbols, @score, @label, @impact)
  `);
  let count = 0;
  const txn = db.transaction(() => {
    for (const feed of feedResults) {
      for (const item of feed.items) {
        if (!item.title || !item.link) continue;
        const sentiment = scoreSentiment(item.title + " " + (item.contentSnippet || ""));
        const related = extractSymbols(item.title, knownSymbols);
        insert.run({
          id: randomUUID(),
          source: feed.source,
          title: item.title,
          link: item.link,
          publishedAt: item.isoDate || item.pubDate || new Date().toISOString(),
          relatedSymbols: JSON.stringify(related),
          score: sentiment.score,
          label: sentiment.label,
          impact: related.length > 0 ? "high" : "low",
        });
        count++;
      }
    }
  });
  txn();
  return count;
}
