"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/daily", label: "Daily" },
  { href: "/weekly", label: "Weekly" },
  { href: "/monthly", label: "Monthly" },
  { href: "/rolodex", label: "Rolodex" },
  { href: "/brief", label: "Brief" },
  { href: "/pnl", label: "P&L" },
  { href: "/recipes", label: "Recipes" },
  { href: "/invoices", label: "Invoices" },
  { href: "/sales", label: "Sales" },
  { href: "/inventory", label: "Inventory" },
  { href: "/people", label: "People" },
  { href: "/marketing", label: "Marketing" },
  { href: "/parties", label: "Parties" },
  { href: "/schedule", label: "Schedule" },
  { href: "/billing", label: "Billing" },
  { href: "/doordash", label: "DoorDash" },
] as const;

export function AppNav() {
  const pathname = usePathname();
  const linkClass = (isActive: boolean) =>
    cn(
      "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
      isActive
        ? "border border-brand/50 bg-brand/15 text-brand shadow-[0_0_8px_rgba(249,115,22,0.3)]"
        : "border border-border/30 bg-black/20 text-muted hover:text-white hover:border-border/50 hover:bg-black/30"
    );
  const renderLink = ({ href, label }: { href: string; label: string }) => {
    const isActive = pathname === href || pathname.startsWith(href + "/");
    return (
      <Link
        key={href}
        href={href}
        className={linkClass(isActive)}
        aria-current={isActive ? "page" : undefined}
      >
        {label}
      </Link>
    );
  };

  return (
    <nav aria-label="Main">
      <div
        className="rounded-xl border border-brand/20 bg-black/30 p-2"
        style={{ boxShadow: "0 0 15px rgba(249,115,22,0.08), inset 0 0 15px rgba(249,115,22,0.03)" }}
      >
        <div className="flex flex-wrap gap-1.5 justify-center">
          {tabs.map(renderLink)}
        </div>
      </div>
    </nav>
  );
}
