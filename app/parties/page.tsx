"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { EducationInfoIcon } from "@/src/components/education/InfoIcon";
import { cn } from "@/lib/utils";
import { COCKPIT_STORE_SLUGS, COCKPIT_TARGETS, type CockpitStoreSlug } from "@/lib/cockpit-config";

type LargeOrder = {
  id: string;
  store_id: string;
  store_slug: string | null;
  store_name: string;
  business_day: string;
  order_id: string;
  net_amount: number;
  flag_scheduling: boolean;
};

const STORE_OPTIONS: { value: "all" | CockpitStoreSlug; label: string }[] = [
  { value: "all", label: "All stores" },
  ...COCKPIT_STORE_SLUGS.map((s) => ({ value: s, label: COCKPIT_TARGETS[s].name })),
];

export default function PartiesPage() {
  const [store, setStore] = useState<"all" | CockpitStoreSlug>("all");
  const [orders, setOrders] = useState<LargeOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<LargeOrder | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/parties?store=${encodeURIComponent(store)}`);
      const json = await res.json();
      if (!json.ok) {
        setError(json.error ?? "Failed to load orders");
        setOrders([]);
        return;
      }
      setOrders((json.orders ?? []) as LargeOrder[]);
    } catch {
      setError("Network error");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [store]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return (
    <div className="space-y-5 pb-28">
      <div className="dashboard-toolbar p-3 sm:p-5 space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-lg font-semibold sm:text-2xl">Catering & Large Orders</h1>
          <EducationInfoIcon metricKey="party_orders" size="lg" />
        </div>
        <p className="text-xs text-muted">Orders $300+ from FoodTec (potential catering or large orders).</p>
        <select
          value={store}
          onChange={(e) => setStore(e.target.value as "all" | CockpitStoreSlug)}
          className="rounded-lg border border-border/50 bg-black/30 px-3 py-2 text-sm text-white focus:border-brand/60 focus:ring-1 focus:ring-brand/40 focus:outline-none"
          aria-label="Select store"
        >
          {STORE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {error && (
        <div className="mx-3 sm:mx-5 rounded-xl border border-red-500/50 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <section className="space-y-3 px-3 sm:px-5">
        <h2 className="text-sm font-semibold text-white px-1">Large orders ($300+)</h2>
        {loading ? (
          <p className="text-sm text-muted py-4 text-center">Loading…</p>
        ) : orders.length === 0 ? (
          <p className="text-sm text-muted py-4 text-center">
            No large orders in the last synced days. Orders $300+ from FoodTec will appear here after sync.
          </p>
        ) : (
          <div className="space-y-2">
            {orders.map((order) => (
              <button
                key={order.id}
                type="button"
                onClick={() => setSelected(order)}
                className="w-full text-left rounded-xl border border-border/50 bg-black/20 p-4 min-h-[44px] hover:border-brand/30 transition-colors"
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span className="font-medium text-white text-sm">{order.store_name}</span>
                  <span className="text-sm font-bold tabular-nums text-brand shrink-0">
                    ${order.net_amount.toFixed(0)}
                  </span>
                </div>
                <div className="text-[10px] text-muted mb-1">
                  {new Date(order.business_day + "T12:00:00Z").toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {order.flag_scheduling && (
                    <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      Flag for scheduling
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {selected && typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
            style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0 }}
            onClick={() => setSelected(null)}
          >
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <div
              className="relative w-full max-w-md mx-auto rounded-2xl border border-border bg-[#0d0f13] p-5 shadow-2xl overflow-y-auto"
              style={{ maxHeight: "90vh" }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="absolute top-3 right-3 text-muted hover:text-white text-lg leading-none min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Close"
              >
                ✕
              </button>
              <h3 className="text-base font-semibold text-white mb-1">Large order</h3>
              <div className="text-xs text-muted mb-3">
                {selected.store_name} · {new Date(selected.business_day + "T12:00:00Z").toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </div>
              <div className="rounded-lg border border-border/50 p-3 mb-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Order value</span>
                  <span className="font-bold text-brand">${selected.net_amount.toFixed(2)}</span>
                </div>
                {selected.flag_scheduling && (
                  <div className="mt-2 pt-2 border-t border-border/30">
                    <span className="text-[10px] uppercase font-semibold text-amber-400">
                      Flagged for scheduling
                    </span>
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className={cn(
                  "w-full rounded-lg border px-4 py-2.5 text-sm",
                  "border-border/50 bg-black/30 text-muted hover:text-white"
                )}
              >
                Close
              </button>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
