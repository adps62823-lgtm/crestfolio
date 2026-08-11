import { NextResponse } from "next/server";
import { getSettings } from "@/server/repository";
import { getDb } from "@/server/db";

export async function GET() {
  const settings = await getSettings();
  return NextResponse.json(settings);
}

export async function PATCH(request: Request) {
  const body = (await request.json()) as Record<string, string>;
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO settings (key, value)
    VALUES (?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value
  `);

  Object.entries(body).forEach(([key, value]) => stmt.run(key, value));
  const settings = await getSettings();
  return NextResponse.json(settings);
}
