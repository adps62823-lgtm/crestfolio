"use client";

import { useState } from "react";
import { RefreshCw } from "lucide-react";

export function LiveSyncButton() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function sync() {
    setBusy(true);
    setMessage("Syncing free public sources...");
    try {
      const response = await fetch("/api/live/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const payload = (await response.json()) as {
        results: Array<{ sourceKey: string; status: string; message: string }>;
      };
      setMessage(
        payload.results
          .map((item) => `${item.sourceKey.toUpperCase()}: ${item.status} - ${item.message}`)
          .join(" | "),
      );
    } catch {
      setMessage("Live sync failed. Check network access and source availability.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="panel">
      <h3>Live Sync</h3>
      <p className="muted">
        Pull AMFI, NSE, MCX, RBI, and MoSPI public data into the local research store.
      </p>
      <div style={{ marginTop: 14 }}>
        <button className="button button-primary" onClick={sync} disabled={busy}>
          <RefreshCw size={16} className={busy ? "spin" : ""} />
          <span>{busy ? "Syncing..." : "Run free live sync"}</span>
        </button>
      </div>
      <p className="footer-note" style={{ marginTop: 12 }}>
        {message || "This uses only public official pages and files. No paid feeds required."}
      </p>
    </div>
  );
}
