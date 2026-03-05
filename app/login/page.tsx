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
        window.location.href = "/";
        return;
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
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes glow-pulse {
          0%, 100% { opacity: 0.1; }
          50% { opacity: 0.25; }
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes border-shimmer {
          0%, 100% { border-color: rgba(63,63,70,0.3); }
          50% { border-color: rgba(82,82,91,0.5); }
        }
        .login-glow-pulse {
          animation: glow-pulse 4s ease-in-out infinite;
        }
        .login-fade-in {
          animation: fade-in 500ms ease-out forwards;
        }
        .login-border-shimmer {
          animation: border-shimmer 6s ease-in-out infinite;
        }
        @keyframes login-spin {
          to { transform: rotate(360deg); }
        }
        .login-spinner {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: login-spin 0.7s linear infinite;
        }
      `}} />
      <div
        className="fixed inset-0 z-[9999] flex flex-col min-h-[100dvh] bg-zinc-950 overflow-y-auto justify-between md:justify-center md:items-center"
        style={{ userSelect: "none", pointerEvents: "auto" }}
        aria-modal="true"
        role="dialog"
      >
        <div className="w-full max-w-sm mx-auto px-6 pt-8 pb-6 md:py-10 flex flex-col gap-6 md:gap-8">
          <header className="flex flex-col items-center pt-2">
            <div className="relative inline-block">
              <div
                className="absolute inset-0 rounded-full login-glow-pulse pointer-events-none"
                style={{ boxShadow: "0 0 40px rgba(230,81,0,0.2)", background: "transparent" }}
                aria-hidden
              />
              <h1 className="relative text-2xl font-bold text-white">PrimeOS</h1>
            </div>
            <p className="text-sm text-zinc-400 mt-1">The Operating System for Independent Pizza</p>
          </header>

          {welcome && (
            <div className="bg-emerald-900/30 border border-emerald-700 rounded-xl p-4 login-fade-in">
              <p className="text-sm text-emerald-200">Account created! Log in with your email and password to get started.</p>
            </div>
          )}

          <div className="login-fade-in login-border-shimmer bg-zinc-900/80 backdrop-blur-sm border border-zinc-700/50 rounded-2xl p-6 shadow-lg shadow-black/20">
            {showResetForm ? (
              <div>
                {resetSent ? (
                  <div className="text-center">
                    <p className="text-sm text-emerald-400 font-medium mb-2">Check your email</p>
                    <p className="text-xs text-zinc-400">We sent a password reset link to {resetEmail}</p>
                    <button type="button" onClick={() => { setShowResetForm(false); setResetSent(false); }} className="mt-4 text-xs text-[#E65100] hover:text-[#F4651A]">
                      Back to login
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleResetPassword} className="space-y-4">
                    <div>
                      <label className="text-xs text-zinc-400 mb-1.5 block">Email address</label>
                      <input
                        type="email"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        required
                        className="w-full bg-zinc-800 border border-zinc-600 rounded-xl text-white placeholder-zinc-500 py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#E65100]/50 focus:border-[#E65100]"
                        placeholder="you@example.com"
                      />
                    </div>
                    {resetError && <p className="text-xs text-red-400">{resetError}</p>}
                    <button type="submit" className="w-full min-h-[48px] py-3.5 rounded-xl bg-[#E65100] hover:bg-[#F4651A] text-white text-sm font-semibold transition-colors active:scale-[0.98]">
                      Send Reset Link
                    </button>
                    <button type="button" onClick={() => setShowResetForm(false)} className="w-full text-sm text-[#E65100] hover:text-[#F4651A] mt-2 text-left">
                      Back to login
                    </button>
                  </form>
                )}
              </div>
            ) : (
              <>
                <h2 className="text-lg font-semibold text-white mb-4 text-left">Log In</h2>
                <form onSubmit={handleSubmit} className="space-y-4" style={{ touchAction: "manipulation" }}>
                  {error && (
                    <div className="p-2.5 rounded-lg bg-red-600/20 border border-red-700/30 text-xs text-red-300">
                      {error}
                    </div>
                  )}
                  <div>
                    <label htmlFor="login-email" className="block text-xs text-zinc-400 mb-1.5 text-left">
                      Email
                    </label>
                    <input
                      id="login-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                      className="w-full bg-zinc-800 border border-zinc-600 rounded-xl text-white placeholder-zinc-500 py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#E65100]/50 focus:border-[#E65100]"
                      placeholder="you@company.com"
                    />
                  </div>
                  <div>
                    <label htmlFor="login-password" className="block text-xs text-zinc-400 mb-1.5 text-left">
                      Password
                    </label>
                    <input
                      id="login-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                      className="w-full bg-zinc-800 border border-zinc-600 rounded-xl text-white placeholder-zinc-500 py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#E65100]/50 focus:border-[#E65100]"
                      placeholder="••••••••"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className={`w-full min-h-[48px] py-3.5 rounded-xl text-sm font-semibold transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${
                      loading
                        ? "bg-[#E65100]/80 text-white cursor-not-allowed"
                        : "bg-[#E65100] hover:bg-[#F4651A] text-white"
                    }`}
                  >
                    {loading ? (
                      <>
                        <span className="login-spinner shrink-0" aria-hidden />
                        <span>Logging in...</span>
                      </>
                    ) : (
                      "Log In"
                    )}
                  </button>
                  <button type="button" onClick={() => setShowResetForm(true)} className="text-sm text-[#E65100] hover:text-[#F4651A] text-left block w-full mt-1">
                    Forgot password?
                  </button>
                </form>
              </>
            )}
          </div>

          <div className="bg-gradient-to-br from-zinc-800/60 to-zinc-900/60 border border-zinc-700/30 rounded-2xl p-5 login-fade-in">
            <p className="text-lg font-semibold text-white">First time here?</p>
            <p className="text-sm text-zinc-400 mt-1">See how PrimeOS helps independent pizzeria operators stop running blind.</p>
            <Link href="/welcome" className="mt-3 w-full inline-flex items-center justify-center bg-[#E65100] hover:bg-[#F4651A] text-white font-semibold rounded-xl py-3 transition-colors">
              Learn More →
            </Link>
          </div>

          <footer className="text-center space-y-1 pt-2 pb-1">
            <p className="text-xs text-zinc-500">
              <Link href="/terms" className="hover:text-zinc-400 underline underline-offset-2">Terms of Service</Link>
              {" · "}
              <Link href="/privacy" className="hover:text-zinc-400 underline underline-offset-2">Privacy Policy</Link>
            </p>
            <p className="text-xs text-zinc-600">© 2026 Ambition & Legacy LLC</p>
          </footer>
        </div>
      </div>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="max-w-md mx-auto py-8"><div className="h-8 w-48 bg-slate-800 rounded animate-pulse" /></div>}>
      <LoginContent />
    </Suspense>
  );
}
