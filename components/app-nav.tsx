"use client";

import { Sun, Moon, LogOut } from "lucide-react";
import { useTheme } from "@/src/lib/theme-context";
import { useAuth } from "@/src/lib/auth-context";
import { NotificationCenter } from "@/src/components/layout/NotificationCenter";

export function AppNav() {
  const { theme, toggleTheme } = useTheme();
  const { session, signOut } = useAuth();
  return (
    <header className="sticky top-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-sm border-b border-slate-700" style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>
      <div className="h-14 px-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-white">PrimeOS</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 hidden sm:inline">Internal · Manual Entry</span>
          <NotificationCenter />
          {session && (
            <button
              type="button"
              onClick={() => signOut()}
              className="p-1.5 rounded-lg hover:bg-slate-700/50 transition-colors text-slate-400 hover:text-white"
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
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
