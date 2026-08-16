"use client";

import { useEffect, useState } from "react";
import { AssetChart } from "./asset-chart";
import type { AssetRecord, PriceBar } from "@/lib/types";
import { Maximize2, Grid, Layers, RefreshCw } from "lucide-react";

type Props = {
  allAssets: AssetRecord[];
};

export function MultiChartMatrix({ allAssets }: Props) {
  const [layout, setLayout] = useState<"1x1" | "2x1" | "2x2">("2x2");
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>([]);
  const [barsMap, setBarsMap] = useState<Record<string, PriceBar[]>>({});
  const [loading, setLoading] = useState(false);

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

  useEffect(() => {
    async function loadBars() {
      if (selectedSlugs.length === 0) return;
      setLoading(true);
      const newMap: Record<string, PriceBar[]> = {};
      for (const slug of selectedSlugs) {
        if (!slug) continue;
        try {
          const res = await fetch(`/api/assets/${slug}`);
          const data = await res.json();
          if (data.bars) {
            newMap[slug] = data.bars;
          }
        } catch {
          newMap[slug] = [];
        }
      }
      setBarsMap(newMap);
      setLoading(false);
    }
    void loadBars();
  }, [selectedSlugs]);

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

  return (
    <div className="stack">
      <div className="panel">
        <div className="toolbar">
          <div>
            <h3>Multi-Chart TradingView Matrix</h3>
            <p className="muted">
              Side-by-side technical charting matrix with synchronized price scales.
            </p>
          </div>

          <div className="pill-row">
            <button
              className={`button ${layout === "1x1" ? "button-primary" : ""}`}
              onClick={() => setLayout("1x1")}
            >
              <Maximize2 size={14} /> Single
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
            const bars = barsMap[currentSlug] ?? [];

            return (
              <div
                key={idx}
                className="panel"
                style={{
                  padding: 16,
                  backgroundColor: "rgba(5, 12, 20, 0.95)",
                  borderColor: "var(--border-strong)",
                  minHeight: 380,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, gap: 12 }}>
                  <select
                    className="select"
                    style={{ padding: "6px 12px", fontSize: "0.88rem", fontWeight: 600 }}
                    value={currentSlug}
                    onChange={(e) => handleSelectChange(idx, e.target.value)}
                  >
                    {allAssets.map((asset) => (
                      <option key={asset.slug} value={asset.slug}>
                        {asset.name} ({asset.symbol})
                      </option>
                    ))}
                  </select>
                  {currentAsset && (
                    <div className="pill-row" style={{ alignItems: "center" }}>
                      <span className="pill pill-active">₹{currentAsset.lastPrice.toLocaleString("en-IN")}</span>
                      <span className="pill">Trend {currentAsset.trendScore}</span>
                    </div>
                  )}
                </div>

                {loading && bars.length === 0 ? (
                  <div style={{ height: 320, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <RefreshCw size={24} className="muted spinning" />
                  </div>
                ) : (
                  <AssetChart bars={bars} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
