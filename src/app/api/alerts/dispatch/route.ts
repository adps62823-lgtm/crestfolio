import { NextRequest, NextResponse } from "next/server";
import { dispatchBriefing } from "@/server/utilities/alerts";

export async function POST(req: NextRequest) {
  const body = (await req.json()) as { bullets: string[] };
  if (!body.bullets?.length) return NextResponse.json({ error: "bullets array required" }, { status: 400 });
  const result = await dispatchBriefing(body.bullets);
  return NextResponse.json(result);
}
