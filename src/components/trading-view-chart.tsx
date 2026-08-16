"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  symbol: string;
  assetName?: string;
  height?: number;
};

export function TradingViewChart({ symbol, assetName, height = 520 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<"1" | "2" | "3" | "8" | "9">("1");

  const formatTvSymbol = (sym: string) => {
    const s = sym.toUpperCase().replace("-", "").trim();
    if (s.includes("NIFTY") || s === "NIFTY50") return "NSE:NIFTY";
    if (s.includes("BANKNIFTY")) return "NSE:BANKNIFTY";
    if (s.includes("VIX") || s === "INDIAVIX") return "NSE:INDIAVIX";
    if (s === "GOLD" || s === "SILVER" || s === "CRUDEOIL") return `MCX:${s}1!`;
    if (s === "USDINR" || s === "USD/INR") return "FX_IDC:USDINR";
    if (s.startsWith("NSE:") || s.startsWith("BSE:") || s.startsWith("MCX:")) return s;
    return `NSE:${s}`;
  };

  const tvSymbol = formatTvSymbol(symbol);

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
      interval: "D",
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
  }, [tvSymbol, style]);

  return (
    <div className="panel chart-shell" style={{ padding: 16 }}>
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

        <div className="pill-row" style={{ alignItems: "center" }}>
          <span style={{ fontSize: "0.78rem", color: "var(--muted)", marginRight: 4 }}>
            Style:
          </span>
          <button
            className={`button ${style === "1" ? "button-primary" : "button-subtle"}`}
            style={{ padding: "4px 10px", fontSize: "0.78rem" }}
            onClick={() => setStyle("1")}
          >
            Candles
          </button>
          <button
            className={`button ${style === "8" ? "button-primary" : "button-subtle"}`}
            style={{ padding: "4px 10px", fontSize: "0.78rem" }}
            onClick={() => setStyle("8")}
          >
            Heikin Ashi
          </button>
          <button
            className={`button ${style === "3" ? "button-primary" : "button-subtle"}`}
            style={{ padding: "4px 10px", fontSize: "0.78rem" }}
            onClick={() => setStyle("3")}
          >
            Area
          </button>
          <button
            className={`button ${style === "2" ? "button-primary" : "button-subtle"}`}
            style={{ padding: "4px 10px", fontSize: "0.78rem" }}
            onClick={() => setStyle("2")}
          >
            Line
          </button>
        </div>
      </div>

      <div
        className="tradingview-widget-container"
        ref={containerRef}
        style={{ height: height, width: "100%", borderRadius: 8, overflow: "hidden" }}
      />
    </div>
  );
}
