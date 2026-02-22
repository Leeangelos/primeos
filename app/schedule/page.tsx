"use client";

import { useState, useEffect, useCallback } from "react";
import { EducationInfoIcon } from "@/src/components/education/InfoIcon";
import { SEED_SCHEDULE, SEED_DAILY_KPIS, SEED_EMPLOYEES, type SeedShift } from "@/src/lib/seed-data";
import { cn } from "@/lib/utils";

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const TIME_OPTIONS = [
  "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00",
  "17:00", "18:00", "19:00", "20:00", "21:00", "22:00",
];

const FORM_ROLES = [
  { value: "manager", label: "Manager" },
  { value: "kitchen", label: "Kitchen" },
  { value: "driver", label: "Driver" },
] as const;
type FormRole = (typeof FORM_ROLES)[number]["value"];

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

function formatTimeOption(t: string): string {
  const [h, m] = t.split(":").map(Number);
  if (h === 0) return "12:00 AM";
  if (h === 12) return "12:00 PM";
  if (h < 12) return `${h}:${String(m).padStart(2, "0")} AM`;
  return `${h - 12}:${String(m).padStart(2, "0")} PM`;
}

function shiftHours(start: string, end: string): number {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  return eh - sh + (em - sm) / 60;
}

function formRoleToSeedRole(formRole: FormRole): string {
  if (formRole === "manager") return "manager";
  if (formRole === "driver") return "driver";
  return "cook";
}

function seedRoleToFormRole(role: string): FormRole {
  if (role === "manager" || role === "shift_lead") return "manager";
  if (role === "driver") return "driver";
  return "kitchen";
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

type ShiftForm = {
  employee_id: string;
  date: string;
  start_time: string;
  end_time: string;
  role: FormRole;
};

type ModalState =
  | { mode: "closed" }
  | { mode: "add"; defaultDate: string }
  | { mode: "edit"; shift: SeedShift & { name: string; hours: number } };

type ShiftModalProps = {
  isOpen: boolean;
  state: ModalState;
  form: ShiftForm;
  errors: Partial<Record<keyof ShiftForm, string>>;
  employees: { id: string; name: string; role: string }[];
  weekDates: string[];
  onClose: () => void;
  onChange: (field: keyof ShiftForm, value: string) => void;
  onSave: () => void;
  onDelete: (() => void) | null;
};

function ShiftModal({
  isOpen,
  state,
  form,
  errors,
  employees,
  weekDates,
  onClose,
  onChange,
  onSave,
  onDelete,
}: ShiftModalProps) {
  if (!isOpen) return null;

  const isEdit = state.mode === "edit";
  const endTimeOptions = TIME_OPTIONS.filter((t) => t > form.start_time);

  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 z-50"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className="fixed bottom-0 left-0 right-0 z-50 bg-slate-800 rounded-t-2xl border-t border-slate-700 p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] animate-slide-up max-h-[85vh] overflow-y-auto"
        role="dialog"
        aria-labelledby="shift-modal-title"
      >
        <div className="w-10 h-1 bg-slate-600 rounded-full mx-auto mb-5" aria-hidden />
        <h3 id="shift-modal-title" className="text-lg font-bold text-white text-center mb-4">
          {isEdit ? "Edit Shift" : "Add Shift"}
        </h3>

        <div className="space-y-4">
          {/* Employee */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Employee</label>
            <select
              value={form.employee_id}
              onChange={(e) => onChange("employee_id", e.target.value)}
              className="w-full h-12 min-h-[48px] rounded-xl bg-slate-700 border border-slate-600 text-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
              aria-invalid={!!errors.employee_id}
            >
              <option value="">Select employee</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name} — {roleLabel(e.role)}
                </option>
              ))}
            </select>
            {errors.employee_id && (
              <p className="text-red-400 text-xs mt-1">{errors.employee_id}</p>
            )}
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Date</label>
            <select
              value={form.date}
              onChange={(e) => onChange("date", e.target.value)}
              className="w-full h-12 min-h-[48px] rounded-xl bg-slate-700 border border-slate-600 text-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
              aria-invalid={!!errors.date}
            >
              {weekDates.map((d) => (
                <option key={d} value={d}>
                  {new Date(d + "T12:00:00Z").toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                </option>
              ))}
            </select>
            {errors.date && (
              <p className="text-red-400 text-xs mt-1">{errors.date}</p>
            )}
          </div>

          {/* Start time */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Start time</label>
            <select
              value={form.start_time}
              onChange={(e) => {
                onChange("start_time", e.target.value);
                if (form.end_time && e.target.value >= form.end_time) {
                  onChange("end_time", "");
                }
              }}
              className="w-full h-12 min-h-[48px] rounded-xl bg-slate-700 border border-slate-600 text-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
              aria-invalid={!!errors.start_time}
            >
              <option value="">Select start time</option>
              {TIME_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {formatTimeOption(t)}
                </option>
              ))}
            </select>
            {errors.start_time && (
              <p className="text-red-400 text-xs mt-1">{errors.start_time}</p>
            )}
          </div>

          {/* End time */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">End time</label>
            <select
              value={form.end_time}
              onChange={(e) => onChange("end_time", e.target.value)}
              className="w-full h-12 min-h-[48px] rounded-xl bg-slate-700 border border-slate-600 text-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
              aria-invalid={!!errors.end_time}
            >
              <option value="">Select end time</option>
              {(form.start_time ? endTimeOptions : TIME_OPTIONS).map((t) => (
                <option key={t} value={t}>
                  {formatTimeOption(t)}
                </option>
              ))}
            </select>
            {errors.end_time && (
              <p className="text-red-400 text-xs mt-1">{errors.end_time}</p>
            )}
          </div>

          {/* Role */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Role</label>
            <select
              value={form.role}
              onChange={(e) => onChange("role", e.target.value as FormRole)}
              className="w-full h-12 min-h-[48px] rounded-xl bg-slate-700 border border-slate-600 text-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
            >
              {FORM_ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <button
            type="button"
            onClick={onSave}
            className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-colors"
          >
            {isEdit ? "Save Changes" : "Save Shift"}
          </button>
          {isEdit && onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="w-full h-12 rounded-xl bg-red-600/20 text-red-400 border border-red-800 hover:bg-red-600/30 font-semibold text-sm transition-colors"
            >
              Delete Shift
            </button>
          )}
        </div>
      </div>
    </>
  );
}

const emptyForm: ShiftForm = {
  employee_id: "",
  date: "",
  start_time: "",
  end_time: "",
  role: "kitchen",
};

export default function SchedulePage() {
  const weekDates = getWeekDates();
  const [shifts, setShifts] = useState<SeedShift[]>(() => SEED_SCHEDULE);
  const [modalState, setModalState] = useState<ModalState>({ mode: "closed" });
  const [form, setForm] = useState<ShiftForm>(emptyForm);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof ShiftForm, string>>>({});
  const [highlightedShiftId, setHighlightedShiftId] = useState<string | null>(null);

  const employeeMap = Object.fromEntries(SEED_EMPLOYEES.map((e) => [e.id, e]));
  const kpiByDate = Object.fromEntries(SEED_DAILY_KPIS.map((k) => [k.date, k]));

  const activeEmployees = SEED_EMPLOYEES.filter((e) => e.status === "active").map((e) => ({
    id: e.id,
    name: e.name,
    role: e.role,
  }));

  const shiftsByDate: Record<string, (SeedShift & { name: string; hours: number })[]> = {};
  weekDates.forEach((d) => (shiftsByDate[d] = []));
  shifts.forEach((s) => {
    if (!shiftsByDate[s.date]) return;
    const name = employeeMap[s.employee_id]?.name ?? "Unknown";
    const hours = shiftHours(s.start_time, s.end_time);
    shiftsByDate[s.date].push({ ...s, name, hours });
  });

  useEffect(() => {
    if (!highlightedShiftId) return;
    const t = setTimeout(() => setHighlightedShiftId(null), 2000);
    return () => clearTimeout(t);
  }, [highlightedShiftId]);

  const openAdd = useCallback((defaultDate: string) => {
    setForm({
      ...emptyForm,
      date: defaultDate,
      start_time: "10:00",
      end_time: "18:00",
    });
    setFormErrors({});
    setModalState({ mode: "add", defaultDate });
  }, []);

  const openEdit = useCallback((shift: SeedShift & { name: string; hours: number }) => {
    setForm({
      employee_id: shift.employee_id,
      date: shift.date,
      start_time: shift.start_time,
      end_time: shift.end_time,
      role: seedRoleToFormRole(shift.role),
    });
    setFormErrors({});
    setModalState({ mode: "edit", shift });
  }, []);

  const closeModal = useCallback(() => {
    setModalState({ mode: "closed" });
  }, []);

  const validate = useCallback((): boolean => {
    const err: Partial<Record<keyof ShiftForm, string>> = {};
    if (!form.employee_id) err.employee_id = "Select an employee";
    if (!form.date) err.date = "Select a date";
    if (!form.start_time) err.start_time = "Select start time";
    if (!form.end_time) err.end_time = "Select end time";
    if (form.start_time && form.end_time && form.start_time >= form.end_time) {
      err.end_time = "End time must be after start time";
    }
    setFormErrors(err);
    return Object.keys(err).length === 0;
  }, [form]);

  const handleSave = useCallback(() => {
    if (!validate()) return;
    const payRate = employeeMap[form.employee_id]?.pay_rate ?? 14;
    const hours = shiftHours(form.start_time, form.end_time);
    const cost = Math.round(hours * payRate * 100) / 100;
    const seedRole = formRoleToSeedRole(form.role);

    if (modalState.mode === "edit" && "shift" in modalState) {
      setShifts((prev) =>
        prev.map((s) =>
          s.id === modalState.shift.id
            ? {
                ...s,
                employee_id: form.employee_id,
                date: form.date,
                start_time: form.start_time,
                end_time: form.end_time,
                role: seedRole,
                cost,
              }
            : s
        )
      );
    } else {
      const newShift: SeedShift = {
        id: "sh-" + Date.now(),
        employee_id: form.employee_id,
        date: form.date,
        start_time: form.start_time,
        end_time: form.end_time,
        role: seedRole,
        cost,
      };
      setShifts((prev) => [...prev, newShift]);
      setHighlightedShiftId(newShift.id);
    }
    closeModal();
  }, [form, modalState, employeeMap, validate, closeModal]);

  const handleDelete = useCallback(() => {
    if (modalState.mode !== "edit" || !("shift" in modalState)) return;
    setShifts((prev) => prev.filter((s) => s.id !== modalState.shift.id));
    closeModal();
  }, [modalState, closeModal]);

  const setFormField = useCallback((field: keyof ShiftForm, value: string) => {
    setForm((f) => ({ ...f, [field]: value }));
  }, []);

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
    <div className="space-y-5 pb-28">
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

      <div className="space-y-4">
        {weekDates.map((date, i) => {
          const dayShifts = shiftsByDate[date] ?? [];
          const totalHours = dayShifts.reduce((s, sh) => s + sh.hours, 0);
          const laborCost = dayShifts.reduce((s, sh) => s + sh.cost, 0);
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
                  onClick={() => openAdd(date)}
                  className="min-h-[44px] rounded-lg border border-brand/50 bg-brand/15 px-3 py-2 text-sm font-medium text-brand hover:bg-brand/25"
                >
                  Add Shift
                </button>
              </div>

              <div className="p-3 space-y-2">
                {dayShifts.length === 0 ? (
                  <p className="text-xs text-muted py-2">No shifts</p>
                ) : (
                  dayShifts.map((sh) => (
                    <button
                      type="button"
                      key={sh.id}
                      onClick={() => openEdit(sh)}
                      className={cn(
                        "w-full flex items-center justify-between rounded-lg border px-3 py-2 text-left min-h-[44px] transition-colors",
                        ROLE_COLORS[sh.role] ?? "bg-muted/10 text-muted border-border/30",
                        highlightedShiftId === sh.id && "bg-blue-900/30 border-blue-600/50"
                      )}
                    >
                      <div className="min-w-0">
                        <div className="font-medium text-white text-sm truncate">{sh.name}</div>
                        <div className="text-[10px] uppercase tracking-wide opacity-90">
                          {roleLabel(sh.role)} · {timeTo12h(sh.start_time)}–{timeTo12h(sh.end_time)}
                        </div>
                      </div>
                      <div className="text-xs tabular-nums shrink-0">{sh.hours}h</div>
                    </button>
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
                  <div className="text-sm font-bold tabular-nums text-white">{"$" + laborCost.toFixed(0)}</div>
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
                    {"$" + slph}
                  </div>
                </div>
              </div>
            </section>
          );
        })}
      </div>

      <ShiftModal
        isOpen={modalState.mode !== "closed"}
        state={modalState}
        form={form}
        errors={formErrors}
        employees={activeEmployees}
        weekDates={weekDates}
        onClose={closeModal}
        onChange={setFormField}
        onSave={handleSave}
        onDelete={modalState.mode === "edit" ? handleDelete : null}
      />
    </div>
  );
}
