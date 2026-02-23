"use client";

import { Suspense, useMemo, useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { getWeekEnd, getWeekStart } from "@/lib/weekly-cockpit";
import { COCKPIT_STORE_SLUGS, COCKPIT_TARGETS, type CockpitStoreSlug } from "@/lib/cockpit-config";
import { getStoreColor } from "@/lib/store-colors";
import { COLORS, getGradeColor } from "@/src/lib/design-tokens";
import { useRedAlert } from "@/src/lib/useRedAlert";
import { EducationInfoIcon } from "@/src/components/education/InfoIcon";
import { ExportButton } from "@/src/components/ui/ExportButton";
import { ShareButton } from "@/src/components/ui/ShareButton";
import { formatPct } from "@/src/lib/formatters";
import { SEED_WEEKLY_COCKPIT } from "@/src/lib/seed-data";

/** Store slug for daily drill-down; daily page uses cockpit slugs (kent, aurora, lindseys). */
function toDailyStoreSlug(store: "all" | CockpitStoreSlug): CockpitStoreSlug {
  return store === "all" ? "kent" : store;
}

type ApiPayload = {
  ok: boolean;
  error?: string;
  week_start?: string;
  week_end?: string;
  week_label?: string;
  store?: string;
  hero?: {
    weekly_prime_pct: number | null;
    target_label: string;
    prime_max: number;
    status: "on_track" | "over";
    variance_pct: number | null;
    wow_delta_pct: number | null;
  } | null;
  daily?: { date: string; prime_pct: number | null }[];
  secondary?: {
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
  } | null;
  issues?: { type: string; message: string; date?: string; count?: number; store?: string }[];
  comparison?: {
    slug: string;
    name: string;
    weekly_prime_pct: number | null;
    weekly_labor_pct: number | null;
    weekly_food_disposables_pct: number | null;
    weekly_slph: number | null;
    status: string;
    weekly_aov: number | null;
    total_scheduled_hours: number;
    total_labor_hours: number;
    scheduled_variance: number | null;
    weekly_bump_time_minutes: number | null;
  }[];
};

const STORE_OPTIONS: { value: "all" | CockpitStoreSlug; label: string }[] = [
  { value: "all", label: "All stores" },
  ...COCKPIT_STORE_SLUGS.map((s) => ({ value: s, label: COCKPIT_TARGETS[s].name })),
];

function isValidCockpitStore(s: string | null): s is CockpitStoreSlug {
  return s === "kent" || s === "aurora" || s === "lindseys";
}

function WeeklyPageContent() {
  const searchParams = useSearchParams();
  const today = new Date().toISOString().slice(0, 10);
  const defaultMonday = getWeekStart(today);
  const [weekStart, setWeekStart] = useState(defaultMonday);
  const [store, setStore] = useState<"all" | CockpitStoreSlug>("all");
  const [data, setData] = useState<ApiPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEducation, setShowEducation] = useState<string | null>(null);

  /* eslint-disable react-hooks/set-state-in-effect -- sync URL params to state */
  useEffect(() => {
    const s = searchParams.get("store");
    const w = searchParams.get("week_start");
    if (s === "all" || isValidCockpitStore(s)) setStore(s === "all" ? "all" : s);
    if (w && /^\d{4}-\d{2}-\d{2}$/.test(w)) setWeekStart(getWeekStart(w));
  }, [searchParams]);
  /* eslint-enable react-hooks/set-state-in-effect */

  /* eslint-disable react-hooks/set-state-in-effect -- fetch when store/week change */
  useEffect(() => {
    setLoading(true);
    setError(null);
    const path = `/api/weekly-cockpit?store=${encodeURIComponent(store)}&week_start=${encodeURIComponent(weekStart)}`;
    const url = typeof window !== "undefined" ? `${window.location.origin}${path}` : path;
    fetch(url)
      .then((res) => res.json())
      .then((json: ApiPayload) => {
        if (!json.ok) {
          setError(json.error ?? "Failed to load");
          setData(null);
          return;
        }
        setData(json);
      })
      .catch(() => {
        setError("Network error");
        setData(null);
      })
      .finally(() => setLoading(false));
  }, [store, weekStart]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const prevMonday = (() => {
    const d = new Date(weekStart + "T12:00:00Z");
    d.setUTCDate(d.getUTCDate() - 7);
    return d.toISOString().slice(0, 10);
  })();
  const nextMonday = (() => {
    const d = new Date(weekStart + "T12:00:00Z");
    d.setUTCDate(d.getUTCDate() + 7);
    return d.toISOString().slice(0, 10);
  })();

  const storeForSeed = store === "all" ? "kent" : store;
  const { thisWeekSeed, lastWeekSeed, comparisonKpis } = useMemo(() => {
    const weeks = SEED_WEEKLY_COCKPIT.filter((r) => r.store_id === storeForSeed)
      .slice()
      .sort((a, b) => b.week_start.localeCompare(a.week_start));
    const thisW = weeks.find((w) => w.week_start === weekStart) ?? weeks[0] ?? null;
    const lastW = weeks.find((w) => w.week_start === prevMonday) ?? weeks[1] ?? null;
    if (!thisW || !lastW) {
      return { thisWeekSeed: null, lastWeekSeed: null, comparisonKpis: [] };
    }
    const targets = COCKPIT_TARGETS[store === "all" ? "kent" : store];
    const fmtPct = (n: number) => formatPct(n);
    const fmtDollars = (n: number) => `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
    const change = (curr: number, prev: number) => (prev === 0 ? 0 : Math.round(((curr - prev) / prev) * 1000) / 10);
    const gradeClass = (value: number, target: number, lowerIsBetter: boolean): string => {
      const hex = getGradeColor(value, target, lowerIsBetter ? "lower_is_better" : "higher_is_better");
      if (hex === COLORS.grade.green) return "text-emerald-400";
      if (hex === COLORS.grade.yellow) return "text-amber-400";
      if (hex === COLORS.grade.red) return "text-red-400";
      return "text-slate-300";
    };
    const changeColor = (pct: number, improvementWhenPositive: boolean) => {
      if (pct === 0) return "text-slate-400";
      const good = improvementWhenPositive ? pct > 0 : pct < 0;
      return good ? "text-emerald-400" : "text-red-400";
    };
    const arrow = (pct: number) => (pct > 0 ? "↑" : pct < 0 ? "↓" : "→");
    const avgTicketThis = thisW.transactions > 0 ? thisW.sales / thisW.transactions : 0;
    const avgTicketLast = lastW.transactions > 0 ? lastW.sales / lastW.transactions : 0;
    const kpis: { label: string; key: string; thisWeek: string; lastWeek: string; changePct: number; changeArrow: string; gradeColor: string; changeColor: string }[] = [
      {
        label: "Total Sales",
        key: "daily_sales",
        thisWeek: fmtDollars(thisW.sales),
        lastWeek: fmtDollars(lastW.sales),
        changePct: change(thisW.sales, lastW.sales),
        changeArrow: arrow(change(thisW.sales, lastW.sales)),
        gradeColor: "text-emerald-400",
        changeColor: changeColor(change(thisW.sales, lastW.sales), true),
      },
      {
        label: "Avg Daily Sales",
        key: "daily_sales",
        thisWeek: fmtDollars(thisW.sales / 7),
        lastWeek: fmtDollars(lastW.sales / 7),
        changePct: change(thisW.sales, lastW.sales),
        changeArrow: arrow(change(thisW.sales, lastW.sales)),
        gradeColor: "text-emerald-400",
        changeColor: changeColor(change(thisW.sales, lastW.sales), true),
      },
      {
        label: "Food Cost %",
        key: "food_cost",
        thisWeek: fmtPct(thisW.food_disp_pct),
        lastWeek: fmtPct(lastW.food_disp_pct),
        changePct: change(thisW.food_disp_pct, lastW.food_disp_pct),
        changeArrow: arrow(change(thisW.food_disp_pct, lastW.food_disp_pct)),
        gradeColor: gradeClass(thisW.food_disp_pct, 31, true),
        changeColor: changeColor(change(thisW.food_disp_pct, lastW.food_disp_pct), false),
      },
      {
        label: "Labor %",
        key: "labor_pct",
        thisWeek: fmtPct(thisW.labor_pct),
        lastWeek: fmtPct(lastW.labor_pct),
        changePct: change(thisW.labor_pct, lastW.labor_pct),
        changeArrow: arrow(change(thisW.labor_pct, lastW.labor_pct)),
        gradeColor: gradeClass(thisW.labor_pct, targets.laborMax, true),
        changeColor: changeColor(change(thisW.labor_pct, lastW.labor_pct), false),
      },
      {
        label: "PRIME %",
        key: "prime_cost",
        thisWeek: fmtPct(thisW.prime_pct),
        lastWeek: fmtPct(lastW.prime_pct),
        changePct: change(thisW.prime_pct, lastW.prime_pct),
        changeArrow: arrow(change(thisW.prime_pct, lastW.prime_pct)),
        gradeColor: gradeClass(thisW.prime_pct, targets.primeMax, true),
        changeColor: changeColor(change(thisW.prime_pct, lastW.prime_pct), false),
      },
      {
        label: "SLPH",
        key: "slph",
        thisWeek: thisW.slph.toFixed(0),
        lastWeek: lastW.slph.toFixed(0),
        changePct: change(thisW.slph, lastW.slph),
        changeArrow: arrow(change(thisW.slph, lastW.slph)),
        gradeColor: gradeClass(thisW.slph, targets.slphMin, false),
        changeColor: changeColor(change(thisW.slph, lastW.slph), true),
      },
      {
        label: "Avg Ticket",
        key: "ticket_avg",
        thisWeek: avgTicketThis > 0 ? `$${avgTicketThis.toFixed(2)}` : "—",
        lastWeek: avgTicketLast > 0 ? `$${avgTicketLast.toFixed(2)}` : "—",
        changePct: avgTicketLast > 0 ? change(avgTicketThis, avgTicketLast) : 0,
        changeArrow: avgTicketLast > 0 ? arrow(change(avgTicketThis, avgTicketLast)) : "→",
        gradeColor: "text-slate-300",
        changeColor: avgTicketLast > 0 ? changeColor(change(avgTicketThis, avgTicketLast), true) : "text-slate-400",
      },
      {
        label: "Transaction Count",
        key: "daily_sales",
        thisWeek: thisW.transactions.toLocaleString(),
        lastWeek: lastW.transactions.toLocaleString(),
        changePct: change(thisW.transactions, lastW.transactions),
        changeArrow: arrow(change(thisW.transactions, lastW.transactions)),
        gradeColor: "text-slate-300",
        changeColor: changeColor(change(thisW.transactions, lastW.transactions), true),
      },
    ];
    return { thisWeekSeed: thisW, lastWeekSeed: lastW, comparisonKpis: kpis };
  }, [weekStart, prevMonday, store, storeForSeed]);

  const weeklyGrades = useMemo((): string[] => {
    const foodKpi = comparisonKpis.find((k) => k.label === "Food Cost %");
    const laborKpi = comparisonKpis.find((k) => k.label === "Labor %");
    const primeKpi = comparisonKpis.find((k) => k.label === "PRIME %");
    const toGrade = (kpi: { gradeColor: string } | undefined) =>
      !kpi ? "green" : kpi.gradeColor.includes("red") ? "red" : kpi.gradeColor.includes("amber") ? "yellow" : "green";
    return [toGrade(foodKpi), toGrade(laborKpi), toGrade(primeKpi)];
  }, [comparisonKpis]);
  useRedAlert(weeklyGrades);

  const shareRef = useRef<HTMLDivElement>(null);

  return (
    <div className="space-y-6">
      <div className={`dashboard-toolbar p-3 sm:p-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between ${store !== "all" ? getStoreColor(store).glow : ""}`}>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-semibold">Weekly Cockpit</h1>
            <button type="button" onClick={() => setShowEducation("overview")} className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-full bg-muted/20 text-muted hover:bg-brand/20 hover:text-brand transition-colors text-xs font-bold" aria-label="Learn more">i</button>
            <ExportButton pageName="Weekly Cockpit" />
            <ShareButton targetRef={shareRef} title="Weekly Cockpit" fileName="primeos-weekly-cockpit" />
          </div>
          <p className="mt-1 text-sm text-muted">
            Tap any day to edit. Tap a store card to drill in.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted">Store:</label>
            <select
              value={store}
              onChange={(e) => setStore(e.target.value as "all" | CockpitStoreSlug)}
              className="dashboard-input rounded border border-border bg-panel px-3 py-2 text-sm focus:border-brand/60 focus:ring-1 focus:ring-brand/40 focus:outline-none"
            >
              {STORE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={() => setWeekStart(prevMonday)}
              className="rounded-lg border border-border/50 bg-black/30 min-h-[44px] min-w-[44px] flex items-center justify-center text-muted hover:bg-black/40 hover:text-white shrink-0"
              aria-label="Previous week"
            >
              ←
            </button>
            <div className="flex-1 text-center min-w-0">
              <div className="text-sm font-medium text-white">
                Week of {new Date(weekStart + "T12:00:00Z").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                –{new Date(getWeekEnd(weekStart) + "T12:00:00Z").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setWeekStart(nextMonday)}
              className="rounded-lg border border-border/50 bg-black/30 min-h-[44px] min-w-[44px] flex items-center justify-center text-muted hover:bg-black/40 hover:text-white shrink-0"
              aria-label="Next week"
            >
              →
            </button>
          </div>
        </div>
      </div>

      <div ref={shareRef}>
      {comparisonKpis.length > 0 && (
        <section className="min-w-0 overflow-x-hidden pb-4">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">This Week vs Last Week</h2>
          {comparisonKpis.map((kpi) => (
            <div key={kpi.label} className="bg-slate-800 rounded-xl p-4 border border-slate-700 mb-3 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-white">{kpi.label}</span>
                <EducationInfoIcon metricKey={kpi.key} />
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="text-xs text-slate-500">This Week</div>
                  <div className={`text-lg font-bold ${kpi.gradeColor}`}>{kpi.thisWeek}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Last Week</div>
                  <div className="text-lg font-bold text-slate-300">{kpi.lastWeek}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Change</div>
                  <div className={`text-lg font-bold ${kpi.changeColor}`}>
                    {kpi.changeArrow} {(kpi.changePct > 0 ? "+" : "") + formatPct(kpi.changePct)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </section>
      )}
      </div>

      {loading && (
        <div className="dashboard-surface rounded-lg border border-border bg-panel/50 p-8 text-center text-muted">
          Loading…
        </div>
      )}
      {error && (
        <div className="dashboard-surface rounded-lg border border-red-500/50 bg-red-500/10 p-4 text-red-400">
          {error}
        </div>
      )}

      {!loading && !error && data && (
        <>
          {data.week_label && (
            <p className="text-sm text-muted">{data.week_label}</p>
          )}

          {data.hero && (
            <section className="dashboard-surface rounded-lg border border-border bg-panel p-3 sm:p-6">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted flex items-center">
                Weekly PRIME %
                <button
                  type="button"
                  onClick={() => setShowEducation("prime")}
                  className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-full bg-muted/20 text-muted hover:bg-brand/20 hover:text-brand transition-colors text-xs font-bold ml-1.5"
                  aria-label="Learn more"
                >
                  i
                </button>
              </h2>
              <div className="mt-2 flex flex-wrap items-baseline gap-4">
                <span className="text-3xl sm:text-4xl font-bold tabular-nums">
                  {data.hero.weekly_prime_pct != null
                    ? formatPct(data.hero.weekly_prime_pct)
                    : "—"}
                </span>
                <span className="text-sm text-muted">
                  Target: {data.hero.target_label}
                </span>
                <span
                  className={
                    data.hero.status === "on_track"
                      ? "text-emerald-500 font-medium"
                      : "text-red-500 font-medium"
                  }
                >
                  {data.hero.status === "on_track" ? "ON TRACK" : "OVER"}
                </span>
                {data.hero.variance_pct != null && (
                  <span className="text-sm">
                    Variance vs target:{" "}
                    {data.hero.variance_pct >= 0 ? "+" : ""}
                    {formatPct(data.hero.variance_pct)}
                  </span>
                )}
                {data.hero.wow_delta_pct != null && (
                  <span className="text-sm">
                    WoW: {data.hero.wow_delta_pct >= 0 ? "+" : ""}
                    {formatPct(data.hero.wow_delta_pct)}
                  </span>
                )}
              </div>
            </section>
          )}

          {data.daily && data.daily.length > 0 && data.hero && (
            <section className="dashboard-surface rounded-lg border border-border bg-panel p-4">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted mb-4">
                Daily PRIME % (Mon–Sun)
              </h2>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={data.daily.map((d) => ({
                      date: d.date,
                      day: new Date(d.date + "T12:00:00Z").toLocaleDateString("en-US", {
                        weekday: "short",
                      }),
                      prime_pct: d.prime_pct,
                    }))}
                    margin={{ top: 8, right: 8, left: 8, bottom: 8 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis
                      dataKey="day"
                      tick={{ fontSize: 11 }}
                      stroke="rgba(148,163,184,0.8)"
                    />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      stroke="rgba(148,163,184,0.8)"
                      tickFormatter={(v) => `${v}%`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1a1d23",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "8px",
                        padding: "8px 12px",
                        color: "#fff",
                        fontSize: "13px",
                      }}
                      labelStyle={{ color: "#9ca3af", fontSize: "11px", marginBottom: "4px" }}
                      itemStyle={{ color: "#fff", padding: "2px 0" }}
                      formatter={(v: number | undefined) => [v != null ? formatPct(v) : "—", "PRIME %"]}
                      labelFormatter={(_, payload) =>
                        payload?.[0]?.payload?.date ?? ""
                      }
                    />
                    <ReferenceLine
                      y={data.hero?.prime_max ?? 55}
                      stroke="rgba(249,115,22,0.6)"
                      strokeDasharray="4 4"
                      label={{ value: "Target", position: "right", fontSize: 10 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="prime_pct"
                      name="PRIME %"
                      stroke="rgb(248,250,252)"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      connectNulls={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {data.daily.map((d) => (
                  <Link
                    key={d.date}
                    href={`/daily?store=${encodeURIComponent(toDailyStoreSlug(store))}&date=${encodeURIComponent(d.date)}`}
                    className="rounded border border-border/50 bg-black/20 px-2 py-1 text-xs hover:bg-white/10"
                  >
                    {new Date(d.date + "T12:00:00Z").toLocaleDateString("en-US", {
                      weekday: "short",
                    })}{" "}
                    {d.prime_pct != null ? formatPct(d.prime_pct) : "—"}
                  </Link>
                ))}
              </div>
            </section>
          )}

          {data.secondary && (
            <section className="dashboard-surface rounded-lg border border-border bg-panel p-4">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted mb-3">
                {data.store === "all"
                  ? "Secondary KPIs (weighted aggregate)"
                  : "Secondary KPIs"}
              </h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded border border-border/50 bg-black/20 p-3">
                  <div className="text-[10px] uppercase text-muted flex items-center">
                    Labor %
                    <button
                      type="button"
                      onClick={() => setShowEducation("labor")}
                      className="inline-flex items-center justify-center h-4 w-4 rounded-full bg-muted/20 text-muted hover:bg-brand/20 hover:text-brand transition-colors text-[9px] font-bold ml-1.5"
                      aria-label="Learn more"
                    >
                      i
                    </button>
                  </div>
                  <div className="text-xl font-bold tabular-nums">
                    {data.secondary.labor_pct != null
                      ? formatPct(data.secondary.labor_pct)
                      : "—"}
                  </div>
                  <div className="text-xs text-muted">
                    Target: {data.secondary.labor_target} •{" "}
                    {data.secondary.labor_status}
                    {data.secondary.labor_wow != null &&
                      ` • WoW ${data.secondary.labor_wow >= 0 ? "+" : ""}${formatPct(data.secondary.labor_wow)}`}
                  </div>
                </div>
                <div className="rounded border border-border/50 bg-black/20 p-3">
                  <div className="text-[10px] uppercase text-muted flex items-center">
                    Food + Disposables %
                    <button
                      type="button"
                      onClick={() => setShowEducation("food")}
                      className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-full bg-muted/20 text-muted hover:bg-brand/20 hover:text-brand transition-colors text-xs font-bold ml-1.5"
                      aria-label="Learn more"
                    >
                      i
                    </button>
                  </div>
                  <div className="text-xl font-bold tabular-nums">
                    {data.secondary.food_disp_pct != null
                      ? formatPct(data.secondary.food_disp_pct)
                      : "—"}
                  </div>
                  <div className="text-xs text-muted">
                    Target: {data.secondary.food_disp_target} •{" "}
                    {data.secondary.food_disp_status}
                    {data.secondary.food_disp_wow != null &&
                      ` • WoW ${data.secondary.food_disp_wow >= 0 ? "+" : ""}${formatPct(data.secondary.food_disp_wow)}`}
                  </div>
                </div>
                <div className="rounded border border-border/50 bg-black/20 p-3">
                  <div className="text-[10px] uppercase text-muted flex items-center">
                    SLPH
                    <button
                      type="button"
                      onClick={() => setShowEducation("slph")}
                      className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-full bg-muted/20 text-muted hover:bg-brand/20 hover:text-brand transition-colors text-xs font-bold ml-1.5"
                      aria-label="Learn more"
                    >
                      i
                    </button>
                  </div>
                  <div className="text-xl font-bold tabular-nums">
                    {data.secondary.slph != null
                      ? data.secondary.slph.toFixed(0)
                      : "—"}
                  </div>
                  <div className="text-xs text-muted">
                    Target: {data.secondary.slph_target} •{" "}
                    {data.secondary.slph_status}
                    {data.secondary.slph_wow != null &&
                      ` • WoW ${data.secondary.slph_wow >= 0 ? "+" : ""}${data.secondary.slph_wow.toFixed(0)}`}
                  </div>
                </div>
                <div className="rounded border border-border/50 bg-black/20 p-3">
                  <div className="text-[10px] uppercase text-muted">AOV ($)</div>
                  <div className="text-xl font-bold tabular-nums">
                    {data.secondary.aov != null
                      ? `$${data.secondary.aov.toFixed(2)}`
                      : "—"}
                  </div>
                  <div className="text-xs text-muted">Average order value (net sales ÷ customers)</div>
                </div>
                <div className="rounded border border-border/50 bg-black/20 p-3">
                  <div className="text-[10px] uppercase text-muted">Scheduled Hours</div>
                  <div className="text-xl font-bold tabular-nums">
                    {data.secondary.total_scheduled_hours.toFixed(1)} hrs
                  </div>
                  <div className="text-xs text-muted">
                    Actual: {data.secondary.total_labor_hours.toFixed(1)} hrs
                    {data.secondary.scheduled_variance != null &&
                      ` • Variance: ${data.secondary.scheduled_variance >= 0 ? "+" : ""}${data.secondary.scheduled_variance.toFixed(1)} hrs`}
                  </div>
                </div>
                <div className="rounded border border-border/50 bg-black/20 p-3">
                  <div className="text-[10px] uppercase text-muted">Avg Bump Time (min)</div>
                  <div className="text-xl font-bold tabular-nums">
                    {data.secondary.weekly_bump_time_minutes != null
                      ? data.secondary.weekly_bump_time_minutes.toFixed(1)
                      : "—"}
                  </div>
                  <div className="text-xs text-muted">Weighted by customers (or simple avg)</div>
                </div>
              </div>
            </section>
          )}

          {data.issues && data.issues.length > 0 && (() => {
            const DAYS_IN_WEEK = 7;
            function shortDay(dateStr: string): string {
              const d = new Date(dateStr + "T12:00:00Z");
              const day = d.toLocaleDateString("en-US", { weekday: "short" });
              const m = d.getUTCMonth() + 1;
              const dayNum = d.getUTCDate();
              return `${day} ${m}/${dayNum}`;
            }
            function issueBullet(i: { type: string; message: string; date?: string; count?: number }): string {
              if (i.type === "worst_prime_day" && i.date) {
                const varianceMatch = i.message.match(/\(\+[\d.]+% vs target\)/);
                const variance = varianceMatch ? varianceMatch[0] : "";
                return `Worst: ${shortDay(i.date)} ${variance}`.trim();
              }
              const count = i.count ?? 0;
              if (i.type === "prime_over") return `PRIME over target ${count} of ${DAYS_IN_WEEK} days`;
              if (i.type === "labor_outside") return `Labor outside target ${count} of ${DAYS_IN_WEEK} days`;
              if (i.type === "slph_below") return `SLPH below target ${count} of ${DAYS_IN_WEEK} days`;
              return i.message;
            }
            const byStore = new Map<string, typeof data.issues>();
            for (const i of data.issues!) {
              const key = i.store ?? (store !== "all" ? COCKPIT_TARGETS[store].name : "All");
              if (!byStore.has(key)) byStore.set(key, []);
              byStore.get(key)!.push(i);
            }
            return (
              <section className="dashboard-surface rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-amber-400/90 mb-3">
                  Top issues this week
                </h2>
                <div className="space-y-4">
                  {Array.from(byStore.entries()).map(([storeName, issues]) => (
                    <div key={storeName}>
                      <h3 className="text-xs font-medium text-amber-400/80 mb-1.5">{storeName}</h3>
                      <ul className="list-disc list-inside space-y-1 text-sm text-muted">
                        {issues.slice(0, 3).map((i, idx) => (
                          <li key={idx} className="truncate" title={issueBullet(i)}>{issueBullet(i)}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </section>
            );
          })()}

          {data.comparison && data.comparison.length > 0 && (
            <section className="dashboard-surface rounded-lg border border-border bg-panel p-4">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted mb-3">
                Per-store breakdown (worst PRIME first)
              </h2>
              {/* Desktop: table */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-muted">
                      <th className="pb-2 pr-4">Store</th>
                      <th className="pb-2 pr-4">PRIME %</th>
                      <th className="pb-2 pr-4">Labor %</th>
                      <th className="pb-2 pr-4">Food+Disp %</th>
                      <th className="pb-2 pr-4">SLPH</th>
                      <th className="pb-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.comparison.map((row, idx) => {
                      const isBest = idx === data.comparison!.length - 1 && data.comparison!.length > 1;
                      const isWorst = idx === 0 && data.comparison!.length > 1;
                      return (
                        <tr key={row.slug} className={isWorst ? "bg-red-500/10" : isBest ? "bg-emerald-500/10" : ""}>
                          <td className="py-2 pr-4">
                            <div className="flex items-center gap-2">
                              <div className={`h-2.5 w-2.5 shrink-0 rounded-full ${getStoreColor(row.slug).dot}`} />
                              <span className="font-medium">{row.name}</span>
                            </div>
                          </td>
                          <td className="py-2 pr-4 tabular-nums">{row.weekly_prime_pct != null ? formatPct(row.weekly_prime_pct) : "—"}</td>
                          <td className="py-2 pr-4 tabular-nums">{row.weekly_labor_pct != null ? formatPct(row.weekly_labor_pct) : "—"}</td>
                          <td className="py-2 pr-4 tabular-nums">{row.weekly_food_disposables_pct != null ? formatPct(row.weekly_food_disposables_pct) : "—"}</td>
                          <td className="py-2 pr-4 tabular-nums">{row.weekly_slph != null ? row.weekly_slph.toFixed(0) : "—"}</td>
                          <td className="py-2">
                            <span className={row.status === "on_track" ? "text-emerald-500" : "text-red-500"}>
                              {row.status === "on_track" ? "On track" : "Over"}
                            </span>
                            {isWorst && <span className="ml-1 text-xs text-red-500">(worst)</span>}
                            {isBest && <span className="ml-1 text-xs text-emerald-500">(best)</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {/* Mobile: stacked cards */}
              <div className="sm:hidden space-y-3">
                {data.comparison.map((row, idx) => {
                  const isBest = idx === data.comparison!.length - 1 && data.comparison!.length > 1;
                  const isWorst = idx === 0 && data.comparison!.length > 1;
                  return (
                    <div
                      key={row.slug}
                      className={`rounded-lg border p-4 ${getStoreColor(row.slug).border} ${getStoreColor(row.slug).bg} ${isWorst ? "ring-1 ring-red-500/30" : ""} ${isBest ? "ring-1 ring-emerald-500/30" : ""}`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className={`h-2.5 w-2.5 shrink-0 rounded-full ${getStoreColor(row.slug).dot}`} />
                          <span className="font-medium">{row.name}</span>
                        </div>
                        <span className={row.status === "on_track" ? "text-emerald-500 text-sm font-medium" : "text-red-500 text-sm font-medium"}>
                          {row.status === "on_track" ? "On track" : "Over"}
                          {isWorst && " (worst)"}
                          {isBest && " (best)"}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <div className="text-[10px] uppercase text-muted">PRIME %</div>
                          <div className="text-lg font-bold tabular-nums">{row.weekly_prime_pct != null ? formatPct(row.weekly_prime_pct) : "—"}</div>
                        </div>
                        <div>
                          <div className="text-[10px] uppercase text-muted">Labor %</div>
                          <div className="text-lg font-bold tabular-nums">{row.weekly_labor_pct != null ? formatPct(row.weekly_labor_pct) : "—"}</div>
                        </div>
                        <div>
                          <div className="text-[10px] uppercase text-muted">Food+Disp %</div>
                          <div className="text-lg font-bold tabular-nums">{row.weekly_food_disposables_pct != null ? formatPct(row.weekly_food_disposables_pct) : "—"}</div>
                        </div>
                        <div>
                          <div className="text-[10px] uppercase text-muted">SLPH</div>
                          <div className="text-lg font-bold tabular-nums">{row.weekly_slph != null ? row.weekly_slph.toFixed(0) : "—"}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </>
      )}

      {!loading && !error && data?.ok && !data.hero && (
        <div className="dashboard-surface rounded-lg border border-border bg-panel/50 p-6 text-center text-muted">
          No data for this week. Enter daily KPIs to see rollups.
        </div>
      )}

      <Link href="/" className="inline-block text-sm text-brand hover:underline">
        ← Back to home
      </Link>

      {showEducation && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0 }} onClick={() => setShowEducation(null)}>
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          <div className="relative w-full max-w-md mx-auto rounded-2xl border border-border bg-[#0d0f13] p-4 sm:p-5 shadow-2xl overflow-y-auto max-h-[85vh] min-w-0" onClick={(e) => e.stopPropagation()}>
            <button type="button" onClick={() => setShowEducation(null)} className="absolute top-3 right-3 min-h-[44px] min-w-[44px] flex items-center justify-center text-muted hover:text-white text-lg -mr-2" aria-label="Close">✕</button>

            {showEducation === "overview" && (
              <div>
                <h3 className="text-base font-semibold text-brand mb-1">🎓 Weekly Trends & the Cockpit</h3>
                <p className="text-xs text-muted mb-4">Why weekly matters more than daily. How to read it. What PRIME grading means.</p>
                <div className="space-y-3 text-sm">
                  <div>
                    <h4 className="font-medium text-white mb-1">Weekly Trends Matter More Than Daily Spikes</h4>
                <p className="text-muted text-xs leading-relaxed">One bad Tuesday doesn't mean the model is broken. One great Friday doesn't mean you're winning. The weekly cockpit rolls up the whole week so you see the real trend. If PRIME is red for the week, you're leaving $500–$2K on the table. Consider addressing it before the month closes.</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-white mb-1">How to Read the Cockpit</h4>
                <p className="text-muted text-xs leading-relaxed">Top number is Weekly PRIME %. Below that you see labor %, food+disposables %, and SLPH by store. Green = on target. Red = over. Tap any metric's (i) for the full playbook. Use the store filter to see one location or all. Tap a day to open daily entry and review the numbers that drove the week red.</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-white mb-1">What PRIME Grading Means</h4>
                    <p className="text-muted text-xs leading-relaxed">PRIME is graded against your target (e.g. 55% for LeeAngelo's). At or below = you're good. Above = you're giving back profit. Every point over target on a $50K week is about $500 left on the table. The cockpit shows you the week's grade so you know whether to celebrate or act.</p>
                  </div>
                </div>
              </div>
            )}
            {showEducation === "prime" && (
              <div>
                <h3 className="text-base font-semibold text-brand mb-1">🎓 PRIME %</h3>
                <p className="text-xs text-muted mb-4">The number that matters most.</p>
                <div className="space-y-3 text-sm">
                  <div><h4 className="font-medium text-white mb-1">How It's Calculated</h4><p className="text-muted text-xs leading-relaxed">PRIME % = (Labor + Food + Disposables) ÷ Net Sales × 100. These are your controllable costs — the number you can actually move.</p></div>
                  <div><h4 className="font-medium text-white mb-1">Why It Matters</h4><p className="text-muted text-xs leading-relaxed">If PRIME is 60% and fixed costs are 30%, profit = 10%. Drop PRIME to 55% and profit doubles to 15%. On $5K/day, every point = $50/day = $1,500/month.</p></div>
                </div>
              </div>
            )}
            {showEducation === "labor" && (
              <div>
                <h3 className="text-base font-semibold text-brand mb-1">🎓 Labor %</h3>
                <p className="text-xs text-muted mb-4">Your biggest controllable expense.</p>
                <div className="space-y-3 text-sm">
                  <div><h4 className="font-medium text-white mb-1">How It's Calculated</h4><p className="text-muted text-xs leading-relaxed">Labor % = Total Labor Dollars ÷ Net Sales × 100. Target: 19-21%. On $5K/day, every point over = $50/day = $1,500/month.</p></div>
                </div>
              </div>
            )}
            {showEducation === "food" && (
              <div>
                <h3 className="text-base font-semibold text-brand mb-1">🎓 Food + Disposables %</h3>
                <p className="text-xs text-muted mb-4">Where money disappears without anyone noticing.</p>
                <div className="space-y-3 text-sm">
                  <div><h4 className="font-medium text-white mb-1">How It's Calculated</h4><p className="text-muted text-xs leading-relaxed">Food+Disp % = (Food Purchases + Disposables) ÷ Net Sales × 100. Target: ≤35%. Uses 7-day rolling average to smooth delivery-day spikes.</p></div>
                </div>
              </div>
            )}
            {showEducation === "slph" && (
              <div>
                <h3 className="text-base font-semibold text-brand mb-1">🎓 SLPH</h3>
                <p className="text-xs text-muted mb-4">Sales per Labor Hour — are you optimally staffed?</p>
                <div className="space-y-3 text-sm">
                  <div><h4 className="font-medium text-white mb-1">How It's Calculated</h4><p className="text-muted text-xs leading-relaxed">SLPH = Net Sales ÷ Total Labor Hours. Target: $80+. Below 65 means too many people for the volume.</p></div>
                </div>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

const WeeklyPage = () => (
  <Suspense fallback={
  <div className="space-y-6">
    <div className="dashboard-toolbar p-3 sm:p-5 animate-pulse">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-7 w-48 bg-muted/20 rounded mb-2" />
          <div className="h-4 w-64 bg-muted/20 rounded" />
        </div>
        <div className="flex gap-3">
          <div className="h-10 w-24 bg-muted/20 rounded-lg" />
          <div className="h-10 w-36 bg-muted/20 rounded-lg" />
        </div>
      </div>
    </div>
    <div className="dashboard-surface rounded-lg border border-border p-6 animate-pulse">
      <div className="h-3 w-24 bg-muted/20 rounded mb-3" />
      <div className="h-10 w-28 bg-muted/20 rounded" />
    </div>
    <div className="dashboard-surface rounded-lg border border-border p-4 animate-pulse">
      <div className="h-3 w-32 bg-muted/20 rounded mb-4" />
      <div className="h-64 w-full bg-muted/20 rounded" />
    </div>
  </div>
}>
    <WeeklyPageContent />
  </Suspense>
);

export default WeeklyPage;
