"use client";

import { useEffect, useState } from "react";
import { TradingViewChart } from "./trading-view-chart";
import type { AssetRecord } from "@/lib/types";
import { Maximize2, Grid, Layers } from "lucide-react";

type Props = {
  allAssets: AssetRecord[];
};

export function MultiChartMatrix({ allAssets }: Props) {
  const [layout, setLayout] = useState<"1x1" | "2x1" | "2x2">("2x2");
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>([]);
  const [stylesMap, setStylesMap] = useState<Record<number, string>>({});
  const [intervalsMap, setIntervalsMap] = useState<Record<number, string>>({});

  useEffect(() => {
    if (allAssets.length > 0 && selectedSlugs.length === 0) {
      setSelectedSlugs([
        allAssets[0]?.slug ?? "",
        allAssets[1]?.slug ?? allAssets[0]?.slug ?? "",
        allAssets[2]?.slug ?? allAssets[0]?.slug ?? "",
        allAssets[3]?.slug ?? allAssets[0]?.slug ?? "",
      ]);
    }
  }, [allAssets, selectedSlugs.length]);

  const activeCount = layout === "1x1" ? 1 : layout === "2x1" ? 2 : 4;
  const gridStyle =
    layout === "1x1"
      ? { gridTemplateColumns: "1fr" }
      : layout === "2x1"
      ? { gridTemplateColumns: "1fr 1fr" }
      : { gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr" };

  function handleSelectChange(index: number, newSlug: string) {
    const next = [...selectedSlugs];
    next[index] = newSlug;
    setSelectedSlugs(next);
  }

  function handleStyleChange(index: number, styleVal: string) {
    setStylesMap((prev) => ({ ...prev, [index]: styleVal }));
  }

  function handleIntervalChange(index: number, intervalVal: string) {
    setIntervalsMap((prev) => ({ ...prev, [index]: intervalVal }));
  }

  return (
    <div className="stack">
      <div className="panel">
        <div className="toolbar" style={{ flexWrap: "wrap", gap: 12 }}>
          <div>
            <h3>Multi-Chart TradingView Matrix</h3>
            <p className="muted">
              Side-by-side technical charting matrix with customizable styles, timeframes, and drawing tools.
            </p>
          </div>

          <div className="pill-row">
            <button
              className={`button ${layout === "1x1" ? "button-primary" : ""}`}
              onClick={() => setLayout("1x1")}
            >
              <Maximize2 size={14} /> Single (1x1)
            </button>
            <button
              className={`button ${layout === "2x1" ? "button-primary" : ""}`}
              onClick={() => setLayout("2x1")}
            >
              <Layers size={14} /> Dual Pane (2x1)
            </button>
            <button
              className={`button ${layout === "2x2" ? "button-primary" : ""}`}
              onClick={() => setLayout("2x2")}
            >
              <Grid size={14} /> Quad Matrix (2x2)
            </button>
          </div>
        </div>

        <div style={{ display: "grid", gap: 16, marginTop: 16, ...gridStyle }}>
          {Array.from({ length: activeCount }).map((_, idx) => {
            const currentSlug = selectedSlugs[idx] ?? allAssets[idx]?.slug ?? "";
            const currentAsset = allAssets.find((a) => a.slug === currentSlug);
            const currentStyle = stylesMap[idx] ?? "1";
            const currentInterval = intervalsMap[idx] ?? "D";

            return (
              <div
                key={idx}
                className="panel"
                style={{
                  padding: 14,
                  backgroundColor: "rgba(5, 12, 20, 0.98)",
                  borderColor: "var(--border-strong)",
                  minHeight: layout === "1x1" ? 520 : 380,
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {/* Control Bar: High Contrast Asset Selector Dropdown + Style & Frequency Controls */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 10,
                    gap: 8,
                    flexWrap: "wrap",
                    background: "rgba(15, 23, 42, 0.9)",
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: "1px solid var(--border-accent)",
                  }}
                >
                  {/* High Contrast Asset Selector Dropdown */}
                  <select
                    style={{
                      padding: "6px 12px",
                      fontSize: "0.9rem",
                      fontWeight: 700,
                      color: "#38bdf8",
                      backgroundColor: "#0f172a",
                      border: "1px solid #38bdf8",
                      borderRadius: 6,
                      outline: "none",
                      cursor: "pointer",
                      maxWidth: 240,
                    }}
                    value={currentSlug}
                    onChange={(e) => handleSelectChange(idx, e.target.value)}
                  >
                    {allAssets.map((asset) => (
                      <option
                        key={asset.slug}
                        value={asset.slug}
                        style={{ backgroundColor: "#0f172a", color: "#ffffff", padding: 6 }}
                      >
                        {asset.name} ({asset.symbol})
                      </option>
                    ))}
                  </select>

                  {/* Frequency Controls */}
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ fontSize: "0.75rem", color: "var(--muted)" }}>Freq:</span>
                    {["15", "60", "D", "W", "M"].map((freq) => (
                      <button
                        key={freq}
                        className={`button ${currentInterval === freq ? "button-primary" : "button-subtle"}`}
                        style={{ padding: "2px 6px", fontSize: "0.72rem" }}
                        onClick={() => handleIntervalChange(idx, freq)}
                      >
                        {freq === "15" ? "15m" : freq === "60" ? "1h" : freq}
                      </button>
                    ))}
                  </div>

                  {/* Style Controls */}
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ fontSize: "0.75rem", color: "var(--muted)" }}>Style:</span>
                    <button
                      className={`button ${currentStyle === "1" ? "button-primary" : "button-subtle"}`}
                      style={{ padding: "2px 6px", fontSize: "0.72rem" }}
                      onClick={() => handleStyleChange(idx, "1")}
                    >
                      Candle
                    </button>
                    <button
                      className={`button ${currentStyle === "8" ? "button-primary" : "button-subtle"}`}
                      style={{ padding: "2px 6px", fontSize: "0.72rem" }}
                      onClick={() => handleStyleChange(idx, "8")}
                    >
                      Heikin
                    </button>
                    <button
                      className={`button ${currentStyle === "3" ? "button-primary" : "button-subtle"}`}
                      style={{ padding: "2px 6px", fontSize: "0.72rem" }}
                      onClick={() => handleStyleChange(idx, "3")}
                    >
                      Area
                    </button>
                    <button
                      className={`button ${currentStyle === "2" ? "button-primary" : "button-subtle"}`}
                      style={{ padding: "2px 6px", fontSize: "0.72rem" }}
                      onClick={() => handleStyleChange(idx, "2")}
                    >
                      Line
                    </button>
                  </div>

                  {currentAsset && (
                    <span className="pill pill-active" style={{ fontSize: "0.78rem" }}>
                      ₹{currentAsset.lastPrice.toLocaleString("en-IN")}
                    </span>
                  )}
                </div>

                {/* TradingView Chart Container */}
                <div style={{ flex: 1, minHeight: layout === "1x1" ? 440 : 300 }}>
                  <TradingViewChart
                    symbol={currentAsset?.symbol || "RELIANCE"}
                    assetName={currentAsset?.name}
                    height="100%"
                    hideHeader={true}
                    initialStyle={currentStyle}
                    initialInterval={currentInterval}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
