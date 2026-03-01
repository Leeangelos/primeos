"use client";

import { useMemo, useState } from "react";
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
  const [view, setView] = useState<"menu" | "compare" | "gaps" | "pricing-gaps">("menu");
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set());

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
          <EducationInfoIcon metricKey="menu_item_count" />
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 text-center">
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
        <EducationInfoIcon metricKey="menu_item_count" />
      </div>

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

      <DataDisclaimer
        confidence="high"
        details="Prices sourced directly from your public menu websites. Last synced February 23, 2026."
      />
    </div>
  );
}
