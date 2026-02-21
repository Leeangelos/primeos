"use client";

import { useState, useEffect } from "react";
import { COCKPIT_STORE_SLUGS, COCKPIT_TARGETS, type CockpitStoreSlug } from "@/lib/cockpit-config";
import { getStoreColor } from "@/lib/store-colors";
import { cn } from "@/lib/utils";

type DayRow = {
  day: string;
  thisWeek: number;
  lastWeek: number;
  lastWeekPct: number | null;
  lastYear: number;
  lastYearPct: number | null;
};

type ReportData = {
  weekOf: string;
  daily: DayRow[];
  totals: { thisWeek: number; lastWeek: number; lastWeekPct: number | null; lastYear: number; lastYearPct: number | null };
  periodToDate: { thisYear: number; lastYear: number; changePct: number | null };
  yearToDate: { thisYear: number; lastYear: number; changePct: number | null };
};

function fmt(n: number): string {
  return "$" + n.toLocaleString();
}

function PctBadge({ pct }: { pct: number | null }) {
  if (pct == null) return <span className="text-muted">—</span>;
  const color = pct > 0 ? "text-emerald-400" : pct < 0 ? "text-red-400" : "text-muted";
  return <span className={cn("text-xs font-semibold tabular-nums", color)}>{pct > 0 ? "+" : ""}{pct}% {pct > 0 ? "↑" : pct < 0 ? "↓" : ""}</span>;
}

export default function SalesPage() {
  const [store, setStore] = useState<CockpitStoreSlug | "all">("all");
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    fetch(`/api/sales-report?store=${store}`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        if (d.ok) setData(d);
        setLoading(false);
      })
      .catch(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [store]);

  const weekLabel = data?.weekOf
    ? new Date(data.weekOf + "T12:00:00Z").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "";

  return (
    <div className="space-y-5">
      <div className="dashboard-toolbar p-4 sm:p-5 space-y-3">
        <h1 className="text-lg font-semibold sm:text-2xl">Sales Report</h1>
        <p className="text-xs text-muted">Week of {weekLabel || "..."} — This Week vs Last Week vs Last Year</p>
        <div className="flex flex-wrap gap-1.5 justify-center">
          <button type="button" onClick={() => setStore("all")} className={cn("rounded-lg border px-3 py-2 text-sm font-medium transition-colors", store === "all" ? "border-brand/50 bg-brand/15 text-brand" : "border-border/30 bg-black/20 text-muted hover:text-white")}>All Stores</button>
          {COCKPIT_STORE_SLUGS.map((slug) => {
            const sc = getStoreColor(slug);
            return (
              <button key={slug} type="button" onClick={() => setStore(slug)} className={cn("rounded-lg border px-3 py-2 text-sm font-medium transition-colors", store === slug ? `${sc.borderActive} ${sc.bgActive} ${sc.text}` : "border-border/30 bg-black/20 text-muted hover:text-white")}>{COCKPIT_TARGETS[slug].name}</button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3 animate-pulse">
          {[1,2,3,4,5,6,7].map((i) => (
            <div key={i} className="rounded-lg border border-border/50 p-3 flex justify-between">
              <div className="h-4 w-12 bg-muted/20 rounded" />
              <div className="h-4 w-16 bg-muted/20 rounded" />
            </div>
          ))}
        </div>
      ) : data ? (
        <>
          <div className="dashboard-surface rounded-lg border border-border overflow-hidden">
            <div className="grid grid-cols-4 gap-0 text-[10px] font-semibold uppercase tracking-wider text-muted bg-black/40 px-4 py-2.5">
              <div></div>
              <div className="text-center">This Week</div>
              <div className="text-center">Last Week</div>
              <div className="text-center">Last Year</div>
            </div>
            {data.daily.map((row, idx) => (
              <div key={row.day} className={cn("grid grid-cols-4 gap-0 px-4 py-3 items-center", idx % 2 === 0 ? "bg-black/10" : "bg-black/20")}>
                <div className="text-sm font-medium text-white">{row.day}</div>
                <div className="text-center">
                  <div className="text-sm font-bold tabular-nums">{row.thisWeek > 0 ? fmt(row.thisWeek) : "—"}</div>
                </div>
                <div className="text-center">
                  <div className="text-sm tabular-nums text-muted">{row.lastWeek > 0 ? fmt(row.lastWeek) : "—"}</div>
                  {row.lastWeekPct != null && row.thisWeek > 0 && <div><PctBadge pct={row.lastWeekPct} /></div>}
                </div>
                <div className="text-center">
                  <div className="text-sm tabular-nums text-muted">{row.lastYear > 0 ? fmt(row.lastYear) : "—"}</div>
                  {row.lastYearPct != null && row.thisWeek > 0 && <div><PctBadge pct={row.lastYearPct} /></div>}
                </div>
              </div>
            ))}
            <div className="grid grid-cols-4 gap-0 px-4 py-3 items-center bg-brand/5 border-t border-brand/20">
              <div className="text-sm font-bold text-brand">Total</div>
              <div className="text-center"><div className="text-sm font-black tabular-nums text-brand">{fmt(data.totals.thisWeek)}</div></div>
              <div className="text-center"><div className="text-sm font-bold tabular-nums text-muted">{fmt(data.totals.lastWeek)}</div><PctBadge pct={data.totals.lastWeekPct} /></div>
              <div className="text-center"><div className="text-sm font-bold tabular-nums text-muted">{fmt(data.totals.lastYear)}</div><PctBadge pct={data.totals.lastYearPct} /></div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="dashboard-surface rounded-lg border border-border p-4">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-muted mb-3">Period To Date</div>
              <div className="grid grid-cols-2 gap-2">
                <div><div className="text-[9px] uppercase text-muted">This Year</div><div className="text-lg font-bold tabular-nums">{fmt(data.periodToDate.thisYear)}</div></div>
                <div><div className="text-[9px] uppercase text-muted">Last Year</div><div className="text-lg font-bold tabular-nums text-muted">{fmt(data.periodToDate.lastYear)}</div></div>
              </div>
              <div className="mt-2"><PctBadge pct={data.periodToDate.changePct} /></div>
            </div>
            <div className="dashboard-surface rounded-lg border border-border p-4">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-muted mb-3">Year To Date</div>
              <div className="grid grid-cols-2 gap-2">
                <div><div className="text-[9px] uppercase text-muted">This Year</div><div className="text-lg font-bold tabular-nums">{fmt(data.yearToDate.thisYear)}</div></div>
                <div><div className="text-[9px] uppercase text-muted">Last Year</div><div className="text-lg font-bold tabular-nums text-muted">{fmt(data.yearToDate.lastYear)}</div></div>
              </div>
              <div className="mt-2"><PctBadge pct={data.yearToDate.changePct} /></div>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-12 text-muted text-sm">No data available.</div>
      )}
    </div>
  );
}
