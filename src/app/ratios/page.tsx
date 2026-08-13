"use client";

import { Activity, TrendingUp, TrendingDown } from "lucide-react";

export const dynamic = "force-dynamic";

const ratios = [
  {
    name: "Gold / Nifty 50 Ratio",
    value: "3.02",
    change1M: "+2.4%",
    status: "Safe-haven Gold Outperforming",
    insight: "Rising ratio indicates institutional preference for gold hedging amid macro uncertainty.",
  },
  {
    name: "Nifty 50 / USD-INR Ratio",
    value: "287.4",
    change1M: "+1.1%",
    status: "FII USD Returns Stable",
    insight: "Equities holding value in USD terms, supporting foreign institutional net inflow thesis.",
  },
  {
    name: "Crude Oil / Nifty 50 Ratio",
    value: "0.28",
    change1M: "-4.2%",
    status: "Corporate Margins Favorable",
    insight: "Lower crude price relative to Nifty reduces raw material inflation pressures.",
  },
];

export default function RatiosPage() {
  return (
    <main className="fade-up stack">
      <div className="panel">
        <div className="toolbar">
          <div>
            <h3>Multi-Asset Inter-Market Macro Ratio Radar</h3>
            <p className="muted">Track inter-market asset relationships to detect structural regime shifts.</p>
          </div>
        </div>

        <div className="cards" style={{ marginTop: 12 }}>
          {ratios.map((item) => (
            <div key={item.name} className="asset-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <strong>{item.name}</strong>
                <span className="pill pill-active">{item.change1M} 1M</span>
              </div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: "2.4rem", fontWeight: 700, margin: "10px 0" }}>
                {item.value}
              </div>
              <div className="pill-row">
                <span className="pill">{item.status}</span>
              </div>
              <p className="muted" style={{ marginTop: 10, fontSize: "0.85rem" }}>
                {item.insight}
              </p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
