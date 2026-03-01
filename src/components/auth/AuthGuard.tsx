"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/src/lib/auth-context";

const PUBLIC_PATHS = ["/", "/login", "/signup", "/welcome", "/partner", "/terms", "/privacy"];

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { session, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (pathname === "/login" && session) {
      router.replace("/");
      return;
    }
    if (PUBLIC_PATHS.includes(pathname)) return;
    if (!session) {
      router.replace("/login");
    }
  }, [loading, session, pathname, router]);

  if (loading && !session && !PUBLIC_PATHS.includes(pathname)) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-600 border-t-blue-500" aria-hidden />
      </div>
    );
  }

  return <>{children}</>;
}
