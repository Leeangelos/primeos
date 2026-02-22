"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
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
  const [showEducation, setShowEducation] = useState(false);

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
      <div className="dashboard-toolbar p-3 sm:p-5 space-y-3">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold sm:text-2xl">Sales Report</h1>
          <button type="button" onClick={() => setShowEducation(true)} className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-full bg-muted/20 text-muted hover:bg-brand/20 hover:text-brand transition-colors text-xs font-bold" aria-label="Learn more">i</button>
        </div>
        <p className="text-xs text-muted">Week of {weekLabel || "..."} — This Week vs Last Week vs Last Year</p>
        <div className="flex flex-wrap gap-1.5 justify-center">
          <button type="button" onClick={() => setStore("all")} className={cn("min-h-[44px] rounded-lg border px-3 py-2 text-sm font-medium transition-colors", store === "all" ? "border-brand/50 bg-brand/15 text-brand" : "border-border/30 bg-black/20 text-muted hover:text-white")}>All Stores</button>
          {COCKPIT_STORE_SLUGS.map((slug) => {
            const sc = getStoreColor(slug);
            return (
              <button key={slug} type="button" onClick={() => setStore(slug)} className={cn("min-h-[44px] rounded-lg border px-3 py-2 text-sm font-medium transition-colors", store === slug ? `${sc.borderActive} ${sc.bgActive} ${sc.text}` : "border-border/30 bg-black/20 text-muted hover:text-white")}>{COCKPIT_TARGETS[slug].name}</button>
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
              <div key={row.day} className={cn("grid grid-cols-4 gap-0 min-w-[320px] px-4 py-3 items-center", idx % 2 === 0 ? "bg-black/10" : "bg-black/20")}>
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
            <div className="grid grid-cols-4 gap-0 min-w-[320px] px-4 py-3 items-center bg-brand/5 border-t border-brand/20">
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

      {showEducation && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0 }} onClick={() => setShowEducation(false)}>
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          <div className="relative w-full max-w-md mx-auto rounded-2xl border border-border bg-[#0d0f13] p-4 sm:p-5 shadow-2xl overflow-y-auto max-h-[85vh] min-w-0" onClick={(e) => e.stopPropagation()}>
            <button type="button" onClick={() => setShowEducation(false)} className="absolute top-3 right-3 min-h-[44px] min-w-[44px] flex items-center justify-center text-muted hover:text-white text-lg -mr-2" aria-label="Close">✕</button>
            <h3 className="text-base font-semibold text-brand mb-1">🎓 This Week vs Last Week vs Last Year</h3>
            <p className="text-xs text-muted mb-4">How to read trends and seasonal patterns.</p>
            <div className="space-y-3 text-sm">
              <div>
                <h4 className="font-medium text-white mb-1">How to Read the Report</h4>
                <p className="text-muted text-xs leading-relaxed">Day by day you see this week's sales next to last week and last year. Green up arrows = you're ahead. Red down = you're behind. One slow day isn't a trend. A whole week down 10% vs last year is. Same for period-to-date and year-to-date. This is your "are we growing or shrinking?" view.</p>
              </div>
              <div>
                <h4 className="font-medium text-white mb-1">What Seasonal Patterns Mean</h4>
                <p className="text-muted text-xs leading-relaxed">Pizza does more in football season, holidays, and back-to-school. So compare apples to apples: this September to last September. If you're flat year-over-year in a growth month, something's wrong — marketing, operations, or competition. If you're up 5% in a slow month, you're gaining share. Use this report to see the pattern, not just the number.</p>
              </div>
              <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-3">
                <h4 className="font-medium text-red-400 text-xs mb-2">📕 When the Week Goes Red</h4>
                <p className="text-muted text-xs leading-relaxed">A bad week happens. Two bad weeks in a row = dig in. Check labor (did you overstaff?), food (waste or price creep?), and traffic (did something change — road work, a new competitor?). Don't wait for the month to close. Fix the trend now or you'll give back a month of profit in one bad quarter.</p>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
