// Utility 10 — Free Telegram / WhatsApp(Discord) Webhook Alert Dispatcher
// WhatsApp's own Business API is not free/self-serve, so this uses the
// two genuinely zero-cost webhook channels: Telegram Bot API and Discord
// Incoming Webhooks. Both need only a token/URL you generate yourself —
// no paid plan.
import { getDb } from "../db";
import { randomUUID } from "node:crypto";
import type { AlertBriefing } from "@/lib/types";

interface BriefingInputs {
  smaCrosses: { symbol: string; type: "above" | "below"; sma: 50 | 200 }[];
  navUpdates: number;
  topGainer?: { symbol: string; pct: number };
  topLoser?: { symbol: string; pct: number };
  sectorFlow?: { sector: string; direction: "inflow" | "outflow" };
}

export function buildBriefingBullets(inputs: BriefingInputs): string[] {
  const bullets: string[] = [];
  if (inputs.smaCrosses.length > 0) {
    const above = inputs.smaCrosses.filter((c) => c.type === "above").length;
    bullets.push(`${inputs.smaCrosses.length} watchlist stocks crossed a key SMA today (${above} above, ${inputs.smaCrosses.length - above} below).`);
  }
  bullets.push(`${inputs.navUpdates} mutual fund NAVs updated in today's AMFI sync.`);
  if (inputs.topGainer) bullets.push(`Top gainer: ${inputs.topGainer.symbol} +${inputs.topGainer.pct.toFixed(2)}%.`);
  if (inputs.topLoser) bullets.push(`Top loser: ${inputs.topLoser.symbol} ${inputs.topLoser.pct.toFixed(2)}%.`);
  if (inputs.sectorFlow) bullets.push(`Money flow: ${inputs.sectorFlow.direction === "inflow" ? "into" : "out of"} ${inputs.sectorFlow.sector} this week.`);
  return bullets.slice(0, 5);
}

export async function dispatchBriefing(bullets: string[]): Promise<AlertBriefing> {
  const date = new Date().toISOString().slice(0, 10);
  const message = `*Crestfolio Post-Market Briefing — ${date}*\n\n${bullets.map((b) => `• ${b}`).join("\n")}`;
  const dispatchedTo: ("telegram" | "discord")[] = [];

  if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
    const res = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: process.env.TELEGRAM_CHAT_ID, text: message, parse_mode: "Markdown" }),
    });
    if (res.ok) dispatchedTo.push("telegram");
    else console.error("[alerts] Telegram dispatch failed", await res.text());
  }
  if (process.env.DISCORD_WEBHOOK_URL) {
    const res = await fetch(process.env.DISCORD_WEBHOOK_URL, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: message }),
    });
    if (res.ok) dispatchedTo.push("discord");
    else console.error("[alerts] Discord dispatch failed", await res.text());
  }

  const briefing: AlertBriefing = { date, bullets, dispatchedTo, dispatchedAt: dispatchedTo.length ? new Date().toISOString() : null };
  const db = getDb();
  db.prepare(`INSERT INTO alert_log (id, date, bullets, dispatched_to, dispatched_at) VALUES (@id, @date, @bullets, @dispatchedTo, @dispatchedAt)`)
    .run({ id: randomUUID(), date, bullets: JSON.stringify(bullets), dispatchedTo: JSON.stringify(dispatchedTo), dispatchedAt: briefing.dispatchedAt });
  return briefing;
}
