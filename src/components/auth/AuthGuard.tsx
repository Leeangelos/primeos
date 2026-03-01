"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/src/lib/auth-context";

const PUBLIC_PATHS = ["/login", "/signup", "/welcome", "/partner", "/terms", "/privacy", "/onboarding"];
const SKIP_ONBOARDING_EMAILS = ["leeangelos.corp@gmail.com", "greg.leeangelos@gmail.com", "lmg.11@yahoo.com"];
const ONBOARDING_STORAGE_PREFIX = "primeos-onboarding-complete-";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { session, loading } = useAuth();
  const onboardingRedirectDone = useRef(false);

  useEffect(() => {
    if (loading) return;
    if (pathname === "/login" && session) {
      router.replace("/");
      return;
    }
    if (PUBLIC_PATHS.includes(pathname)) return;
    if (!session) {
      router.replace("/login");
      return;
    }

    const storeName = session.user?.user_metadata?.store_name;
    const isNewSignup = typeof storeName === "string" && storeName.length > 0;
    const skipCheck = (session.user?.email && SKIP_ONBOARDING_EMAILS.includes(session.user.email)) || !isNewSignup;

    if (skipCheck) return;

    const userId = session.user?.id;
    const key = userId ? `${ONBOARDING_STORAGE_PREFIX}${userId}` : "";
    if (typeof window !== "undefined" && key && !localStorage.getItem(key) && !onboardingRedirectDone.current) {
      onboardingRedirectDone.current = true;
      window.location.href = "/onboarding";
    }
  }, [loading, session, pathname, router]);

  if (PUBLIC_PATHS.includes(pathname)) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-600 border-t-blue-500" aria-hidden />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const storeName = session.user?.user_metadata?.store_name;
  const isNewSignup = typeof storeName === "string" && storeName.length > 0;
  const skipCheck = (session.user?.email && SKIP_ONBOARDING_EMAILS.includes(session.user.email)) || !isNewSignup;
  const userId = session.user?.id;
  const onboardingStorageKey = userId ? `${ONBOARDING_STORAGE_PREFIX}${userId}` : "";
  const onboardingComplete =
    typeof window !== "undefined" && onboardingStorageKey ? !!localStorage.getItem(onboardingStorageKey) : false;
  const showRedirectToOnboarding = isNewSignup && !skipCheck && !onboardingComplete;

  if (showRedirectToOnboarding) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-bold text-white mb-2">Welcome to PrimeOS</h1>
          <p className="text-sm text-zinc-400">Setting up your account...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
