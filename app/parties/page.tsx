"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { COCKPIT_STORE_SLUGS, COCKPIT_TARGETS, type CockpitStoreSlug } from "@/lib/cockpit-config";
import { getStoreColor } from "@/lib/store-colors";
import { cn } from "@/lib/utils";

type PartyItem = { name: string; qty: number; price: number };

type Party = {
  id: string;
  store_id: string;
  customer_name: string;
  customer_phone: string | null;
  customer_email: string | null;
  party_date: string;
  party_time: string | null;
  guest_count: number;
  items: PartyItem[];
  subtotal: number;
  tax: number;
  total: number;
  deposit: number;
  status: string;
  notes: string | null;
  prep_notes: string | null;
  staff_assigned: string | null;
  created_at: string;
};

export default function PartiesPage() {
  const [store, setStore] = useState<CockpitStoreSlug | "all">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "completed">("all");
  const [parties, setParties] = useState<Party[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Party | null>(null);
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
    const res = await fetch(`/api/parties?store=${store}&status=${statusFilter}`).then((r) => r.json());
    if (res.ok) setParties(res.parties);
    setLoading(false);
  }, [store, statusFilter]);

  useEffect(() => { loadData(); }, [loadData]);

  async function approveParty(id: string) {
    await fetch("/api/parties", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: "approved" }),
    });
    loadData();
    setSelected(null);
  }

  async function completeParty(id: string) {
    await fetch("/api/parties", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: "completed" }),
    });
    loadData();
    setSelected(null);
  }

  // Stats
  const upcoming = parties.filter((p) => p.status === "pending" || p.status === "approved");
  const pendingCount = parties.filter((p) => p.status === "pending").length;
  const upcomingRevenue = upcoming.reduce((s, p) => s + (p.total || 0), 0);
  const upcomingGuests = upcoming.reduce((s, p) => s + (p.guest_count || 0), 0);
  const totalRevenue = parties.reduce((s, p) => s + (p.total || 0), 0);

  const statusBadge = (status: string) => {
    if (status === "pending") return "bg-amber-500/10 text-amber-400 border-amber-500/30";
    if (status === "approved") return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
    if (status === "completed") return "bg-muted/10 text-muted border-border/30";
    return "bg-muted/10 text-muted border-border/30";
  };

  return (
    <div className="space-y-5">
      <div className="dashboard-toolbar p-3 sm:p-5 space-y-3">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold sm:text-2xl">Party Orders</h1>
          <button type="button" onClick={() => setShowEducation(true)} className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-full bg-muted/20 text-muted hover:bg-brand/20 hover:text-brand transition-colors text-xs font-bold" aria-label="Learn more">i</button>
        </div>
        <p className="text-xs text-muted">Catering and party orders. Approve, prep, deliver, profit.</p>

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
          {["all", "pending", "approved", "completed"].map((s) => (
            <button key={s} type="button" onClick={() => setStatusFilter(s as any)} className={cn("min-h-[44px] rounded-lg border px-2.5 py-1.5 text-xs font-medium capitalize", statusFilter === s ? "border-brand/50 bg-brand/15 text-brand" : "border-border/30 bg-black/20 text-muted")}>{s}{s === "pending" && pendingCount > 0 ? ` (${pendingCount})` : ""}</button>
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
          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="dashboard-surface rounded-lg border border-border p-4 text-center">
              <div className="text-[9px] uppercase text-muted">Upcoming</div>
              <div className="text-2xl font-bold tabular-nums text-brand">{upcoming.length}</div>
            </div>
            <div className="dashboard-surface rounded-lg border border-border p-4 text-center">
              <div className="text-[9px] uppercase text-muted">Pending Approval</div>
              <div className={cn("text-2xl font-bold tabular-nums", pendingCount > 0 ? "text-amber-400" : "text-emerald-400")}>{pendingCount}</div>
            </div>
            <div className="dashboard-surface rounded-lg border border-border p-4 text-center">
              <div className="text-[9px] uppercase text-muted">Upcoming Revenue</div>
              <div className="text-2xl font-bold tabular-nums text-emerald-400">${upcomingRevenue.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
            </div>
            <div className="dashboard-surface rounded-lg border border-border p-4 text-center">
              <div className="text-[9px] uppercase text-muted">Total Guests</div>
              <div className="text-2xl font-bold tabular-nums">{upcomingGuests}</div>
            </div>
          </div>

          {/* Party List */}
          {parties.length === 0 ? (
            <div className="text-center py-12 text-muted text-sm">No party orders found.</div>
          ) : (
            <div className="space-y-2">
              {parties.map((p) => {
                const sc = getStoreColor(storeMap[p.store_id]?.slug || "");
                const isUpcoming = p.status === "pending" || p.status === "approved";
                const partyDate = new Date(p.party_date + "T12:00:00Z");
                const daysUntil = Math.ceil((partyDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

                return (
                  <button key={p.id} type="button" onClick={() => setSelected(p)} className="w-full text-left rounded-lg border border-border/50 bg-black/20 p-4 min-h-[44px] hover:border-brand/30 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={cn("h-2 w-2 rounded-full shrink-0", sc.dot)} />
                        <span className="font-medium text-white text-sm">{p.customer_name}</span>
                        <span className={cn("text-[10px] uppercase font-bold px-2 py-0.5 rounded border", statusBadge(p.status))}>{p.status}</span>
                      </div>
                      <span className="text-sm font-bold tabular-nums text-brand">${p.total.toFixed(0)}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-muted">
                      <span>{partyDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</span>
                      {p.party_time && <span>{p.party_time}</span>}
                      <span>{p.guest_count} guests</span>
                      <span>{p.items?.length || 0} items</span>
                      {isUpcoming && daysUntil >= 0 && <span className={cn("font-bold", daysUntil <= 3 ? "text-red-400" : daysUntil <= 7 ? "text-amber-400" : "text-muted")}>{daysUntil === 0 ? "TODAY" : daysUntil === 1 ? "TOMORROW" : `${daysUntil} days`}</span>}
                      <span>{storeMap[p.store_id]?.name || ""}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Detail Modal */}
      {selected && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0 }} onClick={() => setSelected(null)}>
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          <div className="relative w-full max-w-md mx-auto rounded-2xl border border-border bg-[#0d0f13] p-5 shadow-2xl overflow-y-auto" style={{ maxHeight: "90vh" }} onClick={(e) => e.stopPropagation()}>
            <button type="button" onClick={() => setSelected(null)} className="absolute top-3 right-3 text-muted hover:text-white text-lg leading-none">✕</button>

            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-base font-semibold text-white">{selected.customer_name}</h3>
              <span className={cn("text-[10px] uppercase font-bold px-2 py-0.5 rounded border", statusBadge(selected.status))}>{selected.status}</span>
            </div>
            <div className="text-xs text-muted mb-4">
              {new Date(selected.party_date + "T12:00:00Z").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
              {selected.party_time && ` at ${selected.party_time}`} — {selected.guest_count} guests — {storeMap[selected.store_id]?.name || ""}
            </div>

            {selected.customer_phone && (
              <a href={`tel:${selected.customer_phone}`} className="inline-flex items-center gap-1 min-h-[44px] py-2 text-xs text-brand hover:underline mb-3">📞 {selected.customer_phone}</a>
            )}

            {/* Items */}
            <div className="rounded-lg border border-border/50 p-3 mb-3">
              <div className="text-[9px] uppercase text-muted mb-2">Order Items</div>
              {(selected.items || []).map((item: PartyItem, idx: number) => (
                <div key={idx} className="flex items-center justify-between py-1 text-sm">
                  <span className="text-white">{item.qty}x {item.name}</span>
                  <span className="text-muted tabular-nums">${(item.qty * item.price).toFixed(2)}</span>
                </div>
              ))}
              <div className="border-t border-border/30 mt-2 pt-2 space-y-1">
                <div className="flex justify-between text-xs text-muted"><span>Subtotal</span><span>${selected.subtotal?.toFixed(2)}</span></div>
                <div className="flex justify-between text-xs text-muted"><span>Tax</span><span>${selected.tax?.toFixed(2)}</span></div>
                <div className="flex justify-between text-sm font-bold text-brand"><span>Total</span><span>${selected.total?.toFixed(2)}</span></div>
                {selected.deposit > 0 && <div className="flex justify-between text-xs text-emerald-400"><span>Deposit Paid</span><span>${selected.deposit?.toFixed(2)}</span></div>}
                {selected.deposit > 0 && <div className="flex justify-between text-xs text-amber-400"><span>Balance Due</span><span>${(selected.total - selected.deposit).toFixed(2)}</span></div>}
              </div>
            </div>

            {selected.notes && (
              <div className="rounded-lg border border-border/50 p-3 mb-3">
                <div className="text-[9px] uppercase text-muted mb-1">Customer Notes</div>
                <p className="text-xs text-white">{selected.notes}</p>
              </div>
            )}

            {selected.prep_notes && (
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 mb-3">
                <div className="text-[9px] uppercase text-amber-400 mb-1">Prep Plan</div>
                <p className="text-xs text-white">{selected.prep_notes}</p>
              </div>
            )}

            {selected.staff_assigned && (
              <div className="rounded-lg border border-border/50 p-3 mb-3">
                <div className="text-[9px] uppercase text-muted mb-1">Staff Assigned</div>
                <p className="text-xs text-white">{selected.staff_assigned}</p>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-2 mt-4">
              {selected.status === "pending" && (
                <button type="button" onClick={() => approveParty(selected.id)} className="flex-1 rounded-lg border border-emerald-500/50 bg-emerald-500/15 px-4 py-2.5 text-sm font-semibold text-emerald-400 hover:bg-emerald-500/25">✓ Approve</button>
              )}
              {selected.status === "approved" && (
                <button type="button" onClick={() => completeParty(selected.id)} className="flex-1 rounded-lg border border-brand/50 bg-brand/15 px-4 py-2.5 text-sm font-semibold text-brand hover:bg-brand/25">✓ Mark Complete</button>
              )}
              <button type="button" onClick={() => setSelected(null)} className="flex-1 rounded-lg border border-border/50 bg-black/30 px-4 py-2.5 text-sm text-muted hover:text-white">Close</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Education Modal */}
      {showEducation && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0 }} onClick={() => setShowEducation(false)}>
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          <div className="relative w-full max-w-md mx-auto rounded-2xl border border-border bg-[#0d0f13] p-4 sm:p-5 shadow-2xl overflow-y-auto max-h-[85vh] min-w-0" onClick={(e) => e.stopPropagation()}>
            <button type="button" onClick={() => setShowEducation(false)} className="absolute top-3 right-3 min-h-[44px] min-w-[44px] flex items-center justify-center text-muted hover:text-white text-lg -mr-2" aria-label="Close">✕</button>
            <h3 className="text-base font-semibold text-brand mb-1">🎓 Party Sales</h3>
            <p className="text-xs text-muted mb-4">Your highest-margin revenue stream.</p>
            <div className="space-y-3 text-sm">
              <div>
                <h4 className="font-medium text-white mb-1">Why Parties Are Premium Revenue</h4>
                <p className="text-muted text-xs leading-relaxed">Party orders are prepaid, predictable, and bulk-prepped. Margins are 15-20% higher than walk-in because you can prep efficiently and staff precisely. A shop doing 4 parties/weekend at $400 avg = $6,400/month in premium revenue.</p>
              </div>
              <div>
                <h4 className="font-medium text-white mb-1">The Automation Advantage</h4>
                <p className="text-muted text-xs leading-relaxed">When a party is approved, three things should happen automatically: prep list adjusts, schedule adjusts for extra staff, and revenue forecast updates. No more paper orders lost on the counter. No more kitchen blindsided on Saturday.</p>
              </div>
              <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-3">
                <h4 className="font-medium text-red-400 text-xs mb-2">📕 When Party Orders Are Declining</h4>
                <ol className="space-y-1.5 text-muted text-xs list-decimal list-inside leading-relaxed">
                  <li>Check: do customers even know you do parties? Add it to your menu, bags, and social.</li>
                  <li>Review pricing — are you competitive with other catering options?</li>
                  <li>Make ordering dead simple. One form, one call, one text. No friction.</li>
                  <li>Follow up on every completed party. Ask for a review and a referral.</li>
                  <li>Track repeat party customers. They're your best revenue source.</li>
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
