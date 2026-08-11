import { getAssetDetail, getDashboardSummary, getSettings } from "@/server/repository";

export type AiRequest = {
  message: string;
  assetSlug?: string | null;
  persona?: string | null;
};

async function callOllama(prompt: string) {
  const settings = await getSettings();
  const baseUrl = process.env.OLLAMA_BASE_URL ?? settings.ollamaBaseUrl;
  const model = process.env.OLLAMA_MODEL ?? settings.ollamaModel;

  try {
    const response = await fetch(`${baseUrl}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        stream: false,
        messages: [
          {
            role: "system",
            content:
              "You are Crestfolio's institutional research analyst. Be concise, evidence-led, and skeptical. Always use the provided data context only. If data is missing, say what is missing. Return plain text, not markdown tables unless useful.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as {
      message?: { content?: string };
      response?: string;
    };

    return payload.message?.content ?? payload.response ?? null;
  } catch {
    return null;
  }
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
      ? `Verdict: ${context.assetName} is currently a ${context.assetClass ?? "research"} candidate worth monitoring with a bias toward evidence over narrative.`
      : "Verdict: The current market mix looks best approached through a disciplined, evidence-first workflow.",
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
Persona: ${persona}
Persona rules: ${personaRules}

Asset:
Name: ${detail.asset.name}
Symbol: ${detail.asset.symbol}
Class: ${detail.asset.assetClass}
Sector: ${detail.asset.sector}
Benchmark: ${detail.asset.benchmark}
Last price: ${detail.asset.lastPrice}
1M return: ${detail.asset.return1M}%
3M return: ${detail.asset.return3M}%
6M return: ${detail.asset.return6M}%
1Y return: ${detail.asset.return1Y}%
Trend score: ${detail.asset.trendScore}
Quality score: ${detail.asset.qualityScore}
Valuation score: ${detail.asset.valuationScore}
Sentiment score: ${detail.asset.sentimentScore}
Conviction score: ${detail.asset.convictionScore}
Risk score: ${detail.asset.riskScore}
Watchlisted: ${detail.watchlisted ? "yes" : "no"}

Recent events:
${detail.events.slice(0, 4).map((event) => `- ${event.title} (${event.severity}, ${event.eventDate})`).join("\n")}

Recent news:
${detail.news.slice(0, 4).map((news) => `- ${news.headline} [sentiment ${news.sentiment}]`).join("\n")}

User request: ${input.message}

Answer as an institutional analyst. Include:
1. what matters most
2. bull case
3. bear case
4. what to watch next
5. final judgment
`;

    const ollama = await callOllama(prompt);
    if (ollama) {
      return { answer: ollama, provider: "ollama", persona };
    }

    return {
      answer: fallbackAnswer({
        title: `${detail.asset.name} research summary`,
        assetName: detail.asset.name,
        assetClass: detail.asset.assetClass,
        bullets: [
          `Trend score is ${detail.asset.trendScore} with conviction at ${detail.asset.convictionScore}.`,
          `Recent news count: ${detail.news.length}; recent events count: ${detail.events.length}.`,
          `Primary risks: drawdown ${detail.asset.maxDrawdown}% and volatility ${detail.asset.volatility}%.`,
          `Use ${detail.asset.benchmark} as the main comparison reference.`,
        ],
      }),
      provider: "fallback",
      persona,
    };
  }

  const dashboard = await getDashboardSummary();
  const prompt = `
Persona: ${persona}
Persona rules: ${personaRules}

Market briefing:
Headline: ${dashboard.marketPulse.headline}
Score: ${dashboard.marketPulse.score}
Watchlist count: ${dashboard.watchlist.length}
Events: ${dashboard.recentEvents.length}
News items: ${dashboard.recentNews.length}
Research queue: ${dashboard.researchQueue.length}

Top spotlights:
${dashboard.spotlight
  .slice(0, 6)
  .map(
    (asset) =>
      `- ${asset.name} (${asset.symbol}) | trend ${asset.trendScore} | conviction ${asset.convictionScore} | risk ${asset.riskScore}`,
  )
  .join("\n")}

User request: ${input.message}

Give a concise research briefing with:
1. market regime assessment
2. what should be reviewed now
3. where the strongest opportunities sit
4. what would break the thesis
`;

  const ollama = await callOllama(prompt);
  if (ollama) {
    return { answer: ollama, provider: "ollama", persona };
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
