"use client";

import { useEffect, useRef, useState } from "react";
import {
  createChart,
  AreaSeries,
  LineSeries,
  CandlestickSeries,
  ColorType,
  type IChartApi,
} from "lightweight-charts";
import type { PriceBar } from "@/lib/types";

type Props = {
  slug: string;
  assetName: string;
  symbol: string;
  chartStyle?: "area" | "line" | "candlestick";
  timeframe?: "1M" | "3M" | "6M" | "1Y";
  height?: number | string;
};

export function MatrixCanvasChart({
  slug,
  assetName,
  symbol,
  chartStyle = "area",
  timeframe = "1Y",
  height = 360,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const [bars, setBars] = useState<PriceBar[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch price bars from internal API
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    fetch(`/api/assets/${slug}`)
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data && Array.isArray(data.bars)) {
          setBars(data.bars);
        }
      })
      .catch((err) => console.error("Error fetching price bars for matrix chart:", err))
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [slug]);

  // Filter bars based on timeframe
  const filteredBars = (() => {
    if (bars.length === 0) return [];
    const sorted = [...bars].sort(
      (a, b) => new Date(a.barDate).getTime() - new Date(b.barDate).getTime(),
    );

    const countMap: Record<string, number> = {
      "1M": 22,
      "3M": 65,
      "6M": 130,
      "1Y": 252,
    };
    const limit = countMap[timeframe] || 252;
    return sorted.slice(-limit);
  })();

  const lastBar = filteredBars[filteredBars.length - 1];
  const firstBar = filteredBars[0];
  const pctChange =
    firstBar && lastBar && firstBar.close > 0
      ? ((lastBar.close - firstBar.close) / firstBar.close) * 100
      : 0;

  useEffect(() => {
    if (!containerRef.current || filteredBars.length === 0) return;

    containerRef.current.innerHTML = "";

    const chart = createChart(containerRef.current, {
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#94a3b8",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: "rgba(255, 255, 255, 0.04)" },
        horzLines: { color: "rgba(255, 255, 255, 0.04)" },
      },
      rightPriceScale: {
        borderColor: "rgba(255, 255, 255, 0.08)",
      },
      timeScale: {
        borderColor: "rgba(255, 255, 255, 0.08)",
        timeVisible: true,
      },
      crosshair: {
        vertLine: { color: "rgba(56, 189, 248, 0.4)" },
        horzLine: { color: "rgba(56, 189, 248, 0.4)" },
      },
    });

    if (chartStyle === "area") {
      const isPositive = pctChange >= 0;
      const series = chart.addSeries(AreaSeries, {
        topColor: isPositive ? "rgba(34, 197, 94, 0.4)" : "rgba(239, 68, 68, 0.4)",
        bottomColor: isPositive ? "rgba(34, 197, 94, 0.0)" : "rgba(239, 68, 68, 0.0)",
        lineColor: isPositive ? "#22c55e" : "#ef4444",
        lineWidth: 2,
      });
      series.setData(
        filteredBars.map((b) => ({
          time: b.barDate.slice(0, 10),
          value: b.close,
        })),
      );
    } else if (chartStyle === "line") {
      const series = chart.addSeries(LineSeries, {
        color: "#38bdf8",
        lineWidth: 2,
      });
      series.setData(
        filteredBars.map((b) => ({
          time: b.barDate.slice(0, 10),
          value: b.close,
        })),
      );
    } else {
      const series = chart.addSeries(CandlestickSeries, {
        upColor: "#22c55e",
        downColor: "#ef4444",
        borderUpColor: "#22c55e",
        borderDownColor: "#ef4444",
        wickUpColor: "#22c55e",
        wickDownColor: "#ef4444",
      });
      series.setData(
        filteredBars.map((b) => ({
          time: b.barDate.slice(0, 10),
          open: b.open,
          high: b.high,
          low: b.low,
          close: b.close,
        })),
      );
    }

    chart.timeScale().fitContent();
    chartRef.current = chart;

    return () => {
      chart.remove();
      chartRef.current = null;
    };
  }, [filteredBars, chartStyle, pctChange]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", width: "100%" }}>
      {/* Chart Header Stats */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "6px 12px",
          background: "rgba(15, 23, 42, 0.6)",
          borderRadius: 6,
          marginBottom: 8,
        }}
      >
        <div>
          <span style={{ fontWeight: 700, fontSize: "0.9rem", color: "#f8fafc" }}>
            {assetName}
          </span>
          <span className="muted" style={{ marginLeft: 6, fontSize: "0.78rem" }}>
            ({symbol})
          </span>
        </div>

        {lastBar && (
          <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: "0.82rem" }}>
            <span>
              Price: <strong style={{ color: "#38bdf8" }}>₹{lastBar.close.toFixed(2)}</strong>
            </span>
            <span
              style={{
                fontWeight: 700,
                color: pctChange >= 0 ? "#22c55e" : "#ef4444",
              }}
            >
              {pctChange >= 0 ? "+" : ""}
              {pctChange.toFixed(2)}% ({timeframe})
            </span>
          </div>
        )}
      </div>

      {/* Chart Canvas Area */}
      <div style={{ flex: 1, minHeight: 280, position: "relative" }}>
        {loading ? (
          <div
            style={{
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#94a3b8",
              fontSize: "0.85rem",
            }}
          >
            Loading Price Action Chart...
          </div>
        ) : (
          <div
            ref={containerRef}
            style={{
              height: typeof height === "number" ? `${height}px` : height,
              width: "100%",
              borderRadius: 6,
              overflow: "hidden",
            }}
          />
        )}
      </div>
    </div>
  );
}
