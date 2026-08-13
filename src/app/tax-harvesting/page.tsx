"use client";

import { Percent, ArrowRight, CheckCircle2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default function TaxHarvestingPage() {
  return (
    <main className="fade-up stack">
      <div className="panel">
        <div className="toolbar">
          <div>
            <h3>Tax-Harvesting & Portfolio Rebalancing Optimizer</h3>
            <p className="muted">
              Optimize Long-Term Capital Gains (LTCG ₹1.25 Lakh exemption limit) and set off Short-Term Losses.
            </p>
          </div>
        </div>

        <div className="stat-grid" style={{ marginTop: 12 }}>
          <div className="stat">
            <span>Realized LTCG FY 2025-26</span>
            <strong>₹42,000</strong>
          </div>
          <div className="stat">
            <span>Remaining Tax-Free Exemption</span>
            <strong style={{ color: "var(--primary)" }}>₹83,000</strong>
          </div>
          <div className="stat">
            <span>Harvestable Unrealized LTCG</span>
            <strong>₹95,000</strong>
          </div>
          <div className="stat">
            <span>Estimated Tax Savings</span>
            <strong style={{ color: "var(--primary)" }}>₹10,375</strong>
          </div>
        </div>
      </div>

      <div className="panel">
        <h3>Recommended Tax-Harvesting Trade Sheet</h3>
        <p className="muted">Execute these redeem & reinvest trades to lock in tax-free gains before March 31.</p>

        <div className="table-wrap" style={{ marginTop: 12 }}>
          <table className="table">
            <thead>
              <tr>
                <th>Scheme / Asset</th>
                <th>Unrealized Gain</th>
                <th>Suggested Harvest Amount</th>
                <th>Tax Saved</th>
                <th>Action Recommendation</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <strong>Parag Parikh Flexi Cap Fund</strong>
                  <div className="muted">PPFC</div>
                </td>
                <td>₹52,000 (LTCG)</td>
                <td>Redeem ₹52,000</td>
                <td>₹6,500</td>
                <td>
                  <span className="pill pill-active">Sell & Reinvest Same Scheme</span>
                </td>
              </tr>
              <tr>
                <td>
                  <strong>HDFC Top 100 Fund</strong>
                  <div className="muted">HDFC100</div>
                </td>
                <td>₹31,000 (LTCG)</td>
                <td>Redeem ₹31,000</td>
                <td>₹3,875</td>
                <td>
                  <span className="pill pill-active">Sell & Reinvest Same Scheme</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
