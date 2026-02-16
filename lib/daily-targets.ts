/**
 * Store-specific KPI targets and status logic for the Daily scoreboard.
 * No backend — operational clarity only.
 */

export type StoreId = "leeangelo" | "lindsey";

export type KpiStatus = "green" | "yellow" | "red";

export interface StoreTargets {
  name: string;
  /** Combined Food + Disposables max % (green when at or under) */
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
    foodDisposablesMax: 35, // 30% food + 5% disposables
    laborMin: 19,
    laborMax: 21,
    primeMax: 55,
    slphMin: 80,
  },
  lindsey: {
    name: "Lindsey's",
    foodDisposablesMax: 35, // ≤30% + ≤5%
    laborMax: 25,
    primeMax: 60,
    slphMin: 80,
  },
};

/** Yellow band: within this many points of threshold = caution */
const YELLOW_BAND = 2;

export function getPrimeStatus(storeId: StoreId, primePct: number | null): KpiStatus {
  if (primePct == null) return "yellow";
  const max = STORE_TARGETS[storeId].primeMax;
  if (primePct <= max) return "green";
  if (primePct <= max + YELLOW_BAND) return "yellow";
  return "red";
}

export function getLaborStatus(storeId: StoreId, laborPct: number | null): KpiStatus {
  if (laborPct == null) return "yellow";
  const t = STORE_TARGETS[storeId];
  const hasRange = t.laborMin != null;
  if (hasRange) {
    // LeeAngelo's: 19–21% green; below 19 = caution (yellow); above 21 = red
    if (laborPct >= t.laborMin! && laborPct <= t.laborMax) return "green";
    if (laborPct < t.laborMin!) return "yellow"; // below range = caution
    if (laborPct <= t.laborMax + YELLOW_BAND) return "yellow";
    return "red";
  }
  // Lindsey's: ≤25% green
  if (laborPct <= t.laborMax) return "green";
  if (laborPct <= t.laborMax + YELLOW_BAND) return "yellow";
  return "red";
}

export function getSlphStatus(storeId: StoreId, slph: number | null): KpiStatus {
  if (slph == null) return "yellow";
  const min = STORE_TARGETS[storeId].slphMin;
  if (slph >= min) return "green";
  if (slph >= min - YELLOW_BAND) return "yellow";
  return "red";
}

export function getFoodStatus(storeId: StoreId, foodPct: number | null): KpiStatus {
  if (foodPct == null) return "yellow";
  const max = STORE_TARGETS[storeId].foodDisposablesMax;
  if (foodPct <= max) return "green";
  if (foodPct <= max + YELLOW_BAND) return "yellow";
  return "red";
}
