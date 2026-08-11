"use client";

import { Download } from "lucide-react";

type Props = {
  slug: string;
};

export function ExportButtons({ slug }: Props) {
  const formats = [
    { label: "Markdown", format: "md" },
    { label: "CSV", format: "csv" },
    { label: "PDF", format: "pdf" },
  ] as const;

  return (
    <div className="panel">
      <h3>Export Research</h3>
      <p className="muted">Export the current thesis packet for notes, reporting, or archiving.</p>
      <div className="pill-row" style={{ marginTop: 14 }}>
        {formats.map((item) => (
          <a
            key={item.format}
            className="button button-primary"
            href={`/api/export/${slug}?format=${item.format}`}
          >
            <Download size={16} />
            <span>{item.label}</span>
          </a>
        ))}
      </div>
    </div>
  );
}
