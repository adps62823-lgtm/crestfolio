"use client";

import { useEffect, useRef, useState } from "react";
import { Globe } from "lucide-react";

type Props = {
  symbol?: string;
  height?: number | string;
};

export function TradingViewNewsTimeline({ symbol, height = 420 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [region, setRegion] = useState<"india" | "world">("india");

  const formatTvSymbol = (sym?: string) => {
    if (!sym) return undefined;
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
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-timeline.js";
    script.type = "text/javascript";
    script.async = true;

    const config: any = {
      displayMode: "regular",
      width: "100%",
      height: "100%",
      colorTheme: "dark",
      isTransparent: true,
      locale: "en",
    };

    if (tvSymbol) {
      config.symbol = tvSymbol;
    } else {
      config.feedMode = "market";
      config.market = region === "india" ? "stock" : "crypto";
    }

    script.innerHTML = JSON.stringify(config);

    containerRef.current.appendChild(widgetDiv);
    containerRef.current.appendChild(script);
  }, [tvSymbol, region]);

  return (
    <div className="panel" style={{ padding: 16, height: "100%", minHeight: 450 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <h3 style={{ margin: 0, fontSize: "1.05rem" }}>
          {tvSymbol ? `Real-Time News — ${symbol}` : "Top Stories & Market News"}
        </h3>

        {!tvSymbol && (
          <button
            className="button button-subtle"
            style={{ padding: "4px 8px", fontSize: "0.75rem" }}
            onClick={() => setRegion(region === "india" ? "world" : "india")}
          >
            <Globe size={12} style={{ marginRight: 4 }} />
            {region === "india" ? "🇮🇳 India News" : "🌐 World News"}
          </button>
        )}
      </div>

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
