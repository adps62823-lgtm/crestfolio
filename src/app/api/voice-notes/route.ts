import { NextRequest, NextResponse } from "next/server";
import { saveVoiceNote, suggestConvictionShift } from "@/server/utilities/voiceNotes";

export async function POST(req: NextRequest) {
  const body = (await req.json()) as { transcript: string; assetId: string | null };
  if (!body.transcript?.trim()) return NextResponse.json({ error: "transcript required" }, { status: 400 });
  const saved = saveVoiceNote(body.transcript, body.assetId);
  const suggestion = suggestConvictionShift(body.transcript);
  return NextResponse.json({ ...saved, suggestion });
}
