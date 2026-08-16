"use client";

import { useEffect, useRef } from "react";
import { formatTradingViewSymbol } from "@/lib/tv-symbol-formatter";

type Props = {
  symbol: string;
  height?: number | string;
  dateRange?: "1D" | "1M" | "3M" | "12M" | "60M" | "ALL";
};

export function TradingViewMiniChart({
  symbol,
  height = 360,
  dateRange = "12M",
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const tvSymbol = formatTradingViewSymbol(symbol);

  useEffect(() => {
    if (!containerRef.current) return;

    containerRef.current.innerHTML = "";
    const widgetDiv = document.createElement("div");
    widgetDiv.className = "tradingview-widget-container__widget";
    widgetDiv.style.height = "100%";
    widgetDiv.style.width = "100%";

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      symbol: tvSymbol,
      width: "100%",
      height: "100%",
      locale: "en",
      dateRange: dateRange,
      colorTheme: "dark",
      isTransparent: true,
      autosize: true,
      largeChartUrl: "",
      chartOnly: false,
      trendLineColor: "rgba(41, 98, 255, 1)",
      underLineColor: "rgba(41, 98, 255, 0.15)",
      underLineBottomColor: "rgba(41, 98, 255, 0)",
    });

    containerRef.current.appendChild(widgetDiv);
    containerRef.current.appendChild(script);
  }, [tvSymbol, dateRange]);

  return (
    <div
      className="tradingview-widget-container"
      ref={containerRef}
      style={{
        height: typeof height === "number" ? `${height}px` : height,
        width: "100%",
        borderRadius: 8,
        overflow: "hidden",
      }}
    />
  );
}
