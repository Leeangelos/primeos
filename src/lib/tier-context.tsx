"use client";

import { createContext, useContext, useState, useCallback, useEffect } from "react";

const STORAGE_KEY = "primeos-demo-tier";
const DEFAULT_TIER = "owner";

type TierKey = "free" | "starter" | "operator" | "owner" | "enterprise";

type TierContextValue = {
  currentTier: string;
  setCurrentTier: (tier: string) => void;
};

const TierContext = createContext<TierContextValue | null>(null);

function readStoredTier(): string {
  if (typeof window === "undefined") return DEFAULT_TIER;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && ["free", "starter", "operator", "owner", "enterprise"].includes(stored)) {
      return stored;
    }
  } catch {
    // ignore
  }
  return DEFAULT_TIER;
}

export function TierProvider({ children }: { children: React.ReactNode }) {
  const [currentTier, setCurrentTierState] = useState<string>(DEFAULT_TIER);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setCurrentTierState(readStoredTier());
    setMounted(true);
  }, []);

  const setCurrentTier = useCallback((tier: string) => {
    setCurrentTierState(tier);
    try {
      localStorage.setItem(STORAGE_KEY, tier);
    } catch {
      // ignore
    }
  }, []);

  const value: TierContextValue = mounted
    ? { currentTier, setCurrentTier }
    : { currentTier: DEFAULT_TIER, setCurrentTier };

  return <TierContext.Provider value={value}>{children}</TierContext.Provider>;
}

export function useTier(): TierContextValue {
  const ctx = useContext(TierContext);
  if (!ctx) {
    return {
      currentTier: DEFAULT_TIER,
      setCurrentTier: () => {},
    };
  }
  return ctx;
}
