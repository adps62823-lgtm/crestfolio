"use client";

import { useEffect, useState } from "react";
import { TradingViewSymbolOverview } from "./tradingview/symbol-overview";
import { TradingViewFinancials } from "./tradingview/financials-widget";
import type { AssetRecord } from "@/lib/types";
import { Maximize2, Grid, Layers, BarChart2, DollarSign } from "lucide-react";

type Props = {
  allAssets: AssetRecord[];
};

export function MultiChartMatrix({ allAssets }: Props) {
  const [layout, setLayout] = useState<"1x1" | "2x1" | "2x2">("2x2");
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>([]);
  const [viewModesMap, setViewModesMap] = useState<Record<number, "overview" | "financials">>({});

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

  function handleViewModeChange(index: number, mode: "overview" | "financials") {
    setViewModesMap((prev) => ({ ...prev, [index]: mode }));
  }

  return (
    <div className="stack">
      <div className="panel">
        <div className="toolbar" style={{ flexWrap: "wrap", gap: 12 }}>
          <div>
            <h3>Multi-Chart TradingView Matrix</h3>
            <p className="muted">
              Side-by-side TradingView Symbol Overview area charts and institutional fundamental data.
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
            const viewMode = viewModesMap[idx] ?? "overview";

            return (
              <div
                key={idx}
                className="panel"
                style={{
                  padding: 14,
                  backgroundColor: "rgba(5, 12, 20, 0.98)",
                  borderColor: "var(--border-strong)",
                  minHeight: layout === "1x1" ? 600 : 520,
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {/* Control Bar: High Contrast Asset Dropdown + View Mode Toggle */}
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

                  {/* View Mode Toggle: Symbol Overview (Area Chart) vs Financials */}
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <button
                      className={`button ${viewMode === "overview" ? "button-primary" : "button-subtle"}`}
                      style={{ padding: "4px 8px", fontSize: "0.78rem" }}
                      onClick={() => handleViewModeChange(idx, "overview")}
                    >
                      <BarChart2 size={13} style={{ marginRight: 4 }} /> Symbol Overview (Area)
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

                {/* Main Widget Area */}
                <div style={{ flex: 1, minHeight: layout === "1x1" ? 460 : 340 }}>
                  {viewMode === "overview" ? (
                    <TradingViewSymbolOverview
                      symbol={currentAsset?.symbol || "RELIANCE"}
                      chartType="area"
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
