"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

function BillingContent() {
  const searchParams = useSearchParams();
  const success = searchParams.get("success");
  const canceled = searchParams.get("canceled");

  const [priceId, setPriceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [setupLoading, setSetupLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [locations, setLocations] = useState(1);

  useEffect(() => {
    fetch("/api/billing/setup", { method: "POST" })
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) setPriceId(d.priceId);
        else setError(d.error);
        setSetupLoading(false);
      })
      .catch(() => {
        setError("Could not connect to billing. Check Stripe keys.");
        setSetupLoading(false);
      });
  }, []);

  async function handleCheckout() {
    if (!priceId) return;
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
      setError(res.error || "Checkout failed");
      setLoading(false);
    }
  }

  const monthlyTotal = locations * 199;
  const annualSavings = locations * 450; // Estimated tools replaced per location

  return (
    <div className="space-y-5">
      <div className="dashboard-toolbar p-4 sm:p-5 space-y-3">
        <h1 className="text-lg font-semibold sm:text-2xl">Billing</h1>
        <p className="text-xs text-muted">The 90-Day Pizza Profit System — Founding Operator Program</p>
      </div>

      {success && (
        <div className="rounded-lg border border-emerald-500/50 bg-emerald-500/10 p-5 text-center">
          <div className="text-2xl mb-2">🎉</div>
          <div className="text-lg font-bold text-emerald-400">Welcome to PrimeOS!</div>
          <p className="text-xs text-muted mt-1">Your founding operator rate is locked forever. Let's make money.</p>
        </div>
      )}

      {canceled && (
        <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 p-5 text-center">
          <div className="text-sm text-amber-400">Checkout canceled. No charge. Come back when you're ready.</div>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-4 text-center text-xs text-red-400">{error}</div>
      )}

      {/* Offer Card */}
      <div className="rounded-2xl border border-brand/30 bg-gradient-to-b from-brand/5 to-transparent p-6 space-y-5">
        <div className="text-center">
          <div className="text-[10px] uppercase tracking-widest text-brand/70 mb-2">Founding Operator Program</div>
          <div className="text-4xl font-black text-white">$199<span className="text-lg font-medium text-muted">/mo per location</span></div>
          <div className="text-xs text-muted mt-1">First 25 operators only — rate locked forever</div>
        </div>

        {/* What's included */}
        <div className="space-y-2">
          <div className="text-[10px] uppercase text-muted tracking-wider">Everything included:</div>
          {[
            "Daily KPIs + PRIME scoring (auto-graded)",
            "AI Morning Brief delivered by 7 AM",
            "Live P&L projection with What-If scenarios",
            "Recipe cards with live food cost calculation",
            "AI invoice scanner (replaces $330/mo Margin Edge)",
            "Inventory counts with walk-in-to-wallet tracking",
            "Employee economics (CAC, LTV, churn tracking)",
            "Marketing ROI (prove every ad dollar)",
            "Party automation (web form → kitchen → schedule)",
            "Smart scheduling with labor projection",
            "Sales comparison (This Week vs Last Week vs Last Year)",
            "Vendor rolodex with one-tap calling",
            "Education engine on every metric",
            "Direct access to Angelo for onboarding",
            "Your input shapes the roadmap",
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-2 text-xs">
              <span className="text-emerald-400 mt-0.5">✓</span>
              <span className="text-white/80">{item}</span>
            </div>
          ))}
        </div>

        {/* Guarantee */}
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4 text-center">
          <div className="text-sm font-bold text-emerald-400">90-Day Money-Back Guarantee</div>
          <p className="text-xs text-muted mt-1">Save 2x your subscription in identified waste, labor savings, or recovered revenue — or full refund, no questions asked.</p>
        </div>

        {/* Tools replaced */}
        <div className="rounded-lg border border-border/50 p-4">
          <div className="text-[10px] uppercase text-muted tracking-wider mb-2">Tools PrimeOS Replaces</div>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between"><span className="text-white/70">Margin Edge (invoices + inventory)</span><span className="text-red-400 line-through">$330/mo</span></div>
            <div className="flex justify-between"><span className="text-white/70">7shifts (scheduling)</span><span className="text-red-400 line-through">$70/mo</span></div>
            <div className="flex justify-between"><span className="text-white/70">Misc tools (spreadsheets, apps)</span><span className="text-red-400 line-through">$50/mo</span></div>
            <div className="flex justify-between border-t border-border/30 pt-1.5 mt-1.5"><span className="text-white font-bold">You save per location</span><span className="text-emerald-400 font-bold">$450/mo</span></div>
            <div className="flex justify-between"><span className="text-white font-bold">PrimeOS costs</span><span className="text-brand font-bold">$199/mo</span></div>
            <div className="flex justify-between"><span className="text-white font-bold">Net savings per location</span><span className="text-emerald-400 font-bold">$251/mo</span></div>
          </div>
        </div>

        {/* Location selector */}
        <div className="text-center space-y-3">
          <div className="text-[10px] uppercase text-muted tracking-wider">How many locations?</div>
          <div className="flex items-center justify-center gap-3">
            <button type="button" onClick={() => setLocations(Math.max(1, locations - 1))} className="h-10 w-10 rounded-lg border border-border/50 bg-black/30 text-muted hover:text-white text-lg font-bold flex items-center justify-center">−</button>
            <div className="text-3xl font-black text-brand w-12 text-center tabular-nums">{locations}</div>
            <button type="button" onClick={() => setLocations(Math.min(10, locations + 1))} className="h-10 w-10 rounded-lg border border-border/50 bg-black/30 text-muted hover:text-white text-lg font-bold flex items-center justify-center">+</button>
          </div>
          <div className="text-sm text-muted">{locations} location{locations > 1 ? "s" : ""} × $199/mo = <span className="text-white font-bold">${monthlyTotal}/mo</span></div>
          <div className="text-xs text-emerald-400">You save ~${annualSavings}/mo in replaced tools</div>
        </div>

        {/* Checkout button */}
        <button
          type="button"
          onClick={handleCheckout}
          disabled={loading || setupLoading || !priceId}
          className={cn(
            "w-full rounded-xl py-4 text-center text-lg font-bold transition-all",
            loading || setupLoading
              ? "bg-muted/20 text-muted cursor-wait"
              : "bg-brand text-white hover:bg-brand/90 shadow-[0_0_30px_rgba(249,115,22,0.3)]"
          )}
        >
          {loading ? "Redirecting to checkout..." : setupLoading ? "Setting up..." : `Start 90-Day Profit System — $${monthlyTotal}/mo`}
        </button>

        <p className="text-[10px] text-muted text-center">Cancel anytime. 90-day guarantee. Founding rate locked forever.</p>
      </div>
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
