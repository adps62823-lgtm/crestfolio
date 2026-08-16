"use client";

import { useEffect, useRef } from "react";
import { formatTradingViewSymbol } from "@/lib/tv-symbol-formatter";

type Props = {
  symbol: string;
  height?: number | string;
};

export function TradingViewCompanyProfile({ symbol, height = 440 }: Props) {
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
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-symbol-profile.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      width: "100%",
      height: "100%",
      colorTheme: "dark",
      isTransparent: true,
      symbol: tvSymbol,
      locale: "en",
    });

    containerRef.current.appendChild(widgetDiv);
    containerRef.current.appendChild(script);
  }, [tvSymbol]);

  return (
    <div
      className="panel"
      style={{
        padding: 20,
        height: "100%",
        minHeight: 440,
        display: "flex",
        flexDirection: "column",
        wordBreak: "break-word",
      }}
    >
      <h3 style={{ margin: "0 0 12px 0", fontSize: "1.05rem" }}>Company Profile & Business Information</h3>
      <div
        className="tradingview-widget-container"
        ref={containerRef}
        style={{
          flex: 1,
          height: typeof height === "number" ? `${height}px` : height,
          width: "100%",
          overflowY: "auto",
        }}
      />
    </div>
  );
}
