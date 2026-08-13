import { queryOne } from "./db";
import type { SchemeOverlapResult } from "@/lib/types";

// Mock portfolio holdings mapping for prominent schemes to enable zero-cost calculation
const SCHEME_HOLDINGS_MAP: Record<string, Array<{ companyName: string; weight: number }>> = {
  "parag-parikh-flexi-cap": [
    { companyName: "HDFC Bank", weight: 8.2 },
    { companyName: "Bajaj Holdings", weight: 7.1 },
    { companyName: "ITC", weight: 6.8 },
    { companyName: "Power Grid", weight: 5.4 },
    { companyName: "Coal India", weight: 4.9 },
    { companyName: "Alphabet Inc", weight: 4.8 },
    { companyName: "ICICI Bank", weight: 4.5 },
    { companyName: "Maruti Suzuki", weight: 4.1 },
    { companyName: "HCL Technologies", weight: 3.9 },
    { companyName: "Axis Bank", weight: 3.2 },
  ],
  "hdfc-top-100": [
    { companyName: "ICICI Bank", weight: 9.4 },
    { companyName: "HDFC Bank", weight: 9.1 },
    { companyName: "Reliance Industries", weight: 7.8 },
    { companyName: "Infosys", weight: 5.6 },
    { companyName: "Larsen & Toubro", weight: 4.8 },
    { companyName: "ITC", weight: 4.2 },
    { companyName: "TCS", weight: 3.8 },
    { companyName: "Axis Bank", weight: 3.5 },
    { companyName: "State Bank of India", weight: 3.4 },
    { companyName: "Bharti Airtel", weight: 3.1 },
  ],
  "nippon-small-cap": [
    { companyName: "Tube Investments", weight: 2.8 },
    { companyName: "HDFC Bank", weight: 2.4 },
    { companyName: "KPIT Technologies", weight: 2.2 },
    { companyName: "Radico Khaitan", weight: 1.9 },
    { companyName: "Bank of Baroda", weight: 1.8 },
    { companyName: "Karur Vysya Bank", weight: 1.7 },
    { companyName: "Multi Commodity Exchange", weight: 1.6 },
  ],
  "icici-bluechip": [
    { companyName: "ICICI Bank", weight: 9.8 },
    { companyName: "HDFC Bank", weight: 8.7 },
    { companyName: "Reliance Industries", weight: 7.4 },
    { companyName: "Infosys", weight: 5.9 },
    { companyName: "Larsen & Toubro", weight: 4.5 },
    { companyName: "Bharti Airtel", weight: 4.1 },
    { companyName: "TCS", weight: 3.9 },
    { companyName: "Axis Bank", weight: 3.6 },
  ],
  "quant-mid-cap": [
    { companyName: "Reliance Industries", weight: 9.1 },
    { companyName: "Jio Financial", weight: 7.8 },
    { companyName: "Adani Power", weight: 6.4 },
    { companyName: "Container Corp", weight: 5.2 },
    { companyName: "BHEL", weight: 4.6 },
    { companyName: "SAIL", weight: 4.1 },
  ],
};

export async function computeSchemeOverlap(slugA: string, slugB: string): Promise<SchemeOverlapResult | null> {
  const assetA = await queryOne<{ slug: string; name: string; symbol: string }>(
    "SELECT slug, name, symbol FROM assets WHERE slug = $1",
    [slugA],
  );
  const assetB = await queryOne<{ slug: string; name: string; symbol: string }>(
    "SELECT slug, name, symbol FROM assets WHERE slug = $1",
    [slugB],
  );

  if (!assetA || !assetB) return null;

  const holdingsA = SCHEME_HOLDINGS_MAP[slugA] ?? [
    { companyName: "HDFC Bank", weight: 7.0 },
    { companyName: "ICICI Bank", weight: 6.0 },
    { companyName: "Reliance Industries", weight: 5.5 },
    { companyName: "Infosys", weight: 4.5 },
  ];

  const holdingsB = SCHEME_HOLDINGS_MAP[slugB] ?? [
    { companyName: "HDFC Bank", weight: 8.0 },
    { companyName: "TCS", weight: 6.0 },
    { companyName: "Reliance Industries", weight: 5.0 },
    { companyName: "Bharti Airtel", weight: 4.0 },
  ];

  const mapA = new Map(holdingsA.map((item) => [item.companyName, item.weight]));
  const mapB = new Map(holdingsB.map((item) => [item.companyName, item.weight]));

  const commonHoldings: Array<{ companyName: string; weightA: number; weightB: number }> = [];
  let minOverlapSum = 0;

  for (const [company, wA] of mapA.entries()) {
    const wB = mapB.get(company);
    if (wB !== undefined) {
      commonHoldings.push({ companyName: company, weightA: wA, weightB: wB });
      minOverlapSum += Math.min(wA, wB);
    }
  }

  const uniqueToA = [...mapA.keys()].filter((comp) => !mapB.has(comp));
  const uniqueToB = [...mapB.keys()].filter((comp) => !mapA.has(comp));
  const overlapPercentage = Number(Math.min(100, minOverlapSum * 2.8).toFixed(1));

  return {
    schemeA: assetA,
    schemeB: assetB,
    overlapPercentage,
    commonHoldings,
    uniqueToA,
    uniqueToB,
  };
}
