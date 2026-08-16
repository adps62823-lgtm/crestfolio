// Utility 5 — Tax-Harvesting & Rebalancing Optimizer (Indian tax rules)
// LTCG on equity-oriented instruments (12+ months holding): exempt up to
// Rs 1.25L in a financial year (Budget 2024 threshold), 12.5% above that.
// STCG on equity-oriented (<12 months): flat 20% (post Budget 2024).
// Debt-oriented funds bought after 1 Apr 2023 are taxed at slab rate
// regardless of holding period (no indexation) per the Finance Act 2023.
import type { TaxLot, TaxHarvestSuggestion } from "@/lib/types";

const LTCG_EXEMPTION_LIMIT = 125000; // Rs 1.25L per FY, per Budget 2024
const HOLDING_PERIOD_LTCG_DAYS = 365;

function daysHeld(buyDate: string): number {
  return Math.floor((Date.now() - new Date(buyDate).getTime()) / (24 * 3600 * 1000));
}

export function analyzeTaxHarvest(lots: TaxLot[], realizedLtcgAlreadyThisFy = 0): TaxHarvestSuggestion[] {
  const suggestions: TaxHarvestSuggestion[] = [];
  let ltcgUsed = realizedLtcgAlreadyThisFy;

  // Process gain-harvesting candidates first (oldest holdings / biggest
  // unrealized LTCG first, to maximize use of the exemption bracket).
  const withGain = lots
    .map((l) => ({ lot: l, gain: (l.currentPrice - l.buyPrice) * l.units, held: daysHeld(l.buyDate) }))
    .filter((x) => x.lot.isEquityOriented && x.held >= HOLDING_PERIOD_LTCG_DAYS && x.gain > 0)
    .sort((a, b) => b.gain - a.gain);

  for (const { lot, gain } of withGain) {
    const remainingExemption = LTCG_EXEMPTION_LIMIT - ltcgUsed;
    if (remainingExemption <= 0) {
      suggestions.push({ lot, gainType: "LTCG", unrealizedGainLoss: Math.round(gain), action: "hold", rationale: `LTCG exemption of Rs ${LTCG_EXEMPTION_LIMIT.toLocaleString("en-IN")} already fully used this FY — realizing now would be taxed at 12.5%.` });
      continue;
    }
    if (gain <= remainingExemption) {
      ltcgUsed += gain;
      suggestions.push({ lot, gainType: "LTCG", unrealizedGainLoss: Math.round(gain), action: "harvest_gain", rationale: `Harvest this gain of Rs ${Math.round(gain).toLocaleString("en-IN")} tax-free within the remaining Rs ${Math.round(remainingExemption).toLocaleString("en-IN")} LTCG exemption before Mar 31. Rebuy immediately to reset cost basis higher (no wash-sale rule under Indian tax law for equities).` });
    } else {
      ltcgUsed = LTCG_EXEMPTION_LIMIT;
      suggestions.push({ lot, gainType: "LTCG", unrealizedGainLoss: Math.round(gain), action: "harvest_gain", rationale: `Partially harvest up to Rs ${Math.round(remainingExemption).toLocaleString("en-IN")} of this gain to use the last of the exemption; the remainder stays unrealized.` });
    }
  }

  // Loss-harvesting: STCG/LTCG losses can offset STCG or LTCG gains
  // elsewhere in the portfolio (set-off rules: LTCG loss can only offset
  // LTCG gain; STCG loss can offset both STCG and LTCG gain).
  const withLoss = lots
    .map((l) => ({ lot: l, gain: (l.currentPrice - l.buyPrice) * l.units, held: daysHeld(l.buyDate) }))
    .filter((x) => x.gain < 0);

  for (const { lot, gain, held } of withLoss) {
    const gainType = lot.isEquityOriented && held >= HOLDING_PERIOD_LTCG_DAYS ? "LTCG" : "STCG";
    suggestions.push({
      lot, gainType, unrealizedGainLoss: Math.round(gain), action: "harvest_loss",
      rationale: `Unrealized loss of Rs ${Math.abs(Math.round(gain)).toLocaleString("en-IN")}. As a ${gainType} loss it can be booked to offset ${gainType === "LTCG" ? "other LTCG gains only" : "both STCG and LTCG gains"} this FY, or carried forward up to 8 assessment years.`,
    });
  }

  return suggestions;
}
