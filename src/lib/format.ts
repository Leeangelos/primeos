export function safeNum(val: unknown): number | null {
  if (val == null) return null;
  const n = typeof val === "number" ? val : Number(val);
  if (!Number.isFinite(n) || Number.isNaN(n)) return null;
  return n;
}

export function safePct(val: unknown): string {
  const n = safeNum(val);
  if (n === null) return "—";
  return n.toFixed(1) + "%";
}

export function safeDollars(val: unknown): string {
  const n = safeNum(val);
  if (n === null) return "—";
  return (
    "$" +
    n.toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
  );
}

