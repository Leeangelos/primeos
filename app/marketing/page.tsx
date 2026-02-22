"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { COCKPIT_STORE_SLUGS, COCKPIT_TARGETS, type CockpitStoreSlug } from "@/lib/cockpit-config";
import { getStoreColor } from "@/lib/store-colors";
import { cn } from "@/lib/utils";

type Campaign = {
  id: string;
  store_id: string;
  name: string;
  platform: string;
  status: string;
  start_date: string | null;
  end_date: string | null;
  total_spend: number;
  new_customers: number;
  revenue_attributed: number;
  avg_ticket: number;
  repeat_visits: number;
  customer_cac: number;
  customer_ltv: number;
  roi_multiple: number;
  notes: string | null;
};

const PLATFORMS: Record<string, string> = {
  meta: "Meta/Facebook",
  google: "Google Ads",
  instagram: "Instagram",
  tiktok: "TikTok",
  nextdoor: "Nextdoor",
  yelp: "Yelp",
  print: "Print/Mailer",
  sponsorship: "Sponsorship",
  other: "Other",
};

export default function MarketingPage() {
  const [store, setStore] = useState<CockpitStoreSlug | "all">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "completed">("all");
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEducation, setShowEducation] = useState(false);
  const [storeMap, setStoreMap] = useState<Record<string, { name: string; slug: string }>>({});

  useEffect(() => {
    fetch("/api/stores").then(r => r.json()).then(d => {
      if (d.ok && d.stores) {
        const map: Record<string, { name: string; slug: string }> = {};
        for (const s of d.stores) map[s.id] = { name: s.name, slug: s.slug };
        setStoreMap(map);
      }
    });
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/marketing?store=${store}&status=${statusFilter}`).then((r) => r.json());
    if (res.ok) setCampaigns(res.campaigns);
    setLoading(false);
  }, [store, statusFilter]);

  useEffect(() => { loadData(); }, [loadData]);

  // Aggregate stats
  const totalSpend = campaigns.reduce((s, c) => s + (c.total_spend || 0), 0);
  const totalCustomers = campaigns.reduce((s, c) => s + (c.new_customers || 0), 0);
  const totalRevenue = campaigns.reduce((s, c) => s + (c.revenue_attributed || 0), 0);
  const blendedCAC = totalCustomers > 0 ? totalSpend / totalCustomers : 0;
  const blendedROI = totalSpend > 0 ? totalRevenue / totalSpend : 0;

  // Best and worst
  const sorted = [...campaigns].sort((a, b) => b.roi_multiple - a.roi_multiple);
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];

  // By platform
  const byPlatform: Record<string, { spend: number; customers: number; revenue: number }> = {};
  for (const c of campaigns) {
    if (!byPlatform[c.platform]) byPlatform[c.platform] = { spend: 0, customers: 0, revenue: 0 };
    byPlatform[c.platform].spend += c.total_spend || 0;
    byPlatform[c.platform].customers += c.new_customers || 0;
    byPlatform[c.platform].revenue += c.revenue_attributed || 0;
  }

  return (
    <div className="space-y-5">
      <div className="dashboard-toolbar p-3 sm:p-5 space-y-3">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold sm:text-2xl">Ad Accountability</h1>
          <button type="button" onClick={() => setShowEducation(true)} className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-full bg-muted/20 text-muted hover:bg-brand/20 hover:text-brand transition-colors text-xs font-bold" aria-label="Learn more">i</button>
        </div>
        <p className="text-xs text-muted">Every dollar in. Every customer out. No guessing.</p>

        <div className="flex flex-wrap gap-1.5 justify-center">
          <button type="button" onClick={() => setStore("all")} className={cn("min-h-[44px] rounded-lg border px-3 py-2 text-sm font-medium transition-colors", store === "all" ? "border-brand/50 bg-brand/15 text-brand" : "border-border/30 bg-black/20 text-muted hover:text-white")}>All Stores</button>
          {COCKPIT_STORE_SLUGS.map((slug) => {
            const sc = getStoreColor(slug);
            return (
              <button key={slug} type="button" onClick={() => setStore(slug)} className={cn("min-h-[44px] rounded-lg border px-3 py-2 text-sm font-medium transition-colors", store === slug ? `${sc.borderActive} ${sc.bgActive} ${sc.text}` : "border-border/30 bg-black/20 text-muted hover:text-white")}>{COCKPIT_TARGETS[slug].name}</button>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-2 justify-center">
          {["all", "active", "completed"].map((s) => (
            <button key={s} type="button" onClick={() => setStatusFilter(s as any)} className={cn("min-h-[44px] rounded-lg border px-2.5 py-1.5 text-xs font-medium capitalize", statusFilter === s ? "border-brand/50 bg-brand/15 text-brand" : "border-border/30 bg-black/20 text-muted")}>{s}</button>
          ))}
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
          {/* Blended ROI Hero */}
          <div className={cn("rounded-lg border p-3 sm:p-5 text-center", blendedROI >= 3 ? "border-emerald-500/50 bg-emerald-500/10" : blendedROI >= 1 ? "border-amber-500/50 bg-amber-500/10" : "border-red-500/50 bg-red-500/10")}>
            <div className="text-[10px] font-medium uppercase tracking-widest text-muted/70">Blended Marketing ROI</div>
            <div className={cn("mt-3 text-3xl sm:text-5xl font-black tabular-nums", blendedROI >= 3 ? "text-emerald-400" : blendedROI >= 1 ? "text-amber-400" : "text-red-400")}>
              {blendedROI.toFixed(1)}x
            </div>
            <div className="text-xs text-muted mt-2">
              ${totalSpend.toLocaleString()} spent → {totalCustomers} customers → ${totalRevenue.toLocaleString()} revenue
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="dashboard-surface rounded-lg border border-border p-4 text-center">
              <div className="text-[9px] uppercase text-muted">Total Spend</div>
              <div className="text-xl font-bold tabular-nums">${totalSpend.toLocaleString()}</div>
            </div>
            <div className="dashboard-surface rounded-lg border border-border p-4 text-center">
              <div className="text-[9px] uppercase text-muted">New Customers</div>
              <div className="text-xl font-bold tabular-nums text-brand">{totalCustomers}</div>
            </div>
            <div className="dashboard-surface rounded-lg border border-border p-4 text-center">
              <div className="text-[9px] uppercase text-muted">Blended CAC</div>
              <div className={cn("text-xl font-bold tabular-nums", blendedCAC < 15 ? "text-emerald-400" : blendedCAC < 30 ? "text-amber-400" : "text-red-400")}>${blendedCAC.toFixed(2)}</div>
            </div>
            <div className="dashboard-surface rounded-lg border border-border p-4 text-center">
              <div className="text-[9px] uppercase text-muted">Revenue</div>
              <div className="text-xl font-bold tabular-nums text-emerald-400">${totalRevenue.toLocaleString()}</div>
            </div>
          </div>

          {/* Best vs Worst */}
          {best && worst && campaigns.length > 1 && (
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4">
                <div className="text-[9px] uppercase text-emerald-400 mb-1">Best Campaign</div>
                <div className="text-sm font-bold text-white truncate">{best.name}</div>
                <div className="text-lg font-black tabular-nums text-emerald-400">{best.roi_multiple}x ROI</div>
                <div className="text-[10px] text-muted">${best.total_spend} → {best.new_customers} customers</div>
              </div>
              <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-4">
                <div className="text-[9px] uppercase text-red-400 mb-1">Weakest Campaign</div>
                <div className="text-sm font-bold text-white truncate">{worst.name}</div>
                <div className="text-lg font-black tabular-nums text-red-400">{worst.roi_multiple}x ROI</div>
                <div className="text-[10px] text-muted">${worst.total_spend} → {worst.new_customers} customers</div>
              </div>
            </div>
          )}

          {/* By Platform */}
          {Object.keys(byPlatform).length > 0 && (
            <div className="dashboard-surface rounded-lg border border-border p-3 sm:p-5">
              <h2 className="text-[10px] font-semibold uppercase tracking-wider text-muted mb-3">ROI by Platform</h2>
              <div className="space-y-2">
                {Object.entries(byPlatform).sort((a, b) => (b[1].spend > 0 ? b[1].revenue / b[1].spend : 0) - (a[1].spend > 0 ? a[1].revenue / a[1].spend : 0)).map(([platform, data]) => {
                  const roi = data.spend > 0 ? data.revenue / data.spend : 0;
                  return (
                    <div key={platform} className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-sm text-white truncate">{PLATFORMS[platform] || platform}</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs tabular-nums shrink-0">
                        <span className="text-muted">${data.spend.toLocaleString()}</span>
                        <span className="text-brand">{data.customers} cust</span>
                        <span className={cn("font-bold", roi >= 3 ? "text-emerald-400" : roi >= 1 ? "text-amber-400" : "text-red-400")}>{roi.toFixed(1)}x</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Campaign List */}
          <div className="space-y-2">
            <h2 className="text-[10px] font-semibold uppercase tracking-wider text-muted px-1">All Campaigns ({campaigns.length})</h2>
            {campaigns.map((c) => {
              const sc = getStoreColor(storeMap[c.store_id]?.slug || "");
              return (
                <div key={c.id} className="rounded-lg border border-border/50 bg-black/20 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={cn("h-2 w-2 rounded-full shrink-0", sc.dot)} />
                      <span className="font-medium text-white text-sm truncate">{c.name}</span>
                    </div>
                    <span className={cn("text-[10px] uppercase font-bold px-2 py-0.5 rounded", c.status === "active" ? "bg-emerald-500/10 text-emerald-400" : "bg-muted/10 text-muted")}>{c.status}</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                    <div>
                      <div className="text-[9px] uppercase text-muted">Spend</div>
                      <div className="text-sm font-bold tabular-nums">${c.total_spend}</div>
                    </div>
                    <div>
                      <div className="text-[9px] uppercase text-muted">Customers</div>
                      <div className="text-sm font-bold tabular-nums text-brand">{c.new_customers}</div>
                    </div>
                    <div>
                      <div className="text-[9px] uppercase text-muted">CAC</div>
                      <div className={cn("text-sm font-bold tabular-nums", c.customer_cac < 15 ? "text-emerald-400" : c.customer_cac < 30 ? "text-amber-400" : "text-red-400")}>${c.customer_cac}</div>
                    </div>
                    <div>
                      <div className="text-[9px] uppercase text-muted">ROI</div>
                      <div className={cn("text-sm font-bold tabular-nums", c.roi_multiple >= 3 ? "text-emerald-400" : c.roi_multiple >= 1 ? "text-amber-400" : "text-red-400")}>{c.roi_multiple}x</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-[10px] text-muted">
                    <span>{PLATFORMS[c.platform] || c.platform}</span>
                    <span>{storeMap[c.store_id]?.name || ""}</span>
                    {c.start_date && <span>{new Date(c.start_date + "T12:00:00Z").toLocaleDateString("en-US", { month: "short", day: "numeric" })}{c.end_date ? " – " + new Date(c.end_date + "T12:00:00Z").toLocaleDateString("en-US", { month: "short", day: "numeric" }) : ""}</span>}
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
            <h3 className="text-base font-semibold text-brand mb-1">🎓 Ad Accountability</h3>
            <p className="text-xs text-muted mb-4">Every dollar in. Every customer out.</p>
            <div className="space-y-3 text-sm">
              <div>
                <h4 className="font-medium text-white mb-1">Customer CAC</h4>
                <p className="text-muted text-xs leading-relaxed">CAC = Total ad spend ÷ New customers acquired. If you spent $500 on Meta ads and got 62 new customers, CAC = $8.06. Anything under $15 is strong for pizza.</p>
              </div>
              <div>
                <h4 className="font-medium text-white mb-1">Customer LTV</h4>
                <p className="text-muted text-xs leading-relaxed">LTV = Average ticket × Repeat visits in 90 days. If avg ticket is $24.80 and customers return 3x, LTV = $74.40. Your LTV must be higher than CAC or you're losing money on every new customer.</p>
              </div>
              <div>
                <h4 className="font-medium text-white mb-1">ROI Multiple</h4>
                <p className="text-muted text-xs leading-relaxed">ROI = LTV ÷ CAC. Above 3x = great, keep scaling. 1-3x = okay, optimize. Below 1x = losing money, pause immediately. A 5x ROI means every $1 in ads generates $5 in customer value.</p>
              </div>
              <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-3">
                <h4 className="font-medium text-red-400 text-xs mb-2">📕 When CAC &gt; LTV (Losing Money)</h4>
                <ol className="space-y-1.5 text-muted text-xs list-decimal list-inside leading-relaxed">
                  <li>Pause the campaign immediately. Every day it runs is money lost.</li>
                  <li>Review creative — is the ad speaking to pizza customers or generic?</li>
                  <li>Check targeting — reaching people within delivery/pickup radius?</li>
                  <li>Test a new hook. 3-second rule: call out + value in first 3 seconds.</li>
                  <li>Compare with your best campaign. What was different?</li>
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
