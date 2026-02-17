import { NextRequest, NextResponse } from "next/server";
import { getClientForRoute } from "@/lib/supabase";
import {
  getWeekStart,
  getWeekEnd,
  getWeekDates,
  prevWeekStart,
  rowToComputed,
  aggregateWeek,
  getWeeklyFlags,
  topIssuesSummary,
  rolling7DayPrime,
  formatWeekRange,
  type DailyKpiRow,
  type DailyComputed,
  type WeeklyAggregate,
} from "@/lib/weekly-utils";
import type { StoreId } from "@/lib/daily-targets";
import { STORE_TARGETS } from "@/lib/daily-targets";

const STORE_SLUGS: StoreId[] = ["leeangelo", "lindsey"];

/**
 * GET /api/weekly-kpi?week_start=YYYY-MM-DD&stores=leeangelo,lindsey
 * week_start = Monday of the week (Mon–Sun).
 * stores = one slug or comma-separated; if omitted, all stores.
 * Returns weekly aggregates, daily breakdown (sparklines), WoW delta, flags, rolling metrics.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const weekStartParam = searchParams.get("week_start");
  const storesParam = searchParams.get("stores");

  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const defaultMonday = getWeekStart(todayStr);
  const week_start = weekStartParam ?? defaultMonday;
  const week_end = getWeekEnd(week_start);

  const requestedSlugs = storesParam
    ? (storesParam.split(",").map((s) => s.trim()).filter(Boolean) as StoreId[])
    : STORE_SLUGS;
  const slugs = requestedSlugs.filter((s) => STORE_SLUGS.includes(s));
  if (slugs.length === 0) {
    return NextResponse.json({ ok: false, error: "No valid stores" }, { status: 400 });
  }

  try {
    const supabase = await getClientForRoute();

    const { data: storesRows, error: storesError } = await supabase
      .from("stores")
      .select("id, slug")
      .in("slug", slugs);

    if (storesError) {
      return NextResponse.json({ ok: false, error: storesError.message }, { status: 500 });
    }
    const storeIdBySlug = new Map<string, number>();
    const slugById = new Map<number, string>();
    for (const r of storesRows ?? []) {
      storeIdBySlug.set(r.slug, r.id);
      slugById.set(r.id, r.slug);
    }

    const weekDates = getWeekDates(week_start);
    const prevStart = prevWeekStart(week_start);
    const prevEnd = getWeekEnd(prevStart);
    const rangeStart = week_start;
    const rangeEnd = week_end;

    const storeIds = Array.from(storeIdBySlug.values());

    const { data: rows, error: kpiError } = await supabase
      .from("daily_kpis")
      .select("*")
      .in("store_id", storeIds)
      .gte("business_date", rangeStart)
      .lte("business_date", rangeEnd)
      .order("business_date", { ascending: true });

    if (kpiError) {
      return NextResponse.json({ ok: false, error: kpiError.message }, { status: 500 });
    }

    const { data: prevRows } = await supabase
      .from("daily_kpis")
      .select("*")
      .in("store_id", storeIds)
      .gte("business_date", prevStart)
      .lte("business_date", prevEnd)
      .order("business_date", { ascending: true });

    const prevRowMap = new Map<string, DailyKpiRow[]>();
    for (const r of prevRows ?? []) {
      const key = `${r.store_id}-${r.business_date}`;
      if (!prevRowMap.has(key)) prevRowMap.set(key, []);
      prevRowMap.get(key)!.push(r as DailyKpiRow);
    }

    const byStore = new Map<number, DailyKpiRow[]>();
    for (const r of rows ?? []) {
      const id = r.store_id;
      if (!byStore.has(id)) byStore.set(id, []);
      byStore.get(id)!.push(r as DailyKpiRow);
    }

    const prevByStore = new Map<number, DailyKpiRow[]>();
    for (const r of prevRows ?? []) {
      const id = r.store_id;
      if (!prevByStore.has(id)) prevByStore.set(id, []);
      prevByStore.get(id)!.push(r as DailyKpiRow);
    }

    const storesResult: {
      slug: string;
      name: string;
      weekly: WeeklyAggregate & { variance_prime?: number; variance_labor?: number; variance_food?: number; variance_slph?: number };
      daily: { date: string; prime_pct: number | null; labor_pct: number | null; food_pct: number | null; slph: number | null }[];
      wow_delta: { prime_pct: number | null; labor_pct: number | null; food_pct: number | null; slph: number | null };
      flags: { type: string; date: string; message: string; severity: string }[];
      top_issues: string[];
      rolling_7_day_prime: number | null;
    }[] = [];

    for (const slug of slugs) {
      const storeId = storeIdBySlug.get(slug);
      if (storeId == null) continue;
      const targets = STORE_TARGETS[slug];
      const name = targets.name;

      const storeRows = (byStore.get(storeId) ?? []).sort(
        (a, b) => a.business_date.localeCompare(b.business_date)
      );
      const computed = storeRows.map(rowToComputed);
      const agg = aggregateWeek(computed);
      const weekly: WeeklyAggregate & {
        variance_prime?: number;
        variance_labor?: number;
        variance_food?: number;
        variance_slph?: number;
      } = {
        week_start,
        week_end,
        ...agg,
      };
      weekly.variance_prime =
        agg.weekly_prime_pct != null ? agg.weekly_prime_pct - targets.primeMax : undefined;
      weekly.variance_labor =
        targets.laborMin != null && agg.weekly_labor_pct != null
          ? agg.weekly_labor_pct - (targets.laborMin + targets.laborMax) / 2
          : agg.weekly_labor_pct != null
            ? agg.weekly_labor_pct - targets.laborMax
            : undefined;
      weekly.variance_food =
        agg.weekly_food_pct != null ? agg.weekly_food_pct - targets.foodDisposablesMax : undefined;
      weekly.variance_slph =
        agg.weekly_slph != null ? agg.weekly_slph - targets.slphMin : undefined;

      const daily = weekDates.map((date) => {
        const day = computed.find((d) => d.business_date === date);
        return {
          date,
          prime_pct: day?.prime_pct ?? null,
          labor_pct: day?.labor_pct ?? null,
          food_pct: day?.food_pct ?? null,
          slph: day?.slph ?? null,
        };
      });

      const prevStoreRows = (prevByStore.get(storeId) ?? []).map(rowToComputed);
      const prevAgg = aggregateWeek(prevStoreRows);
      const wow_delta = {
        prime_pct:
          agg.weekly_prime_pct != null && prevAgg.weekly_prime_pct != null
            ? agg.weekly_prime_pct - prevAgg.weekly_prime_pct
            : null,
        labor_pct:
          agg.weekly_labor_pct != null && prevAgg.weekly_labor_pct != null
            ? agg.weekly_labor_pct - prevAgg.weekly_labor_pct
            : null,
        food_pct:
          agg.weekly_food_pct != null && prevAgg.weekly_food_pct != null
            ? agg.weekly_food_pct - prevAgg.weekly_food_pct
            : null,
        slph:
          agg.weekly_slph != null && prevAgg.weekly_slph != null
            ? agg.weekly_slph - prevAgg.weekly_slph
            : null,
      };

      const flags = getWeeklyFlags(slug, computed);
      const top_issues = topIssuesSummary(flags, 3);
      const rolling_7_day_prime = rolling7DayPrime(computed);

      storesResult.push({
        slug,
        name,
        weekly: weekly as WeeklyAggregate & { variance_prime?: number; variance_labor?: number; variance_food?: number; variance_slph?: number },
        daily,
        wow_delta,
        flags: flags.map((f) => ({ type: f.type, date: f.date, message: f.message, severity: f.severity })),
        top_issues,
        rolling_7_day_prime,
      });
    }

    const rolling4WeeksByStore: Record<string, number | null> = {};
    const fourWeeksStart = (() => {
      const d = new Date(week_start + "T12:00:00Z");
      d.setUTCDate(d.getUTCDate() - 21);
      return d.toISOString().slice(0, 10);
    })();
    const { data: fourWeekRows } = await supabase
      .from("daily_kpis")
      .select("*")
      .in("store_id", storeIds)
      .gte("business_date", fourWeeksStart)
      .lte("business_date", week_end)
      .order("business_date", { ascending: true });

    const byStoreAndWeek = new Map<string, DailyComputed[]>();
    for (const r of fourWeekRows ?? []) {
      const row = r as DailyKpiRow;
      const mon = getWeekStart(row.business_date);
      const key = `${r.store_id}-${mon}`;
      if (!byStoreAndWeek.has(key)) byStoreAndWeek.set(key, []);
      byStoreAndWeek.get(key)!.push(rowToComputed(row));
    }
    for (const slug of slugs) {
      const storeId = storeIdBySlug.get(slug);
      if (storeId == null) continue;
      const fourMondays = [
        prevWeekStart(prevWeekStart(prevStart)),
        prevWeekStart(prevStart),
        prevStart,
        week_start,
      ];
      const weeklyPrimes: (number | null)[] = fourMondays.map((mon) => {
        const comps = byStoreAndWeek.get(`${storeId}-${mon}`) ?? [];
        const a = aggregateWeek(comps);
        return a.weekly_prime_pct;
      });
      const valid = weeklyPrimes.filter((p): p is number => p != null);
      rolling4WeeksByStore[slug] = valid.length >= 1 ? valid.reduce((a, b) => a + b, 0) / valid.length : null;
    }

    return NextResponse.json({
      ok: true,
      week_start,
      week_end,
      week_label: formatWeekRange(week_start),
      stores: storesResult.map((s) => ({
        ...s,
        rolling_4_week_prime: rolling4WeeksByStore[s.slug] ?? null,
      })),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}
