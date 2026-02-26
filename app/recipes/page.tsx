"use client";

import { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { EducationInfoIcon } from "@/src/components/education/InfoIcon";
import { SEED_RECIPES, type SeedRecipe, type SeedRecipeIngredient } from "@/src/lib/seed-data";

const CATEGORIES = [
  { key: "all", label: "All" },
  { key: "pizza", label: "Pizza" },
  { key: "appetizer", label: "Apps" },
  { key: "salad", label: "Salads" },
  { key: "sub", label: "Subs" },
  { key: "drink", label: "Drinks" },
] as const;

type Category = (typeof CATEGORIES)[number]["key"];

function ingredientLineCost(i: SeedRecipeIngredient): number {
  return Math.round(i.qty * i.cost_per_unit * 100) / 100;
}

function recipeTotalCost(r: SeedRecipe): number {
  return r.ingredients.reduce((sum, i) => sum + ingredientLineCost(i), 0);
}

function foodCostPct(cost: number, price: number): number {
  if (price <= 0) return 0;
  return Math.round((cost / price) * 1000) / 10;
}

function marginPct(cost: number, price: number): number {
  if (price <= 0) return 0;
  return Math.round(((price - cost) / price) * 1000) / 10;
}

function gradeFromFoodCostPct(pct: number): "GREEN" | "YELLOW" | "RED" {
  if (pct <= 28) return "GREEN";
  if (pct <= 33) return "YELLOW";
  return "RED";
}

function gradeBadgeClass(grade: "GREEN" | "YELLOW" | "RED"): string {
  if (grade === "GREEN") return "bg-emerald-500/20 text-emerald-400 border-emerald-500/40";
  if (grade === "YELLOW") return "bg-amber-500/20 text-amber-400 border-amber-500/40";
  return "bg-red-500/20 text-red-400 border-red-500/40";
}

export default function RecipesPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Category>("all");
  const [selected, setSelected] = useState<SeedRecipe | null>(null);
  const [showEducation, setShowEducation] = useState(false);

  const filteredRecipes = useMemo(() => {
    let list = SEED_RECIPES.filter((r) => filter === "all" || r.category === filter);
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.category.toLowerCase().includes(q) ||
          (r.size?.toLowerCase().includes(q)) ||
          r.ingredients.some((i) => i.name.toLowerCase().includes(q))
      );
    }
    return list;
  }, [filter, search]);

  return (
    <div className="space-y-4 min-w-0 overflow-x-hidden pb-28">
      <div className="dashboard-toolbar p-3 sm:p-5 space-y-3">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold sm:text-2xl">Recipe Cards</h1>
          <button
            type="button"
            onClick={() => setShowEducation(true)}
            className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-full bg-muted/20 text-muted hover:bg-brand/20 hover:text-brand transition-colors text-xs font-bold"
            aria-label="Learn more"
          >
            i
          </button>
        </div>
        <p className="text-xs text-muted">Theoretical food cost and Gross Margin by recipe.</p>

        {/* Search */}
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search recipes..."
          className={cn(
            "w-full h-12 rounded-xl border border-border/50 bg-black/30 px-4 text-sm text-white placeholder:text-slate-500",
            "focus:border-brand/60 focus:ring-1 focus:ring-brand/40 focus:outline-none"
          )}
          aria-label="Search recipes"
        />

        {/* Category filter */}
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => setFilter(c.key)}
              className={cn(
                "min-h-[44px] rounded-lg border px-3 py-2 text-sm font-medium transition-colors shrink-0",
                filter === c.key
                  ? "border-brand/50 bg-brand/15 text-brand"
                  : "border-border/50 bg-black/30 text-muted hover:border-border hover:bg-black/40"
              )}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Single column grid — full width cards on mobile */}
      <div className="px-3 sm:px-5 space-y-3">
        {filteredRecipes.map((r) => {
          const totalCost = recipeTotalCost(r);
          const fcPct = foodCostPct(totalCost, r.menu_price);
          const margin = marginPct(totalCost, r.menu_price);
          const grade = gradeFromFoodCostPct(fcPct);
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => setSelected(r)}
              className="w-full text-left rounded-xl border border-slate-700 bg-slate-800/50 p-4 min-w-0 active:bg-slate-800 transition-colors"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-bold text-white truncate">{r.name}</p>
                  {r.size && (
                    <p className="text-slate-400 text-sm">{r.size}</p>
                  )}
                </div>
                <span
                  className={cn(
                    "shrink-0 text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded-lg border",
                    gradeBadgeClass(grade)
                  )}
                >
                  {grade}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                <span className="text-sm text-slate-300">
                  Food cost:{" "}
                  <span className="text-white font-semibold tabular-nums">{fcPct}%</span>
                  <span className="inline-flex align-middle ml-0.5" onClick={(e) => e.stopPropagation()}>
                    <EducationInfoIcon metricKey="food_cost" />
                  </span>
                </span>
                <span className="text-sm text-slate-300">
                  Sell: <span className="text-white font-semibold tabular-nums">${r.menu_price.toFixed(2)}</span>
                </span>
                <span className="text-sm text-slate-300">
                  Gross Margin:{" "}
                  <span className="text-white font-semibold tabular-nums">{margin}%</span>
                  <span className="inline-flex align-middle ml-0.5" onClick={(e) => e.stopPropagation()}>
                    <EducationInfoIcon metricKey="gross_profit" />
                  </span>
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Recipe detail modal — ingredients, costs, total, sell price, Gross Margin */}
      {selected && typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-end justify-center sm:items-center p-0 sm:p-4"
            onClick={() => setSelected(null)}
            role="dialog"
            aria-modal="true"
            aria-labelledby="recipe-detail-title"
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" aria-hidden="true" />
            <div
              className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-slate-800 border border-slate-700 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-slate-800 border-b border-slate-700 p-4 flex items-start justify-between gap-2">
                <h2 id="recipe-detail-title" className="text-lg font-bold text-white pr-8">
                  {selected.name}
                  {selected.size && (
                    <span className="text-slate-400 font-normal ml-2">{selected.size}</span>
                  )}
                </h2>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="absolute top-3 right-3 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700"
                  aria-label="Close"
                >
                  ×
                </button>
              </div>

              <div className="p-4 space-y-4">
                {/* Ingredients with costs and portion sizes */}
                <div>
                  <h3 className="text-xs text-slate-500 uppercase tracking-wide mb-2">Ingredients</h3>
                  <ul className="space-y-2">
                    {selected.ingredients.map((i, idx) => {
                      const lineCost = ingredientLineCost(i);
                      return (
                        <li
                          key={idx}
                          className="flex justify-between items-baseline gap-2 text-sm"
                        >
                          <span className="text-slate-200">
                            {i.name} — {i.qty} {i.unit}
                          </span>
                          <span className="text-white font-medium tabular-nums shrink-0">
                            ${lineCost.toFixed(2)}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                <div className="border-t border-slate-700 pt-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Total recipe cost</span>
                    <span className="text-white font-semibold tabular-nums">
                      ${recipeTotalCost(selected).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Suggested sell price</span>
                    <span className="text-white font-semibold tabular-nums">
                      ${selected.menu_price.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400">
                      Food cost %
                      <span className="inline-flex align-middle ml-1">
                        <EducationInfoIcon metricKey="food_cost" />
                      </span>
                    </span>
                    <span
                      className={cn(
                        "font-semibold tabular-nums",
                        gradeFromFoodCostPct(foodCostPct(recipeTotalCost(selected), selected.menu_price)) === "GREEN"
                          ? "text-emerald-400"
                          : gradeFromFoodCostPct(foodCostPct(recipeTotalCost(selected), selected.menu_price)) === "YELLOW"
                            ? "text-amber-400"
                            : "text-red-400"
                      )}
                    >
                      {foodCostPct(recipeTotalCost(selected), selected.menu_price)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400">
                      Actual Gross Margin
                      <span className="inline-flex align-middle ml-1">
                        <EducationInfoIcon metricKey="gross_profit" />
                      </span>
                    </span>
                    <span className="text-white font-semibold tabular-nums">
                      {marginPct(recipeTotalCost(selected), selected.menu_price)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* Education modal */}
      {showEducation &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
            style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0 }}
            onClick={() => setShowEducation(false)}
          >
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <div
              className="relative w-full max-w-md mx-auto rounded-2xl border border-border bg-[#0d0f13] p-5 shadow-2xl overflow-y-auto max-h-[85vh] min-w-0"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setShowEducation(false)}
                className="absolute top-3 right-3 min-h-[44px] min-w-[44px] flex items-center justify-center text-muted hover:text-white text-lg -mr-2"
                aria-label="Close"
              >
                ✕
              </button>
              <h3 className="text-base font-semibold text-brand mb-1">🎓 Recipe Reality Check</h3>
              <p className="text-xs text-muted mb-4">
                Know what every item costs before it leaves the kitchen.
              </p>
              <div className="space-y-3 text-sm">
                <div>
                  <h4 className="font-medium text-white mb-1">Theoretical vs Actual</h4>
                  <p className="text-muted text-xs leading-relaxed">
                    Theoretical food cost = what it would cost based on your recipes. Actual food cost = what you actually spent (purchases ÷ sales). The gap between these two = overportioning + waste + theft + spoilage.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-white mb-1">Theoretical Food Cost by Item</h4>
                  <p className="text-muted text-xs leading-relaxed">
                    Pizzas: 25–30%. Appetizers: 20–28%. Subs: 28–32%. If any item is over 33%, either raise the price or re-engineer the recipe.
                  </p>
                </div>
                <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-3">
                  <h4 className="font-medium text-red-400 text-xs mb-2">📕 When an Item&apos;s Food Cost Is Too High</h4>
                  <ol className="space-y-1.5 text-muted text-xs list-decimal list-inside leading-relaxed">
                    <li>Weigh 10 portions during a rush vs the recipe spec.</li>
                    <li>Check if vendor raised prices — recalculate ingredient costs.</li>
                    <li>Consider portion reduction or menu price increase.</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
