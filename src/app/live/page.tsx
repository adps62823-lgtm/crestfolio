import { LiveSyncButton } from "@/components/live-sync-button";
import { getLiveOverview } from "@/server/repository";
import { formatCompactDate, formatCurrency, formatPercent, formatRelativeDate } from "@/lib/format";

export default async function LivePage() {
  const live = await getLiveOverview();

  return (
    <main className="fade-up stack">
      <section className="hero">
        <div className="hero-card">
          <div className="hero-kicker">
            <span>Live public connectors</span>
          </div>
          <h1>Official data, free-first, and synced into the research desk.</h1>
          <p className="hero-copy">
            AMFI, NSE, MCX, RBI, and MoSPI are wired as official public-source connectors. Use
            them to refresh the local research store without paid infrastructure.
          </p>
        </div>
        <LiveSyncButton />
      </section>

      <section className="section-grid">
        <div className="panel">
          <h3>AMFI latest NAVs</h3>
          <div className="stack" style={{ marginTop: 12 }}>
            {live.amfiLatest.map((row) => (
              <div className="asset-card" key={row.schemeCode}>
                <h4>{row.schemeName}</h4>
                <p>{row.amc} · {row.category} · {row.subCategory}</p>
                <div className="pill-row" style={{ marginTop: 10 }}>
                  <span className="pill pill-active">{row.nav ?? "—"}</span>
                  <span className="pill">{row.navDate ?? "latest"}</span>
                  <span className="pill">{formatRelativeDate(row.updatedAt)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <h3>NSE bhavcopy</h3>
          <div className="stack" style={{ marginTop: 12 }}>
            {live.nseBhavcopy.map((row) => (
              <div className="asset-card" key={row.symbol}>
                <h4>{row.symbol}</h4>
                <p>{row.series}</p>
                <div className="pill-row" style={{ marginTop: 10 }}>
                  <span className="pill pill-active">{formatCurrency(row.lastPrice, "INR")}</span>
                  <span className="pill">{formatPercent(row.deliveryPct)}</span>
                  <span className="pill">{formatRelativeDate(row.updatedAt)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-grid">
        <div className="panel">
          <h3>NSE announcements</h3>
          <div className="stack" style={{ marginTop: 12 }}>
            {live.nseAnnouncements.map((item) => (
              <div className="asset-card" key={item.id}>
                <h4>{item.subject}</h4>
                <p>{item.companyName} · {item.symbol}</p>
                <div className="pill-row" style={{ marginTop: 10 }}>
                  <span className="pill pill-active">{item.category}</span>
                  <span className="pill">{formatCompactDate(item.broadcastAt)}</span>
                  <span className="pill">{formatRelativeDate(item.updatedAt)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <h3>MCX and macro</h3>
          <div className="stack" style={{ marginTop: 12 }}>
            {live.mcxSpots.map((item) => (
              <div className="asset-card" key={item.id}>
                <h4>{item.commodity}</h4>
                <p>{item.location}</p>
                <div className="pill-row" style={{ marginTop: 10 }}>
                  <span className="pill pill-active">{item.spotPrice ?? "—"}</span>
                  <span className="pill">{item.upDown || "spot"}</span>
                  <span className="pill">{formatRelativeDate(item.updatedAt)}</span>
                </div>
              </div>
            ))}

            {live.macros.slice(0, 8).map((macro) => (
              <div className="asset-card" key={macro.id}>
                <h4>{macro.metric}</h4>
                <p>{macro.notes}</p>
                <div className="pill-row" style={{ marginTop: 10 }}>
                  <span className="pill pill-active">
                    {macro.value}
                    {macro.unit !== "status" ? macro.unit : ""}
                  </span>
                  <span className="pill">{macro.sourceKey}</span>
                  <span className="pill">{formatRelativeDate(macro.updatedAt)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="panel">
        <h3>Sync log</h3>
        <div className="table-wrap" style={{ marginTop: 12 }}>
          <table className="table">
            <thead>
              <tr>
                <th>Source</th>
                <th>Status</th>
                <th>Records</th>
                <th>Finished</th>
                <th>Message</th>
              </tr>
            </thead>
            <tbody>
              {live.sourceRuns.map((run) => (
                <tr key={run.id}>
                  <td>{run.sourceKey}</td>
                  <td>{run.status}</td>
                  <td>{run.recordsCount}</td>
                  <td>{formatRelativeDate(run.finishedAt)}</td>
                  <td>{run.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
