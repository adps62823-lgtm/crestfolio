import { NextRequest, NextResponse } from "next/server";
import { runScenario } from "@/server/utilities/scenario";
import type { ScenarioInput } from "@/lib/types";

export async function POST(req: NextRequest) {
  const body = (await req.json()) as ScenarioInput;
  return NextResponse.json({ impacts: runScenario(body) });
}
