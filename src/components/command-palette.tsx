"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Terminal, ArrowRight, X, Sparkles, Filter, Layers, BarChart2 } from "lucide-react";
import type { AssetRecord } from "@/lib/types";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export function CommandPalette({ isOpen, onClose }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AssetRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        if (isOpen) onClose();
        else window.dispatchEvent(new CustomEvent("open-command-palette"));
      } else if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/screener?query=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data.assets.slice(0, 6));
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.6)",
        backdropFilter: "blur(8px)",
        zIndex: 999,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        paddingTop: "10vh",
        paddingLeft: 16,
        paddingRight: 16,
      }}
      onClick={onClose}
    >
      <div
        className="panel"
        style={{
          width: "100%",
          maxWidth: 680,
          borderRadius: 16,
          border: "1px solid var(--border)",
          backgroundColor: "var(--panel)",
          color: "var(--text)",
          boxShadow: "var(--shadow)",
          overflow: "hidden",
          padding: 0,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "16px 20px",
            borderBottom: "1px solid var(--border)",
            gap: 12,
          }}
        >
          <Terminal size={18} style={{ color: "var(--accent)" }} />
          <input
            autoFocus
            className="input"
            style={{
              border: "none",
              background: "transparent",
              fontSize: "1.05rem",
              padding: 0,
              color: "var(--text)",
              boxShadow: "none",
            }}
            placeholder="Type or speak stock symbol, MF scheme, commodity (e.g. RELIANCE, PPFC)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button
            title="Voice Search (Hindi / English)"
            style={{ background: "none", border: "none", color: "var(--accent)", cursor: "pointer", padding: "0 6px" }}
            onClick={() => {
              const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
              if (!SpeechRecognition) {
                alert("Voice recognition is not supported in your browser.");
                return;
              }
              const recognition = new SpeechRecognition();
              recognition.lang = "hi-IN";
              recognition.onresult = (e: any) => {
                const text = e.results[0]?.[0]?.transcript;
                if (text) setQuery(text);
              };
              recognition.start();
            }}
          >
            <Search size={18} />
          </button>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", color: "var(--muted)", cursor: "pointer" }}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: "16px 20px", maxHeight: 400, overflowY: "auto" }}>
          {query.startsWith("/") ? (
            <div className="stack">
              <div className="muted" style={{ fontSize: "0.78rem", fontWeight: 600, letterSpacing: "0.05em", marginBottom: 4 }}>NAVIGATION COMMANDS</div>
              <div
                className="asset-card"
                style={{ cursor: "pointer" }}
                onClick={() => { router.push("/matrix"); onClose(); }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <BarChart2 size={16} style={{ color: "var(--accent)" }} />
                  <strong>/matrix</strong> - Open Multi-Chart TradingView Matrix
                </div>
              </div>
              <div
                className="asset-card"
                style={{ cursor: "pointer" }}
                onClick={() => { router.push("/overlap"); onClose(); }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Layers size={16} style={{ color: "var(--primary)" }} />
                  <strong>/overlap</strong> - Mutual Fund Scheme Overlap Analyzer
                </div>
              </div>
              <div
                className="asset-card"
                style={{ cursor: "pointer" }}
                onClick={() => { router.push("/screener"); onClose(); }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Filter size={16} style={{ color: "var(--warning)" }} />
                  <strong>/screener</strong> - Screener Studio & Custom Formula Engine
                </div>
              </div>
            </div>
          ) : results.length > 0 ? (
            <div className="stack">
              <div className="muted" style={{ fontSize: "0.78rem", fontWeight: 600, letterSpacing: "0.05em", marginBottom: 4 }}>RESEARCH ENTITIES ({results.length})</div>
              {results.map((asset) => (
                <div
                  key={asset.slug}
                  className="asset-card"
                  style={{ cursor: "pointer" }}
                  onClick={() => {
                    router.push(`/asset/${asset.slug}`);
                    onClose();
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <strong>{asset.name}</strong>
                      <span className="muted" style={{ marginLeft: 8, fontSize: "0.85rem" }}>
                        {asset.symbol} · {asset.assetClass}
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span className="pill pill-active">Trend {asset.trendScore}</span>
                      <ArrowRight size={14} className="muted" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : query.trim() ? (
            <div style={{ textAlign: "center", padding: "20px 0", color: "var(--muted)" }}>
              {loading ? "Searching research universe..." : "No matching assets or commands found."}
            </div>
          ) : (
            <div className="stack">
              <div className="muted" style={{ fontSize: "0.78rem", fontWeight: 600, letterSpacing: "0.05em" }}>QUICK SHORTCUTS & DESK COMMANDS</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 6 }}>
                <button
                  className="button"
                  style={{ justifyContent: "flex-start" }}
                  onClick={() => { router.push("/screener"); onClose(); }}
                >
                  <Filter size={14} /> Open Screener Studio
                </button>
                <button
                  className="button"
                  style={{ justifyContent: "flex-start" }}
                  onClick={() => { router.push("/matrix"); onClose(); }}
                >
                  <BarChart2 size={14} /> Open 4-Chart Matrix
                </button>
                <button
                  className="button"
                  style={{ justifyContent: "flex-start" }}
                  onClick={() => { router.push("/overlap"); onClose(); }}
                >
                  <Layers size={14} /> Compare MF Overlap
                </button>
                <button
                  className="button"
                  style={{ justifyContent: "flex-start" }}
                  onClick={() => { router.push("/live"); onClose(); }}
                >
                  <Sparkles size={14} /> Live Sync Control
                </button>
              </div>
            </div>
          )}
        </div>

        <div
          style={{
            padding: "12px 20px",
            borderTop: "1px solid var(--border)",
            backgroundColor: "var(--bg-subtle)",
            display: "flex",
            justifyContent: "space-between",
            fontSize: "0.78rem",
            color: "var(--muted)",
          }}
        >
          <span>Use <strong>Ctrl+K</strong> or <strong>/</strong> anytime to open search</span>
          <span>Press <strong>ESC</strong> to dismiss</span>
        </div>
      </div>
    </div>
  );
}
