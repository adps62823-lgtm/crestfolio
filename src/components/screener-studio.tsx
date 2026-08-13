"use client";

import { useEffect, useMemo, useState } from "react";
import type { AssetRecord, ScreenerPreset } from "@/lib/types";
import { Search, Code, Filter, Sparkles, Terminal } from "lucide-react";
import Link from "next/link";

type Props = {
  presets: ScreenerPreset[];
  facets: { sectors: string[]; assetClasses: string[]; tags: string[] };
};

type ScreenerResponse = {
  assets: AssetRecord[];
};

export function ScreenerStudio({ presets, facets }: Props) {
  const [query, setQuery] = useState("");
  const [formula, setFormula] = useState("pe_ratio < 35 AND roe > 15 AND trend_score > 60");
  const [useFormula, setUseFormula] = useState(false);
  const [assetClass, setAssetClass] = useState<"all" | string>("all");
  const [sector, setSector] = useState<"all" | string>("all");
  const [preset, setPreset] = useState<string>(presets[0]?.id ?? "custom");
  const [trend, setTrend] = useState(65);
  const [quality, setQuality] = useState(70);
  const [risk, setRisk] = useState(40);
  const [conviction, setConviction] = useState(70);
  const [assets, setAssets] = useState<AssetRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const activePreset = useMemo(
    () => presets.find((item) => item.id === preset),
    [presets, preset],
  );

  useEffect(() => {
    if (activePreset && !useFormula) {
      const filters = activePreset.filters;
      if (filters.minTrendScore !== undefined) setTrend(filters.minTrendScore);
      if (filters.minQualityScore !== undefined) setQuality(filters.minQualityScore);
      if (filters.maxRiskScore !== undefined) setRisk(filters.maxRiskScore);
      if (filters.minConvictionScore !== undefined) setConviction(filters.minConvictionScore);
      if (filters.assetClass) setAssetClass(filters.assetClass);
    }
  }, [activePreset, useFormula]);

  async function runScreener() {
    setLoading(true);
    let url = "";
    if (useFormula && formula.trim()) {
      url = `/api/screener?formula=${encodeURIComponent(formula)}&assetClass=${assetClass}`;
    } else {
      const params = new URLSearchParams({
        query,
        assetClass,
        sector,
        minTrendScore: String(trend),
        minQualityScore: String(quality),
        maxRiskScore: String(risk),
        minConvictionScore: String(conviction),
      });
      url = `/api/screener?${params.toString()}`;
    }

    const response = await fetch(url);
    const payload = (await response.json()) as ScreenerResponse;
    setAssets(payload.assets ?? []);
    setLoading(false);
  }

  useEffect(() => {
    void runScreener();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="stack">
      <div className="panel">
        <div className="toolbar">
          <div>
            <h3>Screener Studio & Formula Engine</h3>
            <p className="muted">
              Combine Screener.in / Tickertape style filter sliders or custom quantitative formulas.
            </p>
          </div>

          <div className="pill-row">
            <button
              className={`button ${!useFormula ? "button-primary" : ""}`}
              onClick={() => setUseFormula(false)}
            >
              <Filter size={14} /> Filter Set
            </button>
            <button
              className={`button ${useFormula ? "button-primary" : ""}`}
              onClick={() => setUseFormula(true)}
            >
              <Code size={14} /> Quantitative Formula
            </button>
            <button className="button button-primary" onClick={() => void runScreener()}>
              <Search size={16} />
              <span>{loading ? "Evaluating..." : "Run Screen"}</span>
            </button>
          </div>
        </div>

        {useFormula ? (
          <div style={{ marginTop: 12 }}>
            <label className="footer-note" style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 6 }}>
              <Terminal size={14} style={{ color: "var(--accent)" }} /> Custom Formula Expression
            </label>
            <input
              className="input"
              style={{ fontFamily: "monospace", fontSize: "0.95rem", color: "var(--accent)" }}
              value={formula}
              onChange={(e) => setFormula(e.target.value)}
              placeholder="e.g. pe_ratio < 30 AND roe > 18 AND return_1m > 0"
            />
            <div className="footer-note" style={{ marginTop: 6, fontSize: "0.8rem" }}>
              Supported variables: <code>pe_ratio</code>, <code>pb_ratio</code>, <code>roe</code>, <code>trend_score</code>, <code>quality_score</code>, <code>risk_score</code>, <code>conviction_score</code>, <code>return_1m</code>, <code>rsi</code>
            </div>
          </div>
        ) : (
          <div className="cards" style={{ marginTop: 12 }}>
            <div>
              <label className="footer-note">Search Keyword</label>
              <input className="input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name, symbol, or tag..." />
            </div>
            <div>
              <label className="footer-note">Preset Set</label>
              <select className="select" value={preset} onChange={(event) => setPreset(event.target.value)}>
                {presets.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="footer-note">Asset Class</label>
              <select className="select" value={assetClass} onChange={(event) => setAssetClass(event.target.value)}>
                <option value="all">All</option>
                {facets.assetClasses.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="footer-note">Sector</label>
              <select className="select" value={sector} onChange={(event) => setSector(event.target.value)}>
                <option value="all">All</option>
                {facets.sectors.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="footer-note">Trend Threshold: {trend}</label>
              <input className="input" type="range" min={0} max={100} value={trend} onChange={(event) => setTrend(Number(event.target.value))} />
            </div>
            <div>
              <label className="footer-note">Quality Threshold: {quality}</label>
              <input className="input" type="range" min={0} max={100} value={quality} onChange={(event) => setQuality(Number(event.target.value))} />
            </div>
            <div>
              <label className="footer-note">Risk Ceiling: {risk}</label>
              <input className="input" type="range" min={0} max={100} value={risk} onChange={(event) => setRisk(Number(event.target.value))} />
            </div>
            <div>
              <label className="footer-note">Conviction Floor: {conviction}</label>
              <input className="input" type="range" min={0} max={100} value={conviction} onChange={(event) => setConviction(Number(event.target.value))} />
            </div>
          </div>
        )}
      </div>

      <div className="panel">
        <div className="toolbar">
          <div>
            <h3>Screen Results ({assets.length})</h3>
            <p className="muted">Candidates matching current criteria, ordered by conviction score.</p>
          </div>
        </div>

        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Asset Name</th>
                <th>Class</th>
                <th>Sector</th>
                <th>Trend</th>
                <th>Quality</th>
                <th>Conviction</th>
                <th>Risk</th>
                <th>Last Price</th>
              </tr>
            </thead>
            <tbody>
              {assets.map((asset) => (
                <tr key={asset.slug}>
                  <td>
                    <Link href={`/asset/${asset.slug}`} style={{ color: "inherit" }}>
                      <strong>{asset.name}</strong>
                      <div className="muted">{asset.symbol}</div>
                    </Link>
                  </td>
                  <td>{asset.assetClass}</td>
                  <td>{asset.sector}</td>
                  <td><span className="pill pill-active">{asset.trendScore}</span></td>
                  <td>{asset.qualityScore}</td>
                  <td><strong>{asset.convictionScore}</strong></td>
                  <td>{asset.riskScore}</td>
                  <td>₹{asset.lastPrice.toLocaleString("en-IN")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
