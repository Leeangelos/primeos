/**
 * Weekly rollup utilities: week math (Mon–Sun), KPI aggregation, rolling averages, rule-based flags.
 */

import type { StoreId } from "./daily-targets";
import { STORE_TARGETS } from "./daily-targets";

/** One day's computed KPIs from raw daily_kpis row */
export interface DailyComputed {
  business_date: string;
  net_sales: number;
  labor_dollars: number;
  food_dollars: number;
  disposables_dollars: number;
  labor_hours: number;
  prime_dollars: number;
  prime_pct: number | null;
  labor_pct: number | null;
  food_pct: number | null;
  slph: number | null;
  waste_pct: number | null;
}

/** Raw row from daily_kpis (matches API/Supabase shape) */
export interface DailyKpiRow {
  business_date: string;
  net_sales: number;
  labor_dollars: number;
  labor_hours: number;
  food_dollars: number;
  disposables_dollars: number;
  voids_dollars?: number;
  waste_dollars?: number;
  customers?: number;
  [k: string]: unknown;
}

const WASTE_SPIKE_PCT = 3;

export function rowToComputed(row: DailyKpiRow): DailyComputed {
  const ns = row.net_sales ?? 0;
  const labor = row.labor_dollars ?? 0;
  const food = row.food_dollars ?? 0;
  const disp = row.disposables_dollars ?? 0;
  const hours = row.labor_hours ?? 0;
  const waste = row.waste_dollars ?? 0;
  const primeDollars = labor + food + disp;
  return {
    business_date: row.business_date,
    net_sales: ns,
    labor_dollars: labor,
    food_dollars: food,
    disposables_dollars: disp,
    labor_hours: hours,
    prime_dollars: primeDollars,
    prime_pct: ns > 0 ? (primeDollars / ns) * 100 : null,
    labor_pct: ns > 0 ? (labor / ns) * 100 : null,
    food_pct: ns > 0 ? (food / ns) * 100 : null,
    slph: hours > 0 ? ns / hours : null,
    waste_pct: ns > 0 ? (waste / ns) * 100 : null,
  };
}

/** Monday of the week containing date (ISO: week starts Monday) */
export function getWeekStart(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00Z");
  const day = d.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  return d.toISOString().slice(0, 10);
}

/** Sunday of the week containing dateStr */
export function getWeekEnd(dateStr: string): string {
  const mon = getWeekStart(dateStr);
  const d = new Date(mon + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + 6);
  return d.toISOString().slice(0, 10);
}

/** All dates Mon–Sun for the week containing dateStr */
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

/** Previous week's Monday from a given Monday */
export function prevWeekStart(mondayStr: string): string {
  const d = new Date(mondayStr + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() - 7);
  return d.toISOString().slice(0, 10);
}

/** Aggregate daily computed rows into weekly totals; compute weekly KPIs */
export interface WeeklyAggregate {
  week_start: string;
  week_end: string;
  days: DailyComputed[];
  total_net_sales: number;
  total_labor_dollars: number;
  total_food_dollars: number;
  total_disposables_dollars: number;
  total_labor_hours: number;
  total_prime_dollars: number;
  weekly_prime_pct: number | null;
  weekly_labor_pct: number | null;
  weekly_food_pct: number | null;
  weekly_slph: number | null;
}

export function aggregateWeek(dailyRows: DailyComputed[]): Omit<WeeklyAggregate, "week_start" | "week_end"> {
  const total_net_sales = dailyRows.reduce((s, d) => s + d.net_sales, 0);
  const total_labor_dollars = dailyRows.reduce((s, d) => s + d.labor_dollars, 0);
  const total_food_dollars = dailyRows.reduce((s, d) => s + d.food_dollars, 0);
  const total_disposables_dollars = dailyRows.reduce((s, d) => s + d.disposables_dollars, 0);
  const total_labor_hours = dailyRows.reduce((s, d) => s + d.labor_hours, 0);
  const total_prime_dollars = total_labor_dollars + total_food_dollars + total_disposables_dollars;

  return {
    days: dailyRows,
    total_net_sales,
    total_labor_dollars,
    total_food_dollars,
    total_disposables_dollars,
    total_labor_hours,
    total_prime_dollars,
    weekly_prime_pct: total_net_sales > 0 ? (total_prime_dollars / total_net_sales) * 100 : null,
    weekly_labor_pct: total_net_sales > 0 ? (total_labor_dollars / total_net_sales) * 100 : null,
    weekly_food_pct: total_net_sales > 0 ? (total_food_dollars / total_net_sales) * 100 : null,
    weekly_slph: total_labor_hours > 0 ? total_net_sales / total_labor_hours : null,
  };
}

/** 7-day rolling PRIME % from a list of daily computed (chronological); returns avg of last 7 days' PRIME % */
export function rolling7DayPrime(dailySorted: DailyComputed[]): number | null {
  const withPrime = dailySorted.filter((d) => d.prime_pct != null);
  if (withPrime.length === 0) return null;
  const last7 = withPrime.slice(-7);
  const sum = last7.reduce((s, d) => s + (d.prime_pct ?? 0), 0);
  return sum / last7.length;
}

/** 4-week rolling: need 4 weeks of weekly PRIME; caller passes array of weekly prime pct values (oldest first) */
export function rolling4WeekPrime(weeklyPrimePcts: (number | null)[]): number | null {
  const valid = weeklyPrimePcts.filter((p): p is number => p != null);
  if (valid.length === 0) return null;
  const last4 = valid.slice(-4);
  return last4.reduce((s, p) => s + p, 0) / last4.length;
}

/** One flag for Top 3 Issues */
export interface IssueFlag {
  type: "prime_over" | "labor_outside" | "slph_below" | "waste_spike";
  date: string;
  message: string;
  severity: "high" | "medium";
}

/** Rule-based flags for a store's week. No AI. */
export function getWeeklyFlags(
  storeId: StoreId,
  dailyRows: DailyComputed[]
): IssueFlag[] {
  const targets = STORE_TARGETS[storeId];
  const flags: IssueFlag[] = [];

  for (const d of dailyRows) {
    const dateLabel = new Date(d.business_date + "T12:00:00Z").toLocaleDateString("en-US", {
      weekday: "short",
    });

    if (d.prime_pct != null && d.prime_pct > targets.primeMax) {
      flags.push({
        type: "prime_over",
        date: d.business_date,
        message: `PRIME ${d.prime_pct.toFixed(1)}% (target ≤${targets.primeMax}%) on ${dateLabel}`,
        severity: "high",
      });
    }
    if (d.labor_pct != null) {
      if (targets.laborMin != null) {
        if (d.labor_pct < targets.laborMin || d.labor_pct > targets.laborMax) {
          flags.push({
            type: "labor_outside",
            date: d.business_date,
            message: `Labor ${d.labor_pct.toFixed(1)}% (target ${targets.laborMin}–${targets.laborMax}%) on ${dateLabel}`,
            severity: "high",
          });
        }
      } else if (d.labor_pct > targets.laborMax) {
        flags.push({
          type: "labor_outside",
          date: d.business_date,
          message: `Labor exceeded ${targets.laborMax}% (${d.labor_pct.toFixed(1)}%) on ${dateLabel}`,
          severity: "high",
        });
      }
    }
    if (d.slph != null && d.slph < targets.slphMin) {
      flags.push({
        type: "slph_below",
        date: d.business_date,
        message: `SLPH ${d.slph.toFixed(0)} below target (${targets.slphMin}+) on ${dateLabel}`,
        severity: "medium",
      });
    }
    if (d.waste_pct != null && d.waste_pct > WASTE_SPIKE_PCT) {
      flags.push({
        type: "waste_spike",
        date: d.business_date,
        message: `Waste spiked to ${d.waste_pct.toFixed(1)}% on ${dateLabel}`,
        severity: "medium",
      });
    }
  }

  return flags;
}

/** Top 3 Issues: aggregate by type, return up to 3 display strings */
export function topIssuesSummary(flags: IssueFlag[], limit = 3): string[] {
  const byType: Record<IssueFlag["type"], { count: number; sample: string }> = {
    prime_over: { count: 0, sample: "" },
    labor_outside: { count: 0, sample: "" },
    slph_below: { count: 0, sample: "" },
    waste_spike: { count: 0, sample: "" },
  };
  for (const f of flags) {
    byType[f.type].count++;
    if (!byType[f.type].sample) byType[f.type].sample = f.message;
  }
  const lines: string[] = [];
  if (byType.slph_below.count > 0) {
    lines.push(
      byType.slph_below.count === 1
        ? "1 day below SLPH target"
        : `${byType.slph_below.count} days below SLPH target`
    );
  }
  if (byType.labor_outside.count > 0) {
    lines.push(byType.labor_outside.sample);
  }
  if (byType.prime_over.count > 0) {
    lines.push(byType.prime_over.sample);
  }
  if (byType.waste_spike.count > 0 && lines.length < limit) {
    lines.push(byType.waste_spike.sample);
  }
  return lines.slice(0, limit);
}

/** Format week range for display */
export function formatWeekRange(weekStart: string): string {
  const end = getWeekEnd(weekStart);
  const m = new Date(weekStart + "T12:00:00Z");
  const e = new Date(end + "T12:00:00Z");
  return `${m.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${e.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
}
