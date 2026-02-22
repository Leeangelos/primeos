"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { COCKPIT_STORE_SLUGS, COCKPIT_TARGETS, type CockpitStoreSlug } from "@/lib/cockpit-config";
import { getStoreColor } from "@/lib/store-colors";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { key: "all", label: "All" },
  { key: "cheese", label: "Cheese" },
  { key: "meats", label: "Meats" },
  { key: "produce", label: "Produce" },
  { key: "dough_dry", label: "Dough/Dry" },
  { key: "sauces", label: "Sauces" },
  { key: "paper", label: "Paper" },
  { key: "beverages", label: "Drinks" },
];

type InvItem = {
  id: string;
  name: string;
  category: string;
  default_unit: string;
  unit_cost: number;
  par_level: number | null;
};

type CountLine = {
  item_id: string;
  name: string;
  category: string;
  unit: string;
  unit_cost: number;
  qty: number;
  value: number;
};

type SavedCount = {
  id: string;
  count_date: string;
  status: string;
  total_value: number;
  items: CountLine[];
  created_at: string;
};

export default function InventoryPage() {
  const [items, setItems] = useState<InvItem[]>([]);
  const [counts, setCounts] = useState<SavedCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"history" | "counting">("history");
  const [store, setStore] = useState<CockpitStoreSlug>(COCKPIT_STORE_SLUGS[0]);
  const [filter, setFilter] = useState("all");
  const [countLines, setCountLines] = useState<CountLine[]>([]);
  const [saving, setSaving] = useState(false);
  const [showEducation, setShowEducation] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [itemsRes, countsRes] = await Promise.all([
      fetch("/api/inventory/items").then((r) => r.json()),
      fetch("/api/inventory/counts").then((r) => r.json()),
    ]);
    if (itemsRes.ok) setItems(itemsRes.items);
    if (countsRes.ok) setCounts(countsRes.counts);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  function startCount() {
    const lines: CountLine[] = items.map((item) => ({
      item_id: item.id,
      name: item.name,
      category: item.category,
      unit: item.default_unit,
      unit_cost: item.unit_cost,
      qty: 0,
      value: 0,
    }));
    setCountLines(lines);
    setMode("counting");
  }

  function updateQty(idx: number, qty: number) {
    const updated = [...countLines];
    updated[idx] = { ...updated[idx], qty, value: +(qty * updated[idx].unit_cost).toFixed(2) };
    setCountLines(updated);
  }

  const filteredLines = filter === "all"
    ? countLines
    : countLines.filter((l) => l.category === filter);

  const totalValue = countLines.reduce((sum, l) => sum + l.value, 0);
  const countedItems = countLines.filter((l) => l.qty > 0).length;

  async function handleSave() {
    setSaving(true);
    const itemsWithQty = countLines.filter((l) => l.qty > 0);

    await fetch("/api/inventory/counts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        count_date: new Date().toISOString().slice(0, 10),
        items: itemsWithQty,
        status: "completed",
      }),
    });

    setSaving(false);
    setMode("history");
    loadData();
  }

  return (
    <div className="space-y-5">
      <div className="dashboard-toolbar p-3 sm:p-5 space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold sm:text-2xl">Inventory</h1>
            <button type="button" onClick={() => setShowEducation(true)} className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-full bg-muted/20 text-muted hover:bg-brand/20 hover:text-brand transition-colors text-xs font-bold" aria-label="Learn more">i</button>
          </div>
          {mode === "history" ? (
            <button type="button" onClick={startCount} disabled={items.length === 0} className="min-h-[44px] rounded-lg border border-brand/50 bg-brand/15 px-4 py-2.5 text-sm font-semibold text-brand hover:bg-brand/25 disabled:opacity-50">
              Start Count
            </button>
          ) : (
            <button type="button" onClick={handleSave} disabled={saving || countedItems === 0} className="min-h-[44px] rounded-lg border border-emerald-500/50 bg-emerald-500/15 px-4 py-2.5 text-sm font-semibold text-emerald-400 hover:bg-emerald-500/25 disabled:opacity-50">
              {saving ? "Saving…" : `✓ Save (${countedItems} items)`}
            </button>
          )}
        </div>
        <p className="text-xs text-muted">
          {mode === "history" ? "Walk-in to wallet. Count it, cost it, compare it." : "Enter quantities for each item. Skip what you don't have."}
        </p>
      </div>

      {mode === "counting" && (
        <>
          {/* Live total bar */}
          <div className="rounded-lg border border-brand/30 bg-brand/5 p-4 flex items-center justify-between">
            <div>
              <div className="text-[10px] uppercase text-muted">Inventory Value</div>
              <div className="text-2xl font-black tabular-nums text-brand">${totalValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
            </div>
            <div className="text-right">
              <div className="text-[10px] uppercase text-muted">Items Counted</div>
              <div className="text-lg font-bold tabular-nums">{countedItems} / {countLines.length}</div>
            </div>
          </div>

          {/* Category filter */}
          <div className="flex flex-wrap gap-1.5 justify-center">
            {CATEGORIES.map((c) => (
              <button key={c.key} type="button" onClick={() => setFilter(c.key)} className={cn("min-h-[44px] rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors", filter === c.key ? "border-brand/50 bg-brand/15 text-brand" : "border-border/30 bg-black/20 text-muted hover:text-white")}>{c.label}</button>
            ))}
          </div>

          {/* Count lines */}
          <div className="space-y-1">
            {filteredLines.map((line) => {
              const globalIdx = countLines.findIndex((l) => l.item_id === line.item_id);
              return (
                <div key={line.item_id} className={cn("rounded-lg border p-3 flex items-center gap-3", line.qty > 0 ? "border-emerald-500/20 bg-emerald-500/5" : "border-border/30 bg-black/10")}>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white truncate">{line.name}</div>
                    <div className="text-[10px] text-muted">${line.unit_cost.toFixed(2)} / {line.unit}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => updateQty(globalIdx, Math.max(0, line.qty - 1))} className="min-h-[44px] min-w-[44px] rounded-lg border border-border/50 bg-black/30 text-muted hover:text-white text-lg font-bold flex items-center justify-center" aria-label="Decrease">−</button>
                    <input
                      type="number"
                      value={line.qty || ""}
                      onChange={(e) => updateQty(globalIdx, Number(e.target.value) || 0)}
                      className="w-16 min-h-[44px] rounded-lg border border-border/50 bg-black/30 text-center text-sm font-bold text-white tabular-nums focus:border-brand/60 focus:ring-1 focus:ring-brand/40 focus:outline-none"
                      placeholder="0"
                    />
                    <button type="button" onClick={() => updateQty(globalIdx, line.qty + 1)} className="min-h-[44px] min-w-[44px] rounded-lg border border-border/50 bg-black/30 text-muted hover:text-white text-lg font-bold flex items-center justify-center" aria-label="Increase">+</button>
                  </div>
                  <div className="w-16 text-right">
                    <div className="text-xs font-bold tabular-nums text-muted">{line.qty > 0 ? `$${line.value.toFixed(2)}` : "—"}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Cancel */}
          <button type="button" onClick={() => setMode("history")} className="w-full rounded-lg border border-border/50 bg-black/30 px-4 py-3 text-sm text-muted hover:text-white text-center">Cancel Count</button>
        </>
      )}

      {mode === "history" && (
        <>
          {loading ? (
            <div className="space-y-3 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-lg border border-border/50 p-4">
                  <div className="h-4 w-40 bg-muted/20 rounded mb-2" />
                  <div className="h-3 w-24 bg-muted/20 rounded" />
                </div>
              ))}
            </div>
          ) : counts.length === 0 ? (
            <div className="text-center py-12 text-muted text-sm">
              No inventory counts yet. Tap "Start Count" to do your first walk-in count.
            </div>
          ) : (
            <div className="space-y-2">
              {counts.map((c) => (
                <div key={c.id} className="rounded-lg border border-border/50 bg-black/20 p-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-white">
                      {new Date(c.count_date + "T12:00:00Z").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                    </span>
                    <span className="text-sm font-bold tabular-nums text-brand">${c.total_value?.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="text-xs text-muted">
                    {c.items?.length || 0} items counted • {c.status}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Education Modal */}
      {showEducation && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0 }} onClick={() => setShowEducation(false)}>
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          <div className="relative w-full max-w-md mx-auto rounded-2xl border border-border bg-[#0d0f13] p-4 sm:p-5 shadow-2xl overflow-y-auto max-h-[85vh] min-w-0" onClick={(e) => e.stopPropagation()}>
            <button type="button" onClick={() => setShowEducation(false)} className="absolute top-3 right-3 min-h-[44px] min-w-[44px] flex items-center justify-center text-muted hover:text-white text-lg -mr-2" aria-label="Close">✕</button>
            <h3 className="text-base font-semibold text-brand mb-1">🎓 Inventory Counts</h3>
            <p className="text-xs text-muted mb-4">Walk-in to wallet — know what you have and what it's worth.</p>
            <div className="space-y-3 text-sm">
              <div>
                <h4 className="font-medium text-white mb-1">Why Count Inventory?</h4>
                <p className="text-muted text-xs leading-relaxed">Your purchases show what you BOUGHT. Your POS shows what you SOLD. Inventory shows what you HAVE. The math: Beginning Inventory + Purchases − Ending Inventory = Actual Usage. Compare actual usage to theoretical usage (what recipes say you should have used) and the gap = waste + theft + overportioning.</p>
              </div>
              <div>
                <h4 className="font-medium text-white mb-1">How Often?</h4>
                <p className="text-muted text-xs leading-relaxed">Weekly is ideal. At minimum, do it before and after each accounting period. Monday morning before deliveries is the best time — your walk-in is at its lowest, counts are fast.</p>
              </div>
              <div>
                <h4 className="font-medium text-white mb-1">The Money Math</h4>
                <p className="text-muted text-xs leading-relaxed">If you bought $8K in food, sold $6K worth (per recipes), but only have $1K in the walk-in — that's $1K unaccounted for. On $150K/year in food, a 2% gap = $3,000 walking out the door. Inventory tells you WHERE.</p>
              </div>
              <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-3">
                <h4 className="font-medium text-red-400 text-xs mb-2">📕 When Inventory Variance Is High</h4>
                <ol className="space-y-1.5 text-muted text-xs list-decimal list-inside leading-relaxed">
                  <li>Identify which items have the biggest dollar variance.</li>
                  <li>Check portioning on those items — weigh 10 during a rush.</li>
                  <li>Review waste logs. Is product expiring before it's used?</li>
                  <li>Check for unrecorded comps, employee meals, or remakes.</li>
                  <li>Compare across locations — if one store is off, investigate.</li>
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
