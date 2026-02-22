"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useCallback, useEffect } from "react";
import {
  LayoutDashboard,
  ClipboardList,
  Sparkles,
  TrendingUp,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";

const MAIN_TABS = [
  { href: "/", label: "Home", Icon: LayoutDashboard },
  { href: "/daily", label: "Daily", Icon: ClipboardList },
  { href: "/brief", label: "Brief", Icon: Sparkles },
  { href: "/sales", label: "Sales", Icon: TrendingUp },
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
  const [moreOpen, setMoreOpen] = useState(false);

  const closeMore = useCallback(() => setMoreOpen(false), []);

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
        <div className="flex justify-around items-center h-16 min-h-[64px]">
          {MAIN_TABS.map(({ href, label, Icon }) => {
            const isActive =
              href === "/"
                ? pathname === "/"
                : pathname === href || pathname.startsWith(href + "/");
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
                <span className="text-[10px] font-medium whitespace-nowrap leading-tight">
                  {label}
                </span>
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
    </>
  );
}
