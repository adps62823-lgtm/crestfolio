"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import {
  Bot,
  Send,
  Sparkles,
  X,
  RefreshCw,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  ChevronDown,
  Trash2,
  Globe,
} from "lucide-react";
import { FormattedMarkdown } from "./formatted-markdown";
import { createVoiceRecognizer, speakText } from "@/lib/speech";

const IDLE_INSIGHTS = [
  "Nifty 50 TRI momentum score is holding strong at 78/100.",
  "AMFI live feed & 2,125 listed NSE Equities active in database.",
  "Zomato & Suzlon Energy volume surging in current trading session.",
  "Tata Motors & M&M outperforming Automobile sector benchmark.",
  "Hindustan Aeronautics (HAL) & BEL leading Capital Goods momentum.",
  "Polycab & Dixon Technologies holding above 50-day moving average.",
  "Inter-market radar: Gold/Nifty ratio signaling selective risk-on.",
  "Gemini Copilot online. Ask me about any of the 2,125 NSE stocks!",
];

type Message = {
  role: "user" | "assistant";
  content: string;
};

export function DesktopPetCopilot() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [voiceLang, setVoiceLang] = useState<"en-IN" | "hi-IN">("en-IN");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hello! I am CrestBot, your AI Copilot powered by Google Gemini and Edge Neural Male Voice. Ask me anything in English or Hindi!",
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [insightIndex, setInsightIndex] = useState(0);
  const [showBubble, setShowBubble] = useState(true);
  const [isTtsEnabled, setIsTtsEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setInsightIndex((prev) => (prev + 1) % IDLE_INSIGHTS.length);
      setShowBubble(true);
      setTimeout(() => setShowBubble(false), 7000);
    }, 14000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsSpeaking(false);
  };

  const playEdgeTts = async (text: string, isHindi: boolean) => {
    if (!isTtsEnabled) return;
    stopAudio();
    setIsSpeaking(true);

    const fallbackToWebSpeech = () => {
      speakText(text, {
        lang: isHindi ? "hi-IN" : "en-IN",
        onStart: () => setIsSpeaking(true),
        onEnd: () => setIsSpeaking(false),
      });
    };

    try {
      const res = await fetch("/api/ai/tts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text, lang: isHindi ? "hi-IN" : "en-IN" }),
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audioRef.current = audio;

        audio.onended = () => setIsSpeaking(false);
        audio.onerror = () => {
          setIsSpeaking(false);
          fallbackToWebSpeech();
        };

        await audio.play().catch((playErr) => {
          console.warn("Audio play prevented or failed, using SpeechSynthesis:", playErr);
          fallbackToWebSpeech();
        });
      } else {
        fallbackToWebSpeech();
      }
    } catch (err) {
      console.warn("TTS API failed, falling back to Web Speech API:", err);
      fallbackToWebSpeech();
    }
  };

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim() || isLoading) return;

    stopAudio();

    const userMessage: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMessage]);
    if (!textToSend) setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/ai/gemini", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          prompt: text,
          pathname,
        }),
      });

      const data = await res.json();
      if (res.ok && data.reply) {
        setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
        playEdgeTts(data.reply, Boolean(data.isHindi));
      } else {
        const errText = `Error: ${data.error || "Failed to reach Gemini API"}`;
        setMessages((prev) => [...prev, { role: "assistant", content: errText }]);
      }
    } catch (err: any) {
      const connErr = `Connection error: ${err.message || "Failed to send query"}`;
      setMessages((prev) => [...prev, { role: "assistant", content: connErr }]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleVoiceListen = () => {
    if (isListening) {
      setIsListening(false);
      return;
    }

    const recognizer = createVoiceRecognizer(
      (transcript) => {
        setInput(transcript);
        setIsListening(false);
        handleSend(transcript);
      },
      (err) => {
        console.warn("Speech recognition error:", err);
        setIsListening(false);
      },
      voiceLang,
    );

    if (recognizer) {
      setIsListening(true);
      recognizer.start();
    } else {
      alert("Voice recognition is not supported in your browser.");
    }
  };

  const clearChat = () => {
    stopAudio();
    setMessages([
      {
        role: "assistant",
        content: "Chat history cleared. What market query can I help you with?",
      },
    ]);
  };

  return (
    <div style={{ position: "fixed", bottom: 20, right: 20, zIndex: 9999, fontFamily: "var(--font-sans)" }}>
      {/* Refined Solid Opaque Chat Drawer */}
      {isOpen && (
        <div
          className="fade-up"
          style={{
            width: "min(420px, calc(100vw - 32px))",
            height: "min(550px, calc(100vh - 100px))",
            marginBottom: 12,
            display: "flex",
            flexDirection: "column",
            boxShadow: "0 24px 48px rgba(0,0,0,0.6)",
            border: "1px solid var(--border-accent)",
            background: "var(--bg-panel)",
            borderRadius: 14,
            overflow: "hidden",
            opacity: 1,
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "12px 16px",
              background: "var(--bg-subtle)",
              borderBottom: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #2563eb, #0284c7)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                }}
              >
                <Sparkles size={18} />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: "0.95rem", color: "var(--fg)" }}>CrestBot Gemini Live</h4>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: isSpeaking ? "#ec4899" : "#10b981",
                      boxShadow: isSpeaking ? "0 0 10px #ec4899" : "none",
                    }}
                  />
                  <p className="muted" style={{ margin: 0, fontSize: "0.72rem" }}>
                    {isSpeaking ? "Male Neural Voice (Edge TTS)..." : "Google Search Default (English)"}
                  </p>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <button
                className="button button-subtle"
                style={{ padding: 6, color: isTtsEnabled ? "var(--accent)" : "var(--muted)" }}
                title={isTtsEnabled ? "Mute Edge Male Voice" : "Enable Male Neural Voice"}
                onClick={() => {
                  stopAudio();
                  setIsTtsEnabled(!isTtsEnabled);
                }}
              >
                {isTtsEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
              </button>

              <button
                className="button button-subtle"
                style={{ padding: 6 }}
                title="Clear History"
                onClick={clearChat}
              >
                <Trash2 size={15} />
              </button>

              <button
                className="button button-subtle"
                style={{ padding: 6 }}
                onClick={() => {
                  stopAudio();
                  setIsOpen(false);
                }}
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Messages Body */}
          <div
            style={{
              flex: 1,
              padding: 14,
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: 12,
              background: "var(--bg-panel)",
            }}
          >
            {messages.map((m, idx) => (
              <div
                key={idx}
                style={{
                  alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                  maxWidth: "90%",
                  background: m.role === "user" ? "var(--primary)" : "var(--bg-subtle)",
                  color: m.role === "user" ? "#ffffff" : "var(--fg)",
                  padding: "10px 14px",
                  borderRadius: 12,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                }}
              >
                {m.role === "user" ? (
                  <div style={{ fontSize: "0.85rem", whiteSpace: "pre-wrap" }}>{m.content}</div>
                ) : (
                  <FormattedMarkdown content={m.content} />
                )}
              </div>
            ))}

            {isLoading && (
              <div
                style={{
                  alignSelf: "flex-start",
                  background: "var(--bg-subtle)",
                  padding: "10px 14px",
                  borderRadius: 10,
                  fontSize: "0.8rem",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  color: "var(--accent)",
                }}
              >
                <RefreshCw size={14} className="spin" /> Generating response...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Preset Chips */}
          <div
            style={{
              padding: "8px 12px",
              background: "var(--bg-subtle)",
              borderTop: "1px solid var(--border)",
              display: "flex",
              gap: 6,
              overflowX: "auto",
            }}
          >
            <button
              className="pill"
              style={{ fontSize: "0.72rem", cursor: "pointer", whiteSpace: "nowrap" }}
              onClick={() => handleSend("What is the current Nifty 50 market trend?")}
            >
              📊 Nifty Trend (English)
            </button>
            <button
              className="pill"
              style={{ fontSize: "0.72rem", cursor: "pointer", whiteSpace: "nowrap" }}
              onClick={() => handleSend("हिंदी में बताओ: गोल्ड और निफ्टी का अनुपात क्या संकेत दे रहा है?")}
            >
              🇮🇳 गोल्ड और निफ्टी (हिंदी)
            </button>
            <button
              className="pill"
              style={{ fontSize: "0.72rem", cursor: "pointer", whiteSpace: "nowrap" }}
              onClick={() => handleSend("Explain Parag Parikh Flexi Cap holding strategy")}
            >
              ⚖️ Parag Parikh Strategy
            </button>
          </div>

          {/* Input & Voice Controls */}
          <div
            style={{
              padding: 10,
              background: "var(--bg-subtle)",
              borderTop: "1px solid var(--border)",
              display: "flex",
              gap: 8,
              alignItems: "center",
            }}
          >
            {/* Language Selection Toggle Pill */}
            <button
              type="button"
              className="pill"
              style={{
                fontSize: "0.72rem",
                padding: "4px 8px",
                cursor: "pointer",
                background: voiceLang === "hi-IN" ? "var(--accent)" : "var(--bg-panel)",
                color: voiceLang === "hi-IN" ? "#fff" : "var(--muted)",
              }}
              title="Toggle Voice Input Language"
              onClick={() => setVoiceLang((prev) => (prev === "en-IN" ? "hi-IN" : "en-IN"))}
            >
              <Globe size={12} style={{ marginRight: 4 }} />
              {voiceLang === "hi-IN" ? "HI" : "EN"}
            </button>

            <button
              type="button"
              className={`button ${isListening ? "button-primary" : "button-subtle"}`}
              style={{ padding: "0 10px", color: isListening ? "#ef4444" : "inherit" }}
              title={`Voice Typing (${voiceLang === "hi-IN" ? "Hindi" : "English Default"})`}
              onClick={toggleVoiceListen}
            >
              {isListening ? <MicOff size={16} className="spin" /> : <Mic size={16} />}
            </button>

            <input
              type="text"
              className="input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder={isListening ? `Listening (${voiceLang === "hi-IN" ? "Hindi" : "English"})...` : "Ask a query in English (or Hindi)..."}
              style={{ fontSize: "0.85rem", flex: 1 }}
            />

            <button
              className="button button-primary"
              style={{ padding: "0 14px" }}
              onClick={() => handleSend()}
              disabled={isLoading}
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Floating Mascot Button */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {!isOpen && showBubble && (
          <div
            className="fade-up"
            style={{
              background: "var(--bg-panel)",
              border: "1px solid var(--border-accent)",
              padding: "10px 14px",
              borderRadius: 12,
              boxShadow: "0 12px 28px rgba(0,0,0,0.4)",
              maxWidth: 240,
              fontSize: "0.8rem",
              color: "var(--fg)",
              lineHeight: 1.4,
              opacity: 1,
            }}
          >
            <span style={{ fontWeight: 600, color: "var(--accent)", display: "block", marginBottom: 2 }}>
              ⚡ CrestBot Pulse:
            </span>
            {IDLE_INSIGHTS[insightIndex]}
          </div>
        )}

        <button
          onClick={() => {
            if (isOpen) stopAudio();
            setIsOpen(!isOpen);
          }}
          style={{
            width: 58,
            height: 58,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #1d4ed8, #0284c7, #0d9488)",
            border: "2px solid #ffffff44",
            boxShadow: "0 10px 25px rgba(37, 99, 235, 0.5)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#ffffff",
            position: "relative",
            transition: "transform 0.2s ease, boxShadow 0.2s ease",
            animation: "floatMascot 4s ease-in-out infinite",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.1)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          {isOpen ? (
            <ChevronDown size={26} />
          ) : (
            <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Bot size={30} />
              <div
                style={{
                  position: "absolute",
                  top: -4,
                  right: -4,
                  width: 11,
                  height: 11,
                  borderRadius: "50%",
                  background: isSpeaking ? "#ec4899" : "#10b981",
                  border: "2px solid #000",
                  boxShadow: isSpeaking ? "0 0 10px #ec4899" : "none",
                }}
              />
            </div>
          )}
        </button>
      </div>

      <style>{`
        @keyframes floatMascot {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
