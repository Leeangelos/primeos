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
 * Resolves store slug(s) to UUID via stores table (same pattern as dashboard/daily-data).
 */
function todayForEST(): string {
  const now = new Date();
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = fmt.formatToParts(now).reduce<Record<string, string>>((acc, p) => {
    if (p.type === "year" || p.type === "month" || p.type === "day") acc[p.type] = p.value;
    return acc;
  }, {});
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const storeParam = searchParams.get("store") ?? "all";
  const weekStartParam = searchParams.get("week_start");
  const today = todayForEST();
  const currentWeekStart = getWeekStart(today);
  let week_start = weekStartParam ? getWeekStart(weekStartParam) : currentWeekStart;
  if (week_start > currentWeekStart) {
    // Never allow selecting a week beyond the current week
    week_start = currentWeekStart;
  }
  const week_end = getWeekEnd(week_start);
  const prev_start = prevWeekStart(week_start);
  const prev_end = getWeekEnd(prev_start);
  const rollingEnd = new Date(week_end + "T12:00:00Z");
  rollingEnd.setUTCDate(rollingEnd.getUTCDate() - 29);
  const rolling_start = rollingEnd.toISOString().slice(0, 10);
  const prevRollingEnd = new Date(prev_end + "T12:00:00Z");
  prevRollingEnd.setUTCDate(prevRollingEnd.getUTCDate() - 29);
  const prev_rolling_start = prevRollingEnd.toISOString().slice(0, 10);

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

    const storeIdBySlug = new Map<string, string>();
    const slugById = new Map<string, string>();
    for (const r of storesRows ?? []) {
      const slug = r.slug as string;
      const id = String(r.id);
      storeIdBySlug.set(slug, id);
      slugById.set(id, slug);
    }

    const storeIds = slugs.map((s) => storeIdBySlug.get(s)).filter((id): id is string => id != null);

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

    const fetchStart = prev_rolling_start;
    const [salesRes, laborRes, purchasesRes] = await Promise.all([
      supabase
        .from("foodtec_daily_sales")
        .select("store_id, business_day, net_sales, total_orders, guest_count, avg_bump_time")
        .in("store_id", storeIds)
        .gte("business_day", fetchStart)
        .lte("business_day", week_end)
        .order("business_day", { ascending: true }),
      supabase
        .from("foodtec_daily_labor")
        .select("store_id, business_day, total_labor_cost, total_overtime_cost, regular_hours, overtime_hours")
        .in("store_id", storeIds)
        .gte("business_day", fetchStart)
        .lte("business_day", week_end)
        .order("business_day", { ascending: true }),
      supabase
        .from("me_daily_purchases")
        .select("store_id, business_day, food_spend, paper_spend")
        .in("store_id", storeIds)
        .gte("business_day", fetchStart)
        .lte("business_day", week_end)
        .order("business_day", { ascending: true }),
    ]);

    const salesRows = salesRes.data ?? [];
    const laborRows = laborRes.data ?? [];
    const purchasesRows = purchasesRes.data ?? [];

    type MergedKey = string;
    type RowWithStore = DailyKpiRow & { _store_id: string };
    const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : 0);
    const merged: Record<MergedKey, RowWithStore> = {};
    for (const r of salesRows) {
      const storeId = String(r.store_id);
      const key: MergedKey = `${storeId}:${r.business_day}`;
      merged[key] = {
        business_date: r.business_day,
        store_id: 0,
        net_sales: num(r.net_sales),
        labor_dollars: 0,
        labor_hours: 0,
        food_dollars: 0,
        disposables_dollars: 0,
        customers: num(r.guest_count) || num(r.total_orders),
        scheduled_hours: 0,
        bump_time_minutes: num(r.avg_bump_time),
        _store_id: storeId,
      };
    }
    for (const r of laborRows) {
      const storeId = String(r.store_id);
      const key: MergedKey = `${storeId}:${r.business_day}`;
      const laborCost = num(r.total_labor_cost) + num(r.total_overtime_cost);
      const hours = num(r.regular_hours) + num(r.overtime_hours);
      if (merged[key]) {
        merged[key].labor_dollars = laborCost;
        merged[key].labor_hours = hours;
        merged[key].scheduled_hours = hours;
      } else {
        merged[key] = {
          business_date: r.business_day,
          store_id: 0,
          net_sales: 0,
          labor_dollars: laborCost,
          labor_hours: hours,
          food_dollars: 0,
          disposables_dollars: 0,
          scheduled_hours: hours,
          bump_time_minutes: 0,
          customers: 0,
          _store_id: storeId,
        };
      }
    }
    for (const r of purchasesRows) {
      const storeId = String(r.store_id);
      const key: MergedKey = `${storeId}:${r.business_day}`;
      if (merged[key]) {
        merged[key].food_dollars = num(r.food_spend);
        merged[key].disposables_dollars = num(r.paper_spend);
      } else {
        merged[key] = {
          business_date: r.business_day,
          store_id: 0,
          net_sales: 0,
          labor_dollars: 0,
          labor_hours: 0,
          food_dollars: num(r.food_spend),
          disposables_dollars: num(r.paper_spend),
          scheduled_hours: 0,
          bump_time_minutes: 0,
          customers: 0,
          _store_id: storeId,
        };
      }
    }

    const allRangeRows: DailyKpiRow[] = Object.values(merged);
    const weekRows = allRangeRows.filter(
      (r) => r.business_date >= week_start && r.business_date <= week_end
    );
    const prevRows = allRangeRows.filter(
      (r) => r.business_date >= prev_start && r.business_date <= prev_end
    );
    const rolling30Rows = allRangeRows.filter(
      (r) => r.business_date >= rolling_start && r.business_date <= week_end
    );
    const prevRolling30Rows = allRangeRows.filter(
      (r) => r.business_date >= prev_rolling_start && r.business_date <= prev_end
    );

    function sumRolling(rows: DailyKpiRow[]) {
      return rows.reduce(
        (acc, r) => ({
          net_sales: acc.net_sales + r.net_sales,
          labor: acc.labor + r.labor_dollars,
          food: acc.food + r.food_dollars,
          disposables: acc.disposables + r.disposables_dollars,
        }),
        { net_sales: 0, labor: 0, food: 0, disposables: 0 }
      );
    }
    const rolling30Sums = sumRolling(rolling30Rows);
    const prevRolling30Sums = sumRolling(prevRolling30Rows);
    const rolling30NetSales = rolling30Sums.net_sales;
    const rolling30CogsPct =
      rolling30NetSales > 0
        ? ((rolling30Sums.labor + rolling30Sums.food + rolling30Sums.disposables) / rolling30NetSales) * 100
        : null;
    const rolling30FoodDispPct =
      rolling30NetSales > 0
        ? ((rolling30Sums.food + rolling30Sums.disposables) / rolling30NetSales) * 100
        : null;
    const prevRolling30NetSales = prevRolling30Sums.net_sales;
    const prevRolling30CogsPct =
      prevRolling30NetSales > 0
        ? ((prevRolling30Sums.labor + prevRolling30Sums.food + prevRolling30Sums.disposables) / prevRolling30NetSales) * 100
        : null;
    const prevRolling30FoodDispPct =
      prevRolling30NetSales > 0
        ? ((prevRolling30Sums.food + prevRolling30Sums.disposables) / prevRolling30NetSales) * 100
        : null;

    const rolling30ByStore = new Map<
      string,
      { cogsPct: number | null; foodDispPct: number | null; prevCogsPct: number | null; prevFoodDispPct: number | null }
    >();
    for (const storeId of storeIds) {
      const storeRolling = rolling30Rows.filter((r) => (r as RowWithStore)._store_id === storeId);
      const storePrevRolling = prevRolling30Rows.filter((r) => (r as RowWithStore)._store_id === storeId);
      const s = sumRolling(storeRolling);
      const p = sumRolling(storePrevRolling);
      rolling30ByStore.set(storeId, {
        cogsPct: s.net_sales > 0 ? ((s.labor + s.food + s.disposables) / s.net_sales) * 100 : null,
        foodDispPct: s.net_sales > 0 ? ((s.food + s.disposables) / s.net_sales) * 100 : null,
        prevCogsPct: p.net_sales > 0 ? ((p.labor + p.food + p.disposables) / p.net_sales) * 100 : null,
        prevFoodDispPct: p.net_sales > 0 ? ((p.food + p.disposables) / p.net_sales) * 100 : null,
      });
    }

    const byStore = new Map<string, DailyKpiRow[]>();
    for (const r of weekRows) {
      const storeKey = (r as RowWithStore)._store_id ?? "";
      if (!storeKey) continue;
      if (!byStore.has(storeKey)) byStore.set(storeKey, []);
      byStore.get(storeKey)!.push(r);
    }
    const prevByStore = new Map<string, DailyKpiRow[]>();
    for (const r of prevRows) {
      const storeKey = (r as RowWithStore)._store_id ?? "";
      if (!storeKey) continue;
      if (!prevByStore.has(storeKey)) prevByStore.set(storeKey, []);
      prevByStore.get(storeKey)!.push(r);
    }

    const weekDates = getWeekDates(week_start);

    // Today in America/New_York (EST) so only fully completed days (strictly before today) are shown
    const estNow = new Date(
      new Date().toLocaleString("en-US", { timeZone: "America/New_York" })
    );
    const todayStr = `${estNow.getFullYear()}-${String(
      estNow.getMonth() + 1
    ).padStart(2, "0")}-${String(estNow.getDate()).padStart(2, "0")}`;

    /** 7-day rolling COGS % at each date: (sum labor+food+disp over [date-6, date]) / (sum net_sales) * 100. Future dates return null so the chart does not show a bell curve. */
    function dailyRolling7Cogs(
      rows: DailyKpiRow[],
      dates: string[]
    ): { date: string; prime_pct: number | null }[] {
      return dates.map((date) => {
        if (date >= todayStr) return { date, prime_pct: null };
        const end = new Date(date + "T12:00:00Z");
        const start = new Date(end);
        start.setUTCDate(start.getUTCDate() - 6);
        const startStr = start.toISOString().slice(0, 10);
        const windowRows = rows.filter(
          (r) => r.business_date >= startStr && r.business_date <= date
        );
        const sumNs = windowRows.reduce((s, r) => s + r.net_sales, 0);
        const sumPrime = windowRows.reduce(
          (s, r) =>
            s + r.labor_dollars + r.food_dollars + r.disposables_dollars,
          0
        );
        const prime_pct = sumNs > 0 ? (sumPrime / sumNs) * 100 : null;
        return { date, prime_pct };
      });
    }

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
      const storeRangeRows = allRangeRows.filter(
        (r) => (r as RowWithStore)._store_id === storeId
      );
      const dailyForChart = dailyRolling7Cogs(storeRangeRows, weekDates);
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
        weekly_prime_pct: rolling30CogsPct,
        target_label: "Weighted all stores",
        prime_max: 55,
        status:
          rolling30CogsPct != null && rolling30CogsPct <= 55 ? "on_track" : "over",
        variance_pct: rolling30CogsPct != null ? rolling30CogsPct - 55 : null,
        wow_delta_pct:
          rolling30CogsPct != null && prevRolling30CogsPct != null
            ? rolling30CogsPct - prevRolling30CogsPct
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
        food_disp_pct: rolling30FoodDispPct,
        food_disp_target: "≤35% (30-day rolling)",
        food_disp_status:
          rolling30FoodDispPct != null
            ? rolling30FoodDispPct <= 35
              ? "on_track"
              : "over"
            : "—",
        food_disp_wow:
          rolling30FoodDispPct != null && prevRolling30FoodDispPct != null
            ? rolling30FoodDispPct - prevRolling30FoodDispPct
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
      daily = dailyRolling7Cogs(allRangeRows, weekDates);
      issues = storeResults.flatMap((s) =>
        s.issues.map((i) => ({ ...i, store: s.name }))
      );
    } else if (singleStore) {
      const w = singleStore.weekly;
      const t = getCockpitTargets(singleStore.slug as CockpitStoreSlug);
      const storeId = storeIdBySlug.get(singleStore.slug);
      const rolling = storeId != null ? rolling30ByStore.get(storeId) : null;
      const rCogs = rolling?.cogsPct ?? null;
      const rFoodDisp = rolling?.foodDispPct ?? null;
      const prevRCogs = rolling?.prevCogsPct ?? null;
      const prevRFoodDisp = rolling?.prevFoodDispPct ?? null;
      hero = {
        weekly_prime_pct: rCogs,
        target_label: `≤${t.primeMax}%`,
        prime_max: t.primeMax,
        status: rCogs != null && rCogs <= t.primeMax ? "on_track" : "over",
        variance_pct: rCogs != null ? rCogs - t.primeMax : null,
        wow_delta_pct: rCogs != null && prevRCogs != null ? rCogs - prevRCogs : null,
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
        food_disp_pct: rFoodDisp,
        food_disp_target: `≤${t.foodDisposablesMax}% (30-day rolling)`,
        food_disp_status:
          rFoodDisp != null
            ? rFoodDisp <= t.foodDisposablesMax
              ? "on_track"
              : "over"
            : "—",
        food_disp_wow:
          rFoodDisp != null && prevRFoodDisp != null ? rFoodDisp - prevRFoodDisp : null,
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
            const sid = storeIdBySlug.get(s.slug);
            const r = sid != null ? rolling30ByStore.get(sid) : null;
            const cogsPct = r?.cogsPct ?? w.weekly_prime_pct;
            const foodDispPct = r?.foodDispPct ?? w.weekly_food_disposables_pct;
            const primeStatus =
              cogsPct != null && cogsPct <= t.primeMax ? "on_track" : "over";
            const scheduledVariance =
              w.total_scheduled_hours !== 0 || w.total_labor_hours !== 0
                ? w.total_scheduled_hours - w.total_labor_hours
                : null;
            return {
              slug: s.slug,
              name: s.name,
              weekly_prime_pct: cogsPct,
              weekly_labor_pct: w.weekly_labor_pct,
              weekly_food_disposables_pct: foodDispPct,
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
