"use client";

import Link from "next/link";
import { Lock, Check } from "lucide-react";
import { TIERS, getTierLabel } from "@/src/lib/tier-config";

function getTierFeatureHighlights(tierKey: string): string[] {
  switch (tierKey) {
    case "starter":
      return [
        "AI Morning Brief",
        "Full playbooks on every metric",
        "GP P&L",
        "Smart Schedule",
      ];
    case "operator":
      return [
        "Recipe costing + food cost tracking",
        "Invoice Scanner with AI OCR",
        "Actual P&L with CPA upload",
        "Sales reports + comparisons",
      ];
    case "owner":
      return [
        "People Economics + CAC/LTV tracking",
        "Marketing ROI + ROAS",
        "DoorDash Economics",
        "Hiring Pipeline + Party Orders",
      ];
    case "enterprise":
      return [
        "Multi-location leaderboard",
        "Intelligence Platform",
        "Franchise toolkit",
        "Dedicated support",
      ];
    default:
      return [];
  }
}

type UpgradeModalProps = {
  isOpen: boolean;
  onClose: () => void;
  requiredTier: string;
  pageName: string;
};

export function UpgradeModal({ isOpen, onClose, requiredTier, pageName }: UpgradeModalProps) {
  if (!isOpen) return null;

  const tier = TIERS[requiredTier as keyof typeof TIERS];
  const priceStr =
    tier && tier.price != null ? `$${tier.price}/mo` : "Custom pricing";
  const highlights = getTierFeatureHighlights(requiredTier);

  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 z-50"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className="fixed bottom-0 left-0 right-0 z-50 bg-slate-800 rounded-t-2xl border-t border-slate-700 p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] animate-slide-up"
        role="dialog"
        aria-labelledby="upgrade-modal-title"
      >
        <div className="w-10 h-1 bg-slate-600 rounded-full mx-auto mb-5" aria-hidden />
        <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center mx-auto mb-4">
          <Lock className="w-6 h-6 text-slate-400" aria-hidden />
        </div>
        <h3 id="upgrade-modal-title" className="text-lg font-bold text-white text-center mb-2">
          {pageName} requires {getTierLabel(requiredTier)}
        </h3>
        <p className="text-sm text-slate-400 text-center mb-5">
          Upgrade to the {getTierLabel(requiredTier)} plan ({priceStr}) to unlock this feature.
        </p>
        <div className="bg-slate-700/50 rounded-xl p-4 mb-5">
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">
            {getTierLabel(requiredTier)} includes:
          </p>
          <div className="space-y-1.5">
            {highlights.map((feature, i) => (
              <div key={i} className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" aria-hidden />
                <span className="text-sm text-slate-300">{feature}</span>
              </div>
            ))}
          </div>
        </div>
        <Link
          href="/billing"
          onClick={onClose}
          className="block w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold text-center transition-colors"
        >
          View Plans
        </Link>
        <button
          type="button"
          onClick={onClose}
          className="block w-full py-3 text-slate-500 text-sm text-center mt-2"
        >
          Maybe Later
        </button>
      </div>
    </>
  );
}
