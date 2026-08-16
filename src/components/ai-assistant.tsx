"use client";

import { useState } from "react";
import { Bot, Loader2, SendHorizontal } from "lucide-react";
import { FormattedMarkdown } from "./formatted-markdown";

type Props = {
  assetSlug?: string | null;
  contextLabel: string;
  starterPrompt?: string;
};

export function AiAssistant({ assetSlug, contextLabel, starterPrompt }: Props) {
  const [message, setMessage] = useState(
    starterPrompt ?? "Give me a detailed technical assessment and key support/resistance levels.",
  );
  const [answer, setAnswer] = useState("");
  const [modelUsed, setModelUsed] = useState<string>("Google Gemini");
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!message.trim() || loading) return;
    setLoading(true);
    setAnswer("");
    try {
      const response = await fetch("/api/ai/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: message, assetSlug }),
      });
      const payload = await response.json();
      if (response.ok && payload.reply) {
        setAnswer(payload.reply);
        if (payload.modelUsed) setModelUsed(payload.modelUsed);
      } else {
        setAnswer(`Error: ${payload.error || "Failed to reach Gemini API"}`);
      }
    } catch (error: any) {
      setAnswer(`Connection error: ${error.message || "Failed to connect to CrestBot"}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="panel">
      <div className="toolbar">
        <div>
          <h3 style={{ marginBottom: 6, display: "flex", alignItems: "center", gap: 8 }}>
            <Bot size={20} style={{ color: "var(--accent)" }} />
            Consult CrestBot
          </h3>
          <p className="muted">{contextLabel}</p>
        </div>
        <span className="pill pill-active">{modelUsed}</span>
      </div>

      <textarea
        className="textarea"
        rows={4}
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        placeholder="Ask CrestBot for technical level analysis, swing targets, or valuation ratios..."
      />

      <div style={{ marginTop: 12 }}>
        <button className="button button-primary" onClick={submit} disabled={loading}>
          {loading ? <Loader2 size={16} className="spin" /> : <SendHorizontal size={16} />}
          <span>{loading ? "CrestBot Thinking..." : "Consult CrestBot"}</span>
        </button>
      </div>

      {answer && (
        <div style={{ marginTop: 16, padding: 14, background: "rgba(15, 23, 42, 0.6)", borderRadius: 10, border: "1px solid var(--border)" }}>
          <FormattedMarkdown content={answer} />
        </div>
      )}
    </div>
  );
}
