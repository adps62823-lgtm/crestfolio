import React from "react";

export function FormattedMarkdown({ content }: { content: string }) {
  if (!content) return null;

  // Split by line breaks to parse structural blocks
  const lines = content.split(/\r?\n/);
  const elements: React.ReactNode[] = [];

  let keyCounter = 0;

  function parseInline(text: string): React.ReactNode[] {
    // Replace **bold** with <strong> and *italic* with <em>
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={i} style={{ color: "var(--accent)", fontWeight: 600 }}>{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith("*") && part.endsWith("*")) {
        return <em key={i} style={{ fontStyle: "italic", opacity: 0.9 }}>{part.slice(1, -1)}</em>;
      }
      if (part.startsWith("`") && part.endsWith("`")) {
        return (
          <code
            key={i}
            style={{
              background: "var(--bg-subtle)",
              padding: "2px 6px",
              borderRadius: 4,
              fontFamily: "var(--font-mono)",
              fontSize: "0.82em",
              color: "#38bdf8",
            }}
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  }

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    // Headers ###
    if (trimmed.startsWith("### ")) {
      elements.push(
        <h4 key={keyCounter++} style={{ margin: "10px 0 4px 0", fontSize: "0.95rem", color: "var(--fg)" }}>
          {parseInline(trimmed.slice(4))}
        </h4>,
      );
      return;
    }

    if (trimmed.startsWith("## ")) {
      elements.push(
        <h3 key={keyCounter++} style={{ margin: "12px 0 6px 0", fontSize: "1.05rem", color: "var(--fg)" }}>
          {parseInline(trimmed.slice(3))}
        </h3>,
      );
      return;
    }

    // Bullet lists (- or *)
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      elements.push(
        <div key={keyCounter++} style={{ display: "flex", gap: 8, margin: "3px 0", alignItems: "flex-start" }}>
          <span style={{ color: "var(--primary)", fontWeight: "bold", fontSize: "0.9rem" }}>•</span>
          <div style={{ flex: 1 }}>{parseInline(trimmed.slice(2))}</div>
        </div>,
      );
      return;
    }

    // Numbered lists (1. 2. etc)
    const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
    if (numMatch) {
      elements.push(
        <div key={keyCounter++} style={{ display: "flex", gap: 8, margin: "4px 0", alignItems: "flex-start" }}>
          <span
            style={{
              background: "var(--bg-subtle)",
              color: "var(--accent)",
              borderRadius: 4,
              padding: "1px 6px",
              fontSize: "0.75rem",
              fontWeight: 600,
            }}
          >
            {numMatch[1]}
          </span>
          <div style={{ flex: 1 }}>{parseInline(numMatch[2])}</div>
        </div>,
      );
      return;
    }

    // Standard paragraph
    elements.push(
      <p key={keyCounter++} style={{ margin: "4px 0", lineHeight: 1.5 }}>
        {parseInline(trimmed)}
      </p>,
    );
  });

  return <div className="formatted-text" style={{ fontSize: "0.85rem" }}>{elements}</div>;
}
