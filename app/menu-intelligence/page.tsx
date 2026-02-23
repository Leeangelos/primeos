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
import { EducationInfoIcon } from "@/src/components/education/InfoIcon";

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
      let hasLargeGap = false;
      for (const prices of allPricesBySize.values()) {
        if (prices.length < 2) continue;
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        if (min > 0 && (max - min) / min > 0.15) {
          hasLargeGap = true;
          break;
        }
      }
      const commonSizes = [...allPricesBySize.keys()].sort();
      return { ...item, hasLargeGap, commonSizes };
    });
  }, []);
}

export default function MenuIntelligencePage() {
  const [storeId, setStoreId] = useState("all");
  const [view, setView] = useState<"menu" | "compare" | "gaps">("menu");
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

  // Default: first category open
  const effectiveOpen = useMemo(() => {
    if (openCategories.size > 0) return openCategories;
    return new Set(categories.length > 0 ? [categories[0]] : []);
  }, [openCategories, categories]);

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
      </div>

      {view === "menu" && (
        <div className="space-y-2">
          {categories.map((cat) => {
            const isOpen = effectiveOpen.has(cat);
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
            <EducationInfoIcon metricKey="menu_price_comparison" />
          </div>
          {comparableWithGaps.map((item) => (
            <div
              key={item.item_name}
              className="bg-slate-800 rounded-xl border border-slate-700 p-3 mb-2"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-white">
                  {item.item_name}
                </span>
                {item.hasLargeGap && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-600/20 text-amber-400 border border-amber-700/50">
                    15%+ gap
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

      <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-3 mt-4">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="text-xs text-slate-400 font-medium">
            Data Confidence: High
          </span>
        </div>
        <p className="text-xs text-slate-500">
          Prices sourced directly from your public menu websites. Last synced
          February 23, 2026.
        </p>
        <p className="text-xs text-slate-600 mt-1">
          Calculations are based on your imported data. Verify against your
          actual financial records.
        </p>
      </div>
    </div>
  );
}
