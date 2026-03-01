"use client";

import { Suspense, useMemo, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  COCKPIT_STORE_SLUGS,
  COCKPIT_TARGETS,
  type CockpitStoreSlug,
} from "@/lib/cockpit-config";
import { getStoreColor } from "@/lib/store-colors";
import { useAuth } from "@/src/lib/auth-context";
import { isNewUser, getNewUserStoreName } from "@/src/lib/user-scope";
import { EducationInfoIcon } from "@/src/components/education/InfoIcon";
import { formatPct as formatPctShared, formatDollars as formatDollarsBase } from "@/src/lib/formatters";
import { SEED_DAILY_KPIS } from "@/src/lib/seed-data";

function formatPct(n: number | null): string {
  if (n == null || Number.isNaN(n)) return "—";
  return formatPctShared(n);
}
function formatDollars(n: number | null): string {
  if (n == null || Number.isNaN(n)) return "—";
  return formatDollarsBase(n);
}

function formatNum(n: number | null): string {
  if (n == null || Number.isNaN(n)) return "—";
  return n.toFixed(1);
}

function getMonthStartEnd(year: number, month: number): { startDate: string; endDate: string; label: string } {
  const start = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const end = `${year}-${String(month + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
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
        {pct != null && metricKey && <EducationInfoIcon metricKey={metricKey} />}
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

function MonthlyContent() {
  const { session } = useAuth();
  const newUser = isNewUser(session);
  const newUserStoreName = getNewUserStoreName(session);
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [storeFilter, setStoreFilter] = useState<"all" | CockpitStoreSlug>("kent");
  const [showEducation, setShowEducation] = useState(false);

  const { startDate, endDate, label: monthLabel } = useMemo(
    () => getMonthStartEnd(year, month),
    [year, month]
  );

  const storeForSeed = storeFilter === "all" ? "kent" : storeFilter;
  const storeName = storeFilter === "all" ? "All Locations" : COCKPIT_TARGETS[storeFilter].name;

  const pnl = useMemo(() => {
    const rows = SEED_DAILY_KPIS.filter(
      (r) => r.store_id === storeForSeed && r.date >= startDate && r.date <= endDate
    );
    const totalSales = rows.reduce((s, r) => s + r.sales, 0);
    const totalFood = rows.reduce((s, r) => s + r.food_dollars, 0);
    const totalLabor = rows.reduce((s, r) => s + r.labor_dollars, 0);
    const totalDisposables = rows.reduce((s, r) => s + Math.round(r.sales * 0.035 * 100) / 100, 0);
    const totalCOGS = totalFood + totalDisposables;
    const grossProfit = totalSales - totalCOGS - totalLabor;
    const foodPct = totalSales > 0 ? (totalFood / totalSales) * 100 : 0;
    const dispPct = totalSales > 0 ? (totalDisposables / totalSales) * 100 : 0;
    const cogsPct = totalSales > 0 ? (totalCOGS / totalSales) * 100 : 0;
    const laborPct = totalSales > 0 ? (totalLabor / totalSales) * 100 : 0;
    const gpPct = totalSales > 0 ? (grossProfit / totalSales) * 100 : 0;
    return {
      totalSales,
      totalFood,
      totalLabor,
      totalDisposables,
      totalCOGS,
      grossProfit,
      foodPct,
      dispPct,
      cogsPct,
      laborPct,
      gpPct,
    };
  }, [storeForSeed, startDate, endDate]);

  const prevMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  };
  const nextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  };

  if (newUser) {
    return (
      <div className="space-y-6 min-w-0 overflow-x-hidden pb-28">
        <div className="dashboard-toolbar p-3 sm:p-5 space-y-3">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold sm:text-2xl">Monthly P&L Summary</h1>
            <button type="button" onClick={() => setShowEducation(true)} className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-full bg-muted/20 text-muted hover:bg-brand/20 hover:text-brand transition-colors text-xs font-bold" aria-label="Learn more">i</button>
          </div>
          <p className="text-xs text-muted">{newUserStoreName}</p>
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 text-center">
          <p className="text-sm text-zinc-300">Your Monthly Summary will generate at the end of each month once daily data is flowing.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 min-w-0 overflow-x-hidden pb-28">
      <div className="dashboard-toolbar p-3 sm:p-5 space-y-3">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold sm:text-2xl">Monthly P&L Summary</h1>
          <button type="button" onClick={() => setShowEducation(true)} className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-full bg-muted/20 text-muted hover:bg-brand/20 hover:text-brand transition-colors text-xs font-bold" aria-label="Learn more">i</button>
        </div>
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={prevMonth}
            className="rounded-lg border border-border/50 bg-black/30 min-h-[44px] min-w-[44px] flex items-center justify-center text-muted hover:bg-black/40 hover:text-white shrink-0"
            aria-label="Previous month"
          >
            ←
          </button>
          <div className="flex-1 text-center min-w-0">
            <div className="text-sm font-medium text-white">{monthLabel}</div>
          </div>
          <button
            type="button"
            onClick={nextMonth}
            className="rounded-lg border border-border/50 bg-black/30 min-h-[44px] min-w-[44px] flex items-center justify-center text-muted hover:bg-black/40 hover:text-white shrink-0"
            aria-label="Next month"
          >
            →
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={storeFilter}
            onChange={(e) => setStoreFilter(e.target.value as "all" | CockpitStoreSlug)}
            className="dashboard-input rounded-lg border border-border/50 bg-black/30 px-3 py-2 text-sm font-medium focus:border-brand/60 focus:ring-1 focus:ring-brand/40 focus:outline-none"
          >
            <option value="all">All Stores</option>
            {COCKPIT_STORE_SLUGS.map((slug) => (
              <option key={slug} value={slug}>{COCKPIT_TARGETS[slug].name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden min-w-0">
        <div className="flex justify-between items-center p-4 border-b border-slate-700">
          <h3 className="text-sm font-semibold text-white">{monthLabel} P&L</h3>
          <span className="text-xs text-slate-400">{storeName}</span>
        </div>

        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-xs text-slate-500 uppercase tracking-wide">Revenue</span>
            <EducationInfoIcon metricKey="revenue_pl" size="sm" />
          </div>
          <div className="flex justify-between items-center gap-2 text-sm py-1.5">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-slate-300">Total Sales</span>
              <EducationInfoIcon metricKey="daily_sales" />
            </div>
            <span className="text-emerald-400 font-medium shrink-0">{formatDollars(pnl.totalSales)}</span>
          </div>
        </div>

        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center gap-1.5 mb-2">
          <span className="text-xs text-slate-500 uppercase tracking-wide">Cost of Goods</span>
          <EducationInfoIcon metricKey="cogs_pl" size="sm" />
        </div>
          <LineItem
            label="Food"
            amount={formatDollars(pnl.totalFood)}
            pct={formatPct(pnl.foodPct)}
            grade={pctToGrade(pnl.foodPct, 31)}
            metricKey="food_cost"
            amountColor="red"
          />
          <LineItem
            label="Disposables"
            amount={formatDollars(pnl.totalDisposables)}
            pct={formatPct(pnl.dispPct)}
            metricKey="disposables_pct"
            amountColor="red"
          />
          <Divider />
          <LineItem
            label="Total COGS"
            amount={formatDollars(pnl.totalCOGS)}
            pct={formatPct(pnl.cogsPct)}
            bold
            grade={pctToGrade(pnl.cogsPct, 35)}
            metricKey="cogs_pl"
            amountColor="red"
          />
        </div>

        <div className="p-4 border-b border-slate-700">
          <div className="text-xs text-slate-500 uppercase tracking-wide mb-2">Labor</div>
          <LineItem
            label="Total Labor"
            amount={formatDollars(pnl.totalLabor)}
            pct={formatPct(pnl.laborPct)}
            grade={pctToGrade(pnl.laborPct, 22)}
            metricKey="labor_pct"
            amountColor="red"
          />
        </div>

        <div className="p-4 bg-slate-700/50">
          <div className="flex justify-between items-center gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-white font-bold">Gross Profit</span>
              <EducationInfoIcon metricKey="gross_profit_pl" />
            </div>
            <div className="text-right shrink-0 flex items-center justify-end gap-1">
              <span className="text-emerald-400 font-bold text-lg">{formatDollars(pnl.grossProfit)}</span>
              <span className="text-xs text-slate-400 ml-2 flex items-center gap-1">
                {formatPct(pnl.gpPct)}
                <EducationInfoIcon metricKey="gross_profit_margin_pct" size="sm" />
              </span>
            </div>
          </div>
        </div>
      </div>

      {showEducation && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0 }} onClick={() => setShowEducation(false)}>
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          <div className="relative w-full max-w-md mx-auto rounded-2xl border border-border bg-[#0d0f13] p-4 sm:p-5 shadow-2xl overflow-y-auto max-h-[85vh] min-w-0" onClick={(e) => e.stopPropagation()}>
            <button type="button" onClick={() => setShowEducation(false)} className="absolute top-3 right-3 min-h-[44px] min-w-[44px] flex items-center justify-center text-muted hover:text-white text-lg -mr-2" aria-label="Close">✕</button>
            <h3 className="text-base font-semibold text-brand mb-1">🎓 Monthly P&L View</h3>
            <p className="text-xs text-muted mb-4">Track profitability over time. Spot seasonal patterns.</p>
            <div className="space-y-3 text-sm">
              <div>
                <h4 className="font-medium text-white mb-1">What This Page Measures</h4>
                <p className="text-muted text-xs leading-relaxed">One month of sales, labor, food, disposables, voids, waste, and customers rolled up by store. PRIME % for the month tells you if you made money after the big three costs. A $80K month at 58% PRIME means you left $2,400 on the table vs a 55% target.</p>
              </div>
              <div>
                <h4 className="font-medium text-white mb-1">Why Monthly Beats Daily Guesswork</h4>
                <p className="text-muted text-xs leading-relaxed">Daily numbers jump around. One slow Tuesday doesn't mean the model is broken. Monthly smooths that out. You see real trends: labor creeping up, food cost spiking in summer, or a store that's been red for three months. That's when you act — renegotiate a contract, fix scheduling, or dig into waste.</p>
              </div>
              <div>
                <h4 className="font-medium text-white mb-1 flex items-center gap-2">
                  Seasonal Patterns
                  <EducationInfoIcon metricKey="seasonal_variation" size="sm" />
                </h4>
                <p className="text-muted text-xs leading-relaxed">Pizza does more in football season and holidays. Compare this month to last month and last year. If you're up 5% on sales but labor is up 12%, you're not winning. Use this view to set next month's targets and catch drift before it becomes a habit.</p>
              </div>
              <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-3">
                <h4 className="font-medium text-red-400 text-xs mb-2">📕 When the Month Goes Red</h4>
                <p className="text-muted text-xs leading-relaxed">PRIME over target for the full month = you're leaving thousands on the table. Break it down by store. One store dragging the average? Fix that location. All stores red? Labor and food discipline slipped — tighten portions, trim overlap, and re-bid high-cost vendors. Don't wait for the accountant. Fix it now.</p>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

export default function MonthlyPage() {
  return (
    <Suspense fallback={
      <div className="space-y-4 animate-pulse">
        <div className="dashboard-toolbar p-3 sm:p-5"><div className="h-7 w-48 bg-muted/20 rounded" /></div>
        <div className="h-32 bg-muted/20 rounded-lg" />
        <div className="h-48 bg-muted/20 rounded-lg" />
      </div>
    }>
      <MonthlyContent />
    </Suspense>
  );
}
