/**
 * Kitchen Score: letter grade from current MTD food cost % vs baseline expected %.
 * diff = currentPct - baselinePct (percentage points above baseline).
 */

export type KitchenGrade = "A" | "B" | "C" | "D" | "F";

/** A: at or below expected; B: within 1.5% above; C: 1.5–4%; D: 4–7%; F: 7%+ above */
export function getKitchenGrade(diff: number | null): KitchenGrade | null {
  if (diff == null || Number.isNaN(diff)) return null;
  if (diff <= 0) return "A";
  if (diff <= 1.5) return "B";
  if (diff <= 4) return "C";
  if (diff <= 7) return "D";
  return "F";
}

/** Grade colors: A green, B teal, C yellow/amber, D orange, F red */
export function getKitchenGradeColorClass(grade: KitchenGrade | null): string {
  if (!grade) return "text-slate-400";
  switch (grade) {
    case "A":
      return "text-emerald-400";
    case "B":
      return "text-teal-400";
    case "C":
      return "text-amber-400";
    case "D":
      return "text-orange-400";
    case "F":
      return "text-red-400";
    default:
      return "text-slate-400";
  }
}

export function getKitchenGradeBgClass(grade: KitchenGrade | null): string {
  if (!grade) return "bg-slate-500/20 border-slate-500/40";
  switch (grade) {
    case "A":
      return "bg-emerald-500/20 border-emerald-500/40";
    case "B":
      return "bg-teal-500/20 border-teal-500/40";
    case "C":
      return "bg-amber-500/20 border-amber-500/40";
    case "D":
      return "bg-orange-500/20 border-orange-500/40";
    case "F":
      return "bg-red-500/20 border-red-500/40";
    default:
      return "bg-slate-500/20 border-slate-500/40";
  }
}

/** In Range = B or above (A or B) for streak */
export function isKitchenGradeInRange(grade: KitchenGrade | null): boolean {
  return grade === "A" || grade === "B";
}

/** Next grade up: F->D, D->C, C->B, B->A. Returns { nextGrade, reducePct } to reach it. */
export function getNextKitchenGradeTarget(
  currentGrade: KitchenGrade | null,
  diff: number | null
): { nextGrade: KitchenGrade; reducePct: number } | null {
  if (currentGrade == null || diff == null || diff <= 0) return null;
  if (currentGrade === "A") return null;
  if (currentGrade === "B") return { nextGrade: "A", reducePct: diff };
  if (currentGrade === "C") return { nextGrade: "B", reducePct: diff - 1.5 };
  if (currentGrade === "D") return { nextGrade: "C", reducePct: diff - 4 };
  return { nextGrade: "D", reducePct: diff - 7 }; // F -> D
}
