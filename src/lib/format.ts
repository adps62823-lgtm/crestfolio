export function formatCurrency(value?: number | null, currency = "INR") {
  if (value === undefined || value === null || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: value >= 100 ? 0 : 2,
  }).format(value);
}

export function formatNumber(value?: number | null, digits = 0) {
  if (value === undefined || value === null || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: digits,
  }).format(value);
}

export function formatPercent(value?: number | null, digits = 2) {
  if (value === undefined || value === null || Number.isNaN(value)) return "—";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(digits)}%`;
}

export function formatRelativeDate(dateIso: string) {
  const date = new Date(dateIso);
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export function formatCompactDate(dateIso: string) {
  return new Date(dateIso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}
