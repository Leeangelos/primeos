"use client";

import { useState, useMemo } from "react";
import {
  Building2,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CreditCard,
  Home as HomeIcon,
  ChevronDown,
  Plus,
} from "lucide-react";
import { useAuth } from "@/src/lib/auth-context";
import { isNewUser } from "@/src/lib/user-scope";
import {
  VENDORS,
  VENDOR_COSTS,
  getVendorsByStore,
  getVendorMonthlySummary,
  getVendorCostsByVendor,
  getVendorCostForMonth,
  STORE_DETAILS,
  type VendorCost,
} from "@/src/lib/vendor-data";
import { formatPct, formatDollars } from "@/src/lib/formatters";
import { EducationInfoIcon } from "@/src/components/education/InfoIcon";
import { DataDisclaimer } from "@/src/components/ui/DataDisclaimer";
import { SEED_STORES } from "@/src/lib/seed-data";

const STORE_REVENUE: Record<string, number> = { kent: 44000, aurora: 52000, lindseys: 32000 };
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const STORE_NAMES: Record<string, string> = { kent: "LeeAngelo's Kent", aurora: "LeeAngelo's Aurora", lindseys: "Lindsey's" };

/** CC processing per store: quoted rate and actual volume/fees for actual rate calculation. Actual rate = (monthly_fees / monthly_volume) * 100 */
const CC_PROCESSING_BY_STORE: Record<string, { processorName: string; quotedRatePct: number; monthlyVolume: number; monthlyFees: number }> = {
  kent: { processorName: "Square", quotedRatePct: 2.6, monthlyVolume: 85000, monthlyFees: 2380 },
  aurora: { processorName: "Square", quotedRatePct: 2.6, monthlyVolume: 102000, monthlyFees: 2856 },
  lindseys: { processorName: "Square", quotedRatePct: 2.5, monthlyVolume: 52000, monthlyFees: 1456 },
};

const STORE_OPTIONS = SEED_STORES.map((s) => ({ value: s.slug, label: s.name }));

// 12 months Mar 2025 – Feb 2026 for annual view
const ANNUAL_MONTHS: { month: number; year: number; short: string }[] = [];
for (let i = 0; i < 12; i++) {
  const m = i < 10 ? i + 3 : i - 9;
  const y = m >= 3 ? 2025 : 2026;
  ANNUAL_MONTHS.push({ month: m, year: y, short: `${MONTH_NAMES[m - 1]} '${String(y).slice(-2)}` });
}

function getMonthLabel(month: number, year: number): string {
  return `${MONTH_NAMES[month - 1]} ${year}`;
}

function prevMonth(month: number, year: number): { month: number; year: number } {
  if (month === 1) return { month: 12, year: year - 1 };
  return { month: month - 1, year };
}

function nextMonth(month: number, year: number): { month: number; year: number } {
  if (month === 12) return { month: 1, year: year + 1 };
  return { month: month + 1, year };
}

export default function VendorTrackerPage() {
  const { session } = useAuth();
  const newUser = isNewUser(session);
  const [selectedStore, setSelectedStore] = useState("kent");
  const [selectedMonth, setSelectedMonth] = useState(2);
  const [selectedYear, setSelectedYear] = useState(2026);
  const [expandedVendor, setExpandedVendor] = useState<string | null>(null);
  const [view, setView] = useState<"movers" | "all" | "annual" | "cc" | "occupancy">("movers");
  const [showAddEntry, setShowAddEntry] = useState(false);
  const [entryVendorId, setEntryVendorId] = useState("");
  const [entryAmount, setEntryAmount] = useState("");
  const [entryDate, setEntryDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [entryInvoice, setEntryInvoice] = useState("");
  const [addedEntries, setAddedEntries] = useState<VendorCost[]>([]);
  const [saveToast, setSaveToast] = useState(false);
  const [showQuickInvoice, setShowQuickInvoice] = useState(false);
  const [quickVendorName, setQuickVendorName] = useState("");
  const [quickInvoiceDate, setQuickInvoiceDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [quickTotal, setQuickTotal] = useState("");
  const [quickSaving, setQuickSaving] = useState(false);
  const [quickToast, setQuickToast] = useState<"idle" | "saved" | "error">("idle");
  const [quickErrorDetail, setQuickErrorDetail] = useState<string | null>(null);

  const storeVendors = useMemo(() => getVendorsByStore(selectedStore), [selectedStore]);
  const allCosts = useMemo(() => [...VENDOR_COSTS, ...addedEntries], [addedEntries]);

  function getCostForMonth(vendorId: string, month: number, year: number): number {
    const e = allCosts.find((c) => c.vendor_id === vendorId && c.month === month && c.year === year);
    return e ? e.amount : 0;
  }

  function getCostsByVendorWithAdded(vendorId: string): VendorCost[] {
    const base = getVendorCostsByVendor(vendorId);
    const added = addedEntries.filter((e) => e.vendor_id === vendorId);
    const byKey = new Map<string, VendorCost>();
    base.forEach((c) => byKey.set(`${c.month}-${c.year}`, c));
    added.forEach((c) => byKey.set(`${c.month}-${c.year}`, c));
    return Array.from(byKey.values()).sort((a, b) => (a.year !== b.year ? a.year - b.year : a.month - b.month));
  }

  const summary = useMemo(() => {
    const vendors = getVendorsByStore(selectedStore);
    const costs = allCosts.filter((c) => c.store_id === selectedStore);
    const prevMonth = selectedMonth === 1 ? 12 : selectedMonth - 1;
    const prevYear = selectedMonth === 1 ? selectedYear - 1 : selectedYear;
    return vendors
      .map((v) => {
        const current = costs.find((c) => c.vendor_id === v.id && c.month === selectedMonth && c.year === selectedYear);
        const prev = costs.find((c) => c.vendor_id === v.id && c.month === prevMonth && c.year === prevYear);
        const amount = current?.amount ?? 0;
        const prevAmount = prev?.amount ?? 0;
        const change = amount - prevAmount;
        const changePct = prevAmount > 0 ? (change / prevAmount) * 100 : 0;
        return { vendorId: v.id, vendorName: v.vendor_name, category: v.category, amount, prevAmount, change, changePct };
      })
      .filter((v) => v.amount > 0 || v.prevAmount > 0);
  }, [selectedStore, selectedMonth, selectedYear, allCosts]);

  const totalThisMonth = useMemo(() => summary.reduce((s, v) => s + v.amount, 0), [summary]);
  const totalPrevMonth = useMemo(() => summary.reduce((s, v) => s + v.prevAmount, 0), [summary]);
  const totalChange = totalThisMonth - totalPrevMonth;
  const totalChangePct = totalPrevMonth > 0 ? (totalChange / totalPrevMonth) * 100 : 0;

  const biggestIncrease = useMemo(() => {
    const withIncrease = summary.filter((v) => v.changePct > 0);
    return withIncrease.length ? withIncrease.reduce((a, b) => (b.changePct > a.changePct ? b : a)) : null;
  }, [summary]);
  const biggestDecrease = useMemo(() => {
    const withDecrease = summary.filter((v) => v.changePct < 0);
    return withDecrease.length ? withDecrease.reduce((a, b) => (b.changePct < a.changePct ? b : a)) : null;
  }, [summary]);
  const unchangedCount = useMemo(() => summary.filter((v) => Math.abs(v.changePct) <= 1).length, [summary]);

  const topMovers = useMemo(() => {
    return [...summary]
      .filter((v) => Math.abs(v.changePct) > 3)
      .sort((a, b) => Math.abs(b.changePct) - Math.abs(a.changePct));
  }, [summary]);

  const allVendorsSorted = useMemo(() => [...summary].sort((a, b) => b.amount - a.amount), [summary]);

  const vendorsForAnnual = useMemo(() => getVendorsByStore(selectedStore), [selectedStore]);

  const squareVendorId = useMemo(() => {
    const v = VENDORS.find((x) => x.store_id === selectedStore && x.category === "Credit Card Processing");
    return v?.id ?? null;
  }, [selectedStore]);

  const processingFees = useMemo(() => {
    if (!squareVendorId) return 0;
    return getCostForMonth(squareVendorId, selectedMonth, selectedYear);
  }, [squareVendorId, selectedMonth, selectedYear, allCosts]);

  const estCardSales = useMemo(() => {
    const rev = STORE_REVENUE[selectedStore] ?? 40000;
    return Math.round(rev * 0.75);
  }, [selectedStore]);

  const effectiveRate = useMemo(() => {
    if (estCardSales <= 0) return 0;
    return (processingFees / estCardSales) * 100;
  }, [processingFees, estCardSales]);

  const last6Months = useMemo(() => {
    if (!squareVendorId) return [];
    const result: { month: number; year: number; label: string; rate: number }[] = [];
    let m = selectedMonth;
    let y = selectedYear;
    for (let i = 0; i < 6; i++) {
      const fees = getCostForMonth(squareVendorId, m, y);
      const rev = STORE_REVENUE[selectedStore] ?? 40000;
      const cardSales = rev * 0.75;
      const rate = cardSales > 0 ? (fees / cardSales) * 100 : 0;
      result.unshift({ month: m, year: y, label: getMonthLabel(m, y), rate });
      const prev = prevMonth(m, y);
      m = prev.month;
      y = prev.year;
    }
    return result;
  }, [squareVendorId, selectedMonth, selectedYear, selectedStore, allCosts]);

  function handleSaveEntry() {
    const amt = parseFloat(entryAmount);
    if (!entryVendorId || Number.isNaN(amt) || !entryDate) return;

    const dateObj = new Date(entryDate);
    const newEntry: VendorCost = {
      id: "vc-new-" + Date.now(),
      store_id: selectedStore,
      vendor_id: entryVendorId,
      amount: Math.round(amt * 100) / 100,
      date: entryDate,
      month: dateObj.getMonth() + 1,
      year: dateObj.getFullYear(),
      invoice_number: entryInvoice,
      notes: "Manually entered",
    };

    setAddedEntries((prev) => [...prev, newEntry]);

    setEntryVendorId("");
    setEntryAmount("");
    setEntryDate(new Date().toISOString().split("T")[0]);
    setEntryInvoice("");
    setShowAddEntry(false);

    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 3000);
  }

  const details = STORE_DETAILS[selectedStore];
  const monthlyRev = STORE_REVENUE[selectedStore] ?? 40000;
  const rent = details?.monthlyRent ?? 0;
  const sqft = details?.sqft ?? 1500;
  const leaseRenewal = details?.leaseRenewal ?? "—";
  const occPct = monthlyRev > 0 ? (rent / monthlyRev) * 100 : 0;
  const revPerSqft = sqft > 0 ? monthlyRev / sqft : 0;
  const rentPerSqft = sqft > 0 ? rent / sqft : 0;
  const profitPerSqft = revPerSqft - rentPerSqft;

  return (
    <div className="space-y-4 pb-28 min-w-0 overflow-x-hidden">
      {(saveToast || quickToast !== "idle") && (
        <div className="fixed bottom-20 left-4 right-4 z-50 bg-emerald-600/20 border border-emerald-700/50 rounded-xl px-4 py-2.5 shadow-lg text-center">
          <p className="text-xs text-emerald-300 font-medium">
            {quickToast === "saved"
              ? "Invoice logged"
              : quickToast === "error"
                ? quickErrorDetail || "Could not log invoice"
                : "Vendor entry saved"}
          </p>
        </div>
      )}

      {showAddEntry && (
        <>
          <div className="fixed inset-0 bg-black/60 z-50" onClick={() => setShowAddEntry(false)} />
          <div className="fixed inset-x-0 bottom-0 z-50 bg-slate-800 rounded-t-2xl border-t border-slate-700 p-5 pb-28 max-h-[80vh] overflow-y-auto animate-slide-up">
            <div className="w-10 h-1 bg-slate-600 rounded-full mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white mb-4">Quick Vendor Entry</h3>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-500 mb-1 block">Vendor</label>
                <select
                  value={entryVendorId}
                  onChange={(e) => setEntryVendorId(e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 rounded-xl text-sm text-white h-11 px-3"
                >
                  <option value="">Select vendor...</option>
                  {storeVendors.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.vendor_name} — {v.category}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-500 mb-1 block">Amount ($)</label>
                <input
                  type="number"
                  inputMode="decimal"
                  value={entryAmount}
                  onChange={(e) => setEntryAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-slate-700 border border-slate-600 rounded-xl text-sm text-white h-11 px-3"
                />
              </div>

              <div>
                <label className="text-xs text-slate-500 mb-1 block">Date</label>
                <input
                  type="date"
                  value={entryDate}
                  onChange={(e) => setEntryDate(e.target.value)}
                  className="w-full bg-slate-700 border border-slate-600 rounded-xl text-sm text-white h-11 px-3"
                />
              </div>

              <div>
                <label className="text-xs text-slate-500 mb-1 block">Invoice # (optional)</label>
                <input
                  type="text"
                  value={entryInvoice}
                  onChange={(e) => setEntryInvoice(e.target.value)}
                  placeholder="HFS-29100"
                  className="w-full bg-slate-700 border border-slate-600 rounded-xl text-sm text-white h-11 px-3"
                />
              </div>

              {entryVendorId && entryAmount && (() => {
                const prevCosts = getCostsByVendorWithAdded(entryVendorId);
                const lastEntry = prevCosts[prevCosts.length - 1];
                if (!lastEntry) return null;
                const amt = parseFloat(entryAmount);
                if (Number.isNaN(amt)) return null;
                const changePct = ((amt - lastEntry.amount) / lastEntry.amount) * 100;
                const vendor = storeVendors.find((v) => v.id === entryVendorId);
                return (
                  <div
                    className={`rounded-xl p-3 border ${changePct > 10 ? "bg-red-600/10 border-red-700/30" : changePct > 5 ? "bg-amber-600/10 border-amber-700/30" : changePct < -5 ? "bg-emerald-600/10 border-emerald-700/30" : "bg-slate-700/50 border-slate-600/30"}`}
                  >
                    <p className="text-xs text-slate-400">
                      Last {vendor?.vendor_name} entry: {formatDollars(lastEntry.amount)} ({MONTH_NAMES[lastEntry.month - 1]} {lastEntry.year})
                    </p>
                    <p
                      className={`text-xs font-medium mt-0.5 ${changePct > 10 ? "text-red-400" : changePct > 5 ? "text-amber-400" : changePct < -5 ? "text-emerald-400" : "text-slate-300"}`}
                    >
                      {changePct > 0 ? "+" : ""}
                      {formatPct(changePct)} vs last entry
                      {changePct > 10 && " — significant increase"}
                    </p>
                  </div>
                );
              })()}

              <div className="grid grid-cols-2 gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setShowAddEntry(false)}
                  className="py-3 rounded-xl bg-slate-700 text-slate-300 text-sm font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEntry}
                  disabled={!entryVendorId || !entryAmount || !entryDate}
                  className="py-3 rounded-xl bg-[#E65100] hover:bg-orange-600 text-white text-sm font-semibold disabled:bg-slate-700 disabled:text-slate-500 transition-colors"
                >
                  Save Entry
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {showQuickInvoice && (
        <>
          <div className="fixed inset-0 bg-black/60 z-40" onClick={() => setShowQuickInvoice(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-full max-w-md space-y-4 overflow-hidden">
              <h3 className="text-lg font-bold text-white">Log Invoice</h3>
              <div>
                <label className="text-sm text-zinc-400">Vendor Name</label>
                <input
                  type="text"
                  value={quickVendorName}
                  onChange={(e) => setQuickVendorName(e.target.value)}
                  placeholder="Vendor name"
                  className="w-full max-w-full box-border mt-1 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#E65100]/50"
                />
              </div>
              <div>
                <label className="text-sm text-zinc-400">Invoice Date</label>
                <input
                  type="date"
                  value={quickInvoiceDate}
                  onChange={(e) => setQuickInvoiceDate(e.target.value)}
                  className="appearance-none w-full max-w-full box-border mt-1 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#E65100]/50"
                />
              </div>
              <div>
                <label className="text-sm text-zinc-400">Total Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={quickTotal}
                  onChange={(e) => setQuickTotal(e.target.value)}
                  placeholder="0.00"
                  className="w-full max-w-full box-border mt-1 bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#E65100]/50"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowQuickInvoice(false)}
                  className="flex-1 py-3 rounded-xl border border-zinc-700 text-zinc-400 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={
                    quickSaving ||
                    !quickVendorName.trim() ||
                    !quickInvoiceDate ||
                    quickTotal.trim() === "" ||
                    Number.isNaN(Number(quickTotal))
                  }
                  onClick={async () => {
                    if (
                      !quickVendorName.trim() ||
                      !quickInvoiceDate ||
                      quickTotal.trim() === "" ||
                      Number.isNaN(Number(quickTotal))
                    ) {
                      return;
                    }
                    try {
                      setQuickSaving(true);
                      setQuickToast("idle");
                    const payload = {
                      vendor_name: quickVendorName.trim(),
                      invoice_date: quickInvoiceDate,
                      total: Number(quickTotal),
                    };
                    console.log("quick-invoice request payload", payload);
                    const res = await fetch("/api/quick-invoice", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(payload),
                      });
                      if (!res.ok) {
                      let errorJson: any = null;
                      try {
                        errorJson = await res.json();
                      } catch (e) {
                        console.error("quick-invoice error parsing response", e);
                      }
                      console.error("quick-invoice API error", errorJson);
                      setQuickErrorDetail(
                        typeof errorJson?.detail === "string"
                          ? errorJson.detail
                          : typeof errorJson?.error === "string"
                            ? errorJson.error
                            : "Unknown error from invoice API"
                      );
                        setQuickToast("error");
                      } else {
                        setQuickToast("saved");
                        setShowQuickInvoice(false);
                        setQuickVendorName("");
                        setQuickTotal("");
                      setQuickErrorDetail(null);
                      }
                    } catch (e) {
                      console.error("quick-invoice network error", e);
                      setQuickErrorDetail("Network or unexpected error while saving invoice");
                      setQuickToast("error");
                    } finally {
                      setQuickSaving(false);
                      setTimeout(() => setQuickToast("idle"), 3000);
                    }
                  }}
                  className="flex-1 py-3 rounded-xl bg-[#E65100] text-white font-semibold text-sm disabled:bg-slate-700 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors"
                >
                  {quickSaving ? "Saving..." : "Save Invoice"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* SECTION 1: HEADER */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-white">Vendor Tracker</h1>
          <p className="text-xs text-slate-400 mt-0.5">Where every dollar goes</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowQuickInvoice(true)}
            className="inline-flex items-center gap-1 rounded-lg border border-[#E65100] px-3 py-1.5 text-sm font-medium text-[#E65100] hover:bg-[#E65100]/10"
          >
            Log Invoice
          </button>
          <EducationInfoIcon metricKey="vendor_total_spend" />
        </div>
      </div>

      {newUser && (
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6 text-center mb-6">
          <p className="text-sm text-slate-300">No vendors yet. Tap &quot;Log Invoice&quot; to add your first vendor.</p>
        </div>
      )}

      {!newUser && (
      <>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-500">Store:</label>
          <select
            value={selectedStore}
            onChange={(e) => setSelectedStore(e.target.value)}
            className="dashboard-input rounded-lg border border-slate-600 bg-black/30 px-3 py-2 text-sm text-white focus:border-brand/60 focus:outline-none"
          >
            {STORE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => {
              const p = prevMonth(selectedMonth, selectedYear);
              setSelectedMonth(p.month);
              setSelectedYear(p.year);
            }}
            className="rounded-lg border border-slate-600 bg-black/30 p-2 text-slate-400 hover:text-white"
            aria-label="Previous month"
          >
            ←
          </button>
          <span className="min-w-[120px] text-center text-sm font-medium text-white">
            {getMonthLabel(selectedMonth, selectedYear)}
          </span>
          <button
            type="button"
            onClick={() => {
              const n = nextMonth(selectedMonth, selectedYear);
              setSelectedMonth(n.month);
              setSelectedYear(n.year);
            }}
            className="rounded-lg border border-slate-600 bg-black/30 p-2 text-slate-400 hover:text-white"
            aria-label="Next month"
          >
            →
          </button>
        </div>
      </div>

      {/* SECTION 2: VIEW TABS */}
      <div className="relative mb-4">
        <div className="flex overflow-x-auto no-scrollbar gap-1 bg-slate-800 rounded-lg p-0.5 border border-slate-700">
          {(["movers", "all", "annual", "cc", "occupancy"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setView(tab)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors shrink-0 ${
                view === tab ? "bg-slate-700 text-white" : "text-slate-400 hover:text-slate-300"
              }`}
            >
              {tab === "movers"
                ? "Movers"
                : tab === "all"
                  ? "All"
                  : tab === "annual"
                    ? "Annual"
                    : tab === "cc"
                      ? "CC Proc"
                      : "Occ."}
            </button>
          ))}
        </div>
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-slate-900 to-transparent pointer-events-none rounded-r-lg" aria-hidden />
      </div>

      {/* SECTION 3: PRICE MOVERS VIEW */}
      {view === "movers" && (
        <>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-3">
              <div className="text-xs text-slate-500 mb-1">Total Spend</div>
              <div className="text-lg font-bold text-white">{formatDollars(totalThisMonth)}</div>
              <div
                className={`text-xs font-medium ${totalChangePct > 0 ? "text-red-400" : totalChangePct < 0 ? "text-emerald-400" : "text-slate-500"}`}
              >
                {totalChangePct > 0 ? "+" : ""}
                {formatPct(totalChangePct)} ({totalChange >= 0 ? "+" : ""}
                {formatDollars(totalChange)})
              </div>
            </div>
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-3">
              <div className="text-xs text-slate-500 mb-1">Biggest Increase</div>
              <div className="text-sm font-medium text-red-400 truncate">
                {biggestIncrease ? biggestIncrease.vendorName : "—"}
              </div>
              <div className="text-xs text-red-400">
                {biggestIncrease ? `+${formatPct(biggestIncrease.changePct)} · +${formatDollars(biggestIncrease.change)}` : "—"}
              </div>
            </div>
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-3">
              <div className="text-xs text-slate-500 mb-1">Biggest Decrease</div>
              <div className="text-sm font-medium text-emerald-400 truncate">
                {biggestDecrease ? biggestDecrease.vendorName : "—"}
              </div>
              <div className="text-xs text-emerald-400">
                {biggestDecrease ? `${formatPct(biggestDecrease.changePct)} · ${formatDollars(biggestDecrease.change)}` : "—"}
              </div>
            </div>
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-3">
              <div className="text-xs text-slate-500 mb-1">Unchanged (±1%)</div>
              <div className="text-lg font-bold text-slate-400">{unchangedCount}</div>
              <div className="text-xs text-slate-500">vendors</div>
            </div>
          </div>

          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-sm font-semibold text-slate-400">Top Movers (&gt;3% change)</h3>
            <EducationInfoIcon metricKey="price_movers" size="sm" />
          </div>
          <div className="space-y-2">
            {topMovers.length === 0 && (
              <p className="text-xs text-slate-500">No vendors with more than 3% change this month.</p>
            )}
            {topMovers.map((v) => (
              <div key={v.vendorId} className="bg-slate-800 rounded-xl border border-slate-700 p-3 mb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {v.changePct > 0 ? (
                      <TrendingUp className="w-4 h-4 text-red-400 shrink-0" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-emerald-400 shrink-0" />
                    )}
                    <div>
                      <div className="text-sm font-medium text-white">{v.vendorName}</div>
                      <div className="text-xs text-slate-500">{v.category}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className={`text-sm font-semibold ${v.changePct > 0 ? "text-red-400" : "text-emerald-400"}`}
                    >
                      {v.changePct > 0 ? "+" : ""}
                      {formatPct(v.changePct)}
                    </div>
                    <div className="text-xs text-slate-500">
                      {formatDollars(v.prevAmount)} → {formatDollars(v.amount)}
                    </div>
                  </div>
                </div>
                {v.changePct > 10 && (
                  <div className="flex items-center gap-1.5 mt-2 px-2 py-1.5 rounded-lg bg-red-600/10 border border-red-700/30">
                    <AlertTriangle className="w-3 h-3 text-red-400 shrink-0" />
                    <span className="text-xs text-red-400">
                      Over 10% increase — consider requesting a breakdown or getting competing quotes
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* SECTION 4: ALL VENDORS VIEW */}
      {view === "all" && (
        <div className="space-y-2">
          {allVendorsSorted.map((v) => {
            const vendor = VENDORS.find((x) => x.id === v.vendorId);
            const costs = getCostsByVendorWithAdded(v.vendorId).slice(-12);
            const yearTotal = costs.reduce((s, c) => s + c.amount, 0);
            const hasNewEntry = addedEntries.some(
              (e) => e.vendor_id === v.vendorId && e.month === selectedMonth && e.year === selectedYear
            );
            return (
              <div key={v.vendorId} className="bg-slate-800 rounded-xl border border-slate-700 p-3 mb-2">
                <button
                  type="button"
                  onClick={() => setExpandedVendor(expandedVendor === v.vendorId ? null : v.vendorId)}
                  className="w-full text-left"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-white flex items-center gap-1">
                        {v.vendorName}
                        {hasNewEntry && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-600/20 text-blue-400 border border-blue-700/30">
                            New
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500">{v.category}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-sm font-medium text-white">{formatDollars(v.amount)}</div>
                        <div
                          className={`text-xs ${v.changePct > 0 ? "text-red-400" : v.changePct < 0 ? "text-emerald-400" : "text-slate-500"}`}
                        >
                          {v.changePct > 0 ? "+" : ""}
                          {formatPct(v.changePct)} vs last month
                        </div>
                      </div>
                      <ChevronDown
                        className={`w-4 h-4 text-slate-500 transition-transform shrink-0 ${expandedVendor === v.vendorId ? "rotate-180" : ""}`}
                      />
                    </div>
                  </div>
                </button>

                {expandedVendor === v.vendorId && (
                  <div className="mt-3 pt-3 border-t border-slate-700">
                    <h4 className="text-xs text-slate-500 mb-2">12-Month History</h4>
                    <div className="space-y-1">
                      {costs.map((entry) => (
                        <div key={entry.id} className="flex justify-between text-xs">
                          <span className="text-slate-400">
                            {MONTH_NAMES[entry.month - 1]} {entry.year}
                          </span>
                          <span className="text-white">{formatDollars(entry.amount)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between text-xs mt-2 pt-2 border-t border-slate-700">
                      <span className="text-slate-400 font-medium">12-Month Total</span>
                      <span className="text-white font-medium">{formatDollars(yearTotal)}</span>
                    </div>
                    <div className="mt-2 px-2 py-1.5 rounded-lg bg-slate-700/50">
                      <p className="text-[10px] text-slate-500">
                        Change: ({formatDollars(v.amount)} − {formatDollars(v.prevAmount)}) ÷{" "}
                        {formatDollars(v.prevAmount)} = {v.changePct > 0 ? "+" : ""}
                        {formatPct(v.changePct)}
                      </p>
                    </div>
                    {vendor && (vendor.phone || vendor.contact_name) && (
                      <div className="mt-2 text-xs text-slate-500">
                        {vendor.contact_name && <span>{vendor.contact_name} · </span>}
                        {vendor.phone && (
                          <a href={`tel:${vendor.phone}`} className="text-blue-400">
                            {vendor.phone}
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* SECTION 5: ANNUAL VIEW */}
      {view === "annual" && (
        <div className="overflow-x-auto">
          <div className="flex items-center gap-2 mb-3">
            <h3 className="text-sm font-semibold text-white">Annual Spend by Vendor</h3>
            <EducationInfoIcon metricKey="annual_spend" size="sm" />
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left text-slate-500 py-2 pr-3 sticky left-0 bg-slate-900 min-w-[120px] z-10">
                  Vendor
                </th>
                {ANNUAL_MONTHS.map((m) => (
                  <th key={`${m.year}-${m.month}`} className="text-right text-slate-500 py-2 px-1 min-w-[60px]">
                    {m.short}
                  </th>
                ))}
                <th className="text-right text-slate-500 py-2 pl-2 min-w-[80px]">YTD</th>
              </tr>
            </thead>
            <tbody>
              {vendorsForAnnual.map((v) => {
                let ytd = 0;
                return (
                  <tr key={v.id} className="border-b border-slate-700/50">
                    <td className="text-slate-300 py-2 pr-3 sticky left-0 bg-slate-900 z-10">{v.vendor_name}</td>
                    {ANNUAL_MONTHS.map((m, colIndex) => {
                      const cost = getCostForMonth(v.id, m.month, m.year);
                      ytd += cost;
                      const prev = colIndex > 0 ? ANNUAL_MONTHS[colIndex - 1] : null;
                      const prevCost = prev ? getCostForMonth(v.id, prev.month, prev.year) : 0;
                      const changePct = prevCost > 0 ? ((cost - prevCost) / prevCost) * 100 : 0;
                      const cellClass =
                        prevCost === 0
                          ? "text-white"
                          : changePct <= -2
                            ? "text-emerald-400 bg-emerald-600/5"
                            : changePct > 5
                              ? "text-red-400 bg-red-600/5"
                              : changePct > 2
                                ? "text-amber-400 bg-amber-600/5"
                                : "text-white";
                      return (
                        <td
                          key={`${m.year}-${m.month}`}
                          className={`text-right py-2 px-1 tabular-nums ${cellClass}`}
                        >
                          {cost > 0 ? `$${(cost / 1000).toFixed(1)}k` : "—"}
                        </td>
                      );
                    })}
                    <td className="text-right text-white font-medium py-2 pl-2 tabular-nums">
                      {formatDollars(ytd)}
                    </td>
                  </tr>
                );
              })}
              <tr className="border-t-2 border-slate-600">
                <td className="text-white font-semibold py-2 pr-3 sticky left-0 bg-slate-900 z-10">TOTAL</td>
                {ANNUAL_MONTHS.map((m, colIndex) => {
                  const monthTotal = vendorsForAnnual.reduce(
                    (s, v) => s + getCostForMonth(v.id, m.month, m.year),
                    0
                  );
                  const prev = colIndex > 0 ? ANNUAL_MONTHS[colIndex - 1] : null;
                  const prevTotal = prev
                    ? vendorsForAnnual.reduce((s, v) => s + getCostForMonth(v.id, prev.month, prev.year), 0)
                    : 0;
                  const changePct = prevTotal > 0 ? ((monthTotal - prevTotal) / prevTotal) * 100 : 0;
                  const cellClass =
                    prevTotal === 0
                      ? "text-white font-semibold"
                      : changePct <= -2
                        ? "text-emerald-400 bg-emerald-600/5 font-semibold"
                        : changePct > 5
                          ? "text-red-400 bg-red-600/5 font-semibold"
                          : changePct > 2
                            ? "text-amber-400 bg-amber-600/5 font-semibold"
                            : "text-white font-semibold";
                  return (
                    <td key={`${m.year}-${m.month}`} className={`text-right py-2 px-1 tabular-nums ${cellClass}`}>
                      ${(monthTotal / 1000).toFixed(1)}k
                    </td>
                  );
                })}
                <td className="text-right text-white font-semibold py-2 pl-2 tabular-nums">
                  {formatDollars(
                    vendorsForAnnual.reduce((s, v) => {
                      return s + ANNUAL_MONTHS.reduce((t, m) => t + getCostForMonth(v.id, m.month, m.year), 0);
                    }, 0)
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* SECTION 6: CC PROCESSING VIEW */}
      {view === "cc" && (
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
          <div className="flex items-center gap-2 mb-3">
            <CreditCard className="w-5 h-5 text-purple-400 shrink-0" />
            <h3 className="text-sm font-semibold text-white">Credit Card Processing</h3>
            <EducationInfoIcon metricKey="cc_effective_rate" />
          </div>

          <div className="grid grid-cols-3 gap-3 mb-4">
            <div>
              <div className="text-xs text-slate-500">Est. Card Sales</div>
              <div className="text-sm text-white font-medium">{formatDollars(estCardSales)}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Processing Fees</div>
              <div className="text-sm text-red-400 font-medium">{formatDollars(processingFees)}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Effective Rate</div>
              <div
                className={`text-sm font-semibold ${effectiveRate > 3.0 ? "text-red-400" : effectiveRate > 2.8 ? "text-amber-400" : "text-emerald-400"}`}
              >
                {effectiveRate.toFixed(2)}%
              </div>
            </div>
          </div>

          {(() => {
            const cc = CC_PROCESSING_BY_STORE[selectedStore];
            const quotedPct = cc?.quotedRatePct ?? 2.6;
            const actualPct = cc ? (cc.monthlyVolume > 0 ? (cc.monthlyFees / cc.monthlyVolume) * 100 : 0) : effectiveRate;
            const actualAboveQuoted = actualPct > quotedPct;
            return (
              <div className="bg-slate-700/50 rounded-lg p-3 mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs text-slate-400">Quoted vs Actual</span>
                  <EducationInfoIcon metricKey="cc_processing_quoted_vs_actual" size="sm" />
                </div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">Quoted Rate</span>
                  <span className="text-white">{quotedPct.toFixed(2)}%</span>
                </div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">Actual Rate</span>
                  <span className={actualAboveQuoted ? (actualPct > quotedPct + 0.5 ? "text-red-400" : "text-amber-400") : "text-emerald-400"}>
                    {actualPct.toFixed(2)}%
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Hidden Fee Gap</span>
                  <span className={actualAboveQuoted ? "text-red-400" : "text-slate-400"}>
                    {actualAboveQuoted ? `${(actualPct - quotedPct).toFixed(2)}% = ~${formatDollars(Math.round(((actualPct - quotedPct) / 100) * (cc?.monthlyVolume ?? estCardSales)))}/mo` : "—"}
                  </span>
                </div>
              </div>
            );
          })()}

          {(() => {
            const cc = CC_PROCESSING_BY_STORE[selectedStore];
            const quotedPct = cc?.quotedRatePct ?? 2.6;
            const actualPct = cc ? (cc.monthlyVolume > 0 ? (cc.monthlyFees / cc.monthlyVolume) * 100 : 0) : effectiveRate;
            const gap = actualPct - quotedPct;
            if (gap <= 0) return null;
            return (
              <div className="bg-red-600/10 rounded-lg border border-red-700/30 p-3">
                <p className="text-xs text-red-400">
                  At your current effective rate of {actualPct.toFixed(2)}%, you&apos;re paying ~
                  {formatDollars(Math.round((gap / 100) * (cc?.monthlyVolume ?? estCardSales) * 12))}/year more than your
                  quoted rate. Getting 2-3 competing quotes could save $2,000-5,000 annually.
                </p>
              </div>
            );
          })()}

          {last6Months.length > 0 && (
            <div className="mt-3">
              <h4 className="text-xs text-slate-500 mb-2">Effective Rate — Last 6 Months</h4>
              <div className="space-y-1">
                {last6Months.map((m) => (
                  <div key={m.label} className="flex justify-between text-xs">
                    <span className="text-slate-400">{m.label}</span>
                    <span className={m.rate > 3.0 ? "text-red-400" : "text-amber-400"}>
                      {m.rate.toFixed(2)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* SECTION 7: OCCUPANCY VIEW */}
      {view === "occupancy" && details && (
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
          <div className="flex items-center gap-2 mb-3">
            <HomeIcon className="w-5 h-5 text-cyan-400 shrink-0" />
            <h3 className="text-sm font-semibold text-white">Occupancy Economics</h3>
            <EducationInfoIcon metricKey="occupancy_cost" />
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <div className="text-xs text-slate-500">Monthly Rent</div>
              <div className="text-sm text-red-400 font-medium">{formatDollars(rent)}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Square Footage</div>
              <div className="text-sm text-white font-medium">{sqft.toLocaleString()} sq ft</div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Occupancy Cost %</div>
              <div
                className={`text-sm font-semibold ${occPct > 10 ? "text-red-400" : occPct > 8 ? "text-amber-400" : "text-emerald-400"}`}
              >
                {formatPct(occPct)}
              </div>
              <div className="text-[10px] text-slate-600">Benchmark: 6–8%</div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Lease Renewal</div>
              <div className="text-sm text-white font-medium">{leaseRenewal}</div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-slate-700/50 rounded-lg p-2 text-center">
              <div className="text-xs text-slate-500">Rev/sq ft</div>
              <div className="text-sm text-emerald-400 font-medium">${revPerSqft.toFixed(2)}</div>
            </div>
            <div className="bg-slate-700/50 rounded-lg p-2 text-center">
              <div className="text-xs text-slate-500">Rent/sq ft</div>
              <div className="text-sm text-red-400 font-medium">${rentPerSqft.toFixed(2)}</div>
            </div>
            <div className="bg-slate-700/50 rounded-lg p-2 text-center flex flex-col items-center gap-0.5">
              <div className="text-xs text-slate-500">Net Profit/sq ft</div>
              <div className="text-sm text-white font-medium">${profitPerSqft.toFixed(2)}</div>
              <EducationInfoIcon metricKey="revenue_per_sqft" size="sm" />
            </div>
          </div>

          <h4 className="text-xs text-slate-500 mb-2">Cross-Location Comparison</h4>
          <div className="space-y-2">
            {(["kent", "aurora", "lindseys"] as const).map((storeId) => {
              const d = STORE_DETAILS[storeId];
              const rev = STORE_REVENUE[storeId];
              const occ = d && rev ? (d.monthlyRent / rev) * 100 : 0;
              const revSqft = d && rev ? rev / d.sqft : 0;
              return (
                <div
                  key={storeId}
                  className={`flex items-center justify-between text-xs p-2 rounded-lg ${storeId === selectedStore ? "bg-slate-700/50 border border-slate-600" : ""}`}
                >
                  <span className="text-slate-300">{STORE_NAMES[storeId]}</span>
                  <div className="flex gap-4">
                    <span
                      className={
                        occ > 10 ? "text-red-400" : occ > 8 ? "text-amber-400" : "text-emerald-400"
                      }
                    >
                      {formatPct(occ)}
                    </span>
                    <span className="text-slate-400">${revSqft.toFixed(2)}/sqft</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-3 px-2 py-1.5 rounded-lg bg-slate-700/50">
            <p className="text-[10px] text-slate-500">
              Occupancy: {formatDollars(rent)} ÷ {formatDollars(monthlyRev)} = {formatPct(occPct)} | Rev/sqft:{" "}
              {formatDollars(monthlyRev)} ÷ {sqft} = ${revPerSqft.toFixed(2)}
            </p>
          </div>
        </div>
      )}

      </>

      )}

      <DataDisclaimer confidence="high" details="12 months of vendor cost data loaded. Trends require 2+ months." />
    </div>
  );
}
