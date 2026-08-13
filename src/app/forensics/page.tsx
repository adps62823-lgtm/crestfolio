"use client";

import { ShieldAlert, CheckCircle, AlertTriangle } from "lucide-react";

export const dynamic = "force-dynamic";

const sampleForensics = [
  {
    name: "Tata Consultancy Services",
    symbol: "TCS",
    zScore: 6.8,
    mScore: -3.1,
    pledgePct: 0.0,
    workingCapDays: 62,
    flag: "clean",
    summary: "Strong balance sheet, zero promoter pledge, low accounting risk.",
  },
  {
    name: "Reliance Industries",
    symbol: "RELIANCE",
    zScore: 3.2,
    mScore: -2.4,
    pledgePct: 0.0,
    workingCapDays: 45,
    flag: "clean",
    summary: "Substantial capital expenditure; healthy solvency coverage.",
  },
  {
    name: "Adani Enterprises",
    symbol: "ADANIENT",
    zScore: 1.6,
    mScore: -1.8,
    pledgePct: 4.2,
    workingCapDays: 88,
    flag: "watch",
    summary: "Elevated debt leverage; Altman Z-Score sits in gray zone (1.6).",
  },
  {
    name: "Vedanta Limited",
    symbol: "VEDL",
    zScore: 1.4,
    mScore: -1.5,
    pledgePct: 99.8,
    workingCapDays: 52,
    flag: "warning",
    summary: "High promoter share pledge (99.8%); parent entity debt refinancing risk.",
  },
];

export default function ForensicsPage() {
  return (
    <main className="fade-up stack">
      <div className="panel">
        <div className="toolbar">
          <div>
            <h3>Financial Accounting Forensics & Red-Flag Scanner</h3>
            <p className="muted">
              Altman Z-Score (bankruptcy solvency), Beneish M-Score (earnings manipulation), Promoter Pledging %, and Working Capital cycle audit.
            </p>
          </div>
        </div>

        <div className="table-wrap" style={{ marginTop: 12 }}>
          <table className="table">
            <thead>
              <tr>
                <th>Company Symbol</th>
                <th>Altman Z-Score</th>
                <th>Beneish M-Score</th>
                <th>Promoter Pledge</th>
                <th>Working Cap Days</th>
                <th>Risk Audit Summary</th>
              </tr>
            </thead>
            <tbody>
              {sampleForensics.map((row) => (
                <tr key={row.symbol}>
                  <td>
                    <strong>{row.name}</strong>
                    <div className="muted">{row.symbol}</div>
                  </td>
                  <td>
                    <span className="pill" style={{ color: row.zScore > 2.9 ? "var(--primary)" : "var(--warning)" }}>
                      Z = {row.zScore} ({row.zScore > 2.9 ? "Safe Zone" : "Gray Zone"})
                    </span>
                  </td>
                  <td>
                    <span className="pill">
                      M = {row.mScore} (Unlikely Manipulation)
                    </span>
                  </td>
                  <td>
                    <span className="pill" style={{ color: row.pledgePct > 20 ? "var(--danger)" : "var(--text)" }}>
                      {row.pledgePct}%
                    </span>
                  </td>
                  <td>{row.workingCapDays} days</td>
                  <td style={{ maxWidth: 320 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      {row.flag === "clean" ? (
                        <CheckCircle size={14} style={{ color: "var(--primary)" }} />
                      ) : (
                        <AlertTriangle size={14} style={{ color: "var(--warning)" }} />
                      )}
                      <span className="muted">{row.summary}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
