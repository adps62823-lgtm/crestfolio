import { NextResponse } from "next/server";
import { getSettings } from "@/server/repository";
import { query } from "@/server/db";

export async function GET() {
  const settings = await getSettings();
  return NextResponse.json(settings);
}

export async function PATCH(request: Request) {
  const body = (await request.json()) as Record<string, string>;
  for (const [key, value] of Object.entries(body)) {
    await query(
      `
      INSERT INTO settings (key, value)
      VALUES ($1, $2)
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
    `,
      [key, value],
    );
  }
  const settings = await getSettings();
  return NextResponse.json(settings);
}
