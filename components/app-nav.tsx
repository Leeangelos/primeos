"use client";

import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/src/lib/theme-context";
import { NotificationCenter } from "@/src/components/layout/NotificationCenter";

export function AppNav() {
  const { theme, toggleTheme } = useTheme();
  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-sm border-b border-slate-700">
      <div className="flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-white">PrimeOS</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 hidden sm:inline">Internal · Manual Entry</span>
          <NotificationCenter />
          <button
            type="button"
            onClick={toggleTheme}
            className="p-1.5 rounded-lg hover:bg-slate-700/50 transition-colors"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <Sun className="w-4 h-4 text-slate-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-500" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
