import { NextRequest, NextResponse } from "next/server";
import { getClientForRoute } from "@/lib/supabase";
import {
  COCKPIT_STORE_SLUGS,
  COCKPIT_TARGETS,
  getCockpitTargets,
  type CockpitStoreSlug,
} from "@/lib/cockpit-config";
import {
  getWeekStart,
  getWeekEnd,
  getWeekDates,
  prevWeekStart,
  rowToComputed,
  aggregateWeek,
  getCockpitIssues,
  formatWeekLabel,
  type DailyKpiRow,
  type WeeklyAggregate,
} from "@/lib/weekly-cockpit";

function isValidSlug(s: string): s is CockpitStoreSlug {
  return COCKPIT_STORE_SLUGS.includes(s as CockpitStoreSlug);
}

/**
 * GET /api/weekly-cockpit?store=kent|aurora|lindseys|all&week_start=YYYY-MM-DD
 * week_start = Monday of the week. Defaults to current week if omitted.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const storeParam = searchParams.get("store") ?? "all";
  const weekStartParam = searchParams.get("week_start");
  const today = new Date().toISOString().slice(0, 10);
  const week_start = weekStartParam ? getWeekStart(weekStartParam) : getWeekStart(today);
  const week_end = getWeekEnd(week_start);
  const prev_start = prevWeekStart(week_start);
  const prev_end = getWeekEnd(prev_start);

  const slugs: CockpitStoreSlug[] =
    storeParam === "all"
      ? [...COCKPIT_STORE_SLUGS]
      : isValidSlug(storeParam)
        ? [storeParam]
        : [...COCKPIT_STORE_SLUGS];

  try {
    const supabase = await getClientForRoute();

    const { data: storesRows, error: storesErr } = await supabase
      .from("stores")
      .select("id, slug")
      .in("slug", slugs);

    if (storesErr) {
      return NextResponse.json({ ok: false, error: storesErr.message }, { status: 500 });
    }

    const storeIdBySlug = new Map<string, number>();
    const slugById = new Map<number, string>();
    for (const r of storesRows ?? []) {
      const slug = r.slug as string;
      storeIdBySlug.set(slug, r.id);
      slugById.set(r.id, slug);
    }

    const storeIds = Array.from(storeIdBySlug.values());
    if (storeIds.length === 0) {
      return NextResponse.json({
        ok: true,
        week_start,
        week_end,
        week_label: formatWeekLabel(week_start),
        store: storeParam,
        hero: null,
        daily: [],
        secondary: null,
        issues: [],
        comparison: [],
      });
    }

    const { data: allRangeRows, error: kpiErr } = await supabase
      .from("daily_kpis")
      .select("*")
      .in("store_id", storeIds)
      .gte("business_date", prev_start)
      .lte("business_date", week_end)
      .order("business_date", { ascending: true });

    if (kpiErr) {
      return NextResponse.json({ ok: false, error: kpiErr.message }, { status: 500 });
    }

    const weekRows = (allRangeRows ?? []).filter(
      (r) => r.business_date >= week_start && r.business_date <= week_end
    );
    const prevRows = (allRangeRows ?? []).filter(
      (r) => r.business_date >= prev_start && r.business_date <= prev_end
    );

    const byStore = new Map<number, DailyKpiRow[]>();
    for (const r of weekRows) {
      const row = r as DailyKpiRow;
      const id = row.store_id;
      if (!byStore.has(id)) byStore.set(id, []);
      byStore.get(id)!.push(row);
    }
    const prevByStore = new Map<number, DailyKpiRow[]>();
    for (const r of prevRows) {
      const row = r as DailyKpiRow;
      const id = row.store_id;
      if (!prevByStore.has(id)) prevByStore.set(id, []);
      prevByStore.get(id)!.push(row);
    }

    const weekDates = getWeekDates(week_start);

    type StoreResult = {
      slug: string;
      name: string;
      weekly: WeeklyAggregate;
      daily: { date: string; prime_pct: number | null }[];
      prev_weekly: Omit<WeeklyAggregate, "week_start" | "week_end">;
      issues: { type: string; message: string; date?: string; count?: number }[];
    };

    const storeResults: StoreResult[] = [];
    let allComputed: import("@/lib/weekly-cockpit").DailyComputed[] = [];

    for (const slug of slugs) {
      const storeId = storeIdBySlug.get(slug);
      if (storeId == null) continue;
      const targets = getCockpitTargets(slug);
      const rows = (byStore.get(storeId) ?? []).sort((a, b) =>
        a.business_date.localeCompare(b.business_date)
      );
      const computed = rows.map((row) => rowToComputed(row, targets.primeMax));
      allComputed = allComputed.concat(computed);
      const agg = aggregateWeek(computed);
      const prevRowsStore = (prevByStore.get(storeId) ?? []).map((row) =>
        rowToComputed(row, targets.primeMax)
      );
      const prevAgg = aggregateWeek(prevRowsStore);
      const dailyForChart = weekDates.map((date) => {
        const day = computed.find((d) => d.business_date === date);
        return { date, prime_pct: day?.prime_pct ?? null };
      });
      const issues = getCockpitIssues(slug, computed);
      storeResults.push({
        slug,
        name: COCKPIT_TARGETS[slug].name,
        weekly: { week_start, week_end, ...agg },
        daily: dailyForChart,
        prev_weekly: prevAgg,
        issues: issues.map((i) => ({
          type: i.type,
          message: i.message,
          date: i.date,
          count: i.count,
        })),
      });
    }

    const singleStore = storeResults[0];
    const isAll = slugs.length > 1;

    let hero: {
      weekly_prime_pct: number | null;
      target_label: string;
      prime_max: number;
      status: "on_track" | "over";
      variance_pct: number | null;
      wow_delta_pct: number | null;
    } | null = null;
    let secondary: {
      labor_pct: number | null;
      labor_target: string;
      labor_status: string;
      labor_wow: number | null;
      food_disp_pct: number | null;
      food_disp_target: string;
      food_disp_status: string;
      food_disp_wow: number | null;
      slph: number | null;
      slph_target: string;
      slph_status: string;
      slph_wow: number | null;
      aov: number | null;
      total_scheduled_hours: number;
      total_labor_hours: number;
      scheduled_variance: number | null;
      weekly_bump_time_minutes: number | null;
    } | null = null;
    let daily: { date: string; prime_pct: number | null }[] = [];
    let issues: { type: string; message: string; date?: string; count?: number }[] = [];

    if (isAll && storeResults.length > 0) {
      const totalAgg = aggregateWeek(allComputed);
      const totalPrev = storeResults.reduce(
        (acc, s) => {
          acc.total_net_sales += s.prev_weekly.total_net_sales;
          acc.total_prime_dollars += s.prev_weekly.total_prime_dollars;
          acc.total_labor_dollars += s.prev_weekly.total_labor_dollars;
          acc.total_food_dollars += s.prev_weekly.total_food_dollars;
          acc.total_disposables_dollars += s.prev_weekly.total_disposables_dollars;
          acc.total_labor_hours += s.prev_weekly.total_labor_hours;
          acc.total_scheduled_hours += s.prev_weekly.total_scheduled_hours;
          acc.total_customers += s.prev_weekly.total_customers;
          return acc;
        },
        {
          total_net_sales: 0,
          total_prime_dollars: 0,
          total_labor_dollars: 0,
          total_food_dollars: 0,
          total_disposables_dollars: 0,
          total_labor_hours: 0,
          total_scheduled_hours: 0,
          total_customers: 0,
        }
      );
      const prevPrimePct =
        totalPrev.total_net_sales > 0
          ? (totalPrev.total_prime_dollars / totalPrev.total_net_sales) * 100
          : null;
      const prevLaborPct =
        totalPrev.total_net_sales > 0
          ? (totalPrev.total_labor_dollars / totalPrev.total_net_sales) * 100
          : null;
      const prevFoodDispPct =
        totalPrev.total_net_sales > 0
          ? ((totalPrev.total_food_dollars + totalPrev.total_disposables_dollars) /
              totalPrev.total_net_sales) *
            100
          : null;
      const prevSlph =
        totalPrev.total_labor_hours > 0
          ? totalPrev.total_net_sales / totalPrev.total_labor_hours
          : null;
      hero = {
        weekly_prime_pct: totalAgg.weekly_prime_pct,
        target_label: "Weighted all stores",
        prime_max: 55,
        status:
          totalAgg.weekly_prime_pct != null && totalAgg.weekly_prime_pct <= 55
            ? "on_track"
            : "over",
        variance_pct:
          totalAgg.weekly_prime_pct != null ? totalAgg.weekly_prime_pct - 55 : null,
        wow_delta_pct:
          totalAgg.weekly_prime_pct != null && prevPrimePct != null
            ? totalAgg.weekly_prime_pct - prevPrimePct
            : null,
      };
      secondary = {
        labor_pct: totalAgg.weekly_labor_pct,
        labor_target: "19–21% (LeeAngelo) / ≤25% (Lindsey)",
        labor_status: "—",
        labor_wow:
          totalAgg.weekly_labor_pct != null && prevLaborPct != null
            ? totalAgg.weekly_labor_pct - prevLaborPct
            : null,
        food_disp_pct: totalAgg.weekly_food_disposables_pct,
        food_disp_target: "≤35%",
        food_disp_status:
          totalAgg.weekly_food_disposables_pct != null
            ? totalAgg.weekly_food_disposables_pct <= 35
              ? "on_track"
              : "over"
            : "—",
        food_disp_wow:
          totalAgg.weekly_food_disposables_pct != null && prevFoodDispPct != null
            ? totalAgg.weekly_food_disposables_pct - prevFoodDispPct
            : null,
        slph: totalAgg.weekly_slph,
        slph_target: "≥80",
        slph_status:
          totalAgg.weekly_slph != null
            ? totalAgg.weekly_slph >= 80
              ? "on_track"
              : "under"
            : "—",
        slph_wow:
          totalAgg.weekly_slph != null && prevSlph != null
            ? totalAgg.weekly_slph - prevSlph
            : null,
        aov: totalAgg.weekly_aov,
        total_scheduled_hours: totalAgg.total_scheduled_hours,
        total_labor_hours: totalAgg.total_labor_hours,
        scheduled_variance:
          totalAgg.total_scheduled_hours !== 0 || totalAgg.total_labor_hours !== 0
            ? totalAgg.total_scheduled_hours - totalAgg.total_labor_hours
            : null,
        weekly_bump_time_minutes: totalAgg.weekly_bump_time_minutes,
      };
      daily = weekDates.map((date) => {
        const day = allComputed.filter((d) => d.business_date === date);
        const totalNs = day.reduce((s, d) => s + d.net_sales, 0);
        const totalPrime = day.reduce((s, d) => s + d.prime_dollars, 0);
        const prime_pct = totalNs > 0 ? (totalPrime / totalNs) * 100 : null;
        return { date, prime_pct };
      });
      issues = storeResults.flatMap((s) => s.issues);
    } else if (singleStore) {
      const w = singleStore.weekly;
      const t = getCockpitTargets(singleStore.slug as CockpitStoreSlug);
      hero = {
        weekly_prime_pct: w.weekly_prime_pct,
        target_label: `≤${t.primeMax}%`,
        prime_max: t.primeMax,
        status:
          w.weekly_prime_pct != null && w.weekly_prime_pct <= t.primeMax ? "on_track" : "over",
        variance_pct:
          w.weekly_prime_pct != null ? w.weekly_prime_pct - t.primeMax : null,
        wow_delta_pct:
          w.weekly_prime_pct != null && singleStore.prev_weekly.weekly_prime_pct != null
            ? w.weekly_prime_pct - singleStore.prev_weekly.weekly_prime_pct
            : null,
      };
      secondary = {
        labor_pct: w.weekly_labor_pct,
        labor_target: t.laborMin != null ? `${t.laborMin}–${t.laborMax}%` : `≤${t.laborMax}%`,
        labor_status:
          w.weekly_labor_pct != null
            ? t.laborMin != null
              ? w.weekly_labor_pct >= t.laborMin && w.weekly_labor_pct <= t.laborMax
                ? "on_track"
                : w.weekly_labor_pct < t.laborMin
                  ? "under"
                  : "over"
              : w.weekly_labor_pct <= t.laborMax
                ? "on_track"
                : "over"
            : "—",
        labor_wow:
          w.weekly_labor_pct != null &&
          singleStore.prev_weekly.weekly_labor_pct != null
            ? w.weekly_labor_pct - singleStore.prev_weekly.weekly_labor_pct
            : null,
        food_disp_pct: w.weekly_food_disposables_pct,
        food_disp_target: `≤${t.foodDisposablesMax}%`,
        food_disp_status:
          w.weekly_food_disposables_pct != null
            ? w.weekly_food_disposables_pct <= t.foodDisposablesMax
              ? "on_track"
              : "over"
            : "—",
        food_disp_wow:
          w.weekly_food_disposables_pct != null &&
          singleStore.prev_weekly.weekly_food_disposables_pct != null
            ? w.weekly_food_disposables_pct -
              singleStore.prev_weekly.weekly_food_disposables_pct
            : null,
        slph: w.weekly_slph,
        slph_target: `≥${t.slphMin}`,
        slph_status:
          w.weekly_slph != null
            ? w.weekly_slph >= t.slphMin
              ? "on_track"
              : "under"
            : "—",
        slph_wow:
          w.weekly_slph != null && singleStore.prev_weekly.weekly_slph != null
            ? w.weekly_slph - singleStore.prev_weekly.weekly_slph
            : null,
        aov: w.weekly_aov,
        total_scheduled_hours: w.total_scheduled_hours,
        total_labor_hours: w.total_labor_hours,
        scheduled_variance:
          w.total_scheduled_hours !== 0 || w.total_labor_hours !== 0
            ? w.total_scheduled_hours - w.total_labor_hours
            : null,
        weekly_bump_time_minutes: w.weekly_bump_time_minutes,
      };
      daily = singleStore.daily;
      issues = singleStore.issues;
    }

    const comparison =
      isAll && storeResults.length > 0
        ? storeResults
          .map((s) => {
            const w = s.weekly;
            const t = getCockpitTargets(s.slug as CockpitStoreSlug);
            const primeStatus =
              w.weekly_prime_pct != null && w.weekly_prime_pct <= t.primeMax
                ? "on_track"
                : "over";
            const scheduledVariance =
              w.total_scheduled_hours !== 0 || w.total_labor_hours !== 0
                ? w.total_scheduled_hours - w.total_labor_hours
                : null;
            return {
              slug: s.slug,
              name: s.name,
              weekly_prime_pct: w.weekly_prime_pct,
              weekly_labor_pct: w.weekly_labor_pct,
              weekly_food_disposables_pct: w.weekly_food_disposables_pct,
              weekly_slph: w.weekly_slph,
              status: primeStatus,
              weekly_aov: w.weekly_aov,
              total_scheduled_hours: w.total_scheduled_hours,
              total_labor_hours: w.total_labor_hours,
              scheduled_variance: scheduledVariance,
              weekly_bump_time_minutes: w.weekly_bump_time_minutes,
            };
          })
          .sort((a, b) => (b.weekly_prime_pct ?? 0) - (a.weekly_prime_pct ?? 0))
        : [];

    return NextResponse.json({
      ok: true,
      week_start,
      week_end,
      week_label: formatWeekLabel(week_start),
      store: storeParam,
      hero,
      daily,
      secondary,
      issues,
      comparison,
    });
  } catch (err) {
    console.error("[weekly-cockpit]", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}
