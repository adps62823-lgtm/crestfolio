import Link from "next/link";
import { listAssets, getUniverseFacets, getWatchlistItems } from "@/server/repository";
import { formatCurrency, formatPercent } from "@/lib/format";

export default async function UniversePage() {
  const [assets, facets, watchlist] = await Promise.all([
    listAssets(),
    getUniverseFacets(),
    getWatchlistItems(),
  ]);

  return (
    <main className="fade-up stack">
      <section className="panel">
        <h3>Universe</h3>
        <p className="muted">
          Browse the cross-asset research universe with a single owner mindset and institutional
          depth.
        </p>
        <div className="pill-row" style={{ marginTop: 14 }}>
          {facets.assetClasses.map((item) => (
            <span className="pill pill-active" key={item}>
              {item}
            </span>
          ))}
          {facets.sectors.slice(0, 6).map((item) => (
            <span className="pill" key={item}>
              {item}
            </span>
          ))}
        </div>
      </section>

      <section className="section-grid">
        <div className="panel">
          <h3>All assets</h3>
          <div className="table-wrap" style={{ marginTop: 12 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Class</th>
                  <th>Sector</th>
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
                      <Link href={`/asset/${asset.slug}`}>
                        <strong>{asset.name}</strong>
                      </Link>
                      <div className="muted">{asset.symbol}</div>
                    </td>
                    <td>{asset.assetClass}</td>
                    <td>{asset.sector}</td>
                    <td>{asset.trendScore}</td>
                    <td>{asset.convictionScore}</td>
                    <td>{asset.riskScore}</td>
                    <td>{formatCurrency(asset.lastPrice, asset.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="stack">
          <div className="panel">
            <h3>Watchlist summary</h3>
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

          <div className="panel">
            <h3>Benchmark lens</h3>
            <p className="muted">Relative performance and risk should always be read against the right benchmark.</p>
            <div className="stack" style={{ marginTop: 12 }}>
              {assets
                .filter((asset) => ["index", "macro", "commodity"].includes(asset.assetClass))
                .slice(0, 6)
                .map((asset) => (
                  <div key={asset.slug} className="asset-card">
                    <h4>{asset.name}</h4>
                    <p>{asset.benchmark}</p>
                    <div className="pill-row" style={{ marginTop: 10 }}>
                      <span className="pill pill-active">{formatPercent(asset.return1M)}</span>
                      <span className="pill">{formatPercent(asset.return6M)}</span>
                      <span className="pill">{formatPercent(asset.return1Y)}</span>
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
