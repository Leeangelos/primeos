"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/src/lib/auth-context";

const PUBLIC_PATHS = ["/login", "/signup", "/welcome", "/partner", "/terms", "/privacy", "/onboarding"];
const SKIP_ONBOARDING_CHECK_EMAIL = "leeangelos.corp@gmail.com";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { session, loading } = useAuth();
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null);
  const onboardingCheckDone = useRef(false);

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
    const skipCheck = session.user?.email === SKIP_ONBOARDING_CHECK_EMAIL || !isNewSignup;

    if (skipCheck) {
      setOnboardingComplete(true);
      return;
    }

    if (onboardingCheckDone.current) {
      if (onboardingComplete === false) {
        router.replace("/onboarding");
      }
      return;
    }

    let cancelled = false;
    onboardingCheckDone.current = true;
    const token = session.access_token;
    fetch("/api/onboarding", { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then((res) => res.json())
      .then((body) => {
        if (!cancelled) {
          setOnboardingComplete(!!body.completed);
          if (!body.completed) {
            router.replace("/onboarding");
          }
        }
      })
      .catch(() => {
        if (!cancelled) setOnboardingComplete(true);
      });
    return () => {
      cancelled = true;
    };
  }, [loading, session, pathname, router, onboardingComplete]);

  if (loading && !session && !PUBLIC_PATHS.includes(pathname)) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-600 border-t-blue-500" aria-hidden />
      </div>
    );
  }

  const storeName = session?.user?.user_metadata?.store_name;
  const isNewSignup = typeof storeName === "string" && storeName.length > 0;
  const skipCheck = session?.user?.email === SKIP_ONBOARDING_CHECK_EMAIL || !isNewSignup;
  const waitingOnboarding = isNewSignup && !skipCheck && onboardingComplete === null && !PUBLIC_PATHS.includes(pathname);

  if (waitingOnboarding) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-600 border-t-blue-500" aria-hidden />
      </div>
    );
  }

  return <>{children}</>;
}
