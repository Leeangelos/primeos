"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useCallback, useEffect } from "react";
import {
  LayoutDashboard,
  ClipboardList,
  Sparkles,
  GraduationCap,
  Menu,
  Lock,
  BarChart3,
  Calendar,
  Clock,
  CheckSquare,
  MessageCircle,
  DollarSign,
  FileSpreadsheet,
  TrendingUp,
  Building2,
  Truck,
  CreditCard,
  BookOpen,
  Package,
  FileText,
  UtensilsCrossed,
  Scale,
  Users,
  Target,
  Gift,
  ShoppingBag,
  BookUser,
  Home,
  LucideIcon,
  Settings,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase";
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

type NavItem = {
  href: string;
  icon: LucideIcon;
  label: string;
  desc: string;
  color: string;
};

function NavSection({
  title,
  items,
  pathname,
  currentTier,
  openUpgradeModal,
  setMoreOpen,
}: {
  title: string;
  items: NavItem[];
  pathname: string;
  currentTier: string;
  openUpgradeModal: (requiredTier: string, pageName: string) => void;
  setMoreOpen: (open: boolean) => void;
}) {
  const tierOrder = ["free", "starter", "operator", "owner", "enterprise"];
  const userIndex = tierOrder.indexOf(currentTier);

  return (
    <div>
      <h3 className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2">{title}</h3>
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden divide-y divide-slate-700/50">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          const requiredIndex = tierOrder.indexOf(getRequiredTier(item.href));
          const locked = userIndex < requiredIndex;

          if (locked) {
            return (
              <button
                key={item.href}
                type="button"
                onClick={() => openUpgradeModal(getRequiredTier(item.href), item.label)}
                className="w-full flex items-center gap-3 px-4 py-3 active:bg-slate-700/50"
              >
                <div className="w-8 h-8 rounded-lg bg-slate-700/50 flex items-center justify-center">
                  <Icon className="w-4 h-4 text-slate-600" />
                </div>
                <div className="flex-1 text-left">
                  <div className="text-sm text-slate-500">{item.label}</div>
                  <div className="text-xs text-slate-600">{item.desc}</div>
                </div>
                <Lock className="w-3.5 h-3.5 text-slate-600" />
              </button>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMoreOpen(false)}
              className={cn(
                "flex items-center gap-3 px-4 py-3 active:bg-slate-700/50",
                isActive ? "bg-orange-950/20" : ""
              )}
            >
              <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center border border-slate-700">
                <Icon className={cn("w-4 h-4", item.color)} />
              </div>
              <div className="flex-1">
                <div className="text-sm text-white">{item.label}</div>
                <div className="text-xs text-slate-500">{item.desc}</div>
              </div>
              {isActive && <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { currentTier } = useTier();
  const [moreOpen, setMoreOpen] = useState(false);
  const [upgradeModal, setUpgradeModal] = useState<{ requiredTier: string; pageName: string } | null>(null);

  const closeMore = useCallback(() => setMoreOpen(false), []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

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
        className="bottom-nav fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-sm border-t border-slate-700 pb-[env(safe-area-inset-bottom)]"
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
                className="flex flex-col items-center justify-center gap-0.5 min-w-[44px] min-h-[44px] flex-1 max-w-[80px] transition-colors"
                aria-current={isActive ? "page" : undefined}
              >
                {isActive ? (
                  <div className="flex flex-col items-center gap-0.5 relative">
                    <div className="relative">
                      <Icon className="w-5 h-5 text-[#E65100]" aria-hidden />
                      <div className="absolute -inset-1 bg-orange-500/20 rounded-full blur-sm -z-10" aria-hidden />
                    </div>
                    <span className="text-[10px] text-[#E65100] font-medium whitespace-nowrap leading-tight">{label}</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-0.5">
                    <Icon className="w-5 h-5 shrink-0 text-slate-500" aria-hidden />
                    <span className="text-[10px] text-slate-500 font-medium whitespace-nowrap leading-tight">{label}</span>
                  </div>
                )}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className="flex flex-col items-center justify-center gap-0.5 min-w-[44px] min-h-[44px] flex-1 max-w-[80px] transition-colors"
            aria-expanded={moreOpen}
            aria-haspopup="dialog"
            aria-label="More pages"
          >
            {moreOpen ? (
              <div className="flex flex-col items-center gap-0.5 relative">
                <div className="relative">
                  <Menu className="w-5 h-5 text-[#E65100]" aria-hidden />
                  <div className="absolute -inset-1 bg-orange-500/20 rounded-full blur-sm -z-10" aria-hidden />
                </div>
                <span className="text-[10px] text-[#E65100] font-medium whitespace-nowrap leading-tight">More</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-0.5">
                <Menu className="w-5 h-5 shrink-0 text-slate-500" aria-hidden />
                <span className="text-[10px] text-slate-500 font-medium whitespace-nowrap leading-tight">More</span>
              </div>
            )}
          </button>
        </div>
      </nav>

      {/* More: full-screen slide-up drawer */}
      {moreOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/60 z-50"
            onClick={() => setMoreOpen(false)}
            aria-hidden="true"
          />
          <div className="fixed inset-x-0 bottom-0 z-50 bg-slate-900 rounded-t-2xl overflow-y-auto animate-slide-up" style={{ top: "calc(3.5rem + env(safe-area-inset-top, 0px))" }}>
            {/* Handle bar */}
            <div className="sticky top-0 bg-slate-900 pt-3 pb-2 px-4 border-b border-slate-800 z-10">
              <div className="w-10 h-1 bg-slate-700 rounded-full mx-auto mb-3" />
              <h2 className="text-lg font-bold text-white">All Tools</h2>
            </div>

            <div className="px-4 py-4 space-y-6 pb-32">
              <Link href="/" onClick={() => setMoreOpen(false)} className="flex items-center gap-3 px-4 py-3 mb-2 bg-slate-800 rounded-xl border border-slate-700 active:bg-slate-700/50">
                <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center border border-slate-700">
                  <Home className="w-4 h-4 text-blue-400" />
                </div>
                <div className="flex-1">
                  <div className="text-sm text-white font-medium">Home Dashboard</div>
                  <div className="text-xs text-slate-500">Back to overview</div>
                </div>
              </Link>
              <NavSection
                title="Daily Operations"
                items={[
                  { href: "/daily", icon: ClipboardList, label: "Daily KPIs", desc: "Enter today's numbers", color: "text-blue-400" },
                  { href: "/brief", icon: Sparkles, label: "Morning Brief", desc: "AI summary of yesterday", color: "text-purple-400" },
                  { href: "/weekly", icon: BarChart3, label: "Weekly Cockpit", desc: "Week-over-week trends", color: "text-emerald-400" },
                  { href: "/monthly", icon: Calendar, label: "Monthly Summary", desc: "Monthly P&L rollup", color: "text-amber-400" },
                  { href: "/schedule", icon: Clock, label: "Smart Schedule", desc: "Shifts and labor planning", color: "text-cyan-400" },
                  { href: "/tasks", icon: CheckSquare, label: "Manager Tasks", desc: "Assign and track team tasks", color: "text-orange-400" },
                  { href: "/chat", icon: MessageCircle, label: "Team Chat", desc: "Internal messaging", color: "text-pink-400" },
                ]}
                pathname={pathname}
                currentTier={currentTier}
                openUpgradeModal={openUpgrade}
                setMoreOpen={setMoreOpen}
              />

              <NavSection
                title="Financial"
                items={[
                  { href: "/pnl", icon: DollarSign, label: "GP P&L", desc: "Gross profit tracking", color: "text-emerald-400" },
                  { href: "/actual-pnl", icon: FileSpreadsheet, label: "Actual P&L", desc: "CPA upload — real net profit", color: "text-green-400" },
                  { href: "/gl-upload", icon: FileSpreadsheet, label: "GL Upload", desc: "General Ledger import", color: "text-cyan-400" },
                  { href: "/vendor-tracker", icon: Building2, label: "Vendor Tracker", desc: "Costs, trends, and alerts", color: "text-rose-400" },
                  { href: "/sales", icon: TrendingUp, label: "Sales Report", desc: "Revenue comparisons", color: "text-blue-400" },
                  { href: "/doordash", icon: Truck, label: "Delivery Economics", desc: "Platform costs and comparison", color: "text-red-400" },
                  { href: "/billing", icon: CreditCard, label: "Billing", desc: "Plans and payments", color: "text-slate-400" },
                ]}
                pathname={pathname}
                currentTier={currentTier}
                openUpgradeModal={openUpgrade}
                setMoreOpen={setMoreOpen}
              />

              <NavSection
                title="Kitchen & Inventory"
                items={[
                  { href: "/recipes", icon: BookOpen, label: "Recipes", desc: "Food costing and portions", color: "text-amber-400" },
                  { href: "/inventory", icon: Package, label: "Inventory", desc: "Stock levels and par", color: "text-yellow-400" },
                  { href: "/invoices", icon: FileText, label: "Invoice Scanner", desc: "AI-powered OCR scanning", color: "text-violet-400" },
                  { href: "/menu-intelligence", icon: UtensilsCrossed, label: "Menu Intelligence", desc: "Prices, comparison, gap analysis", color: "text-teal-400" },
                  { href: "/food-cost-analysis", icon: Scale, label: "Food Cost Analysis", desc: "Theoretical vs actual variance", color: "text-pink-400" },
                ]}
                pathname={pathname}
                currentTier={currentTier}
                openUpgradeModal={openUpgrade}
                setMoreOpen={setMoreOpen}
              />

              <NavSection
                title="People & Marketing"
                items={[
                  { href: "/people", icon: Users, label: "People Economics", desc: "CAC, LTV, churn tracking", color: "text-cyan-400" },
                  { href: "/marketing", icon: Target, label: "Ad Accountability", desc: "ROAS and campaign tracking", color: "text-rose-400" },
                  { href: "/competitor-intel", icon: Target, label: "Competitor Intel", desc: "Market position and alerts", color: "text-violet-400" },
                  { href: "/parties", icon: Gift, label: "Catering & Large Orders", desc: "Catering and event orders", color: "text-fuchsia-400" },
                  { href: "/merch", icon: ShoppingBag, label: "Team Merch", desc: "Staff gear and ordering", color: "text-orange-400" },
                ]}
                pathname={pathname}
                currentTier={currentTier}
                openUpgradeModal={openUpgrade}
                setMoreOpen={setMoreOpen}
              />

              <NavSection
                title="Resources"
                items={[
                  { href: "/vendor-settings", icon: Settings, label: "Vendor Settings", desc: "Manage vendors and platforms", color: "text-slate-400" },
                  { href: "/rolodex", icon: BookUser, label: "Trusted Rolodex", desc: "Vendors, repairs, contacts", color: "text-teal-400" },
                  { href: "/training", icon: GraduationCap, label: "Training Guide", desc: "Learn every metric", color: "text-indigo-400" },
                ]}
                pathname={pathname}
                currentTier={currentTier}
                openUpgradeModal={openUpgrade}
                setMoreOpen={setMoreOpen}
              />

              <div className="pt-4 border-t border-slate-800 mt-2">
                <div className="flex justify-center gap-3">
                  <Link href="/terms" onClick={() => setMoreOpen(false)} className="text-xs text-slate-600 hover:text-slate-400">Terms of Service</Link>
                  <span className="text-xs text-slate-700">·</span>
                  <Link href="/privacy" onClick={() => setMoreOpen(false)} className="text-xs text-slate-600 hover:text-slate-400">Privacy Policy</Link>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 w-full px-4 py-3 mt-4 rounded-xl text-red-400 hover:bg-red-600/10 transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="text-sm font-medium">Log Out</span>
                </button>
              </div>
            </div>
          </div>
        </>
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
