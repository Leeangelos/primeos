"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/daily", label: "Daily" },
  { href: "/weekly", label: "Weekly" },
] as const;

export function AppNav() {
  const pathname = usePathname();
  return (
    <nav
      className="flex items-center gap-1 rounded-lg border border-border/50 bg-black/20 p-1"
      aria-label="Main"
    >
      {tabs.map(({ href, label }) => {
        const isActive = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "rounded-md px-4 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-brand/15 text-brand ring-1 ring-brand/30"
                : "text-muted hover:bg-white/5 hover:text-white"
            )}
            aria-current={isActive ? "page" : undefined}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
