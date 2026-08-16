// Utility 8 — Thesis Audit Trail & Revision History
// Notes are never overwritten: each edit inserts a new row with
// previous_version_id pointing back, forming a linked-list audit chain.
import { getDb } from "../db";
import { randomUUID } from "node:crypto";
import type { ResearchNote } from "@/lib/types";

export function createNoteVersion(input: Omit<ResearchNote, "id" | "createdAt" | "updatedAt" | "version" | "previousVersionId"> & { previousVersionId?: string | null }): ResearchNote {
  const db = getDb();
  const now = new Date().toISOString();
  let version = 1;
  if (input.previousVersionId) {
    const prev = db.prepare(`SELECT version FROM research_notes WHERE id = ?`).get(input.previousVersionId) as { version: number } | undefined;
    version = (prev?.version ?? 0) + 1;
  }
  const note: ResearchNote = {
    id: randomUUID(),
    assetId: input.assetId,
    title: input.title,
    body: input.body ?? input.bodyMarkdown ?? "",
    bodyMarkdown: input.bodyMarkdown ?? input.body,
    thesisTags: input.thesisTags,
    conviction: input.conviction,
    persona: input.persona,
    status: input.status ?? "idea",
    tags: input.tags ?? [],
    createdAt: now,
    updatedAt: now,
    version,
    previousVersionId: input.previousVersionId ?? null,
  };
  db.prepare(`
    INSERT INTO research_notes (id, asset_id, title, body_markdown, thesis_tags, conviction, persona, created_at, updated_at, version, previous_version_id)
    VALUES (@id, @assetId, @title, @bodyMarkdown, @thesisTags, @conviction, @persona, @createdAt, @updatedAt, @version, @previousVersionId)
  `).run({ ...note, thesisTags: JSON.stringify(note.thesisTags) });
  return note;
}

export function getVersionChain(latestNoteId: string): ResearchNote[] {
  const db = getDb();
  const chain: ResearchNote[] = [];
  let currentId: string | null = latestNoteId;
  while (currentId) {
    const row = db.prepare(`SELECT * FROM research_notes WHERE id = ?`).get(currentId) as (Omit<ResearchNote, "thesisTags"> & { thesis_tags: string; previous_version_id: string | null }) | undefined;
    if (!row) break;
    chain.push({ ...row, thesisTags: JSON.parse(row.thesis_tags || "[]"), previousVersionId: row.previous_version_id } as ResearchNote);
    currentId = row.previous_version_id;
  }
  return chain; // newest first
}

/** Simple line-based diff for the "Jan 2025 vs Aug 2025" side-by-side view.
 * Uses LCS-based diffing — no external diff library needed for line-level
 * markdown notes. */
export function diffNoteVersions(oldText: string, newText: string): { type: "same" | "added" | "removed"; line: string }[] {
  const oldLines = oldText.split("\n");
  const newLines = newText.split("\n");
  const m = oldLines.length, n = newLines.length;
  const lcs: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      lcs[i]![j] = oldLines[i - 1] === newLines[j - 1] ? lcs[i - 1]![j - 1]! + 1 : Math.max(lcs[i - 1]![j]!, lcs[i]![j - 1]!);
    }
  }
  const result: { type: "same" | "added" | "removed"; line: string }[] = [];
  let i = m, j = n;
  while (i > 0 && j > 0) {
    if (oldLines[i - 1] === newLines[j - 1]) { result.unshift({ type: "same", line: oldLines[i - 1]! }); i--; j--; }
    else if (lcs[i - 1]![j]! >= lcs[i]![j - 1]!) { result.unshift({ type: "removed", line: oldLines[i - 1]! }); i--; }
    else { result.unshift({ type: "added", line: newLines[j - 1]! }); j--; }
  }
  while (i > 0) { result.unshift({ type: "removed", line: oldLines[i - 1]! }); i--; }
  while (j > 0) { result.unshift({ type: "added", line: newLines[j - 1]! }); j--; }
  return result;
}
