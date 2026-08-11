import { NextResponse } from "next/server";
import { syncLiveSources } from "@/server/connectors";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { source?: string };
  const results = await syncLiveSources(body.source);
  return NextResponse.json({
    ok: true,
    results,
    timestamp: new Date().toISOString(),
  });
}
