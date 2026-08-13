import { NextResponse } from "next/server";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const execAsync = promisify(exec);

export const dynamic = "force-dynamic";

function cleanTextForTts(raw: string): string {
  return raw
    .replace(/\*\*/g, "")
    .replace(/#/g, "")
    .replace(/-/g, " ")
    .replace(/`/g, "")
    .replace(/\n+/g, ". ")
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchGoogleTtsMp3(text: string, lang: string): Promise<Buffer> {
  const targetLang = lang.startsWith("hi") ? "hi" : "en-IN";
  const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text.slice(0, 450))}&tl=${targetLang}&client=tw-ob`;
  
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
    },
  });

  if (!res.ok) {
    throw new Error(`Google TTS request failed with status ${res.status}`);
  }

  const arrayBuf = await res.arrayBuffer();
  return Buffer.from(arrayBuf);
}

export async function POST(req: Request) {
  try {
    const { text, lang } = await req.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    const clean = cleanTextForTts(text);
    if (!clean) {
      return NextResponse.json({ error: "Text empty after cleaning" }, { status: 400 });
    }

    const voice = lang?.startsWith("hi") ? "hi-IN-MadhurNeural" : "en-IN-PrabhatNeural";
    const tempFile = path.join(os.tmpdir(), `tts_${Date.now()}_${Math.random().toString(36).slice(2)}.mp3`);

    // Strategy 1: Try Python edge-tts if available locally
    try {
      await execAsync(`python -m edge_tts --voice "${voice}" --text "${clean.replace(/"/g, '\\"')}" --write-media "${tempFile}"`, {
        timeout: 7000,
      });

      if (fs.existsSync(tempFile)) {
        const audioBuffer = fs.readFileSync(tempFile);
        try { fs.unlinkSync(tempFile); } catch {}
        return new NextResponse(new Uint8Array(audioBuffer), {
          headers: {
            "Content-Type": "audio/mpeg",
            "Cache-Control": "public, max-age=3600",
          },
        });
      }
    } catch {
      // Python edge-tts failed or not installed (e.g. Vercel Serverless environment). Proceed to Strategy 2.
    }

    // Strategy 2: High-reliability pure JS MP3 TTS stream (Vercel Serverless compatible)
    const googleMp3Buffer = await fetchGoogleTtsMp3(clean, lang || "en-IN");
    return new NextResponse(new Uint8Array(googleMp3Buffer), {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error: any) {
    console.error("TTS Route Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate TTS audio" },
      { status: 500 },
    );
  }
}
