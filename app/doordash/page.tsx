"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { COCKPIT_STORE_SLUGS, COCKPIT_TARGETS, type CockpitStoreSlug } from "@/lib/cockpit-config";
import { getStoreColor } from "@/lib/store-colors";
import { cn } from "@/lib/utils";

type DoorDashDay = {
  id: string;
  store_id: string;
  business_date: string;
  gross_sales: number;
  doordash_commission_pct: number;
  doordash_fees: number;
  net_after_fees: number;
  order_count: number;
  avg_ticket: number;
  tips: number;
  errors_refunds: number;
  ad_spend: number;
  true_profit: number;
  walkin_equivalent: number;
};

export default function DoorDashPage() {
  const [store, setStore] = useState<CockpitStoreSlug | "all">("all");
  const [data, setData] = useState<DoorDashDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEducation, setShowEducation] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/doordash?store=${store}&days=30`).then((r) => r.json());
    if (res.ok) setData(res.data);
    setLoading(false);
  }, [store]);

  useEffect(() => { loadData(); }, [loadData]);

  // Aggregates
  const totalGross = data.reduce((s, d) => s + (d.gross_sales || 0), 0);
  const totalFees = data.reduce((s, d) => s + (d.doordash_fees || 0), 0);
  const totalAdSpend = data.reduce((s, d) => s + (d.ad_spend || 0), 0);
  const totalErrors = data.reduce((s, d) => s + (d.errors_refunds || 0), 0);
  const totalTrueProfit = data.reduce((s, d) => s + (d.true_profit || 0), 0);
  const totalOrders = data.reduce((s, d) => s + (d.order_count || 0), 0);
  const totalTips = data.reduce((s, d) => s + (d.tips || 0), 0);
  const totalLostToDD = totalFees + totalAdSpend;
  const keepRate = totalGross > 0 ? (totalTrueProfit / totalGross) * 100 : 0;
  const avgDailyGross = data.length > 0 ? totalGross / data.length : 0;
  const avgDailyProfit = data.length > 0 ? totalTrueProfit / data.length : 0;
  const avgTicket = totalOrders > 0 ? totalGross / totalOrders : 0;

  return (
    <div className="space-y-5">
      <div className="dashboard-toolbar p-3 sm:p-5 space-y-3">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold sm:text-2xl">DoorDash Economics</h1>
          <button type="button" onClick={() => setShowEducation(true)} className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-full bg-muted/20 text-muted hover:bg-brand/20 hover:text-brand transition-colors text-xs font-bold" aria-label="Learn more">i</button>
        </div>
        <p className="text-xs text-muted">What you really keep after DoorDash takes their cut.</p>

        <div className="flex flex-wrap gap-1.5 justify-center">
          <button type="button" onClick={() => setStore("all")} className={cn("rounded-lg border px-3 py-2 text-sm font-medium transition-colors", store === "all" ? "border-brand/50 bg-brand/15 text-brand" : "border-border/30 bg-black/20 text-muted hover:text-white")}>All Stores</button>
          {COCKPIT_STORE_SLUGS.map((slug) => {
            const sc = getStoreColor(slug);
            return (
              <button key={slug} type="button" onClick={() => setStore(slug)} className={cn("rounded-lg border px-3 py-2 text-sm font-medium transition-colors", store === slug ? `${sc.borderActive} ${sc.bgActive} ${sc.text}` : "border-border/30 bg-black/20 text-muted hover:text-white")}>{COCKPIT_TARGETS[slug].name}</button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-lg border border-border/50 p-5"><div className="h-6 w-32 bg-muted/20 rounded mb-2" /><div className="h-4 w-48 bg-muted/20 rounded" /></div>
          ))}
        </div>
      ) : (
        <>
          {/* Hero: What You Actually Keep */}
          <div className={cn("rounded-lg border p-3 sm:p-5 text-center", keepRate >= 60 ? "border-emerald-500/50 bg-emerald-500/10" : keepRate >= 50 ? "border-amber-500/50 bg-amber-500/10" : "border-red-500/50 bg-red-500/10")}>
            <div className="text-[10px] font-medium uppercase tracking-widest text-muted/70">You Keep (After Fees + Ad Spend)</div>
            <div className={cn("mt-3 text-3xl sm:text-5xl font-black tabular-nums", keepRate >= 60 ? "text-emerald-400" : keepRate >= 50 ? "text-amber-400" : "text-red-400")}>
              {keepRate.toFixed(1)}%
            </div>
            <div className="text-xs text-muted mt-2">
              ${totalGross.toLocaleString("en-US", { maximumFractionDigits: 0 })} gross → <span className="text-red-400">${totalLostToDD.toLocaleString("en-US", { maximumFractionDigits: 0 })} to DoorDash</span> → <span className="text-emerald-400">${totalTrueProfit.toLocaleString("en-US", { maximumFractionDigits: 0 })} kept</span>
            </div>
          </div>

          {/* The Money Split */}
          <div className="rounded-lg border border-border p-5">
            <div className="text-[10px] uppercase text-muted tracking-wider mb-3">30-Day Money Split</div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-white">Gross DoorDash Sales</span>
                <span className="text-sm font-bold tabular-nums">${totalGross.toLocaleString("en-US", { maximumFractionDigits: 0 })}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-red-400">− DoorDash Commission (25%)</span>
                <span className="text-sm font-bold tabular-nums text-red-400">−${totalFees.toLocaleString("en-US", { maximumFractionDigits: 0 })}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-red-400">− DoorDash Ad Spend</span>
                <span className="text-sm font-bold tabular-nums text-red-400">−${totalAdSpend.toLocaleString("en-US", { maximumFractionDigits: 0 })}</span>
              </div>
              {totalErrors > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-red-400">− Errors & Refunds</span>
                  <span className="text-sm font-bold tabular-nums text-red-400">−${totalErrors.toLocaleString("en-US", { maximumFractionDigits: 0 })}</span>
                </div>
              )}
              <div className="border-t border-border/50 pt-2 flex justify-between items-center">
                <span className="text-sm font-bold text-emerald-400">= What You Actually Keep</span>
                <span className="text-lg font-black tabular-nums text-emerald-400">${totalTrueProfit.toLocaleString("en-US", { maximumFractionDigits: 0 })}</span>
              </div>
              <div className="border-t border-border/50 pt-2 flex justify-between items-center">
                <span className="text-sm text-amber-400">If this was all walk-in, you'd keep</span>
                <span className="text-lg font-black tabular-nums text-amber-400">${totalGross.toLocaleString("en-US", { maximumFractionDigits: 0 })}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted">DoorDash cost you</span>
                <span className="text-sm font-bold tabular-nums text-red-400">${totalLostToDD.toLocaleString("en-US", { maximumFractionDigits: 0 })}/month</span>
              </div>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="dashboard-surface rounded-lg border border-border p-4 text-center">
              <div className="text-[9px] uppercase text-muted">Total Orders</div>
              <div className="text-2xl font-bold tabular-nums text-brand">{totalOrders}</div>
            </div>
            <div className="dashboard-surface rounded-lg border border-border p-4 text-center">
              <div className="text-[9px] uppercase text-muted">Avg Ticket</div>
              <div className="text-2xl font-bold tabular-nums">${avgTicket.toFixed(2)}</div>
            </div>
            <div className="dashboard-surface rounded-lg border border-border p-4 text-center">
              <div className="text-[9px] uppercase text-muted">Avg Daily Gross</div>
              <div className="text-2xl font-bold tabular-nums">${avgDailyGross.toFixed(0)}</div>
            </div>
            <div className="dashboard-surface rounded-lg border border-border p-4 text-center">
              <div className="text-[9px] uppercase text-muted">Avg Daily Kept</div>
              <div className={cn("text-2xl font-bold tabular-nums", avgDailyProfit > 0 ? "text-emerald-400" : "text-red-400")}>${avgDailyProfit.toFixed(0)}</div>
            </div>
          </div>

          {/* Daily Breakdown */}
          <div className="space-y-1.5">
            <div className="text-[10px] uppercase text-muted tracking-wider px-1">Daily Breakdown (Last 30 Days)</div>
            {data.slice(0, 14).map((d) => {
              const keep = d.gross_sales > 0 ? (d.true_profit / d.gross_sales) * 100 : 0;
              return (
                <div key={d.id} className="rounded-lg border border-border/30 bg-black/20 p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted">{new Date(d.business_date + "T12:00:00Z").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</span>
                    <div className="flex items-center gap-3 text-xs tabular-nums">
                      <span className="text-white">${d.gross_sales.toFixed(0)}</span>
                      <span className="text-red-400">−${(d.doordash_fees + d.ad_spend).toFixed(0)}</span>
                      <span className={cn("font-bold", keep >= 60 ? "text-emerald-400" : keep >= 50 ? "text-amber-400" : "text-red-400")}>${d.true_profit.toFixed(0)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full bg-black/40 overflow-hidden">
                      <div className="h-full rounded-full bg-red-500/60" style={{ width: `${100 - keep}%` }} />
                    </div>
                    <span className="text-[9px] text-muted">{d.order_count} orders</span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Education Modal */}
      {showEducation && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0 }} onClick={() => setShowEducation(false)}>
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          <div className="relative w-full max-w-md mx-auto rounded-2xl border border-border bg-[#0d0f13] p-4 sm:p-5 shadow-2xl overflow-y-auto max-h-[85vh] min-w-0" onClick={(e) => e.stopPropagation()}>
            <button type="button" onClick={() => setShowEducation(false)} className="absolute top-3 right-3 min-h-[44px] min-w-[44px] flex items-center justify-center text-muted hover:text-white text-lg -mr-2" aria-label="Close">✕</button>
            <h3 className="text-base font-semibold text-brand mb-1">🎓 DoorDash Economics</h3>
            <p className="text-xs text-muted mb-4">What you really make on delivery.</p>
            <div className="space-y-3 text-sm">
              <div>
                <h4 className="font-medium text-white mb-1">The 25% Problem</h4>
                <p className="text-muted text-xs leading-relaxed">DoorDash takes 25% commission on every order. On $800/day in DoorDash sales, that's $200/day to DoorDash = $6,000/month. Add ad spend on top. You're keeping roughly 50-60 cents of every DoorDash dollar vs 100 cents on walk-in.</p>
              </div>
              <div>
                <h4 className="font-medium text-white mb-1">Why It Still Matters</h4>
                <p className="text-muted text-xs leading-relaxed">DoorDash brings volume you wouldn't otherwise get. The key is knowing your TRUE margin so you can decide: is this incremental revenue worth 25-35%? For most operators, yes — IF they're not depending on it for more than 20-25% of total sales.</p>
              </div>
              <div>
                <h4 className="font-medium text-white mb-1">The Dependency Trap</h4>
                <p className="text-muted text-xs leading-relaxed">If DoorDash is more than 25% of your revenue, you have a problem. They can raise fees, change algorithms, or deprioritize your store. Build walk-in and direct ordering so DoorDash is gravy, not the meal.</p>
              </div>
              <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-3">
                <h4 className="font-medium text-red-400 text-xs mb-2">📕 When DoorDash Eats Your Margin</h4>
                <ol className="space-y-1.5 text-muted text-xs list-decimal list-inside leading-relaxed">
                  <li>Calculate true keep rate. If below 50%, your ad spend is too high or errors are killing you.</li>
                  <li>Review DoorDash ad spend — are promoted listings actually converting?</li>
                  <li>Check error/refund rate. Every mistake costs double (food cost + refund).</li>
                  <li>Push customers to direct ordering. "Order direct, save $3" on every DoorDash bag stuffer.</li>
                  <li>Set a ceiling: DoorDash should be ≤25% of total revenue. Above that, you're dependent.</li>
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
