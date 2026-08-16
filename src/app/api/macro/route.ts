import { NextResponse } from "next/server";
import { computeMacroRatios } from "@/server/utilities/macroRatios";

export async function GET() {
  return NextResponse.json({ ratios: computeMacroRatios() });
}
