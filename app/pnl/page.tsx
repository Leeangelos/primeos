"use client";

import { useMemo, useState, useRef } from "react";
import { Share2 } from "lucide-react";
import {
  COCKPIT_STORE_SLUGS,
  COCKPIT_TARGETS,
  type CockpitStoreSlug,
} from "@/lib/cockpit-config";
import { getStoreColor } from "@/lib/store-colors";
import { useAuth } from "@/src/lib/auth-context";
import { isNewUser, getNewUserStoreName } from "@/src/lib/user-scope";
import { EducationInfoIcon } from "@/src/components/education/InfoIcon";
import { ExportButton } from "@/src/components/ui/ExportButton";
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

function getMTDRange(): { startDate: string; endDate: string; label: string } {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const start = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const end = yesterday.toISOString().slice(0, 10);
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

export default function PnlPage() {
  const { session } = useAuth();
  const newUser = isNewUser(session);
  const newUserStoreName = getNewUserStoreName(session);
  const [storeFilter, setStoreFilter] = useState<"all" | CockpitStoreSlug>("kent");
  const [shareToast, setShareToast] = useState(false);
  const [shareGenerating, setShareGenerating] = useState(false);
  const shareRef = useRef<HTMLDivElement>(null);

  const { startDate, endDate, label: mtdLabel } = useMemo(() => getMTDRange(), []);

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

  async function handleShare() {
    setShareGenerating(true);
    const textBody = [
      `Revenue: ${formatDollars(pnl.totalSales)}`,
      `COGS: ${formatDollars(pnl.totalCOGS)} (${formatPct(pnl.cogsPct)})`,
      `Gross Profit: ${formatDollars(pnl.grossProfit)} (${formatPct(pnl.gpPct)})`,
      `Labor: ${formatDollars(pnl.totalLabor)} (${formatPct(pnl.laborPct)})`,
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

  if (newUser) {
    return (
      <div className="space-y-6 min-w-0 overflow-x-hidden pb-28">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h1 className="text-lg font-semibold sm:text-2xl text-white">GP P&L</h1>
          <EducationInfoIcon metricKey="gp_vs_net_profit" />
        </div>
        <p className="text-xs text-muted">{newUserStoreName}</p>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 text-center">
          <p className="text-sm text-zinc-300">Your P&L will populate when transaction data starts flowing. Tap any (i) icon to learn what each line item means.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 min-w-0 overflow-x-hidden pb-28">
      {shareToast && (
        <div className="fixed bottom-20 left-4 right-4 z-50 bg-emerald-600/20 border border-emerald-700/30 rounded-xl px-4 py-2.5 shadow-lg text-center">
          <p className="text-xs text-emerald-400 font-medium">Copied to clipboard</p>
        </div>
      )}
      <div className={`dashboard-toolbar p-3 sm:p-5 space-y-3 ${getStoreColor(storeFilter === "all" ? "kent" : storeFilter).glow}`}>
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h1 className="text-lg font-semibold sm:text-2xl">GP P&L — Gross Profit</h1>
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
        <p className="text-xs text-muted">Month-to-date rolling view. What you control daily.</p>
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

      {/* GP vs NET education banner */}
      <div className="rounded-xl border border-slate-600 bg-slate-800/80 p-4 min-w-0">
        <p className="text-sm text-slate-200 leading-relaxed">
          This is your <strong className="text-white">Gross Profit P&L</strong> — what you control daily. For your full picture including rent, insurance, and fixed costs, Actual P&L is coming in Phase 2.
        </p>
      </div>

      <div ref={shareRef}>
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden min-w-0">
        <div className="flex justify-between items-center p-4 border-b border-slate-700">
          <h3 className="text-sm font-semibold text-white">{mtdLabel} MTD</h3>
          <span className="text-xs text-slate-400">{storeName}</span>
        </div>

        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-xs text-slate-500 uppercase tracking-wide">Revenue</span>
            <EducationInfoIcon metricKey="revenue_pl" size="sm" />
          </div>
          <div className="flex justify-between items-center gap-2 py-1.5">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-slate-300">Total Sales</span>
              <EducationInfoIcon metricKey="daily_sales" />
            </div>
            <span className="tabular-nums font-medium text-emerald-400 shrink-0">{formatDollars(pnl.totalSales)}</span>
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
              <span className="text-emerald-400 font-bold text-lg tabular-nums">{formatDollars(pnl.grossProfit)}</span>
              <span className="text-xs text-slate-400 ml-2 tabular-nums flex items-center gap-1">
                {formatPct(pnl.gpPct)}
                <EducationInfoIcon metricKey="gross_profit_margin_pct" size="sm" />
              </span>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
