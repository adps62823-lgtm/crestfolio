import { queryOne } from "../src/server/db";
import { buildBriefingBullets, dispatchBriefing } from "../src/server/utilities/alerts";

(async () => {
  const today = new Date().toISOString().slice(0, 10);
  const row = await queryOne<{ c: string | number }>(`SELECT COUNT(*) as c FROM price_bars WHERE bar_date = $1`, [today]);
  const navUpdates = row ? Number(row.c) : 0;

  const bullets = buildBriefingBullets({ smaCrosses: [], navUpdates });
  const result = await dispatchBriefing(bullets);
  if (result.dispatchedTo.length === 0) {
    console.log("No TELEGRAM_BOT_TOKEN/TELEGRAM_CHAT_ID or DISCORD_WEBHOOK_URL configured — briefing was logged but not sent. See .env.example.");
  } else {
    console.log(`✓ Briefing dispatched to: ${result.dispatchedTo.join(", ")}`);
  }
})();
