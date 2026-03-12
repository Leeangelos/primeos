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
  globalXp?: number;
};

type PricingGapItem = {
  item_name: string;
  store_id: string;
  menuPrice: number;
  avgActualPrice: number;
  unitsSold: number;
  gap: number;
  gapPct: number;
  cause: string;
};

const PRICING_GAPS: PricingGapItem[] = [
  { item_name: "Large Pepperoni Pizza", store_id: "kent", menuPrice: 29.95, avgActualPrice: 27.4, unitsSold: 180, gap: -2.55, gapPct: -8.5, cause: "Possible causes: unapplied POS price updates, staff discounts, coupon overuse, or incorrect ringing." },
  { item_name: "Large Cheese Pizza", store_id: "kent", menuPrice: 15.95, avgActualPrice: 15.2, gapPct: -4.7, unitsSold: 420, gap: -0.75, cause: "Within acceptable range. Minor variance likely from loyalty discounts." },
  { item_name: "Traditional Wings 10pc", store_id: "kent", menuPrice: 15.95, avgActualPrice: 14.5, unitsSold: 140, gap: -1.45, gapPct: -9.1, cause: "Possible causes: combo pricing applied incorrectly, or manual price override at register." },
  { item_name: "Family Supreme Pizza", store_id: "aurora", menuPrice: 34.99, avgActualPrice: 32.1, unitsSold: 85, gap: -2.89, gapPct: -8.3, cause: "Aurora showing larger gap than Kent on same item. Consider auditing POS pricing at Aurora." },
  { item_name: "Cheesy Bread Large", store_id: "kent", menuPrice: 22.99, avgActualPrice: 22.99, unitsSold: 95, gap: 0, gapPct: 0, cause: "No gap. Price is correct." },
  { item_name: "Boom Boom Shrimp Wrap", store_id: "aurora", menuPrice: 19.99, avgActualPrice: 17.99, unitsSold: 45, gap: -2, gapPct: -10, cause: "Significant gap. Check if an old price is still programmed in the POS." },
];

const STORE_OPTIONS: { value: string; label: string }[] = [
  { value: "kent", label: "LeeAngelo's Kent" },
  { value: "aurora", label: "LeeAngelo's Aurora" },
  { value: "lindseys", label: "Lindsey's" },
];

const STORE_NAMES: Record<string, string> = {
  kent: "Kent",
  aurora: "Aurora",
  lindseys: "Lindsey's",
};

function normalizeSize(raw: string): string {
  const s = (raw || "").trim();
  const u = s.toUpperCase();
  if (["LG", "LRG", "LARGE"].includes(u)) return "Large";
  if (["SM", "SMALL"].includes(u) || u === "SM") return "Small";
  if (["SHEET"].includes(u)) return "Sheet";
  if (["MED", "MEDIUM"].includes(u)) return "Medium";
  return s || "—";
}

function marginPctToTier(marginPct: number): { label: string; className: string } {
  if (marginPct >= 60) return { label: "Strong", className: "border bg-emerald-600/20 text-emerald-400 border-emerald-600/40" };
  if (marginPct >= 45) return { label: "Solid", className: "border bg-amber-600/20 text-amber-400 border-amber-600/40" };
  if (marginPct >= 30) return { label: "Watch", className: "border bg-orange-600/20 text-orange-400 border-orange-600/40" };
  return { label: "Review", className: "border bg-red-600/20 text-red-400 border-red-600/40" };
}

function marginLanguage(marginPct: number): string {
  if (marginPct >= 60) return "💚 Money-maker. Train your team to suggest this item.";
  if (marginPct >= 45) return "✅ Solid margin. Watch portion sizes — every extra ounce cuts into this.";
  if (marginPct >= 30) return "⚠️ Thin margin. Consider a price increase or portion review.";
  return "🔴 You're working hard for very little return. Price increase or recipe review needed.";
}

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
  const [storeId, setStoreId] = useState(STORE_OPTIONS[0]?.value ?? "kent");
  const [view, setView] = useState<"menu" | "compare" | "gaps" | "pricing-gaps" | "kitchen-iq">("menu");
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set());

  const [kitchenIqData, setKitchenIqData] = useState<KitchenIqData | null>(null);
  const [kitchenIqLoading, setKitchenIqLoading] = useState(false);
  const [selectedKitchenItem, setSelectedKitchenItem] = useState<KitchenIqItem | null>(null);
  const [costInput, setCostInput] = useState("");
  const [includesDisposables, setIncludesDisposables] = useState(false);
  const [costSheetMounted, setCostSheetMounted] = useState(false);
  const [savingCost, setSavingCost] = useState(false);
  const [kitchenIqCategory, setKitchenIqCategory] = useState<string>("All");
  const [saveFlash, setSaveFlash] = useState(false);

  const [selectedPricingGap, setSelectedPricingGap] = useState<PricingGapItem | null>(null);
  const [priceGapSheetMounted, setPriceGapSheetMounted] = useState(false);
  const [selectedCompareItem, setSelectedCompareItem] = useState<{
    item_name: string;
    commonSizes: string[];
    stores: { store_id: string; storeName: string; sizes: { size_name: string; price: number }[] }[];
    gapPct: number;
  } | null>(null);
  const [selectedCompareSize, setSelectedCompareSize] = useState<string | null>(null);
  const [compareSheetMounted, setCompareSheetMounted] = useState(false);

  useEffect(() => {
    if (view !== "kitchen-iq" && view !== "menu") return;
    let cancelled = false;
    setKitchenIqLoading(true);
    fetch(`/api/kitchen-iq?store_id=${encodeURIComponent(storeId)}`)
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled && d.catalog) setKitchenIqData({
          catalog: d.catalog,
          actualHillcrestLast30: d.actualHillcrestLast30 ?? 0,
          globalXp: d.globalXp,
        });
      })
      .catch(() => { if (!cancelled) setKitchenIqData(null); })
      .finally(() => { if (!cancelled) setKitchenIqLoading(false); });
    return () => { cancelled = true; };
  }, [view, storeId]);

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
    fetch(`/api/kitchen-iq?store_id=${encodeURIComponent(storeId)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.catalog) setKitchenIqData({
          catalog: d.catalog,
          actualHillcrestLast30: d.actualHillcrestLast30 ?? 0,
          globalXp: d.globalXp,
        });
      })
      .catch(() => {});
  }, [storeId]);

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

  useEffect(() => {
    if (selectedPricingGap) {
      const t = requestAnimationFrame(() => setPriceGapSheetMounted(true));
      return () => cancelAnimationFrame(t);
    }
    setPriceGapSheetMounted(false);
  }, [selectedPricingGap]);

  useEffect(() => {
    if (selectedCompareItem) {
      const t = requestAnimationFrame(() => setCompareSheetMounted(true));
      return () => cancelAnimationFrame(t);
    }
    setCompareSheetMounted(false);
  }, [selectedCompareItem]);

  useEffect(() => {
    if (!selectedPricingGap && !selectedCompareItem) return;
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedPricingGap(null);
        setSelectedCompareItem(null);
        setSelectedCompareSize(null);
      }
    };
    document.addEventListener("keydown", onEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onEscape);
      document.body.style.overflow = "";
    };
  }, [selectedPricingGap, selectedCompareItem]);

  const items = useMemo(() => getMenuByStore(storeId), [storeId]);
  const categories = useMemo(() => getCategories(storeId), [storeId]);
  const gaps = useMemo(() => getMenuGaps(), []);
  const comparableWithGaps = useComparableWithGaps();

  const menuCatalog = kitchenIqData?.catalog ?? [];
  const menuCategories = useMemo(
    () => Array.from(new Set(menuCatalog.map((i) => i.category))).filter(Boolean).sort(),
    [menuCatalog]
  );
  const menuItemsByCategory = useMemo(() => {
    const map = new Map<string, KitchenIqItem[]>();
    for (const item of menuCatalog) {
      const list = map.get(item.category) ?? [];
      list.push(item);
      map.set(item.category, list);
    }
    return map;
  }, [menuCatalog]);

  const itemCount = menuCatalog.length;
  const categoryCount = menuCategories.length;
  const avgPrice =
    menuCatalog.length > 0
      ? menuCatalog.reduce((a, i) => a + (i.avg_unit_price || 0), 0) / menuCatalog.length
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

  const menuCostLookup = useMemo(() => {
    const catalog = kitchenIqData?.catalog ?? [];
    const map = new Map<string, { cost_to_make: number; avg_unit_price: number }>();
    for (const row of catalog) {
      if (row.cost_to_make == null || row.cost_to_make <= 0) continue;
      const key = `${(row.item_name || "").toLowerCase()}|${row.size}|${(row.category || "").toLowerCase()}`;
      map.set(key, { cost_to_make: row.cost_to_make, avg_unit_price: row.avg_unit_price || 0 });
    }
    return map;
  }, [kitchenIqData?.catalog]);

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
          {menuCatalog.length === 0 && !kitchenIqLoading && (
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 text-center text-slate-400 text-sm">
              No FoodTec menu data for this store in the last 30 days.
            </div>
          )}
          {menuCatalog.length === 0 && kitchenIqLoading && (
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 text-center text-slate-400 text-sm">
              Loading…
            </div>
          )}
          {menuCategories.map((cat) => {
            const isOpen = openCategories.has(cat);
            const catItems = menuItemsByCategory.get(cat) ?? [];
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
                    {catItems.map((item) => {
                      const key = `${(item.item_name || "").toLowerCase()}|${item.size}|${(item.category || "").toLowerCase()}`;
                      const costRow = menuCostLookup.get(key);
                      const price = item.avg_unit_price || 0;
                      const marginPct = costRow && price > 0 ? ((price - costRow.cost_to_make) / price) * 100 : null;
                      const tier = marginPct != null ? marginPctToTier(marginPct) : null;
                      return (
                        <div
                          key={`${item.item_name}|${item.size}|${item.category}`}
                          className="bg-slate-800 rounded-xl border border-slate-700 p-3 mb-2"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-white">
                              {item.item_name}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2 items-center">
                            <span className="text-xs text-slate-400">
                              {item.sizeDisplay}:{" "}
                              <span className="text-emerald-400">
                                ${price.toFixed(2)}
                              </span>
                              <span className="text-slate-500 ml-1">avg (30d)</span>
                            </span>
                            {tier && marginPct != null && (
                              <span className={cn("px-1.5 py-0.5 rounded border text-[10px] font-medium", tier.className)}>
                                {tier.label} ({marginPct.toFixed(0)}%)
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
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
          {comparableWithGaps.map((item) => {
            const gapBadgeClass =
              item.gapPct < 10
                ? "bg-slate-600/20 text-slate-400 border border-slate-600/30"
                : item.gapPct < 25
                  ? "bg-amber-600/20 text-amber-400 border border-amber-700/30"
                  : "bg-red-600/20 text-red-400 border border-red-700/30";
            return (
              <button
                key={item.item_name}
                type="button"
                onClick={() => setSelectedCompareItem(item)}
                className="w-full text-left bg-slate-800 rounded-xl border border-slate-700 p-3 mb-2"
              >
                <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                  <span className="text-sm font-medium text-white min-w-0">
                    {item.item_name}
                  </span>
                  {item.stores.length >= 2 && (
                    <span className={cn("px-1.5 py-0.5 rounded text-[10px] font-medium shrink-0", gapBadgeClass)}>
                      {Math.round(item.gapPct)}% gap
                    </span>
                  )}
                </div>
                {item.commonSizes.map((size) => {
                  const pricesWithStore = item.stores
                    .map((store) => {
                      const sizeData = store.sizes.find((s) => s.size_name === size);
                      return sizeData ? { store_id: store.store_id, storeName: store.storeName, shortName: store.storeName.split("'s ")[1] || store.storeName, price: sizeData.price } : null;
                    })
                    .filter(Boolean) as { store_id: string; storeName: string; shortName: string; price: number }[];
                  const minPrice = pricesWithStore.length ? Math.min(...pricesWithStore.map((p) => p.price)) : 0;
                  const maxPrice = pricesWithStore.length ? Math.max(...pricesWithStore.map((p) => p.price)) : 0;
                  const diff = maxPrice - minPrice;
                  const lowerStore = pricesWithStore.find((p) => p.price === minPrice);
                  const higherStore = pricesWithStore.find((p) => p.price === maxPrice);
                  return (
                    <div
                      key={size}
                      className="flex items-center justify-between text-xs py-1 border-b border-slate-700/50 last:border-0 gap-2 flex-wrap"
                    >
                      <span className="text-slate-500 w-16 shrink-0">{size}</span>
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                        {item.stores.map((store) => {
                          const sizeData = store.sizes.find((s) => s.size_name === size);
                          const shortName = store.storeName.split("'s ")[1] || store.storeName;
                          const isLowest = sizeData && sizeData.price === minPrice && pricesWithStore.length > 1;
                          return sizeData ? (
                            <span key={store.store_id} className={cn("text-slate-300", isLowest && "text-amber-400 font-medium")}>
                              {shortName}: <span className={cn(isLowest ? "text-amber-400" : "text-emerald-400")}>${sizeData.price.toFixed(2)}</span>
                            </span>
                          ) : (
                            <span key={store.store_id} className="text-slate-600">—</span>
                          );
                        })}
                      </div>
                      {diff > 0 && lowerStore && higherStore && (
                        <p className="text-[11px] text-slate-400 w-full mt-0.5">
                          If {higherStore.shortName} matched {lowerStore.shortName}&apos;s price on {item.item_name} {size} — that&apos;s +${diff.toFixed(2)}/order at current volume
                        </p>
                      )}
                    </div>
                  );
                })}
              </button>
            );
          })}
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
        const top3 = filtered.slice(0, 3);
        const top3Recover = top3.reduce((sum, item) => sum + Math.abs(item.gap * item.unitsSold), 0);
        const gapCardBorder = (gapPct: number) => {
          const abs = Math.abs(gapPct);
          if (abs <= 3) return "border-emerald-600/40 bg-emerald-600/5";
          if (abs <= 7) return "border-amber-600/40 bg-amber-600/5";
          return "border-red-600/40 bg-red-600/5";
        };
        const gapBadgeClass = (gapPct: number) => {
          const abs = Math.abs(gapPct);
          if (abs <= 3) return "bg-emerald-600/20 text-emerald-400 border border-emerald-700/30";
          if (abs <= 7) return "bg-amber-600/20 text-amber-400 border border-amber-700/30";
          return "bg-red-600/20 text-red-400 border border-red-700/30";
        };
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
                  {top3.length > 0 && (
                    <p className="text-xs text-red-300 mt-2">
                      Fix your top 3 gaps and recover{" "}
                      <span className="text-red-400 font-semibold">{formatDollars(top3Recover)}</span>/month
                    </p>
                  )}
                </div>
                {filtered.map((item, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setSelectedPricingGap(item)}
                    className={cn("w-full text-left rounded-xl border p-3 mb-2", gapCardBorder(item.gapPct))}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-white">{item.item_name}</span>
                      <span className={cn("text-xs px-2 py-0.5 rounded-full", gapBadgeClass(item.gapPct))}>
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
                  </button>
                ))}
              </>
            ) : (
              <p className="text-xs text-slate-500">No items with a price gap &gt; 2% for this store.</p>
            )}
          </div>
        );
      })()}

      {selectedPricingGap && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-end justify-center sm:items-center" aria-modal="true" role="dialog">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-150" style={{ opacity: priceGapSheetMounted ? 1 : 0 }} onClick={() => setSelectedPricingGap(null)} aria-hidden="true" />
          <div className="relative w-full max-w-lg bg-slate-800 rounded-t-2xl max-h-[85vh] overflow-y-auto shadow-2xl transition-all duration-200 ease-out sm:rounded-2xl" style={{ transform: priceGapSheetMounted ? "translateY(0) scale(1)" : "translateY(100%) scale(0.95)", opacity: priceGapSheetMounted ? 1 : 0 }} onClick={(e) => e.stopPropagation()}>
            <div className="p-5 pt-6 pb-8">
              <button type="button" onClick={() => setSelectedPricingGap(null)} className="absolute top-3 right-3 z-10 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700" aria-label="Close"><span className="text-lg leading-none">×</span></button>
              <h2 className="text-lg font-bold text-white pr-8">{selectedPricingGap.item_name}</h2>
              <section className="mt-4">
                <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">What This Means</h3>
                <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                  Your menu price is ${selectedPricingGap.menuPrice.toFixed(2)} but customers are paying an average of ${selectedPricingGap.avgActualPrice.toFixed(2)}. The difference is ${Math.abs(selectedPricingGap.gap).toFixed(2)} per order — multiplied by {selectedPricingGap.unitsSold} orders that&apos;s {formatDollars(Math.abs(selectedPricingGap.gap * selectedPricingGap.unitsSold))} walking out the door every month.
                </p>
              </section>
              <section className="mt-6">
                <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Why It Matters</h3>
                <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                  A gap this size on a high-volume item is almost never random. Something systematic is causing it.
                </p>
              </section>
              <section className="mt-6">
                <h3 className="text-sm font-semibold text-amber-400/90 uppercase tracking-wide">Playbook</h3>
                {Math.abs(selectedPricingGap.gapPct) <= 7 ? (
                  <ul className="mt-2 space-y-2 text-sm text-slate-400 leading-relaxed">
                    <li>1. Check if this item is part of a combo or special that discounts it.</li>
                    <li>2. Review loyalty redemptions on this item.</li>
                    <li>3. Check for manual price overrides at the register.</li>
                  </ul>
                ) : (
                  <ul className="mt-2 space-y-2 text-sm text-slate-400 leading-relaxed">
                    <li>1. Pull void report for this item — check for re-rings at lower price.</li>
                    <li>2. Check if staff are applying employee discount incorrectly.</li>
                    <li>3. Verify POS price matches your menu price — a mismatch here costs you every single order.</li>
                  </ul>
                )}
              </section>
            </div>
          </div>
        </div>,
        document.body
      )}

      {selectedCompareItem && typeof document !== "undefined" && (() => {
        const item = selectedCompareItem;
        const pricesBySize = item.commonSizes.map((size) => {
          const withStore = item.stores.map((store) => ({ store, sizeData: store.sizes.find((s) => s.size_name === size) })).filter((x) => x.sizeData);
          const prices = withStore.map((x) => ({ store: x.store, price: x.sizeData!.price }));
          const minP = prices.length ? Math.min(...prices.map((p) => p.price)) : 0;
          const maxP = prices.length ? Math.max(...prices.map((p) => p.price)) : 0;
          const lower = prices.find((p) => p.price === minP)?.store;
          const higher = prices.find((p) => p.price === maxP)?.store;
          return { size, prices, minP, maxP, lower, higher, diff: maxP - minP };
        });
        const bestSize = pricesBySize.filter((s) => s.diff > 0).sort((a, b) => b.diff - a.diff)[0];
        const sizeForCopy = selectedCompareSize || bestSize?.size || item.commonSizes[0];
        const sizeRow = pricesBySize.find((s) => s.size === sizeForCopy);
        const lowerStore = sizeRow?.lower;
        const higherStore = sizeRow?.higher;
        const priceDiff = sizeRow?.diff ?? 0;
        const storeNameA = higherStore?.storeName.split("'s ")[1] || higherStore?.storeName || "Store A";
        const storeNameB = lowerStore?.storeName.split("'s ")[1] || lowerStore?.storeName || "Store B";
        return createPortal(
          <div className="fixed inset-0 z-[9999] flex items-end justify-center sm:items-center" aria-modal="true" role="dialog">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-150" style={{ opacity: compareSheetMounted ? 1 : 0 }} onClick={() => { setSelectedCompareItem(null); setSelectedCompareSize(null); }} aria-hidden="true" />
            <div className="relative w-full max-w-lg bg-slate-800 rounded-t-2xl max-h-[85vh] overflow-y-auto shadow-2xl transition-all duration-200 ease-out sm:rounded-2xl" style={{ transform: compareSheetMounted ? "translateY(0) scale(1)" : "translateY(100%) scale(0.95)", opacity: compareSheetMounted ? 1 : 0 }} onClick={(e) => e.stopPropagation()}>
              <div className="p-5 pt-6 pb-8">
                <button type="button" onClick={() => { setSelectedCompareItem(null); setSelectedCompareSize(null); }} className="absolute top-3 right-3 z-10 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700" aria-label="Close"><span className="text-lg leading-none">×</span></button>
                <h2 className="text-lg font-bold text-white pr-8">{item.item_name}</h2>
                <section className="mt-4">
                  <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">What This Means</h3>
                  <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                    The same {item.item_name} costs ${priceDiff.toFixed(2)} more at {storeNameA} than {storeNameB}. Customers at {storeNameB} are getting a better deal.
                  </p>
                </section>
                <section className="mt-6">
                  <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Why It Matters</h3>
                  <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                    Price inconsistency across locations erodes your brand and leaves money on the table at lower-priced stores.
                  </p>
                </section>
                <section className="mt-6">
                  <h3 className="text-sm font-semibold text-amber-400/90 uppercase tracking-wide">Playbook</h3>
                  <ul className="mt-2 space-y-2 text-sm text-slate-400 leading-relaxed">
                    <li>1. Decide if the price difference is intentional (different market, different costs).</li>
                    <li>2. If not intentional, update the lower store&apos;s POS price.</li>
                    <li>3. A $1 increase on {item.item_name} at {storeNameA} = more revenue per order at current volume.</li>
                  </ul>
                </section>
              </div>
            </div>
          </div>,
          document.body
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
        const uncostedByRevenue = catalog.filter((i) => i.cost_to_make == null || i.cost_to_make <= 0);
        const top3Uncosted = uncostedByRevenue.slice(0, 3);
        const top3Revenue = top3Uncosted.reduce((s, i) => s + i.total_revenue, 0);
        const top3Pct = totalRevenue30 > 0 ? Math.round((top3Revenue / totalRevenue30) * 100) : 0;

        const ringColor = pct <= 24 ? "#ef4444" : pct <= 49 ? "#f97316" : pct <= 74 ? "#eab308" : "#22c55e";
        const milestones = [
          { label: "Cost your menu to unlock your true margins" },
          { label: "Started 🔥" },
          { label: "Top items costed — estimates unlocked" },
          { label: "Halfway — food cost model active" },
          { label: "Almost there 💪" },
          { label: "Kitchen IQ: Elite 🏆 — Full theoretical food cost active" },
        ];
        let milestoneLabel = milestones[0].label;
        if (costedCount >= 1 && pct < 25) milestoneLabel = milestones[1].label;
        else if (pct >= 25 && pct < 50) milestoneLabel = milestones[2].label;
        else if (pct >= 50 && pct < 75) milestoneLabel = milestones[3].label;
        else if (pct >= 75 && pct < 100) milestoneLabel = milestones[4].label;
        else if (pct >= 100) milestoneLabel = milestones[5].label;

        const xpPerItem = 10;
        const top20Revenue = catalog.slice(0, 20);
        const highRevenueBonus = 25;
        const xpFromCosted = costedCount * xpPerItem;
        const xpFromHighRevenue = costedItems.filter((i) => top20Revenue.some((t) => t.item_name === i.item_name && t.size === i.size && t.category === i.category)).length * highRevenueBonus;
        const totalXp = kitchenIqData?.globalXp ?? (xpFromCosted + xpFromHighRevenue);

        const categories = ["All", ...Array.from(new Set(catalog.map((i) => i.category)))].filter(Boolean);
        const uncostedCountByCategory = (cat: string) =>
          cat === "All" ? uncostedByRevenue.length : catalog.filter((i) => i.category === cat && (i.cost_to_make == null || i.cost_to_make <= 0)).length;
        const filteredCatalog = kitchenIqCategory === "All" ? catalog : catalog.filter((i) => i.category === kitchenIqCategory);

        const foodCostStatus = (pctVal: number) =>
          pctVal <= 32 ? "✅ Healthy" : pctVal <= 40 ? "⚠️ Watch" : "🔴 Investigate";
        const foodCostColor = (pctVal: number) => (pctVal <= 32 ? "text-emerald-400" : pctVal <= 40 ? "text-amber-400" : "text-red-400");

        const circumference = 2 * Math.PI * 54;
        const strokeDash = (pct / 100) * circumference;

        return (
          <div className="space-y-4">
            {kitchenIqLoading ? (
              <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 text-center text-slate-400 text-sm">Loading…</div>
            ) : (
              <>
                {/* Hero: circular progress ring */}
                <div className="flex flex-col items-center py-4">
                  <div className="relative w-[140px] h-[140px]">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                      <circle cx="60" cy="60" r="54" fill="none" stroke="rgb(51 65 85)" strokeWidth="10" />
                      <circle
                        cx="60"
                        cy="60"
                        r="54"
                        fill="none"
                        stroke={ringColor}
                        strokeWidth="10"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={circumference - strokeDash}
                        className="transition-all duration-700 ease-out"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-3xl font-black tabular-nums text-white">{pct}%</span>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-white mt-2">Kitchen IQ</p>
                  <p className="text-xs text-slate-400">{costedCount} of {totalItems} items costed</p>
                  <div className="mt-2 px-3 py-1.5 rounded-full bg-slate-700/80 text-xs text-slate-200">{milestoneLabel}</div>
                </div>

                {/* XP */}
                <div className="bg-slate-800/80 rounded-xl border border-slate-700 p-3 text-center">
                  <p className="text-[10px] uppercase tracking-wide text-slate-500">XP earned</p>
                  <p className="text-2xl font-bold text-amber-400 tabular-nums">{totalXp}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">+10 per item costed · +25 for top revenue items</p>
                </div>

                {/* Blended Margin — show after first cost */}
                {costedCount >= 1 && (() => {
                  const totalUnitsCosted = costedItems.reduce((s, i) => s + i.total_units, 0);
                  const weightedSum = costedItems.reduce((s, i) => {
                    const price = i.avg_unit_price || 0;
                    const cost = i.cost_to_make ?? 0;
                    const marginPct = price > 0 ? ((price - cost) / price) * 100 : 0;
                    return s + marginPct * i.total_units;
                  }, 0);
                  const blendedMarginPct = totalUnitsCosted > 0 ? weightedSum / totalUnitsCosted : 0;
                  const blendedColor = blendedMarginPct >= 60 ? "text-emerald-400" : blendedMarginPct >= 45 ? "text-amber-400" : "text-red-400";
                  const withMargin = costedItems
                    .map((i) => {
                      const price = i.avg_unit_price || 0;
                      const cost = i.cost_to_make ?? 0;
                      const marginPct = price > 0 ? ((price - cost) / price) * 100 : 0;
                      return { ...i, marginPct };
                    })
                    .filter((i) => i.marginPct >= 0);
                  const mostProfitable = withMargin.length ? withMargin.reduce((a, b) => (a.marginPct >= b.marginPct ? a : b)) : null;
                  const leastProfitable = withMargin.length ? withMargin.reduce((a, b) => (a.marginPct <= b.marginPct ? a : b)) : null;
                  const subtitle = costedCount === 1
                    ? "Based on 1 item — cost more items for a complete picture."
                    : `Across ${costedCount} costed items representing ${formatDollars(costedRevenue)} in monthly revenue`;
                  return (
                    <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
                      <p className="text-[10px] uppercase tracking-wide text-slate-500">Blended Margin</p>
                      <p className={cn("text-3xl font-bold tabular-nums mt-1", blendedColor)}>{blendedMarginPct.toFixed(1)}%</p>
                      <p className="text-xs text-slate-400 mt-2">{subtitle}</p>
                      {mostProfitable && costedCount > 1 && <p className="text-xs text-slate-400 mt-1">Your most profitable item: {mostProfitable.item_name} {mostProfitable.sizeDisplay} at {mostProfitable.marginPct.toFixed(1)}% margin</p>}
                      {leastProfitable && mostProfitable?.item_name !== leastProfitable?.item_name && costedCount > 1 && <p className="text-xs text-slate-400 mt-0.5">Your least profitable: {leastProfitable.item_name} {leastProfitable.sizeDisplay} at {leastProfitable.marginPct.toFixed(1)}% margin</p>}
                    </div>
                  );
                })()}

                {/* Category filter */}
                <div className="overflow-x-auto pb-1 -mx-1 no-scrollbar">
                  <div className="flex gap-2 min-w-max px-1">
                    {categories.map((cat) => {
                      const uncosted = uncostedCountByCategory(cat);
                      const active = kitchenIqCategory === cat;
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setKitchenIqCategory(cat)}
                          className={cn(
                            "shrink-0 px-3 py-2 rounded-full text-xs font-medium transition-colors",
                            active ? "bg-emerald-600 text-white" : "bg-slate-700/80 text-slate-300 hover:bg-slate-700"
                          )}
                        >
                          {cat}
                          {cat !== "All" && uncosted > 0 && (
                            <span className="ml-1.5 text-slate-400">({uncosted})</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Top opportunities banner — sticky */}
                {top3Uncosted.length > 0 && (
                  <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur border-b border-slate-700 py-3 -mx-1 px-3 rounded-lg">
                    <p className="text-xs text-slate-300 mb-2">Cost these 3 items to cover {top3Pct}% of your food cost story</p>
                    <div className="flex flex-wrap gap-2">
                      {top3Uncosted.map((i) => (
                        <span key={`${i.item_name}|${i.size}|${i.category}`} className="px-2 py-1 rounded-full text-[11px] bg-amber-600/20 text-amber-300 border border-amber-600/40">
                          {i.item_name} {i.sizeDisplay}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {costedCount >= 10 && (
                  <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
                    <h3 className="text-sm font-semibold text-white mb-2">Theoretical food cost</h3>
                    <p className="text-lg font-bold text-white">{formatDollars(theoretical)} <span className="text-sm font-normal text-slate-400">this month</span></p>
                    <p className="text-xs text-slate-500 mt-1">Based on {costedCount} costed items representing {costedRevenuePct}% of revenue</p>
                    <p className="text-xs text-slate-400 mt-1">Actual food cost (Hillcrest): {formatDollars(actualHillcrest)}</p>
                    <p className="text-xs text-slate-400 mt-1">Variance: {formatDollars(variance)} — Possible waste/theft/portioning</p>
                  </div>
                )}

                {/* Item cards */}
                <div className="space-y-2">
                  {filteredCatalog.map((item) => {
                    const rank = catalog.findIndex((i) => i.item_name === item.item_name && i.size === item.size && i.category === item.category) + 1 || 1;
                    const costed = item.cost_to_make != null && item.cost_to_make > 0;
                    const price = item.avg_unit_price || 0;
                    const cost = item.cost_to_make ?? 0;
                    const profitPerItem = costed && price > 0 ? price - cost : null;
                    const marginPct = costed && price > 0 ? ((price - cost) / price) * 100 : null;
                    const marginTier = marginPct != null ? marginPctToTier(marginPct) : null;
                    const leftBarColor = costed ? "bg-emerald-500" : "bg-red-500/80";
                    return (
                      <button
                        key={`${item.item_name}|${item.size}|${item.category}`}
                        type="button"
                        onClick={() => setSelectedKitchenItem(item)}
                        className="w-full text-left bg-slate-800 rounded-xl border border-slate-700 overflow-hidden flex"
                      >
                        <div className={cn("w-1.5 shrink-0", leftBarColor)} />
                        <div className="flex items-center gap-3 p-3 min-w-0 flex-1">
                          <span className="text-slate-500 font-bold text-sm shrink-0">#{rank}</span>
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-white">{item.item_name} {item.sizeDisplay}</div>
                            <p className="text-xs text-cyan-400 mt-0.5">{formatDollars(item.total_revenue)} revenue</p>
                            {costed && (
                              <p className="text-[11px] text-slate-400 mt-0.5">
                                Sells for: ${price.toFixed(2)} | Costs: ${cost.toFixed(2)} | Profit: {profitPerItem != null ? formatDollars(profitPerItem) : "—"}
                              </p>
                            )}
                            <div className="flex flex-wrap gap-2 mt-1 text-[11px] text-slate-500 items-center">
                              <span>{item.total_units} sold</span>
                              {marginTier && (
                                <span className={cn("px-1.5 py-0.5 rounded border text-[10px] font-medium", marginTier.className)}>
                                  {marginTier.label} ({marginPct?.toFixed(0)}%)
                                </span>
                              )}
                            </div>
                          </div>
                          {costed ? <span className="text-emerald-400 shrink-0">✓</span> : null}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {selectedKitchenItem && typeof document !== "undefined" && (() => {
              const item = selectedKitchenItem;
              const cat = kitchenIqData?.catalog ?? [];
              const rank = cat.findIndex((i) => i.item_name === item.item_name && i.size === item.size && i.category === item.category) + 1 || 1;
              const numPad = (n: string) => {
                if (n === "⌫") setCostInput((v) => v.slice(0, -1));
                else if (n === "C") setCostInput("");
                else if (n === ".") setCostInput((v) => (v.includes(".") ? v : v + n));
                else setCostInput((v) => v + n);
              };
              const cost = parseFloat(costInput);
              const valid = !Number.isNaN(cost) && cost >= 0;
              const price = item.avg_unit_price || 0;
              const foodCostPct = valid && price > 0 ? (cost / price) * 100 : null;
              const profitPerItem = valid && price > 0 ? price - cost : null;
              const monthlyProfit = profitPerItem != null ? profitPerItem * item.total_units : null;
              const annualProfit = monthlyProfit != null ? monthlyProfit * 12 : null;
              return createPortal(
                <div className="fixed inset-0 z-[9999] flex items-end justify-center sm:items-center" aria-modal="true" role="dialog">
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-150" style={{ opacity: costSheetMounted ? 1 : 0 }} onClick={() => setSelectedKitchenItem(null)} aria-hidden="true" />
                  <div
                    className={cn("relative w-full max-w-lg bg-slate-800 rounded-t-2xl max-h-[90vh] overflow-y-auto shadow-2xl transition-all duration-200 ease-out sm:rounded-2xl", saveFlash && "ring-4 ring-emerald-400 animate-pulse")}
                    style={{ transform: costSheetMounted ? "translateY(0) scale(1)" : "translateY(100%) scale(0.95)", opacity: costSheetMounted ? 1 : 0 }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="p-5 pt-6 pb-8">
                      <button type="button" onClick={() => setSelectedKitchenItem(null)} className="absolute top-3 right-3 z-10 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700" aria-label="Close"><span className="text-lg leading-none">×</span></button>
                      <p className="text-xs text-slate-500">#{rank} · {formatDollars(item.total_revenue)} revenue</p>
                      <h2 className="text-lg font-bold text-white pr-8 mt-0.5">{item.item_name} {item.sizeDisplay}</h2>
                      <p className="text-sm text-slate-400">Sells for: ${(item.avg_unit_price || 0).toFixed(2)}</p>

                      <div className="mt-4">
                        <label className="block text-xs text-slate-500 mb-2">Cost to make ($)</label>
                        <div className="min-h-[52px] px-4 py-3 rounded-xl border border-slate-600 bg-slate-900 text-white text-2xl font-semibold tabular-nums">
                          {costInput || "0"}
                        </div>
                        <div className="grid grid-cols-3 gap-2 mt-3">
                          {["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "⌫"].map((key) => (
                            <button key={key} type="button" onClick={() => numPad(key)} className="h-12 rounded-xl bg-slate-700 text-white font-medium hover:bg-slate-600 active:bg-slate-500">
                              {key}
                            </button>
                          ))}
                          <button type="button" onClick={() => numPad("C")} className="h-12 rounded-xl bg-slate-600 text-slate-300 text-sm hover:bg-slate-500 col-span-3">
                            Clear
                          </button>
                        </div>
                      </div>

                      <label className="flex items-center gap-2 mt-4 cursor-pointer">
                        <input type="checkbox" checked={includesDisposables} onChange={(e) => setIncludesDisposables(e.target.checked)} className="rounded border-slate-600" />
                        <span className="text-sm text-slate-400">Includes box/disposables</span>
                      </label>

                      <div className="mt-5 space-y-2 text-sm">
                        {foodCostPct != null && <p className={cn("font-semibold", foodCostColor(foodCostPct))}>Food Cost %: {foodCostPct.toFixed(1)}% — {foodCostStatus(foodCostPct)}</p>}
                        {profitPerItem != null && <p className="text-slate-300">Profit per item: {formatDollars(profitPerItem)}</p>}
                        {monthlyProfit != null && <p className="text-slate-300">Monthly profit at volume: {formatDollars(monthlyProfit)}</p>}
                        {annualProfit != null && <p className="text-emerald-400 font-medium">Annual profit: {formatDollars(annualProfit)}</p>}
                        {valid && price > 0 && (() => {
                          const marginPct = ((price - cost) / price) * 100;
                          return <p className="text-slate-300 mt-2 pt-2 border-t border-slate-700">{marginLanguage(marginPct)}</p>;
                        })()}
                      </div>

                      <button
                        type="button"
                        disabled={savingCost || (parseFloat(costInput) ?? NaN) < 0}
                        onClick={async () => {
                          const c = parseFloat(costInput);
                          if (Number.isNaN(c) || c < 0) return;
                          setSavingCost(true);
                          try {
                            const res = await fetch("/api/kitchen-iq", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ item_name: item.item_name, size: item.size, category: item.category, cost_to_make: c, includes_disposables: includesDisposables }),
                            });
                            if (res.ok) {
                              setSaveFlash(true);
                              setTimeout(() => setSaveFlash(false), 600);
                              refetchKitchenIq();
                              setTimeout(() => setSelectedKitchenItem(null), 400);
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
              );
            })()}
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
