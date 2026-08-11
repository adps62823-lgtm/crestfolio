import Link from "next/link";
import { notFound } from "next/navigation";
import { AssetChart } from "@/components/asset-chart";
import { AiAssistant } from "@/components/ai-assistant";
import { ExportButtons } from "@/components/export-buttons";
import { getAssetDetail } from "@/server/repository";
import { formatCompactDate, formatCurrency, formatPercent } from "@/lib/format";

export default async function AssetPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const detail = await getAssetDetail(slug);
  if (!detail) notFound();

  const { asset } = detail;

  return (
    <main className="fade-up stack">
      <section className="hero">
        <div className="hero-card">
          <div className="hero-kicker">
            <span>{asset.assetClass}</span>
            <span>•</span>
            <span>{asset.sector}</span>
          </div>
          <h1>{asset.name}</h1>
          <p className="hero-copy">{asset.description}</p>
          <div style={{ marginTop: 18 }} className="pill-row">
            <div className="score">
              <strong>{formatCurrency(asset.lastPrice, asset.currency)}</strong>
              <span>Last price</span>
            </div>
            <span className="pill pill-active">{asset.symbol}</span>
            <span className="pill">{asset.benchmark}</span>
            <span className="pill">{formatCompactDate(asset.updatedAt)}</span>
          </div>
        </div>

        <div className="panel">
          <h3>Scoreboard</h3>
          <div className="meta-grid">
            {[
              ["Trend", asset.trendScore],
              ["Quality", asset.qualityScore],
              ["Valuation", asset.valuationScore],
              ["Sentiment", asset.sentimentScore],
              ["Conviction", asset.convictionScore],
              ["Risk", asset.riskScore],
            ].map(([label, value]) => (
              <div className="meta" key={String(label)}>
                <span>{label}</span>
                <strong>{String(value)}</strong>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 14 }} className="pill-row">
            <span className="pill pill-active">{formatPercent(asset.return1M)}</span>
            <span className="pill">{formatPercent(asset.return3M)}</span>
            <span className="pill">{formatPercent(asset.return6M)}</span>
            <span className="pill">{formatPercent(asset.return1Y)}</span>
          </div>
        </div>
      </section>

      <section className="section-grid">
        <AssetChart bars={detail.bars} events={detail.events} />

        <div className="stack">
          <ExportButtons slug={asset.slug} />
          <AiAssistant
            assetSlug={asset.slug}
            contextLabel={`Ask the copilot to review ${asset.symbol} using the current price, events, and news trail.`}
            starterPrompt={`Assess ${asset.name} for an IMA-style research memo. Focus on what matters, what can go wrong, and what I should monitor next.`}
          />
        </div>
      </section>

      <section className="section-grid">
        <div className="panel">
          <h3>Recent news</h3>
          <div className="stack" style={{ marginTop: 12 }}>
            {detail.news.map((item) => (
              <div key={item.id} className="asset-card">
                <h4>{item.headline}</h4>
                <p>{item.summary}</p>
                <div className="pill-row" style={{ marginTop: 10 }}>
                  <span className="pill pill-active">Sentiment {item.sentiment}</span>
                  <span className="pill">{item.impact}</span>
                  <span className="pill">{formatCompactDate(item.publishedAt)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <h3>Recent events</h3>
          <div className="stack" style={{ marginTop: 12 }}>
            {detail.events.map((event) => (
              <div key={event.id} className="asset-card">
                <h4>{event.title}</h4>
                <p>{event.detail}</p>
                <div className="pill-row" style={{ marginTop: 10 }}>
                  <span className="pill pill-active">{event.severity}</span>
                  <span className="pill">{event.type}</span>
                  <span className="pill">{formatCompactDate(event.eventDate)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-grid">
        <div className="panel">
          <h3>Related names</h3>
          <div className="stack" style={{ marginTop: 12 }}>
            {detail.related.map((related) => (
              <Link href={`/asset/${related.slug}`} className="asset-card" key={related.slug}>
                <h4>{related.name}</h4>
                <p>{related.description}</p>
                <div className="pill-row" style={{ marginTop: 10 }}>
                  <span className="pill pill-active">{related.convictionScore}</span>
                  <span className="pill">{related.sector}</span>
                  <span className="pill">{formatPercent(related.return1M)}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="panel">
          <h3>Research notes</h3>
          <div className="stack" style={{ marginTop: 12 }}>
            {detail.notes.map((note) => (
              <div key={note.id} className="asset-card">
                <h4>{note.title}</h4>
                <p>{note.thesis}</p>
                <div className="pill-row" style={{ marginTop: 10 }}>
                  <span className="pill pill-active">{note.status}</span>
                  {note.tags.slice(0, 2).map((tag) => (
                    <span className="pill" key={tag}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
