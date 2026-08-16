"use client";

import { useEffect, useState, useRef } from "react";
import { TradingViewChart } from "./trading-view-chart";
import type { AssetRecord } from "@/lib/types";
import {
  Maximize2,
  Grid,
  Layers,
  X,
  Minus,
  Move,
} from "lucide-react";

type Props = {
  allAssets: AssetRecord[];
  isOpen: boolean;
  onClose: () => void;
};

export function FloatingMatrixModal({ allAssets, isOpen, onClose }: Props) {
  const [layout, setLayout] = useState<"1x1" | "2x1" | "2x2">("2x2");
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>([]);
  const [stylesMap, setStylesMap] = useState<Record<number, string>>({});
  const [intervalsMap, setIntervalsMap] = useState<Record<number, string>>({});
  const [isMinimized, setIsMinimized] = useState(false);

  // Dragging state
  const [position, setPosition] = useState<{ x: number; y: number }>({
    x: 40,
    y: 40,
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

  function handleStyleChange(index: number, styleVal: string) {
    setStylesMap((prev) => ({ ...prev, [index]: styleVal }));
  }

  function handleIntervalChange(index: number, intervalVal: string) {
    setIntervalsMap((prev) => ({ ...prev, [index]: intervalVal }));
  }

  return (
    <div
      className="fade-up"
      style={{
        position: "fixed",
        left: position.x,
        top: position.y,
        zIndex: 9995,
        width: isMinimized ? 320 : "min(1120px, 94vw)",
        height: isMinimized ? 48 : "min(720px, 88vh)",
        background: "var(--bg-panel)",
        border: "1px solid var(--border-accent)",
        borderRadius: 14,
        boxShadow: "0 24px 48px rgba(0,0,0,0.75)",
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
            padding: 10,
            overflowY: "auto",
            display: "grid",
            gap: 10,
            background: "rgba(3, 8, 16, 0.98)",
            ...gridStyle,
          }}
        >
          {Array.from({ length: activeCount }).map((_, idx) => {
            const currentSlug = selectedSlugs[idx] ?? allAssets[idx]?.slug ?? "";
            const currentAsset = allAssets.find((a) => a.slug === currentSlug);
            const currentStyle = stylesMap[idx] ?? "1";
            const currentInterval = intervalsMap[idx] ?? "D";

            return (
              <div
                key={idx}
                style={{
                  padding: 8,
                  borderRadius: 10,
                  backgroundColor: "rgba(10, 20, 32, 0.98)",
                  border: "1px solid var(--border)",
                  display: "flex",
                  flexDirection: "column",
                  minHeight: layout === "1x1" ? 480 : 280,
                }}
              >
                {/* Control Bar: High Contrast Asset Dropdown + Style/Interval Controls */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 8,
                    gap: 6,
                    flexWrap: "wrap",
                    background: "rgba(15, 23, 42, 0.9)",
                    padding: "6px 10px",
                    borderRadius: 6,
                    border: "1px solid var(--border-accent)",
                  }}
                >
                  {/* High Contrast Asset Selector Dropdown */}
                  <select
                    style={{
                      padding: "4px 8px",
                      fontSize: "0.85rem",
                      fontWeight: 700,
                      color: "#38bdf8",
                      backgroundColor: "#0f172a",
                      border: "1px solid #38bdf8",
                      borderRadius: 6,
                      outline: "none",
                      cursor: "pointer",
                      maxWidth: 200,
                    }}
                    value={currentSlug}
                    onChange={(e) => handleSelectChange(idx, e.target.value)}
                  >
                    {allAssets.map((asset) => (
                      <option
                        key={asset.slug}
                        value={asset.slug}
                        style={{ backgroundColor: "#0f172a", color: "#ffffff", padding: 4 }}
                      >
                        {asset.name} ({asset.symbol})
                      </option>
                    ))}
                  </select>

                  {/* Frequency Controls */}
                  <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                    <span style={{ fontSize: "0.72rem", color: "var(--muted)" }}>Freq:</span>
                    {["15", "60", "D", "W", "M"].map((freq) => (
                      <button
                        key={freq}
                        className={`button ${currentInterval === freq ? "button-primary" : "button-subtle"}`}
                        style={{ padding: "2px 5px", fontSize: "0.7rem" }}
                        onClick={() => handleIntervalChange(idx, freq)}
                      >
                        {freq === "15" ? "15m" : freq === "60" ? "1h" : freq}
                      </button>
                    ))}
                  </div>

                  {/* Style Controls */}
                  <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                    <span style={{ fontSize: "0.72rem", color: "var(--muted)" }}>Style:</span>
                    <button
                      className={`button ${currentStyle === "1" ? "button-primary" : "button-subtle"}`}
                      style={{ padding: "2px 5px", fontSize: "0.7rem" }}
                      onClick={() => handleStyleChange(idx, "1")}
                    >
                      Candle
                    </button>
                    <button
                      className={`button ${currentStyle === "8" ? "button-primary" : "button-subtle"}`}
                      style={{ padding: "2px 5px", fontSize: "0.7rem" }}
                      onClick={() => handleStyleChange(idx, "8")}
                    >
                      Heikin
                    </button>
                    <button
                      className={`button ${currentStyle === "3" ? "button-primary" : "button-subtle"}`}
                      style={{ padding: "2px 5px", fontSize: "0.7rem" }}
                      onClick={() => handleStyleChange(idx, "3")}
                    >
                      Area
                    </button>
                    <button
                      className={`button ${currentStyle === "2" ? "button-primary" : "button-subtle"}`}
                      style={{ padding: "2px 5px", fontSize: "0.7rem" }}
                      onClick={() => handleStyleChange(idx, "2")}
                    >
                      Line
                    </button>
                  </div>

                  {currentAsset && (
                    <span className="pill pill-active" style={{ fontSize: "0.72rem" }}>
                      ₹{currentAsset.lastPrice.toLocaleString("en-IN")}
                    </span>
                  )}
                </div>

                <div style={{ flex: 1, minHeight: layout === "1x1" ? 420 : 240 }}>
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
      )}
    </div>
  );
}
