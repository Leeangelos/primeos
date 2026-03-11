"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MenuItem } from "@/src/lib/menu-data";
import {
  getMenuByStore,
  getCategories,
  getComparableItems,
  getMenuGaps,
} from "@/src/lib/menu-data";
import { useAuth } from "@/src/lib/auth-context";
import { isNewUser, getNewUserStoreName } from "@/src/lib/user-scope";
import { formatDollars } from "@/src/lib/formatters";
import { EducationInfoIcon } from "@/src/components/education/InfoIcon";
import { DataDisclaimer } from "@/src/components/ui/DataDisclaimer";
import { SmartQuestion } from "@/src/components/ui/SmartQuestion";

type KitchenIqItem = {
  item_name: string;
  size: string;
  sizeDisplay: string;
  category: string;
  total_units: number;
  total_revenue: number;
  avg_unit_price: number;
  cost_to_make: number | null;
  includes_disposables: boolean;
  notes: string | null;
};

type KitchenIqData = {
  catalog: KitchenIqItem[];
  actualHillcrestLast30: number;
};

const PRICING_GAPS = [
  { item_name: "Large Pepperoni Pizza", store_id: "kent", menuPrice: 29.95, avgActualPrice: 27.4, unitsSold: 180, gap: -2.55, gapPct: -8.5, cause: "Possible causes: unapplied POS price updates, staff discounts, coupon overuse, or incorrect ringing." },
  { item_name: "Large Cheese Pizza", store_id: "kent", menuPrice: 15.95, avgActualPrice: 15.2, gapPct: -4.7, unitsSold: 420, gap: -0.75, cause: "Within acceptable range. Minor variance likely from loyalty discounts." },
  { item_name: "Traditional Wings 10pc", store_id: "kent", menuPrice: 15.95, avgActualPrice: 14.5, unitsSold: 140, gap: -1.45, gapPct: -9.1, cause: "Possible causes: combo pricing applied incorrectly, or manual price override at register." },
  { item_name: "Family Supreme Pizza", store_id: "aurora", menuPrice: 34.99, avgActualPrice: 32.1, unitsSold: 85, gap: -2.89, gapPct: -8.3, cause: "Aurora showing larger gap than Kent on same item. Consider auditing POS pricing at Aurora." },
  { item_name: "Cheesy Bread Large", store_id: "kent", menuPrice: 22.99, avgActualPrice: 22.99, unitsSold: 95, gap: 0, gapPct: 0, cause: "No gap. Price is correct." },
  { item_name: "Boom Boom Shrimp Wrap", store_id: "aurora", menuPrice: 19.99, avgActualPrice: 17.99, unitsSold: 45, gap: -2, gapPct: -10, cause: "Significant gap. Check if an old price is still programmed in the POS." },
];

const STORE_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "All Locations" },
  { value: "kent", label: "LeeAngelo's Kent" },
  { value: "aurora", label: "LeeAngelo's Aurora" },
  { value: "lindseys", label: "Lindsey's" },
];

const STORE_NAMES: Record<string, string> = {
  kent: "Kent",
  aurora: "Aurora",
  lindseys: "Lindsey's",
};

function StatCard({
  label,
  value,
  metricKey,
}: {
  label: string;
  value: string | number;
  metricKey?: string;
}) {
  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 p-3 flex items-center justify-between">
      <div>
        <div className="text-[10px] uppercase tracking-wide text-slate-500">{label}</div>
        <div className="text-lg font-bold text-white tabular-nums">{value}</div>
      </div>
      {metricKey && <EducationInfoIcon metricKey={metricKey} />}
    </div>
  );
}

function useComparableWithGaps() {
  return useMemo(() => {
    const items = getComparableItems();
    return items.map((item) => {
      const allPricesBySize = new Map<string, number[]>();
      for (const store of item.stores) {
        for (const s of store.sizes) {
          const list = allPricesBySize.get(s.size_name) ?? [];
          list.push(s.price);
          allPricesBySize.set(s.size_name, list);
        }
      }
      let maxGapPct = 0;
      for (const prices of allPricesBySize.values()) {
        const valid = prices.filter((p) => p > 0);
        if (valid.length < 2) continue;
        const min = Math.min(...valid);
        const max = Math.max(...valid);
        const gapPct = min > 0 ? ((max - min) / min) * 100 : 0;
        if (gapPct > maxGapPct) maxGapPct = gapPct;
      }
      const hasLargeGap = maxGapPct >= 15;
      const commonSizes = [...allPricesBySize.keys()].sort();
      return { ...item, hasLargeGap, gapPct: maxGapPct, commonSizes };
    });
  }, []);
}

export default function MenuIntelligencePage() {
  const { session, loading } = useAuth();
  const newUser = isNewUser(session);
  const newUserStoreName = getNewUserStoreName(session);
  const [storeId, setStoreId] = useState("all");
  const [view, setView] = useState<"menu" | "compare" | "gaps" | "pricing-gaps" | "kitchen-iq">("menu");
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set());

  const [kitchenIqData, setKitchenIqData] = useState<KitchenIqData | null>(null);
  const [kitchenIqLoading, setKitchenIqLoading] = useState(false);
  const [selectedKitchenItem, setSelectedKitchenItem] = useState<KitchenIqItem | null>(null);
  const [costInput, setCostInput] = useState("");
  const [includesDisposables, setIncludesDisposables] = useState(false);
  const [costSheetMounted, setCostSheetMounted] = useState(false);
  const [savingCost, setSavingCost] = useState(false);

  useEffect(() => {
    if (view !== "kitchen-iq") return;
    let cancelled = false;
    setKitchenIqLoading(true);
    fetch("/api/kitchen-iq")
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled && d.catalog) setKitchenIqData({ catalog: d.catalog, actualHillcrestLast30: d.actualHillcrestLast30 ?? 0 });
      })
      .catch(() => { if (!cancelled) setKitchenIqData(null); })
      .finally(() => { if (!cancelled) setKitchenIqLoading(false); });
    return () => { cancelled = true; };
  }, [view]);

  useEffect(() => {
    if (selectedKitchenItem) {
      setCostInput(selectedKitchenItem.cost_to_make != null ? String(selectedKitchenItem.cost_to_make) : "");
      setIncludesDisposables(selectedKitchenItem.includes_disposables);
      const t = requestAnimationFrame(() => setCostSheetMounted(true));
      return () => cancelAnimationFrame(t);
    }
    setCostSheetMounted(false);
  }, [selectedKitchenItem]);

  const refetchKitchenIq = useCallback(() => {
    fetch("/api/kitchen-iq")
      .then((r) => r.json())
      .then((d) => {
        if (d.catalog) setKitchenIqData({ catalog: d.catalog, actualHillcrestLast30: d.actualHillcrestLast30 ?? 0 });
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedKitchenItem) return;
    const onEscape = (e: KeyboardEvent) => e.key === "Escape" && setSelectedKitchenItem(null);
    document.addEventListener("keydown", onEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onEscape);
      document.body.style.overflow = "";
    };
  }, [selectedKitchenItem]);

  const items = useMemo(() => getMenuByStore(storeId), [storeId]);
  const categories = useMemo(() => getCategories(storeId), [storeId]);
  const gaps = useMemo(() => getMenuGaps(), []);
  const comparableWithGaps = useComparableWithGaps();

  const itemCount = items.length;
  const categoryCount = categories.length;
  const allPrices = useMemo(
    () => items.flatMap((i) => i.sizes.map((s) => s.price)),
    [items]
  );
  const avgPrice =
    allPrices.length > 0
      ? allPrices.reduce((a, b) => a + b, 0) / allPrices.length
      : 0;

  const itemsByCategory = useMemo(() => {
    const map = new Map<string, MenuItem[]>();
    for (const item of items) {
      const list = map.get(item.category) ?? [];
      list.push(item);
      map.set(item.category, list);
    }
    return map;
  }, [items]);

  const toggleCategory = (cat: string) => {
    setOpenCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  if (loading) return <div className="min-h-screen bg-zinc-950" />;
  if (newUser) {
    return (
      <div className="space-y-4 pb-28 min-w-0 overflow-x-hidden">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h1 className="text-xl font-bold text-white">Menu Intelligence</h1>
            <p className="text-xs text-slate-400 mt-0.5">{newUserStoreName}</p>
          </div>
          <EducationInfoIcon metricKey="menu_item_count" size="lg" />
        </div>
        <SmartQuestion page="menu" />
        <div className="bg-zinc-900/50 rounded-xl border border-zinc-800/50 shadow-sm p-6 text-center">
          <p className="text-sm text-zinc-300">Menu intelligence requires POS data to analyze your best and worst sellers.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-28 min-w-0 overflow-x-hidden">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-white">Menu Intelligence</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Live menu data from your public websites
          </p>
        </div>
        <EducationInfoIcon metricKey="menu_item_count" size="lg" />
      </div>
      <SmartQuestion page="menu" />
      <div className="bg-blue-950/30 rounded-xl border border-blue-800/50 p-3">
        <p className="text-xs text-blue-300">
          Menu prices last synced from your public website on February 23, 2026.
          When you update pricing in your POS, it pushes to your website
          automatically. PrimeOS re-syncs periodically.
        </p>
        <p className="text-xs text-slate-500 mt-1">
          Future: Connect your FoodTec API for real-time sync.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <label className="text-xs text-slate-500 shrink-0">Store:</label>
        <select
          value={storeId}
          onChange={(e) => setStoreId(e.target.value)}
          className="dashboard-input rounded-lg border border-slate-600 bg-black/30 px-3 py-2 text-sm text-white focus:border-brand/60 focus:outline-none"
        >
          {STORE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <StatCard label="Items" value={itemCount} metricKey="menu_item_count" />
        <StatCard label="Categories" value={categoryCount} />
        <StatCard
          label="Avg Price"
          value={`$${avgPrice.toFixed(2)}`}
          metricKey="menu_avg_price"
        />
      </div>

      <div className="flex bg-slate-800 rounded-lg p-0.5 border border-slate-700">
        <button
          type="button"
          onClick={() => setView("menu")}
          className={cn(
            "flex-1 py-2 rounded-md text-xs font-medium transition-colors",
            view === "menu"
              ? "bg-slate-700 text-white"
              : "text-slate-400 hover:text-slate-300"
          )}
        >
          Menu
        </button>
        <button
          type="button"
          onClick={() => setView("compare")}
          className={cn(
            "flex-1 py-2 rounded-md text-xs font-medium transition-colors",
            view === "compare"
              ? "bg-slate-700 text-white"
              : "text-slate-400 hover:text-slate-300"
          )}
        >
          Compare
        </button>
        <button
          type="button"
          onClick={() => setView("gaps")}
          className={cn(
            "flex-1 py-2 rounded-md text-xs font-medium transition-colors",
            view === "gaps"
              ? "bg-slate-700 text-white"
              : "text-slate-400 hover:text-slate-300"
          )}
        >
          Gaps
        </button>
        <button
          type="button"
          onClick={() => setView("pricing-gaps")}
          className={cn(
            "flex-1 py-2 rounded-md text-xs font-medium transition-colors",
            view === "pricing-gaps"
              ? "bg-slate-700 text-white"
              : "text-slate-400 hover:text-slate-300"
          )}
        >
          Price Gaps
        </button>
        <button
          type="button"
          onClick={() => setView("kitchen-iq")}
          className={cn(
            "flex-1 py-2 rounded-md text-xs font-medium transition-colors",
            view === "kitchen-iq"
              ? "bg-slate-700 text-white"
              : "text-slate-400 hover:text-slate-300"
          )}
        >
          Kitchen IQ
        </button>
      </div>

      {view === "menu" && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-sm font-semibold text-white">Menu</h3>
            <EducationInfoIcon metricKey="menu_item_margin" size="sm" />
          </div>
          {categories.map((cat) => {
            const isOpen = openCategories.has(cat);
            const catItems = itemsByCategory.get(cat) ?? [];
            return (
              <div
                key={cat}
                className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => toggleCategory(cat)}
                  className="w-full flex items-center justify-between p-3 text-left"
                >
                  <span className="text-sm font-semibold text-white">{cat}</span>
                  {isOpen ? (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  )}
                </button>
                {isOpen && (
                  <div className="px-3 pb-3 space-y-2">
                    {catItems.map((item) => (
                      <div
                        key={item.id}
                        className="bg-slate-800 rounded-xl border border-slate-700 p-3 mb-2"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-white">
                            {item.item_name}
                          </span>
                          {storeId !== "all" && (
                            <span className="text-[10px] text-slate-500 uppercase">
                              {STORE_NAMES[item.store_id] ?? item.store_id}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {item.sizes.map((size) => (
                            <span key={size.size_name} className="text-xs text-slate-400">
                              {size.size_name}:{" "}
                              <span className="text-emerald-400">
                                ${size.price.toFixed(2)}
                              </span>
                            </span>
                          ))}
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {item.ingredients_listed.map((ing) => (
                            <span
                              key={ing}
                              className="px-1.5 py-0.5 rounded text-[10px] bg-slate-700 text-slate-400"
                            >
                              {ing}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {view === "compare" && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-white">
              Cross-Location Price Comparison
            </h3>
            <EducationInfoIcon metricKey="menu_compare" />
          </div>
          {comparableWithGaps.map((item) => (
            <div
              key={item.item_name}
              className="bg-slate-800 rounded-xl border border-slate-700 p-3 mb-2"
            >
              <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                <span className="text-sm font-medium text-white min-w-0">
                  {item.item_name}
                </span>
                {item.hasLargeGap && item.stores.length >= 2 && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-600/20 text-amber-400 border border-amber-700/30 shrink-0">
                    {Math.round(item.gapPct)}% gap
                  </span>
                )}
              </div>
              {item.commonSizes.map((size) => (
                <div
                  key={size}
                  className="flex items-center justify-between text-xs py-1 border-b border-slate-700/50 last:border-0 gap-2 flex-wrap"
                >
                  <span className="text-slate-500 w-16 shrink-0">{size}</span>
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                    {item.stores.map((store) => {
                      const sizeData = store.sizes.find((s) => s.size_name === size);
                      const shortName =
                        store.storeName.split("'s ")[1] || store.storeName;
                      return sizeData ? (
                        <span key={store.store_id} className="text-slate-300">
                          {shortName}:{" "}
                          <span className="text-emerald-400">
                            ${sizeData.price.toFixed(2)}
                          </span>
                        </span>
                      ) : (
                        <span key={store.store_id} className="text-slate-600">
                          —
                        </span>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {view === "gaps" && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-white">
              Items Unique to One Location
            </h3>
            <EducationInfoIcon metricKey="menu_gap_analysis" />
          </div>
          {gaps.map((gap) => (
            <div
              key={gap.store_id}
              className="bg-slate-800 rounded-xl border border-slate-700 p-3"
            >
              <h4 className="text-sm font-medium text-white mb-2">
                {gap.storeName}
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {gap.uniqueItems.map((item) => (
                  <span
                    key={item}
                    className="px-2 py-1 rounded-lg text-xs bg-amber-600/10 text-amber-400 border border-amber-700/30"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {view === "pricing-gaps" && (() => {
        const filtered = PRICING_GAPS.filter(
          (item) => item.gapPct < -2 && (storeId === "all" || item.store_id === storeId)
        );
        const totalMonthlyGap = filtered.reduce((sum, item) => sum + Math.abs(item.gap * item.unitsSold), 0);
        return (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-white">Menu Price vs Actual Charge</h3>
              <EducationInfoIcon metricKey="menu_gap_pct" />
            </div>
            {filtered.length > 0 ? (
              <>
                <div className="bg-red-600/10 rounded-xl border border-red-700/30 p-3 mb-4">
                  <p className="text-xs text-red-300">
                    Price gaps on flagged items are costing approximately{" "}
                    <span className="text-white font-semibold">{formatDollars(totalMonthlyGap)}</span>/month in lost revenue.
                    That&apos;s <span className="text-white font-semibold">{formatDollars(totalMonthlyGap * 12)}</span>/year.
                  </p>
                </div>
                {filtered.map((item, i) => (
                  <div key={i} className="bg-slate-800 rounded-xl border border-slate-700 p-3 mb-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-white">{item.item_name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${item.gapPct < -5 ? "bg-red-600/20 text-red-400 border border-red-700/30" : "bg-amber-600/20 text-amber-400 border border-amber-700/30"}`}>
                        {item.gapPct.toFixed(1)}% gap
                      </span>
                    </div>
                    <div className="flex gap-4 text-xs text-slate-400 mb-2">
                      <span>Menu: ${item.menuPrice.toFixed(2)}</span>
                      <span>Avg Sale: ${item.avgActualPrice.toFixed(2)}</span>
                      <span>{item.unitsSold} sold</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-red-400">Revenue gap: {formatDollars(Math.abs(item.gap * item.unitsSold))}/month</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">{item.cause}</p>
                  </div>
                ))}
              </>
            ) : (
              <p className="text-xs text-slate-500">No items with a price gap &gt; 2% for this store.</p>
            )}
          </div>
        );
      })()}

      {view === "kitchen-iq" && (() => {
        const catalog = kitchenIqData?.catalog ?? [];
        const totalItems = catalog.length;
        const costedItems = catalog.filter((i) => i.cost_to_make != null && i.cost_to_make > 0);
        const costedCount = costedItems.length;
        const pct = totalItems > 0 ? Math.round((costedCount / totalItems) * 100) : 0;
        const theoretical = costedItems.reduce((s, i) => s + (i.cost_to_make ?? 0) * i.total_units, 0);
        const totalRevenue30 = catalog.reduce((s, i) => s + i.total_revenue, 0);
        const costedRevenue = costedItems.reduce((s, i) => s + i.total_revenue, 0);
        const costedRevenuePct = totalRevenue30 > 0 ? Math.round((costedRevenue / totalRevenue30) * 100) : 0;
        const actualHillcrest = kitchenIqData?.actualHillcrestLast30 ?? 0;
        const variance = actualHillcrest - theoretical;
        const uncostedByRevenue = catalog.filter((i) => i.cost_to_make == null || i.cost_to_make <= 0).slice(0, 5);
        const potentialVisibility = uncostedByRevenue.reduce((s, i) => s + i.total_revenue, 0);

        const milestones = [
          { min: 0, max: 0, label: "Cost your menu to unlock your true margins" },
          { min: 1, max: 1, label: "Started 🔥", count: 1 },
          { min: 25, max: 49, label: "Top items costed — estimates unlocked" },
          { min: 50, max: 74, label: "Halfway — food cost model active" },
          { min: 75, max: 99, label: "Almost there 💪" },
          { min: 100, max: 100, label: "Kitchen IQ: Elite 🏆 — Full theoretical food cost active" },
        ];
        let milestoneLabel = milestones[0].label;
        if (costedCount >= 1 && pct < 25) milestoneLabel = milestones[1].label;
        else if (pct >= 25 && pct < 50) milestoneLabel = milestones[2].label;
        else if (pct >= 50 && pct < 75) milestoneLabel = milestones[3].label;
        else if (pct >= 75 && pct < 100) milestoneLabel = milestones[4].label;
        else if (pct >= 100) milestoneLabel = milestones[5].label;

        const foodCostStatus = (pctVal: number) =>
          pctVal <= 32 ? "✅ Healthy" : pctVal <= 40 ? "⚠️ Watch" : "🔴 Investigate";

        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-white">Kitchen IQ</h2>

            {kitchenIqLoading ? (
              <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 text-center text-slate-400 text-sm">Loading…</div>
            ) : (
              <>
                <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-400">{costedCount} of {totalItems} items costed — {pct}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-700 overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-300"
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-2">{milestoneLabel}</p>
                </div>

                <p className="text-xs text-slate-400">Start with your top 20 — they drive 80% of your food cost story.</p>

                {costedCount >= 10 && (
                  <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
                    <h3 className="text-sm font-semibold text-white mb-2">Theoretical food cost</h3>
                    <p className="text-lg font-bold text-white">{formatDollars(theoretical)} <span className="text-sm font-normal text-slate-400">this month</span></p>
                    <p className="text-xs text-slate-500 mt-1">Based on {costedCount} costed items representing {costedRevenuePct}% of revenue</p>
                    <p className="text-xs text-slate-400 mt-1">Actual food cost (Hillcrest): {formatDollars(actualHillcrest)}</p>
                    <p className="text-xs text-slate-400 mt-1">Variance: {formatDollars(variance)} — Possible waste/theft/portioning</p>
                  </div>
                )}

                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-white">Items</h3>
                  {catalog.map((item) => {
                    const costed = item.cost_to_make != null && item.cost_to_make > 0;
                    const foodCostPct = costed && item.avg_unit_price > 0
                      ? ((item.cost_to_make ?? 0) / item.avg_unit_price) * 100
                      : null;
                    const profitPerItem = costed && item.avg_unit_price > 0
                      ? item.avg_unit_price - (item.cost_to_make ?? 0)
                      : null;
                    return (
                      <button
                        key={`${item.item_name}|${item.size}|${item.category}`}
                        type="button"
                        onClick={() => setSelectedKitchenItem(item)}
                        className="w-full text-left bg-slate-800 rounded-xl border border-slate-700 p-3 flex items-center gap-3"
                      >
                        <span className={cn("w-2 h-2 rounded-full shrink-0", costed ? "bg-emerald-500" : "bg-amber-500")} />
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-white">{item.item_name} {item.sizeDisplay}</div>
                          <div className="flex flex-wrap gap-2 mt-1">
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-700 text-slate-400">{item.category}</span>
                            <span className="text-xs text-slate-500">{item.total_units} sold</span>
                            <span className="text-xs text-slate-400">Sells for: ${(item.avg_unit_price || 0).toFixed(2)}</span>
                          </div>
                          <div className="mt-1 text-xs">
                            Cost to make:{" "}
                            {costed ? (
                              <span className="text-emerald-400">${(item.cost_to_make ?? 0).toFixed(2)} ✓</span>
                            ) : (
                              <span className="text-slate-500">Not costed</span>
                            )}
                            {foodCostPct != null && (
                              <span className="ml-2 text-slate-400">Food cost {foodCostPct.toFixed(1)}%</span>
                            )}
                            {profitPerItem != null && (
                              <span className="ml-2 text-slate-400">Margin {formatDollars(profitPerItem)}</span>
                            )}
                          </div>
                        </div>
                        {costed ? <span className="text-emerald-400 shrink-0">✓</span> : null}
                      </button>
                    );
                  })}
                </div>

                {uncostedByRevenue.length > 0 && (
                  <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
                    <h3 className="text-sm font-semibold text-white mb-2">Biggest margin opportunities</h3>
                    <p className="text-xs text-slate-400 mb-2">Top 5 uncosted items by revenue:</p>
                    <ul className="space-y-1 text-xs text-slate-300">
                      {uncostedByRevenue.map((i) => (
                        <li key={`${i.item_name}|${i.size}|${i.category}`}>{i.item_name} {i.sizeDisplay} — {formatDollars(i.total_revenue)} revenue</li>
                      ))}
                    </ul>
                    <p className="text-xs text-amber-400 mt-2">Cost these 5 items to unlock {formatDollars(potentialVisibility)} in potential savings visibility.</p>
                  </div>
                )}
              </>
            )}

            {selectedKitchenItem && typeof document !== "undefined" && createPortal(
              <div
                className="fixed inset-0 z-[9999] flex items-end justify-center sm:items-center"
                aria-modal="true"
                role="dialog"
              >
                <div
                  className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-150"
                  style={{ opacity: costSheetMounted ? 1 : 0 }}
                  onClick={() => setSelectedKitchenItem(null)}
                  aria-hidden="true"
                />
                <div
                  className="relative w-full max-w-lg bg-slate-800 rounded-t-2xl max-h-[85vh] overflow-y-auto shadow-2xl transition-all duration-200 ease-out sm:rounded-2xl"
                  style={{
                    transform: costSheetMounted ? "translateY(0) scale(1)" : "translateY(100%) scale(0.95)",
                    opacity: costSheetMounted ? 1 : 0,
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="p-5 pt-6 pb-8">
                    <button
                      type="button"
                      onClick={() => setSelectedKitchenItem(null)}
                      className="absolute top-3 right-3 z-10 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700"
                      aria-label="Close"
                    >
                      <span className="text-lg leading-none">×</span>
                    </button>
                    <h2 className="text-lg font-bold text-white pr-8">{selectedKitchenItem.item_name} {selectedKitchenItem.sizeDisplay}</h2>
                    <p className="text-sm text-slate-400 mt-1">Sells for: ${(selectedKitchenItem.avg_unit_price || 0).toFixed(2)}</p>
                    <div className="mt-4">
                      <label className="block text-xs text-slate-500 mb-1">Cost to make ($)</label>
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        inputMode="decimal"
                        value={costInput}
                        onChange={(e) => setCostInput(e.target.value)}
                        className="w-full min-h-[48px] px-3 rounded-xl border border-slate-600 bg-slate-900 text-white text-lg font-semibold"
                      />
                    </div>
                    <label className="flex items-center gap-2 mt-4 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={includesDisposables}
                        onChange={(e) => setIncludesDisposables(e.target.checked)}
                        className="rounded border-slate-600"
                      />
                      <span className="text-sm text-slate-400">Includes box/disposables</span>
                    </label>
                    {(() => {
                      const cost = parseFloat(costInput);
                      const valid = !Number.isNaN(cost) && cost >= 0;
                      const price = selectedKitchenItem.avg_unit_price || 0;
                      const foodCostPct = valid && price > 0 ? (cost / price) * 100 : null;
                      const profitPerItem = valid && price > 0 ? price - cost : null;
                      const monthlyProfit = profitPerItem != null ? profitPerItem * selectedKitchenItem.total_units : null;
                      return (
                        <div className="mt-4 space-y-2 text-sm">
                          {foodCostPct != null && <p className="text-slate-300">Food Cost %: {foodCostPct.toFixed(1)}%</p>}
                          {profitPerItem != null && <p className="text-slate-300">Profit per item: {formatDollars(profitPerItem)}</p>}
                          {monthlyProfit != null && <p className="text-slate-300">Monthly profit at current volume: {formatDollars(monthlyProfit)}</p>}
                          {foodCostPct != null && <p className="font-medium">{foodCostStatus(foodCostPct)}</p>}
                        </div>
                      );
                    })()}
                    <button
                      type="button"
                      disabled={savingCost || (parseFloat(costInput) ?? NaN) < 0}
                      onClick={async () => {
                        const cost = parseFloat(costInput);
                        if (Number.isNaN(cost) || cost < 0) return;
                        setSavingCost(true);
                        try {
                          const res = await fetch("/api/kitchen-iq", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              item_name: selectedKitchenItem.item_name,
                              size: selectedKitchenItem.size,
                              category: selectedKitchenItem.category,
                              cost_to_make: cost,
                              includes_disposables: includesDisposables,
                            }),
                          });
                          if (res.ok) {
                            refetchKitchenIq();
                            setSelectedKitchenItem(null);
                          }
                        } finally {
                          setSavingCost(false);
                        }
                      }}
                      className="mt-6 w-full py-3 rounded-xl bg-emerald-600 text-white font-semibold disabled:opacity-50"
                    >
                      {savingCost ? "Saving…" : "Save Cost"}
                    </button>
                  </div>
                </div>
              </div>,
              document.body
            )}
          </div>
        );
      })()}

      {view !== "kitchen-iq" && (
        <DataDisclaimer
          confidence="high"
          details="Prices sourced directly from your public menu websites. Last synced February 23, 2026."
        />
      )}
    </div>
  );
}
