import { NextResponse } from "next/server";
import { getDashboardSummary, listAssets } from "@/server/repository";

export const dynamic = "force-dynamic";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const PREFERRED_MODELS = ["gemini-2.5-flash", "gemini-3.5-flash", "gemini-3.6-flash", "gemini-flash-latest"];

function isExplicitHindiQuery(text: string): boolean {
  // Only trigger Hindi if Devanagari script is present or user explicitly asks for Hindi
  const devanagariPattern = /[\u0900-\u097F]/;
  if (devanagariPattern.test(text)) return true;

  const lower = text.toLowerCase();
  return lower.includes("in hindi") || lower.includes("hindi me") || lower.includes("हिंदी");
}

async function callGeminiApi(prompt: string, contextText: string, isHindi: boolean) {
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY environment variable is not configured.");
  }

  const systemInstruction = `You are CrestBot, a Gemini Live natural voice assistant for Crestfolio Pro (an institutional market research workstation in India).
You speak in a warm, professional, articulate male voice tone — like a Google Assistant / Gemini Live co-pilot.

LANGUAGE RULES:
- DEFAULT: Respond in natural, professional ENGLISH (like Google Search default).
- HINDI ONLY IF ASKED: If and only if the user prompt is written in Hindi (Devanagari) or explicitly requests Hindi, respond in natural conversational HINDI.

CONVERSATIONAL VOICE TONE:
- Speak in natural continuous sentences.
- DO NOT output robotic bullet points, dashes (-), or raw markdown markers (**bold**, ### headers).
- Keep responses concise, articulate, and direct (3-4 spoken sentences).`;

  const payload = {
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `${systemInstruction}\n\n[WORKSTATION CONTEXT]\n${contextText}\n\n[USER QUESTION]\n${prompt}`,
          },
        ],
      },
    ],
  };

  for (const model of PREFERRED_MODELS) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        const responseText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (responseText) {
          return responseText;
        }
      }
    } catch (e) {
      console.warn(`Gemini model ${model} failed, trying fallback...`);
    }
  }

  throw new Error("Unable to connect to Gemini API.");
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { prompt, pathname } = body;

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const isHindi = isExplicitHindiQuery(prompt);
    const summary = await getDashboardSummary();
    const assets = await listAssets();

    const topAssetsInfo = assets
      .slice(0, 6)
      .map((a) => `${a.name} (${a.symbol}): ₹${a.lastPrice} [Trend:${a.trendScore}/100]`)
      .join(", ");

    const contextText = `
Active Screen: ${pathname || "/"}
Market Score: ${summary.marketPulse.score}/100 (${summary.marketPulse.headline})
Core Assets: ${topAssetsInfo}
    `;

    const reply = await callGeminiApi(prompt, contextText, isHindi);

    return NextResponse.json({
      reply,
      isHindi,
      modelUsed: "Google Gemini Live Natural Voice Engine (Male Voice)",
    });
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate response from Gemini AI." },
      { status: 500 },
    );
  }
}
