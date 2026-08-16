"use client";

import { useEffect, useRef, useState } from "react";
import { Globe } from "lucide-react";

export function TradingViewTickerTape() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [region, setRegion] = useState<"india" | "world">("india");

  const indiaSymbols = [
    { proName: "NSE:NIFTY", title: "Nifty 50" },
    { proName: "NSE:BANKNIFTY", title: "Bank Nifty" },
    { proName: "NSE:RELIANCE", title: "Reliance" },
    { proName: "NSE:HDFCBANK", title: "HDFC Bank" },
    { proName: "NSE:TCS", title: "TCS" },
    { proName: "NSE:INFY", title: "Infosys" },
    { proName: "NSE:ITC", title: "ITC" },
    { proName: "NSE:INDIAVIX", title: "India VIX" },
    { proName: "MCX:GOLD1!", title: "Gold MCX" },
    { proName: "FX_IDC:USDINR", title: "USD / INR" },
  ];

  const worldSymbols = [
    { proName: "FOREXCOM:SPXUSD", title: "S&P 500" },
    { proName: "NASDAQ:NDX", title: "Nasdaq 100" },
    { proName: "TVC:DXY", title: "US Dollar Index" },
    { proName: "BITSTAMP:BTCUSD", title: "Bitcoin" },
    { proName: "FOREXCOM:EURUSD", title: "EUR / USD" },
    { proName: "TVC:US10Y", title: "US 10Y Yield" },
    { proName: "TVC:UKOIL", title: "Brent Crude" },
  ];

  const currentSymbols = region === "india" ? indiaSymbols : worldSymbols;

  useEffect(() => {
    if (!containerRef.current) return;

    containerRef.current.innerHTML = "";
    const widgetDiv = document.createElement("div");
    widgetDiv.className = "tradingview-widget-container__widget";

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      symbols: currentSymbols,
      showSymbolLogo: true,
      isTransparent: true,
      displayMode: "adaptive",
      colorTheme: "dark",
      locale: "en",
    });

    containerRef.current.appendChild(widgetDiv);
    containerRef.current.appendChild(script);
  }, [region]);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        background: "rgba(10, 16, 26, 0.95)",
        borderBottom: "1px solid var(--border)",
        padding: "0 12px",
        overflow: "hidden",
      }}
    >
      <div style={{ flex: 1, overflow: "hidden" }} ref={containerRef} />
      <button
        className="button button-subtle"
        style={{
          padding: "4px 8px",
          fontSize: "0.75rem",
          marginLeft: 8,
          whiteSpace: "nowrap",
          border: "1px solid var(--border-accent)",
          background: "var(--bg-subtle)",
        }}
        onClick={() => setRegion(region === "india" ? "world" : "india")}
      >
        <Globe size={12} style={{ marginRight: 4 }} />
        {region === "india" ? "🇮🇳 India Info" : "🌐 World Info"}
      </button>
    </div>
  );
}
