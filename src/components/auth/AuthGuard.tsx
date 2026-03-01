"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/src/lib/auth-context";

const PUBLIC_PATHS = ["/login", "/signup", "/welcome", "/partner", "/terms", "/privacy", "/onboarding"];
const SKIP_ONBOARDING_EMAILS = ["leeangelos.corp@gmail.com", "greg.leeangelos@gmail.com", "lmg.11@yahoo.com"];
const ONBOARDING_STORAGE_PREFIX = "primeos-onboarding-complete-";

function AnimatedStep({ delay, text }: { delay: number; text: string }) {
  const [visible, setVisible] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const showTimer = setTimeout(() => setVisible(true), delay);
    const checkTimer = setTimeout(() => setChecked(true), delay + 500);
    return () => {
      clearTimeout(showTimer);
      clearTimeout(checkTimer);
    };
  }, [delay]);

  if (!visible) return null;

  return (
    <div className="flex items-center gap-3">
      <div
        className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-500 ${checked ? "bg-emerald-500" : "bg-zinc-700 animate-pulse"}`}
      >
        {checked && <span className="text-white text-xs">✓</span>}
      </div>
      <span className={`text-sm transition-all duration-500 ${checked ? "text-white" : "text-zinc-500"}`}>
        {text}
      </span>
    </div>
  );
}

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { session, loading } = useAuth();
  const [welcomeAnimationDone, setWelcomeAnimationDone] = useState(false);
  const [showRedirectingMessage, setShowRedirectingMessage] = useState(false);
  const [progress, setProgress] = useState(0);
  const onboardingCheckAfterWelcome = useRef(false);

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

    if (!welcomeAnimationDone && !showRedirectingMessage) {
      const userId = session.user?.id;
      const key = userId ? `${ONBOARDING_STORAGE_PREFIX}${userId}` : "";
      setProgress(0);
      const tProgress = setTimeout(() => setProgress(100), 100);
      const tMessage = setTimeout(() => {
        if (typeof window !== "undefined" && key && !localStorage.getItem(key)) {
          setShowRedirectingMessage(true);
        }
      }, 5200);
      const tRedirect = setTimeout(() => {
        if (typeof window !== "undefined" && key && !localStorage.getItem(key)) {
          window.location.href = "/onboarding";
        } else {
          setWelcomeAnimationDone(true);
        }
      }, 5500);
      return () => {
        clearTimeout(tProgress);
        clearTimeout(tMessage);
        clearTimeout(tRedirect);
      };
    }

    if (onboardingCheckAfterWelcome.current) return;
    onboardingCheckAfterWelcome.current = true;

    const userId = session.user?.id;
    const key = userId ? `${ONBOARDING_STORAGE_PREFIX}${userId}` : "";
    if (typeof window !== "undefined" && key && !localStorage.getItem(key)) {
      window.location.href = "/onboarding";
    }
  }, [loading, session, pathname, router, welcomeAnimationDone, showRedirectingMessage]);

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
  const showWelcomeAnimation =
    isNewSignup && !skipCheck && !onboardingComplete && !welcomeAnimationDone && !showRedirectingMessage;

  if (showRedirectingMessage) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-6 z-[100] fixed inset-0">
        <div className="text-center space-y-4 max-w-sm">
          <h1 className="text-xl font-bold text-white">Redirecting to your setup...</h1>
        </div>
      </div>
    );
  }

  if (showWelcomeAnimation) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-6 z-[100] fixed inset-0">
        <div className="fixed top-0 left-0 right-0 h-1 bg-zinc-800 z-50">
          <div
            className="h-full bg-[#E65100] transition-all duration-[5500ms] ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="text-center space-y-6 max-w-sm">
          <h1 className="text-2xl font-bold text-white">Setting up PrimeOS</h1>
          <div className="space-y-3 text-left">
            <AnimatedStep delay={0} text="Verifying your account" />
            <AnimatedStep delay={1200} text="Loading your store" />
            <AnimatedStep delay={2400} text="Preparing your dashboard" />
            <AnimatedStep delay={3600} text="Crunching your numbers" />
            <AnimatedStep delay={4800} text="You're in 🔥" />
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
