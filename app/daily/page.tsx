"use client";

import { Suspense, useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  COCKPIT_STORE_SLUGS,
  COCKPIT_TARGETS,
  getPrimeStatus,
  getLaborStatus,
  getSlphStatus,
  getFoodDisposablesStatus,
  type CockpitStoreSlug,
  type CockpitStatusLabel,
} from "@/lib/cockpit-config";
import { cn } from "@/lib/utils";

function todayYYYYMMDD(): string {
  const t = new Date();
  const y = t.getFullYear();
  const m = String(t.getMonth() + 1).padStart(2, "0");
  const d = String(t.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function prevDay(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

function nextDay(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

function formatPct(n: number | null): string {
  if (n == null || Number.isNaN(n)) return "—";
  return `${n.toFixed(1)}%`;
}

function formatNum(n: number | null): string {
  if (n == null || Number.isNaN(n)) return "—";
  return n.toFixed(1);
}

/** SLPH is invalid when labor_hours is empty, 0, or negative; show "—" in that case. */
function formatSlph(laborHoursNum: number | null, slph: number | null): string {
  if (laborHoursNum == null || laborHoursNum <= 0) return "—";
  return formatNum(slph);
}

/** Primary KPI (PRIME): dominant, full-width */
const KPI_PRIMARY_BASE = "dashboard-scoreboard p-6 transition-colors duration-200";
/** Secondary KPIs (Labor, Food+Disposables, SLPH): subordinate, consistent */
const KPI_SECONDARY_BASE = "dashboard-scoreboard p-4 transition-colors duration-200";

/** Performance states: intentional accent (green / red / amber) */
const STATUS_STYLES: Record<CockpitStatusLabel, string> = {
  on_track: "border-emerald-500/50 bg-emerald-500/10 text-emerald-400",
  over: "border-red-500/50 bg-red-500/10 text-red-400",
  under: "border-amber-500/50 bg-amber-500/10 text-amber-400",
};

/** No value => neutral */
const STATUS_NEUTRAL = "border-border/50 bg-panel/80 text-muted";

function statusToLabel(s: CockpitStatusLabel): string {
  return s === "on_track" ? "On Track" : s === "over" ? "Over" : "Under";
}

function InlineStatus({
  label,
  value,
  target,
  status,
}: {
  label: string;
  value: string;
  target: string;
  status: CockpitStatusLabel | null;
}) {
  const base = `${label} = ${value} (Target ${target})`;
  if (status == null) {
    return (
      <div className="mt-1 dashboard-pill px-3 py-2 text-xs text-muted">
        {base}
      </div>
    );
  }
  const statusColor =
    status === "on_track" ? "text-emerald-400" : status === "over" ? "text-red-400" : "text-amber-400";
  return (
    <div className="mt-1 dashboard-pill px-3 py-2 text-xs text-muted">
      {base} → <span className={cn("font-semibold", statusColor)}>{statusToLabel(status)}</span>
    </div>
  );
}

type SaveStatus = "idle" | "saving" | "saved" | "error";

function isValidCockpitStore(s: string | null): s is CockpitStoreSlug {
  return s === "kent" || s === "aurora" || s === "lindseys";
}

function DailyPageContent() {
  const searchParams = useSearchParams();
  const [storeId, setStoreId] = useState<CockpitStoreSlug>("kent");
  const [businessDate, setBusinessDate] = useState<string>(() => todayYYYYMMDD());
  const [netSales, setNetSales] = useState<string>("");
  const [laborCost, setLaborCost] = useState<string>("");
  const [foodCost, setFoodCost] = useState<string>("");
  const [disposablesCost, setDisposablesCost] = useState<string>("");
  const [voidAmount, setVoidAmount] = useState<string>("");
  const [waste, setWaste] = useState<string>("");
  const [laborHours, setLaborHours] = useState<string>("");
  const [scheduledHours, setScheduledHours] = useState<string>("");
  const [bumpTimeMinutes, setBumpTimeMinutes] = useState<string>("");
  const [tickets, setTickets] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");

  /* eslint-disable react-hooks/set-state-in-effect -- sync URL params to state */
  useEffect(() => {
    const s = searchParams.get("store");
    const d = searchParams.get("date");
    if (isValidCockpitStore(s)) setStoreId(s);
    if (d && /^\d{4}-\d{2}-\d{2}$/.test(d)) setBusinessDate(d);
  }, [searchParams]);
  /* eslint-enable react-hooks/set-state-in-effect */

  /* eslint-disable react-hooks/set-state-in-effect -- load entry when store/date change */
  useEffect(() => {
    const slug = storeId;
    const date = businessDate;
    let cancelled = false;
    setSaveStatus("idle");
    const path = `/api/daily-kpi?store=${encodeURIComponent(slug)}&date=${encodeURIComponent(date)}`;
    const url = typeof window !== "undefined" ? `${window.location.origin}${path}` : path;
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled || !data.ok) return;
        const e = data.entry;
        if (e) {
          setNetSales(e.net_sales != null ? String(e.net_sales) : "");
          setLaborCost(e.labor_dollars != null ? String(e.labor_dollars) : "");
          setFoodCost(e.food_dollars != null ? String(e.food_dollars) : "");
          setDisposablesCost(e.disposables_dollars != null ? String(e.disposables_dollars) : "");
          setVoidAmount(e.voids_dollars != null ? String(e.voids_dollars) : "");
          setWaste(e.waste_dollars != null ? String(e.waste_dollars) : "");
          setLaborHours(e.labor_hours != null ? String(e.labor_hours) : "");
          setScheduledHours(e.scheduled_hours != null ? String(e.scheduled_hours) : "");
          setBumpTimeMinutes(e.bump_time_minutes != null ? String(e.bump_time_minutes) : "");
          setTickets(e.customers != null ? String(e.customers) : "");
          setNotes(e.notes != null ? String(e.notes) : "");
        } else {
          setNetSales("");
          setLaborCost("");
          setFoodCost("");
          setDisposablesCost("");
          setVoidAmount("");
          setWaste("");
          setLaborHours("");
          setScheduledHours("");
          setBumpTimeMinutes("");
          setTickets("");
          setNotes("");
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [storeId, businessDate]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const num = (s: string) => (s === "" ? null : parseFloat(s)) ?? null;
  const ns = num(netSales);
  const lc = num(laborCost);
  const fc = num(foodCost);
  const dc = num(disposablesCost);
  const va = num(voidAmount);
  const w = num(waste);
  const lh = num(laborHours);
  const sh = num(scheduledHours);
  const tix = num(tickets);

  /** Required field is valid when not empty and parses to a number >= 0 (0 is valid). */
  const isRequiredFilled = (value: string): boolean => {
    const trimmed = value.trim();
    if (trimmed === "") return false;
    const n = parseFloat(trimmed);
    return Number.isFinite(n) && n >= 0;
  };

  const computed = useMemo(() => {
    const primeDollars = (lc ?? 0) + (fc ?? 0) + (dc ?? 0);
    const primePct = ns != null && ns > 0 ? (primeDollars / ns) * 100 : null;
    const laborPct = ns != null && ns > 0 && lc != null ? (lc / ns) * 100 : null;
    const foodDispPct =
      ns != null && ns > 0 && (fc != null || dc != null)
        ? ((fc ?? 0) + (dc ?? 0)) / ns * 100
        : null;
    const slph =
      ns != null && lh != null && lh > 0 ? ns / lh : null;
    const wastePct = ns != null && ns > 0 && w != null ? (w / ns) * 100 : null;
    const voidPct = ns != null && ns > 0 && va != null ? (va / ns) * 100 : null;
    const avgTicket = ns != null && tix != null && tix > 0 ? ns / tix : null;
    const aov = ns != null && tix != null && tix > 0 ? ns / tix : null;
    const scheduledVsActual = sh != null && lh != null ? sh - lh : null;
    return {
      primeDollars,
      primePct,
      laborPct,
      foodDispPct,
      slph,
      wastePct,
      voidPct,
      avgTicket,
      aov,
      scheduledVsActual,
    };
  }, [ns, lc, fc, dc, va, w, lh, sh, tix]);

  const targets = COCKPIT_TARGETS[storeId];
  const primeStatus = getPrimeStatus(storeId, computed.primePct);
  const laborStatus = getLaborStatus(storeId, computed.laborPct);
  const slphStatus = getSlphStatus(storeId, computed.slph);
  const foodDispStatus = getFoodDisposablesStatus(storeId, computed.foodDispPct);

  const netSalesInvalid = ns != null && ns < 0;
  const requiredFieldsValid =
    isRequiredFilled(netSales) &&
    isRequiredFilled(laborCost) &&
    isRequiredFilled(laborHours) &&
    isRequiredFilled(foodCost) &&
    isRequiredFilled(disposablesCost);
  /** When net_sales > 0, labor_hours must be > 0 (store open). When net_sales === 0, allow labor_hours === 0 (closed). */
  const laborHoursValid =
    (ns == null || ns === 0) || (lh != null && lh > 0);
  const laborHoursInvalidMessage =
    ns != null && ns > 0 && (lh == null || lh <= 0);
  const canSave = requiredFieldsValid && laborHoursValid;
  const softWarning =
    (ns != null && ns > 50_000) || (lh != null && lh > 300)
      ? "This looks unusual — are you sure?"
      : null;

  const scoreboardItems: {
    label: string;
    value: string;
    target: string;
    status: CockpitStatusLabel | null;
  }[] = [
    {
      label: "PRIME %",
      value: formatPct(computed.primePct),
      target: `≤${targets.primeMax}%`,
      status: primeStatus,
    },
    {
      label: "Labor %",
      value: formatPct(computed.laborPct),
      target:
        targets.laborMin != null
          ? `${targets.laborMin}–${targets.laborMax}%`
          : `≤${targets.laborMax}%`,
      status: laborStatus,
    },
    {
      label: "SLPH",
      value: formatSlph(lh, computed.slph),
      target: `${targets.slphMin}+`,
      status: slphStatus,
    },
    {
      label: "Food+Disposables %",
      value: formatPct(computed.foodDispPct),
      target: `≤${targets.foodDisposablesMax}%`,
      status: foodDispStatus,
    },
  ];

  const inputCls =
    "mt-1 w-full dashboard-input px-4 py-3 text-base font-medium tabular-nums placeholder:text-muted focus:border-brand/60 focus:ring-1 focus:ring-brand/40 focus:outline-none";

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="dashboard-toolbar p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-lg font-semibold sm:text-2xl">Daily KPI Entry</h1>
          <select
            value={storeId}
            onChange={(e) => setStoreId(e.target.value as CockpitStoreSlug)}
            className="sm:hidden dashboard-input rounded-lg border border-border/50 bg-black/30 px-3 py-2.5 text-sm font-medium text-brand focus:border-brand/60 focus:ring-1 focus:ring-brand/40 focus:outline-none"
          >
            {COCKPIT_STORE_SLUGS.map((id) => (
              <option key={id} value={id}>
                {COCKPIT_TARGETS[id].name}
              </option>
            ))}
          </select>
          <div className="hidden sm:flex items-center gap-2">
            {COCKPIT_STORE_SLUGS.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => setStoreId(id)}
                className={cn(
                  "rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors",
                  storeId === id
                    ? "border-brand/50 bg-brand/15 text-brand"
                    : "border-border/50 bg-black/30 text-muted hover:border-border hover:bg-black/40"
                )}
              >
                {COCKPIT_TARGETS[id].name}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setBusinessDate(prevDay(businessDate))}
            className="rounded-lg border border-border/50 bg-black/30 px-3 py-3 text-base font-medium text-muted hover:border-border hover:bg-black/40 hover:text-white active:bg-black/50"
            aria-label="Previous day"
          >
            ←
          </button>
          <div className="flex-1 text-center">
            <label className="block text-[10px] uppercase tracking-wider text-muted/70 mb-0.5">Business Date</label>
            <input
              type="date"
              value={businessDate}
              onChange={(e) => setBusinessDate(e.target.value)}
              className="w-full dashboard-input px-3 py-2.5 text-center text-sm font-medium focus:border-brand/60 focus:ring-1 focus:ring-brand/40 focus:outline-none"
            />
          </div>
          <button
            type="button"
            onClick={() => setBusinessDate(nextDay(businessDate))}
            className="rounded-lg border border-border/50 bg-black/30 px-3 py-3 text-base font-medium text-muted hover:border-border hover:bg-black/40 hover:text-white active:bg-black/50"
            aria-label="Next day"
          >
            →
          </button>
        </div>
      </div>

      {/* Scoreboard: PRIME primary, then Labor / Food+Disposables / SLPH */}
      <div className="py-4 sm:py-6 space-y-3 sm:space-y-4">
        {(() => {
          const prime = scoreboardItems[0];
          const valueColor =
            prime.status == null
              ? "text-white"
              : prime.status === "on_track"
                ? "text-emerald-300"
                : prime.status === "over"
                  ? "text-red-300"
                  : "text-amber-300";
          return (
            <div
              key={prime.label}
              className={cn(
                KPI_PRIMARY_BASE,
                "border w-full text-center",
                prime.status == null ? STATUS_NEUTRAL : STATUS_STYLES[prime.status]
              )}
            >
              <div className="text-[10px] font-medium uppercase tracking-widest text-muted/70">
                {prime.label}
              </div>
              <div
                className={cn(
                  "mt-4 sm:mt-8 text-7xl font-black tabular-nums tracking-tight sm:text-8xl leading-none",
                  valueColor
                )}
              >
                {prime.value}
              </div>
              <div className="mt-3 sm:mt-5 text-xs text-muted/70">Target: {prime.target}</div>
            </div>
          );
        })()}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[scoreboardItems[1], scoreboardItems[3], scoreboardItems[2]].map(
            ({ label, value, target, status }) => {
              const valueColor =
                status == null
                  ? "text-white"
                  : status === "on_track"
                    ? "text-emerald-300"
                    : status === "over"
                      ? "text-red-300"
                      : "text-amber-300";
              return (
                <div
                  key={label}
                  className={cn(
                    KPI_SECONDARY_BASE,
                    "border",
                    status == null ? STATUS_NEUTRAL : STATUS_STYLES[status]
                  )}
                >
                  <div className="text-[10px] font-medium uppercase tracking-widest text-muted/70">
                    {label}
                  </div>
                  <div
                    className={cn(
                      "mt-2 sm:mt-3 text-3xl font-bold tabular-nums tracking-tight",
                      valueColor
                    )}
                  >
                    {value}
                  </div>
                  <div className="mt-1 text-[11px] text-muted/70">Target: {target}</div>
                </div>
              );
            }
          )}
        </div>
      </div>

      {/* Validation messages */}
      {netSalesInvalid && (
        <div className="dashboard-surface p-3 border border-red-500/50 bg-red-500/10 text-red-400 text-sm">
          Net Sales cannot be negative.
        </div>
      )}
      {!requiredFieldsValid && !netSalesInvalid && !laborHoursInvalidMessage && (
        <div className="dashboard-surface p-3 border border-amber-500/50 bg-amber-500/10 text-amber-400 text-sm">
          Fill in all required fields before saving.
        </div>
      )}
      {laborHoursInvalidMessage && (
        <div className="dashboard-surface p-3 border border-red-500/50 bg-red-500/10 text-red-400 text-sm">
          Labor hours must be greater than 0
        </div>
      )}
      {softWarning && !netSalesInvalid && (
        <div className="dashboard-surface p-3 border border-amber-500/50 bg-amber-500/10 text-amber-400 text-sm">
          {softWarning}
        </div>
      )}

      {/* Control layer */}
      <div className="border-t border-border/40 pt-10">
        <div className="dashboard-surface p-5 space-y-4">
          <h2 className="text-sm font-medium text-muted">Enter numbers</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="block text-sm text-muted">Net Sales ($)</span>
              <input
                type="number"
                inputMode="decimal"
                placeholder="0"
                value={netSales}
                onChange={(e) => setNetSales(e.target.value)}
                className={cn(inputCls, netSalesInvalid && "border-red-500/60")}
              />
            </label>

            <label className="block">
              <span className="block text-sm text-muted">Labor Cost ($)</span>
              <input
                type="number"
                inputMode="decimal"
                placeholder="0"
                value={laborCost}
                onChange={(e) => setLaborCost(e.target.value)}
                className={inputCls}
              />
              <InlineStatus
                label="Labor %"
                value={formatPct(computed.laborPct)}
                target={
                  targets.laborMin != null
                    ? `${targets.laborMin}–${targets.laborMax}%`
                    : `≤${targets.laborMax}%`
                }
                status={laborStatus}
              />
            </label>

            <label className="block">
              <span className="block text-sm text-muted">Labor hours</span>
              <input
                type="number"
                inputMode="decimal"
                placeholder="0"
                value={laborHours}
                onChange={(e) => setLaborHours(e.target.value)}
                className={inputCls}
              />
              <InlineStatus
                label="SLPH"
                value={formatSlph(lh, computed.slph)}
                target={`${targets.slphMin}+`}
                status={slphStatus}
              />
            </label>

            <label className="block">
              <span className="block text-sm text-muted">Scheduled Hours (optional)</span>
              <input
                type="number"
                inputMode="decimal"
                placeholder="—"
                value={scheduledHours}
                onChange={(e) => setScheduledHours(e.target.value)}
                className={inputCls}
              />
              <div className="mt-1 dashboard-pill px-3 py-2 text-xs text-muted">
                Scheduled vs Actual = {computed.scheduledVsActual != null ? formatNum(computed.scheduledVsActual) : "—"} hrs
              </div>
            </label>

            <label className="block">
              <span className="block text-sm text-muted">Food Cost ($)</span>
              <input
                type="number"
                inputMode="decimal"
                placeholder="0"
                value={foodCost}
                onChange={(e) => setFoodCost(e.target.value)}
                className={inputCls}
              />
            </label>

            <label className="block">
              <span className="block text-sm text-muted">Disposables Cost ($)</span>
              <input
                type="number"
                inputMode="decimal"
                placeholder="0"
                value={disposablesCost}
                onChange={(e) => setDisposablesCost(e.target.value)}
                className={inputCls}
              />
              <div className="mt-1 dashboard-pill px-3 py-2 text-xs text-muted">
                Food+Disposables % = {formatPct(computed.foodDispPct)}
              </div>
            </label>

            <div className="col-span-full dashboard-pill flex items-center gap-2 px-4 py-3 sm:col-span-2">
              <span className="text-sm text-muted">PRIME ($):</span>
              <span className="text-sm font-medium tabular-nums">{formatNum(computed.primeDollars)}</span>
              <span className="text-xs text-muted">(Labor + Food + Disposables)</span>
            </div>

            <label className="block">
              <span className="block text-sm text-muted">Voids ($)</span>
              <input
                type="number"
                inputMode="decimal"
                placeholder="0"
                value={voidAmount}
                onChange={(e) => setVoidAmount(e.target.value)}
                className={inputCls}
              />
              <div className="mt-1 dashboard-pill px-3 py-2 text-xs text-muted">
                Void % = {formatPct(computed.voidPct)}
              </div>
            </label>

            <label className="block">
              <span className="block text-sm text-muted">Waste ($)</span>
              <input
                type="number"
                inputMode="decimal"
                placeholder="0"
                value={waste}
                onChange={(e) => setWaste(e.target.value)}
                className={inputCls}
              />
              <div className="mt-1 dashboard-pill px-3 py-2 text-xs text-muted">
                Waste % = {formatPct(computed.wastePct)}
              </div>
            </label>

            <label className="block">
              <span className="block text-sm text-muted">Customers (tickets)</span>
              <input
                type="number"
                inputMode="decimal"
                placeholder="0"
                value={tickets}
                onChange={(e) => setTickets(e.target.value)}
                className={inputCls}
              />
              <div className="mt-1 dashboard-pill px-3 py-2 text-xs text-muted">
                AOV ($) = {tix != null && tix > 0 ? formatNum(computed.aov) : "—"}
              </div>
              <div className="mt-1 dashboard-pill px-3 py-2 text-xs text-muted">
                Avg Ticket = {formatNum(computed.avgTicket)}
              </div>
            </label>

            <label className="block">
              <span className="block text-sm text-muted">Avg Bump Time (min) (optional)</span>
              <input
                type="number"
                inputMode="decimal"
                placeholder="—"
                value={bumpTimeMinutes}
                onChange={(e) => setBumpTimeMinutes(e.target.value)}
                className={inputCls}
              />
            </label>

            <label className="block sm:col-span-2">
              <span className="block text-sm text-muted">Notes (optional)</span>
              <textarea
                placeholder="Optional notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className={cn(inputCls, "resize-y min-h-[4rem]")}
              />
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={async () => {
                if (!canSave) return;
                setSaveStatus("saving");
                try {
                  const res = await fetch("/api/daily-kpi", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      store: storeId,
                      business_date: businessDate,
                      net_sales: num(netSales) ?? 0,
                      labor_dollars: num(laborCost) ?? 0,
                      labor_hours: num(laborHours) ?? 0,
                      food_dollars: num(foodCost) ?? 0,
                      disposables_dollars: num(disposablesCost) ?? 0,
                      voids_dollars: num(voidAmount) ?? 0,
                      waste_dollars: num(waste) ?? 0,
                      customers: num(tickets) ?? 0,
                      notes: notes.trim() || null,
                      scheduled_hours: num(scheduledHours) ?? undefined,
                      bump_time_minutes: num(bumpTimeMinutes) ?? undefined,
                    }),
                  });
                  const data = await res.json();
                  if (data.ok) {
                    setSaveStatus("saved");
                    setTimeout(() => setSaveStatus("idle"), 2000);
                  } else {
                    setSaveStatus("error");
                  }
                } catch {
                  setSaveStatus("error");
                }
              }}
              disabled={saveStatus === "saving" || !canSave}
              className={cn(
                "rounded-lg border px-5 py-3 text-sm font-semibold transition-all duration-200",
                saveStatus === "saved"
                  ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-400"
                  : "border-brand/50 bg-brand/15 text-brand hover:bg-brand/25",
                "disabled:opacity-50"
              )}
            >
              {saveStatus === "saving" ? "Saving…" : saveStatus === "saved" ? "✓ Saved" : "Save"}
            </button>
            {saveStatus === "error" && (
              <span className="text-sm text-red-400">Error saving — try again</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DailyPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted">Loading…</div>}>
      <DailyPageContent />
    </Suspense>
  );
}
