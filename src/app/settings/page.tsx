import { getSettings, getSources } from "@/server/repository";

export default async function SettingsPage() {
  const [settings, sources] = await Promise.all([getSettings(), getSources()]);

  return (
    <main className="fade-up stack">
      <section className="panel">
        <h3>Settings</h3>
        <p className="muted">Local, single-user configuration with no multi-tenant overhead.</p>
      </section>

      <section className="section-grid">
        <div className="panel">
          <h3>Workspace defaults</h3>
          <div className="stack" style={{ marginTop: 12 }}>
            {Object.entries(settings).map(([key, value]) => (
              <div className="asset-card" key={key}>
                <h4>{key}</h4>
                <p>{String(value)}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <h3>Source registry</h3>
          <div className="stack" style={{ marginTop: 12 }}>
            {sources.map((source) => (
              <div className="asset-card" key={source.key}>
                <h4>{source.name}</h4>
                <p>{source.notes}</p>
                <div className="pill-row" style={{ marginTop: 10 }}>
                  <span className="pill pill-active">{source.status}</span>
                  <span className="pill">{source.cadence}</span>
                  <span className="pill">{source.freshness}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
