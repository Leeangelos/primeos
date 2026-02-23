"use client";

export function AppNav() {
  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-sm border-b border-slate-700">
      <div className="flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-white">PrimeOS</span>
        </div>
        <span className="text-xs text-slate-500">Internal · Manual Entry</span>
      </div>
    </header>
  );
}
