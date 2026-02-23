/**
 * Shared formatters for user-facing numbers.
 * Percentages: exactly 1 decimal place (e.g. 30.2%).
 */

export function formatPct(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return value.toFixed(1) + "%";
}

export function formatDollars(value: number): string {
  return "$" + value.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}
