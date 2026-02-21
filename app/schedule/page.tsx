"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { COCKPIT_STORE_SLUGS, COCKPIT_TARGETS, type CockpitStoreSlug } from "@/lib/cockpit-config";
import { getStoreColor } from "@/lib/store-colors";
import { cn } from "@/lib/utils";

type ShiftEmployee = { id: string; name: string; role: string; start: string; end: string; hours: number; cost: number };

type DayLabor = {
  date: string;
  day: string;
  shifts: number;
  hours: number;
  laborCost: number;
  projectedSales: number;
  laborPct: number;
  slph: number;
  employees: ShiftEmployee[];
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
const ROLE_OPTIONS = ["manager", "shift_lead", "cook", "cashier", "driver", "team"] as const;

export default function SchedulePage() {
  const [store, setStore] = useState<CockpitStoreSlug>("kent");
  const [labor, setLabor] = useState<LaborData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedDay, setExpandedDay] = useState<string | null>(null);
  const [showEducation, setShowEducation] = useState(false);
  const [showAddShift, setShowAddShift] = useState(false);
  const [editingShift, setEditingShift] = useState<ShiftEmployee & { date: string } | null>(null);
  const [copyingWeek, setCopyingWeek] = useState(false);

  const [weekOffset, setWeekOffset] = useState(0);

  const [addName, setAddName] = useState("");
  const [addRole, setAddRole] = useState<(typeof ROLE_OPTIONS)[number]>("team");
  const [addDate, setAddDate] = useState("");
  const [addStart, setAddStart] = useState("09:00");
  const [addEnd, setAddEnd] = useState("17:00");
  const [addNotes, setAddNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState<(typeof ROLE_OPTIONS)[number]>("team");
  const [editDate, setEditDate] = useState("");
  const [editStart, setEditStart] = useState("09:00");
  const [editEnd, setEditEnd] = useState("17:00");
  const [editNotes, setEditNotes] = useState("");
  
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
  useEffect(() => { setAddDate(weekOf); }, [weekOf]);

  const openAddShift = () => {
    setAddName("");
    setAddRole("team");
    setAddDate(weekOf);
    setAddStart("09:00");
    setAddEnd("17:00");
    setAddNotes("");
    setShowAddShift(true);
  };

  const openEditShift = (emp: ShiftEmployee, date: string) => {
    setEditingShift({ ...emp, date });
    setEditName(emp.name);
    setEditRole(emp.role as (typeof ROLE_OPTIONS)[number]);
    setEditDate(date);
    setEditStart(emp.start);
    setEditEnd(emp.end);
    setEditNotes("");
  };

  async function handleSaveAdd() {
    setSaving(true);
    await fetch("/api/schedules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        store_slug: store,
        employee_name: addName.trim() || "Unnamed",
        role: addRole,
        shift_date: addDate,
        start_time: addStart,
        end_time: addEnd,
        notes: addNotes.trim() || undefined,
      }),
    });
    setSaving(false);
    setShowAddShift(false);
    loadData();
  }

  async function handleSaveEdit() {
    if (!editingShift) return;
    setSaving(true);
    await fetch("/api/schedules", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editingShift.id,
        employee_name: editName.trim() || "Unnamed",
        role: editRole,
        shift_date: editDate,
        start_time: editStart,
        end_time: editEnd,
        notes: editNotes.trim() || undefined,
      }),
    });
    setSaving(false);
    setEditingShift(null);
    loadData();
  }

  async function handleDeleteShift() {
    if (!editingShift) return;
    setSaving(true);
    await fetch(`/api/schedules?id=${encodeURIComponent(editingShift.id)}`, { method: "DELETE" });
    setSaving(false);
    setEditingShift(null);
    loadData();
  }

  async function handleCopyLastWeek() {
    const prevMonday = new Date(weekOf);
    prevMonday.setDate(prevMonday.getDate() - 7);
    const lastWeek = prevMonday.toISOString().slice(0, 10);
    setCopyingWeek(true);
    const res = await fetch(`/api/schedules?store=${store}&week=${lastWeek}`).then((r) => r.json());
    if (!res.ok || !res.shifts?.length) {
      setCopyingWeek(false);
      return;
    }
    for (const s of res.shifts) {
      const nextDate = new Date(s.shift_date);
      nextDate.setDate(nextDate.getDate() + 7);
      const newDate = nextDate.toISOString().slice(0, 10);
      await fetch("/api/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          store_slug: store,
          employee_name: s.employee_name,
          role: s.role,
          shift_date: newDate,
          start_time: s.start_time,
          end_time: s.end_time,
          notes: s.notes ?? undefined,
        }),
      });
    }
    setCopyingWeek(false);
    loadData();
  }

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

        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
          <button type="button" onClick={() => setWeekOffset((p: number) => p - 1)} className="rounded-lg border border-border/30 bg-black/20 px-2.5 py-1 text-sm text-muted hover:text-white">←</button>
          <span className="text-xs text-muted">
            Week of {new Date(weekOf + "T12:00:00Z").toLocaleDateString("en-US", { month: "short", day: "numeric" })} – {new Date(new Date(weekOf).getTime() + 6 * 86400000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </span>
          <button type="button" onClick={() => setWeekOffset((p: number) => p + 1)} className="rounded-lg border border-border/30 bg-black/20 px-2.5 py-1 text-sm text-muted hover:text-white">→</button>
          <button type="button" onClick={handleCopyLastWeek} disabled={copyingWeek} className="rounded-lg border border-border/30 bg-black/20 px-2.5 py-1 text-sm text-muted hover:text-white disabled:opacity-50">
            {copyingWeek ? "Copying…" : "Copy Last Week"}
          </button>
          <button type="button" onClick={openAddShift} className="rounded-lg border border-brand/50 bg-brand/15 px-3 py-1.5 text-sm font-medium text-brand hover:bg-brand/25">+ Add Shift</button>
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
                      {day.employees.map((emp) => (
                        <button
                          key={emp.id}
                          type="button"
                          onClick={() => openEditShift(emp, day.date)}
                          className="w-full flex items-center justify-between rounded-lg border border-border/20 bg-black/10 px-3 py-2 text-xs text-left hover:border-brand/30 hover:bg-black/20 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] uppercase bg-muted/10 px-1.5 py-0.5 rounded text-muted">{ROLES[emp.role] || emp.role}</span>
                            <span className="text-white font-medium">{emp.name}</span>
                          </div>
                          <div className="flex items-center gap-3 tabular-nums text-muted">
                            <span>{emp.start}–{emp.end}</span>
                            <span>{emp.hours}hrs</span>
                            <span className="text-white">${emp.cost}</span>
                          </div>
                        </button>
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

      {/* Add Shift Modal */}
      {showAddShift && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0 }} onClick={() => setShowAddShift(false)}>
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          <div className="relative w-full max-w-md rounded-2xl border border-border bg-[#0d0f13] p-5 shadow-2xl overflow-y-auto" style={{ maxHeight: "90vh" }} onClick={(e) => e.stopPropagation()}>
            <button type="button" onClick={() => setShowAddShift(false)} className="absolute top-3 right-3 text-muted hover:text-white text-lg leading-none">✕</button>
            <h3 className="text-base font-semibold text-white mb-4">Add Shift</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-muted mb-1">Employee name</label>
                <input type="text" value={addName} onChange={(e) => setAddName(e.target.value)} placeholder="e.g. Jordan" className="w-full rounded-lg border border-border/50 bg-black/30 px-3 py-2.5 text-sm text-white placeholder:text-muted focus:border-brand/60 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">Role</label>
                <select value={addRole} onChange={(e) => setAddRole(e.target.value as (typeof ROLE_OPTIONS)[number])} className="w-full rounded-lg border border-border/50 bg-black/30 px-3 py-2.5 text-sm text-white focus:border-brand/60 focus:outline-none">
                  {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{ROLES[r] ?? r}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">Date</label>
                <input type="date" value={addDate} onChange={(e) => setAddDate(e.target.value)} className="w-full rounded-lg border border-border/50 bg-black/30 px-3 py-2.5 text-sm text-white focus:border-brand/60 focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-muted mb-1">Start time</label>
                  <input type="time" value={addStart} onChange={(e) => setAddStart(e.target.value)} className="w-full rounded-lg border border-border/50 bg-black/30 px-3 py-2.5 text-sm text-white focus:border-brand/60 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs text-muted mb-1">End time</label>
                  <input type="time" value={addEnd} onChange={(e) => setAddEnd(e.target.value)} className="w-full rounded-lg border border-border/50 bg-black/30 px-3 py-2.5 text-sm text-white focus:border-brand/60 focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">Notes (optional)</label>
                <textarea value={addNotes} onChange={(e) => setAddNotes(e.target.value)} rows={2} placeholder="Optional notes" className="w-full rounded-lg border border-border/50 bg-black/30 px-3 py-2.5 text-sm text-white placeholder:text-muted focus:border-brand/60 focus:outline-none resize-none" />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button type="button" onClick={handleSaveAdd} disabled={saving} className="flex-1 rounded-lg border border-brand/50 bg-brand/15 px-4 py-2.5 text-sm font-semibold text-brand hover:bg-brand/25 disabled:opacity-50">Save</button>
              <button type="button" onClick={() => setShowAddShift(false)} className="flex-1 rounded-lg border border-border/50 bg-black/30 px-4 py-2.5 text-sm text-muted hover:text-white">Cancel</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Edit Shift Modal */}
      {editingShift && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0 }} onClick={() => setEditingShift(null)}>
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          <div className="relative w-full max-w-md rounded-2xl border border-border bg-[#0d0f13] p-5 shadow-2xl overflow-y-auto" style={{ maxHeight: "90vh" }} onClick={(e) => e.stopPropagation()}>
            <button type="button" onClick={() => setEditingShift(null)} className="absolute top-3 right-3 text-muted hover:text-white text-lg leading-none">✕</button>
            <h3 className="text-base font-semibold text-white mb-4">Edit Shift</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-muted mb-1">Employee name</label>
                <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full rounded-lg border border-border/50 bg-black/30 px-3 py-2.5 text-sm text-white focus:border-brand/60 focus:outline-none" />
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">Role</label>
                <select value={editRole} onChange={(e) => setEditRole(e.target.value as (typeof ROLE_OPTIONS)[number])} className="w-full rounded-lg border border-border/50 bg-black/30 px-3 py-2.5 text-sm text-white focus:border-brand/60 focus:outline-none">
                  {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{ROLES[r] ?? r}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">Date</label>
                <input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} className="w-full rounded-lg border border-border/50 bg-black/30 px-3 py-2.5 text-sm text-white focus:border-brand/60 focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-muted mb-1">Start time</label>
                  <input type="time" value={editStart} onChange={(e) => setEditStart(e.target.value)} className="w-full rounded-lg border border-border/50 bg-black/30 px-3 py-2.5 text-sm text-white focus:border-brand/60 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs text-muted mb-1">End time</label>
                  <input type="time" value={editEnd} onChange={(e) => setEditEnd(e.target.value)} className="w-full rounded-lg border border-border/50 bg-black/30 px-3 py-2.5 text-sm text-white focus:border-brand/60 focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">Notes (optional)</label>
                <textarea value={editNotes} onChange={(e) => setEditNotes(e.target.value)} rows={2} placeholder="Optional notes" className="w-full rounded-lg border border-border/50 bg-black/30 px-3 py-2.5 text-sm text-white placeholder:text-muted focus:border-brand/60 focus:outline-none resize-none" />
              </div>
            </div>
            <p className="text-xs text-amber-400/90 mt-3">Removing this shift saves ${Number(editingShift.cost).toFixed(2)} on this day.</p>
            <div className="flex gap-2 mt-4">
              <button type="button" onClick={handleSaveEdit} disabled={saving} className="flex-1 rounded-lg border border-brand/50 bg-brand/15 px-4 py-2.5 text-sm font-semibold text-brand hover:bg-brand/25 disabled:opacity-50">Save</button>
              <button type="button" onClick={handleDeleteShift} disabled={saving} className="flex-1 rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-400 hover:bg-red-500/20 disabled:opacity-50">Delete</button>
              <button type="button" onClick={() => setEditingShift(null)} className="flex-1 rounded-lg border border-border/50 bg-black/30 px-4 py-2.5 text-sm text-muted hover:text-white">Cancel</button>
            </div>
          </div>
        </div>,
        document.body
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
