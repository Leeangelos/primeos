"use client";

import { Sparkles, Check } from "lucide-react";
import { useTier } from "@/src/lib/tier-context";
import { getTierLabel } from "@/src/lib/tier-config";

function FeatureRow({ text }: { text: string }) {
  return (
    <li className="flex items-start gap-2">
      <Check className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" aria-hidden />
      <span className="text-sm text-slate-300">{text}</span>
    </li>
  );
}

export default function BillingPage() {
  const { currentTier, setCurrentTier } = useTier();
  return (
    <div className="space-y-4 pb-28">
      <div className="mb-2">
        <h1 className="text-lg font-semibold sm:text-2xl text-white">Choose Your Plan</h1>
        <p className="text-sm text-slate-400 mt-1">Every tier pays for itself in the first week.</p>
      </div>

      {/* Trial banner — demo: always show */}
      <div className="bg-blue-950/30 rounded-xl border border-blue-800/50 p-4 mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-4 h-4 text-blue-400" aria-hidden />
          <span className="text-sm font-semibold text-blue-400">30-Day Free Trial Active</span>
        </div>
        <p className="text-sm text-slate-300">You have full access to everything. After your trial, choose the plan that fits.</p>
        <p className="text-xs text-slate-500 mt-1">Trial ends March 24, 2026</p>
      </div>

      {/* Tier 1 — Free */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-5 mb-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="text-lg font-bold text-white">Free</h3>
            <p className="text-xs text-slate-400">After 30-day trial</p>
          </div>
          <div className="text-right">
            <span className="text-2xl font-bold text-white">$0</span>
            <span className="text-xs text-slate-500">/mo</span>
          </div>
        </div>
        <ul className="space-y-2 mb-4">
          <FeatureRow text="Daily KPIs + Grading" />
          <FeatureRow text="Weekly Cockpit" />
          <FeatureRow text="Training Guide" />
          <FeatureRow text="Education previews (upgrade for full playbooks)" />
        </ul>
        <button type="button" className="w-full py-3 rounded-xl bg-slate-700 text-slate-300 text-sm font-semibold">
          Current Plan After Trial
        </button>
      </div>

      {/* Tier 2 — Starter */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-5 mb-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="text-lg font-bold text-white">Starter</h3>
            <p className="text-xs text-slate-400">For operators getting serious</p>
          </div>
          <div className="text-right">
            <span className="text-2xl font-bold text-white">$79</span>
            <span className="text-xs text-slate-500">/mo</span>
          </div>
        </div>
        <ul className="space-y-2 mb-4">
          <FeatureRow text="Everything in Free" />
          <FeatureRow text="Morning Brief (AI)" />
          <FeatureRow text="Full playbooks on all metrics" />
          <FeatureRow text="GP P&L" />
          <FeatureRow text="Smart Schedule" />
        </ul>
        <button type="button" className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors">
          Upgrade to Starter
        </button>
      </div>

      {/* Tier 3 — Operator (Most Popular) */}
      <div className="bg-slate-800 rounded-xl border-2 border-blue-500 p-5 mb-4 relative">
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full">
          MOST POPULAR
        </div>
        <div className="flex justify-between items-start mb-3 mt-1">
          <div>
            <h3 className="text-lg font-bold text-white">Operator</h3>
            <p className="text-xs text-slate-400">The full daily toolkit</p>
          </div>
          <div className="text-right">
            <span className="text-2xl font-bold text-white">$149</span>
            <span className="text-xs text-slate-500">/mo</span>
          </div>
        </div>
        <ul className="space-y-2 mb-4">
          <FeatureRow text="Everything in Starter" />
          <FeatureRow text="Recipes + Food Costing" />
          <FeatureRow text="Inventory Tracking" />
          <FeatureRow text="Invoice Scanner (AI OCR)" />
          <FeatureRow text="Sales Report + Comparisons" />
          <FeatureRow text="Actual P&L (CPA Upload)" />
          <FeatureRow text="Task Manager" />
          <FeatureRow text="Team Chat" />
        </ul>
        <button type="button" className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors">
          Upgrade to Operator
        </button>
      </div>

      {/* Tier 4 — Owner */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-5 mb-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="text-lg font-bold text-white">Owner</h3>
            <p className="text-xs text-slate-400">Everything unlocked</p>
          </div>
          <div className="text-right">
            <span className="text-2xl font-bold text-white">$249</span>
            <span className="text-xs text-slate-500">/mo</span>
          </div>
        </div>
        <ul className="space-y-2 mb-4">
          <FeatureRow text="Everything in Operator" />
          <FeatureRow text="People Economics + CAC/LTV" />
          <FeatureRow text="Marketing ROI + ROAS" />
          <FeatureRow text="DoorDash Economics" />
          <FeatureRow text="Party Order Management" />
          <FeatureRow text="Hiring Pipeline" />
          <FeatureRow text="Local Intelligence" />
          <FeatureRow text="Team Merch Store" />
          <FeatureRow text="Trusted Rolodex" />
        </ul>
        <button type="button" className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors">
          Upgrade to Owner
        </button>
      </div>

      {/* Tier 5 — Enterprise */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-5 mb-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="text-lg font-bold text-white">Enterprise</h3>
            <p className="text-xs text-slate-400">Multi-location groups + franchises</p>
          </div>
          <div className="text-right">
            <span className="text-lg font-bold text-slate-400">Custom</span>
          </div>
        </div>
        <ul className="space-y-2 mb-4">
          <FeatureRow text="Everything in Owner" />
          <FeatureRow text="Multi-location leaderboard" />
          <FeatureRow text="Intelligence Platform + benchmarking" />
          <FeatureRow text="Franchise toolkit" />
          <FeatureRow text="Dedicated onboarding + support" />
        </ul>
        <button type="button" className="w-full py-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-sm font-semibold transition-colors">
          Let&apos;s Talk
        </button>
      </div>

      {/* Why Operators Upgrade */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 mt-2">
        <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">Why Operators Upgrade</h4>
        <p className="text-sm text-slate-300 leading-relaxed mb-3">
          The average independent pizzeria wastes $18,000/year on food cost overruns they can&apos;t see. PrimeOS catches it in the first week. The Operator plan pays for itself before your second billing cycle.
        </p>
        <p className="text-sm text-slate-300 leading-relaxed">
          Cancel anytime. No contracts. No setup fees. If PrimeOS doesn&apos;t save you more than it costs, you shouldn&apos;t be paying for it.
        </p>
      </div>

      <div className="bg-slate-700/50 rounded-xl p-4 mt-6 mb-4">
        <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Demo: Switch Tier</p>
        <div className="flex flex-wrap gap-2 items-center">
          {["free", "starter", "operator", "owner", "enterprise"].map((tier) => (
            <button
              key={tier}
              type="button"
              onClick={() => setCurrentTier(tier)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                currentTier === tier ? "bg-blue-600 text-white" : "bg-slate-700 text-slate-400"
              }`}
            >
              {getTierLabel(tier)}
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              localStorage.removeItem("primeos-tos-accepted");
              localStorage.removeItem("primeos-tos-accepted-at");
              window.location.reload();
            }}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-700 text-slate-400"
          >
            Reset TOS
          </button>
          <button
            type="button"
            onClick={() => {
              localStorage.removeItem("primeos-consent-dismissed");
              window.location.reload();
            }}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-700 text-slate-400"
          >
            Reset Consent
          </button>
        </div>
      </div>
    </div>
  );
}
