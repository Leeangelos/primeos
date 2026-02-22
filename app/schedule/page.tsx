"use client";

import { useState } from "react";
import { EducationInfoIcon } from "@/src/components/education/InfoIcon";
import { SEED_SCHEDULE, SEED_DAILY_KPIS, SEED_EMPLOYEES, type SeedShift } from "@/src/lib/seed-data";
import { cn } from "@/lib/utils";

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getWeekDates(): string[] {
  const out: string[] = [];
  const today = new Date();
  const dow = today.getDay();
  const mondayOffset = dow === 0 ? -6 : 1 - dow;
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + mondayOffset + i);
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

function timeTo12h(t: string): string {
  const [h] = t.split(":").map(Number);
  if (h === 0) return "12a";
  if (h === 12) return "12p";
  if (h < 12) return `${h}a`;
  return `${h - 12}p`;
}

function shiftHours(start: string, end: string): number {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  return eh - sh + (em - sm) / 60;
}

const ROLE_COLORS: Record<string, string> = {
  manager: "bg-blue-500/15 text-blue-400 border-blue-500/40",
  cook: "bg-emerald-500/15 text-emerald-400 border-emerald-500/40",
  cashier: "bg-emerald-500/15 text-emerald-400 border-emerald-500/40",
  driver: "bg-amber-500/15 text-amber-400 border-amber-500/40",
  shift_lead: "bg-blue-500/15 text-blue-400 border-blue-500/40",
  team: "bg-muted/20 text-muted border-border/40",
};

function roleLabel(role: string): string {
  if (role === "manager") return "Manager";
  if (role === "cook" || role === "cashier") return "Kitchen";
  if (role === "driver") return "Driver";
  if (role === "shift_lead") return "Manager";
  return role;
}

export default function SchedulePage() {
  const weekDates = getWeekDates();

  const employeeMap = Object.fromEntries(SEED_EMPLOYEES.map((e) => [e.id, e]));
  const kpiByDate = Object.fromEntries(SEED_DAILY_KPIS.map((k) => [k.date, k]));

  const shiftsByDate: Record<string, (SeedShift & { name: string; hours: number })[]> = {};
  weekDates.forEach((d) => (shiftsByDate[d] = []));
  SEED_SCHEDULE.forEach((s) => {
    if (!shiftsByDate[s.date]) return;
    const name = employeeMap[s.employee_id]?.name ?? "Unknown";
    const hours = shiftHours(s.start_time, s.end_time);
    shiftsByDate[s.date].push({ ...s, name, hours });
  });

  function projectedSalesForDate(date: string): number {
    const kpi = kpiByDate[date];
    if (kpi) return kpi.sales;
    const dow = new Date(date + "T12:00:00Z").getDay();
    const isWeekend = dow === 0 || dow === 5 || dow === 6;
    const isMonday = dow === 1;
    if (isMonday) return 4500;
    if (isWeekend) return 6000;
    return 5000;
  }

  return (
    <div className="space-y-5">
      <div className="dashboard-toolbar p-3 sm:p-5 space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-lg font-semibold sm:text-2xl">Schedule</h1>
          <EducationInfoIcon metricKey="labor_optimization" />
          <EducationInfoIcon metricKey="slph" />
        </div>
        <p className="text-xs text-muted">Week view. Total hours, labor cost, and projected SLPH by day.</p>

        <p className="text-xs text-muted">
          Week of {new Date(weekDates[0] + "T12:00:00Z").toLocaleDateString("en-US", { month: "short", day: "numeric" })} –{" "}
          {new Date(weekDates[6] + "T12:00:00Z").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </p>
      </div>

      {/* Mobile: vertical stack of day cards */}
      <div className="space-y-4">
        {weekDates.map((date, i) => {
          const shifts = shiftsByDate[date] ?? [];
          const totalHours = shifts.reduce((s, sh) => s + sh.hours, 0);
          const laborCost = shifts.reduce((s, sh) => s + sh.cost, 0);
          const projSales = projectedSalesForDate(date);
          const slph = totalHours > 0 ? Math.round((projSales / totalHours) * 10) / 10 : 0;
          const dayName = DAY_NAMES[i];
          const dateLabel = new Date(date + "T12:00:00Z").toLocaleDateString("en-US", { month: "short", day: "numeric" });

          return (
            <section key={date} className="rounded-xl border border-border/50 bg-black/20 overflow-hidden">
              <div className="p-3 border-b border-border/30 flex items-center justify-between flex-wrap gap-2">
                <div>
                  <span className="font-semibold text-white">{dayName}</span>
                  <span className="text-muted text-sm ml-2">{dateLabel}</span>
                </div>
                <button
                  type="button"
                  className="min-h-[44px] rounded-lg border border-brand/50 bg-brand/15 px-3 py-2 text-sm font-medium text-brand hover:bg-brand/25"
                >
                  Add Shift
                </button>
              </div>

              <div className="p-3 space-y-2">
                {shifts.length === 0 ? (
                  <p className="text-xs text-muted py-2">No shifts</p>
                ) : (
                  shifts.map((sh) => (
                    <div
                      key={sh.id}
                      className={cn(
                        "flex items-center justify-between rounded-lg border px-3 py-2 text-left",
                        ROLE_COLORS[sh.role] ?? "bg-muted/10 text-muted border-border/30"
                      )}
                    >
                      <div className="min-w-0">
                        <div className="font-medium text-white text-sm truncate">{sh.name}</div>
                        <div className="text-[10px] uppercase tracking-wide opacity-90">
                          {roleLabel(sh.role)} · {timeTo12h(sh.start_time)}–{timeTo12h(sh.end_time)}
                        </div>
                      </div>
                      <div className="text-xs tabular-nums shrink-0">{sh.hours}h</div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-3 border-t border-border/30 bg-black/20 grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="text-[9px] uppercase text-muted">Hours</div>
                  <div className="text-sm font-bold tabular-nums text-white">{totalHours.toFixed(1)}</div>
                </div>
                <div>
                  <div className="text-[9px] uppercase text-muted">Labor</div>
                  <div className="text-sm font-bold tabular-nums text-white">${laborCost.toFixed(0)}</div>
                </div>
                <div>
                  <div className="text-[9px] uppercase text-muted flex items-center justify-center gap-0.5">
                    SLPH
                    <EducationInfoIcon metricKey="slph" size="sm" />
                  </div>
                  <div
                    className={cn(
                      "text-sm font-bold tabular-nums",
                      slph >= 65 ? "text-emerald-400" : slph >= 50 ? "text-amber-400" : "text-red-400"
                    )}
                  >
                    ${slph}
                  </div>
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
