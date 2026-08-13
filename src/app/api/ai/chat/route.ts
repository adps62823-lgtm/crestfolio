import { NextResponse } from "next/server";
import { generateAiResponse } from "@/server/ai";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    message: string;
    assetSlug?: string | null;
    persona?: string | null;
  };

  const result = await generateAiResponse(body);
  return NextResponse.json(result);
}
