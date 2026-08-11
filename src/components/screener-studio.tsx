"use client";

import { useEffect, useMemo, useState } from "react";
import type { AssetRecord, ScreenerPreset } from "@/lib/types";
import { Search } from "lucide-react";

type Props = {
  presets: ScreenerPreset[];
  facets: { sectors: string[]; assetClasses: string[]; tags: string[] };
};

type ScreenerResponse = {
  assets: AssetRecord[];
};

export function ScreenerStudio({ presets, facets }: Props) {
  const [query, setQuery] = useState("");
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
    if (activePreset) {
      const filters = activePreset.filters;
      if (filters.minTrendScore !== undefined) setTrend(filters.minTrendScore);
      if (filters.minQualityScore !== undefined) setQuality(filters.minQualityScore);
      if (filters.maxRiskScore !== undefined) setRisk(filters.maxRiskScore);
      if (filters.minConvictionScore !== undefined) setConviction(filters.minConvictionScore);
      if (filters.assetClass) setAssetClass(filters.assetClass);
    }
  }, [activePreset]);

  async function runScreener() {
    setLoading(true);
    const params = new URLSearchParams({
      query,
      assetClass,
      sector,
      minTrendScore: String(trend),
      minQualityScore: String(quality),
      maxRiskScore: String(risk),
      minConvictionScore: String(conviction),
    });

    const response = await fetch(`/api/screener?${params.toString()}`);
    const payload = (await response.json()) as ScreenerResponse;
    setAssets(payload.assets);
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
            <h3>Screener Studio</h3>
            <p className="muted">
              Blend filter sets, valuation constraints, trend bias, and conviction ranking.
            </p>
          </div>
          <button className="button button-primary" onClick={() => void runScreener()}>
            <Search size={16} />
            <span>{loading ? "Filtering..." : "Run screen"}</span>
          </button>
        </div>

        <div className="cards">
          <div>
            <label className="footer-note">Search</label>
            <input className="input" value={query} onChange={(event) => setQuery(event.target.value)} />
          </div>
          <div>
            <label className="footer-note">Preset</label>
            <select className="select" value={preset} onChange={(event) => setPreset(event.target.value)}>
              {presets.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="footer-note">Asset class</label>
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
            <label className="footer-note">Trend threshold: {trend}</label>
            <input className="input" type="range" min={0} max={100} value={trend} onChange={(event) => setTrend(Number(event.target.value))} />
          </div>
          <div>
            <label className="footer-note">Quality threshold: {quality}</label>
            <input className="input" type="range" min={0} max={100} value={quality} onChange={(event) => setQuality(Number(event.target.value))} />
          </div>
          <div>
            <label className="footer-note">Risk ceiling: {risk}</label>
            <input className="input" type="range" min={0} max={100} value={risk} onChange={(event) => setRisk(Number(event.target.value))} />
          </div>
          <div>
            <label className="footer-note">Conviction floor: {conviction}</label>
            <input className="input" type="range" min={0} max={100} value={conviction} onChange={(event) => setConviction(Number(event.target.value))} />
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="toolbar">
          <div>
            <h3>Screen Results</h3>
            <p className="muted">{assets.length} candidates ranked by conviction and trend.</p>
          </div>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Class</th>
                <th>Trend</th>
                <th>Conviction</th>
                <th>Risk</th>
                <th>Last Price</th>
              </tr>
            </thead>
            <tbody>
              {assets.map((asset) => (
                <tr key={asset.slug}>
                  <td>
                    <strong>{asset.name}</strong>
                    <div className="muted">{asset.symbol}</div>
                  </td>
                  <td>{asset.assetClass}</td>
                  <td>{asset.trendScore}</td>
                  <td>{asset.convictionScore}</td>
                  <td>{asset.riskScore}</td>
                  <td>{asset.lastPrice.toLocaleString("en-IN")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
