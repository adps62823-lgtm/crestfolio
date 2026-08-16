// Utility 6 — Hands-Free Voice Research Notes
// Transcription itself happens client-side via the browser's free Web
// Speech API (SpeechRecognition) — zero external service, zero cost. This
// module only persists the resulting transcript and links it to a symbol
// / conviction update.
import { getDb } from "../db";
import { randomUUID } from "node:crypto";

export function saveVoiceNote(transcript: string, assetId: string | null): { id: string; createdAt: string } {
  const db = getDb();
  const id = randomUUID();
  const createdAt = new Date().toISOString();
  db.prepare(`INSERT INTO voice_notes (id, asset_id, transcript, created_at) VALUES (?, ?, ?, ?)`).run(id, assetId, transcript, createdAt);
  return { id, createdAt };
}

/** Very small heuristic to suggest a conviction delta from spoken language
 * ("thesis intact", "margin pressure", "downgrading my view") — surfaced
 * to the user as a suggestion, never auto-applied. */
export function suggestConvictionShift(transcript: string): { delta: -1 | 0 | 1; reason: string } {
  const t = transcript.toLowerCase();
  if (/thesis (remains )?intact|reiterate|maintain(ing)? (my )?view|conviction (remains|unchanged)/.test(t)) return { delta: 0, reason: "Language suggests thesis unchanged." };
  if (/downgrad|losing conviction|concern(ed)?|margin pressure|weak(er)? outlook|cutting/.test(t)) return { delta: -1, reason: "Language suggests a more cautious stance." };
  if (/upgrad|increasing conviction|strong(er)? conviction|adding to (my )?position|bullish/.test(t)) return { delta: 1, reason: "Language suggests increasing conviction." };
  return { delta: 0, reason: "No clear conviction signal detected — review manually." };
}
