"use client";

import { useEffect, useRef } from "react";
import { formatTradingViewSymbol } from "@/lib/tv-symbol-formatter";

type Props = {
  symbol: string;
  chartType?: "area" | "candlesticks" | "line";
  height?: number | string;
};

export function TradingViewSymbolOverview({
  symbol,
  chartType = "area",
  height = 420,
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
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-symbol-overview.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      symbols: [[tvSymbol]],
      chartOnly: false,
      width: "100%",
      height: "100%",
      locale: "en",
      colorTheme: "dark",
      autosize: true,
      showVolume: true,
      showMA: true,
      hideDateRanges: false,
      hideMarketStatus: false,
      hideSymbolLogo: false,
      scalePosition: "right",
      scaleMode: "Normal",
      fontFamily: "-apple-system, BlinkMacSystemFont, Trebuchet MS, Roboto, Ubuntu, sans-serif",
      noTimeScale: false,
      valuesTracking: "1",
      changeMode: "price-and-percent",
      chartType: chartType,
      maLineColor: "#2962FF",
      maLineWidth: 1,
      maLength: 9,
      headerFontSize: "medium",
      lineWidth: 2,
      lineType: 0,
      dateRanges: ["1d|1", "1m|30", "3m|60", "12m|1D", "60m|1W", "all|1M"],
    });

    containerRef.current.appendChild(widgetDiv);
    containerRef.current.appendChild(script);
  }, [tvSymbol, chartType]);

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
