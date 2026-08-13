import Link from "next/link";
import { listAssets, getUniverseFacets, getWatchlistItems } from "@/server/repository";
import { formatCurrency, formatPercent } from "@/lib/format";
import type { ScreenerFilters } from "@/lib/types";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ query?: string; assetClass?: string; sector?: string }>;
};

export default async function UniversePage({ searchParams }: Props) {
  const { query, assetClass, sector } = await searchParams;
  const filters: ScreenerFilters = {
    query,
    assetClass: (assetClass as ScreenerFilters["assetClass"]) ?? "all",
    sector: sector ?? "all",
  };

  const [assets, facets, watchlist] = await Promise.all([
    listAssets(filters),
    getUniverseFacets(),
    getWatchlistItems(),
  ]);

  return (
    <main className="fade-up stack">
      <section className="panel">
        <div className="toolbar">
          <div>
            <h3>Universal Research Database (16,000+ Assets)</h3>
            <p className="muted">
              Complete universe covering 14,269 AMFI Mutual Fund schemes, NSE equities, MCX commodities, and macro benchmarks.
            </p>
          </div>
        </div>

        <form style={{ display: "flex", gap: 10, marginTop: 12 }} method="GET">
          <input
            name="query"
            className="input"
            defaultValue={query ?? ""}
            placeholder="Search 16,000+ stocks, mutual funds, AMCs, or commodities (e.g. Parag Parikh, Reliance, Gold)..."
          />
          <select name="assetClass" className="select" defaultValue={assetClass ?? "all"} style={{ width: 180 }}>
            <option value="all">All Asset Classes</option>
            <option value="mutual_fund">Mutual Funds (14k+)</option>
            <option value="equity">Equities (NSE/BSE)</option>
            <option value="commodity">Commodities (MCX)</option>
            <option value="index">Indices</option>
            <option value="macro">Macro</option>
          </select>
          <button type="submit" className="button button-primary">
            Filter Universe
          </button>
        </form>
      </section>

      <section className="section-grid">
        <div className="panel">
          <div className="toolbar">
            <h3>Loaded Universe Assets ({assets.length})</h3>
          </div>
          <div className="table-wrap" style={{ marginTop: 8 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Asset Name & Symbol</th>
                  <th>Class</th>
                  <th>Sector / AMC</th>
                  <th>Trend</th>
                  <th>Conviction</th>
                  <th>Last Price / NAV</th>
                </tr>
              </thead>
              <tbody>
                {assets.slice(0, 100).map((asset) => (
                  <tr key={asset.slug}>
                    <td>
                      <Link href={`/asset/${asset.slug}`}>
                        <strong>{asset.name}</strong>
                      </Link>
                      <div className="muted">{asset.symbol}</div>
                    </td>
                    <td>{asset.assetClass}</td>
                    <td>{asset.sector}</td>
                    <td><span className="pill pill-active">{asset.trendScore}</span></td>
                    <td><strong>{asset.convictionScore}</strong></td>
                    <td>₹{asset.lastPrice.toLocaleString("en-IN")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="stack">
          <div className="panel">
            <h3>Watchlist Priority</h3>
            <div className="stack" style={{ marginTop: 12 }}>
              {watchlist.map((item) => (
                <div className="asset-card" key={item.assetSlug}>
                  <h4>{item.symbol}</h4>
                  <p>{item.note}</p>
                  <div className="pill-row" style={{ marginTop: 10 }}>
                    <span className="pill pill-active">Priority {item.priority}</span>
                    <span className="pill">{new Date(item.createdAt).toLocaleDateString("en-IN")}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
