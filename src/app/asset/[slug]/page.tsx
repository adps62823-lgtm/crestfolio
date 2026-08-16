import { notFound } from "next/navigation";
import { TradingViewChart } from "@/components/trading-view-chart";
import { TradingViewTechnicalAnalysis } from "@/components/tradingview/technical-analysis";
import { TradingViewFinancials } from "@/components/tradingview/financials-widget";
import { TradingViewCompanyProfile } from "@/components/tradingview/company-profile";
import { TradingViewNewsTimeline } from "@/components/tradingview/news-timeline";
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

      {/* Main Technical Chart & TradingView Technical Analysis Gauge */}
      <section className="section-grid" style={{ gridTemplateColumns: "2fr 1fr" }}>
        <TradingViewChart symbol={asset.symbol} assetName={asset.name} height={520} />
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
        <TradingViewFinancials symbol={asset.symbol} height={450} />
      </section>

      {/* Bottom Section: TradingView Company Profile & Real-Time Company News */}
      <section className="section-grid">
        <TradingViewCompanyProfile symbol={asset.symbol} height={420} />
        <TradingViewNewsTimeline symbol={asset.symbol} height={420} />
      </section>
    </main>
  );
}
