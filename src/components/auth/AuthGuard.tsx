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

    console.log("AuthGuard: session exists", session?.user?.email);
    console.log("AuthGuard: user_metadata", session?.user?.user_metadata);

    const storeName = session.user?.user_metadata?.store_name;
    const isNewSignup = typeof storeName === "string" && storeName.length > 0;
    const skipCheck = session.user?.email === SKIP_ONBOARDING_CHECK_EMAIL || !isNewSignup;

    if (skipCheck) {
      console.log("AuthGuard: onboarding complete, proceeding");
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
    console.log("AuthGuard: checking onboarding for new user");

    const timeoutId = setTimeout(() => {
      if (!cancelled) {
        console.log("AuthGuard: onboarding check timeout, proceeding");
        setOnboardingComplete(true);
      }
    }, 3000);

    (async () => {
      try {
        const token = session.access_token;
        const res = await fetch("/api/onboarding", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) throw new Error("API failed");
        const data = await res.json();
        console.log("AuthGuard: onboarding API response", data);
        if (cancelled) return;
        setOnboardingComplete(!!data.completed);
        if (!data.completed) {
          console.log("AuthGuard: redirecting to /onboarding");
          router.replace("/onboarding");
        } else {
          console.log("AuthGuard: onboarding complete, proceeding");
        }
      } catch (err) {
        console.error("Onboarding check failed, proceeding:", err);
        if (!cancelled) setOnboardingComplete(true);
      } finally {
        clearTimeout(timeoutId);
      }
    })();

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
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
