/**
 * Executive cockpit: store slugs and KPI targets (hardcoded).
 * Stores: kent, aurora, lindseys.
 * LeeAngelo's = kent + aurora. Lindsey's = lindseys.
 */

export const COCKPIT_STORE_SLUGS = ["kent", "aurora", "lindseys"] as const;
export type CockpitStoreSlug = (typeof COCKPIT_STORE_SLUGS)[number];

export interface CockpitTargets {
  /** Display name */
  name: string;
  /** PRIME % ≤ this = on track */
  primeMax: number;
  /** Labor %: range (min–max) for LeeAngelo's; max-only for Lindsey's */
  laborMin?: number;
  laborMax: number;
  /** Food + Disposables % combined ≤ this */
  foodDisposablesMax: number;
  /** SLPH ≥ this = on track */
  slphMin: number;
}

/** Target set by store slug. LeeAngelo's (kent, aurora) share one set; Lindsey's (lindseys) another. */
export const COCKPIT_TARGETS: Record<CockpitStoreSlug, CockpitTargets> = {
  kent: {
    name: "Kent (LeeAngelo's)",
    primeMax: 55,
    laborMin: 19,
    laborMax: 21,
    foodDisposablesMax: 35,
    slphMin: 80,
  },
  aurora: {
    name: "Aurora (LeeAngelo's)",
    primeMax: 55,
    laborMin: 19,
    laborMax: 21,
    foodDisposablesMax: 35,
    slphMin: 80,
  },
  lindseys: {
    name: "Lindsey's",
    primeMax: 60,
    laborMax: 25,
    foodDisposablesMax: 35,
    slphMin: 80,
  },
};

export function getCockpitTargets(slug: CockpitStoreSlug): CockpitTargets {
  return COCKPIT_TARGETS[slug];
}

/** Status for daily scoreboard: on_track | over | under. null = no value. */
export type CockpitStatusLabel = "on_track" | "over" | "under";

export function getPrimeStatus(slug: CockpitStoreSlug, primePct: number | null): CockpitStatusLabel | null {
  if (primePct == null) return null;
  return primePct <= COCKPIT_TARGETS[slug].primeMax ? "on_track" : "over";
}

export function getLaborStatus(slug: CockpitStoreSlug, laborPct: number | null): CockpitStatusLabel | null {
  if (laborPct == null) return null;
  const t = COCKPIT_TARGETS[slug];
  if (t.laborMin != null) {
    if (laborPct >= t.laborMin && laborPct <= t.laborMax) return "on_track";
    return laborPct < t.laborMin ? "under" : "over";
  }
  return laborPct <= t.laborMax ? "on_track" : "over";
}

export function getSlphStatus(slug: CockpitStoreSlug, slph: number | null): CockpitStatusLabel | null {
  if (slph == null) return null;
  return slph >= COCKPIT_TARGETS[slug].slphMin ? "on_track" : "under";
}

/** Food+Disposables combined % vs target */
export function getFoodDisposablesStatus(slug: CockpitStoreSlug, foodDispPct: number | null): CockpitStatusLabel | null {
  if (foodDispPct == null) return null;
  return foodDispPct <= COCKPIT_TARGETS[slug].foodDisposablesMax ? "on_track" : "over";
}
