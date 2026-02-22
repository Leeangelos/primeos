"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useCallback, useEffect } from "react";
import {
  LayoutDashboard,
  ClipboardList,
  Sparkles,
  GraduationCap,
  Menu,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getRequiredTier } from "@/src/lib/tier-config";
import { useTier } from "@/src/lib/tier-context";
import { UpgradeModal } from "@/src/components/layout/UpgradeModal";

function hasAccess(route: string, userTier: string): boolean {
  const tierOrder = ["free", "starter", "operator", "owner", "enterprise"];
  const userTierIndex = tierOrder.indexOf(userTier);
  const requiredTierIndex = tierOrder.indexOf(getRequiredTier(route));
  return userTierIndex >= requiredTierIndex;
}

const MAIN_TABS = [
  { href: "/", label: "Home", Icon: LayoutDashboard },
  { href: "/daily", label: "Daily", Icon: ClipboardList },
  { href: "/brief", label: "Brief", Icon: Sparkles },
  { href: "/training", label: "Guide", Icon: GraduationCap },
] as const;

const MORE_SECTIONS: { title: string; links: { href: string; label: string }[] }[] = [
  {
    title: "Daily Operations",
    links: [
      { href: "/daily", label: "Daily KPI" },
      { href: "/weekly", label: "Weekly Cockpit" },
      { href: "/monthly", label: "Monthly P&L" },
      { href: "/brief", label: "Morning Brief" },
    ],
  },
  {
    title: "Financial",
    links: [
      { href: "/pnl", label: "GP P&L" },
      { href: "/actual-pnl", label: "Actual P&L" },
      { href: "/sales", label: "Sales Report" },
      { href: "/doordash", label: "DoorDash Economics" },
      { href: "/billing", label: "Billing" },
    ],
  },
  {
    title: "Operations",
    links: [
      { href: "/recipes", label: "Recipes" },
      { href: "/inventory", label: "Inventory" },
      { href: "/invoices", label: "Invoice Scanner" },
      { href: "/schedule", label: "Smart Schedule" },
    ],
  },
  {
    title: "People",
    links: [
      { href: "/people", label: "People Economics" },
      { href: "/chat", label: "Team Chat" },
      { href: "/tasks", label: "Task Manager" },
      { href: "/merch", label: "Team Merch" },
    ],
  },
  {
    title: "Resources",
    links: [
      { href: "/rolodex", label: "Trusted Rolodex" },
      { href: "/marketing", label: "Ad Accountability" },
      { href: "/parties", label: "Party Orders" },
    ],
  },
];

export function BottomNav() {
  const pathname = usePathname();
  const { currentTier } = useTier();
  const [moreOpen, setMoreOpen] = useState(false);
  const [upgradeModal, setUpgradeModal] = useState<{ requiredTier: string; pageName: string } | null>(null);

  const closeMore = useCallback(() => setMoreOpen(false), []);

  const openUpgrade = useCallback((requiredTier: string, pageName: string) => {
    setUpgradeModal({ requiredTier, pageName });
  }, []);

  useEffect(() => {
    if (!moreOpen) return;
    const onEscape = (e: KeyboardEvent) => e.key === "Escape" && closeMore();
    document.addEventListener("keydown", onEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onEscape);
      document.body.style.overflow = "";
    };
  }, [moreOpen, closeMore]);

  return (
    <>
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-sm border-t border-slate-700 pb-[env(safe-area-inset-bottom)]"
        aria-label="Bottom navigation"
      >
        {currentTier === "owner" && (
          <Link
            href="/billing"
            className="block w-full bg-blue-950/80 backdrop-blur-sm border-t border-blue-900/50 px-4 py-1.5 text-center"
          >
            <span className="text-xs text-blue-400">30-day free trial · Full access · </span>
            <span className="text-xs text-blue-300 font-medium underline">Choose plan</span>
          </Link>
        )}
        <div className="flex justify-around items-center h-16 min-h-[64px]">
          {MAIN_TABS.map(({ href, label, Icon }) => {
            const isActive =
              href === "/"
                ? pathname === "/"
                : pathname === href || pathname.startsWith(href + "/");
            const canAccess = hasAccess(href, currentTier);
            const isBriefLocked = href === "/brief" && !canAccess;

            if (isBriefLocked) {
              return (
                <button
                  key={href}
                  type="button"
                  onClick={() => openUpgrade("starter", "Morning Brief")}
                  className={cn(
                    "flex flex-col items-center justify-center gap-0.5 min-w-[44px] min-h-[44px] flex-1 max-w-[80px] transition-colors relative",
                    "text-slate-500"
                  )}
                  aria-label={`${label} (upgrade required)`}
                >
                  <span className="relative inline-block">
                    <Icon className="w-5 h-5 shrink-0" aria-hidden />
                    <Lock className="absolute -bottom-0.5 -right-0.5 w-3 h-3 text-slate-500" aria-hidden />
                  </span>
                  <span className="text-[10px] font-medium whitespace-nowrap leading-tight">{label}</span>
                </button>
              );
            }

            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 min-w-[44px] min-h-[44px] flex-1 max-w-[80px] transition-colors",
                  isActive ? "text-blue-400" : "text-slate-500"
                )}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon className="w-5 h-5 shrink-0" aria-hidden />
                <span className="text-[10px] font-medium whitespace-nowrap leading-tight">{label}</span>
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className={cn(
              "flex flex-col items-center justify-center gap-0.5 min-w-[44px] min-h-[44px] flex-1 max-w-[80px] transition-colors",
              moreOpen ? "text-blue-400" : "text-slate-500"
            )}
            aria-expanded={moreOpen}
            aria-haspopup="dialog"
            aria-label="More pages"
          >
            <Menu className="w-5 h-5 shrink-0" aria-hidden />
            <span className="text-[10px] font-medium whitespace-nowrap leading-tight">
              More
            </span>
          </button>
        </div>
      </nav>

      {/* More: slide-up drawer */}
      {moreOpen && (
        <div
          className="fixed inset-0 z-[9998] flex flex-col justify-end"
          aria-modal="true"
          role="dialog"
          aria-label="More pages"
        >
          <div
            className="absolute inset-0 bg-black/50"
            onClick={closeMore}
            aria-hidden="true"
          />
          <div
            className="relative bg-slate-800 rounded-t-2xl max-h-[85vh] overflow-y-auto shadow-2xl border-t border-slate-700 pb-[env(safe-area-inset-bottom)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-slate-800 flex items-center justify-between px-4 py-3 border-b border-slate-700 z-10">
              <h2 className="text-lg font-bold text-white">More</h2>
              <button
                type="button"
                onClick={closeMore}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg text-slate-400 hover:text-white"
                aria-label="Close"
              >
                <span className="text-xl leading-none">×</span>
              </button>
            </div>
            <div className="p-4 space-y-6">
              {MORE_SECTIONS.map((section) => (
                <div key={section.title}>
                  <h3 className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
                    {section.title}
                  </h3>
                  <ul className="space-y-0.5">
                    {section.links.map(({ href, label }) => {
                      const isActive =
                        pathname === href || pathname.startsWith(href + "/");
                      const required = getRequiredTier(href);
                      const canAccess = hasAccess(href, currentTier);

                      if (!canAccess) {
                        return (
                          <li key={href}>
                            <button
                              type="button"
                              onClick={() => {
                                openUpgrade(required, label);
                              }}
                              className={cn(
                                "flex items-center min-h-[44px] px-3 py-2 rounded-lg text-sm font-medium transition-colors w-full text-left",
                                "text-slate-500 hover:bg-slate-700"
                              )}
                            >
                              <Lock className="w-3.5 h-3.5 text-slate-500 flex-shrink-0 mr-2" aria-hidden />
                              {label}
                            </button>
                          </li>
                        );
                      }

                      return (
                        <li key={href}>
                          <Link
                            href={href}
                            onClick={closeMore}
                            className={cn(
                              "flex items-center min-h-[44px] px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                              isActive
                                ? "bg-blue-500/10 text-blue-400"
                                : "text-slate-200 hover:bg-slate-700"
                            )}
                          >
                            {label}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <UpgradeModal
        isOpen={upgradeModal != null}
        onClose={() => setUpgradeModal(null)}
        requiredTier={upgradeModal?.requiredTier ?? "starter"}
        pageName={upgradeModal?.pageName ?? ""}
      />
    </>
  );
}
