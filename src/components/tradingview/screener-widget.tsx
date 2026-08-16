"use client";

import { useEffect, useRef } from "react";

export function TradingViewScreener() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    containerRef.current.innerHTML = "";
    const widgetDiv = document.createElement("div");
    widgetDiv.className = "tradingview-widget-container__widget";
    widgetDiv.style.height = "100%";
    widgetDiv.style.width = "100%";

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-screener.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      width: "100%",
      height: 720,
      defaultColumn: "overview",
      defaultScreen: "general",
      market: "india",
      showToolbar: true,
      colorTheme: "dark",
      locale: "en",
      isTransparent: true,
    });

    containerRef.current.appendChild(widgetDiv);
    containerRef.current.appendChild(script);
  }, []);

  return (
    <div className="panel" style={{ padding: 16 }}>
      <h3 style={{ margin: "0 0 12px 0", fontSize: "1.1rem" }}>
        TradingView Institutional Stock Screener (India Market)
      </h3>
      <div
        className="tradingview-widget-container"
        ref={containerRef}
        style={{ height: 720, width: "100%", overflow: "hidden", borderRadius: 8 }}
      />
    </div>
  );
}
