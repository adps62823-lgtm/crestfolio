"use client";

import { useState } from "react";
import type { IndicatorItem } from "@/server/utilities/technicalSuite";
import { Search, Activity, TrendingUp, TrendingDown } from "lucide-react";

type Props = {
  indicators: IndicatorItem[];
  assetName: string;
};

export function TechnicalMasterSuite({ indicators, assetName }: Props) {
  const [selectedCategory, setSelectedCategory] = useState<string>("All 50+");
  const [search, setSearch] = useState("");

  const categories = [
    "All 50+",
    "Moving Averages",
    "Oscillators & Momentum",
    "Volatility & Bands",
    "Volume & Liquidity",
    "Returns & Price Range",
    "Risk & Benchmark Relative",
    "Fundamental & Ratios",
  ];

  const filtered = indicators.filter((item) => {
    const matchesCategory =
      selectedCategory === "All 50+" || item.category === selectedCategory;
    const matchesSearch =
      !search ||
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getSignalBadge = (signal?: string) => {
    switch (signal) {
      case "Bullish":
      case "Oversold":
        return (
          <span
            className="pill pill-active"
            style={{
              background: "rgba(34, 197, 94, 0.15)",
              color: "#22c55e",
              borderColor: "rgba(34, 197, 94, 0.3)",
            }}
          >
            <TrendingUp size={12} style={{ marginRight: 4 }} /> {signal}
          </span>
        );
      case "Bearish":
      case "Overbought":
        return (
          <span
            className="pill"
            style={{
              background: "rgba(239, 68, 68, 0.15)",
              color: "#ef4444",
              borderColor: "rgba(239, 68, 68, 0.3)",
            }}
          >
            <TrendingDown size={12} style={{ marginRight: 4 }} /> {signal}
          </span>
        );
      default:
        return (
          <span
            className="pill"
            style={{ background: "rgba(148, 163, 184, 0.1)", color: "#94a3b8" }}
          >
            Neutral
          </span>
        );
    }
  };

  return (
    <div className="panel">
      <div className="toolbar" style={{ flexWrap: "wrap", gap: 16 }}>
        <div>
          <h3 style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Activity size={20} style={{ color: "var(--accent)" }} />
            50+ Technical & Fundamental Suite — {assetName}
          </h3>
          <p className="muted">
            TickerTape & TradingView grade technical indicators, moving averages, momentum oscillators, and valuation metrics.
          </p>
        </div>

        <div style={{ position: "relative", minWidth: 240 }}>
          <Search
            size={14}
            style={{
              position: "absolute",
              left: 10,
              top: 10,
              color: "var(--muted)",
            }}
          />
          <input
            type="text"
            className="input"
            placeholder="Search 50+ metrics (e.g. SMA, RSI, MACD, P/E)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: 32, fontSize: "0.85rem" }}
          />
        </div>
      </div>

      {/* Category Pills */}
      <div
        className="pill-row"
        style={{ marginTop: 14, flexWrap: "wrap", gap: 6 }}
      >
        {categories.map((cat) => (
          <button
            key={cat}
            className={`pill ${selectedCategory === cat ? "pill-active" : ""}`}
            style={{ cursor: "pointer", fontSize: "0.78rem" }}
            onClick={() => setSelectedCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Indicator Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: 12,
          marginTop: 18,
        }}
      >
        {filtered.map((item, idx) => (
          <div
            key={idx}
            className="asset-card"
            style={{
              padding: 14,
              borderRadius: 10,
              background: "rgba(15, 23, 42, 0.6)",
              border: "1px solid var(--border)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: 8,
                }}
              >
                <span
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--accent)",
                    fontWeight: 600,
                  }}
                >
                  {item.category}
                </span>
                {getSignalBadge(item.signal)}
              </div>

              <h4 style={{ margin: "6px 0 4px 0", fontSize: "0.95rem" }}>
                {item.name}
              </h4>
              <p
                style={{
                  margin: 0,
                  fontSize: "0.78rem",
                  color: "var(--text-muted)",
                  lineHeight: 1.3,
                }}
              >
                {item.description}
              </p>
            </div>

            <div
              style={{
                marginTop: 12,
                paddingTop: 8,
                borderTop: "1px solid var(--border)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
              }}
            >
              <span style={{ fontSize: "0.75rem", color: "var(--muted)" }}>
                Value
              </span>
              <strong style={{ fontSize: "1.05rem", color: "var(--fg)" }}>
                {item.value}{" "}
                <span
                  style={{
                    fontSize: "0.78rem",
                    color: "var(--muted)",
                    fontWeight: 400,
                  }}
                >
                  {item.unit}
                </span>
              </strong>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div style={{ padding: 32, textAlign: "center", color: "var(--muted)" }}>
          No technical indicators match "{search}"
        </div>
      )}
    </div>
  );
}
