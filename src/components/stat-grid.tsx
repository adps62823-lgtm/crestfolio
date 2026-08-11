import type { DashboardSummary } from "@/lib/types";

export function StatGrid({ stats }: { stats: DashboardSummary["stats"] }) {
  return (
    <div className="stat-grid fade-up">
      {stats.map((stat) => (
        <div className="stat" key={stat.label}>
          <span>{stat.label}</span>
          <strong>{stat.value}</strong>
          <div className={`muted delta-${stat.tone}`}>{stat.delta}</div>
        </div>
      ))}
    </div>
  );
}
