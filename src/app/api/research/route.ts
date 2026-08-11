import { NextResponse } from "next/server";
import { createResearchNote, getResearchNotes } from "@/server/repository";

export async function GET() {
  const notes = await getResearchNotes();
  return NextResponse.json({ notes });
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    title: string;
    assetSlug?: string | null;
    body: string;
    thesis?: string;
    status?: string;
    tags?: string[];
  };

  const id = await createResearchNote(body);
  return NextResponse.json({ id });
}
