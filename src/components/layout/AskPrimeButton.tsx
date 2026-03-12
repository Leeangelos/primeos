"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";

type SeasonalVariant = {
  emoji: string;
  label: string;
};

function getSeasonalVariant(today: Date): SeasonalVariant {
  const month = today.getMonth() + 1; // 1-12
  const day = today.getDate();
  const year = today.getFullYear();

  // Specific one-off days first
  if (year === 2026 && month === 2 && day === 8) {
    return { emoji: "🏈", label: "Game Day Coach" }; // Super Bowl Sunday 2026
  }
  if (month === 2 && day === 14) {
    return { emoji: "💝", label: "Love Your Margins" };
  }
  if (month === 3 && day === 17) {
    return { emoji: "🍀", label: "Lucky Margins" };
  }
  if (month === 4 && day === 1) {
    return { emoji: "🎭", label: "No Fooling" };
  }
  if (month === 5 && day === 5) {
    return { emoji: "🌮", label: "Cinco Special" };
  }
  if (month === 7 && day === 4) {
    return { emoji: "🎆", label: "Independence Rush" };
  }

  // Ranges
  if (month === 3 && day >= 18 && day <= 31) {
    return { emoji: "🏀", label: "Game Day Coach" }; // March Madness start
  }
  if (month === 4 && day >= 1 && day <= 7) {
    return { emoji: "🏀", label: "Game Day Coach" }; // March Madness spillover
  }
  if (month === 10 && day >= 1 && day <= 31) {
    return { emoji: "🎃", label: "Scary Good Margins" };
  }
  if (month === 11 && day >= 1 && day <= 27) {
    return { emoji: "🦃", label: "Holiday Rush" };
  }
  if ((month === 11 && day >= 28) || month === 12) {
    return { emoji: "🎄", label: "Holiday Rush Coach" };
  }

  // Default
  return { emoji: "🍕", label: "Ask PrimeOS" };
}

export function AskPrimeButton() {
  const router = useRouter();

  const { emoji, label } = useMemo(() => getSeasonalVariant(new Date()), []);

  const handleClick = () => {
    let store = "kent";
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      store =
        params.get("store") ??
        params.get("store_id") ??
        params.get("store_slug") ??
        "kent";
      const url = new URL("/chat", window.location.origin);
      if (store) url.searchParams.set("store", store);
      router.push(url.pathname + url.search.toString());
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="fixed right-4 bottom-24 sm:bottom-28 z-40 flex items-center gap-2 rounded-full bg-slate-900/90 border border-slate-700 px-3.5 py-2 shadow-lg shadow-black/40 hover:bg-slate-800 transition-colors min-h-[44px]"
      style={{ marginBottom: "max(1rem, env(safe-area-inset-bottom))" }}
      aria-label={label}
    >
      <span className="text-lg" aria-hidden="true">
        {emoji}
      </span>
      <span className="text-xs font-semibold text-slate-100 whitespace-nowrap">
        {label}
      </span>
    </button>
  );
}

