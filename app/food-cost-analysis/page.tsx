"use client";

import { useState, useMemo, useEffect } from "react";
import { Scale, Info } from "lucide-react";
import { useAuth } from "@/src/lib/auth-context";
import { isNewUser, getNewUserStoreName } from "@/src/lib/user-scope";
import { formatDollars, formatPct } from "@/src/lib/formatters";
import { EducationInfoIcon } from "@/src/components/education/InfoIcon";
import { DataDisclaimer } from "@/src/components/ui/DataDisclaimer";
import { COCKPIT_STORE_SLUGS, COCKPIT_TARGETS } from "@/lib/cockpit-config";

const STORE_OPTIONS = COCKPIT_STORE_SLUGS.map((s) => ({ value: s, label: COCKPIT_TARGETS[s].name }));

export default function FoodCostAnalysisPage() {
  const { session, loading } = useAuth();
  const newUser = isNewUser(session);
  const newUserStoreName = getNewUserStoreName(session);
  const [selectedStore, setSelectedStore] = useState("kent");
  const [showFormula, setShowFormula] = useState(false);
  const [rangeData, setRangeData] = useState<{
    sales: { net_sales?: number }[];
    purchases: { food_spend?: number; paper_spend?: number; beverage_spend?: number }[];
    theoretical_food_cost_pct?: number | null;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/dashboard/daily-data?store_id=${encodeURIComponent(selectedStore)}&range=30`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled || !d.sales) return;
        setRangeData({
          sales: d.sales ?? [],
          purchases: d.purchases ?? [],
          theoretical_food_cost_pct: d.theoretical_food_cost_pct ?? null,
        });
      })
      .catch(() => setRangeData(null));
    return () => { cancelled = true; };
  }, [selectedStore]);

  const { totalSales, totalFood, actualPct, hasPurchaseData } = useMemo(() => {
    if (!rangeData?.sales?.length) return { totalSales: 0, totalFood: 0, actualPct: 0, hasPurchaseData: false };
    const totalSales = rangeData.sales.reduce((s, r) => s + (r.net_sales ?? 0), 0);
    const totalFood = rangeData.purchases.reduce((s, r) => s + (r.food_spend ?? 0), 0);
    const hasPurchaseData = (rangeData.purchases?.length ?? 0) > 0;
    const actualPct = hasPurchaseData && totalSales > 0 ? (totalFood / totalSales) * 100 : 0;
    return { totalSales, totalFood, actualPct, hasPurchaseData };
  }, [rangeData]);

  const { foodTotal, paperTotal, beverageTotal, totalPurchases } = useMemo(() => {
    if (!rangeData?.purchases?.length) return { foodTotal: 0, paperTotal: 0, beverageTotal: 0, totalPurchases: 0 };
    const foodTotal = rangeData.purchases.reduce((s, r) => s + (r.food_spend ?? 0), 0);
    const paperTotal = rangeData.purchases.reduce((s, r) => s + (r.paper_spend ?? 0), 0);
    const beverageTotal = rangeData.purchases.reduce((s, r) => s + (r.beverage_spend ?? 0), 0);
    const totalPurchases = foodTotal + paperTotal + beverageTotal;
    return { foodTotal, paperTotal, beverageTotal, totalPurchases };
  }, [rangeData]);

  if (loading) return <div className="min-h-screen bg-zinc-950" />;
  if (newUser) {
    return (
      <div className="space-y-4 pb-28 min-w-0 overflow-x-hidden">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-white">Food Cost Analysis</h1>
            <p className="text-xs text-slate-400 mt-0.5">{newUserStoreName}</p>
          </div>
          <EducationInfoIcon metricKey="theoretical_food_cost" size="lg" />
        </div>
        <div className="bg-zinc-900/50 rounded-xl border border-zinc-800/50 shadow-sm p-6 space-y-3">
          <p className="text-sm text-zinc-300">Food Cost Analysis compares theoretical (recipe) cost to actual spend so you can spot variance and leaks. Once invoice and sales data are connected, you&apos;ll see full breakdowns by category and month.</p>
          <p className="text-sm text-zinc-300">Ready for live data? Reach out to us and we&apos;ll get your system connected.</p>
          <a href="mailto:hello@getprimeos.com" className="text-[#E65100] underline font-semibold inline-block">hello@getprimeos.com</a>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-28 min-w-0 overflow-x-hidden">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-white">Food Cost Analysis</h1>
          <p className="text-xs text-slate-400 mt-0.5">Actual food cost powered by MarginEdge invoices</p>
        </div>
        <EducationInfoIcon metricKey="theoretical_food_cost" size="lg" />
      </div>

      <div className="flex items-center gap-2 mb-2">
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

      {/* THE GAP — Hero Card */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <h3 className="text-xs text-slate-500 uppercase tracking-wide">Actual food cost</h3>
          <EducationInfoIcon metricKey="actual_food_cost" size="sm" />
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <div className="flex items-center gap-1">
              <span className="text-xs text-slate-500">Actual</span>
              <EducationInfoIcon metricKey="actual_food_cost" size="sm" />
            </div>
            <div className="text-lg text-red-400 font-bold">{formatDollars(totalFood)}</div>
            <div className="text-[10px] text-slate-600">
              {hasPurchaseData ? (
                <>
                  {formatPct(actualPct)} of revenue <span className="text-emerald-400 text-xs">● Invoices</span>
                </>
              ) : (
                <span className="text-amber-400">Awaiting invoices</span>
              )}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Revenue (30d)</div>
            <div className="text-lg font-bold text-white">{formatDollars(totalSales)}</div>
            <div className="text-[10px] text-slate-600">Net sales <span className="text-emerald-400">● POS</span></div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowFormula(!showFormula)}
          className="flex items-center gap-1 mt-3 text-xs text-blue-400 hover:text-blue-300"
        >
          <Info className="w-3 h-3" />
          <span>{showFormula ? "Hide formula" : "Show your work"}</span>
        </button>
        {showFormula && (
          <div className="mt-2 p-3 rounded-lg bg-slate-700/50 text-[10px] text-slate-400 space-y-1 font-mono">
            <p>Actual = total food spend from MarginEdge (last 30 days) = {formatDollars(totalFood)}</p>
            <p>Revenue = net sales from POS = {formatDollars(totalSales)}</p>
            <p>Actual food cost % = {formatPct(actualPct)}</p>
            <p>Benchmarks for pizza operations typically run 28–32% food cost.</p>
          </div>
        )}
      </div>

      {rangeData !== null && totalSales === 0 && (
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6 text-center text-zinc-500 mb-4">
          <p className="text-sm">No data for this store.</p>
          <p className="text-xs mt-1">Connect your POS and upload invoices. <a href="mailto:hello@getprimeos.com" className="text-[#E65100] underline">hello@getprimeos.com</a></p>
        </div>
      )}

      {rangeData !== null && totalSales > 0 && (
        <>
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 mb-4">
            <h3 className="text-sm font-semibold text-white mb-2">Last 30 days — Actual food cost</h3>
            <p className="text-xs text-slate-500">Blended from MarginEdge invoices and POS sales.</p>
            <p className="text-2xl font-bold text-white mt-2">
              {hasPurchaseData ? (
                <>
                  {formatPct(actualPct)} <span className="text-emerald-400 text-xs">● Invoices + POS</span>
                </>
              ) : (
                <span className="text-amber-400 text-base">Awaiting invoices</span>
              )}
            </p>
          </div>

          <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 mb-4">
            <h3 className="text-sm font-semibold text-white mb-1">Industry benchmark — pizza operations</h3>
            <p className="text-xs text-slate-500 mb-2">Typical food cost benchmark: 28–32% of net sales.</p>
            {hasPurchaseData && totalSales > 0 ? (
              <>
                <div className="flex items-baseline justify-between mb-2">
                  <div>
                    <p className="text-xs text-slate-400">Angelo&apos;s actual</p>
                    <p className="text-lg font-semibold text-white">{formatPct(actualPct)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400">Status vs benchmark</p>
                    <p
                      className={`text-sm font-semibold ${
                        actualPct > 32 ? "text-red-400" : "text-emerald-400"
                      }`}
                    >
                      {actualPct > 32 ? "Above benchmark" : "Within benchmark"}
                    </p>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500">
                  Gap to upper benchmark (32%): {formatPct(Math.abs(actualPct - 32))}
                </p>
              </>
            ) : (
              <p className="text-xs text-amber-400">Awaiting invoices — benchmark comparison will appear once invoices are synced.</p>
            )}
          </div>

          <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 mb-4">
            <h3 className="text-sm font-semibold text-white mb-2">Category breakdown — where the spend goes</h3>
            {hasPurchaseData && totalPurchases > 0 ? (
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div>
                  <p className="text-slate-500">Food</p>
                  <p className="text-white font-semibold">
                    {formatPct((foodTotal / totalPurchases) * 100)}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">Paper</p>
                  <p className="text-white font-semibold">
                    {formatPct((paperTotal / totalPurchases) * 100)}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">Beverages</p>
                  <p className="text-white font-semibold">
                    {formatPct((beverageTotal / totalPurchases) * 100)}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-amber-400">Awaiting invoices — category mix will appear once purchases are synced.</p>
            )}
          </div>
        </>
      )}

      <DataDisclaimer confidence="high" details="Actual food cost powered by MarginEdge invoices and POS sales. Benchmarks are industry ranges for pizza operations." />
    </div>
  );
}
