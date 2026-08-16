"use client";

import { useEffect, useRef } from "react";
import { formatTradingViewSymbol } from "@/lib/tv-symbol-formatter";

type Props = {
  symbol: string;
  height?: number | string;
};

export function TradingViewTechnicalAnalysis({ symbol, height = 480 }: Props) {
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
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-technical-analysis.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      interval: "1D",
      width: "100%",
      isTransparent: true,
      height: "100%",
      symbol: tvSymbol,
      showIntervalTabs: true,
      displayMode: "single",
      locale: "en",
      colorTheme: "dark",
    });

    containerRef.current.appendChild(widgetDiv);
    containerRef.current.appendChild(script);
  }, [tvSymbol]);

  return (
    <div
      className="panel"
      style={{ padding: 20, height: "100%", minHeight: 480, display: "flex", flexDirection: "column" }}
    >
      <h3 style={{ margin: "0 0 12px 0", fontSize: "1.05rem" }}>TradingView Technical Analysis Gauge</h3>
      <div
        className="tradingview-widget-container"
        ref={containerRef}
        style={{
          flex: 1,
          height: typeof height === "number" ? `${height}px` : height,
          width: "100%",
          overflow: "hidden",
        }}
      />
    </div>
  );
}
