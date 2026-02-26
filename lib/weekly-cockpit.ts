/**
 * Weekly snapshot: week math, KPI aggregation from daily_kpis, rule-based flags.
 * DB columns: net_sales, labor_dollars, labor_hours, food_dollars, disposables_dollars, voids_dollars, waste_dollars, customers.
 */

import type { CockpitStoreSlug } from "./cockpit-config";
import { getCockpitTargets } from "./cockpit-config";

/** Raw row from daily_kpis (Supabase) */
export interface DailyKpiRow {
  business_date: string;
  store_id: number;
  net_sales: number;
  labor_dollars: number;
  labor_hours: number;
  food_dollars: number;
  disposables_dollars: number;
  voids_dollars?: number;
  waste_dollars?: number;
  customers?: number;
  scheduled_hours?: number | null;
  bump_time_minutes?: number | null;
  [k: string]: unknown;
}

/** One day's computed KPIs */
export interface DailyComputed {
  business_date: string;
  store_id: number;
  net_sales: number;
  labor_dollars: number;
  food_dollars: number;
  disposables_dollars: number;
  labor_hours: number;
  prime_dollars: number;
  prime_pct: number | null;
  labor_pct: number | null;
  food_pct: number | null;
  disposables_pct: number | null;
  food_disposables_pct: number | null;
  slph: number | null;
  variance_prime: number | null; // vs target (positive = over)
  scheduled_hours: number;
  bump_time_minutes: number;
  customers: number;
}

/** Monday of week containing dateStr (ISO week Mon–Sun) */
export function getWeekStart(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00Z");
  const day = d.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().slice(0, 10);
}

export function getWeekEnd(dateStr: string): string {
  const mon = getWeekStart(dateStr);
  const d = new Date(mon + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + 6);
  return d.toISOString().slice(0, 10);
}

/** Mon–Sun dates for the week containing dateStr */
export function getWeekDates(dateStr: string): string[] {
  const start = getWeekStart(dateStr);
  const out: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start + "T12:00:00Z");
    d.setUTCDate(d.getUTCDate() + i);
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

export function prevWeekStart(mondayStr: string): string {
  const d = new Date(mondayStr + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() - 7);
  return d.toISOString().slice(0, 10);
}

function num(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export function rowToComputed(row: DailyKpiRow, primeMax: number): DailyComputed {
  const ns = num(row.net_sales);
  const labor = num(row.labor_dollars);
  const food = num(row.food_dollars);
  const disp = num(row.disposables_dollars);
  const hours = num(row.labor_hours);
  const cust = num(row.customers);
  const sched = num(row.scheduled_hours);
  const bump = num(row.bump_time_minutes);
  const primeDollars = labor + food + disp;
  const primePct = ns > 0 ? (primeDollars / ns) * 100 : null;
  const laborPct = ns > 0 ? (labor / ns) * 100 : null;
  const foodPct = ns > 0 ? (food / ns) * 100 : null;
  const dispPct = ns > 0 ? (disp / ns) * 100 : null;
  const foodDispPct = ns > 0 ? ((food + disp) / ns) * 100 : null;
  const slph = hours > 0 ? ns / hours : null;
  const variancePrime = primePct != null ? primePct - primeMax : null;
  return {
    business_date: row.business_date,
    store_id: row.store_id,
    net_sales: ns,
    labor_dollars: labor,
    food_dollars: food,
    disposables_dollars: disp,
    labor_hours: hours,
    prime_dollars: primeDollars,
    prime_pct: primePct,
    labor_pct: laborPct,
    food_pct: foodPct,
    disposables_pct: dispPct,
    food_disposables_pct: foodDispPct,
    slph,
    variance_prime: variancePrime,
    scheduled_hours: sched,
    bump_time_minutes: bump,
    customers: cust,
  };
}

export interface WeeklyAggregate {
  week_start: string;
  week_end: string;
  total_net_sales: number;
  total_prime_dollars: number;
  total_labor_dollars: number;
  total_food_dollars: number;
  total_disposables_dollars: number;
  total_labor_hours: number;
  total_scheduled_hours: number;
  total_customers: number;
  weekly_prime_pct: number | null;
  weekly_labor_pct: number | null;
  weekly_food_disposables_pct: number | null;
  weekly_slph: number | null;
  weekly_aov: number | null;
  weekly_bump_time_minutes: number | null;
}

/** Aggregate daily rows into weekly totals. KPIs from summed totals, not average of daily %. */
export function aggregateWeek(
  dailyRows: DailyComputed[]
): Omit<WeeklyAggregate, "week_start" | "week_end"> {
  const total_net_sales = dailyRows.reduce((s, d) => s + d.net_sales, 0);
  const total_prime_dollars = dailyRows.reduce((s, d) => s + d.prime_dollars, 0);
  const total_labor_dollars = dailyRows.reduce((s, d) => s + d.labor_dollars, 0);
  const total_food_dollars = dailyRows.reduce((s, d) => s + d.food_dollars, 0);
  const total_disposables_dollars = dailyRows.reduce((s, d) => s + d.disposables_dollars, 0);
  const total_labor_hours = dailyRows.reduce((s, d) => s + d.labor_hours, 0);
  const total_scheduled_hours = dailyRows.reduce((s, d) => s + d.scheduled_hours, 0);
  const total_customers = dailyRows.reduce((s, d) => s + d.customers, 0);
  const weightedBumpSum = dailyRows.reduce((s, d) => s + d.bump_time_minutes * d.customers, 0);
  const daysWithBump = dailyRows.filter((d) => d.bump_time_minutes > 0);
  const weekly_bump_time_minutes =
    total_customers > 0
      ? weightedBumpSum / total_customers
      : daysWithBump.length > 0
        ? daysWithBump.reduce((s, d) => s + d.bump_time_minutes, 0) / daysWithBump.length
        : null;
  return {
    total_net_sales,
    total_prime_dollars,
    total_labor_dollars,
    total_food_dollars,
    total_disposables_dollars,
    total_labor_hours,
    total_scheduled_hours,
    total_customers,
    weekly_prime_pct: total_net_sales > 0 ? (total_prime_dollars / total_net_sales) * 100 : null,
    weekly_labor_pct: total_net_sales > 0 ? (total_labor_dollars / total_net_sales) * 100 : null,
    weekly_food_disposables_pct:
      total_net_sales > 0
        ? ((total_food_dollars + total_disposables_dollars) / total_net_sales) * 100
        : null,
    weekly_slph: total_labor_hours > 0 ? total_net_sales / total_labor_hours : null,
    weekly_aov: total_customers > 0 ? total_net_sales / total_customers : null,
    weekly_bump_time_minutes,
  };
}

/** One issue line for "Top Issues This Week" */
export interface CockpitIssue {
  type: "prime_over" | "labor_outside" | "slph_below" | "worst_prime_day";
  date?: string;
  message: string;
  count?: number;
}

/** Rule-based issues from daily computed rows for one store */
export function getCockpitIssues(slug: CockpitStoreSlug, dailyRows: DailyComputed[]): CockpitIssue[] {
  const targets = getCockpitTargets(slug);
  const issues: CockpitIssue[] = [];
  const primeOverDates: string[] = [];
  const laborOutsideDates: string[] = [];
  const slphBelowDates: string[] = [];
  let worstDay: { date: string; variance: number } | null = null;

  for (const d of dailyRows) {
    if (d.prime_pct != null && d.prime_pct > targets.primeMax) {
      primeOverDates.push(d.business_date);
    }
    if (d.labor_pct != null) {
      if (targets.laborMin != null) {
        if (d.labor_pct < targets.laborMin || d.labor_pct > targets.laborMax)
          laborOutsideDates.push(d.business_date);
      } else if (d.labor_pct > targets.laborMax) {
        laborOutsideDates.push(d.business_date);
      }
    }
    if (d.slph != null && d.slph < targets.slphMin) {
      slphBelowDates.push(d.business_date);
    }
    if (d.variance_prime != null && d.variance_prime > 0) {
      if (!worstDay || d.variance_prime > worstDay.variance) {
        worstDay = { date: d.business_date, variance: d.variance_prime };
      }
    }
  }

  if (primeOverDates.length > 0) {
    issues.push({
      type: "prime_over",
      message: `${primeOverDates.length} day(s) PRIME exceeded target: ${primeOverDates.join(", ")}`,
      count: primeOverDates.length,
      date: primeOverDates[0],
    });
  }
  if (laborOutsideDates.length > 0) {
    issues.push({
      type: "labor_outside",
      message: `Labor outside target on ${laborOutsideDates.length} day(s): ${laborOutsideDates.join(", ")}`,
      count: laborOutsideDates.length,
      date: laborOutsideDates[0],
    });
  }
  if (slphBelowDates.length > 0) {
    issues.push({
      type: "slph_below",
      message: `${slphBelowDates.length} day(s) SLPH below 80: ${slphBelowDates.join(", ")}`,
      count: slphBelowDates.length,
      date: slphBelowDates[0],
    });
  }
  if (worstDay) {
    issues.push({
      type: "worst_prime_day",
      date: worstDay.date,
      message: `Worst PRIME variance: ${worstDay.date} (+${worstDay.variance.toFixed(1)}% vs target)`,
    });
  }
  return issues;
}

export function formatWeekLabel(weekStart: string): string {
  const end = getWeekEnd(weekStart);
  const m = new Date(weekStart + "T12:00:00Z");
  return `Week of ${m.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} (${weekStart} – ${end})`;
}
