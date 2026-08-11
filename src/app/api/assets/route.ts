import { NextResponse } from "next/server";
import { listAssets, getUniverseFacets } from "@/server/repository";

export async function GET() {
  const [assets, facets] = await Promise.all([listAssets(), getUniverseFacets()]);
  return NextResponse.json({ assets, facets });
}
