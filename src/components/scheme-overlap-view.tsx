"use client";

import { useState } from "react";
import type { AssetRecord, SchemeOverlapResult } from "@/lib/types";
import { Layers, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";

type Props = {
  mfAssets: AssetRecord[];
};

export function SchemeOverlapView({ mfAssets }: Props) {
  const [slugA, setSlugA] = useState<string>(mfAssets[0]?.slug ?? "parag-parikh-flexi-cap");
  const [slugB, setSlugB] = useState<string>(mfAssets[1]?.slug ?? "hdfc-top-100");
  const [result, setResult] = useState<SchemeOverlapResult | null>(null);
  const [loading, setLoading] = useState(false);

  async function calculateOverlap() {
    if (slugA === slugB) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/overlap?slugA=${slugA}&slugB=${slugB}`);
      const data = (await res.json()) as SchemeOverlapResult;
      setResult(data);
    } catch {
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="stack">
      <div className="panel">
        <div className="toolbar">
          <div>
            <h3>Mutual Fund Scheme Overlap Engine</h3>
            <p className="muted">
              Analyze underlying portfolio duplication, common stock holdings, and unique positions between two schemes.
            </p>
          </div>

          <button className="button button-primary" onClick={() => void calculateOverlap()}>
            <Layers size={16} />
            <span>{loading ? "Calculating..." : "Compute Overlap"}</span>
          </button>
        </div>

        <div className="cards" style={{ marginTop: 12 }}>
          <div>
            <label className="footer-note">Scheme A (Primary)</label>
            <select className="select" value={slugA} onChange={(e) => setSlugA(e.target.value)}>
              {mfAssets.map((asset) => (
                <option key={asset.slug} value={asset.slug}>
                  {asset.name} ({asset.symbol})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="footer-note">Scheme B (Comparison)</label>
            <select className="select" value={slugB} onChange={(e) => setSlugB(e.target.value)}>
              {mfAssets.map((asset) => (
                <option key={asset.slug} value={asset.slug}>
                  {asset.name} ({asset.symbol})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {result && (
        <div className="section-grid">
          <div className="panel" style={{ textAlign: "center", display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <span className="muted" style={{ fontSize: "0.9rem" }}>Portfolio Holding Overlap</span>
            <div
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "4.2rem",
                color: result.overlapPercentage > 40 ? "var(--danger)" : "var(--accent)",
                margin: "12px 0",
              }}
            >
              {result.overlapPercentage}%
            </div>
            <div className="pill-row" style={{ justifyContent: "center" }}>
              <span className="pill">
                {result.overlapPercentage > 40 ? "High Redundancy Risk" : "Good Diversification Balance"}
              </span>
            </div>
          </div>

          <div className="panel">
            <h3>Common Stock Holdings</h3>
            <p className="muted">Overlap positions held concurrently by both schemes.</p>
            <div className="stack" style={{ marginTop: 14 }}>
              {result.commonHoldings.map((item) => (
                <div key={item.companyName} className="asset-card" style={{ padding: "12px 16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <strong>{item.companyName}</strong>
                    <div className="pill-row">
                      <span className="pill pill-active">Scheme A: {item.weightA}%</span>
                      <span className="pill">Scheme B: {item.weightB}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
