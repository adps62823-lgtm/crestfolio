// Utility 7 — "What-If" Macro Scenario Simulator
// Sector sensitivity mapping is a curated, transparent rules table (not a
// black-box model) so every output cites the mechanical reason — this is
// standard sell-side "sensitivity ready-reckoner" logic, not a prediction.
import type { ScenarioInput, ScenarioImpact } from "@/lib/types";

const CRUDE_UP_SENSITIVITIES: ScenarioImpact[] = [
  { sector: "Paints", direction: "negative", magnitude: "high", rationale: "Crude derivatives (TiO2, resins) are a major raw-material cost input; margins compress directly with crude.", affectedNames: ["Asian Paints", "Berger Paints", "Kansai Nerolac"] },
  { sector: "Aviation", direction: "negative", magnitude: "high", rationale: "Aviation Turbine Fuel tracks crude closely and is typically 35-45% of airline operating cost.", affectedNames: ["IndiGo", "SpiceJet"] },
  { sector: "Tyres", direction: "negative", magnitude: "medium", rationale: "Rubber and crude-linked synthetic inputs raise tyre manufacturing costs.", affectedNames: ["MRF", "Apollo Tyres", "CEAT"] },
  { sector: "Upstream Oil & Gas", direction: "positive", magnitude: "high", rationale: "Upstream producers realize higher revenue per barrel as crude rises.", affectedNames: ["ONGC", "Oil India"] },
  { sector: "Paint & FMCG (packaging)", direction: "negative", magnitude: "low", rationale: "Plastic packaging costs rise modestly with crude-linked polymer prices.", affectedNames: ["HUL", "Britannia"] },
];

const REPO_CUT_SENSITIVITIES: ScenarioImpact[] = [
  { sector: "Realty", direction: "positive", magnitude: "high", rationale: "Lower home-loan rates directly improve housing affordability and demand.", affectedNames: ["DLF", "Godrej Properties", "Oberoi Realty"] },
  { sector: "Auto (financing-heavy segments)", direction: "positive", magnitude: "medium", rationale: "Cheaper vehicle financing supports two-wheeler and passenger-vehicle demand.", affectedNames: ["Maruti Suzuki", "M&M", "Bajaj Auto"] },
  { sector: "Home Finance / NBFC", direction: "positive", magnitude: "high", rationale: "Lower cost of funds and improved loan demand expand NIMs and volume growth.", affectedNames: ["HDFC Bank", "LIC Housing Finance", "Bajaj Finance"] },
  { sector: "Banks (NIM-sensitive)", direction: "negative", magnitude: "low", rationale: "Near-term net interest margins can compress if deposit repricing lags loan repricing.", affectedNames: ["Public sector banks with high fixed-rate loan books"] },
];

export function runScenario(input: ScenarioInput): ScenarioImpact[] {
  const magnitudeScale = (base: ScenarioImpact["magnitude"], delta: number): ScenarioImpact["magnitude"] => {
    const scaled = Math.abs(delta);
    if (base === "high") return scaled > 20 ? "high" : scaled > 8 ? "medium" : "low";
    if (base === "medium") return scaled > 25 ? "medium" : "low";
    return "low";
  };

  let table: ScenarioImpact[] = [];
  if (input.variable === "crude_oil_pct") table = CRUDE_UP_SENSITIVITIES;
  else if (input.variable === "repo_rate_bps") table = REPO_CUT_SENSITIVITIES;
  else return [{ sector: "General", direction: "negative", magnitude: "low", rationale: `Sensitivity table for "${input.variable}" is not yet curated — extend REPO_CUT_SENSITIVITIES-style mapping in scenario.ts.`, affectedNames: [] }];

  // If delta is negative for crude (i.e. crude falling), flip direction.
  const flip = (input.variable === "crude_oil_pct" && input.delta < 0) || (input.variable === "repo_rate_bps" && input.delta > 0);
  return table.map((t) => ({
    ...t,
    direction: flip ? (t.direction === "positive" ? "negative" : "positive") : t.direction,
    magnitude: magnitudeScale(t.magnitude, input.delta),
  }));
}
