import { NextResponse } from "next/server";
import { computeSectorMomentum } from "@/server/utilities/sectorMomentum";

export async function GET() {
  return NextResponse.json({ sectors: computeSectorMomentum() });
}
