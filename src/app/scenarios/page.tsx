"use client";

import { useState } from "react";
import { SlidersHorizontal, ArrowUpRight, ArrowDownRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default function ScenariosPage() {
  const [crudeChange, setCrudeChange] = useState(15);
  const [rateCut, setRateCut] = useState(-50);
  const [usdinrChange, setUsdinrChange] = useState(2);

  return (
    <main className="fade-up stack">
      <div className="panel">
        <div className="toolbar">
          <div>
            <h3>"What-If" Macro Scenario Simulator</h3>
            <p className="muted">Simulate macro shock variables and map impacted stock sectors.</p>
          </div>
        </div>

        <div className="cards" style={{ marginTop: 12 }}>
          <div>
            <label className="footer-note">Crude Oil Shock: {crudeChange > 0 ? `+${crudeChange}` : crudeChange}%</label>
            <input
              className="input"
              type="range"
              min={-30}
              max={50}
              value={crudeChange}
              onChange={(e) => setCrudeChange(Number(e.target.value))}
            />
          </div>

          <div>
            <label className="footer-note">RBI Repo Rate Cut: {rateCut} bps</label>
            <input
              className="input"
              type="range"
              min={-100}
              max={100}
              step={25}
              value={rateCut}
              onChange={(e) => setRateCut(Number(e.target.value))}
            />
          </div>

          <div>
            <label className="footer-note">USD/INR Movement: {usdinrChange > 0 ? `+${usdinrChange}` : usdinrChange}%</label>
            <input
              className="input"
              type="range"
              min={-5}
              max={10}
              value={usdinrChange}
              onChange={(e) => setUsdinrChange(Number(e.target.value))}
            />
          </div>
        </div>
      </div>

      <div className="section-grid">
        <div className="panel">
          <h3 style={{ color: "var(--primary)" }}>Beneficiary Sectors & Assets</h3>
          <p className="muted">Sectors gaining pricing power or margin expansion under this scenario.</p>

          <div className="stack" style={{ marginTop: 14 }}>
            <div className="asset-card">
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <strong>IT Services (TCS, INFY)</strong>
                <span className="pill pill-active">+2.4% EBITDA expansion</span>
              </div>
              <p className="muted" style={{ marginTop: 4 }}>USD appreciation boosts rupee-denominated export revenues.</p>
            </div>

            <div className="asset-card">
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <strong>Realty & Financials (DLF, HDFC Bank)</strong>
                <span className="pill pill-active">+3.1% demand boost</span>
              </div>
              <p className="muted" style={{ marginTop: 4 }}>50bps rate cut lowers home loan EMI costs, spurring housing sales.</p>
            </div>
          </div>
        </div>

        <div className="panel">
          <h3 style={{ color: "var(--danger)" }}>Impacted / Margin Compression Sectors</h3>
          <p className="muted">Sectors facing raw material inflation or higher debt costs.</p>

          <div className="stack" style={{ marginTop: 14 }}>
            <div className="asset-card">
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <strong>Paints & Tyres (Asian Paints, MRF)</strong>
                <span className="pill" style={{ color: "var(--danger)" }}>-4.5% margin squeeze</span>
              </div>
              <p className="muted" style={{ marginTop: 4 }}>Crude derivatives account for 50%+ of input costs.</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
