/**
 * Store-specific KPI targets and status logic for the Daily scoreboard.
 * Binary status only: On Track, Over, Under. No "near limit".
 */

export type StoreId = "leeangelo" | "lindsey";

/** Binary status for display. null = no value / do not show status. */
export type StatusLabel = "on_track" | "over" | "under";

export interface StoreTargets {
  name: string;
  /** Combined Food + Disposables max % (on track when at or under) */
  foodDisposablesMax: number;
  /** Labor: for LeeAngelo 19–21% range; for Lindsey max 25% */
  laborMin?: number;
  laborMax: number;
  /** PRIME max % */
  primeMax: number;
  /** SLPH minimum */
  slphMin: number;
}

export const STORE_TARGETS: Record<StoreId, StoreTargets> = {
  leeangelo: {
    name: "LeeAngelo's",
    foodDisposablesMax: 35,
    laborMin: 19,
    laborMax: 21,
    primeMax: 55,
    slphMin: 80,
  },
  lindsey: {
    name: "Lindsey's",
    foodDisposablesMax: 35,
    laborMax: 25,
    primeMax: 60,
    slphMin: 80,
  },
};

/** Cost metrics (lower is better): ON TRACK if <= max else OVER */
export function getPrimeStatus(storeId: StoreId, primePct: number | null): StatusLabel | null {
  if (primePct == null) return null;
  const max = STORE_TARGETS[storeId].primeMax;
  return primePct <= max ? "on_track" : "over";
}

/** Range: ON TRACK if in [min,max], UNDER if < min, OVER if > max */
export function getLaborStatus(storeId: StoreId, laborPct: number | null): StatusLabel | null {
  if (laborPct == null) return null;
  const t = STORE_TARGETS[storeId];
  if (t.laborMin != null) {
    if (laborPct >= t.laborMin && laborPct <= t.laborMax) return "on_track";
    return laborPct < t.laborMin ? "under" : "over";
  }
  return laborPct <= t.laborMax ? "on_track" : "over";
}

/** Performance (higher is better): ON TRACK if >= min else UNDER */
export function getSlphStatus(storeId: StoreId, slph: number | null): StatusLabel | null {
  if (slph == null) return null;
  const min = STORE_TARGETS[storeId].slphMin;
  return slph >= min ? "on_track" : "under";
}

/** Cost (lower is better): ON TRACK if <= max else OVER */
export function getFoodStatus(storeId: StoreId, foodPct: number | null): StatusLabel | null {
  if (foodPct == null) return null;
  const max = STORE_TARGETS[storeId].foodDisposablesMax;
  return foodPct <= max ? "on_track" : "over";
}
