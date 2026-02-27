"use client";

import { useState, useMemo, useEffect } from "react";
import { Scale, Info } from "lucide-react";
import { formatDollars, formatPct } from "@/src/lib/formatters";
import { EducationInfoIcon } from "@/src/components/education/InfoIcon";
import { DataDisclaimer } from "@/src/components/ui/DataDisclaimer";
import { SEED_STORES } from "@/src/lib/seed-data";

// Theoretical vs Actual food cost data — 6 months per store
// In production: theoretical = sum(items sold × recipe cost per item)
// In production: actual = total food invoices for the period (adjusted for inventory)
const FOOD_COST_DATA: Record<string, { month: string; theoretical: number; actual: number; revenue: number }[]> = {
  kent: [
    { month: "Sep 2025", theoretical: 12800, actual: 14200, revenue: 46200 },
    { month: "Oct 2025", theoretical: 13400, actual: 15100, revenue: 48800 },
    { month: "Nov 2025", theoretical: 12200, actual: 13600, revenue: 43600 },
    { month: "Dec 2025", theoretical: 14100, actual: 16200, revenue: 52400 },
    { month: "Jan 2026", theoretical: 11800, actual: 13100, revenue: 41200 },
    { month: "Feb 2026", theoretical: 13200, actual: 15400, revenue: 47600 },
  ],
  aurora: [
    { month: "Sep 2025", theoretical: 15200, actual: 17800, revenue: 54800 },
    { month: "Oct 2025", theoretical: 15800, actual: 18200, revenue: 56200 },
    { month: "Nov 2025", theoretical: 14400, actual: 16800, revenue: 50400 },
    { month: "Dec 2025", theoretical: 16800, actual: 19600, revenue: 60800 },
    { month: "Jan 2026", theoretical: 14000, actual: 16200, revenue: 48400 },
    { month: "Feb 2026", theoretical: 15600, actual: 18400, revenue: 55200 },
  ],
  lindseys: [
    { month: "Sep 2025", theoretical: 8400, actual: 9200, revenue: 30800 },
    { month: "Oct 2025", theoretical: 8800, actual: 9600, revenue: 32400 },
    { month: "Nov 2025", theoretical: 8000, actual: 8800, revenue: 29200 },
    { month: "Dec 2025", theoretical: 9200, actual: 10400, revenue: 35600 },
    { month: "Jan 2026", theoretical: 7600, actual: 8400, revenue: 27800 },
    { month: "Feb 2026", theoretical: 8600, actual: 9800, revenue: 31400 },
  ],
};

// Top variance items — what's causing the gap
const VARIANCE_ITEMS = [
  { item: "Large Cheese Pizza", theoreticalCost: 4.2, actualAvgCost: 4.85, unitsSold: 840, variance: 546, cause: "Cheese overportioning — avg 14.2oz vs recipe 12oz" },
  { item: "Traditional Wings 10pc", theoreticalCost: 5.8, actualAvgCost: 6.45, unitsSold: 320, variance: 208, cause: "Wing prices up 8% from Hillcrest; recipe cost not updated" },
  { item: "Supreme Pizza Large", theoreticalCost: 6.1, actualAvgCost: 6.9, unitsSold: 280, variance: 224, cause: "Topping overload — new employees not following portion guide" },
  { item: "Pepperoni Roll", theoreticalCost: 3.4, actualAvgCost: 3.95, unitsSold: 180, variance: 99, cause: "Pepperoni price increase not reflected in recipe" },
  { item: "Meatball Sub", theoreticalCost: 4.5, actualAvgCost: 4.8, unitsSold: 150, variance: 45, cause: "Extra sauce being added without charge" },
];

const STORE_OPTIONS = SEED_STORES.map((s) => ({ value: s.slug, label: s.name }));

export default function FoodCostAnalysisPage() {
  const [selectedStore, setSelectedStore] = useState("kent");
  const [selectedMonth, setSelectedMonth] = useState(5); // default last month
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [showFormula, setShowFormula] = useState(false);

  const storeData = useMemo(() => FOOD_COST_DATA[selectedStore] ?? [], [selectedStore]);
  useEffect(() => {
    if (selectedMonth >= storeData.length) setSelectedMonth(Math.max(0, storeData.length - 1));
  }, [selectedStore, storeData.length, selectedMonth]);

  const data = storeData[selectedMonth];
  const theoretical = data?.theoretical ?? 0;
  const actual = data?.actual ?? 0;
  const revenue = data?.revenue ?? 1;
  const variance = actual - theoretical;
  const theoreticalPct = revenue ? (theoretical / revenue) * 100 : 0;
  const actualPct = revenue ? (actual / revenue) * 100 : 0;
  const variancePct = theoretical ? (variance / theoretical) * 100 : 0;

  return (
    <div className="space-y-4 pb-28 min-w-0 overflow-x-hidden">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-white">Food Cost Analysis</h1>
          <p className="text-xs text-slate-400 mt-0.5">Theoretical vs actual — where the money leaks</p>
        </div>
        <EducationInfoIcon metricKey="theoretical_food_cost" />
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

      <div className="flex flex-wrap gap-1 mb-4">
        {storeData.map((d, i) => (
          <button
            key={d.month}
            type="button"
            onClick={() => setSelectedMonth(i)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
              selectedMonth === i ? "bg-slate-700 text-white border border-slate-600" : "bg-slate-800/80 text-slate-400 hover:text-slate-300 border border-slate-700"
            }`}
          >
            {d.month}
          </button>
        ))}
      </div>

      {/* THE GAP — Hero Card */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
        <h3 className="text-xs text-slate-500 uppercase tracking-wide">The Variance Gap</h3>
        <EducationInfoIcon metricKey="variance_gap" size="sm" />
      </div>

        <div className="grid grid-cols-3 gap-3 mb-3">
          <div>
            <div className="flex items-center gap-1">
              <span className="text-xs text-slate-500">Theoretical</span>
              <EducationInfoIcon metricKey="theoretical_food_cost" size="sm" />
            </div>
            <div className="text-lg text-emerald-400 font-bold">{formatDollars(theoretical)}</div>
            <div className="text-[10px] text-slate-600">{formatPct(theoreticalPct)} of revenue</div>
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span className="text-xs text-slate-500">Actual</span>
              <EducationInfoIcon metricKey="actual_food_cost" size="sm" />
            </div>
            <div className="text-lg text-red-400 font-bold">{formatDollars(actual)}</div>
            <div className="text-[10px] text-slate-600">{formatPct(actualPct)} of revenue</div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Variance</div>
            <div
              className={`text-lg font-bold ${variancePct > 5 ? "text-red-400" : variancePct > 2 ? "text-amber-400" : "text-emerald-400"}`}
            >
              {formatDollars(variance)}
            </div>
            <div
              className={`text-[10px] ${variancePct > 5 ? "text-red-400" : variancePct > 2 ? "text-amber-400" : "text-emerald-400"}`}
            >
              {variancePct.toFixed(1)}% over theoretical
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div
            className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
              variancePct > 5 ? "bg-red-600/20 text-red-400" : variancePct > 2 ? "bg-amber-600/20 text-amber-400" : "bg-emerald-600/20 text-emerald-400"
            }`}
          >
            {variancePct > 5 ? "RED" : variancePct > 2 ? "YELLOW" : "GREEN"}
          </div>
          <span className="text-xs text-slate-500">
            {variancePct > 5
              ? "Significant variance — investigate immediately"
              : variancePct > 2
                ? "Moderate variance — review common causes"
                : "Healthy variance — minor waste is normal"}
          </span>
        </div>

        <button
          type="button"
          onClick={() => setShowFormula(!showFormula)}
          className="flex items-center gap-1 mt-3 text-xs text-blue-400 hover:text-blue-300"
        >
          <Info className="w-3 h-3" />
          <span>{showFormula ? "Hide formula" : "Show your work"}</span>
        </button>
        {showFormula && data && (
          <div className="mt-2 p-3 rounded-lg bg-slate-700/50 text-[10px] text-slate-400 space-y-1 font-mono">
            <p>Theoretical = Σ(items sold × recipe cost per item) = {formatDollars(theoretical)}</p>
            <p>Actual = total food invoices for {data.month} = {formatDollars(actual)}</p>
            <p>Variance = {formatDollars(actual)} − {formatDollars(theoretical)} = {formatDollars(variance)}</p>
            <p>Variance % = {formatDollars(variance)} ÷ {formatDollars(theoretical)} × 100 = {variancePct.toFixed(1)}%</p>
          </div>
        )}
      </div>

      {/* Annualized Impact */}
      <div className="bg-red-600/10 rounded-xl border border-red-700/30 p-3 mb-4">
        <p className="text-xs text-red-300">
          At this variance rate, you&apos;re losing approximately{" "}
          <span className="text-white font-semibold">{formatDollars(variance * 12)}/year</span> to the gap between theoretical and actual food cost. Reducing variance from {variancePct.toFixed(1)}% to 2% would save approximately{" "}
          <span className="text-white font-semibold">{formatDollars(Math.round((variance - theoretical * 0.02) * 12))}/year</span>.
        </p>
      </div>

      {/* 6-Month Trend */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 mb-4">
        <h3 className="text-sm font-semibold text-white mb-3">Variance Trend</h3>
        <div className="space-y-2">
          {storeData.map((d, i) => {
            const v = d.actual - d.theoretical;
            const vPct = (v / d.theoretical) * 100;
            return (
              <button
                key={d.month}
                type="button"
                onClick={() => setSelectedMonth(i)}
                className={`w-full flex items-center justify-between p-2 rounded-lg transition-colors ${selectedMonth === i ? "bg-slate-700/50 border border-slate-600" : "hover:bg-slate-700/30"}`}
              >
                <span className="text-xs text-slate-400">{d.month}</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-500">{formatDollars(v)}</span>
                  <span
                    className={`text-xs font-medium ${vPct > 5 ? "text-red-400" : vPct > 2 ? "text-amber-400" : "text-emerald-400"}`}
                  >
                    {vPct.toFixed(1)}%
                  </span>
                  <div
                    className={`w-2 h-2 rounded-full ${vPct > 5 ? "bg-red-400" : vPct > 2 ? "bg-amber-400" : "bg-emerald-400"}`}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Cross-Location Comparison */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
        <h3 className="text-sm font-semibold text-white">By Location — Latest Month</h3>
        <EducationInfoIcon metricKey="cross_location_comparison" size="sm" />
      </div>
        {(["kent", "aurora", "lindseys"] as const).map((storeId) => {
          const d = FOOD_COST_DATA[storeId];
          const latest = d[d.length - 1];
          const v = latest.actual - latest.theoretical;
          const vPct = (v / latest.theoretical) * 100;
          const storeNames: Record<string, string> = { kent: "LeeAngelo's Kent", aurora: "LeeAngelo's Aurora", lindseys: "Lindsey's" };
          return (
            <div
              key={storeId}
              className={`flex items-center justify-between p-2 rounded-lg mb-1 ${storeId === selectedStore ? "bg-slate-700/50 border border-slate-600" : ""}`}
            >
              <span className="text-xs text-slate-300">{storeNames[storeId]}</span>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-500">{formatDollars(v)} gap</span>
                <span
                  className={`text-xs font-medium ${vPct > 5 ? "text-red-400" : vPct > 2 ? "text-amber-400" : "text-emerald-400"}`}
                >
                  {vPct.toFixed(1)}%
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Top Variance Items */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 mb-4">
        <h3 className="text-sm font-semibold text-white mb-1">Where the Gap Comes From</h3>
        <p className="text-xs text-slate-500 mb-3">Top items contributing to variance this month</p>

        {VARIANCE_ITEMS.map((item, i) => (
          <div key={i} className="mb-2">
            <button
              type="button"
              onClick={() => setExpandedItem(expandedItem === item.item ? null : item.item)}
              className="w-full text-left"
            >
              <div className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-700/30">
                <div>
                  <div className="text-sm text-white">{item.item}</div>
                  <div className="text-xs text-slate-500">{item.unitsSold} sold this month</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-red-400 font-medium">+{formatDollars(item.variance)}</div>
                  <div className="text-[10px] text-slate-500">
                    ${item.theoreticalCost.toFixed(2)} → ${item.actualAvgCost.toFixed(2)}/unit
                  </div>
                </div>
              </div>
            </button>
            {expandedItem === item.item && (
              <div className="ml-2 p-2 rounded-lg bg-amber-600/10 border border-amber-700/30 mt-1">
                <p className="text-xs text-amber-300">Likely cause: {item.cause}</p>
                <p className="text-[10px] text-slate-500 mt-1">
                  Variance: ({item.unitsSold} units) × (${item.actualAvgCost.toFixed(2)} − ${item.theoreticalCost.toFixed(2)}) = {formatDollars(item.variance)}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      <DataDisclaimer confidence="medium" details="Theoretical costs based on estimated recipe costs. Import your sales mix and invoices for higher accuracy." />
    </div>
  );
}
