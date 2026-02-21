"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { COCKPIT_STORE_SLUGS, COCKPIT_TARGETS, type CockpitStoreSlug } from "@/lib/cockpit-config";
import { getStoreColor } from "@/lib/store-colors";
import { cn } from "@/lib/utils";

type DayLabor = {
  date: string;
  day: string;
  shifts: number;
  hours: number;
  laborCost: number;
  projectedSales: number;
  laborPct: number;
  slph: number;
  employees: { name: string; role: string; start: string; end: string; hours: number; cost: number }[];
};

type LaborData = {
  weekOf: string;
  totalHours: number;
  totalLaborCost: number;
  totalProjectedSales: number;
  laborPct: number;
  slph: number;
  targetLaborPct: number;
  targetLaborCost: number;
  overUnder: number;
  daily: DayLabor[];
};

const ROLES: Record<string, string> = { manager: "MGR", shift_lead: "SL", cook: "COOK", cashier: "CASH", driver: "DRV", team: "TEAM" };

export default function SchedulePage() {
  const [store, setStore] = useState<CockpitStoreSlug>("kent");
  const [labor, setLabor] = useState<LaborData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedDay, setExpandedDay] = useState<string | null>(null);
  const [showEducation, setShowEducation] = useState(false);

  const [weekOffset, setWeekOffset] = useState(0);
  
  const now = new Date();
  const dayOfWeek = now.getDay();
  const thisMonday = new Date(now);
  thisMonday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1) + weekOffset * 7);
  const weekOf = thisMonday.toISOString().slice(0, 10);

  const loadData = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/schedules/labor?store=${store}&week=${weekOf}`).then((r) => r.json());
    if (res.ok && res.labor) setLabor(res.labor);
    setLoading(false);
  }, [store, weekOf, weekOffset]);

  useEffect(() => { loadData(); }, [loadData]);

  const l = labor;

  return (
    <div className="space-y-5">
      <div className="dashboard-toolbar p-4 sm:p-5 space-y-3">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold sm:text-2xl">Smart Schedule</h1>
          <button type="button" onClick={() => setShowEducation(true)} className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-muted/20 text-muted hover:bg-brand/20 hover:text-brand transition-colors text-[10px] font-bold">i</button>
        </div>
        <p className="text-xs text-muted">See the financial impact of every schedule before the week starts.</p>

        <div className="flex flex-wrap gap-1.5 justify-center">
          {COCKPIT_STORE_SLUGS.map((slug) => {
            const sc = getStoreColor(slug);
            return (
              <button key={slug} type="button" onClick={() => setStore(slug)} className={cn("rounded-lg border px-3 py-2 text-sm font-medium transition-colors", store === slug ? `${sc.borderActive} ${sc.bgActive} ${sc.text}` : "border-border/30 bg-black/20 text-muted hover:text-white")}>{COCKPIT_TARGETS[slug].name}</button>
            );
          })}
        </div>

        <div className="flex items-center justify-center gap-3">
          <button type="button" onClick={() => setWeekOffset((p: number) => p - 1)} className="rounded-lg border border-border/30 bg-black/20 px-2.5 py-1 text-sm text-muted hover:text-white">←</button>
          <span className="text-xs text-muted">
            Week of {new Date(weekOf + "T12:00:00Z").toLocaleDateString("en-US", { month: "short", day: "numeric" })} – {new Date(new Date(weekOf).getTime() + 6 * 86400000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </span>
          <button type="button" onClick={() => setWeekOffset((p: number) => p + 1)} className="rounded-lg border border-border/30 bg-black/20 px-2.5 py-1 text-sm text-muted hover:text-white">→</button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-lg border border-border/50 p-5"><div className="h-6 w-32 bg-muted/20 rounded mb-2" /><div className="h-4 w-48 bg-muted/20 rounded" /></div>
          ))}
        </div>
      ) : l ? (
        <>
          {/* Hero: Projected Labor % */}
          <div className={cn("rounded-lg border p-5 text-center", l.laborPct <= 21 ? "border-emerald-500/50 bg-emerald-500/10" : l.laborPct <= 24 ? "border-amber-500/50 bg-amber-500/10" : "border-red-500/50 bg-red-500/10")}>
            <div className="text-[10px] font-medium uppercase tracking-widest text-muted/70">Projected Weekly Labor %</div>
            <div className={cn("mt-3 text-5xl font-black tabular-nums", l.laborPct <= 21 ? "text-emerald-400" : l.laborPct <= 24 ? "text-amber-400" : "text-red-400")}>
              {l.laborPct}%
            </div>
            <div className="text-xs text-muted mt-2">
              Target: ≤{l.targetLaborPct}% — {l.overUnder > 0 ? (
                <span className="text-red-400 font-bold">${l.overUnder} OVER target</span>
              ) : l.overUnder < 0 ? (
                <span className="text-emerald-400 font-bold">${Math.abs(l.overUnder)} under target</span>
              ) : (
                <span className="text-emerald-400 font-bold">Right on target</span>
              )}
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="dashboard-surface rounded-lg border border-border p-4 text-center">
              <div className="text-[9px] uppercase text-muted">Total Hours</div>
              <div className="text-2xl font-bold tabular-nums">{l.totalHours}</div>
            </div>
            <div className="dashboard-surface rounded-lg border border-border p-4 text-center">
              <div className="text-[9px] uppercase text-muted">Labor Cost</div>
              <div className="text-2xl font-bold tabular-nums">${l.totalLaborCost.toLocaleString()}</div>
            </div>
            <div className="dashboard-surface rounded-lg border border-border p-4 text-center">
              <div className="text-[9px] uppercase text-muted">Proj. Sales</div>
              <div className="text-2xl font-bold tabular-nums">${l.totalProjectedSales.toLocaleString()}</div>
            </div>
            <div className="dashboard-surface rounded-lg border border-border p-4 text-center">
              <div className="text-[9px] uppercase text-muted">SLPH</div>
              <div className={cn("text-2xl font-bold tabular-nums", l.slph >= 80 ? "text-emerald-400" : l.slph >= 65 ? "text-amber-400" : "text-red-400")}>${l.slph}</div>
            </div>
          </div>

          {/* Daily Breakdown */}
          <div className="space-y-2">
            {l.daily.map((day) => {
              const isExpanded = expandedDay === day.date;
              const hasData = day.shifts > 0;

              return (
                <div key={day.date}>
                  <button
                    type="button"
                    onClick={() => setExpandedDay(isExpanded ? null : day.date)}
                    className={cn("w-full text-left rounded-lg border p-3 transition-colors", hasData ? "border-border/50 bg-black/20 hover:border-brand/30" : "border-border/20 bg-black/5")}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-white w-10">{day.day}</span>
                        <span className="text-[10px] text-muted">{new Date(day.date + "T12:00:00Z").toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                      </div>
                      {hasData ? (
                        <div className="flex items-center gap-4 text-xs tabular-nums">
                          <span className="text-muted">{day.shifts} staff</span>
                          <span className="text-muted">{day.hours}hrs</span>
                          <span className="text-white font-bold">${day.laborCost}</span>
                          <span className={cn("font-bold", day.laborPct <= 21 ? "text-emerald-400" : day.laborPct <= 24 ? "text-amber-400" : "text-red-400")}>{day.laborPct}%</span>
                          <span className="text-muted">{isExpanded ? "▲" : "▼"}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted/50">No shifts</span>
                      )}
                    </div>
                    {hasData && day.projectedSales > 0 && (
                      <div className="mt-1 flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full bg-black/40 overflow-hidden">
                          <div
                            className={cn("h-full rounded-full", day.laborPct <= 21 ? "bg-emerald-500" : day.laborPct <= 24 ? "bg-amber-500" : "bg-red-500")}
                            style={{ width: `${Math.min(day.laborPct / 30 * 100, 100)}%` }}
                          />
                        </div>
                        <span className="text-[9px] text-muted">proj ${day.projectedSales}</span>
                      </div>
                    )}
                  </button>

                  {isExpanded && day.employees.length > 0 && (
                    <div className="mt-1 ml-4 space-y-1">
                      {day.employees.map((emp, idx) => (
                        <div key={idx} className="flex items-center justify-between rounded-lg border border-border/20 bg-black/10 px-3 py-2 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] uppercase bg-muted/10 px-1.5 py-0.5 rounded text-muted">{ROLES[emp.role] || emp.role}</span>
                            <span className="text-white font-medium">{emp.name}</span>
                          </div>
                          <div className="flex items-center gap-3 tabular-nums text-muted">
                            <span>{emp.start}–{emp.end}</span>
                            <span>{emp.hours}hrs</span>
                            <span className="text-white">${emp.cost}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <div className="text-center py-12 text-muted text-sm">No schedule data for this week.</div>
      )}

      {/* Education Modal */}
      {showEducation && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0 }} onClick={() => setShowEducation(false)}>
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          <div className="relative w-full max-w-md mx-auto rounded-2xl border border-border bg-[#0d0f13] p-5 shadow-2xl overflow-y-auto" style={{ maxHeight: "85vh" }} onClick={(e) => e.stopPropagation()}>
            <button type="button" onClick={() => setShowEducation(false)} className="absolute top-3 right-3 text-muted hover:text-white text-lg leading-none">✕</button>
            <h3 className="text-base font-semibold text-brand mb-1">🎓 Smart Scheduling</h3>
            <p className="text-xs text-muted mb-4">Every shift is a financial decision.</p>
            <div className="space-y-3 text-sm">
              <div>
                <h4 className="font-medium text-white mb-1">Scheduling Is a Financial Decision</h4>
                <p className="text-muted text-xs leading-relaxed">Every shift you add costs money. Every shift you cut risks service. The goal isn't minimum staffing — it's optimal staffing. PrimeOS shows the financial impact of every scheduling decision BEFORE the day happens, not after.</p>
              </div>
              <div>
                <h4 className="font-medium text-white mb-1">Projected Labor %</h4>
                <p className="text-muted text-xs leading-relaxed">Uses your scheduled hours × pay rates vs projected sales (based on same-day-of-week averages). Target: ≤21%. If Wednesday projects at 24%, you know BEFORE Wednesday to cut a shift or expect higher volume.</p>
              </div>
              <div>
                <h4 className="font-medium text-white mb-1">SLPH (Sales per Labor Hour)</h4>
                <p className="text-muted text-xs leading-relaxed">Projected Sales ÷ Scheduled Hours. Target: $80+. Below $65 means too many people for the volume. Above $100 means you might be understaffed — watch service quality.</p>
              </div>
              <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-3">
                <h4 className="font-medium text-red-400 text-xs mb-2">📕 When Projected Labor Goes RED (&gt; 24%)</h4>
                <ol className="space-y-1.5 text-muted text-xs list-decimal list-inside leading-relaxed">
                  <li>Check shift overlaps — closer/driver overlap is most common ($15-20/day wasted).</li>
                  <li>Do you need both a mid-shift AND a closer? One person doing 10-close might be cheaper.</li>
                  <li>Compare to last week's same day. Did you need this many people?</li>
                  <li>Check for upcoming parties or events that justify extra staff.</li>
                  <li>Build SLPH targets by day-of-week. Mon/Tue need different staffing than Fri/Sat.</li>
                </ol>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
