import Link from "next/link";
import { notFound } from "next/navigation";
import { TradingViewChart } from "@/components/trading-view-chart";
import { AiAssistant } from "@/components/ai-assistant";
import { ExportButtons } from "@/components/export-buttons";
import { TechnicalMasterSuite } from "@/components/technical-master-suite";
import { compute50TechnicalIndicators } from "@/server/utilities/technicalSuite";
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
  const indicators = compute50TechnicalIndicators(asset, detail.bars);

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
          <h3>Market Metrics</h3>
          <div className="meta-grid">
            {[
              ["RSI (14)", asset.rsi14 ?? "50"],
              ["1M Return", formatPercent(asset.return1M)],
              ["1Y Return", formatPercent(asset.return1Y)],
              ["Volatility", `${asset.volatility}%`],
              ["Max Drawdown", `${asset.maxDrawdown}%`],
              ["P/E Ratio", asset.peRatio ?? "N/A"],
            ].map(([label, value]) => (
              <div className="meta" key={String(label)}>
                <span>{label}</span>
                <strong>{String(value)}</strong>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 14 }} className="pill-row">
            <span className="pill pill-active">{formatPercent(asset.return1W)} 1W</span>
            <span className="pill">{formatPercent(asset.return1M)} 1M</span>
            <span className="pill">{formatPercent(asset.return3M)} 3M</span>
            <span className="pill">{formatPercent(asset.return6M)} 6M</span>
            <span className="pill">{formatPercent(asset.return1Y)} 1Y</span>
          </div>
        </div>
      </section>

      {/* Single Responsive Complete TradingView Technical Chart Engine */}
      <TradingViewChart symbol={asset.symbol} assetName={asset.name} height={560} />

      <section className="section-grid">
        <div className="stack">
          <ExportButtons slug={asset.slug} />
          <AiAssistant
            assetSlug={asset.slug}
            contextLabel={`Consult CrestBot (Google Gemini) for deep technical analysis on ${asset.symbol}.`}
            starterPrompt={`Provide a detailed technical and fundamental analysis of ${asset.name} (${asset.symbol}). Highlight key support/resistance levels, RSI/MACD signals, and risks.`}
          />
        </div>

        <div className="panel">
          <h3>Recent corporate events & catalysts</h3>
          <div className="stack" style={{ marginTop: 12 }}>
            {detail.events.length > 0 ? (
              detail.events.map((event) => (
                <div key={event.id} className="asset-card">
                  <h4>{event.title}</h4>
                  <p>{event.detail}</p>
                  <div className="pill-row" style={{ marginTop: 10 }}>
                    <span className="pill pill-active">{event.severity}</span>
                    <span className="pill">{event.type}</span>
                    <span className="pill">{formatCompactDate(event.eventDate)}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="muted">No recent events recorded for this instrument.</p>
            )}
          </div>
        </div>
      </section>

      {/* 50+ Technical & Fundamental Suite */}
      <TechnicalMasterSuite indicators={indicators} assetName={asset.name} />

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
          <h3>Related names</h3>
          <div className="stack" style={{ marginTop: 12 }}>
            {detail.related.map((related) => (
              <Link href={`/asset/${related.slug}`} className="asset-card" key={related.slug}>
                <h4>{related.name}</h4>
                <p>{related.description}</p>
                <div className="pill-row" style={{ marginTop: 10 }}>
                  <span className="pill pill-active">RSI {related.rsi14 ?? 50}</span>
                  <span className="pill">{related.sector}</span>
                  <span className="pill">{formatPercent(related.return1M)}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
