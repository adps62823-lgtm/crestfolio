"use client";

import { useState } from "react";
import { Bot, Loader2, SendHorizontal } from "lucide-react";

type Props = {
  assetSlug?: string | null;
  contextLabel: string;
  starterPrompt?: string;
};

export function AiAssistant({ assetSlug, contextLabel, starterPrompt }: Props) {
  const [message, setMessage] = useState(
    starterPrompt ?? "Give me a concise institutional assessment and the key thesis risks.",
  );
  const [answer, setAnswer] = useState("");
  const [provider, setProvider] = useState<string>("fallback");
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    setAnswer("");
    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, assetSlug }),
      });
      const payload = (await response.json()) as {
        answer: string;
        provider: string;
      };
      setAnswer(payload.answer);
      setProvider(payload.provider);
    } catch (error) {
      setAnswer("AI request failed. Local Ollama may not be running, so Crestfolio used a fallback path.");
      setProvider("error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="panel">
      <div className="toolbar">
        <div>
          <h3 style={{ marginBottom: 6 }}>
            <Bot size={18} style={{ verticalAlign: "middle", marginRight: 8 }} />
            Research Copilot
          </h3>
          <p className="muted">{contextLabel}</p>
        </div>
        <span className="pill pill-active">{provider}</span>
      </div>

      <textarea
        className="textarea"
        rows={4}
        value={message}
        onChange={(event) => setMessage(event.target.value)}
      />

      <div style={{ marginTop: 12 }}>
        <button className="button button-primary" onClick={submit} disabled={loading}>
          {loading ? <Loader2 size={16} className="spin" /> : <SendHorizontal size={16} />}
          <span>{loading ? "Thinking..." : "Ask Copilot"}</span>
        </button>
      </div>

      <div style={{ marginTop: 16, whiteSpace: "pre-wrap" }} className="footer-note">
        {answer || "Prompt the copilot to generate a grounded analyst response using the local research universe."}
      </div>
    </div>
  );
}
