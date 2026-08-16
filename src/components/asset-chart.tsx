"use client";

import { useEffect, useRef } from "react";
import {
  CandlestickSeries,
  ColorType,
  createChart,
  type IChartApi,
} from "lightweight-charts";
import type { PriceBar, EventItem } from "@/lib/types";

type Props = {
  bars: PriceBar[];
  events?: EventItem[];
  title?: string;
  subtitle?: string;
};

export function AssetChart({ bars, events = [], title, subtitle }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!ref.current || bars.length === 0) return;

    ref.current.innerHTML = "";

    const chart = createChart(ref.current, {
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#94a3b8",
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
      },
      crosshair: {
        vertLine: { color: "rgba(56, 189, 248, 0.4)" },
        horzLine: { color: "rgba(56, 189, 248, 0.4)" },
      },
    });

    const series = chart.addSeries(CandlestickSeries, {
      upColor: "#22c55e",
      downColor: "#ef4444",
      borderUpColor: "#22c55e",
      borderDownColor: "#ef4444",
      wickUpColor: "#22c55e",
      wickDownColor: "#ef4444",
    });

    const sortedBars = [...bars].sort(
      (a, b) => new Date(a.barDate).getTime() - new Date(b.barDate).getTime(),
    );

    series.setData(
      sortedBars.map((bar) => ({
        time: bar.barDate.slice(0, 10),
        open: bar.open,
        high: bar.high,
        low: bar.low,
        close: bar.close,
      })),
    );

    if (events.length > 0) {
      const markers = events.slice(0, 6).map((event, index) => ({
        time: event.eventDate.slice(0, 10),
        position: index % 2 === 0 ? "aboveBar" : "belowBar",
        color:
          event.severity === "high" || event.severity === "critical"
            ? "#f97316"
            : "#22c55e",
        shape: index % 2 === 0 ? "arrowDown" : "arrowUp",
        text: event.title.slice(0, 24),
      }));
      (series as any).setMarkers?.(markers);
    }

    chart.timeScale().fitContent();
    chartRef.current = chart;

    return () => {
      chart.remove();
      chartRef.current = null;
    };
  }, [bars, events]);

  const hasHeader = Boolean(title || subtitle);

  return (
    <div className={hasHeader ? "panel chart-shell" : ""}>
      {title && <h3>{title}</h3>}
      {subtitle && <p className="muted">{subtitle}</p>}
      {bars.length === 0 ? (
        <div
          style={{
            height: 320,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#64748b",
            fontSize: "0.88rem",
            background: "rgba(15, 23, 42, 0.4)",
            borderRadius: 8,
            border: "1px dashed rgba(255, 255, 255, 0.08)",
            marginTop: hasHeader ? 16 : 0,
          }}
        >
          No price history available for chart
        </div>
      ) : (
        <div
          ref={ref}
          style={{
            height: 320,
            width: "100%",
            borderRadius: 8,
            overflow: "hidden",
            marginTop: hasHeader ? 16 : 0,
          }}
        />
      )}
    </div>
  );
}
