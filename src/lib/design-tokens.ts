/**
 * Design tokens — single source of truth for visual constants.
 * Use these instead of hardcoded Tailwind colors/values.
 */

// ============ COLORS ============
export const COLORS = {
  grade: {
    green: "#22c55e", // target met
    yellow: "#eab308", // within 2pts of target
    red: "#ef4444", // missed target
    gray: "#6b7280", // no data
  },
  bg: {
    primary: "#0f172a", // page background — slate-900
    card: "#1e293b", // card background — slate-800
    cardHover: "#334155", // card hover — slate-700
  },
  border: {
    default: "#334155", // slate-700
  },
  text: {
    primary: "#f8fafc", // slate-50
    secondary: "#94a3b8", // slate-400
    muted: "#64748b", // slate-500
  },
  accent: {
    blue: "#3b82f6", // links, active states
    emerald: "#10b981", // positive trends
  },
} as const;

// ============ SPACING (Tailwind classes) ============
export const SPACING = {
  page: {
    px: "px-4", // 16px horizontal page padding on mobile
    py: "py-4", // 16px vertical page padding
  },
  card: {
    p: "p-4", // 16px card inner padding
    gap: "gap-3", // 12px between cards
  },
  section: {
    gap: "gap-6", // 24px between page sections
  },
} as const;

// ============ TYPOGRAPHY (Tailwind classes) ============
export const TYPOGRAPHY = {
  page: {
    title: "text-xl font-bold", // 20px page titles
  },
  card: {
    title:
      "text-sm font-semibold text-slate-400 uppercase tracking-wide", // card headers
  },
  metric: {
    value: "text-2xl font-bold", // main KPI numbers
    label: "text-xs text-slate-400", // below KPI numbers
    subtitle: "text-sm text-slate-400",
  },
} as const;

// ============ BORDERS (Tailwind classes) ============
export const BORDERS = {
  card: {
    radius: "rounded-xl",
    border: "border border-slate-700",
  },
} as const;

// ============ HELPERS ============

/** Direction: "lower_is_better" (e.g. PRIME %, labor %) or "higher_is_better" (e.g. SLPH, revenue). */
export type GradeDirection = "lower_is_better" | "higher_is_better";

/**
 * Returns the correct grade color (hex) for a value vs target.
 * - green: target met (within 0 for lower_is_better, >= target for higher_is_better; or within 2pts)
 * - yellow: within 2pts of target
 * - red: missed target
 * - gray: no data (value or target is null/undefined)
 */
export function getGradeColor(
  value: number | null | undefined,
  target: number | null | undefined,
  direction: GradeDirection = "lower_is_better"
): string {
  if (value == null || target == null) return COLORS.grade.gray;

  const diff = direction === "lower_is_better" ? value - target : target - value;
  const absDiff = Math.abs(diff);

  if (absDiff <= 0) return COLORS.grade.green;
  if (absDiff <= 2) return COLORS.grade.yellow;
  return COLORS.grade.red;
}

/**
 * Returns Tailwind-style background opacity class for grade badges.
 * e.g. "bg-emerald-500/10", "bg-amber-500/10", "bg-red-500/10", "bg-slate-500/10"
 */
export function getGradeBg(
  value: number | null | undefined,
  target: number | null | undefined,
  direction: GradeDirection = "lower_is_better"
): string {
  if (value == null || target == null) return "bg-slate-500/10";

  const diff = direction === "lower_is_better" ? value - target : target - value;
  const absDiff = Math.abs(diff);

  if (absDiff <= 0) return "bg-emerald-500/10";
  if (absDiff <= 2) return "bg-amber-500/10";
  return "bg-red-500/10";
}
