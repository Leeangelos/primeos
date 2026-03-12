"use client";

import { useEffect, useMemo, useState } from "react";
import { MapPin, ChevronDown, ChevronLeft, ChevronRight, Check } from "lucide-react";
import { useAuth } from "@/src/lib/auth-context";
import { isNewUser, getNewUserStoreName } from "@/src/lib/user-scope";
import { EducationInfoIcon } from "@/src/components/education/InfoIcon";
import { COCKPIT_STORE_SLUGS, COCKPIT_TARGETS, type CockpitStoreSlug } from "@/lib/cockpit-config";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type StoreSlug = CockpitStoreSlug | "all";
const STORE_OPTIONS: { slug: StoreSlug; name: string }[] = [
  ...COCKPIT_STORE_SLUGS.map((slug) => ({ slug, name: COCKPIT_TARGETS[slug]?.name ?? slug })),
  { slug: "all", name: "All Locations" },
];

function getStoreLabel(slug: StoreSlug): string {
  if (slug === "all") return "All Locations";
  return COCKPIT_TARGETS[slug as CockpitStoreSlug]?.name ?? slug;
}

type Employee = {
  id: number;
  name: string;
  role: string;
};

type Shift = {
  id: number;
  employee_name: string;
  role: string;
  shift_date: string; // YYYY-MM-DD
  start_time: string; // HH:MM
  end_time: string; // HH:MM
  hours: number;
  labor_cost: number;
};

type LaborSummary = {
  totalHours: number;
  totalLaborCost: number;
  totalProjectedSales: number;
  laborPct: number;
};

type ActiveShift =
  | {
      mode: "add";
      employeeName: string;
      date: string;
      role: string;
      start_time: string;
      end_time: string;
    }
  | {
      mode: "edit";
      id: number;
      employeeName: string;
      date: string;
      role: string;
      start_time: string;
      end_time: string;
    };

const ROLE_COLORS: Record<string, string> = {
  kitchen: "bg-orange-500/20 border-orange-500/60 text-orange-100",
  cook: "bg-orange-500/20 border-orange-500/60 text-orange-100",
  driver: "bg-blue-500/20 border-blue-500/60 text-blue-100",
  cashier: "bg-teal-500/20 border-teal-500/60 text-teal-100",
  default: "bg-slate-700/40 border-slate-500/60 text-slate-100",
};

const ROLE_OPTIONS = [
  { value: "cook", label: "Kitchen" },
  { value: "driver", label: "Driver" },
  { value: "cashier", label: "Cashier" },
  { value: "team", label: "Team" },
];

function formatWeekLabel(weekStart: Date): string {
  const start = new Date(weekStart);
  const end = new Date(weekStart);
  end.setDate(end.getDate() + 6);
  const fmt: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  return `${start.toLocaleDateString("en-US", fmt)} - ${end.toLocaleDateString("en-US", fmt)}`;
}

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun
  const diff = (day + 6) % 7; // days since Monday
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export default function SchedulePage() {
  const { session } = useAuth();
  const newUser = isNewUser(session);
  const [storeOpen, setStoreOpen] = useState(false);
  const [selectedStore, setSelectedStore] = useState<StoreSlug>("kent");

  const [weekStart, setWeekStart] = useState<Date>(() => startOfWeek(new Date()));
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [labor, setLabor] = useState<LaborSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeShift, setActiveShift] = useState<ActiveShift | null>(null);
  const [savingShift, setSavingShift] = useState(false);

  const weekStartISO = useMemo(() => weekStart.toISOString().slice(0, 10), [weekStart]);
  const selectedStoreName = newUser ? getNewUserStoreName(session) : getStoreLabel(selectedStore);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("primeos-last-store", selectedStore);
    }
  }, [selectedStore]);

  useEffect(() => {
    let cancelled = false;
    const store = selectedStore === "all" ? "all" : selectedStore;
    async function load() {
      setLoading(true);
      try {
        const [employeesRes, shiftsRes, laborRes] = await Promise.all([
          fetch(`/api/employees?store=${encodeURIComponent(store)}&status=active`).then((r) => r.json()),
          fetch(`/api/schedules?store=${encodeURIComponent(store)}&week=${weekStartISO}`).then((r) => r.json()),
          fetch(`/api/schedules/labor?store=${encodeURIComponent(store)}&week=${weekStartISO}`).then((r) => r.json()),
        ]);
        if (cancelled) return;
        if (employeesRes.ok && Array.isArray(employeesRes.employees)) {
          setEmployees(
            employeesRes.employees.map((e: any) => ({
              id: e.id,
              name: e.name,
              role: e.role ?? "team",
            }))
          );
        } else {
          setEmployees([]);
        }
        if (shiftsRes.ok && Array.isArray(shiftsRes.shifts)) {
          setShifts(
            shiftsRes.shifts.map((s: any) => ({
              id: s.id,
              employee_name: s.employee_name,
              role: s.role ?? "team",
              shift_date: s.shift_date,
              start_time: s.start_time,
              end_time: s.end_time,
              hours: Number(s.hours) || 0,
              labor_cost: Number(s.labor_cost) || 0,
            }))
          );
        } else {
          setShifts([]);
        }
        if (laborRes.ok && laborRes.labor) {
          setLabor({
            totalHours: laborRes.labor.totalHours ?? 0,
            totalLaborCost: laborRes.labor.totalLaborCost ?? 0,
            totalProjectedSales: laborRes.labor.totalProjectedSales ?? 0,
            laborPct: laborRes.labor.laborPct ?? 0,
          });
        } else {
          setLabor(null);
        }
      } catch {
        if (!cancelled) {
          setEmployees([]);
          setShifts([]);
          setLabor(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [selectedStore, weekStartISO]);

  const days = useMemo(() => {
    const arr: { label: string; iso: string }[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      arr.push({
        label: d.toLocaleDateString("en-US", { weekday: "short" }),
        iso: d.toISOString().slice(0, 10),
      });
    }
    return arr;
  }, [weekStart]);

  const laborGauge = useMemo(() => {
    if (!labor) return { pct: 0, target: 25, color: "text-slate-300", badge: null as React.ReactNode };
    const target = 25;
    const pct = labor.laborPct ?? 0;
    let color = "text-emerald-400";
    if (pct > target + 5) color = "text-red-400";
    else if (pct > target) color = "text-amber-400";
    let badge: React.ReactNode = null;
    if (pct <= target) {
      badge = (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 text-[10px] font-semibold">
          On Track 🎯
        </span>
      );
    } else {
      const overDollars =
        labor.totalProjectedSales > 0
          ? Math.round((pct - target) / 100 * labor.totalProjectedSales)
          : 0;
      badge = (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 text-[10px] font-semibold">
          Over Target (+${overDollars.toLocaleString("en-US")})
        </span>
      );
    }
    return { pct, target, color, badge };
  }, [labor]);

  const handlePrevWeek = () => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() - 7);
    setWeekStart(startOfWeek(d));
  };

  const handleNextWeek = () => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 7);
    setWeekStart(startOfWeek(d));
  };

  function openAddShift(employeeName: string, dateIso: string) {
    setActiveShift({
      mode: "add",
      employeeName,
      date: dateIso,
      role: "cook",
      start_time: "10:00",
      end_time: "18:00",
    });
  }

  function openEditShift(shift: Shift) {
    setActiveShift({
      mode: "edit",
      id: shift.id,
      employeeName: shift.employee_name,
      date: shift.shift_date,
      role: shift.role ?? "team",
      start_time: shift.start_time,
      end_time: shift.end_time,
    });
  }

  async function handleSaveShift() {
    if (!activeShift) return;
    setSavingShift(true);
    const storeSlug = selectedStore === "all" ? "kent" : selectedStore;
    try {
      if (activeShift.mode === "add") {
        const res = await fetch("/api/schedules", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            store_slug: storeSlug,
            employee_name: activeShift.employeeName,
            role: activeShift.role,
            shift_date: activeShift.date,
            start_time: activeShift.start_time,
            end_time: activeShift.end_time,
          }),
        });
        const data = await res.json();
        if (data.ok && data.shift) {
          setShifts((prev) => [
            ...prev,
            {
              id: data.shift.id,
              employee_name: data.shift.employee_name,
              role: data.shift.role,
              shift_date: data.shift.shift_date,
              start_time: data.shift.start_time,
              end_time: data.shift.end_time,
              hours: Number(data.shift.hours) || 0,
              labor_cost: Number(data.shift.labor_cost) || 0,
            },
          ]);
        }
      } else {
        const res = await fetch("/api/schedules", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: activeShift.id,
            employee_name: activeShift.employeeName,
            role: activeShift.role,
            shift_date: activeShift.date,
            start_time: activeShift.start_time,
            end_time: activeShift.end_time,
          }),
        });
        const data = await res.json();
        if (data.ok && data.shift) {
          setShifts((prev) =>
            prev.map((s) =>
              s.id === data.shift.id
                ? {
                    id: data.shift.id,
                    employee_name: data.shift.employee_name,
                    role: data.shift.role,
                    shift_date: data.shift.shift_date,
                    start_time: data.shift.start_time,
                    end_time: data.shift.end_time,
                    hours: Number(data.shift.hours) || 0,
                    labor_cost: Number(data.shift.labor_cost) || 0,
                  }
                : s
            )
          );
        }
      }
      setActiveShift(null);
    } catch {
      // ignore
    } finally {
      setSavingShift(false);
    }
  }

  async function handleDeleteShift() {
    if (!activeShift || activeShift.mode !== "edit") return;
    setSavingShift(true);
    try {
      const res = await fetch(`/api/schedules?id=${activeShift.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.ok) {
        setShifts((prev) => prev.filter((s) => s.id !== activeShift.id));
        setActiveShift(null);
      }
    } catch {
      // ignore
    } finally {
      setSavingShift(false);
    }
  }

  const totalScheduledHours = useMemo(
    () => shifts.reduce((s, sh) => s + (Number(sh.hours) || 0), 0),
    [shifts]
  );
  const totalScheduledCost = useMemo(
    () => shifts.reduce((s, sh) => s + (Number(sh.labor_cost) || 0), 0),
    [shifts]
  );

  return (
    <div className="space-y-5 pb-28">
      <div className="dashboard-toolbar p-3 sm:p-5 space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-lg font-semibold sm:text-2xl">Schedule</h1>
          <EducationInfoIcon metricKey="labor_optimization" size="lg" />
        </div>
        <p className="text-xs text-muted">
          Weekly view of scheduled labor. Data syncs from your POS and manual edits.
        </p>
      </div>

      {/* Store selector */}
      <div className="flex items-center justify-between gap-3 px-3 sm:px-5">
        <div className="relative">
          {newUser ? (
            <div className="flex items-center gap-2 bg-slate-800 rounded-lg px-3 py-2 border border-[#E65100]/50 text-sm text-white min-h-[44px] w-full sm:w-auto">
              <MapPin className="w-4 h-4 text-[#E65100] shrink-0" aria-hidden />
              <span className="truncate font-medium">{selectedStoreName}</span>
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setStoreOpen((o) => !o)}
                className="flex items-center gap-2 bg-slate-800 rounded-lg px-3 py-2 border border-slate-700 text-sm text-white min-h-[44px] w-full sm:w-auto"
                aria-haspopup="listbox"
                aria-expanded={storeOpen}
                aria-label={`Store: ${selectedStoreName}. Select location.`}
              >
                <MapPin className="w-4 h-4 text-blue-400 shrink-0" aria-hidden />
                <span className="truncate">{selectedStoreName}</span>
                <ChevronDown
                  className={cn(
                    "w-4 h-4 text-slate-400 shrink-0 transition-transform",
                    storeOpen && "rotate-180"
                  )}
                  aria-hidden
                />
              </button>
              {storeOpen && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    aria-hidden="true"
                    onClick={() => setStoreOpen(false)}
                  />
                  <div className="absolute top-full left-0 mt-1 z-40 w-64 bg-slate-800 rounded-xl border border-slate-700 shadow-lg shadow-black/30 overflow-hidden">
                    {STORE_OPTIONS.map((opt) => (
                      <button
                        key={opt.slug}
                        type="button"
                        onClick={() => {
                          setSelectedStore(opt.slug);
                          setStoreOpen(false);
                        }}
                        className={cn(
                          "w-full flex items-center justify-between px-4 py-3 text-sm hover:bg-slate-700/50 transition-colors",
                          selectedStore === opt.slug ? "text-blue-400" : "text-slate-300"
                        )}
                      >
                        <span>{opt.name}</span>
                        {selectedStore === opt.slug && (
                          <Check className="w-4 h-4 text-blue-400 shrink-0" aria-hidden />
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {/* Week nav + Labor gauge */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrevWeek}
              className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800"
              aria-label="Previous week"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="text-xs font-semibold text-slate-200">
              {formatWeekLabel(weekStart)}
            </div>
            <button
              type="button"
              onClick={handleNextWeek}
              className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800"
              aria-label="Next week"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="hidden sm:flex flex-col items-end text-right">
            <span className="text-[10px] uppercase tracking-wide text-slate-400">
              Scheduled Labor %
            </span>
            <div className="flex items-baseline gap-2">
              <span className={cn("text-xl font-bold tabular-nums", laborGauge.color)}>
                {labor ? `${laborGauge.pct.toFixed(1)}%` : "—"}
              </span>
              <span className="text-xs text-slate-500">Target 25%</span>
            </div>
            {laborGauge.badge}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="px-3 sm:px-5">
        <div className="rounded-xl border border-slate-700 bg-slate-900/60 overflow-x-auto">
          <table className="min-w-full text-xs">
            <thead>
              <tr className="bg-slate-900/80">
                <th className="px-3 py-2 border-b border-slate-700 text-left text-slate-400 w-40">
                  Employee
                </th>
                {days.map((d) => (
                  <th
                    key={d.iso}
                    className="px-2 py-2 border-b border-l border-slate-700 text-center text-slate-400"
                  >
                    <div>{d.label}</div>
                    <div className="text-[10px] text-slate-500">
                      {new Date(d.iso).getDate()}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {employees.length === 0 && !loading && (
                <tr>
                  <td
                    colSpan={days.length + 1}
                    className="px-4 py-6 text-center text-slate-500"
                  >
                    No active employees for this store yet.
                  </td>
                </tr>
              )}
              {employees.map((emp) => (
                <tr key={emp.id} className="border-t border-slate-800">
                  <td className="px-3 py-2 text-slate-100 whitespace-nowrap">
                    <div className="font-semibold">{emp.name}</div>
                    <div className="text-[10px] text-slate-500 capitalize">
                      {emp.role || "team"}
                    </div>
                  </td>
                  {days.map((d) => {
                    const dayShift = shifts.find(
                      (s) =>
                        s.employee_name === emp.name &&
                        s.shift_date === d.iso
                    );
                    if (!dayShift) {
                      return (
                        <td
                          key={d.iso}
                          className="px-1 py-1 border-l border-slate-800"
                        >
                          <button
                            type="button"
                            onClick={() => openAddShift(emp.name, d.iso)}
                            className="w-full h-10 rounded-md border border-dashed border-slate-700/70 text-[10px] text-slate-500 hover:border-slate-500 hover:bg-slate-800/60"
                          >
                            +
                          </button>
                        </td>
                      );
                    }
                    const roleKey =
                      dayShift.role === "cook" || dayShift.role === "kitchen"
                        ? "kitchen"
                        : dayShift.role === "driver"
                          ? "driver"
                          : dayShift.role === "cashier"
                            ? "cashier"
                            : "default";
                    const colorClass = ROLE_COLORS[roleKey] ?? ROLE_COLORS.default;
                    return (
                      <td
                        key={d.iso}
                        className="px-1 py-1 border-l border-slate-800"
                      >
                        <button
                          type="button"
                          onClick={() => openEditShift(dayShift)}
                          className={cn(
                            "w-full h-10 rounded-md border px-2 py-1 text-left text-[10px] leading-tight",
                            colorClass
                          )}
                        >
                          <div className="flex justify-between">
                            <span>
                              {dayShift.start_time.slice(0, 5)}–{dayShift.end_time.slice(0, 5)}
                            </span>
                            <span className="capitalize">{dayShift.role}</span>
                          </div>
                          <div className="text-[9px] opacity-80">
                            {dayShift.hours.toFixed(1)} hrs · $
                            {dayShift.labor_cost.toFixed(0)}
                          </div>
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Weekly summary + publish */}
      <div className="px-3 sm:px-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mt-2">
        <div className="text-xs text-slate-400 space-y-1">
          <div>
            <span className="font-semibold text-slate-200">
              {totalScheduledHours.toFixed(1)}
            </span>{" "}
            hrs scheduled
          </div>
          <div>
            <span className="font-semibold text-slate-200">
              ${totalScheduledCost.toLocaleString("en-US", { maximumFractionDigits: 0 })}
            </span>{" "}
            estimated labor cost
          </div>
          {labor && labor.totalProjectedSales > 0 && (
            <div>
              <span className="font-semibold text-slate-200">
                ${labor.totalProjectedSales.toLocaleString("en-US", { maximumFractionDigits: 0 })}
              </span>{" "}
              projected sales (from recent weeks)
            </div>
          )}
        </div>
        <button
          type="button"
          disabled={loading}
          className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-emerald-600 text-xs font-semibold text-white shadow-md shadow-emerald-900/40 hover:bg-emerald-500 disabled:opacity-50"
        >
          Publish Week
        </button>
      </div>

      {/* Shift bottom sheet */}
      {activeShift && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <button
            type="button"
            className="absolute inset-0 bg-black/60"
            onClick={() => !savingShift && setActiveShift(null)}
            aria-hidden
          />
          <div className="relative w-full max-w-md mx-auto bg-slate-900 rounded-t-2xl border border-slate-700 shadow-2xl p-4 space-y-3">
            <div className="w-10 h-1 rounded-full bg-slate-600 mx-auto mb-2" />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-white">
                  {activeShift.mode === "add" ? "Add Shift" : "Edit Shift"}
                </p>
                <p className="text-[11px] text-slate-400">
                  {activeShift.employeeName} ·{" "}
                  {new Date(activeShift.date + "T12:00:00Z").toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </div>
              <button
                type="button"
                onClick={() => !savingShift && setActiveShift(null)}
                className="text-slate-400 hover:text-slate-200 text-lg px-2"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">
                  Start
                </label>
                <input
                  type="time"
                  value={activeShift.start_time}
                  onChange={(e) =>
                    setActiveShift((prev) =>
                      prev
                        ? { ...prev, start_time: e.target.value }
                        : prev
                    )
                  }
                  className="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">
                  End
                </label>
                <input
                  type="time"
                  value={activeShift.end_time}
                  onChange={(e) =>
                    setActiveShift((prev) =>
                      prev
                        ? { ...prev, end_time: e.target.value }
                        : prev
                    )
                  }
                  className="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="text-xs">
              <label className="block text-[10px] text-slate-400 mb-1">
                Role
              </label>
              <div className="flex gap-2 flex-wrap">
                {ROLE_OPTIONS.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() =>
                      setActiveShift((prev) =>
                        prev ? { ...prev, role: r.value } : prev
                      )
                    }
                    className={cn(
                      "px-3 py-1 rounded-full border text-[11px]",
                      activeShift.role === r.value
                        ? "bg-emerald-600/20 border-emerald-500 text-emerald-300"
                        : "bg-slate-800 border-slate-700 text-slate-300"
                    )}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-2">
              {activeShift.mode === "edit" ? (
                <button
                  type="button"
                  onClick={handleDeleteShift}
                  disabled={savingShift}
                  className="text-xs text-red-300 hover:text-red-200 underline"
                >
                  Delete shift
                </button>
              ) : (
                <span />
              )}
              <button
                type="button"
                onClick={handleSaveShift}
                disabled={savingShift}
                className="inline-flex items-center justify-center px-4 py-2 rounded-full bg-emerald-600 text-xs font-semibold text-white shadow-md shadow-emerald-900/40 hover:bg-emerald-500 disabled:opacity-50"
              >
                {savingShift
                  ? activeShift.mode === "add"
                    ? "Adding…"
                    : "Saving…"
                  : activeShift.mode === "add"
                    ? "Add Shift"
                    : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

