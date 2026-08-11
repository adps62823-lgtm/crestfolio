import PDFDocument from "pdfkit";
import type { AssetDetail } from "@/lib/types";
import { formatCompactDate, formatCurrency, formatPercent } from "@/lib/format";

function rowsForAsset(detail: AssetDetail) {
  const asset = detail.asset;
  return [
    ["Asset", asset.name],
    ["Symbol", asset.symbol],
    ["Class", asset.assetClass],
    ["Sector", asset.sector],
    ["Benchmark", asset.benchmark],
    ["Last price", formatCurrency(asset.lastPrice, asset.currency)],
    ["1W return", formatPercent(asset.return1W)],
    ["1M return", formatPercent(asset.return1M)],
    ["3M return", formatPercent(asset.return3M)],
    ["6M return", formatPercent(asset.return6M)],
    ["1Y return", formatPercent(asset.return1Y)],
    ["Trend score", String(asset.trendScore)],
    ["Quality score", String(asset.qualityScore)],
    ["Valuation score", String(asset.valuationScore)],
    ["Sentiment score", String(asset.sentimentScore)],
    ["Conviction score", String(asset.convictionScore)],
    ["Risk score", String(asset.riskScore)],
  ];
}

export function buildAssetMarkdown(detail: AssetDetail, insight: string) {
  const { asset } = detail;
  const lines = [
    `# ${asset.name}`,
    "",
    `- Symbol: ${asset.symbol}`,
    `- Class: ${asset.assetClass}`,
    `- Sector: ${asset.sector}`,
    `- Benchmark: ${asset.benchmark}`,
    `- Last price: ${formatCurrency(asset.lastPrice, asset.currency)}`,
    `- Updated: ${formatCompactDate(asset.updatedAt)}`,
    "",
    "## Key Scores",
    "",
    `- Trend: ${asset.trendScore}`,
    `- Quality: ${asset.qualityScore}`,
    `- Valuation: ${asset.valuationScore}`,
    `- Sentiment: ${asset.sentimentScore}`,
    `- Conviction: ${asset.convictionScore}`,
    `- Risk: ${asset.riskScore}`,
    "",
    "## AI / Analyst Note",
    "",
    insight.trim(),
    "",
    "## Recent News",
    "",
    ...detail.news.slice(0, 5).map((news) => `- ${news.headline} (${formatCompactDate(news.publishedAt)})`),
    "",
    "## Recent Events",
    "",
    ...detail.events.slice(0, 5).map((event) => `- ${event.title} (${event.severity})`),
    "",
    "## Research Notes",
    "",
    ...detail.notes.slice(0, 5).map((note) => `- ${note.title} [${note.status}]`),
  ];

  return lines.join("\n");
}

export function buildAssetCsv(detail: AssetDetail) {
  const rows = rowsForAsset(detail);
  return ["field,value", ...rows.map(([field, value]) => `"${field}","${String(value).replaceAll('"', '""')}"`)].join(
    "\n",
  );
}

export async function buildAssetPdfBuffer(detail: AssetDetail, insight: string) {
  const doc = new PDFDocument({
    margin: 42,
    size: "A4",
    bufferPages: true,
  });

  const chunks: Buffer[] = [];
  doc.on("data", (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));

  const done = new Promise<Buffer>((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });

  const { asset } = detail;
  doc.fontSize(20).fillColor("#111827").text(asset.name);
  doc.moveDown(0.2);
  doc.fontSize(10).fillColor("#475569").text(`${asset.symbol} · ${asset.assetClass} · ${asset.sector}`);
  doc.moveDown(1);

  doc.fontSize(12).fillColor("#0f172a").text("Snapshot");
  doc.moveDown(0.4);
  rowsForAsset(detail).forEach(([field, value]) => {
    doc.fontSize(10).fillColor("#0f172a").text(`${field}: ${value}`);
  });

  doc.moveDown(1);
  doc.fontSize(12).fillColor("#0f172a").text("Analyst note");
  doc.moveDown(0.3);
  doc.fontSize(10).fillColor("#334155").text(insight.trim());

  doc.moveDown(1);
  doc.fontSize(12).fillColor("#0f172a").text("Recent news");
  detail.news.slice(0, 5).forEach((news) => {
    doc.fontSize(10).fillColor("#334155").text(`- ${news.headline}`);
  });

  doc.moveDown(0.8);
  doc.fontSize(12).fillColor("#0f172a").text("Recent events");
  detail.events.slice(0, 5).forEach((event) => {
    doc.fontSize(10).fillColor("#334155").text(`- ${event.title}`);
  });

  doc.end();
  return done;
}
