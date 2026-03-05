"use client";

import { useState, useMemo, useEffect } from "react";
import { formatPct, formatDollars } from "@/src/lib/formatters";
import { EducationInfoIcon } from "@/src/components/education/InfoIcon";

type DoorDashData = {
  doordash_sales: number;
  doordash_commission: number;
  doordash_orders: number;
  doordash_new_customers: number;
  doordash_returning_customers: number;
};

export default function DeliveryEconomicsPage() {
  const [store, setStore] = useState("kent");
  const [rangeData, setRangeData] = useState<{ sales: { doordash_sales?: number; doordash_commission?: number; doordash_orders?: number; doordash_new_customers?: number; doordash_returning_customers?: number }[] } | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/dashboard/daily-data?store_id=${encodeURIComponent(store)}&range=30`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled || !d.sales) return;
        setRangeData({ sales: d.sales ?? [] });
      })
      .catch(() => setRangeData(null));
    return () => { cancelled = true; };
  }, [store]);

  const dd = useMemo((): DoorDashData | null => {
    if (!rangeData?.sales?.length) return null;
    const sales = rangeData.sales;
    const doordash_sales = sales.reduce((s, r) => s + (r.doordash_sales ?? 0), 0);
    const doordash_commission = sales.reduce((s, r) => s + (r.doordash_commission ?? 0), 0);
    const doordash_orders = sales.reduce((s, r) => s + (r.doordash_orders ?? 0), 0);
    const doordash_new_customers = sales.reduce((s, r) => s + (r.doordash_new_customers ?? 0), 0);
    const doordash_returning_customers = sales.reduce((s, r) => s + (r.doordash_returning_customers ?? 0), 0);
    if (doordash_orders === 0 && doordash_sales === 0) return null;
    return { doordash_sales, doordash_commission, doordash_orders, doordash_new_customers, doordash_returning_customers };
  }, [rangeData]);

  return (
    <div className="space-y-4 pb-28 min-w-0 overflow-x-hidden">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-white">Delivery Economics</h1>
          <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
            DoorDash data from your POS
            <EducationInfoIcon metricKey="delivery_mix_pct" size="sm" />
          </p>
        </div>
        <EducationInfoIcon metricKey="delivery_economics" size="lg" />
      </div>

      <div className="flex gap-2 mb-4">
        <label className="text-xs text-slate-500">Store:</label>
        <select value={store} onChange={(e) => setStore(e.target.value)} className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white">
          <option value="kent">LeeAngelo's Kent</option>
          <option value="aurora">LeeAngelo's Aurora</option>
          <option value="lindseys">Lindsey's</option>
        </select>
      </div>

      {rangeData === null ? (
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 text-center text-zinc-500">
          <p className="text-sm">Loading…</p>
        </div>
      ) : dd ? (
        <div className="bg-slate-800 rounded-xl border border-red-700/30 p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">🚗</span>
            <h3 className="text-sm font-semibold text-red-400">DoorDash</h3>
            <span className="text-xs text-emerald-400">● POS</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <div className="text-xs text-slate-500">Gross Revenue (30d)</div>
              <div className="text-sm text-emerald-400 font-medium">{formatDollars(dd.doordash_sales)}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Commission</div>
              <div className="text-sm text-red-400 font-medium">{formatDollars(dd.doordash_commission)}</div>
              <div className="text-[10px] text-slate-600">{dd.doordash_sales > 0 ? formatPct((dd.doordash_commission / dd.doordash_sales) * 100) : "—"}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Orders</div>
              <div className="text-sm text-white font-medium">{dd.doordash_orders}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Net/Order</div>
              <div className="text-sm text-white font-medium">
                {dd.doordash_orders > 0 ? "$" + ((dd.doordash_sales - dd.doordash_commission) / dd.doordash_orders).toFixed(2) : "—"}
              </div>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-700 grid grid-cols-2 gap-2 text-xs text-slate-400">
            <span>New customers: {dd.doordash_new_customers}</span>
            <span>Returning: {dd.doordash_returning_customers}</span>
          </div>
        </div>
      ) : (
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 text-center text-zinc-500">
          <p className="text-sm">No DoorDash data for this store (last 30 days).</p>
          <p className="text-xs mt-1">Data syncs from your POS daily. <a href="mailto:hello@getprimeos.com" className="text-[#E65100] underline">hello@getprimeos.com</a></p>
        </div>
      )}
    </div>
  );
}
