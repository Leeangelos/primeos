"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { EducationInfoIcon } from "@/src/components/education/InfoIcon";
import { SEED_PARTY_ORDERS, type SeedPartyOrder } from "@/src/lib/seed-data";
import { cn } from "@/lib/utils";

const todayDateString = () => {
  const d = new Date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
};

function formatItemSummary(items: { name: string; qty: number; price: number }[]): string {
  return items.map((i) => `${i.qty}× ${i.name}`).join(", ");
}

function depositStatus(order: SeedPartyOrder): string {
  if (order.deposit_paid <= 0) return "Deposit pending";
  if (order.deposit_paid >= order.total) return "Deposit paid (full)";
  return `Deposit paid $${order.deposit_paid.toFixed(0)} · $${(order.total - order.deposit_paid).toFixed(0)} due`;
}

export default function PartiesPage() {
  const [selected, setSelected] = useState<SeedPartyOrder | null>(null);

  const today = todayDateString();
  const upcoming = SEED_PARTY_ORDERS.filter((p) => p.party_date >= today).sort(
    (a, b) => new Date(a.party_date).getTime() - new Date(b.party_date).getTime()
  );
  const completed = SEED_PARTY_ORDERS.filter((p) => p.party_date < today).sort(
    (a, b) => new Date(b.party_date).getTime() - new Date(a.party_date).getTime()
  );

  const Card = ({ order }: { order: SeedPartyOrder }) => (
    <button
      type="button"
      onClick={() => setSelected(order)}
      className="w-full text-left rounded-lg border border-border/50 bg-black/20 p-4 min-h-[44px] hover:border-brand/30 transition-colors"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="font-medium text-white text-sm">{order.customer_name}</span>
        <span className="text-sm font-bold tabular-nums text-brand shrink-0">${order.total.toFixed(0)}</span>
      </div>
      <div className="text-[10px] text-muted mb-1">
        {new Date(order.party_date + "T12:00:00Z").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
        {order.party_time ? ` · ${order.party_time}` : ""}
      </div>
      <div className="text-[10px] text-muted mb-1 line-clamp-2">{formatItemSummary(order.items)}</div>
      <div className={cn("text-[10px]", order.deposit_paid >= order.total ? "text-emerald-400" : order.deposit_paid > 0 ? "text-amber-400" : "text-muted")}>
        {depositStatus(order)}
      </div>
    </button>
  );

  return (
    <div className="space-y-5 pb-28">
      <div className="dashboard-toolbar p-3 sm:p-5 space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-lg font-semibold sm:text-2xl">Catering & Large Orders</h1>
          <EducationInfoIcon metricKey="party_orders" />
        </div>
        <p className="text-xs text-muted">Catering and event orders. Gross Margins and upsell strategy.</p>
      </div>

      {/* Upcoming */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-white px-1">Upcoming</h2>
        {upcoming.length === 0 ? (
          <p className="text-sm text-muted py-4 text-center">No upcoming catering orders.</p>
        ) : (
          <div className="space-y-2">
            {upcoming.map((p) => (
              <Card key={p.id} order={p} />
            ))}
          </div>
        )}
      </section>

      {/* Completed */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted px-1">Completed</h2>
        {completed.length === 0 ? (
          <p className="text-sm text-muted py-4 text-center">No completed catering orders.</p>
        ) : (
          <div className="space-y-2">
            {completed.map((p) => (
              <Card key={p.id} order={p} />
            ))}
          </div>
        )}
      </section>

      {/* Detail Modal */}
      {selected && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0 }} onClick={() => setSelected(null)}>
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          <div className="relative w-full max-w-md mx-auto rounded-2xl border border-border bg-[#0d0f13] p-5 shadow-2xl overflow-y-auto" style={{ maxHeight: "90vh" }} onClick={(e) => e.stopPropagation()}>
            <button type="button" onClick={() => setSelected(null)} className="absolute top-3 right-3 text-muted hover:text-white text-lg leading-none min-h-[44px] min-w-[44px] flex items-center justify-center" aria-label="Close">✕</button>

            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-base font-semibold text-white">{selected.customer_name}</h3>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded border bg-muted/10 text-muted border-border/30">{selected.status}</span>
            </div>
            <div className="text-xs text-muted mb-4">
              {new Date(selected.party_date + "T12:00:00Z").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
              {selected.party_time ? ` at ${selected.party_time}` : ""} — {selected.guest_count} guests
            </div>

            <div className="rounded-lg border border-border/50 p-3 mb-3">
              <div className="text-[9px] uppercase text-muted mb-2">Order Items</div>
              {selected.items.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between py-1 text-sm">
                  <span className="text-white">{item.qty}× {item.name}</span>
                  <span className="text-muted tabular-nums">${(item.qty * item.price).toFixed(2)}</span>
                </div>
              ))}
              <div className="border-t border-border/30 mt-2 pt-2 space-y-1">
                <div className="flex justify-between text-xs text-muted"><span>Subtotal</span><span>${selected.subtotal?.toFixed(2)}</span></div>
                <div className="flex justify-between text-xs text-muted"><span>Tax</span><span>${selected.tax?.toFixed(2)}</span></div>
                <div className="flex justify-between text-sm font-bold text-brand"><span>Total</span><span>${selected.total?.toFixed(2)}</span></div>
                {selected.deposit_paid > 0 && <div className="flex justify-between text-xs text-emerald-400"><span>Deposit Paid</span><span>${selected.deposit_paid?.toFixed(2)}</span></div>}
                {selected.deposit_paid > 0 && selected.deposit_paid < selected.total && <div className="flex justify-between text-xs text-amber-400"><span>Balance Due</span><span>${(selected.total - selected.deposit_paid).toFixed(2)}</span></div>}
              </div>
            </div>

            <button type="button" onClick={() => setSelected(null)} className="w-full rounded-lg border border-border/50 bg-black/30 px-4 py-2.5 text-sm text-muted hover:text-white">Close</button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
