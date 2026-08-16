"use client";

import { useEffect, useRef } from "react";

export function TradingViewMarketOverview() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    containerRef.current.innerHTML = "";
    const widgetDiv = document.createElement("div");
    widgetDiv.className = "tradingview-widget-container__widget";
    widgetDiv.style.height = "100%";
    widgetDiv.style.width = "100%";

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-market-overview.js";
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({
      colorTheme: "dark",
      dateRange: "12M",
      showChart: true,
      locale: "en",
      largeChartUrl: "",
      isTransparent: true,
      showSymbolLogo: true,
      showFloatingTooltip: false,
      width: "100%",
      height: "520",
      plotLineColorGrowing: "rgba(34, 197, 94, 1)",
      plotLineColorFalling: "rgba(239, 68, 68, 1)",
      gridLineColor: "rgba(240, 243, 250, 0)",
      scaleFontColor: "rgba(209, 213, 219, 1)",
      belowLineFillColorGrowing: "rgba(34, 197, 94, 0.12)",
      belowLineFillColorFalling: "rgba(239, 68, 68, 0.12)",
      belowLineFillColorGrowingBottom: "rgba(34, 197, 94, 0)",
      belowLineFillColorFallingBottom: "rgba(239, 68, 68, 0)",
      symbolActiveColor: "rgba(41, 98, 255, 0.12)",
      tabs: [
        {
          title: "Indian Indices",
          symbols: [
            { s: "NSE:NIFTY", d: "Nifty 50" },
            { s: "NSE:BANKNIFTY", d: "Bank Nifty" },
            { s: "NSE:FINNIFTY", d: "Fin Nifty" },
            { s: "NSE:CNXIT", d: "Nifty IT" },
            { s: "NSE:INDIAVIX", d: "India VIX" },
          ],
        },
        {
          title: "Core Indian Equities",
          symbols: [
            { s: "NSE:RELIANCE", d: "Reliance" },
            { s: "NSE:HDFCBANK", d: "HDFC Bank" },
            { s: "NSE:TCS", d: "TCS" },
            { s: "NSE:INFY", d: "Infosys" },
            { s: "NSE:ITC", d: "ITC" },
            { s: "NSE:SBIN", d: "SBI" },
          ],
        },
        {
          title: "Commodities & FX",
          symbols: [
            { s: "MCX:GOLD1!", d: "Gold Spot" },
            { s: "MCX:SILVER1!", d: "Silver Spot" },
            { s: "MCX:CRUDEOIL1!", d: "Crude Oil" },
            { s: "FX_IDC:USDINR", d: "USD / INR" },
          ],
        },
      ],
    });

    containerRef.current.appendChild(widgetDiv);
    containerRef.current.appendChild(script);
  }, []);

  return (
    <div className="panel" style={{ padding: 16 }}>
      <h3 style={{ margin: "0 0 12px 0", fontSize: "1.05rem" }}>Indian Market Overview & Real-Time Pulse</h3>
      <div
        className="tradingview-widget-container"
        ref={containerRef}
        style={{ height: 520, width: "100%", overflow: "hidden" }}
      />
    </div>
  );
}
