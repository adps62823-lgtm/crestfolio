"use client";

import { Compass, TrendingUp, TrendingDown, RefreshCw } from "lucide-react";

export const dynamic = "force-dynamic";

const sectors = [
  { name: "Nifty Bank", change1D: +0.82, change1M: +3.4, change3M: +8.2, status: "Inflow / Accumulation" },
  { name: "Nifty IT", change1D: -1.24, change1M: -2.1, change3M: +1.4, status: "Outflow / Distribution" },
  { name: "Nifty Auto", change1D: +0.45, change1M: +5.1, change3M: +12.6, status: "Strong Uptrend" },
  { name: "Nifty Pharma", change1D: +0.12, change1M: +1.8, change3M: +6.4, status: "Defensive Holding" },
  { name: "Nifty FMCG", change1D: -0.32, change1M: +0.4, change3M: +2.1, status: "Consolidation" },
  { name: "Nifty Metal", change1D: +1.65, change1M: +6.8, change3M: -1.2, status: "Cyclical Rebound" },
  { name: "Nifty Realty", change1D: +2.10, change1M: +8.4, change3M: +18.9, status: "Leader" },
  { name: "Nifty Energy", change1D: +0.55, change1M: +2.9, change3M: +9.1, status: "Accumulation" },
];

export default function SectorsPage() {
  return (
    <main className="fade-up stack">
      <div className="panel">
        <div className="toolbar">
          <div>
            <h3>Sector Rotation & Institutional Money-Flow Radar</h3>
            <p className="muted">Track sector relative strength, 1D/1M/3M momentum shifts, and capital rotation.</p>
          </div>
        </div>

        <div className="cards" style={{ gridTemplateColumns: "repeat(4, minmax(0, 1fr))", marginTop: 12 }}>
          {sectors.map((sector) => (
            <div
              key={sector.name}
              className="asset-card"
              style={{
                borderColor: sector.change1M > 4 ? "var(--primary)" : sector.change1M < 0 ? "var(--danger)" : "var(--border)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <strong>{sector.name}</strong>
                <span
                  className="pill"
                  style={{
                    color: sector.change1D >= 0 ? "var(--primary)" : "var(--danger)",
                  }}
                >
                  {sector.change1D >= 0 ? "+" : ""}{sector.change1D}% 1D
                </span>
              </div>

              <div style={{ marginTop: 10, display: "flex", justifyContent: "space-between", fontSize: "0.85rem" }}>
                <span className="muted">1-Month Momentum</span>
                <strong style={{ color: sector.change1M >= 0 ? "var(--primary)" : "var(--danger)" }}>
                  {sector.change1M >= 0 ? "+" : ""}{sector.change1M}%
                </strong>
              </div>

              <div style={{ marginTop: 4, display: "flex", justifyContent: "space-between", fontSize: "0.85rem" }}>
                <span className="muted">3-Month Momentum</span>
                <strong>{sector.change3M >= 0 ? "+" : ""}{sector.change3M}%</strong>
              </div>

              <div style={{ marginTop: 10 }}>
                <span className="pill pill-active" style={{ fontSize: "0.75rem" }}>
                  {sector.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
