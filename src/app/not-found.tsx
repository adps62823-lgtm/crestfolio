import Link from "next/link";
import { ArrowLeft, AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <main className="fade-up" style={{ padding: 40, textAlign: "center" }}>
      <div className="panel" style={{ maxWidth: 540, margin: "60px auto" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
          <AlertCircle size={48} style={{ color: "var(--accent-2)" }} />
        </div>
        <h2>Asset or Page Not Found</h2>
        <p className="muted" style={{ marginTop: 8, marginBottom: 24 }}>
          The requested research route or asset entity does not exist in the current desk universe.
        </p>
        <Link href="/" className="button button-primary">
          <ArrowLeft size={16} />
          <span>Return to Desk Home</span>
        </Link>
      </div>
    </main>
  );
}
