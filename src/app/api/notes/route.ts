import { NextRequest, NextResponse } from "next/server";
import { createNoteVersion, getVersionChain, diffNoteVersions } from "@/server/utilities/thesisAudit";
import type { ResearchNote } from "@/lib/types";

export async function POST(req: NextRequest) {
  const body = (await req.json()) as Omit<ResearchNote, "id" | "createdAt" | "updatedAt" | "version">;
  const note = createNoteVersion(body);
  return NextResponse.json(note);
}

export async function GET(req: NextRequest) {
  const noteId = req.nextUrl.searchParams.get("noteId");
  const compareWith = req.nextUrl.searchParams.get("compareWith");
  if (!noteId) return NextResponse.json({ error: "noteId required" }, { status: 400 });
  const chain = getVersionChain(noteId);
  if (compareWith) {
    const older = chain.find((n) => n.id === compareWith);
    const newer = chain.find((n) => n.id === noteId);
    if (older && newer) {
      return NextResponse.json({ chain, diff: diffNoteVersions(older.bodyMarkdown ?? older.body, newer.bodyMarkdown ?? newer.body) });
    }
  }
  return NextResponse.json({ chain });
}
