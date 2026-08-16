"use client";

import { useEffect, useRef, useState } from "react";
import { formatTradingViewSymbol } from "@/lib/tv-symbol-formatter";

type Props = {
  symbol: string;
  assetName?: string;
  height?: number | string;
  hideHeader?: boolean;
  initialStyle?: string;
  initialInterval?: string;
};

export function TradingViewChart({
  symbol,
  assetName,
  height = 540,
  hideHeader = false,
  initialStyle = "1",
  initialInterval = "D",
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<string>(initialStyle);
  const [interval, setInterval] = useState<string>(initialInterval);

  const tvSymbol = formatTradingViewSymbol(symbol, assetName);

  useEffect(() => {
    if (!containerRef.current) return;

    containerRef.current.innerHTML = "";
    const widgetDiv = document.createElement("div");
    widgetDiv.className = "tradingview-widget-container__widget";
    widgetDiv.style.height = "100%";
    widgetDiv.style.width = "100%";

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: tvSymbol,
      interval: interval,
      timezone: "Asia/Kolkata",
      theme: "dark",
      style: style,
      locale: "en",
      enable_publishing: false,
      allow_symbol_change: true,
      calendar: false,
      hide_side_toolbar: false,
      withdateranges: true,
      details: true,
      hotlist: true,
      show_popup_button: true,
      popup_width: "1000",
      popup_height: "650",
      support_host: "https://www.tradingview.com",
    });

    containerRef.current.appendChild(widgetDiv);
    containerRef.current.appendChild(script);
  }, [tvSymbol, style, interval]);

  return (
    <div className={hideHeader ? "" : "panel chart-shell"} style={{ padding: hideHeader ? 0 : 16, height: "100%", width: "100%" }}>
      {!hideHeader && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 12,
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: "1.05rem" }}>TradingView Technical Analysis Engine</h3>
            <p className="muted" style={{ margin: 0, fontSize: "0.82rem" }}>
              Institutional TradingView Chart — {assetName || symbol} ({tvSymbol}) with drawing tools & 100+ technical indicators
            </p>
          </div>

          <div className="pill-row" style={{ alignItems: "center", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ fontSize: "0.75rem", color: "var(--muted)" }}>Frequency:</span>
              {["15", "60", "D", "W", "M"].map((freq) => (
                <button
                  key={freq}
                  className={`button ${interval === freq ? "button-primary" : "button-subtle"}`}
                  style={{ padding: "2px 8px", fontSize: "0.72rem" }}
                  onClick={() => setInterval(freq)}
                >
                  {freq === "15" ? "15m" : freq === "60" ? "1h" : freq}
                </button>
              ))}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ fontSize: "0.75rem", color: "var(--muted)" }}>Style:</span>
              <button
                className={`button ${style === "1" ? "button-primary" : "button-subtle"}`}
                style={{ padding: "2px 8px", fontSize: "0.72rem" }}
                onClick={() => setStyle("1")}
              >
                Candles
              </button>
              <button
                className={`button ${style === "8" ? "button-primary" : "button-subtle"}`}
                style={{ padding: "2px 8px", fontSize: "0.72rem" }}
                onClick={() => setStyle("8")}
              >
                Heikin Ashi
              </button>
              <button
                className={`button ${style === "3" ? "button-primary" : "button-subtle"}`}
                style={{ padding: "2px 8px", fontSize: "0.72rem" }}
                onClick={() => setStyle("3")}
              >
                Area
              </button>
              <button
                className={`button ${style === "2" ? "button-primary" : "button-subtle"}`}
                style={{ padding: "2px 8px", fontSize: "0.72rem" }}
                onClick={() => setStyle("2")}
              >
                Line
              </button>
            </div>
          </div>
        </div>
      )}

      <div
        className="tradingview-widget-container"
        ref={containerRef}
        style={{ height: typeof height === "number" ? `${height}px` : height, width: "100%", borderRadius: hideHeader ? 0 : 8, overflow: "hidden" }}
      />
    </div>
  );
}
