"use client";

import { useEffect, useRef } from "react";

type Props = {
  symbol: string;
  height?: number | string;
};

export function TradingViewCompanyProfile({ symbol, height = 400 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  const formatTvSymbol = (sym: string) => {
    if (!sym) return "NSE:NIFTY";
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
      style={{ padding: 16, height: "100%", minHeight: 350 }}
    >
      <h3 style={{ margin: "0 0 12px 0", fontSize: "1.05rem" }}>Company Profile & Business Information</h3>
      <div
        className="tradingview-widget-container"
        ref={containerRef}
        style={{
          height: typeof height === "number" ? `${height}px` : height,
          width: "100%",
          overflow: "hidden",
        }}
      />
    </div>
  );
}
