import { getAssetDetail, getDashboardSummary, getSettings } from "@/server/repository";

export type AiRequest = {
  message: string;
  assetSlug?: string | null;
  persona?: string | null;
};

async function callGemini(prompt: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const models = [
    "gemini-2.5-flash",
    "gemini-3.5-flash",
    "gemini-3.6-flash",
    "gemini-flash-latest",
  ];
  const payload = {
    contents: [
      {
        role: "user",
        parts: [{ text: prompt }],
      },
    ],
  };

  for (const model of models) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      if (res.ok) {
        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return text;
      }
    } catch {
      // try next model
    }
  }

  return null;
}

function buildPersonaRules(persona: string) {
  switch (persona) {
    case "growth":
      return "Focus on revenue acceleration, TAM, execution quality, and rerating risk.";
    case "macro":
      return "Focus on rates, inflation, FX, commodity sensitivity, and regime shifts.";
    case "risk_first":
      return "Focus on drawdown risk, leverage, liquidity, and thesis invalidation.";
    default:
      return "Focus on durability, quality, valuation, and downside protection.";
  }
}

function fallbackAnswer(context: {
  title: string;
  bullets: string[];
  assetName?: string;
  assetClass?: string;
}) {
  return [
    context.title,
    "",
    ...context.bullets.map((bullet) => `- ${bullet}`),
    "",
    context.assetName
      ? `Verdict: ${context.assetName} is currently a ${context.assetClass ?? "research"} candidate worth monitoring with a bias toward technical & fundamental data.`
      : "Verdict: The current market mix looks best approached through a disciplined, data-first workflow.",
  ].join("\n");
}

export async function generateAiResponse(input: AiRequest) {
  const settings = await getSettings();
  const persona = input.persona ?? settings.defaultPersona;
  const personaRules = buildPersonaRules(persona);

  if (input.assetSlug) {
    const detail = await getAssetDetail(input.assetSlug);
    if (!detail) {
      return {
        answer: "I could not find that asset in the current research universe.",
        provider: "fallback",
      };
    }

    const prompt = `
System Instruction: You are CrestBot, the institutional market intelligence co-pilot for Crestfolio Pro.
Persona: ${persona}
Rules: ${personaRules}

Asset Details:
Name: ${detail.asset.name}
Symbol: ${detail.asset.symbol}
Class: ${detail.asset.assetClass}
Sector: ${detail.asset.sector}
Benchmark: ${detail.asset.benchmark}
Last price: ₹${detail.asset.lastPrice}
1M return: ${detail.asset.return1M}%
3M return: ${detail.asset.return3M}%
6M return: ${detail.asset.return6M}%
1Y return: ${detail.asset.return1Y}%
RSI (14): ${detail.asset.rsi14 ?? 50}
Max Drawdown: ${detail.asset.maxDrawdown}%
Volatility: ${detail.asset.volatility}%
P/E Ratio: ${detail.asset.peRatio ?? "N/A"}

Recent events:
${detail.events.slice(0, 4).map((event) => `- ${event.title} (${event.severity}, ${event.eventDate})`).join("\n")}

Recent news:
${detail.news.slice(0, 4).map((news) => `- ${news.headline} [sentiment ${news.sentiment}]`).join("\n")}

User Question: ${input.message}

Provide a crisp institutional market report with:
1. Technical & Price Structure
2. Bull & Bear Case
3. Key Levels to Watch
4. Analyst Verdict
`;

    const geminiText = await callGemini(prompt);
    if (geminiText) {
      return { answer: geminiText, provider: "Google Gemini 2.5 Flash", persona };
    }

    return {
      answer: fallbackAnswer({
        title: `${detail.asset.name} research summary`,
        assetName: detail.asset.name,
        assetClass: detail.asset.assetClass,
        bullets: [
          `RSI (14) is at ${detail.asset.rsi14 ?? 50} with 1Y return at ${detail.asset.return1Y}%.`,
          `Recent news count: ${detail.news.length}; recent events count: ${detail.events.length}.`,
          `Primary risks: drawdown ${detail.asset.maxDrawdown}% and volatility ${detail.asset.volatility}%.`,
          `Use ${detail.asset.benchmark} as the primary benchmark reference.`,
        ],
      }),
      provider: "fallback",
      persona,
    };
  }

  const dashboard = await getDashboardSummary();
  const prompt = `
System Instruction: You are CrestBot, the institutional market intelligence co-pilot for Crestfolio Pro.
Persona: ${persona}
Rules: ${personaRules}

Market briefing:
Headline: ${dashboard.marketPulse.headline}
Score: ${dashboard.marketPulse.score}
Watchlist count: ${dashboard.watchlist.length}
Events: ${dashboard.recentEvents.length}
News items: ${dashboard.recentNews.length}

Top Spotlights:
${dashboard.spotlight
  .slice(0, 6)
  .map(
    (asset) =>
      `- ${asset.name} (${asset.symbol}) | 1M: ${asset.return1M}% | RSI: ${asset.rsi14 ?? 50} | Volatility: ${asset.volatility}%`,
  )
  .join("\n")}

User request: ${input.message}

Give a concise institutional research briefing covering market regime, top technical setups, key risks, and analyst conviction.
`;

  const geminiText = await callGemini(prompt);
  if (geminiText) {
    return { answer: geminiText, provider: "Google Gemini 2.5 Flash", persona };
  }

  return {
    answer: fallbackAnswer({
      title: "Market briefing",
      bullets: [
        dashboard.marketPulse.headline,
        `${dashboard.spotlight.length} spotlight names are being tracked right now.`,
        `${dashboard.recentEvents.length} recent events and ${dashboard.recentNews.length} news items are loaded.`,
        `The research queue currently has ${dashboard.researchQueue.length} notes.`,
      ],
    }),
    provider: "fallback",
    persona,
  };
}

export async function getCopilotContext(assetSlug?: string | null) {
  if (assetSlug) {
    const detail = await getAssetDetail(assetSlug);
    if (!detail) return null;
    return {
      kind: "asset" as const,
      asset: detail.asset,
      events: detail.events.slice(0, 5),
      news: detail.news.slice(0, 5),
      notes: detail.notes.slice(0, 3),
    };
  }

  const dashboard = await getDashboardSummary();
  return {
    kind: "dashboard" as const,
    dashboard,
  };
}

export function scoreSentiment(text: string) {
  const lower = text.toLowerCase();
  const positiveWords = [
    "profit",
    "surge",
    "growth",
    "gain",
    "up",
    "bull",
    "record",
    "high",
    "beat",
    "rally",
    "outperform",
    "dividend",
  ];
  const negativeWords = [
    "loss",
    "fall",
    "drop",
    "down",
    "bear",
    "crash",
    "low",
    "miss",
    "plunge",
    "underperform",
    "default",
    "cut",
  ];
  let score = 0;
  for (const word of positiveWords) if (lower.includes(word)) score += 1;
  for (const word of negativeWords) if (lower.includes(word)) score -= 1;
  const label = score > 0 ? "positive" : score < 0 ? "negative" : "neutral";
  return { score, label };
}
