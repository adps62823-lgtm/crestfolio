"use client";

import { useEffect, useRef, useState } from "react";
import { Globe } from "lucide-react";

export function TradingViewEconomicCalendar() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [region, setRegion] = useState<"IN" | "ALL">("IN");

  useEffect(() => {
    if (!containerRef.current) return;

    containerRef.current.innerHTML = "";
    const widgetDiv = document.createElement("div");
    widgetDiv.className = "tradingview-widget-container__widget";
    widgetDiv.style.height = "100%";
    widgetDiv.style.width = "100%";

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-events.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      colorTheme: "dark",
      isTransparent: true,
      width: "100%",
      height: "100%",
      locale: "en",
      importanceFilter: "-1,0,1",
      countryFilter: region === "IN" ? "in" : "us,eu,gb,jp,cn,in",
    });

    containerRef.current.appendChild(widgetDiv);
    containerRef.current.appendChild(script);
  }, [region]);

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
        <h3 style={{ margin: 0, fontSize: "1.05rem" }}>Economic Calendar</h3>
        <button
          className="button button-subtle"
          style={{ padding: "4px 8px", fontSize: "0.75rem" }}
          onClick={() => setRegion(region === "IN" ? "ALL" : "IN")}
        >
          <Globe size={12} style={{ marginRight: 4 }} />
          {region === "IN" ? "🇮🇳 India Events" : "🌐 Global Events"}
        </button>
      </div>

      <div
        className="tradingview-widget-container"
        ref={containerRef}
        style={{ height: 420, width: "100%", overflow: "hidden" }}
      />
    </div>
  );
}
