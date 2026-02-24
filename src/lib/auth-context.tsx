"use client";

import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase";
import { useTier } from "@/src/lib/tier-context";

type AuthContextValue = {
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

/** Maps app role from profiles table to billing tier key. No profile => Demo experience (starter). */
function roleToTier(role: string | null): string {
  if (!role) return "starter";
  const r = role.toLowerCase();
  if (r === "owner") return "owner";
  if (r === "manager") return "operator";
  if (r === "crew") return "starter";
  if (r === "demo") return "starter";
  return "starter";
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { setCurrentTier } = useTier();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfileAndSetTier = useCallback(
    async (email: string) => {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("profiles")
          .select("role")
          .eq("email", email)
          .maybeSingle();
        const tier = roleToTier(data?.role ?? null);
        setCurrentTier(tier);
      } catch {
        setCurrentTier("starter");
      }
    },
    [setCurrentTier]
  );

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      if (s?.user?.email) loadProfileAndSetTier(s.user.email);
      setLoading(false);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s?.user?.email) loadProfileAndSetTier(s.user.email);
      else setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, [loadProfileAndSetTier]);

  const signOut = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setSession(null);
    router.push("/login");
    router.refresh();
  }, [router]);

  const value: AuthContextValue = { session, loading, signOut };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    return {
      session: null,
      loading: true,
      signOut: async () => {},
    };
  }
  return ctx;
}
