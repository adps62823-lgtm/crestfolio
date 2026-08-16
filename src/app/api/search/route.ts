import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/server/db";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) return NextResponse.json({ results: [] });

  const db = getDb();
  // FTS5 prefix match across symbol/name/category
  const ftsQuery = q.split(/\s+/).map((t) => `${t.replace(/[^a-zA-Z0-9]/g, "")}*`).join(" ");
  try {
    const rows = db.prepare(`
      SELECT a.id, a.symbol, a.name, a.asset_class as assetClass, a.category
      FROM assets_fts f JOIN assets a ON a.id = f.id
      WHERE assets_fts MATCH ?
      LIMIT 20
    `).all(ftsQuery);
    return NextResponse.json({ results: rows });
  } catch {
    // Fall back to LIKE search if FTS query syntax fails on special chars
    const rows = db.prepare(`
      SELECT id, symbol, name, asset_class as assetClass, category
      FROM assets WHERE name LIKE ? OR symbol LIKE ? LIMIT 20
    `).all(`%${q}%`, `%${q}%`);
    return NextResponse.json({ results: rows });
  }
}
