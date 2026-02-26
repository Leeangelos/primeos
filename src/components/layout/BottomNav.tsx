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
  Heart,
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
import { UpgradeModal } from "@/src/components/layout/UpgradeModal";

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
  setMoreOpen,
}: {
  title: string;
  items: NavItem[];
  pathname: string;
  setMoreOpen: (open: boolean) => void;
}) {
  return (
    <div>
      <h3 className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2">{title}</h3>
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden divide-y divide-slate-700/50">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

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

const NAV_BAR_HEIGHT = "4rem"; /* h-16 */

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [moreOpen, setMoreOpen] = useState(false);
  const [dragStart, setDragStart] = useState<number | null>(null);
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
      {/* 1. Backdrop — only when drawer open */}
      {moreOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40"
          onClick={() => setMoreOpen(false)}
          aria-hidden
        />
      )}

      {/* 2. More drawer — slides up ABOVE the nav bar; z-[61] so above nav when open; fully hidden when closed */}
      <div
        className={cn(
          "fixed left-0 right-0 z-[61] bg-slate-900 border-t border-slate-700 rounded-t-2xl transition-[transform,opacity] duration-300 ease-out",
          moreOpen ? "translate-y-0 opacity-100 visible" : "translate-y-full pointer-events-none opacity-0 invisible"
        )}
        style={{
          bottom: "calc(4rem + env(safe-area-inset-bottom, 0px))",
          maxHeight: "80vh",
          overflowY: "auto",
        }}
        aria-hidden={!moreOpen}
      >
        {/* Drag handle: pull down to close */}
        <div
          className="flex justify-center pt-3 pb-1 bg-slate-900 sticky top-0 z-10 border-b border-slate-800 touch-none"
          onTouchStart={(e) => setDragStart(e.touches[0].clientY)}
          onTouchMove={(e) => {
            if (dragStart !== null) {
              const diff = e.touches[0].clientY - dragStart;
              if (diff > 50) {
                setMoreOpen(false);
                setDragStart(null);
              }
            }
          }}
          onTouchEnd={() => setDragStart(null)}
        >
          <div className="w-10 h-1 rounded-full bg-slate-600" />
        </div>
        <div className="px-4 pt-2 pb-4">
          <h2 className="text-lg font-bold text-white mb-4">All Tools</h2>
        </div>
        <div className="px-4 py-2 space-y-6 pb-24" role="region" aria-label="All tools and links">
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
                  { href: "/weekly", icon: BarChart3, label: "Weekly Snapshot", desc: "Week-over-week trends", color: "text-emerald-400" },
                  { href: "/monthly", icon: Calendar, label: "Monthly Summary", desc: "Monthly P&L rollup", color: "text-amber-400" },
                  { href: "/schedule", icon: Clock, label: "Smart Schedule", desc: "Shifts and labor planning", color: "text-cyan-400" },
                  { href: "/tasks", icon: CheckSquare, label: "Manager Tasks", desc: "Assign and track team tasks", color: "text-orange-400" },
                  { href: "/chat", icon: MessageCircle, label: "Team Chat", desc: "Internal messaging", color: "text-pink-400" },
                ]}
                pathname={pathname}
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
                  { href: "/billing", icon: Heart, label: "Our Story", desc: "Why we built this", color: "text-[#E65100]" },
                ]}
                pathname={pathname}
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
                setMoreOpen={setMoreOpen}
              />

              <NavSection
                title="People & Marketing"
                items={[
                  { href: "/people", icon: Users, label: "People Economics", desc: "CAC, LTV, churn tracking", color: "text-cyan-400" },
                  { href: "/marketing", icon: Target, label: "Ad Accountability", desc: "ROAS and campaign tracking", color: "text-rose-400" },
                  { href: "/reputation", icon: MessageCircle, label: "Do We Suck?", desc: "Reviews and reputation", color: "text-pink-400" },
                  { href: "/competitor-intel", icon: Target, label: "Competitor Intel", desc: "Market position and alerts", color: "text-violet-400" },
                  { href: "/parties", icon: Gift, label: "Catering & Large Orders", desc: "Catering and event orders", color: "text-fuchsia-400" },
                  { href: "/merch", icon: ShoppingBag, label: "Team Merch", desc: "Staff gear and ordering", color: "text-orange-400" },
                ]}
                pathname={pathname}
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
                setMoreOpen={setMoreOpen}
              />

          <div className="pt-4 border-t border-slate-800 mt-2">
            <div className="flex justify-center gap-3">
              <Link href="/terms" onClick={() => setMoreOpen(false)} className="text-xs text-slate-600 hover:text-slate-400">Terms of Service</Link>
              <span className="text-xs text-slate-700">·</span>
              <Link href="/privacy" onClick={() => setMoreOpen(false)} className="text-xs text-slate-600 hover:text-slate-400">Privacy Policy</Link>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-3 mt-4 rounded-xl text-red-400 hover:bg-red-600/10 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="text-sm font-medium">Log Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Nav bar — ALWAYS RENDERED, LAST IN DOM; z-[60] above common z-50 overlays */}
      <nav
        className="bottom-nav fixed bottom-0 left-0 right-0 z-[60] bg-slate-900 border-t border-slate-800"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
        aria-label="Bottom navigation"
      >
        <div className="flex items-center justify-around h-16 px-2">
          {MAIN_TABS.map(({ href, label, Icon }) => {
            const isActive =
              href === "/"
                ? pathname === "/"
                : pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className="flex flex-col items-center justify-center gap-0.5 min-w-[44px] min-h-[44px] flex-1 max-w-[80px] transition-colors"
                aria-current={isActive ? "page" : undefined}
              >
                <Icon className={cn("w-5 h-5 shrink-0", isActive ? "text-[#E65100]" : "text-slate-500")} aria-hidden />
                <span className={cn("text-[10px] font-medium whitespace-nowrap leading-tight", isActive ? "text-[#E65100]" : "text-slate-500")}>
                  {label}
                </span>
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => setMoreOpen((prev) => !prev)}
            className="flex flex-col items-center justify-center gap-0.5 min-w-[44px] min-h-[44px] flex-1 max-w-[80px] transition-colors"
            aria-expanded={moreOpen}
            aria-haspopup="dialog"
            aria-label="More pages"
          >
            <Menu className={cn("w-5 h-5 shrink-0", moreOpen ? "text-[#E65100]" : "text-slate-500")} aria-hidden />
            <span className={cn("text-[10px] font-medium whitespace-nowrap leading-tight", moreOpen ? "text-[#E65100]" : "text-slate-500")}>
              More
            </span>
          </button>
        </div>
      </nav>

      <UpgradeModal
        isOpen={upgradeModal != null}
        onClose={() => setUpgradeModal(null)}
        requiredTier={upgradeModal?.requiredTier ?? "starter"}
        pageName={upgradeModal?.pageName ?? ""}
      />
    </>
  );
}
