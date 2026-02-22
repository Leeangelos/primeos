"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { key: "all", label: "All" },
  { key: "pizza", label: "Pizza" },
  { key: "appetizer", label: "Apps" },
  { key: "salad", label: "Salads" },
  { key: "sub", label: "Subs" },
  { key: "wing", label: "Wings" },
  { key: "dessert", label: "Desserts" },
  { key: "drink", label: "Drinks" },
] as const;

type Ingredient = { name: string; qty: string; unit: string; cost: number };

type Recipe = {
  id: string;
  name: string;
  category: string;
  size: string | null;
  ingredients: Ingredient[];
  theoretical_cost: number;
  menu_price: number;
  food_cost_pct: number;
  notes: string | null;
};

function costColor(pct: number): string {
  if (pct <= 28) return "text-emerald-400";
  if (pct <= 33) return "text-amber-400";
  return "text-red-400";
}

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Recipe | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showEducation, setShowEducation] = useState(false);

  // Form state
  const [fName, setFName] = useState("");
  const [fCategory, setFCategory] = useState("pizza");
  const [fSize, setFSize] = useState("");
  const [fPrice, setFPrice] = useState("");
  const [fNotes, setFNotes] = useState("");
  const [fIngredients, setFIngredients] = useState<Ingredient[]>([
    { name: "", qty: "", unit: "oz", cost: 0 },
  ]);

  const loadRecipes = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/recipes?category=${filter}`);
    const data = await res.json();
    if (data.ok) setRecipes(data.recipes);
    setLoading(false);
  }, [filter]);

  useEffect(() => { loadRecipes(); }, [loadRecipes]);

  function resetForm() {
    setFName(""); setFCategory("pizza"); setFSize(""); setFPrice(""); setFNotes("");
    setFIngredients([{ name: "", qty: "", unit: "oz", cost: 0 }]);
    setEditing(null); setShowForm(false);
  }

  function startEdit(r: Recipe) {
    setFName(r.name);
    setFCategory(r.category);
    setFSize(r.size || "");
    setFPrice(String(r.menu_price));
    setFNotes(r.notes || "");
    setFIngredients(r.ingredients.length > 0 ? r.ingredients : [{ name: "", qty: "", unit: "oz", cost: 0 }]);
    setEditing(r);
    setShowForm(true);
  }

  function addIngredient() {
    setFIngredients([...fIngredients, { name: "", qty: "", unit: "oz", cost: 0 }]);
  }

  function updateIngredient(idx: number, field: keyof Ingredient, value: string | number) {
    const updated = [...fIngredients];
    updated[idx] = { ...updated[idx], [field]: value };
    setFIngredients(updated);
  }

  function removeIngredient(idx: number) {
    if (fIngredients.length <= 1) return;
    setFIngredients(fIngredients.filter((_, i) => i !== idx));
  }

  const theoreticalCost = fIngredients.reduce((sum, i) => sum + (Number(i.cost) || 0), 0);
  const menuPrice = Number(fPrice) || 0;
  const liveFoodCostPct = menuPrice > 0 ? (theoreticalCost / menuPrice * 100) : 0;

  async function handleSave() {
    if (!fName.trim()) return;
    setSaving(true);

    const cleanIngredients = fIngredients.filter((i) => i.name.trim());
    const payload = {
      name: fName.trim(),
      category: fCategory,
      size: fSize.trim() || null,
      menu_price: menuPrice,
      ingredients: cleanIngredients,
      notes: fNotes.trim() || null,
    };

    if (editing) {
      await fetch("/api/recipes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editing.id, ...payload }),
      });
    } else {
      await fetch("/api/recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }

    setSaving(false);
    resetForm();
    loadRecipes();
  }

  async function handleDelete(id: string) {
    setDeleting(id);
    await fetch(`/api/recipes?id=${id}`, { method: "DELETE" });
    setDeleting(null);
    loadRecipes();
  }

  const inputCls = "w-full rounded-lg border border-border/50 bg-black/30 px-3 py-2.5 text-sm text-white placeholder:text-muted/50 focus:border-brand/60 focus:ring-1 focus:ring-brand/40 focus:outline-none";

  return (
    <div className="space-y-5">
      <div className="dashboard-toolbar p-3 sm:p-5 space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
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
          <button
            type="button"
            onClick={() => { resetForm(); setShowForm(true); }}
            className="min-h-[44px] rounded-lg border border-brand/50 bg-brand/15 px-4 py-2.5 text-sm font-semibold text-brand hover:bg-brand/25"
          >
            + Add
          </button>
        </div>
        <p className="text-xs text-muted">Know exactly what each menu item costs. Theoretical vs actual.</p>
        <div className="flex flex-wrap gap-1.5 justify-center">
          {CATEGORIES.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => setFilter(c.key)}
              className={cn(
                "min-h-[44px] rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors",
                filter === c.key
                  ? "border-brand/50 bg-brand/15 text-brand"
                  : "border-border/30 bg-black/20 text-muted hover:text-white"
              )}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Recipe list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-lg border border-border/50 p-4 animate-pulse">
              <div className="h-4 w-40 bg-muted/20 rounded mb-2" />
              <div className="h-3 w-24 bg-muted/20 rounded" />
            </div>
          ))}
        </div>
      ) : recipes.length === 0 ? (
        <div className="text-center py-12 text-muted text-sm">
          No recipes yet. Tap "+ Add" to create your first recipe card.
        </div>
      ) : (
        <div className="space-y-2">
          {recipes.map((r) => (
            <div key={r.id} className="rounded-lg border border-border/50 bg-black/20 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-white">{r.name}</span>
                    {r.size && <span className="text-[10px] text-muted bg-muted/10 px-1.5 py-0.5 rounded">{r.size}</span>}
                    <span className="text-[10px] uppercase tracking-wider text-muted bg-muted/10 px-1.5 py-0.5 rounded">{r.category}</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-2">
                    <div>
                      <div className="text-[9px] uppercase text-muted">Cost</div>
                      <div className="text-sm font-bold tabular-nums">${r.theoretical_cost.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-[9px] uppercase text-muted">Price</div>
                      <div className="text-sm font-bold tabular-nums">${r.menu_price.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-[9px] uppercase text-muted">Food Cost</div>
                      <div className={`text-sm font-bold tabular-nums ${costColor(r.food_cost_pct)}`}>
                        {r.food_cost_pct}%
                      </div>
                    </div>
                  </div>
                  {r.ingredients.length > 0 && (
                    <div className="text-xs text-muted/60 mt-2 break-words">
                      {r.ingredients.map((i) => i.name).filter(Boolean).join(", ")}
                    </div>
                  )}
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button type="button" onClick={() => startEdit(r)} className="min-h-[44px] min-w-[44px] flex items-center justify-center text-xs text-muted hover:text-white px-3 py-2 rounded border border-border/30 hover:border-border/60">Edit</button>
                  <button type="button" onClick={() => handleDelete(r.id)} disabled={deleting === r.id} className="min-h-[44px] min-w-[44px] flex items-center justify-center text-xs text-red-400 hover:text-red-300 px-3 py-2 rounded border border-red-500/20 hover:border-red-500/40 disabled:opacity-50">{deleting === r.id ? "..." : "Del"}</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Form Modal */}
      {showForm && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0 }} onClick={() => resetForm()}>
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          <div className="relative w-full max-w-lg mx-auto rounded-2xl border border-border bg-[#0d0f13] p-5 shadow-2xl overflow-y-auto" style={{ maxHeight: "90vh" }} onClick={(e) => e.stopPropagation()}>
            <button type="button" onClick={() => resetForm()} className="absolute top-3 right-3 text-muted hover:text-white text-lg leading-none" aria-label="Close">✕</button>
            <h3 className="text-base font-semibold text-brand mb-4">{editing ? "Edit Recipe" : "New Recipe Card"}</h3>

            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-muted mb-1">Name *</label>
                  <input type="text" value={fName} onChange={(e) => setFName(e.target.value)} placeholder='e.g. Pepperoni Pizza' className={inputCls} autoFocus />
                </div>
                <div>
                  <label className="block text-xs text-muted mb-1">Category</label>
                  <select value={fCategory} onChange={(e) => setFCategory(e.target.value)} className={inputCls}>
                    <option value="pizza">Pizza</option>
                    <option value="appetizer">Appetizer</option>
                    <option value="salad">Salad</option>
                    <option value="sub">Sub</option>
                    <option value="wing">Wings</option>
                    <option value="dessert">Dessert</option>
                    <option value="drink">Drink</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-muted mb-1">Size</label>
                  <input type="text" value={fSize} onChange={(e) => setFSize(e.target.value)} placeholder='e.g. 16-inch' className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs text-muted mb-1">Menu Price ($)</label>
                  <input type="number" step="0.01" value={fPrice} onChange={(e) => setFPrice(e.target.value)} placeholder="14.99" className={inputCls} />
                </div>
              </div>

              {/* Ingredients */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs text-muted">Ingredients</label>
                  <button type="button" onClick={addIngredient} className="text-xs text-brand hover:text-brand/80">+ Add item</button>
                </div>
                <div className="space-y-2">
                  {fIngredients.map((ing, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <input type="text" value={ing.name} onChange={(e) => updateIngredient(idx, "name", e.target.value)} placeholder="Item" className={cn(inputCls, "flex-1")} />
                      <input type="text" value={ing.qty} onChange={(e) => updateIngredient(idx, "qty", e.target.value)} placeholder="Qty" className={cn(inputCls, "w-16")} />
                      <select value={ing.unit} onChange={(e) => updateIngredient(idx, "unit", e.target.value)} className={cn(inputCls, "w-16")}>
                        <option value="oz">oz</option>
                        <option value="lb">lb</option>
                        <option value="cup">cup</option>
                        <option value="each">ea</option>
                        <option value="slice">slice</option>
                        <option value="g">g</option>
                      </select>
                      <input type="number" step="0.01" value={ing.cost || ""} onChange={(e) => updateIngredient(idx, "cost", Number(e.target.value))} placeholder="$" className={cn(inputCls, "w-16")} />
                      {fIngredients.length > 1 && (
                        <button type="button" onClick={() => removeIngredient(idx)} className="text-red-400 hover:text-red-300 text-xs px-1">✕</button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Live cost preview */}
              <div className="rounded-lg border border-border/50 bg-black/40 p-3">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-center">
                  <div>
                    <div className="text-[9px] uppercase text-muted">Cost</div>
                    <div className="text-sm font-bold tabular-nums">${theoreticalCost.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-[9px] uppercase text-muted">Price</div>
                    <div className="text-sm font-bold tabular-nums">${menuPrice.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-[9px] uppercase text-muted">Food Cost %</div>
                    <div className={`text-sm font-bold tabular-nums ${costColor(liveFoodCostPct)}`}>
                      {liveFoodCostPct.toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs text-muted mb-1">Notes</label>
                <textarea value={fNotes} onChange={(e) => setFNotes(e.target.value)} placeholder="Prep notes, portion reminders..." rows={2} className={cn(inputCls, "resize-y min-h-[3rem]")} />
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button type="button" onClick={handleSave} disabled={saving || !fName.trim()} className="flex-1 rounded-lg border border-brand/50 bg-brand/15 px-4 py-2.5 text-sm font-semibold text-brand hover:bg-brand/25 disabled:opacity-50">
                {saving ? "Saving…" : editing ? "Update" : "Save Recipe"}
              </button>
              <button type="button" onClick={() => resetForm()} className="rounded-lg border border-border/50 bg-black/30 px-4 py-2.5 text-sm text-muted hover:text-white">Cancel</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Education Modal */}
      {showEducation && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0 }} onClick={() => setShowEducation(false)}>
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          <div className="relative w-full max-w-md mx-auto rounded-2xl border border-border bg-[#0d0f13] p-5 shadow-2xl overflow-y-auto" style={{ maxHeight: "85vh" }} onClick={(e) => e.stopPropagation()}>
            <button type="button" onClick={() => setShowEducation(false)} className="absolute top-3 right-3 text-muted hover:text-white text-lg leading-none" aria-label="Close">✕</button>
            <h3 className="text-base font-semibold text-brand mb-1">🎓 Recipe Reality Check</h3>
            <p className="text-xs text-muted mb-4">Know what every item costs before it leaves the kitchen.</p>
            <div className="space-y-3 text-sm">
              <div>
                <h4 className="font-medium text-white mb-1">Theoretical vs Actual</h4>
                <p className="text-muted text-xs leading-relaxed">Theoretical food cost = what it SHOULD cost based on your recipes. Actual food cost = what you actually spent (purchases ÷ sales). The gap between these two = overportioning + waste + theft + spoilage.</p>
              </div>
              <div>
                <h4 className="font-medium text-white mb-1">Target Food Cost by Item</h4>
                <p className="text-muted text-xs leading-relaxed">Pizzas: 25-30%. Appetizers: 20-28%. Subs: 28-32%. Wings fluctuate with market price. If any item is over 33%, either raise the price or re-engineer the recipe.</p>
              </div>
              <div>
                <h4 className="font-medium text-white mb-1">How To Use This</h4>
                <p className="text-muted text-xs leading-relaxed">Enter every menu item with exact portion costs. Compare theoretical cost to your actual food cost on the Daily page. A 2% gap on $150K/year in food = $3,000 walking out the door. This page tells you WHERE it's going.</p>
              </div>
              <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-3">
                <h4 className="font-medium text-red-400 text-xs mb-2">📕 When an Item's Food Cost Is Too High</h4>
                <ol className="space-y-1.5 text-muted text-xs list-decimal list-inside leading-relaxed">
                  <li>Weigh 10 portions during a rush vs the recipe spec.</li>
                  <li>Check if vendor raised prices — recalculate ingredient costs.</li>
                  <li>Consider portion reduction or menu price increase.</li>
                  <li>Check for waste — how much of this item gets thrown away?</li>
                  <li>Compare to similar items — is one version more profitable?</li>
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
