"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import { Share2 } from "lucide-react";
import {
  COCKPIT_STORE_SLUGS,
  COCKPIT_TARGETS,
  type CockpitStoreSlug,
} from "@/lib/cockpit-config";
import { getStoreColor } from "@/lib/store-colors";
import { cn } from "@/lib/utils";
import { useAuth } from "@/src/lib/auth-context";
import { isNewUser, getNewUserStoreName } from "@/src/lib/user-scope";
import { EducationInfoIcon } from "@/src/components/education/InfoIcon";
import { ExportButton } from "@/src/components/ui/ExportButton";
import { formatPct as formatPctShared, formatDollars as formatDollarsBase } from "@/src/lib/formatters";

function formatPct(n: number | null): string {
  if (n == null || Number.isNaN(n)) return "—";
  return formatPctShared(n);
}
function formatDollars(n: number | null): string {
  if (n == null || Number.isNaN(n)) return "—";
  return formatDollarsBase(n);
}

function getMTDRange(): { startDate: string; endDate: string; label: string } {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const start = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const end = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, "0")}-${String(yesterday.getDate()).padStart(2, "0")}`;
  const label = new Date(year, month, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
  return { startDate: start, endDate: end, label };
}

type LineItemProps = {
  label: string;
  amount: string;
  pct?: string;
  grade?: "green" | "yellow" | "red";
  bold?: boolean;
  metricKey?: string;
  amountColor?: "green" | "red";
};

function LineItem({ label, amount, pct, grade, bold, metricKey, amountColor }: LineItemProps) {
  const gradeClass = grade === "green" ? "text-emerald-400" : grade === "yellow" ? "text-amber-400" : grade === "red" ? "text-red-400" : "text-white";
  const amountClass = amountColor === "red" ? "text-red-400" : amountColor === "green" ? "text-emerald-400" : pct != null ? gradeClass : "text-white";
  return (
    <div className="flex justify-between items-center gap-2 py-1.5">
      <div className="flex items-center gap-2 min-w-0">
        <span className={bold ? "text-slate-200 font-semibold" : "text-slate-300"}>{label}</span>
        {metricKey && <EducationInfoIcon metricKey={metricKey} />}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className={`tabular-nums ${bold ? "font-semibold" : "font-medium"} ${amountClass}`}>
          {amount}
        </span>
        {pct != null && <span className={`text-xs tabular-nums ${grade != null ? gradeClass : "text-slate-400"}`}>{pct}</span>}
      </div>
    </div>
  );
}

function Divider() {
  return <div className="border-t border-slate-700/80 my-2" />;
}

function pctToGrade(pct: number, targetMax: number): "green" | "yellow" | "red" {
  if (pct <= targetMax) return "green";
  if (pct <= targetMax + 2) return "yellow";
  return "red";
}

function getNoiTier(netProfitPct: number): {
  label: string;
  color: "red" | "amber" | "orange" | "teal" | "green";
} {
  if (netProfitPct < 0) return { label: "Bleeding Out", color: "red" };
  if (netProfitPct < 5) return { label: "Breaking Even", color: "amber" };
  if (netProfitPct < 10) return { label: "Holding Your Own", color: "orange" };
  if (netProfitPct < 15) return { label: "In The Black", color: "teal" };
  return { label: "Printing Money", color: "green" };
}

export default function PnlPage() {
  const { session, loading } = useAuth();
  const newUser = isNewUser(session);
  const newUserStoreName = getNewUserStoreName(session);
  const [storeFilter, setStoreFilter] = useState<"all" | CockpitStoreSlug>("kent");
  const [shareToast, setShareToast] = useState(false);
  const [shareGenerating, setShareGenerating] = useState(false);
  const shareRef = useRef<HTMLDivElement>(null);

  const [useCustomRange, setUseCustomRange] = useState(false);
  const [customStartMonth, setCustomStartMonth] = useState(1);
  const [customStartYear, setCustomStartYear] = useState(() => new Date().getFullYear());
  const [customEndMonth, setCustomEndMonth] = useState(() => new Date().getMonth() + 1);
  const [customEndYear, setCustomEndYear] = useState(() => new Date().getFullYear());
  const [appliedCustomRange, setAppliedCustomRange] = useState<{ startDate: string; endDate: string; label: string } | null>(null);

  const { startDate, endDate, label: mtdLabel } = useMemo(() => {
    if (appliedCustomRange) return appliedCustomRange;
    return getMTDRange();
  }, [appliedCustomRange]);

  const storeForSeed = storeFilter === "all" ? "kent" : storeFilter;
  const storeName = storeFilter === "all" ? "All Locations" : COCKPIT_TARGETS[storeFilter].name;

  const [rangeData, setRangeData] = useState<{ sales: { business_day: string; net_sales?: number }[]; labor: { business_day: string; total_labor_cost?: number; total_overtime_cost?: number }[]; purchases: { business_day: string; food_spend?: number; paper_spend?: number }[] } | null>(null);
  useEffect(() => {
    let cancelled = false;
    const store = storeFilter === "all" ? "all" : storeFilter;
    fetch(`/api/dashboard/daily-data?store_id=${encodeURIComponent(store)}&range=60`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled || !d.sales) return;
        setRangeData({ sales: d.sales ?? [], labor: d.labor ?? [], purchases: d.purchases ?? [] });
      })
      .catch(() => setRangeData(null));
    return () => { cancelled = true; };
  }, [storeFilter]);

  const pnl = useMemo(() => {
    if (!rangeData?.sales?.length) {
      return { totalSales: 0, totalFood: 0, totalLabor: 0, totalDisposables: 0, totalCOGS: 0, grossProfit: 0, totalFixed: 0, netProfit: 0, foodPct: 0, dispPct: 0, cogsPct: 0, laborPct: 0, gpPct: 0, fixedPct: 0, netProfitPct: 0 };
    }
    const inRange = (date: string) => date >= startDate && date <= endDate;
    const salesInRange = rangeData.sales.filter((s) => inRange(s.business_day));
    const salesByDay = new Map(rangeData.sales.map((s) => [s.business_day, s.net_sales ?? 0]));
    const laborByDay = new Map(rangeData.labor.map((l) => [l.business_day, (l.total_labor_cost ?? 0) + (l.total_overtime_cost ?? 0)]));
    const purchasesByDay = new Map(rangeData.purchases.map((p) => [p.business_day, { food: p.food_spend ?? 0, paper: p.paper_spend ?? 0 }]));
    let totalSales = 0, totalFood = 0, totalLabor = 0, totalDisposables = 0;
    for (const s of salesInRange) {
      const day = s.business_day;
      totalSales += s.net_sales ?? 0;
      totalLabor += laborByDay.get(day) ?? 0;
      const pur = purchasesByDay.get(day);
      totalFood += pur?.food ?? 0;
      totalDisposables += pur?.paper ?? 0;
    }
    const totalCOGS = totalFood + totalLabor + totalDisposables;
    const grossProfit = totalSales - totalCOGS;
    const totalFixed = 0;
    const netProfit = grossProfit - totalFixed;
    const foodPct = totalSales > 0 ? (totalFood / totalSales) * 100 : 0;
    const dispPct = totalSales > 0 ? (totalDisposables / totalSales) * 100 : 0;
    const cogsPct = totalSales > 0 ? (totalCOGS / totalSales) * 100 : 0;
    const laborPct = totalSales > 0 ? (totalLabor / totalSales) * 100 : 0;
    const gpPct = totalSales > 0 ? (grossProfit / totalSales) * 100 : 0;
    const fixedPct = totalSales > 0 ? (totalFixed / totalSales) * 100 : 0;
    const netProfitPct = totalSales > 0 ? (netProfit / totalSales) * 100 : 0;
    return {
      totalSales,
      totalFood,
      totalLabor,
      totalDisposables,
      totalCOGS,
      grossProfit,
      totalFixed,
      netProfit,
      foodPct,
      dispPct,
      cogsPct,
      laborPct,
      gpPct,
      fixedPct,
      netProfitPct,
    };
  }, [rangeData, startDate, endDate]);

  async function handleShare() {
    setShareGenerating(true);
    const textBody = [
      `Revenue: ${formatDollars(pnl.totalSales)}`,
      `Food: ${formatDollars(pnl.totalFood)} (${formatPct(pnl.foodPct)})`,
      `Labor: ${formatDollars(pnl.totalLabor)} (${formatPct(pnl.laborPct)})`,
      `Disposables: ${formatDollars(pnl.totalDisposables)} (${formatPct(pnl.dispPct)})`,
      `Gross Profit: ${formatDollars(pnl.grossProfit)} (${formatPct(pnl.gpPct)})`,
    ].join("\n");
    const shareText = `PrimeOS — GP P&L\n${storeName}\n${mtdLabel}\n\n${textBody}\n\nPowered by PrimeOS — getprimeos.com`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: "PrimeOS — GP P&L",
          text: shareText,
        });
        setShareGenerating(false);
        return;
      }
    } catch (e) {
      if ((e as Error)?.name === "AbortError") {
        setShareGenerating(false);
        return;
      }
    }
    try {
      await navigator.clipboard.writeText(shareText);
      setShareToast(true);
      setTimeout(() => setShareToast(false), 3000);
    } catch {
      // clipboard failed
    }
    setShareGenerating(false);
  }

  if (loading) {
    return (
      <div className="space-y-6 min-w-0 overflow-x-hidden pb-28">
        <div className="bg-zinc-800/50 rounded-xl border border-zinc-800/50 shadow-sm p-4 animate-pulse">
          <div className="h-6 w-32 bg-zinc-700 rounded mb-2" />
          <div className="h-4 w-48 bg-zinc-700 rounded" />
        </div>
        <div className="bg-zinc-800/50 rounded-xl border border-zinc-800/50 shadow-sm p-6 animate-pulse">
          <div className="h-4 w-24 bg-zinc-700 rounded mb-4" />
          <div className="h-24 w-full bg-zinc-700 rounded" />
        </div>
        <div className="bg-zinc-800/50 rounded-xl border border-zinc-800/50 shadow-sm p-4 animate-pulse">
          <div className="h-4 w-40 bg-zinc-700 rounded mb-3" />
          <div className="h-32 w-full bg-zinc-700 rounded" />
        </div>
      </div>
    );
  }
  if (newUser) {
    return (
      <div className="space-y-6 min-w-0 overflow-x-hidden pb-28">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h1 className="text-lg font-semibold sm:text-2xl text-white">GP P&L</h1>
          <EducationInfoIcon metricKey="gp_vs_net_profit" size="lg" />
        </div>
        <p className="text-xs text-muted">{newUserStoreName}</p>
        <div className="bg-zinc-900/50 rounded-xl border border-zinc-800/50 shadow-sm p-6 text-center">
          <p className="text-sm text-zinc-300">Your P&L will populate when transaction data starts flowing. Tap any (i) icon to learn what each line item means.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 min-w-0 overflow-x-hidden pb-28 animate-fade-in">
      {shareToast && (
        <div className="fixed bottom-20 left-4 right-4 z-50 bg-emerald-600/20 border border-emerald-700/30 rounded-xl px-4 py-2.5 shadow-lg text-center">
          <p className="text-xs text-emerald-400 font-medium">Copied to clipboard</p>
        </div>
      )}
      <div className={`dashboard-toolbar p-3 sm:p-5 space-y-3 ${getStoreColor(storeFilter === "all" ? "kent" : storeFilter).glow}`}>
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h1 className="text-xl font-bold text-white">GP P&L — Gross Profit</h1>
          <ExportButton
          pageName="GP P&L"
          getData={() => ({
            headers: ["Period", "Store", "Total Sales", "Food", "Labor", "Disposables", "COGS", "Gross Profit", "Food %", "Labor %", "GP %"],
            rows: [[
              mtdLabel,
              storeName,
              String(pnl.totalSales),
              String(pnl.totalFood),
              String(pnl.totalLabor),
              String(pnl.totalDisposables),
              String(pnl.totalCOGS),
              String(pnl.grossProfit),
              pnl.foodPct.toFixed(1),
              pnl.laborPct.toFixed(1),
              pnl.gpPct.toFixed(1),
            ]],
          })}
        />
          <button
            type="button"
            onClick={handleShare}
            disabled={shareGenerating}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-400 hover:text-slate-300 transition-colors disabled:opacity-50"
          >
            <Share2 className={`w-3.5 h-3.5 ${shareGenerating ? "animate-spin" : ""}`} />
            <span>{shareGenerating ? "Generating..." : "Share"}</span>
          </button>
        </div>
        <p className="text-xs text-muted">Current snapshot — how you&apos;re doing right now. Month-to-date.</p>
        {rangeData !== null && pnl.totalSales === 0 && (
          <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4 text-center text-zinc-500">
            <p className="text-sm">No data for this period.</p>
            <p className="text-xs mt-1">Connect your POS — data syncs daily. <a href="mailto:hello@getprimeos.com" className="text-[#E65100] underline">hello@getprimeos.com</a></p>
          </div>
        )}
        <div className="flex flex-wrap gap-2 items-center">
          <select
            value={storeFilter}
            onChange={(e) => setStoreFilter(e.target.value as "all" | CockpitStoreSlug)}
            className="dashboard-input rounded-lg border border-border/50 bg-black/30 px-3 py-2 text-sm font-medium focus:border-brand/60 focus:ring-1 focus:ring-brand/40 focus:outline-none min-h-[44px]"
          >
            <option value="all">All Stores</option>
            {COCKPIT_STORE_SLUGS.map((slug) => (
              <option key={slug} value={slug}>{COCKPIT_TARGETS[slug].name}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => { if (useCustomRange) setAppliedCustomRange(null); setUseCustomRange(!useCustomRange); }}
            className="min-h-[44px] rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-400 hover:text-white"
          >
            Custom Range
          </button>
          {appliedCustomRange && (
            <button type="button" onClick={() => setAppliedCustomRange(null)} className="min-h-[44px] rounded-lg border border-zinc-600 px-3 py-2 text-xs text-zinc-400 hover:text-white">Clear custom</button>
          )}
        </div>
        {useCustomRange && (
          <div className="rounded-xl border border-zinc-800/50 shadow-sm bg-zinc-900 p-4 space-y-3">
            <p className="text-xs text-zinc-400">Select start and end month</p>
            <div className="flex flex-wrap items-end gap-3">
              <label>
                <span className="block text-xs text-zinc-500 mb-1">Start</span>
                <div className="flex gap-2">
                  <select
                    value={customStartMonth}
                    onChange={(e) => setCustomStartMonth(Number(e.target.value))}
                    className="min-h-[44px] rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white"
                  >
                    {["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map((m, i) => (
                      <option key={m} value={i + 1}>{m}</option>
                    ))}
                  </select>
                  <select
                    value={customStartYear}
                    onChange={(e) => setCustomStartYear(Number(e.target.value))}
                    className="min-h-[44px] rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white"
                  >
                    {[2024, 2025, 2026, 2027].map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </label>
              <label>
                <span className="block text-xs text-zinc-500 mb-1">End</span>
                <div className="flex gap-2">
                  <select
                    value={customEndMonth}
                    onChange={(e) => setCustomEndMonth(Number(e.target.value))}
                    className="min-h-[44px] rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white"
                  >
                    {["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map((m, i) => (
                      <option key={m} value={i + 1}>{m}</option>
                    ))}
                  </select>
                  <select
                    value={customEndYear}
                    onChange={(e) => setCustomEndYear(Number(e.target.value))}
                    className="min-h-[44px] rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white"
                  >
                    {[2024, 2025, 2026, 2027].map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </label>
              <button
                type="button"
                onClick={() => {
                  const startDate = `${customStartYear}-${String(customStartMonth).padStart(2, "0")}-01`;
                  const lastDay = new Date(customEndYear, customEndMonth, 0).getDate();
                  const endDate = `${customEndYear}-${String(customEndMonth).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
                  const startLabel = new Date(customStartYear, customStartMonth - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
                  const endLabel = new Date(customEndYear, customEndMonth - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
                  setAppliedCustomRange({ startDate, endDate, label: `${startLabel} — ${endLabel}` });
                }}
                className="min-h-[44px] rounded-lg bg-[#E65100] text-white px-4 py-2 text-sm font-semibold"
              >
                Apply
              </button>
            </div>
          </div>
        )}
      </div>

      {/* GP vs NET education banner */}
      <div className="rounded-xl border border-slate-600 bg-slate-800/80 p-4 min-w-0">
        <p className="text-sm text-slate-200 leading-relaxed">
          This is your <strong className="text-white">Gross Profit P&L</strong> — what you control daily. For your full picture including rent, insurance, and fixed costs, see Actual P&L.
        </p>
      </div>

      <div ref={shareRef}>
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden min-w-0">
        <div className="flex justify-between items-center p-4 border-b border-slate-700">
          <h3 className="text-sm font-semibold text-white">{appliedCustomRange ? `P&L: ${appliedCustomRange.label}` : `${mtdLabel} MTD`}</h3>
          <span className="text-xs text-slate-400">{storeName}</span>
        </div>

        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-xs text-slate-500 uppercase tracking-wide">Revenue</span>
            <EducationInfoIcon metricKey="revenue_pl" size="sm" />
          </div>
          <LineItem
            label="Net Sales"
            amount={formatDollars(pnl.totalSales)}
            metricKey="daily_sales"
            amountColor="green"
          />
        </div>

        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-xs text-slate-500 uppercase tracking-wide">Cost of Goods Sold (COGS)</span>
            <EducationInfoIcon metricKey="cogs_pl" size="sm" />
          </div>
          <LineItem
            label="Food Cost"
            amount={formatDollars(pnl.totalFood)}
            pct={formatPct(pnl.foodPct)}
            grade={pctToGrade(pnl.foodPct, 31)}
            metricKey="food_cost"
            amountColor="red"
          />
          <LineItem
            label="Labor Cost"
            amount={formatDollars(pnl.totalLabor)}
            pct={formatPct(pnl.laborPct)}
            grade={pctToGrade(pnl.laborPct, 22)}
            metricKey="labor_pct"
            amountColor="red"
          />
          <LineItem
            label="Disposables"
            amount={formatDollars(pnl.totalDisposables)}
            pct={formatPct(pnl.dispPct)}
            metricKey="disposables_pct"
            amountColor="red"
          />
          <div className="flex justify-between items-center gap-2 py-1.5 mt-1 pt-2 border-t border-zinc-700">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-slate-200 font-semibold">Total COGS</span>
              <EducationInfoIcon metricKey="cogs_pl" />
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="font-semibold tabular-nums text-red-400">{formatDollars(pnl.totalCOGS)}</span>
              <span className="text-xs tabular-nums text-slate-400">{formatPct(pnl.cogsPct)}</span>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-zinc-700">
          <div className="flex justify-between items-center gap-2 pt-1">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-white font-bold text-base">Gross Profit</span>
              <EducationInfoIcon metricKey="gross_profit_pl" />
            </div>
            <div className="text-right shrink-0 flex items-center justify-end gap-1">
              <span className="text-emerald-400 font-bold text-lg tabular-nums">{formatDollars(pnl.grossProfit)}</span>
              <span className="text-xs text-slate-400 ml-2 tabular-nums">{formatPct(pnl.gpPct)}</span>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-zinc-700">
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-xs text-slate-500 uppercase tracking-wide">Fixed Expenses</span>
            <EducationInfoIcon metricKey="occupancy_pct" size="sm" />
          </div>
          <LineItem label="Rent / Mortgage" amount={formatDollars(0)} />
          <LineItem label="Insurance" amount={formatDollars(0)} />
          <LineItem label="Utilities" amount={formatDollars(0)} />
          <LineItem label="Loan Payments" amount={formatDollars(0)} />
          <div className="flex justify-between items-center gap-2 py-1.5 mt-1 pt-2 border-t border-zinc-700">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-slate-200 font-semibold">Total Fixed Expenses</span>
              <EducationInfoIcon metricKey="gp_vs_net_profit" />
            </div>
            <div className="shrink-0">
              <span className="font-semibold tabular-nums text-slate-300">{formatDollars(pnl.totalFixed)}</span>
              {pnl.totalSales > 0 && <span className="text-xs text-slate-400 ml-2">{formatPct(pnl.fixedPct)}</span>}
            </div>
          </div>
        </div>

        <div className="p-4 border-t-2 border-zinc-600 bg-slate-800/80">
          <div className="flex justify-between items-center gap-2 pt-1">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-white font-bold text-lg">Net Profit / ROI</span>
              <EducationInfoIcon metricKey="net_profit_pl" />
            </div>
            <div className="text-right shrink-0 flex items-center gap-2">
              <span className="text-emerald-400 font-bold text-xl tabular-nums">{formatDollars(pnl.netProfit)}</span>
              <span className="text-sm text-slate-400 tabular-nums">{formatPct(pnl.netProfitPct)}</span>
            </div>
          </div>
        </div>

        {/* NOI Scorecard */}
        <div className="mt-4 bg-slate-900/60 rounded-2xl border border-slate-700 p-5">
          {pnl.totalSales > 0 ? (
            (() => {
              const noiPct = pnl.netProfitPct;
              const tier = getNoiTier(noiPct);
              const tiers = [
                { threshold: 0, label: "0" },
                { threshold: 5, label: "5" },
                { threshold: 10, label: "10" },
                { threshold: 15, label: "15" },
                { threshold: 20, label: "20+" },
              ];
              const clampedScore = Math.max(0, Math.min(20, noiPct));
              const fillPct = (clampedScore / 20) * 100;
              const barColor =
                tier.color === "green"
                  ? "bg-emerald-400"
                  : tier.color === "teal"
                    ? "bg-cyan-400"
                    : tier.color === "orange"
                      ? "bg-orange-400"
                      : tier.color === "amber"
                        ? "bg-amber-400"
                        : "bg-red-400";
              const nextTierThreshold =
                noiPct < 0 ? 0 : noiPct < 5 ? 5 : noiPct < 10 ? 10 : noiPct < 15 ? 15 : null;
              const nextTierLabel =
                noiPct < 0
                  ? "Breaking Even"
                  : noiPct < 5
                    ? "Holding Your Own"
                    : noiPct < 10
                      ? "In The Black"
                      : "Printing Money";
              const cogsReductionNeededPct =
                nextTierThreshold != null ? Math.max(0, nextTierThreshold - noiPct) : 0;
              const monthlyGapDollars =
                nextTierThreshold != null ? (cogsReductionNeededPct / 100) * pnl.totalSales : 0;

              return (
                <>
                  <div className="text-center">
                    <p className="text-[10px] font-semibold tracking-[0.2em] text-slate-500 uppercase">
                      NOI Score
                    </p>
                    <p className="mt-2 text-5xl sm:text-6xl font-black tabular-nums text-white">
                      {formatPct(noiPct)}
                    </p>
                    <span
                      className={cn(
                        "inline-flex items-center mt-2 px-3 py-1.5 rounded-full text-xs font-semibold",
                        tier.color === "green"
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                          : tier.color === "teal"
                            ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                            : tier.color === "orange"
                              ? "bg-orange-500/20 text-orange-300 border border-orange-500/40"
                              : tier.color === "amber"
                                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                                : "bg-red-500/20 text-red-300 border border-red-500/40"
                      )}
                    >
                      {tier.label}
                    </span>
                  </div>

                  <div className="mt-5 max-w-xl mx-auto">
                    <div className="h-3 w-full rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className={cn("h-full rounded-full transition-[width] duration-700 ease-out", barColor)}
                        style={{ width: `${fillPct}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-500 mt-1.5">
                      <span>0%</span>
                      <span>5%</span>
                      <span>10%</span>
                      <span>15%</span>
                      <span>20%+</span>
                    </div>
                  </div>

                  {nextTierThreshold != null && (
                    <p className="mt-3 text-xs text-slate-300 text-center">
                      Reduce your COGS by{" "}
                      <span className="font-semibold text-emerald-300">
                        {formatPct(cogsReductionNeededPct)}
                      </span>{" "}
                      and you reach{" "}
                      <span className="font-semibold text-emerald-300">{nextTierLabel}</span>{" "}
                      — worth{" "}
                      <span className="font-semibold text-emerald-300">
                        {formatDollars(Math.round(monthlyGapDollars))}
                      </span>
                      /month.
                    </p>
                  )}
                </>
              );
            })()
          ) : (
            <p className="text-xs text-slate-500 text-center">
              NOI score will appear once revenue and COGS data are available for this period.
            </p>
          )}
        </div>

        {/* Industry Benchmarks for NOI */}
        <div className="mt-4 bg-slate-900/40 rounded-2xl border border-slate-700 p-4 space-y-3">
          <h3 className="text-sm font-semibold text-white flex items-center justify-between">
            Industry Benchmarks
          </h3>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-slate-200">Food + Labor (COGS)</p>
                <p className="text-[11px] text-slate-500">Benchmark: 55–60%</p>
              </div>
              <div className="text-right">
                <p
                  className={cn(
                    "tabular-nums text-sm",
                    pnl.cogsPct <= 60 ? "text-emerald-400" : pnl.cogsPct <= 65 ? "text-amber-400" : "text-red-400"
                  )}
                >
                  {formatPct(pnl.cogsPct)}
                </p>
                <p className="text-[10px] text-cyan-400 mt-0.5">
                  Toast Restaurant Trends Report 2024
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-slate-200">Fixed Expenses</p>
                <p className="text-[11px] text-slate-500">Benchmark: 24–30%</p>
              </div>
              <div className="text-right">
                <p
                  className={cn(
                    "tabular-nums text-sm",
                    pnl.fixedPct <= 30 ? "text-emerald-400" : pnl.fixedPct <= 35 ? "text-amber-400" : "text-red-400"
                  )}
                >
                  {formatPct(pnl.fixedPct)}
                </p>
                <p className="text-[10px] text-cyan-400 mt-0.5">
                  National Restaurant Association 2024
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-slate-200">Net Operating Income</p>
                <p className="text-[11px] text-slate-500">Benchmark: 10–15%</p>
              </div>
              <div className="text-right">
                <p
                  className={cn(
                    "tabular-nums text-sm",
                    pnl.netProfitPct >= 10 && pnl.netProfitPct <= 15
                      ? "text-emerald-400"
                      : pnl.netProfitPct >= 5
                        ? "text-amber-400"
                        : "text-red-400"
                  )}
                >
                  {formatPct(pnl.netProfitPct)}
                </p>
                <p className="text-[10px] text-cyan-400 mt-0.5">
                  PMQ Pizza Magazine Industry Report
                </p>
              </div>
            </div>
          </div>
          <details className="mt-2 text-xs text-slate-400">
            <summary className="cursor-pointer text-slate-300 font-medium">
              How is this calculated?
            </summary>
            <div className="mt-2 space-y-1 text-slate-400">
              <p>
                We start with your total revenue, subtract COGS (food, labor, and disposables), and
                then subtract fixed expenses to get Net Operating Income (NOI).
              </p>
              <p>
                In plain English: Revenue − COGS − Fixed Expenses = the money left to pay yourself,
                reinvest, or save.
              </p>
              {pnl.totalFixed === 0 && (
                <p className="text-[11px] text-slate-500">
                  Fixed expenses not yet loaded — current NOI is using Revenue − COGS only.
                </p>
              )}
            </div>
          </details>
        </div>
      </div>
      </div>
    </div>
  );
}
