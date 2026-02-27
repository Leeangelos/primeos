"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useCallback, useEffect, useRef } from "react";
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
  Newspaper,
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
  Shield,
  Search,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase";
import { UpgradeModal } from "@/src/components/layout/UpgradeModal";
import { useTheme } from "@/src/lib/theme-context";

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
  isLight,
}: {
  title: string;
  items: NavItem[];
  pathname: string;
  setMoreOpen: (open: boolean) => void;
  isLight?: boolean;
}) {
  return (
    <div>
      <h3 className={cn(
        "text-xs uppercase tracking-wider font-semibold mb-2",
        isLight ? "text-zinc-600" : "text-slate-500"
      )}>{title}</h3>
      <div className={cn(
        "rounded-xl overflow-hidden divide-y",
        isLight ? "bg-white border border-zinc-200 divide-zinc-200" : "bg-slate-800 border border-slate-700 divide-slate-700/50"
      )}>
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMoreOpen(false)}
              className={cn(
                "flex items-center gap-3 px-4 py-3 active:opacity-90",
                isLight ? (isActive ? "bg-orange-50" : "active:bg-zinc-100") : (isActive ? "bg-orange-950/20" : "active:bg-slate-700/50")
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center border",
                isLight ? "bg-zinc-100 border-zinc-200" : "bg-slate-800 border-slate-700"
              )}>
                <Icon className={cn("w-4 h-4", item.color)} />
              </div>
              <div className="flex-1">
                <div className={cn("text-sm font-medium", isLight ? "text-zinc-900" : "text-white")}>{item.label}</div>
                <div className={cn("text-xs", isLight ? "text-zinc-600" : "text-slate-500")}>{item.desc}</div>
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
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [moreOpen, setMoreOpen] = useState(false);
  const [drawerSearch, setDrawerSearch] = useState("");
  const dragStartYRef = useRef<number | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const [upgradeModal, setUpgradeModal] = useState<{ requiredTier: string; pageName: string } | null>(null);

  const closeMore = useCallback(() => {
    setMoreOpen(false);
    setDrawerSearch("");
  }, []);

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
    if (moreOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [moreOpen]);

  useEffect(() => {
    if (!moreOpen) return;
    const t = setTimeout(() => {
      searchInputRef.current?.focus();
    }, 100);
    return () => clearTimeout(t);
  }, [moreOpen]);

  // Active tab source of truth: pathname only (derived every render).
  const isHomeActive = pathname === "/";
  const isDailyActive = pathname === "/daily" || pathname.startsWith("/daily/");
  const isBriefActive = pathname === "/brief" || pathname.startsWith("/brief/");
  const isGuideActive = pathname === "/training" || pathname.startsWith("/training/");

  return (
    <>
      {/* 1. Backdrop — only when drawer open */}
      {moreOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50"
          onClick={closeMore}
          aria-hidden
        />
      )}

      {/* 2. More drawer — slides up ABOVE the nav bar; z-[61] so above nav when open; fully hidden when closed */}
      <div
        className={cn(
          "fixed left-0 right-0 z-50 rounded-t-2xl transition-[transform,opacity] duration-300 ease-out border-t overflow-hidden",
          isLight ? "bg-white border-zinc-200" : "bg-slate-900 border-slate-700",
          moreOpen ? "translate-y-0 opacity-100 visible" : "translate-y-full pointer-events-none opacity-0 invisible"
        )}
        style={{
          bottom: "calc(4rem + env(safe-area-inset-bottom, 0px))",
          maxHeight: "calc(100vh - 4rem - env(safe-area-inset-bottom, 0px))",
          paddingTop: "env(safe-area-inset-top, 0px)",
          paddingLeft: "env(safe-area-inset-left, 0px)",
          paddingRight: "env(safe-area-inset-right, 0px)",
        }}
        aria-hidden={!moreOpen}
      >
        {/* Drag handle + title (anchored) */}
        <div
          className={cn(
            "sticky top-0 z-10 border-b",
            isLight ? "bg-white border-zinc-200" : "bg-slate-900 border-slate-800"
          )}
        >
          <div
            className="flex justify-center pt-3 pb-1 touch-none"
            onTouchStart={(e) => { dragStartYRef.current = e.touches[0].clientY; }}
            onTouchMove={(e) => {
              if (dragStartYRef.current !== null) {
                const diff = e.touches[0].clientY - dragStartYRef.current;
                if (diff > 50) {
                  closeMore();
                  dragStartYRef.current = null;
                }
              }
            }}
            onTouchEnd={() => { dragStartYRef.current = null; }}
          >
            <div className={cn("w-10 h-1 rounded-full", isLight ? "bg-zinc-300" : "bg-slate-600")} />
          </div>
          <div className="px-4 pt-2 pb-2">
            <h2 className={cn("text-lg font-bold", isLight ? "text-zinc-900" : "text-white")}>All Tools</h2>
          </div>
          <div className="px-4 pb-3">
            <div className="relative">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                ref={searchInputRef}
                type="text"
                value={drawerSearch}
                onChange={(e) => setDrawerSearch(e.target.value)}
                placeholder="Search pages..."
                className={cn(
                  "w-full rounded-lg px-9 py-2 text-sm border placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#E65100]/50",
                  isLight
                    ? "bg-zinc-100 text-zinc-900 border-zinc-300"
                    : "bg-zinc-800 text-white border-zinc-700"
                )}
              />
              {drawerSearch && (
                <button
                  type="button"
                  onClick={() => setDrawerSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                  aria-label="Clear search"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Drawer content (scrolls internally) */}
        <div
          className="overflow-y-auto"
          style={{ maxHeight: "calc(100vh - 4rem - env(safe-area-inset-bottom, 0px) - env(safe-area-inset-top, 0px))" }}
        >
          <div className="px-4 py-2 space-y-6 pb-24" role="region" aria-label="All tools and links">
          <Link
            href="/"
            onClick={closeMore}
            className={cn(
              "flex items-center gap-3 px-4 py-3 mb-2 rounded-xl border active:opacity-90",
              isLight ? "bg-zinc-50 border-zinc-200 active:bg-zinc-100" : "bg-slate-800 border-slate-700 active:bg-slate-700/50"
            )}
          >
            <div className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center border",
              isLight ? "bg-white border-zinc-200" : "bg-slate-800 border-slate-700"
            )}>
              <Home className="w-4 h-4 text-blue-400" />
            </div>
            <div className="flex-1">
              <div className={cn("text-sm font-medium", isLight ? "text-zinc-900" : "text-white")}>Home Dashboard</div>
              <div className={cn("text-xs", isLight ? "text-zinc-600" : "text-slate-500")}>Back to overview</div>
            </div>
          </Link>
              <NavSection
                isLight={isLight}
                title="Daily Operations"
                items={(() => {
                  const items: NavItem[] = [
                  { href: "/daily", icon: ClipboardList, label: "Daily KPIs", desc: "Enter today's numbers", color: "text-blue-400" },
                  { href: "/brief", icon: Sparkles, label: "Morning Brief", desc: "AI summary of yesterday", color: "text-purple-400" },
                  { href: "/weekly", icon: BarChart3, label: "Weekly Snapshot", desc: "Week-over-week trends", color: "text-emerald-400" },
                  { href: "/monthly", icon: Calendar, label: "Monthly Summary", desc: "Monthly P&L rollup", color: "text-amber-400" },
                  { href: "/schedule", icon: Clock, label: "Smart Schedule", desc: "Shifts and labor planning", color: "text-cyan-400" },
                  { href: "/inspection-radar", icon: Shield, label: "Inspection Radar", desc: "Inspector activity near you", color: "text-blue-400" },
                  { href: "/tasks", icon: CheckSquare, label: "Manager Tasks", desc: "Assign and track team tasks", color: "text-orange-400" },
                  { href: "/chat", icon: MessageCircle, label: "Team Chat", desc: "Internal messaging", color: "text-pink-400" },
                  ];
                  if (!drawerSearch.trim()) return items;
                  const q = drawerSearch.toLowerCase();
                  return items.filter((i) => i.label.toLowerCase().includes(q));
                })()}
                pathname={pathname}
                setMoreOpen={closeMore}
              />

              <NavSection
                isLight={isLight}
                title="Financial"
                items={(() => {
                  const items: NavItem[] = [
                  { href: "/pnl", icon: DollarSign, label: "GP P&L", desc: "Gross profit tracking", color: "text-emerald-400" },
                  { href: "/actual-pnl", icon: FileSpreadsheet, label: "Actual P&L", desc: "CPA upload — real net profit", color: "text-green-400" },
                  { href: "/gl-upload", icon: FileSpreadsheet, label: "GL Upload", desc: "General Ledger import", color: "text-cyan-400" },
                  { href: "/vendor-tracker", icon: Building2, label: "Vendor Tracker", desc: "Costs, trends, and alerts", color: "text-rose-400" },
                  { href: "/sales", icon: TrendingUp, label: "Sales Report", desc: "Revenue comparisons", color: "text-blue-400" },
                  { href: "/valuation", icon: TrendingUp, label: "What's It Worth?", desc: "Business valuation estimator", color: "text-amber-400" },
                  { href: "/doordash", icon: Truck, label: "Delivery Economics", desc: "Platform costs and comparison", color: "text-red-400" },
                  { href: "/billing", icon: Heart, label: "Our Story", desc: "Why we built this", color: "text-[#E65100]" },
                  ];
                  if (!drawerSearch.trim()) return items;
                  const q = drawerSearch.toLowerCase();
                  return items.filter((i) => i.label.toLowerCase().includes(q));
                })()}
                pathname={pathname}
                setMoreOpen={closeMore}
              />

              <NavSection
                isLight={isLight}
                title="Kitchen & Inventory"
                items={(() => {
                  const items: NavItem[] = [
                  { href: "/recipes", icon: BookOpen, label: "Recipes", desc: "Food costing and portions", color: "text-amber-400" },
                  { href: "/inventory", icon: Package, label: "Inventory", desc: "Stock levels and par", color: "text-yellow-400" },
                  { href: "/invoices", icon: FileText, label: "Invoice Scanner", desc: "AI-powered OCR scanning", color: "text-violet-400" },
                  { href: "/menu-intelligence", icon: UtensilsCrossed, label: "Menu Intelligence", desc: "Prices, comparison, gap analysis", color: "text-teal-400" },
                  { href: "/food-cost-analysis", icon: Scale, label: "Food Cost Analysis", desc: "Theoretical vs actual variance", color: "text-pink-400" },
                  ];
                  if (!drawerSearch.trim()) return items;
                  const q = drawerSearch.toLowerCase();
                  return items.filter((i) => i.label.toLowerCase().includes(q));
                })()}
                pathname={pathname}
                setMoreOpen={closeMore}
              />

              <NavSection
                isLight={isLight}
                title="People & Marketing"
                items={(() => {
                  const items: NavItem[] = [
                  { href: "/people", icon: Users, label: "People Economics", desc: "CAC, LTV, churn tracking", color: "text-cyan-400" },
                  { href: "/marketing", icon: Target, label: "Ad Accountability", desc: "ROAS and campaign tracking", color: "text-rose-400" },
                  { href: "/reputation", icon: MessageCircle, label: "Do We Suck?", desc: "Reviews and reputation", color: "text-pink-400" },
                  { href: "/competitor-intel", icon: Target, label: "Competitor Intel", desc: "Market position and alerts", color: "text-violet-400" },
                  { href: "/parties", icon: Gift, label: "Catering & Large Orders", desc: "Catering and event orders", color: "text-fuchsia-400" },
                  { href: "/merch", icon: ShoppingBag, label: "Team Merch", desc: "Staff gear and ordering", color: "text-orange-400" },
                  ];
                  if (!drawerSearch.trim()) return items;
                  const q = drawerSearch.toLowerCase();
                  return items.filter((i) => i.label.toLowerCase().includes(q));
                })()}
                pathname={pathname}
                setMoreOpen={closeMore}
              />

              <NavSection
                isLight={isLight}
                title="Resources"
                items={(() => {
                  const items: NavItem[] = [
                  { href: "/vendor-settings", icon: Settings, label: "Vendor Settings", desc: "Manage vendors and platforms", color: "text-slate-400" },
                  { href: "/rolodex", icon: BookUser, label: "Trusted Rolodex", desc: "Vendors, repairs, contacts", color: "text-teal-400" },
                  { href: "/daily-edge", icon: Newspaper, label: "The Daily Edge", desc: "Daily intelligence feed", color: "text-blue-400" },
                  { href: "/training", icon: GraduationCap, label: "Training Guide", desc: "Learn every metric", color: "text-indigo-400" },
                  ];
                  if (!drawerSearch.trim()) return items;
                  const q = drawerSearch.toLowerCase();
                  return items.filter((i) => i.label.toLowerCase().includes(q));
                })()}
                pathname={pathname}
                setMoreOpen={closeMore}
              />

          <div className={cn("pt-4 border-t mt-2", isLight ? "border-zinc-200" : "border-slate-800")}>
            <div className="flex justify-center gap-3">
              <Link href="/terms" onClick={closeMore} className={cn("text-xs hover:underline", isLight ? "text-zinc-600 hover:text-zinc-800" : "text-slate-600 hover:text-slate-400")}>Terms of Service</Link>
              <span className={cn("text-xs", isLight ? "text-zinc-500" : "text-slate-700")}>·</span>
              <Link href="/privacy" onClick={closeMore} className={cn("text-xs hover:underline", isLight ? "text-zinc-600 hover:text-zinc-800" : "text-slate-600 hover:text-slate-400")}>Privacy Policy</Link>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-3 mt-4 rounded-xl text-red-500 hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="text-sm font-medium">Log Out</span>
            </button>
          </div>
          </div>
        </div>
      </div>

      {/* 3. Nav bar — ALWAYS RENDERED, LAST IN DOM; z-[60] above common z-50 overlays */}
      <nav
        className="bottom-nav fixed bottom-0 left-0 right-0 z-[60] bg-zinc-900 border-t border-zinc-800"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
        aria-label="Bottom navigation"
      >
        <div className="flex items-center justify-around h-16 px-2">
          <Link
            href="/"
            className="flex flex-col items-center justify-center gap-0.5 min-w-[44px] min-h-[44px] flex-1 max-w-[80px] transition-colors"
            aria-current={isHomeActive ? "page" : undefined}
          >
            <LayoutDashboard className={cn("w-5 h-5 shrink-0", isHomeActive ? "text-[#E65100]" : "text-zinc-500")} aria-hidden />
            <span className={cn("text-[10px] font-medium whitespace-nowrap leading-tight", isHomeActive ? "text-[#E65100]" : "text-zinc-500")}>Home</span>
          </Link>
          <Link
            href="/daily"
            className="flex flex-col items-center justify-center gap-0.5 min-w-[44px] min-h-[44px] flex-1 max-w-[80px] transition-colors"
            aria-current={isDailyActive ? "page" : undefined}
          >
            <ClipboardList className={cn("w-5 h-5 shrink-0", isDailyActive ? "text-[#E65100]" : "text-zinc-500")} aria-hidden />
            <span className={cn("text-[10px] font-medium whitespace-nowrap leading-tight", isDailyActive ? "text-[#E65100]" : "text-zinc-500")}>Daily</span>
          </Link>
          <Link
            href="/brief"
            className="flex flex-col items-center justify-center gap-0.5 min-w-[44px] min-h-[44px] flex-1 max-w-[80px] transition-colors"
            aria-current={isBriefActive ? "page" : undefined}
          >
            <Sparkles className={cn("w-5 h-5 shrink-0", isBriefActive ? "text-[#E65100]" : "text-zinc-500")} aria-hidden />
            <span className={cn("text-[10px] font-medium whitespace-nowrap leading-tight", isBriefActive ? "text-[#E65100]" : "text-zinc-500")}>Brief</span>
          </Link>
          <Link
            href="/training"
            className="flex flex-col items-center justify-center gap-0.5 min-w-[44px] min-h-[44px] flex-1 max-w-[80px] transition-colors"
            aria-current={isGuideActive ? "page" : undefined}
          >
            <GraduationCap className={cn("w-5 h-5 shrink-0", isGuideActive ? "text-[#E65100]" : "text-zinc-500")} aria-hidden />
            <span className={cn("text-[10px] font-medium whitespace-nowrap leading-tight", isGuideActive ? "text-[#E65100]" : "text-zinc-500")}>Guide</span>
          </Link>
          <button
            type="button"
            onClick={() =>
              setMoreOpen((prev) => {
                const next = !prev;
                if (!next) {
                  setDrawerSearch("");
                }
                return next;
              })
            }
            className="flex flex-col items-center justify-center gap-0.5 min-w-[44px] min-h-[44px] flex-1 max-w-[80px] transition-colors"
            aria-expanded={moreOpen}
            aria-haspopup="dialog"
            aria-label="More pages"
          >
            <Menu className="w-5 h-5 shrink-0 text-zinc-500 active:text-[#E65100]" aria-hidden />
            <span className="text-[10px] font-medium whitespace-nowrap leading-tight text-zinc-500 active:text-[#E65100]">
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
