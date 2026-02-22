"use client";

import type { ReactNode } from "react";

type MobilePageShellProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
};

/**
 * Consistent mobile page shell: top/bottom/horizontal padding,
 * nav clearance, scrollable content, and optional title/subtitle.
 */
export function MobilePageShell({ title, subtitle, children }: MobilePageShellProps) {
  return (
    <div
      className="min-h-screen bg-slate-900 overflow-y-auto px-4 pt-4 pb-24 scroll-smooth"
      style={{ WebkitOverflowScrolling: "touch" }}
    >
      <header className="mb-4">
        <h1 className="text-xl font-bold text-white">{title}</h1>
        {subtitle != null && subtitle !== "" && (
          <p className="mt-1 text-sm text-slate-400">{subtitle}</p>
        )}
      </header>
      <div className="scrollable-content">{children}</div>
    </div>
  );
}
