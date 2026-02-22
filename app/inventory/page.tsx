"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { EducationInfoIcon } from "@/src/components/education/InfoIcon";
import { SEED_INVENTORY, type SeedInventoryItem } from "@/src/lib/seed-data";

const CATEGORIES = [
  { key: "all", label: "All" },
  { key: "cheese", label: "Cheese" },
  { key: "meats", label: "Meats" },
  { key: "produce", label: "Produce" },
  { key: "dough_dry", label: "Dough/Dry" },
  { key: "sauces", label: "Sauces" },
  { key: "paper", label: "Paper" },
];

type Status = "In Stock" | "Low" | "Out";

function getStatus(item: { current_count: number; par_level: number }): Status {
  if (item.current_count === 0) return "Out";
  if (item.par_level > 0 && item.current_count < item.par_level * 0.25) return "Low";
  return "In Stock";
}

function statusBadgeClass(status: Status): string {
  if (status === "In Stock") return "bg-emerald-500/20 text-emerald-400 border-emerald-500/40";
  if (status === "Low") return "bg-amber-500/20 text-amber-400 border-amber-500/40";
  return "bg-red-500/20 text-red-400 border-red-500/40";
}

function formatLastCounted(dateStr: string): string {
  return new Date(dateStr + "T12:00:00Z").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function InventoryPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [items, setItems] = useState<SeedInventoryItem[]>(() => SEED_INVENTORY);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  const filteredItems = useMemo(() => {
    let list = items.filter((i) => filter === "all" || i.category === filter);
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.category.toLowerCase().includes(q) ||
          i.vendor.toLowerCase().includes(q)
      );
    }
    return list;
  }, [items, filter, search]);

  function startEdit(item: SeedInventoryItem) {
    setEditingId(item.id);
    setEditValue(String(item.current_count));
  }

  function saveEdit() {
    if (editingId === null) return;
    const next = Math.max(0, Math.floor(Number(editValue) || 0));
    setItems((prev) =>
      prev.map((i) => (i.id === editingId ? { ...i, current_count: next } : i))
    );
    setEditingId(null);
    setEditValue("");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditValue("");
  }

  return (
    <div className="space-y-4 min-w-0 overflow-x-hidden pb-24">
      <div className="dashboard-toolbar p-3 sm:p-5 space-y-3">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold sm:text-2xl">Inventory</h1>
          <EducationInfoIcon metricKey="inventory_par" />
        </div>
        <p className="text-xs text-muted">
          Par levels and on-hand counts. Tap count to update.
        </p>

        {/* Search */}
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search items..."
          className={cn(
            "w-full h-12 rounded-xl border border-border/50 bg-black/30 px-4 text-sm text-white placeholder:text-slate-500",
            "focus:border-brand/60 focus:ring-1 focus:ring-brand/40 focus:outline-none"
          )}
          aria-label="Search inventory"
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

      {/* Inventory cards */}
      <div className="px-3 sm:px-5 space-y-3">
        {filteredItems.map((item) => {
          const status = getStatus(item);
          const isEditing = editingId === item.id;
          return (
            <div
              key={item.id}
              className="rounded-xl border border-slate-700 bg-slate-800/50 p-4 min-w-0"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-bold text-white truncate">{item.name}</p>
                  <p className="text-slate-400 text-sm mt-0.5">
                    Par {item.par_level} {item.unit}
                  </p>
                </div>
                <span
                  className={cn(
                    "shrink-0 text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded-lg border",
                    statusBadgeClass(status)
                  )}
                >
                  {status}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 text-sm">Count:</span>
                  {isEditing ? (
                    <span className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={saveEdit}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveEdit();
                          if (e.key === "Escape") cancelEdit();
                        }}
                        className="w-20 min-h-[44px] rounded-lg border border-brand/50 bg-slate-800 px-2 text-center text-sm font-semibold text-white tabular-nums focus:outline-none focus:ring-2 focus:ring-brand/50"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={saveEdit}
                        className="text-xs text-brand font-medium"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="text-xs text-slate-400 font-medium"
                      >
                        Cancel
                      </button>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => startEdit(item)}
                      className="min-h-[44px] min-w-[44px] rounded-lg border border-slate-600 bg-slate-800 px-3 text-white font-bold tabular-nums hover:border-slate-500 hover:bg-slate-700 transition-colors"
                    >
                      {item.current_count}
                    </button>
                  )}
                </div>
                <span className="text-slate-500 text-sm">{item.unit}</span>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Last counted {formatLastCounted(item.last_counted)}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
