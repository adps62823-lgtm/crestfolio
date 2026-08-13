"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <main className="fade-up" style={{ padding: 40, textAlign: "center" }}>
      <div className="panel" style={{ maxWidth: 540, margin: "60px auto" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
          <AlertTriangle size={48} style={{ color: "var(--danger)" }} />
        </div>
        <h2>Research Desk Exception</h2>
        <p className="muted" style={{ marginTop: 8, marginBottom: 24 }}>
          {error.message || "An unexpected error occurred while rendering the research module."}
        </p>
        <button className="button button-primary" onClick={() => reset()}>
          <RefreshCw size={16} />
          <span>Retry Operation</span>
        </button>
      </div>
    </main>
  );
}
