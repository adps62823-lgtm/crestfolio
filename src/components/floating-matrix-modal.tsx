"use client";

import { useEffect, useState, useRef } from "react";
import { AssetChart } from "./asset-chart";
import type { AssetRecord, PriceBar } from "@/lib/types";
import {
  Maximize2,
  Grid,
  Layers,
  X,
  Minus,
  RefreshCw,
  Move,
  ExternalLink,
} from "lucide-react";

type Props = {
  allAssets: AssetRecord[];
  isOpen: boolean;
  onClose: () => void;
};

export function FloatingMatrixModal({ allAssets, isOpen, onClose }: Props) {
  const [layout, setLayout] = useState<"1x1" | "2x1" | "2x2">("2x2");
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>([]);
  const [barsMap, setBarsMap] = useState<Record<string, PriceBar[]>>({});
  const [loading, setLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  // Dragging state
  const [position, setPosition] = useState<{ x: number; y: number }>({
    x: 50,
    y: 50,
  });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

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
      if (!isOpen || selectedSlugs.length === 0) return;
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
  }, [isOpen, selectedSlugs]);

  // Handle Dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button") || (e.target as HTMLElement).closest("select")) {
      return;
    }
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      setPosition({
        x: Math.max(10, Math.min(window.innerWidth - 300, e.clientX - dragStartRef.current.x)),
        y: Math.max(10, Math.min(window.innerHeight - 100, e.clientY - dragStartRef.current.y)),
      });
    };

    const handleMouseUp = () => setIsDragging(false);

    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  if (!isOpen) return null;

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
    <div
      className="fade-up"
      style={{
        position: "fixed",
        left: position.x,
        top: position.y,
        zIndex: 9995,
        width: isMinimized ? 320 : "min(1080px, 92vw)",
        height: isMinimized ? 48 : "min(680px, 85vh)",
        background: "var(--bg-panel)",
        border: "1px solid var(--border-accent)",
        borderRadius: 14,
        boxShadow: "0 24px 48px rgba(0,0,0,0.65)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        resize: isMinimized ? "none" : "both",
        fontFamily: "var(--font-sans)",
      }}
    >
      {/* Header Bar */}
      <div
        onMouseDown={handleMouseDown}
        style={{
          padding: "10px 16px",
          background: "var(--bg-subtle)",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: isDragging ? "grabbing" : "grab",
          userSelect: "none",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Move size={16} className="muted" />
          <h4 style={{ margin: 0, fontSize: "0.95rem", color: "var(--fg)", fontWeight: 700 }}>
            ⚡ Multi-Chart TradingView Matrix (Landscape Window)
          </h4>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {!isMinimized && (
            <div className="pill-row" style={{ marginRight: 12 }}>
              <button
                className={`button ${layout === "1x1" ? "button-primary" : "button-subtle"}`}
                style={{ padding: "3px 8px", fontSize: "0.75rem" }}
                onClick={() => setLayout("1x1")}
              >
                <Maximize2 size={12} /> 1x1
              </button>
              <button
                className={`button ${layout === "2x1" ? "button-primary" : "button-subtle"}`}
                style={{ padding: "3px 8px", fontSize: "0.75rem" }}
                onClick={() => setLayout("2x1")}
              >
                <Layers size={12} /> 2x1
              </button>
              <button
                className={`button ${layout === "2x2" ? "button-primary" : "button-subtle"}`}
                style={{ padding: "3px 8px", fontSize: "0.75rem" }}
                onClick={() => setLayout("2x2")}
              >
                <Grid size={12} /> 2x2
              </button>
            </div>
          )}

          <button
            className="button button-subtle"
            style={{ padding: 4 }}
            onClick={() => setIsMinimized(!isMinimized)}
            title={isMinimized ? "Expand Window" : "Minimize Window"}
          >
            <Minus size={14} />
          </button>

          <button
            className="button button-subtle"
            style={{ padding: 4 }}
            onClick={onClose}
            title="Close Window"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Main Body Grid */}
      {!isMinimized && (
        <div
          style={{
            flex: 1,
            padding: 12,
            overflowY: "auto",
            display: "grid",
            gap: 12,
            background: "rgba(3, 8, 16, 0.95)",
            ...gridStyle,
          }}
        >
          {Array.from({ length: activeCount }).map((_, idx) => {
            const currentSlug = selectedSlugs[idx] ?? allAssets[idx]?.slug ?? "";
            const currentAsset = allAssets.find((a) => a.slug === currentSlug);
            const bars = barsMap[currentSlug] ?? [];

            return (
              <div
                key={idx}
                style={{
                  padding: 10,
                  borderRadius: 10,
                  backgroundColor: "rgba(10, 20, 32, 0.95)",
                  border: "1px solid var(--border)",
                  display: "flex",
                  flexDirection: "column",
                  minHeight: layout === "1x1" ? 450 : 260,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, gap: 8 }}>
                  <select
                    className="select"
                    style={{ padding: "4px 8px", fontSize: "0.82rem", fontWeight: 600 }}
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
                      <span className="pill pill-active" style={{ fontSize: "0.75rem" }}>
                        ₹{currentAsset.lastPrice.toLocaleString("en-IN")}
                      </span>
                      <span className="pill" style={{ fontSize: "0.75rem" }}>
                        RSI {currentAsset.rsi14 ?? 50}
                      </span>
                    </div>
                  )}
                </div>

                <div style={{ flex: 1, position: "relative" }}>
                  {loading && bars.length === 0 ? (
                    <div style={{ height: "100%", minHeight: 200, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <RefreshCw size={20} className="muted spinning" />
                    </div>
                  ) : (
                    <AssetChart bars={bars} />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
