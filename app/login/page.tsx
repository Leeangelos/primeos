"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const welcome = searchParams.get("welcome") === "true";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showResetForm, setShowResetForm] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (signInError) {
        setError(signInError.message);
        setLoading(false);
        return;
      }
      if (data?.session) {
        router.push("/");
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setResetError(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/update-password`,
      });
      if (error) {
        setResetError(error.message);
        return;
      }
      setResetSent(true);
    } catch (err) {
      setResetError("Something went wrong. Try again.");
    }
  }

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-zinc-950 overflow-y-auto min-h-[100dvh] md:items-center md:justify-center"
      style={{ userSelect: "none" }}
      aria-modal="true"
      role="dialog"
    >
      <div className="pointer-events-auto w-full max-w-md px-6 py-6 sm:py-8 md:py-8 md:px-4 md:mx-auto flex-shrink-0">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-white">PrimeOS</h1>
        <p className="text-sm text-slate-400 mt-1">The Operating System for Pizza</p>
      </div>

      {welcome && (
        <div className="bg-emerald-900/30 border border-emerald-700 rounded-xl p-4 mb-4">
          <p className="text-sm text-emerald-200">Account created! Log in with your email and password to get started.</p>
        </div>
      )}

      <div className="bg-slate-800 rounded-xl border border-slate-700 p-5 mb-4">
        {showResetForm ? (
          <div>
            {resetSent ? (
              <div className="text-center">
                <p className="text-sm text-emerald-400 font-medium mb-2">Check your email</p>
                <p className="text-xs text-slate-400">We sent a password reset link to {resetEmail}</p>
                <button type="button" onClick={() => { setShowResetForm(false); setResetSent(false); }} className="mt-4 text-xs text-blue-400 hover:text-blue-300">
                  Back to login
                </button>
              </div>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block">Email address</label>
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    required
                    className="w-full bg-slate-700 border border-slate-600 rounded-xl text-white h-12 px-4 text-sm"
                    placeholder="you@example.com"
                  />
                </div>
                {resetError && <p className="text-xs text-red-400">{resetError}</p>}
                <button type="submit" className="w-full min-h-[48px] py-3 rounded-xl bg-[#E65100] hover:bg-[#f3731a] text-white text-sm font-semibold transition-colors">
                  Send Reset Link
                </button>
                <button type="button" onClick={() => setShowResetForm(false)} className="w-full text-xs text-slate-400 hover:text-slate-300 mt-2">
                  Back to login
                </button>
              </form>
            )}
          </div>
        ) : (
          <>
            <h2 className="text-base font-semibold text-white mb-4">Log In</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-2.5 rounded-lg bg-red-600/20 border border-red-700/30 text-xs text-red-300">
                  {error}
                </div>
              )}
              <div>
                <label htmlFor="login-email" className="block text-xs text-slate-400 mb-1.5">
                  Email
                </label>
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="you@company.com"
                />
              </div>
              <div>
                <label htmlFor="login-password" className="block text-xs text-slate-400 mb-1.5">
                  Password
                </label>
                <input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="••••••••"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className={`w-full min-h-[48px] py-3 rounded-xl text-sm font-semibold transition-colors ${
                  loading
                    ? "bg-slate-700 text-slate-500 cursor-not-allowed"
                    : "bg-[#E65100] hover:bg-[#f3731a] text-white"
                }`}
              >
                {loading ? "Signing in…" : "Log In"}
              </button>
              <button type="button" onClick={() => setShowResetForm(true)} className="text-xs text-blue-400 hover:text-blue-300">
                Forgot password?
              </button>
            </form>
            <div className="mt-4 text-center">
              <a
                href="/welcome"
                className="text-xs text-slate-400 hover:text-slate-200 underline underline-offset-4"
              >
                Learn more about PrimeOS
              </a>
            </div>
          </>
        )}
      </div>

      <div className="w-full bg-gradient-to-r from-[#E65100]/20 to-zinc-900 border border-[#E65100]/30 rounded-2xl p-5 mb-4">
        <p className="text-lg font-bold text-white">First time here?</p>
        <p className="text-sm text-zinc-400 mt-1">See how PrimeOS helps independent pizzeria operators stop running blind.</p>
        <Link href="/welcome" className="bg-[#E65100] text-white px-6 py-2.5 rounded-xl font-semibold text-sm mt-3 inline-block hover:bg-[#f3731a] transition-colors min-h-[44px] flex items-center justify-center w-full sm:w-auto">
          Learn More →
        </Link>
      </div>

      <div className="text-center space-y-2">
        <p className="text-xs text-slate-500">
          <Link href="/terms" className="text-slate-400 hover:text-slate-300 underline underline-offset-2">Terms of Service</Link>
          {" · "}
          <Link href="/privacy" className="text-slate-400 hover:text-slate-300 underline underline-offset-2">Privacy Policy</Link>
        </p>
        <p className="text-xs text-slate-600">© PrimeOS</p>
      </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="max-w-md mx-auto py-8"><div className="h-8 w-48 bg-slate-800 rounded animate-pulse" /></div>}>
      <LoginContent />
    </Suspense>
  );
}
