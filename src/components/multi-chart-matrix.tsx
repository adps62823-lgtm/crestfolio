"use client";

import { useEffect, useState } from "react";
import { MatrixCanvasChart } from "./matrix-canvas-chart";
import { TradingViewFinancials } from "./tradingview/financials-widget";
import type { AssetRecord } from "@/lib/types";
import { Maximize2, Grid, Layers, BarChart2, DollarSign } from "lucide-react";

type Props = {
  allAssets: AssetRecord[];
};

export function MultiChartMatrix({ allAssets }: Props) {
  const [layout, setLayout] = useState<"1x1" | "2x1" | "2x2">("2x2");
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>([]);
  const [viewModesMap, setViewModesMap] = useState<Record<number, "chart" | "financials">>({});
  const [chartStylesMap, setChartStylesMap] = useState<Record<number, "area" | "line" | "candlestick">>({});
  const [timeframesMap, setTimeframesMap] = useState<Record<number, "1M" | "3M" | "6M" | "1Y">>({});

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

  function handleViewModeChange(index: number, mode: "chart" | "financials") {
    setViewModesMap((prev) => ({ ...prev, [index]: mode }));
  }

  function handleStyleChange(index: number, style: "area" | "line" | "candlestick") {
    setChartStylesMap((prev) => ({ ...prev, [index]: style }));
  }

  function handleTimeframeChange(index: number, tf: "1M" | "3M" | "6M" | "1Y") {
    setTimeframesMap((prev) => ({ ...prev, [index]: tf }));
  }

  return (
    <div className="stack">
      <div className="panel">
        <div className="toolbar" style={{ flexWrap: "wrap", gap: 12 }}>
          <div>
            <h3>Multi-Chart Research Matrix</h3>
            <p className="muted">
              Side-by-side technical price action charts (Area, Line, Candlestick) and fundamental financials.
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
            const viewMode = viewModesMap[idx] ?? "chart";
            const chartStyle = chartStylesMap[idx] ?? "area";
            const timeframe = timeframesMap[idx] ?? "1Y";

            return (
              <div
                key={idx}
                className="panel"
                style={{
                  padding: 14,
                  backgroundColor: "rgba(5, 12, 20, 0.98)",
                  borderColor: "var(--border-strong)",
                  minHeight: layout === "1x1" ? 540 : 440,
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {/* Control Bar: High Contrast Dropdown + Style & Timeframe Controls */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 10,
                    gap: 8,
                    flexWrap: "wrap",
                    background: "rgba(15, 23, 42, 0.95)",
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
                      maxWidth: 220,
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

                  {/* Controls for Chart View Mode */}
                  {viewMode === "chart" && (
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      {/* Chart Style Switcher */}
                      <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
                        {(["area", "line", "candlestick"] as const).map((st) => (
                          <button
                            key={st}
                            className={`button ${chartStyle === st ? "button-primary" : "button-subtle"}`}
                            style={{ padding: "2px 6px", fontSize: "0.72rem", textTransform: "capitalize" }}
                            onClick={() => handleStyleChange(idx, st)}
                          >
                            {st}
                          </button>
                        ))}
                      </div>

                      {/* Timeframe Switcher */}
                      <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
                        {(["1M", "3M", "6M", "1Y"] as const).map((tf) => (
                          <button
                            key={tf}
                            className={`button ${timeframe === tf ? "button-primary" : "button-subtle"}`}
                            style={{ padding: "2px 6px", fontSize: "0.72rem" }}
                            onClick={() => handleTimeframeChange(idx, tf)}
                          >
                            {tf}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* View Mode Toggle: Chart vs Financials */}
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <button
                      className={`button ${viewMode === "chart" ? "button-primary" : "button-subtle"}`}
                      style={{ padding: "4px 8px", fontSize: "0.78rem" }}
                      onClick={() => handleViewModeChange(idx, "chart")}
                    >
                      <BarChart2 size={13} style={{ marginRight: 4 }} /> Chart
                    </button>

                    <button
                      className={`button ${viewMode === "financials" ? "button-primary" : "button-subtle"}`}
                      style={{ padding: "4px 8px", fontSize: "0.78rem" }}
                      onClick={() => handleViewModeChange(idx, "financials")}
                    >
                      <DollarSign size={13} style={{ marginRight: 4 }} /> Fundamentals
                    </button>
                  </div>
                </div>

                {/* Main Content Area */}
                <div style={{ flex: 1, minHeight: layout === "1x1" ? 440 : 340 }}>
                  {viewMode === "chart" ? (
                    <MatrixCanvasChart
                      slug={currentAsset?.slug || "reliance-industries"}
                      assetName={currentAsset?.name || "Reliance Industries"}
                      symbol={currentAsset?.symbol || "RELIANCE"}
                      chartStyle={chartStyle}
                      timeframe={timeframe}
                      height="100%"
                    />
                  ) : (
                    <TradingViewFinancials
                      symbol={currentAsset?.symbol || "RELIANCE"}
                      height="100%"
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
