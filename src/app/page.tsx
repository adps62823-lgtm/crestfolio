import Link from "next/link";
import { ArrowRight, BellRing, Gauge, Sparkles } from "lucide-react";
import { getDashboardSummary } from "@/server/repository";
import { StatGrid } from "@/components/stat-grid";
import { AiAssistant } from "@/components/ai-assistant";
import { formatCompactDate, formatCurrency, formatPercent } from "@/lib/format";

export default async function DashboardPage() {
  const dashboard = await getDashboardSummary();

  return (
    <main className="fade-up">
      <section className="hero">
        <div className="hero-card">
          <div className="hero-kicker">
            <Sparkles size={14} />
            <span>Single-user institutional research desk</span>
          </div>
          <h1>{dashboard.marketPulse.headline}</h1>
          <p className="hero-copy">{dashboard.marketPulse.note}</p>
          <div style={{ marginTop: 18 }} className="pill-row">
            <div className="score">
              <Gauge size={16} />
              <strong>{dashboard.marketPulse.score}</strong>
              <span>Market pulse</span>
            </div>
            <Link className="button button-primary" href="/screener">
              Open Screener
              <ArrowRight size={16} />
            </Link>
            <Link className="button" href="/research">
              <BellRing size={16} />
              <span>Review research queue</span>
            </Link>
          </div>
        </div>

        <div className="panel">
          <h3>Today's briefing stack</h3>
          <p className="muted">
            Public-source driven, AI-grounded, and tuned for Indian market research.
          </p>

          <div className="stack" style={{ marginTop: 16 }}>
            {dashboard.recentEvents.slice(0, 4).map((event) => (
              <div key={event.id} className="asset-card">
                <h4>{event.title}</h4>
                <p>{event.detail}</p>
                <div className="pill-row" style={{ marginTop: 10 }}>
                  <span className="pill pill-active">{event.severity}</span>
                  <span className="pill">{formatCompactDate(event.eventDate)}</span>
                  <span className="pill">{event.source}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <StatGrid stats={dashboard.stats} />

      <section className="section-grid">
        <div className="panel">
          <div className="toolbar">
            <div>
              <h3>Spotlight universe</h3>
              <p className="muted">The highest-conviction names from the current desk universe.</p>
            </div>
            <Link className="button" href="/universe">
              Universe
              <ArrowRight size={16} />
            </Link>
          </div>

          <div className="cards">
            {dashboard.spotlight.slice(0, 6).map((asset) => (
              <Link key={asset.slug} href={`/asset/${asset.slug}`} className="asset-card">
                <h4>
                  {asset.name}
                  <span className="muted" style={{ marginLeft: 8 }}>
                    {asset.symbol}
                  </span>
                </h4>
                <p>{asset.description}</p>
                <div className="meta-grid">
                  <div className="meta">
                    <span>Last Price</span>
                    <strong>{formatCurrency(asset.lastPrice, asset.currency)}</strong>
                  </div>
                  <div className="meta">
                    <span>1M Return</span>
                    <strong>{formatPercent(asset.return1M)}</strong>
                  </div>
                  <div className="meta">
                    <span>Conviction</span>
                    <strong>{asset.convictionScore}</strong>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="stack">
          <div className="panel">
            <h3>Watchlist</h3>
            <p className="muted">The names you care about most, ordered by priority.</p>
            <div className="stack" style={{ marginTop: 14 }}>
              {dashboard.watchlist.map((asset) => (
                <Link key={asset.slug} href={`/asset/${asset.slug}`} className="asset-card">
                  <h4>{asset.name}</h4>
                  <p>{asset.description}</p>
                  <div className="pill-row" style={{ marginTop: 10 }}>
                    <span className="pill pill-active">Priority {asset.convictionScore}</span>
                    <span className="pill">{asset.assetClass}</span>
                    <span className="pill">{asset.sector}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <AiAssistant
            contextLabel="Ask for a market regime brief, an idea review, or a thesis risk audit."
          />
        </div>
      </section>

      <section className="section-grid">
        <div className="panel">
          <h3>Recent news signals</h3>
          <p className="muted">Entity-linked news and event context that feeds the research loop.</p>
          <div className="stack" style={{ marginTop: 16 }}>
            {dashboard.recentNews.map((news) => (
              <div key={news.id} className="asset-card">
                <h4>{news.headline}</h4>
                <p>{news.summary}</p>
                <div className="pill-row" style={{ marginTop: 10 }}>
                  <span className="pill pill-active">Sentiment {news.sentiment}</span>
                  <span className="pill">{news.impact}</span>
                  <span className="pill">{formatCompactDate(news.publishedAt)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <h3>Data source posture</h3>
          <p className="muted">Free public sources and the local AI layer are wired into the workflow.</p>
          <div className="stack" style={{ marginTop: 16 }}>
            {dashboard.sources.map((source) => (
              <div key={source.name} className="asset-card">
                <h4>{source.name}</h4>
                <p>{source.notes ?? source.cadence}</p>
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
