"use client";

import { Suspense, useState, useEffect } from "react";
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
import { getWeekStart } from "@/lib/weekly-cockpit";
import { COCKPIT_STORE_SLUGS, COCKPIT_TARGETS, type CockpitStoreSlug } from "@/lib/cockpit-config";

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
  issues?: { type: string; message: string; date?: string; count?: number }[];
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

  return (
    <div className="space-y-6">
      <div className="dashboard-toolbar p-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Weekly Cockpit</h1>
          <p className="mt-1 text-sm text-muted">
            Week = Mon–Sun. Data from daily KPIs. Drill down to edit a day.
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
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted">Week of:</span>
            <div className="flex items-center gap-1 rounded border border-border bg-panel p-1">
              <button
                type="button"
                onClick={() => setWeekStart(prevMonday)}
                className="rounded px-2 py-1 text-sm hover:bg-white/10"
              >
                ←
              </button>
              <input
                type="date"
                value={weekStart}
                onChange={(e) => setWeekStart(getWeekStart(e.target.value))}
                className="dashboard-input w-36 border-0 bg-transparent px-2 py-1 text-sm focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setWeekStart(nextMonday)}
                className="rounded px-2 py-1 text-sm hover:bg-white/10"
              >
                →
              </button>
            </div>
          </div>
        </div>
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
            <section className="dashboard-surface rounded-lg border border-border bg-panel p-6">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">
                Weekly PRIME %
              </h2>
              <div className="mt-2 flex flex-wrap items-baseline gap-4">
                <span className="text-4xl font-bold tabular-nums">
                  {data.hero.weekly_prime_pct != null
                    ? `${data.hero.weekly_prime_pct.toFixed(1)}%`
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
                    {data.hero.variance_pct.toFixed(1)}%
                  </span>
                )}
                {data.hero.wow_delta_pct != null && (
                  <span className="text-sm">
                    WoW: {data.hero.wow_delta_pct >= 0 ? "+" : ""}
                    {data.hero.wow_delta_pct.toFixed(1)}%
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
                      formatter={(v: number | undefined) => [v != null ? `${v.toFixed(1)}%` : "—", "PRIME %"]}
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
                    {d.prime_pct != null ? `${d.prime_pct.toFixed(1)}%` : "—"}
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
                  <div className="text-[10px] uppercase text-muted">Labor %</div>
                  <div className="text-xl font-bold tabular-nums">
                    {data.secondary.labor_pct != null
                      ? `${data.secondary.labor_pct.toFixed(1)}%`
                      : "—"}
                  </div>
                  <div className="text-xs text-muted">
                    Target: {data.secondary.labor_target} •{" "}
                    {data.secondary.labor_status}
                    {data.secondary.labor_wow != null &&
                      ` • WoW ${data.secondary.labor_wow >= 0 ? "+" : ""}${data.secondary.labor_wow.toFixed(1)}%`}
                  </div>
                </div>
                <div className="rounded border border-border/50 bg-black/20 p-3">
                  <div className="text-[10px] uppercase text-muted">
                    Food + Disposables %
                  </div>
                  <div className="text-xl font-bold tabular-nums">
                    {data.secondary.food_disp_pct != null
                      ? `${data.secondary.food_disp_pct.toFixed(1)}%`
                      : "—"}
                  </div>
                  <div className="text-xs text-muted">
                    Target: {data.secondary.food_disp_target} •{" "}
                    {data.secondary.food_disp_status}
                    {data.secondary.food_disp_wow != null &&
                      ` • WoW ${data.secondary.food_disp_wow >= 0 ? "+" : ""}${data.secondary.food_disp_wow.toFixed(1)}%`}
                  </div>
                </div>
                <div className="rounded border border-border/50 bg-black/20 p-3">
                  <div className="text-[10px] uppercase text-muted">SLPH</div>
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

          {data.issues && data.issues.length > 0 && (
            <section className="dashboard-surface rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-amber-400/90 mb-2">
                Top issues this week
              </h2>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted">
                {data.issues.map((i, idx) => (
                  <li key={idx}>{i.message}</li>
                ))}
              </ul>
            </section>
          )}

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
                          <td className="py-2 pr-4 font-medium">{row.name}</td>
                          <td className="py-2 pr-4 tabular-nums">{row.weekly_prime_pct != null ? `${row.weekly_prime_pct.toFixed(1)}%` : "—"}</td>
                          <td className="py-2 pr-4 tabular-nums">{row.weekly_labor_pct != null ? `${row.weekly_labor_pct.toFixed(1)}%` : "—"}</td>
                          <td className="py-2 pr-4 tabular-nums">{row.weekly_food_disposables_pct != null ? `${row.weekly_food_disposables_pct.toFixed(1)}%` : "—"}</td>
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
                      className={`rounded-lg border p-4 ${isWorst ? "border-red-500/50 bg-red-500/10" : isBest ? "border-emerald-500/50 bg-emerald-500/10" : "border-border/50 bg-black/20"}`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-medium">{row.name}</span>
                        <span className={row.status === "on_track" ? "text-emerald-500 text-sm font-medium" : "text-red-500 text-sm font-medium"}>
                          {row.status === "on_track" ? "On track" : "Over"}
                          {isWorst && " (worst)"}
                          {isBest && " (best)"}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <div className="text-[10px] uppercase text-muted">PRIME %</div>
                          <div className="text-lg font-bold tabular-nums">{row.weekly_prime_pct != null ? `${row.weekly_prime_pct.toFixed(1)}%` : "—"}</div>
                        </div>
                        <div>
                          <div className="text-[10px] uppercase text-muted">Labor %</div>
                          <div className="text-lg font-bold tabular-nums">{row.weekly_labor_pct != null ? `${row.weekly_labor_pct.toFixed(1)}%` : "—"}</div>
                        </div>
                        <div>
                          <div className="text-[10px] uppercase text-muted">Food+Disp %</div>
                          <div className="text-lg font-bold tabular-nums">{row.weekly_food_disposables_pct != null ? `${row.weekly_food_disposables_pct.toFixed(1)}%` : "—"}</div>
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
    </div>
  );
}

const WeeklyPage = () => (
  <Suspense fallback={
  <div className="space-y-6">
    <div className="dashboard-toolbar p-5 animate-pulse">
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
