"use client";

import { Suspense, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

// Demo: always show Free Tier as current plan (monetization model demo)
const CURRENT_PLAN = "free" as const; // "free" | "operator"
const FREE_TIER_LABEL = "Free Tier (FoodTec)";
const OPERATOR_PLAN_LABEL = "Operator Plan";

// Demo invoice history (empty for free tier; show when we want to illustrate paid state)
const SEED_INVOICES = [
  { id: "inv1", date: "2025-02-01", amount: 199, status: "Paid", description: "Operator Plan — 1 location" },
  { id: "inv2", date: "2025-01-01", amount: 199, status: "Paid", description: "Operator Plan — 1 location" },
];

function BillingContent() {
  const searchParams = useSearchParams();
  const success = searchParams.get("success");
  const canceled = searchParams.get("canceled");

  const [priceId, setPriceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [setupLoading, setSetupLoading] = useState(true);
  const [setupError, setSetupError] = useState(false); // Stripe not configured — show UI, stub checkout
  const [locations, setLocations] = useState(1);
  const [showEducation, setShowEducation] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/billing/setup", { method: "POST" })
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) setPriceId(d.priceId);
        else setSetupError(true);
        setSetupLoading(false);
      })
      .catch(() => {
        setSetupError(true);
        setSetupLoading(false);
      });
  }, []);

  async function handleCheckout() {
    if (!priceId) {
      setCheckoutError("Stripe is not configured. Contact sales to upgrade.");
      return;
    }
    setCheckoutError(null);
    setLoading(true);

    const res = await fetch("/api/billing/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        priceId,
        locationCount: locations,
      }),
    }).then((r) => r.json());

    if (res.ok && res.url) {
      window.location.href = res.url;
    } else {
      setCheckoutError(res.error || "Checkout failed");
      setLoading(false);
    }
  }

  const monthlyTotal = locations * 199;
  const isFreeTier = CURRENT_PLAN === "free";
  const invoices = isFreeTier ? [] : SEED_INVOICES;

  return (
    <div className="space-y-5">
      <div className="dashboard-toolbar p-3 sm:p-5 space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-lg font-semibold sm:text-2xl">Billing</h1>
          <button type="button" onClick={() => setShowEducation(true)} className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-full bg-muted/20 text-muted hover:bg-brand/20 hover:text-brand transition-colors text-xs font-bold" aria-label="Learn more">i</button>
        </div>
        <p className="text-xs text-muted">Your plan, payment method, and invoice history.</p>
      </div>

      {success && (
        <div className="rounded-lg border border-emerald-500/50 bg-emerald-500/10 p-5 text-center">
          <div className="text-2xl mb-2">🎉</div>
          <div className="text-lg font-bold text-emerald-400">Welcome to PrimeOS!</div>
          <p className="text-xs text-muted mt-1">Your founding operator rate is locked forever. Let&apos;s make money.</p>
        </div>
      )}

      {canceled && (
        <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 p-5 text-center">
          <div className="text-sm text-amber-400">Checkout canceled. No charge. Come back when you&apos;re ready.</div>
        </div>
      )}

      {/* 1. Current plan */}
      <section className="rounded-xl border border-border bg-black/20 p-4">
        <div className="text-[10px] uppercase text-muted tracking-wider mb-2">Current plan</div>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <div className={cn("text-lg font-bold", isFreeTier ? "text-white" : "text-brand")}>
              {isFreeTier ? FREE_TIER_LABEL : OPERATOR_PLAN_LABEL}
            </div>
            <p className="text-xs text-muted mt-0.5">
              {isFreeTier
                ? "Limited access via FoodTec. Upgrade for full PrimeOS: KPIs, brief, P&L, recipes, invoices, schedule, and more."
                : "$199/mo per location. Full access. Founding rate locked."}
            </p>
          </div>
          {isFreeTier && (
            <span className="text-[10px] uppercase px-2 py-1 rounded border border-amber-500/40 text-amber-400 bg-amber-500/10">Free</span>
          )}
        </div>
      </section>

      {/* 2. Upgrade CTA (when on free tier) — what they get with upgrade */}
      {isFreeTier && (
        <section className="rounded-2xl border border-brand/30 bg-gradient-to-b from-brand/5 to-transparent p-4 sm:p-6 space-y-4">
          <div className="text-center">
            <div className="text-[10px] uppercase tracking-widest text-brand/70 mb-1">Upgrade to Operator Plan</div>
            <div className="text-2xl sm:text-3xl font-black text-white">$199<span className="text-sm font-medium text-muted">/mo per location</span></div>
            <p className="text-xs text-muted mt-1">Founding rate locked forever. 90-day money-back guarantee.</p>
          </div>

          <div className="space-y-2">
            <div className="text-[10px] uppercase text-muted tracking-wider">What you get:</div>
            <ul className="space-y-1.5 text-xs text-white/90">
              <li className="flex items-start gap-2"><span className="text-emerald-400 shrink-0">✓</span> Daily KPIs, AI Morning Brief, GP P&L</li>
              <li className="flex items-start gap-2"><span className="text-emerald-400 shrink-0">✓</span> Recipe cards, invoice scanner, inventory</li>
              <li className="flex items-start gap-2"><span className="text-emerald-400 shrink-0">✓</span> Schedule, tasks, team chat, DoorDash view</li>
              <li className="flex items-start gap-2"><span className="text-emerald-400 shrink-0">✓</span> Education on every metric, direct onboarding</li>
            </ul>
          </div>

          <div className="flex items-center justify-center gap-3">
            <button type="button" onClick={() => setLocations(Math.max(1, locations - 1))} className="min-h-[44px] min-w-[44px] rounded-lg border border-border/50 bg-black/30 text-muted hover:text-white text-lg font-bold flex items-center justify-center" aria-label="Fewer locations">−</button>
            <span className="text-sm text-muted">{locations} location{locations > 1 ? "s" : ""} × $199</span>
            <button type="button" onClick={() => setLocations(Math.min(10, locations + 1))} className="min-h-[44px] min-w-[44px] rounded-lg border border-border/50 bg-black/30 text-muted hover:text-white text-lg font-bold flex items-center justify-center" aria-label="More locations">+</button>
          </div>

          <button
            type="button"
            onClick={handleCheckout}
            disabled={loading || setupLoading}
            className={cn(
              "w-full min-h-[44px] rounded-xl py-3 text-center text-base font-bold transition-all",
              loading || setupLoading ? "bg-muted/20 text-muted cursor-wait" : "bg-brand text-white hover:bg-brand/90"
            )}
          >
            {loading ? "Redirecting to checkout..." : setupLoading ? "Loading..." : priceId ? `Upgrade — $${monthlyTotal}/mo` : "Upgrade — Contact sales"}
          </button>
          {checkoutError && <p className="text-xs text-red-400 text-center">{checkoutError}</p>}
          {setupError && !setupLoading && priceId === null && (
            <p className="text-[10px] text-muted text-center">Stripe not configured in this environment. Upgrade flow is available when keys are set.</p>
          )}
        </section>
      )}

      {/* 3. Payment method */}
      <section className="rounded-xl border border-border bg-black/20 p-4">
        <div className="text-[10px] uppercase text-muted tracking-wider mb-2">Payment method</div>
        {isFreeTier ? (
          <p className="text-sm text-muted">No payment method on file. Add a payment method when you upgrade.</p>
        ) : (
          <div className="flex items-center justify-between flex-wrap gap-2">
            <p className="text-sm text-white/90">Card on file (Stripe)</p>
            <a href="#" className="text-xs text-brand hover:underline">Manage in Stripe portal</a>
          </div>
        )}
      </section>

      {/* 4. Invoice history */}
      <section className="rounded-xl border border-border bg-black/20 p-4">
        <div className="text-[10px] uppercase text-muted tracking-wider mb-3">Invoice history</div>
        {invoices.length === 0 ? (
          <p className="text-sm text-muted">No invoices yet. Invoices appear here after you subscribe.</p>
        ) : (
          <ul className="space-y-2">
            {invoices.map((inv) => (
              <li key={inv.id} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                <div>
                  <span className="text-sm text-white">{inv.description}</span>
                  <span className="text-[10px] text-muted ml-2">{inv.date}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium tabular-nums">${inv.amount}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">{inv.status}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Education modal (inline) */}
      {showEducation && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0 }} onClick={() => setShowEducation(false)}>
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          <div className="relative w-full max-w-md mx-auto rounded-2xl border border-border bg-[#0d0f13] p-4 sm:p-5 shadow-2xl overflow-y-auto max-h-[85vh] min-w-0" onClick={(e) => e.stopPropagation()}>
            <button type="button" onClick={() => setShowEducation(false)} className="absolute top-3 right-3 min-h-[44px] min-w-[44px] flex items-center justify-center text-muted hover:text-white text-lg -mr-2" aria-label="Close">✕</button>
            <h3 className="text-base font-semibold text-brand mb-1">What&apos;s included & ROI</h3>
            <p className="text-xs text-muted mb-4">PrimeOS replaces spreadsheets and multiple tools.</p>
            <div className="space-y-3 text-sm">
              <div>
                <h4 className="font-medium text-white mb-1">What&apos;s included</h4>
                <p className="text-muted text-xs leading-relaxed">Daily KPI entry, weekly cockpit, monthly P&L, GP P&L, morning brief (AI), sales reports, recipes & food cost, invoices, inventory, people, marketing, parties, schedule, tasks, chat, billing, DoorDash view, merch. One system. One login.</p>
              </div>
              <div>
                <h4 className="font-medium text-white mb-1">ROI</h4>
                <p className="text-muted text-xs leading-relaxed">Founding operator pricing is locked. If you save Margin Edge alone you&apos;re ahead in month one. The 90-day system is built so you see results in the first month.</p>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

export default function BillingPage() {
  return (
    <Suspense fallback={<div className="space-y-5 p-5"><div className="h-8 w-48 bg-muted/20 rounded animate-pulse" /></div>}>
      <BillingContent />
    </Suspense>
  );
}
