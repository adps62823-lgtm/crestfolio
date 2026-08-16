import Link from "next/link";
import { ArrowRight, BellRing, Sparkles } from "lucide-react";
import { getDashboardSummary } from "@/server/repository";
import { AiAssistant } from "@/components/ai-assistant";
import { WatchlistManager } from "@/components/watchlist-manager";
import { TradingViewMarketOverview } from "@/components/tradingview/market-overview";
import { TradingViewEconomicCalendar } from "@/components/tradingview/economic-calendar";
import { TradingViewNewsTimeline } from "@/components/tradingview/news-timeline";

export default async function DashboardPage() {
  const dashboard = await getDashboardSummary();

  const watchlistItems = dashboard.watchlist.map((w) => ({
    slug: w.slug,
    name: w.name,
    symbol: w.symbol,
    assetClass: w.assetClass,
    sector: w.sector,
    convictionScore: w.convictionScore,
  }));

  return (
    <main className="fade-up stack">
      {/* Hero Header */}
      <section className="hero">
        <div className="hero-card" style={{ width: "100%" }}>
          <div className="hero-kicker">
            <Sparkles size={14} />
            <span>Single-user institutional research desk</span>
          </div>
          <h1>{dashboard.marketPulse.headline}</h1>
          <p className="hero-copy">{dashboard.marketPulse.note}</p>
          <div style={{ marginTop: 18 }} className="pill-row">
            <Link className="button button-primary" href="/screener">
              Open TradingView Screener
              <ArrowRight size={16} />
            </Link>
            <Link className="button" href="/matrix">
              <BellRing size={16} />
              <span>Multi-Chart Matrix</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Main Grid: TradingView Real-Time Market Overview + Watchlist Manager */}
      <section className="section-grid" style={{ gridTemplateColumns: "2fr 1fr" }}>
        <TradingViewMarketOverview />

        <div className="stack">
          <WatchlistManager initialItems={watchlistItems} />
          <AiAssistant
            contextLabel="Consult CrestBot (Google Gemini AI) for market regime briefs or thesis risk audits."
          />
        </div>
      </section>

      {/* Bottom 2-Column Section: TradingView Economic Calendar (Column 1) & TradingView Top Stories (Column 2) */}
      <section className="section-grid">
        <TradingViewEconomicCalendar />
        <TradingViewNewsTimeline />
      </section>
    </main>
  );
}
