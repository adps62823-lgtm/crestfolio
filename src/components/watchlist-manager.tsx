"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Trash2, Edit3, BookmarkCheck } from "lucide-react";

type WatchlistItem = {
  slug: string;
  name: string;
  symbol: string;
  assetClass: string;
  sector: string;
  convictionScore: number;
};

type Props = {
  initialItems: WatchlistItem[];
};

export function WatchlistManager({ initialItems }: Props) {
  const [items, setItems] = useState<WatchlistItem[]>(initialItems);
  const [newSymbol, setNewSymbol] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = () => {
    if (!newSymbol.trim()) return;
    const sym = newSymbol.trim().toUpperCase();
    const slug = sym.toLowerCase().replace(/[^a-z0-9]/g, "-");
    const newItem: WatchlistItem = {
      slug,
      name: sym,
      symbol: sym,
      assetClass: "equity",
      sector: "Indian Equity",
      convictionScore: 85,
    };
    setItems((prev) => [newItem, ...prev]);
    setNewSymbol("");
    setIsAdding(false);
  };

  const handleDelete = (slugToDelete: string) => {
    setItems((prev) => prev.filter((item) => item.slug !== slugToDelete));
  };

  return (
    <div className="panel">
      <div className="toolbar" style={{ marginBottom: 12 }}>
        <div>
          <h3 style={{ display: "flex", alignItems: "center", gap: 8, margin: 0 }}>
            <BookmarkCheck size={18} style={{ color: "var(--accent)" }} />
            Active Institutional Watchlist
          </h3>
          <p className="muted" style={{ margin: 0, fontSize: "0.82rem" }}>
            Track priority instruments, equities, and mutual funds.
          </p>
        </div>

        <button
          className="button button-primary"
          style={{ padding: "4px 10px", fontSize: "0.78rem" }}
          onClick={() => setIsAdding(!isAdding)}
        >
          <Plus size={14} /> Add Symbol
        </button>
      </div>

      {isAdding && (
        <div style={{ display: "flex", gap: 8, marginBottom: 14, background: "rgba(15,23,42,0.8)", padding: 10, borderRadius: 8 }}>
          <input
            type="text"
            className="input"
            placeholder="Enter NSE Symbol (e.g. TATAMOTORS, SBIN)..."
            value={newSymbol}
            onChange={(e) => setNewSymbol(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            style={{ fontSize: "0.85rem", flex: 1 }}
          />
          <button className="button button-primary" onClick={handleAdd} style={{ padding: "0 14px" }}>
            Save
          </button>
        </div>
      )}

      <div className="stack" style={{ gap: 8 }}>
        {items.map((asset) => (
          <div
            key={asset.slug}
            className="asset-card"
            style={{
              padding: "10px 14px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Link href={`/asset/${asset.slug}`} style={{ textDecoration: "none", color: "inherit", flex: 1 }}>
              <h4 style={{ margin: 0, fontSize: "0.95rem" }}>
                {asset.name}{" "}
                <span className="muted" style={{ fontSize: "0.8rem", fontWeight: 400 }}>
                  ({asset.symbol})
                </span>
              </h4>
              <div className="pill-row" style={{ marginTop: 6 }}>
                <span className="pill pill-active" style={{ fontSize: "0.72rem" }}>
                  Priority {asset.convictionScore}
                </span>
                <span className="pill" style={{ fontSize: "0.72rem" }}>
                  {asset.sector}
                </span>
              </div>
            </Link>

            <button
              className="button button-subtle"
              style={{ padding: 6, color: "var(--muted)" }}
              onClick={() => handleDelete(asset.slug)}
              title="Remove from Watchlist"
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
