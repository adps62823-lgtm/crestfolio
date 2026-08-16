import { ensureSchema } from "../src/server/db";

(async () => {
  await ensureSchema();
  console.log("✓ PostgreSQL schema initialized for Supabase");
})();
