import { NextResponse } from "next/server";
import { getDb } from "@/server/db";

export async function GET() {
  const db = getDb();
  const rows = db.prepare(`SELECT source, last_sync_at as lastSyncAt, last_sync_status as lastSyncStatus, records_ingested as recordsIngested, error_message as errorMessage FROM sync_status`).all();
  return NextResponse.json({ sources: rows });
}
