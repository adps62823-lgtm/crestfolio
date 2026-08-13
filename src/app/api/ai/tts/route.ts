import { NextResponse } from "next/server";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

export const dynamic = "force-dynamic";

const execAsync = promisify(exec);

function isHindiText(text: string): boolean {
  // Only detect Hindi if Devanagari script is explicitly present
  const devanagariPattern = /[\u0900-\u097F]/;
  return devanagariPattern.test(text);
}

export async function POST(req: Request) {
  try {
    const { text, lang } = await req.json();
    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    // Clean text of symbols for clean speech
    const cleanText = text
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/\*(.*?)\*/g, "$1")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/#{1,6}\s?/g, "")
      .replace(/[-*•]\s+/g, "")
      .replace(/\n+/g, " ")
      .trim();

    const isHindi = lang === "hi-IN" || (lang !== "en-IN" && isHindiText(cleanText));
    
    // Male Edge TTS Neural Voices:
    // hi-IN-MadhurNeural -> Male Hindi Voice
    // en-IN-PrabhatNeural -> Male Indian English Voice
    const voice = isHindi ? "hi-IN-MadhurNeural" : "en-IN-PrabhatNeural";

    const tmpFile = path.join(os.tmpdir(), `edge_tts_male_${Date.now()}.mp3`);
    const sanitizedText = cleanText.replace(/"/g, '\\"');
    const command = `python -m edge_tts --voice ${voice} --text "${sanitizedText}" --write-media "${tmpFile}"`;

    await execAsync(command);

    if (!fs.existsSync(tmpFile)) {
      throw new Error("Edge TTS failed to generate MP3 file.");
    }

    const audioBuffer = fs.readFileSync(tmpFile);
    fs.unlinkSync(tmpFile);

    return new NextResponse(audioBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error: any) {
    console.error("Edge TTS Male Voice Error:", error);
    return NextResponse.json({ error: error.message || "TTS generation failed" }, { status: 500 });
  }
}
