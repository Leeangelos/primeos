"use client";

import { Suspense, useState, useMemo, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
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
import { getGradeBg, getGradeColor } from "@/src/lib/design-tokens";
import { useRedAlert } from "@/src/lib/useRedAlert";
import { EducationInfoIcon } from "@/src/components/education/InfoIcon";
import { ExportButton } from "@/src/components/ui/ExportButton";
import { formatPct as formatPctShared, formatDollars } from "@/src/lib/formatters";
import { SEED_DAILY_KPIS } from "@/src/lib/seed-data";

type WarningItem = { field: string; message: string; severity: "error" | "warning" | "info" };

const TRAILING_AVERAGES: Record<string, { sales: number; foodPct: number; laborPct: number }> = {
  monday: { sales: 3800, foodPct: 29.5, laborPct: 27.2 },
  tuesday: { sales: 3600, foodPct: 29.8, laborPct: 27.5 },
  wednesday: { sales: 4100, foodPct: 29.2, laborPct: 26.8 },
  thursday: { sales: 4400, foodPct: 29.4, laborPct: 26.5 },
  friday: { sales: 5800, foodPct: 28.8, laborPct: 25.2 },
  saturday: { sales: 6200, foodPct: 28.5, laborPct: 24.8 },
  sunday: { sales: 4600, foodPct: 29.0, laborPct: 26.0 },
};

function formatPct(n: number | null): string {
  if (n == null || Number.isNaN(n)) return "—";
  return formatPctShared(n);
}

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
const KPI_PRIMARY_BASE = "dashboard-scoreboard p-3 sm:p-6 transition-colors duration-200";
/** Secondary KPIs (Labor, Food+Disposables, SLPH): subordinate, consistent */
const KPI_SECONDARY_BASE = "dashboard-scoreboard p-3 sm:p-4 transition-colors duration-200";

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

/** Badge class for FC/LB: green, yellow, or red (lower is better). */
function getRecentEntryBadgeClass(pct: number, target: number): string {
  if (pct <= target) return "bg-emerald-900/50 text-emerald-400";
  if (pct <= target + 2) return "bg-amber-900/50 text-amber-400";
  return "bg-red-900/50 text-red-400";
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
  const [warnings, setWarnings] = useState<WarningItem[]>([]);
  const [storeChangeWarning, setStoreChangeWarning] = useState<string | null>(null);

  function validateEntries() {
    const newWarnings: WarningItem[] = [];
    const sales = parseFloat(netSales) || 0;
    const food = parseFloat(foodCost) || 0;
    const labor = parseFloat(laborCost) || 0;
    const disposables = parseFloat(disposablesCost) || 0;
    const transactions = parseFloat(tickets) || 0;
    const hours = parseFloat(laborHours) || 0;

    const dayOfWeek = new Date(businessDate + "T12:00:00Z").toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
    const avg = TRAILING_AVERAGES[dayOfWeek] ?? TRAILING_AVERAGES.wednesday;

    if (sales < 0 || food < 0 || labor < 0) {
      newWarnings.push({ field: "general", message: "Numbers can't be negative. Check your entries.", severity: "error" });
    }

    if (sales > 500000) {
      newWarnings.push({
        field: "sales",
        message: "Sales over $500,000 in a single day seems incorrect. Double-check this number.",
        severity: "error",
      });
    }

    if (sales > 0 && (sales > avg.sales * 2 || sales < avg.sales * 0.5)) {
      const dayName = dayOfWeek.charAt(0).toUpperCase() + dayOfWeek.slice(1);
      newWarnings.push({
        field: "sales",
        message: `Today's sales (${formatDollars(sales)}) are ${sales > avg.sales * 2 ? "significantly higher" : "significantly lower"} than your typical ${dayName} (${formatDollars(avg.sales)}). Double-check this number.`,
        severity: "warning",
      });
    }

    if (sales > 0 && food > 0) {
      const foodPct = (food / sales) * 100;
      if (foodPct > 45) {
        newWarnings.push({
          field: "food",
          message: `Food cost at ${formatPctShared(foodPct)} is extremely high. Verify the food purchases amount.`,
          severity: "warning",
        });
      }
      if (foodPct < 15 && foodPct > 0) {
        newWarnings.push({
          field: "food",
          message: `Food cost at ${formatPctShared(foodPct)} is unusually low. Did you miss an invoice?`,
          severity: "warning",
        });
      }
    }

    if (sales > 0 && labor > 0) {
      const laborPct = (labor / sales) * 100;
      if (laborPct > 35) {
        newWarnings.push({
          field: "labor",
          message: `Labor at ${formatPctShared(laborPct)} is outside the typical range (20-32%). Verify hours and sales.`,
          severity: "warning",
        });
      }
      if (laborPct < 10 && laborPct > 0) {
        newWarnings.push({
          field: "labor",
          message: `Labor at ${formatPctShared(laborPct)} seems too low. Are all employees accounted for?`,
          severity: "warning",
        });
      }
    }

    if (sales > 0) {
      if (food === 0) {
        newWarnings.push({
          field: "food",
          message:
            "Food purchases is $0. If the store was open, there were likely food costs. Enter $0 only if no deliveries or purchases were made today.",
          severity: "info",
        });
      }
      if (labor === 0) {
        newWarnings.push({
          field: "labor",
          message: "Labor cost is $0. Did you mean to enter $0? If the store was open, there should be labor costs.",
          severity: "info",
        });
      }
      if (transactions === 0) {
        newWarnings.push({
          field: "transactions",
          message: "Transaction count is 0 but sales are entered. How many transactions?",
          severity: "info",
        });
      }
      if (hours === 0) {
        newWarnings.push({
          field: "hours",
          message: "Total hours is 0 but sales are entered. How many labor hours?",
          severity: "info",
        });
      }
    }

    const entryDate = new Date(businessDate + "T12:00:00Z");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (entryDate > today) {
      newWarnings.push({ field: "date", message: "Can't enter data for a future date.", severity: "error" });
    }

    const daysOld = Math.floor((today.getTime() - entryDate.getTime()) / 86400000);
    if (daysOld > 7) {
      newWarnings.push({
        field: "date",
        message: `You're entering data for ${daysOld} days ago. Make sure this is intentional.`,
        severity: "warning",
      });
    }

    setWarnings(newWarnings);
  }

  useEffect(() => {
    const timer = setTimeout(validateEntries, 500);
    return () => clearTimeout(timer);
  }, [netSales, foodCost, laborCost, disposablesCost, tickets, laborHours, businessDate]);

  function handleStoreChange(newStore: CockpitStoreSlug) {
    setStoreId(newStore);
    if (typeof window !== "undefined") window.localStorage.setItem("primeos-last-store", newStore);
    if (netSales || foodCost || laborCost) {
      setStoreChangeWarning(newStore);
      setTimeout(() => setStoreChangeWarning(null), 3000);
    }
  }

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

  function updateFormField(field: string, value: number) {
    const str = String(value);
    if (field === "sales") setNetSales(str);
    else if (field === "food") setFoodCost(str);
    else if (field === "labor") setLaborCost(str);
    else if (field === "disposables") setDisposablesCost(str);
    else if (field === "transactions") setTickets(str);
    else if (field === "hours") setLaborHours(str);
  }

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
      gpPct,
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

  const dailyGrades = useMemo((): string[] => {
    const toGrade = (s: CockpitStatusLabel | null) =>
      s === "over" ? "red" : s === "under" ? "yellow" : "green";
    return [
      toGrade(foodDispStatus),
      toGrade(laborStatus),
      toGrade(primeStatus),
    ];
  }, [foodDispStatus, laborStatus, primeStatus]);
  useRedAlert(dailyGrades);

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

  const recentEntries = useMemo(() => {
    const forStore = SEED_DAILY_KPIS.filter((r) => r.store_id === storeId);
    return forStore.slice(-7).reverse();
  }, [storeId]);

  const inputCls =
    "w-full min-h-[44px] h-11 px-3 text-sm font-medium tabular-nums placeholder:text-muted focus:border-brand/60 focus:ring-1 focus:ring-brand/40 focus:outline-none rounded-xl border bg-slate-700 text-white dashboard-input";

  const { isOldDate, diffDays } = useMemo(() => {
    const selectedDate = new Date(businessDate + "T12:00:00Z");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);
    const diff = Math.floor((today.getTime() - selectedDate.getTime()) / (1000 * 60 * 60 * 24));
    return { isOldDate: diff > 7, diffDays: diff };
  }, [businessDate]);

  const getInputBorder = useCallback(
    (fieldName: string) => {
      const w = warnings.find((x) => x.field === fieldName);
      if (!w) return "border-slate-600";
      return w.severity === "error" ? "border-red-500" : "border-amber-500";
    },
    [warnings]
  );

  return (
    <>
      <div className="space-y-5 min-w-0 overflow-x-hidden pb-28">
      {/* Toolbar */}
      <div className={`dashboard-toolbar p-3 sm:p-5 space-y-3 ${getStoreColor(storeId).glow}`}>
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold sm:text-2xl">Daily KPI Entry</h1>
            <button type="button" onClick={() => setShowEducation("overview")} className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-full bg-muted/20 text-muted hover:bg-brand/20 hover:text-brand transition-colors text-xs font-bold" aria-label="Learn more">i</button>
            <ExportButton
              pageName="Daily KPIs"
              getData={() => ({
                headers: ["Date", "Sales", "Food", "Labor", "Disposables", "Transactions", "Hours"],
                rows: [[businessDate, netSales || "", foodCost || "", laborCost || "", disposablesCost || "", tickets || "", laborHours || ""]],
              })}
            />
          </div>
          <select
            value={storeId}
            onChange={(e) => handleStoreChange(e.target.value as CockpitStoreSlug)}
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
                onClick={() => handleStoreChange(id)}
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
        <div className={cn("rounded-lg border px-1 min-w-0", isOldDate ? "border-amber-500" : "border-border/50")}>
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={() => setBusinessDate(prevDay(businessDate))}
              className="rounded-lg border border-border/50 bg-black/30 min-h-[44px] min-w-[44px] flex items-center justify-center text-base font-medium text-muted hover:border-border hover:bg-black/40 hover:text-white active:bg-black/50 shrink-0"
              aria-label="Previous day"
            >
              ←
            </button>
            <div className="flex-1 text-center min-w-0">
              <div className="text-[10px] uppercase tracking-wider text-muted/70 mb-0.5">Business Date</div>
              <div className="text-sm font-medium text-white">
                {new Date(businessDate + "T12:00:00Z").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setBusinessDate(nextDay(businessDate))}
              className="rounded-lg border border-border/50 bg-black/30 min-h-[44px] min-w-[44px] flex items-center justify-center text-base font-medium text-muted hover:border-border hover:bg-black/40 hover:text-white active:bg-black/50 shrink-0"
              aria-label="Next day"
            >
              →
            </button>
          </div>
          {isOldDate && (
            <div className="flex items-center gap-2 mt-1 px-2 pb-1">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
              <p className="text-xs text-amber-400">This date is {diffDays} days ago. Double-check you&apos;re entering the right day.</p>
            </div>
          )}
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
                  className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-full bg-muted/20 text-muted hover:bg-brand/20 hover:text-brand transition-colors text-xs font-bold"
                  aria-label="Learn more"
                >
                  i
                </button>
              </div>
              <div
                className={cn(
                  "mt-4 sm:mt-8 text-4xl sm:text-7xl font-black tabular-nums tracking-tight sm:text-8xl leading-none",
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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
                      className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-full bg-muted/20 text-muted hover:bg-brand/20 hover:text-brand transition-colors text-xs font-bold"
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
                    <div className="text-xs text-muted/60 mt-1">7-day avg: {formatPct(100 - rolling.primePct)}</div>
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
      <div className="border-t border-border/40 pt-6 min-w-0">
        <div className="dashboard-surface p-4 sm:p-5 space-y-5 max-w-full overflow-x-hidden">
          <h2 className="text-sm font-medium text-muted">Enter numbers</h2>
          <div className="grid grid-cols-1 gap-4 max-w-full min-w-0">
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2">
                <label htmlFor="daily-net-sales" className="text-xs text-slate-400">Sales ($)</label>
                <EducationInfoIcon metricKey="daily_sales" />
              </div>
              <input
                id="daily-net-sales"
                type="number"
                inputMode="decimal"
                placeholder="e.g., 5420.00"
                value={netSales}
                onChange={(e) => setNetSales(e.target.value)}
                className={cn(inputCls, netSalesInvalid ? "border-red-500" : getInputBorder("sales"), "text-emerald-400")}
              />
            </div>

            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2">
                <label htmlFor="daily-food" className="text-xs text-slate-400">Food ($)</label>
                <EducationInfoIcon metricKey="food_cost" />
              </div>
              <input
                id="daily-food"
                type="number"
                inputMode="decimal"
                placeholder="e.g., 1670.00"
                value={foodCost}
                onChange={(e) => setFoodCost(e.target.value)}
                className={cn(inputCls, getInputBorder("food"), "text-red-400")}
              />
            </div>

            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2">
                <label htmlFor="daily-labor" className="text-xs text-slate-400">Labor ($)</label>
                <EducationInfoIcon metricKey="labor_pct" />
              </div>
              <input
                id="daily-labor"
                type="number"
                inputMode="decimal"
                placeholder="e.g., 1252.00"
                value={laborCost}
                onChange={(e) => setLaborCost(e.target.value)}
                className={cn(inputCls, getInputBorder("labor"), "text-red-400")}
              />
            </div>

            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2">
                <label htmlFor="daily-disposables" className="text-xs text-slate-400">Disposables ($)</label>
                <EducationInfoIcon metricKey="prime_cost" />
              </div>
              <input
                id="daily-disposables"
                type="number"
                inputMode="decimal"
                placeholder="e.g., 190.00"
                value={disposablesCost}
                onChange={(e) => setDisposablesCost(e.target.value)}
                className={cn(inputCls, getInputBorder("disposables"), "text-red-400")}
              />
            </div>

            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2">
                <label htmlFor="daily-transactions" className="text-xs text-slate-400">Transactions</label>
                <EducationInfoIcon metricKey="ticket_avg" />
              </div>
              <input
                id="daily-transactions"
                type="number"
                inputMode="decimal"
                placeholder="e.g., 287"
                value={tickets}
                onChange={(e) => setTickets(e.target.value)}
                className={cn(inputCls, getInputBorder("transactions"), "text-white")}
              />
            </div>

            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2">
                <label htmlFor="daily-hours" className="text-xs text-slate-400">Hours Worked</label>
                <EducationInfoIcon metricKey="slph" />
              </div>
              <input
                id="daily-hours"
                type="number"
                inputMode="decimal"
                placeholder="e.g., 86.5"
                value={laborHours}
                onChange={(e) => setLaborHours(e.target.value)}
                className={cn(inputCls, getInputBorder("hours"), "text-white")}
              />
            </div>
          </div>

          {warnings.length > 0 && (
            <div className="space-y-2 mb-4">
              {warnings.map((w, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-2 p-3 rounded-xl border ${
                    w.severity === "error"
                      ? "bg-red-600/10 border-red-700/30"
                      : w.severity === "warning"
                        ? "bg-amber-600/10 border-amber-700/30"
                        : "bg-blue-600/10 border-blue-700/30"
                  }`}
                >
                  <AlertTriangle
                    className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                      w.severity === "error" ? "text-red-400" : w.severity === "warning" ? "text-amber-400" : "text-blue-400"
                    }`}
                  />
                  <p
                    className={`text-xs ${
                      w.severity === "error" ? "text-red-300" : w.severity === "warning" ? "text-amber-300" : "text-blue-300"
                    }`}
                  >
                    {w.message}
                  </p>
                </div>
              ))}
            </div>
          )}

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
                  setEntry(data.entry ?? null);
                  setTimeout(() => setSaveStatus("idle"), 2000);
                } else {
                  setSaveStatus("error");
                }
              } catch {
                setSaveStatus("error");
              }
            }}
            disabled={saveStatus === "saving" || !canSave}
            className="w-full min-h-[48px] h-12 rounded-xl font-semibold text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 transition-colors disabled:opacity-50 disabled:pointer-events-none"
          >
            {saveStatus === "saving" ? "Saving…" : saveStatus === "saved" ? "✓ Saved" : "Calculate & Save"}
          </button>

          {(entry || (ns != null && ns > 0 && computed.primePct != null)) && (
            <div className="bg-slate-800/80 rounded-xl p-4 border border-slate-700 space-y-3 min-w-0">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">Calculated grades</h3>
              {[
                {
                  label: "Food Cost %",
                  value: ns != null && ns > 0 && fc != null ? formatPct((fc / ns) * 100) : "—",
                  target: "28–31%",
                  gradeKey: "food_cost",
                  valueNum: ns != null && ns > 0 && fc != null ? (fc / ns) * 100 : null,
                  direction: "lower_is_better" as const,
                  targetNum: 31,
                },
                {
                  label: "Labor %",
                  value: formatPct(computed.laborPct),
                  target: targets.laborMin != null ? `${targets.laborMin}–${targets.laborMax}%` : `≤${targets.laborMax}%`,
                  gradeKey: "labor_pct",
                  valueNum: computed.laborPct,
                  direction: "lower_is_better" as const,
                  targetNum: targets.laborMax,
                },
                {
                  label: "PRIME %",
                  value: formatPct(computed.primePct),
                  target: `≤${targets.primeMax}%`,
                  gradeKey: "prime_cost",
                  valueNum: computed.primePct,
                  direction: "lower_is_better" as const,
                  targetNum: targets.primeMax,
                },
                {
                  label: "SLPH",
                  value: formatSlph(lh, computed.slph),
                  target: `${targets.slphMin}+`,
                  gradeKey: "slph",
                  valueNum: computed.slph,
                  direction: "higher_is_better" as const,
                  targetNum: targets.slphMin,
                },
                {
                  label: "Avg Ticket",
                  value: computed.avgTicket != null ? `$${computed.avgTicket.toFixed(2)}` : "—",
                  target: "—",
                  gradeKey: "ticket_avg",
                  valueNum: computed.avgTicket,
                  direction: "higher_is_better" as const,
                  targetNum: null,
                },
              ].map(({ label, value, target, gradeKey, valueNum, direction, targetNum }) => (
                <div key={gradeKey} className="flex items-center justify-between gap-2 py-2 border-b border-slate-700/80 last:border-0 min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm text-slate-300">{label}</span>
                    <EducationInfoIcon metricKey={gradeKey} />
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm font-medium tabular-nums text-white">{value}</span>
                    {valueNum != null && targetNum != null && (
                      <span
                        className={cn("rounded px-2 py-0.5 text-xs font-medium", getGradeBg(valueNum, targetNum, direction))}
                        style={{ color: getGradeColor(valueNum, targetNum, direction) }}
                      >
                        {direction === "lower_is_better"
                          ? valueNum <= targetNum
                            ? "On track"
                            : valueNum <= targetNum + 2
                              ? "Caution"
                              : "Over"
                          : valueNum >= targetNum
                            ? "On track"
                            : valueNum >= targetNum - 2
                              ? "Caution"
                              : "Under"}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <details className="dashboard-surface rounded-lg border border-border/50 overflow-hidden">
            <summary className="p-3 text-sm text-muted cursor-pointer select-none">Optional: Voids, Waste, Scheduled Hours, Notes</summary>
            <div className="px-3 pb-3 pt-1 space-y-3 border-t border-border/40">
              <label className="block min-w-0">
                <span className="block text-sm text-slate-400">Voids ($)</span>
                <input type="number" inputMode="decimal" placeholder="e.g., 0" value={voidAmount} onChange={(e) => setVoidAmount(e.target.value)} className={inputCls} />
              </label>
              <label className="block min-w-0">
                <span className="block text-sm text-slate-400">Waste ($)</span>
                <input type="number" inputMode="decimal" placeholder="e.g., 0" value={waste} onChange={(e) => setWaste(e.target.value)} className={inputCls} />
              </label>
              <label className="block min-w-0">
                <span className="block text-sm text-slate-400">Scheduled Hours</span>
                <input type="number" inputMode="decimal" placeholder="—" value={scheduledHours} onChange={(e) => setScheduledHours(e.target.value)} className={inputCls} />
              </label>
              <label className="block min-w-0">
                <span className="block text-sm text-slate-400">Avg Bump Time (min)</span>
                <input type="number" inputMode="decimal" placeholder="—" value={bumpTimeMinutes} onChange={(e) => setBumpTimeMinutes(e.target.value)} className={inputCls} />
              </label>
              <label className="block min-w-0">
                <span className="block text-sm text-slate-400">Notes</span>
                <textarea placeholder="Optional notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className={cn(inputCls, "resize-y min-h-[4rem] h-auto py-3")} />
              </label>
            </div>
          </details>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            {saveStatus === "error" && <span className="text-sm text-red-400">Error saving — try again</span>}
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
                    if (data.ok) setAcknowledged(data.acknowledged_at);
                  } catch {}
                  setAckLoading(false);
                }}
                disabled={ackLoading}
                className="rounded-lg border border-emerald-500/50 bg-emerald-500/15 px-5 py-3 text-sm font-semibold text-emerald-400 hover:bg-emerald-500/25 disabled:opacity-50 min-h-[44px]"
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

          {recentEntries.length > 0 && (
            <div className="pt-6 border-t border-slate-700/80 min-w-0">
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">Recent Entries</h3>
              <div className="rounded-xl border border-slate-700 overflow-hidden bg-slate-800/50">
                {recentEntries.map((row) => (
                  <Link
                    key={row.date}
                    href={`/daily?store=${encodeURIComponent(storeId)}&date=${encodeURIComponent(row.date)}`}
                    className="flex items-center justify-between py-3 px-4 border-b border-slate-700 last:border-b-0 active:bg-slate-700/50 transition-colors min-w-0"
                  >
                    <div className="min-w-0">
                      <div className="text-sm text-white font-medium">
                        {new Date(row.date + "T12:00:00Z").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                      </div>
                      <div className="text-xs text-slate-400">
                        ${row.sales.toLocaleString("en-US", { maximumFractionDigits: 0 })} · {row.transactions} tickets
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", getRecentEntryBadgeClass(row.food_cost_pct, 31))}>
                        FC {formatPct(row.food_cost_pct)}
                      </span>
                      <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", getRecentEntryBadgeClass(row.labor_pct, 22))}>
                        LB {formatPct(row.labor_pct)}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
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
            className="relative w-full max-w-md mx-auto rounded-2xl border border-border bg-[#0d0f13] p-4 sm:p-5 shadow-2xl overflow-y-auto max-h-[85vh] min-w-0"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowEducation(null)}
              className="absolute top-3 right-3 min-h-[44px] min-w-[44px] flex items-center justify-center text-muted hover:text-white text-lg -mr-2"
              aria-label="Close"
            >
              ✕
            </button>

            {showEducation === "overview" && (
              <div>
                <h3 className="text-base font-semibold text-brand mb-1">🎓 Daily KPIs & PRIME %</h3>
                <p className="text-xs text-muted mb-4">What you enter, what it means, and what to consider when numbers go red.</p>
                <div className="space-y-3 text-sm">
                  <div>
                    <h4 className="font-medium text-white mb-1">What Daily KPIs Are</h4>
                    <p className="text-muted text-xs leading-relaxed">You enter one day's numbers: net sales, labor dollars, food, disposables, voids, waste, labor hours. PrimeOS turns that into PRIME % (labor + food + disposables as % of sales), labor %, food+disposables %, and SLPH (sales per labor hour). One bad day here is a signal. A week of red is a $2K+ problem.</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-white mb-1">How PRIME % Works</h4>
                    <p className="text-muted text-xs leading-relaxed">PRIME % is the single number that tells you if you made money after the big three costs. Target is usually 55% or below for LeeAngelo's, 60% for Lindsey's. Over that and you're leaving money on the table. Tap the (i) on each metric for the full playbook.</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-white mb-1">Red Playbooks in Short</h4>
                    <p className="text-muted text-xs leading-relaxed"><strong>Food cost red:</strong> Consider checking portioning, waste, and the last invoice — someone may have raised a price. <strong>Labor red:</strong> Consider trimming overlap, adjusting a shift, or reviewing scheduling. <strong>Voids red:</strong> Many operators start by reviewing POS process; comps and walkouts add up. <strong>Waste red:</strong> Consider prepping to par, checking dates, and reviewing the line. Tap each metric's (i) for the full playbook.</p>
                  </div>
                </div>
              </div>
            )}
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
                    <p className="text-muted text-xs leading-relaxed">If PRIME is 60% and fixed costs are 30%, Net Profit = 10%. Drop PRIME to 55% and Net Profit doubles to 15%. On $5K/day, every point = $50/day = $1,500/month.</p>
                  </div>
                  <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-3">
                    <h4 className="font-medium text-red-400 text-xs mb-2">📕 When PRIME Goes RED</h4>
                    <ol className="space-y-1.5 text-muted text-xs list-decimal list-inside leading-relaxed">
                      <li>Consider checking last 3 vendor deliveries for price increases.</li>
                      <li>Consider weighing 10 cheese portions on 16" pies vs recipe spec.</li>
                      <li>Consider running a 48-hour waste log — track everything thrown away.</li>
                      <li>Consider comparing scheduled vs actual clock-in/out times.</li>
                      <li>Consider checking shift overlaps — closer/driver overlap can be $15-20/day wasted.</li>
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
                      <li>Consider comparing scheduled hours to actual clock-in/out. Look for early ins and late outs.</li>
                      <li>Consider checking shift overlaps — closer/late driver overlap is most common ($15-20/day wasted).</li>
                      <li>Consider reviewing SLPH. Below 65 often means too many people for the volume.</li>
                      <li>Consider checking last 4 of same weekday — pattern or one-off? Patterns often need restructuring.</li>
                      <li>Consider reviewing overtime — anyone over 40hrs costs 1.5x. Redistributing may be cheaper.</li>
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
                      <li>Consider checking last 3 vendor deliveries for price increases vs previous invoices.</li>
                      <li>Consider observing the prep line. Consider weighing 10 cheese portions on 16" pies vs recipe spec.</li>
                      <li>Consider running a 48-hour waste log. Track everything thrown away with a reason.</li>
                      <li>Consider comparing theoretical cost (recipe) vs actual (purchases ÷ units sold) on top 5 items.</li>
                      <li>Consider checking for vendor substitutions — distributors sometimes sub higher-cost items.</li>
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
                      <li>Consider calculating: Total Sales ÷ Total Labor Hours. Below 65 = low productivity.</li>
                      <li>Consider checking if it was a slow day or overstaffed. If sales were normal, you may have scheduled too many people.</li>
                      <li>Consider reviewing each position — did you need both a mid-shift AND a closer?</li>
                      <li>Cross-reference with customer traffic patterns from POS data.</li>
                      <li>Consider building an SLPH target by day-of-week. Mon/Tue may need different staffing than Fri/Sat.</li>
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
                      <li>Consider pulling void report by employee. Is one person responsible for most voids?</li>
                      <li>Consider checking void timing — end of shift voids are a red flag.</li>
                      <li>Consider reviewing reasons — "wrong order" repeatedly can indicate an order-taking training issue.</li>
                      <li>Consider comparing voids by day — certain shifts may need more supervision.</li>
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
                    <p className="text-muted text-xs leading-relaxed">GP % = 100% − PRIME %. If PRIME is 55%, GP is 45%. This is the money left to cover rent, insurance, utilities, and Net Profit.</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-white mb-1">Why It Matters</h4>
                    <p className="text-muted text-xs leading-relaxed">Most pizzerias have 25-35% in fixed costs. If GP is 45% and fixed costs are 30%, Net Profit is 15%. If GP drops to 40%, Net Profit is 10% — a 33% pay cut to the business. Every point of GP is a point of Net Profit.</p>
                  </div>
                  <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-3">
                    <h4 className="font-medium text-red-400 text-xs mb-2">📕 When GP Goes RED (&lt; 40%)</h4>
                    <ol className="space-y-1.5 text-muted text-xs list-decimal list-inside leading-relaxed">
                      <li>GP is the inverse of PRIME — addressing PRIME is usually the fastest way to lift GP.</li>
                      <li>Consider checking which component is dragging PRIME up: labor, food, or disposables.</li>
                      <li>Consider running the PRIME playbook for whichever component is over target.</li>
                      <li>Consider reviewing pricing — when was your last menu price increase?</li>
                      <li>Consider calculating: every 1% GP improvement on $100K/month = $1,000/month more to Net Profit.</li>
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
                      <li>Consider running a 48-hour waste log. Write down every item thrown away with a reason.</li>
                      <li>Consider checking prep quantities vs actual sales. Are you prepping Saturday amounts on Tuesday?</li>
                      <li>Consider reviewing walk-in organization — FIFO (first in, first out) prevents expiration.</li>
                      <li>Consider checking dough waste — overproofed dough is the #1 waste item in pizza shops.</li>
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
