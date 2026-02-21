"use client";

import { Suspense, useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
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
import { getStoreColor } from "@/lib/store-colors";
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
  const [showEducation, setShowEducation] = useState<string | null>(null);
  const [rolling, setRolling] = useState<any>(null);
  const [acknowledged, setAcknowledged] = useState<string | null>(null); // timestamp
  const [ackLoading, setAckLoading] = useState(false);
  const [entry, setEntry] = useState<any>(null); // current day's data from API

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
        setEntry(data.entry ?? null);
        setRolling(data.rolling7 || null);
        if (data.entry?.acknowledged_at) {
          setAcknowledged(data.entry.acknowledged_at);
        } else {
          setAcknowledged(null);
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
    const gpPct =
      ns != null && ns > 0
        ? ((ns - (lc ?? 0) - (fc ?? 0) - (dc ?? 0)) / ns) * 100
        : null;
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
  const gpStatus: CockpitStatusLabel | null =
    computed.gpPct == null
      ? null
      : computed.gpPct >= 45
        ? "on_track"
        : computed.gpPct >= 40
          ? "under"
          : "over";

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
    {
      label: "GROSS PROFIT %",
      value: formatPct(computed.gpPct),
      target: "≥45%",
      status: gpStatus,
    },
  ];

  const inputCls =
    "mt-1 w-full dashboard-input px-4 py-3 text-base font-medium tabular-nums placeholder:text-muted focus:border-brand/60 focus:ring-1 focus:ring-brand/40 focus:outline-none";

  return (
    <>
      <div className="space-y-5">
      {/* Toolbar */}
      <div className={`dashboard-toolbar p-4 sm:p-5 space-y-3 ${getStoreColor(storeId).glow}`}>
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-lg font-semibold sm:text-2xl">Daily KPI Entry</h1>
          <select
            value={storeId}
            onChange={(e) => setStoreId(e.target.value as CockpitStoreSlug)}
            className={cn(
              "sm:hidden dashboard-input rounded-lg border-2 px-3 py-2.5 text-sm font-medium focus:outline-none",
              getStoreColor(storeId).borderActive,
              getStoreColor(storeId).bgActive,
              getStoreColor(storeId).text
            )}
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
                    ? cn(getStoreColor(id).borderActive, getStoreColor(id).bgActive, getStoreColor(id).text)
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
              <div className="text-[10px] font-medium uppercase tracking-widest text-muted/70 flex items-center justify-center gap-1.5">
                {prime.label}
                <button
                  type="button"
                  onClick={() => setShowEducation("prime")}
                  className="inline-flex items-center justify-center h-4 w-4 rounded-full bg-muted/20 text-muted hover:bg-brand/20 hover:text-brand transition-colors text-[9px] font-bold"
                  aria-label="Learn more"
                >
                  i
                </button>
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
              {rolling && rolling.primePct != null && (
                <div className="text-xs text-muted/60 mt-1">7-day avg: {rolling.primePct}%</div>
              )}
            </div>
          );
        })()}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          {[scoreboardItems[1], scoreboardItems[3], scoreboardItems[2], scoreboardItems[4]].map(
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
                  <div className="text-[10px] font-medium uppercase tracking-widest text-muted/70 flex items-center justify-center gap-1.5">
                    {label}
                    <button
                      type="button"
                      onClick={() => setShowEducation(label === "Labor %" ? "labor" : label === "Food+Disposables %" ? "food" : label === "SLPH" ? "slph" : "gp")}
                      className="inline-flex items-center justify-center h-4 w-4 rounded-full bg-muted/20 text-muted hover:bg-brand/20 hover:text-brand transition-colors text-[9px] font-bold"
                      aria-label="Learn more"
                    >
                      i
                    </button>
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
                  {rolling && label === "Labor %" && rolling.laborPct != null && (
                    <div className="text-xs text-muted/60 mt-1">7-day avg: {rolling.laborPct}%</div>
                  )}
                  {rolling && label === "Food+Disposables %" && rolling.foodDispPct != null && (
                    <div className="text-xs text-muted/60 mt-1">7-day avg: {rolling.foodDispPct}%</div>
                  )}
                  {rolling && label === "SLPH" && rolling.slph != null && (
                    <div className="text-xs text-muted/60 mt-1">7-day avg: {rolling.slph}</div>
                  )}
                  {rolling && label === "GROSS PROFIT %" && rolling.primePct != null && (
                    <div className="text-xs text-muted/60 mt-1">7-day avg: {(100 - rolling.primePct).toFixed(1)}%</div>
                  )}
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
            {saveStatus === "idle" && entry && !acknowledged && (
              <button
                type="button"
                onClick={async () => {
                  setAckLoading(true);
                  try {
                    const res = await fetch("/api/daily-kpi/acknowledge", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ store: storeId, business_date: businessDate }),
                    });
                    const data = await res.json();
                    if (data.ok) {
                      setAcknowledged(data.acknowledged_at);
                    }
                  } catch {}
                  setAckLoading(false);
                }}
                disabled={ackLoading}
                className="rounded-lg border border-emerald-500/50 bg-emerald-500/15 px-5 py-3 text-sm font-semibold text-emerald-400 hover:bg-emerald-500/25 disabled:opacity-50"
              >
                {ackLoading ? "..." : "✓ Acknowledge"}
              </button>
            )}
            {acknowledged && (
              <div className="text-xs text-emerald-400/70">
                Acknowledged {new Date(acknowledged).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
              </div>
            )}
          </div>
        </div>
      </div>
      </div>

      {showEducation && typeof document !== "undefined" && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0 }}
          onClick={() => setShowEducation(null)}
        >
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-md mx-auto rounded-2xl border border-border bg-[#0d0f13] p-5 shadow-2xl overflow-y-auto"
            style={{ maxHeight: "85vh" }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowEducation(null)}
              className="absolute top-3 right-3 text-muted hover:text-white text-lg leading-none"
              aria-label="Close"
            >
              ✕
            </button>

            {showEducation === "prime" && (
              <div>
                <h3 className="text-base font-semibold text-brand mb-1">🎓 PRIME %</h3>
                <p className="text-xs text-muted mb-4">The number that matters most.</p>
                <div className="space-y-3 text-sm">
                  <div>
                    <h4 className="font-medium text-white mb-1">How It's Calculated</h4>
                    <p className="text-muted text-xs leading-relaxed">PRIME % = (Labor + Food + Disposables) ÷ Net Sales × 100. These are your controllable costs — the number you can actually move.</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-white mb-1">Why It Matters</h4>
                    <p className="text-muted text-xs leading-relaxed">If PRIME is 60% and fixed costs are 30%, profit = 10%. Drop PRIME to 55% and profit doubles to 15%. On $5K/day, every point = $50/day = $1,500/month.</p>
                  </div>
                  <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-3">
                    <h4 className="font-medium text-red-400 text-xs mb-2">📕 When PRIME Goes RED</h4>
                    <ol className="space-y-1.5 text-muted text-xs list-decimal list-inside leading-relaxed">
                      <li>Check last 3 vendor deliveries for price increases.</li>
                      <li>Weigh 10 cheese portions on 16" pies vs recipe spec.</li>
                      <li>Run 48-hour waste log — track everything thrown away.</li>
                      <li>Compare scheduled vs actual clock-in/out times.</li>
                      <li>Check shift overlaps — closer/driver overlap = $15-20/day wasted.</li>
                    </ol>
                  </div>
                </div>
              </div>
            )}

            {showEducation === "labor" && (
              <div>
                <h3 className="text-base font-semibold text-brand mb-1">🎓 Labor %</h3>
                <p className="text-xs text-muted mb-4">Your biggest controllable expense.</p>
                <div className="space-y-3 text-sm">
                  <div>
                    <h4 className="font-medium text-white mb-1">How It's Calculated</h4>
                    <p className="text-muted text-xs leading-relaxed">Labor % = Total Labor Dollars ÷ Net Sales × 100. Target: 19-21%. On $5K/day, every point over = $50/day = $1,500/month.</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-white mb-1">Why It Matters</h4>
                    <p className="text-muted text-xs leading-relaxed">Labor is the cost you control most directly through scheduling. Unlike food cost which fluctuates with deliveries, labor is a daily decision you make before the store opens.</p>
                  </div>
                  <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-3">
                    <h4 className="font-medium text-red-400 text-xs mb-2">📕 When Labor Goes RED (&gt; 24%)</h4>
                    <ol className="space-y-1.5 text-muted text-xs list-decimal list-inside leading-relaxed">
                      <li>Compare scheduled hours to actual clock-in/out. Look for early ins and late outs.</li>
                      <li>Check shift overlaps — closer/late driver overlap is most common ($15-20/day wasted).</li>
                      <li>Review SLPH. Below 65 means too many people for the volume.</li>
                      <li>Check last 4 of same weekday — pattern or one-off? Patterns need restructuring.</li>
                      <li>Review overtime — anyone over 40hrs costs 1.5x. Redistribute may be cheaper.</li>
                    </ol>
                  </div>
                </div>
              </div>
            )}

            {showEducation === "food" && (
              <div>
                <h3 className="text-base font-semibold text-brand mb-1">🎓 Food + Disposables %</h3>
                <p className="text-xs text-muted mb-4">Where money disappears without anyone noticing.</p>
                <div className="space-y-3 text-sm">
                  <div>
                    <h4 className="font-medium text-white mb-1">How It's Calculated</h4>
                    <p className="text-muted text-xs leading-relaxed">Food+Disp % = (Food Purchases + Disposables) ÷ Net Sales × 100. Target: ≤35%. Note: this uses a 7-day rolling average to smooth delivery-day spikes.</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-white mb-1">Why It Matters</h4>
                    <p className="text-muted text-xs leading-relaxed">A 2% gap between theoretical food cost (recipe) and actual food cost = overportioning + waste + theft + spoilage. On $150K/year in food, that's $3,000 walking out the door.</p>
                  </div>
                  <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-3">
                    <h4 className="font-medium text-red-400 text-xs mb-2">📕 When Food Cost Goes RED (&gt; 33%)</h4>
                    <ol className="space-y-1.5 text-muted text-xs list-decimal list-inside leading-relaxed">
                      <li>Check last 3 vendor deliveries for price increases vs previous invoices.</li>
                      <li>Observe prep line. Weigh 10 cheese portions on 16" pies vs recipe spec.</li>
                      <li>Run 48-hour waste log. Track everything thrown away with a reason.</li>
                      <li>Compare theoretical cost (recipe) vs actual (purchases ÷ units sold) on top 5 items.</li>
                      <li>Check for vendor substitutions — distributors sometimes sub higher-cost items.</li>
                    </ol>
                  </div>
                </div>
              </div>
            )}

            {showEducation === "slph" && (
              <div>
                <h3 className="text-base font-semibold text-brand mb-1">🎓 SLPH (Sales per Labor Hour)</h3>
                <p className="text-xs text-muted mb-4">Are you getting enough output per hour worked?</p>
                <div className="space-y-3 text-sm">
                  <div>
                    <h4 className="font-medium text-white mb-1">How It's Calculated</h4>
                    <p className="text-muted text-xs leading-relaxed">SLPH = Net Sales ÷ Total Labor Hours. Target: $80+. This tells you how productive each hour of labor is.</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-white mb-1">Why It Matters</h4>
                    <p className="text-muted text-xs leading-relaxed">SLPH connects sales volume to staffing. A slow Tuesday with the same staff as Friday means you're paying people to stand around. The goal isn't minimum staffing — it's optimal staffing.</p>
                  </div>
                  <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-3">
                    <h4 className="font-medium text-red-400 text-xs mb-2">📕 When SLPH Goes RED (&lt; 65)</h4>
                    <ol className="space-y-1.5 text-muted text-xs list-decimal list-inside leading-relaxed">
                      <li>Calculate: Total Sales ÷ Total Labor Hours. Below 65 = low productivity.</li>
                      <li>Check if slow day or overstaffed. If sales were normal, you scheduled too many people.</li>
                      <li>Review each position — did you need both a mid-shift AND a closer?</li>
                      <li>Cross-reference with customer traffic patterns from POS data.</li>
                      <li>Build an SLPH target by day-of-week. Mon/Tue may need different staffing than Fri/Sat.</li>
                    </ol>
                  </div>
                </div>
              </div>
            )}

            {showEducation === "voids" && (
              <div>
                <h3 className="text-base font-semibold text-brand mb-1">🎓 Voids %</h3>
                <p className="text-xs text-muted mb-4">Every void is revenue that disappeared.</p>
                <div className="space-y-3 text-sm">
                  <div>
                    <h4 className="font-medium text-white mb-1">How It's Calculated</h4>
                    <p className="text-muted text-xs leading-relaxed">Voids % = Void Dollars ÷ Net Sales × 100. Target: &lt; 2%. Voids include cancelled orders, remakes, and manager comps.</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-white mb-1">Why It Matters</h4>
                    <p className="text-muted text-xs leading-relaxed">2% voids on $5K/day = $100/day = $3,000/month in revenue that came in and went right back out. Some voids are legitimate (wrong orders), but patterns reveal training gaps or worse.</p>
                  </div>
                  <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-3">
                    <h4 className="font-medium text-red-400 text-xs mb-2">📕 When Voids Go RED (&gt; 3%)</h4>
                    <ol className="space-y-1.5 text-muted text-xs list-decimal list-inside leading-relaxed">
                      <li>Pull void report by employee. Is one person responsible for most voids?</li>
                      <li>Check void timing — end of shift voids are a red flag.</li>
                      <li>Review reasons — "wrong order" repeatedly = order-taking training issue.</li>
                      <li>Compare voids by day — certain shifts may need more supervision.</li>
                      <li>Manager comps are voids too. Track who's giving away food and why.</li>
                    </ol>
                  </div>
                </div>
              </div>
            )}

            {showEducation === "gp" && (
              <div>
                <h3 className="text-base font-semibold text-brand mb-1">🎓 Gross Profit %</h3>
                <p className="text-xs text-muted mb-4">What's left after controllable costs.</p>
                <div className="space-y-3 text-sm">
                  <div>
                    <h4 className="font-medium text-white mb-1">How It's Calculated</h4>
                    <p className="text-muted text-xs leading-relaxed">GP % = 100% − PRIME %. If PRIME is 55%, GP is 45%. This is the money left to cover rent, insurance, utilities, and profit.</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-white mb-1">Why It Matters</h4>
                    <p className="text-muted text-xs leading-relaxed">Most pizzerias have 25-35% in fixed costs. If GP is 45% and fixed costs are 30%, net profit is 15%. If GP drops to 40%, net profit is 10% — a 33% pay cut to the business. Every point of GP is a point of profit.</p>
                  </div>
                  <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-3">
                    <h4 className="font-medium text-red-400 text-xs mb-2">📕 When GP Goes RED (&lt; 40%)</h4>
                    <ol className="space-y-1.5 text-muted text-xs list-decimal list-inside leading-relaxed">
                      <li>GP is the inverse of PRIME — fix PRIME and GP fixes itself.</li>
                      <li>Check which component is dragging PRIME up: labor, food, or disposables.</li>
                      <li>Run the PRIME playbook for whichever component is over target.</li>
                      <li>Review pricing — when was your last menu price increase?</li>
                      <li>Calculate: every 1% GP improvement on $100K/month = $1,000/month more to the bottom line.</li>
                    </ol>
                  </div>
                </div>
              </div>
            )}

            {showEducation === "waste" && (
              <div>
                <h3 className="text-base font-semibold text-brand mb-1">🎓 Waste %</h3>
                <p className="text-xs text-muted mb-4">Product you bought but never sold.</p>
                <div className="space-y-3 text-sm">
                  <div>
                    <h4 className="font-medium text-white mb-1">How It's Calculated</h4>
                    <p className="text-muted text-xs leading-relaxed">Waste % = Waste Dollars ÷ Net Sales × 100. Target: &lt; 1.5%. Waste includes expired product, dropped/burned food, and overprepped items.</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-white mb-1">Why It Matters</h4>
                    <p className="text-muted text-xs leading-relaxed">Waste is purchased inventory that generated zero revenue. 1.5% waste on $150K/year in food = $2,250/year thrown in the trash. Most waste is preventable with better prep planning.</p>
                  </div>
                  <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-3">
                    <h4 className="font-medium text-red-400 text-xs mb-2">📕 When Waste Goes RED (&gt; 2.5%)</h4>
                    <ol className="space-y-1.5 text-muted text-xs list-decimal list-inside leading-relaxed">
                      <li>Run a 48-hour waste log. Write down every item thrown away with a reason.</li>
                      <li>Check prep quantities vs actual sales. Are you prepping Saturday amounts on Tuesday?</li>
                      <li>Review walk-in organization — FIFO (first in, first out) prevents expiration.</li>
                      <li>Check dough waste — overproofed dough is the #1 waste item in pizza shops.</li>
                      <li>Employee meals and untracked giveaways count as waste. Track them.</li>
                    </ol>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>,
        document.body
      )}
    </>
  );
}

export default function DailyPage() {
  return (
    <Suspense fallback={
  <div className="space-y-5">
    <div className="dashboard-toolbar p-4 sm:p-5 space-y-3 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-6 w-40 bg-muted/20 rounded" />
        <div className="h-10 w-32 bg-muted/20 rounded-lg" />
      </div>
      <div className="flex items-center gap-2">
        <div className="h-12 w-12 bg-muted/20 rounded-lg" />
        <div className="h-12 flex-1 bg-muted/20 rounded-lg" />
        <div className="h-12 w-12 bg-muted/20 rounded-lg" />
      </div>
    </div>
    <div className="dashboard-scoreboard rounded-lg border border-border/50 p-6 animate-pulse">
      <div className="h-3 w-16 bg-muted/20 rounded mx-auto mb-4" />
      <div className="h-16 w-32 bg-muted/20 rounded mx-auto" />
      <div className="h-3 w-24 bg-muted/20 rounded mx-auto mt-4" />
    </div>
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {[1,2,3].map((i) => (
        <div key={i} className="dashboard-scoreboard rounded-lg border border-border/50 p-4 animate-pulse">
          <div className="h-3 w-16 bg-muted/20 rounded mb-3" />
          <div className="h-8 w-20 bg-muted/20 rounded" />
        </div>
      ))}
    </div>
  </div>
}>
      <DailyPageContent />
    </Suspense>
  );
}
