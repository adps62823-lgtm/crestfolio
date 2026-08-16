import { notFound } from "next/navigation";
import { AssetChart } from "@/components/asset-chart";
import { TradingViewTechnicalAnalysis } from "@/components/tradingview/technical-analysis";
import { TradingViewFinancials } from "@/components/tradingview/financials-widget";
import { TradingViewCompanyProfile } from "@/components/tradingview/company-profile";
import { AiAssistant } from "@/components/ai-assistant";
import { ExportButtons } from "@/components/export-buttons";
import { getAssetDetail } from "@/server/repository";
import { formatCompactDate, formatCurrency } from "@/lib/format";

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
      {/* Hero Header */}
      <section className="hero">
        <div className="hero-card" style={{ width: "100%" }}>
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
              <span>Last Price</span>
            </div>
            <span className="pill pill-active">{asset.symbol}</span>
            <span className="pill">{asset.benchmark}</span>
            <span className="pill">{formatCompactDate(asset.updatedAt)}</span>
          </div>
        </div>
      </section>

      {/* Main Lightweight Candlestick Research Chart & TradingView Technical Analysis Gauge */}
      <section className="section-grid" style={{ gridTemplateColumns: "2fr 1fr" }}>
        <AssetChart
          bars={detail.bars}
          events={detail.events}
          title="Technical Research Chart"
          subtitle="Candlestick price action, SMA levels, and corporate event markers."
        />
        <TradingViewTechnicalAnalysis symbol={asset.symbol} height={480} />
      </section>

      {/* Consult CrestBot (Google Gemini AI) & Export Tools */}
      <section className="section-grid">
        <div className="stack">
          <ExportButtons slug={asset.slug} />
          <AiAssistant
            assetSlug={asset.slug}
            contextLabel={`Consult CrestBot (Google Gemini) for institutional analysis on ${asset.symbol}.`}
            starterPrompt={`Provide a detailed technical and fundamental analysis of ${asset.name} (${asset.symbol}). Highlight key support/resistance levels, RSI/MACD signals, and financial growth.`}
          />
        </div>

        {/* TradingView Real-Time Financials & Fundamental Suite */}
        <TradingViewFinancials symbol={asset.symbol} height={480} />
      </section>

      {/* Bottom Section: TradingView Company Profile & Parsed Live Web News */}
      <section className="section-grid">
        <TradingViewCompanyProfile symbol={asset.symbol} height={460} />

        <div
          className="panel"
          style={{
            padding: 20,
            height: "100%",
            minHeight: 460,
            display: "flex",
            flexDirection: "column",
            wordBreak: "break-word",
          }}
        >
          <h3 style={{ margin: "0 0 12px 0", fontSize: "1.05rem" }}>
            Real-Time Web News Signals — {asset.name}
          </h3>
          <div
            className="stack"
            style={{
              flex: 1,
              overflowY: "auto",
              paddingRight: 6,
              gap: 12,
            }}
          >
            {detail.news.length > 0 ? (
              detail.news.map((item) => (
                <div key={item.id} className="asset-card" style={{ padding: 12, borderRadius: 8 }}>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ textDecoration: "none", color: "inherit" }}
                  >
                    <h4 style={{ margin: "0 0 6px 0", fontSize: "0.95rem", color: "var(--fg)" }}>
                      {item.headline}
                    </h4>
                  </a>
                  <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--text-muted)", lineHeight: 1.4 }}>
                    {item.summary}
                  </p>
                  <div className="pill-row" style={{ marginTop: 10 }}>
                    <span className="pill pill-active" style={{ fontSize: "0.72rem" }}>
                      {item.source}
                    </span>
                    <span className="pill" style={{ fontSize: "0.72rem" }}>
                      {formatCompactDate(item.publishedAt)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="muted">No live news signals found for {asset.name}.</p>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
