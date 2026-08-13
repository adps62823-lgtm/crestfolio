export default function Loading() {
  return (
    <div className="fade-up stack" style={{ minHeight: "60vh", justifyContent: "center", alignItems: "center" }}>
      <div className="panel" style={{ textAlign: "center", padding: "40px 60px", maxWidth: 420 }}>
        <div
          style={{
            width: 42,
            height: 42,
            border: "3px solid var(--border)",
            borderTopColor: "var(--accent)",
            borderRadius: "50%",
            animation: "spin 0.7s linear infinite",
            margin: "0 auto 16px auto",
          }}
        />
        <h4 style={{ margin: 0, fontSize: "1.1rem" }}>Fetching Quantitative Feed...</h4>
        <p className="muted" style={{ fontSize: "0.85rem", marginTop: 6 }}>
          Syncing order book, real-time NAVs, and risk models.
        </p>
      </div>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
