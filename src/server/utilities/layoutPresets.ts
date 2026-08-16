// Utility 9 — Workspace Layout Preset Switcher (Ctrl+1 / Ctrl+2 / Ctrl+3)
import { getDb } from "../db";
import type { LayoutPreset } from "@/lib/types";

export const DEFAULT_LAYOUTS: LayoutPreset[] = [
  { id: "layout-macro-desk", name: "Macro Desk", hotkey: "ctrl+1", panels: [
    { component: "MultiChartMatrix:NIFTY50", position: "top-left" },
    { component: "MultiChartMatrix:USDINR", position: "top-right" },
    { component: "MultiChartMatrix:GOLD", position: "bottom-left" },
    { component: "RbiRateCurve", position: "bottom-right" },
  ]},
  { id: "layout-equity-deep-dive", name: "Equity Deep-Dive", hotkey: "ctrl+2", panels: [
    { component: "TradingViewChart", position: "left" },
    { component: "FundamentalsPanel", position: "top-right" },
    { component: "NewsTimeline", position: "mid-right" },
    { component: "AiPersonaCopilot", position: "bottom-right" },
  ]},
  { id: "layout-mf-review", name: "MF Review", hotkey: "ctrl+3", panels: [
    { component: "SchemeOverlapView", position: "left" },
    { component: "ExpenseRatioTable", position: "top-right" },
    { component: "RollingReturnRanks", position: "bottom-right" },
  ]},
];

export function seedDefaultLayouts() {
  const db = getDb();
  const insert = db.prepare(`INSERT OR IGNORE INTO layout_presets (id, name, hotkey, panels) VALUES (@id, @name, @hotkey, @panels)`);
  const txn = db.transaction(() => { for (const l of DEFAULT_LAYOUTS) insert.run({ ...l, panels: JSON.stringify(l.panels) }); });
  txn();
}

export function getLayouts(): LayoutPreset[] {
  const db = getDb();
  const rows = db.prepare(`SELECT * FROM layout_presets`).all() as (Omit<LayoutPreset, "panels"> & { panels: string })[];
  return rows.map((r) => ({ ...r, panels: JSON.parse(r.panels) }));
}
