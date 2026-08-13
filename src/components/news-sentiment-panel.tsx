"use client";

import type { NewsItem, EventItem } from "@/lib/types";
import { formatCompactDate } from "@/lib/format";
import { TrendingUp, TrendingDown, AlertTriangle, ShieldCheck } from "lucide-react";

type Props = {
  news: NewsItem[];
  events: EventItem[];
};

export function NewsSentimentPanel({ news, events }: Props) {
  return (
    <div className="section-grid">
      <div className="panel">
        <h3>Real-time News & AI Sentiment Signals</h3>
        <p className="muted">Live news feeds scored for market mood and thesis relevance.</p>
        <div className="stack" style={{ marginTop: 16 }}>
          {news.map((item) => (
            <div key={item.id} className="asset-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                <h4>{item.headline}</h4>
                <span
                  className="pill"
                  style={{
                    backgroundColor: item.sentiment > 0.3 ? "rgba(0, 240, 144, 0.15)" : item.sentiment < -0.3 ? "rgba(255, 127, 127, 0.15)" : "rgba(255, 255, 255, 0.05)",
                    color: item.sentiment > 0.3 ? "var(--accent)" : item.sentiment < -0.3 ? "var(--danger)" : "var(--muted)",
                  }}
                >
                  {item.sentiment > 0.3 ? <TrendingUp size={12} /> : item.sentiment < -0.3 ? <TrendingDown size={12} /> : null}
                  Sentiment {item.sentiment > 0 ? `+${item.sentiment}` : item.sentiment}
                </span>
              </div>
              <p style={{ marginTop: 6 }}>{item.summary}</p>
              <div className="pill-row" style={{ marginTop: 10 }}>
                <span className="pill">{formatCompactDate(item.publishedAt)}</span>
                <span className="pill">{item.source}</span>
                <span className="pill pill-active">Impact: {item.impact}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="panel">
        <h3>Corporate & Economic Event Log</h3>
        <p className="muted">Dividends, earnings announcements, macro policy updates.</p>
        <div className="stack" style={{ marginTop: 16 }}>
          {events.map((event) => (
            <div key={event.id} className="asset-card">
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {event.severity === "high" || event.severity === "critical" ? (
                  <AlertTriangle size={16} style={{ color: "var(--accent-2)" }} />
                ) : (
                  <ShieldCheck size={16} style={{ color: "var(--accent)" }} />
                )}
                <h4>{event.title}</h4>
              </div>
              <p style={{ marginTop: 6 }}>{event.detail}</p>
              <div className="pill-row" style={{ marginTop: 10 }}>
                <span className="pill pill-active">Severity: {event.severity}</span>
                <span className="pill">{formatCompactDate(event.eventDate)}</span>
                <span className="pill">{event.source}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
