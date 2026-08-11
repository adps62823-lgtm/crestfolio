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
};

export function AssetChart({ bars, events = [] }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!ref.current || bars.length === 0) return;

    const chart = createChart(ref.current, {
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: "rgba(8, 16, 24, 0)" },
        textColor: "#dbe7ef",
      },
      grid: {
        vertLines: { color: "rgba(255,255,255,0.05)" },
        horzLines: { color: "rgba(255,255,255,0.05)" },
      },
      rightPriceScale: {
        borderColor: "rgba(255,255,255,0.08)",
      },
      timeScale: {
        borderColor: "rgba(255,255,255,0.08)",
      },
      crosshair: {
        vertLine: { color: "rgba(145,228,138,0.48)" },
        horzLine: { color: "rgba(145,228,138,0.48)" },
      },
    });

    const series = chart.addSeries(CandlestickSeries, {
      upColor: "#91e48a",
      downColor: "#ff7f7f",
      borderUpColor: "#91e48a",
      borderDownColor: "#ff7f7f",
      wickUpColor: "#91e48a",
      wickDownColor: "#ff7f7f",
    });

    series.setData(
      bars.map((bar) => ({
        time: bar.barDate,
        open: bar.open,
        high: bar.high,
        low: bar.low,
        close: bar.close,
      })),
    );

    const markers = events.slice(0, 6).map((event, index) => ({
      time: event.eventDate.slice(0, 10),
      position: index % 2 === 0 ? "aboveBar" : "belowBar",
      color: event.severity === "high" || event.severity === "critical" ? "#ff9d5c" : "#91e48a",
      shape: index % 2 === 0 ? "arrowDown" : "arrowUp",
      text: event.title.slice(0, 24),
    }));
    (series as any).setMarkers?.(markers);

    chart.timeScale().fitContent();
    chartRef.current = chart;

    const resizeObserver = new ResizeObserver(() => {
      chart.applyOptions({ width: ref.current?.clientWidth ?? 0, height: 420 });
    });
    resizeObserver.observe(ref.current);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
    };
  }, [bars, events]);

  return (
    <div className="panel chart-shell">
      <h3>Research Chart</h3>
      <p className="muted">Candles, event markers, and institutional-style price context.</p>
      <div ref={ref} style={{ height: 350, marginTop: 16 }} />
    </div>
  );
}
