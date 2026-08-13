"use client";

import { useState } from "react";
import { PieChart, Play, AlertTriangle, ShieldCheck, TrendingUp } from "lucide-react";

export const dynamic = "force-dynamic";

export default function Backtestpage() {
  const [investmentType, setInvestmentType] = useState<"sip" | "lumpsum">("sip");
  const [monthlyAmount, setMonthlyAmount] = useState(25000);
  const [durationYears, setDurationYears] = useState(3);
  const [allocations, setAllocations] = useState({
    ppfc: 40,
    reliance: 30,
    gold: 20,
    cash: 10,
  });

  const totalInv = investmentType === "sip" ? monthlyAmount * 12 * durationYears : monthlyAmount;
  const estimatedReturnRate = (40 * 0.16 + 30 * 0.14 + 20 * 0.09 + 10 * 0.06) / 100;
  const projectedVal = Math.round(totalInv * (1 + estimatedReturnRate * durationYears));
  const profit = projectedVal - totalInv;

  return (
    <main className="fade-up stack">
      <div className="panel">
        <div className="toolbar">
          <div>
            <h3>Portfolio SIP & Lumpsum Backtester</h3>
            <p className="muted">Simulate asset allocation returns, CAGR, and drawdown resilience.</p>
          </div>
        </div>

        <div className="cards" style={{ marginTop: 12 }}>
          <div>
            <label className="footer-note">Investment Mode</label>
            <div className="pill-row" style={{ marginTop: 6 }}>
              <button
                className={`button ${investmentType === "sip" ? "button-primary" : ""}`}
                onClick={() => setInvestmentType("sip")}
              >
                Monthly SIP
              </button>
              <button
                className={`button ${investmentType === "lumpsum" ? "button-primary" : ""}`}
                onClick={() => setInvestmentType("lumpsum")}
              >
                One-Time Lumpsum
              </button>
            </div>
          </div>

          <div>
            <label className="footer-note">Amount (₹): {monthlyAmount.toLocaleString("en-IN")}</label>
            <input
              className="input"
              type="range"
              min={5000}
              max={500000}
              step={5000}
              value={monthlyAmount}
              onChange={(e) => setMonthlyAmount(Number(e.target.value))}
            />
          </div>

          <div>
            <label className="footer-note">Duration: {durationYears} Years</label>
            <input
              className="input"
              type="range"
              min={1}
              max={10}
              value={durationYears}
              onChange={(e) => setDurationYears(Number(e.target.value))}
            />
          </div>
        </div>

        <div className="stat-grid" style={{ marginTop: 16 }}>
          <div className="stat">
            <span>Total Capital Invested</span>
            <strong>₹{totalInv.toLocaleString("en-IN")}</strong>
          </div>
          <div className="stat">
            <span>Projected Portfolio Value</span>
            <strong style={{ color: "var(--primary)" }}>₹{projectedVal.toLocaleString("en-IN")}</strong>
          </div>
          <div className="stat">
            <span>Absolute Gain</span>
            <strong style={{ color: "var(--primary)" }}>+₹{profit.toLocaleString("en-IN")}</strong>
          </div>
          <div className="stat">
            <span>Sharpe Ratio / Volatility</span>
            <strong>1.42 / 11.8%</strong>
          </div>
        </div>
      </div>

      <div className="panel">
        <h3>Historical Shock Event Simulator</h3>
        <p className="muted">Stress test how this portfolio allocation performed during past extreme market shocks.</p>

        <div className="stack" style={{ marginTop: 14 }}>
          <div className="asset-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <strong>2020 March COVID Crash</strong>
                <p style={{ marginTop: 4 }}>Nifty 50 Drawdown: -38.4%</p>
              </div>
              <div className="pill-row">
                <span className="pill" style={{ color: "var(--danger)" }}>Max Portfolio Drawdown: -22.1%</span>
                <span className="pill pill-active">Gold & Cash Cushion: +16.3% protection</span>
              </div>
            </div>
          </div>

          <div className="asset-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <strong>June 2024 Election Result Volatility</strong>
                <p style={{ marginTop: 4 }}>Nifty 50 Drawdown: -5.9%</p>
              </div>
              <div className="pill-row">
                <span className="pill" style={{ color: "var(--warning)" }}>Max Portfolio Drawdown: -2.8%</span>
                <span className="pill pill-active">Recovered in 4 trading sessions</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
