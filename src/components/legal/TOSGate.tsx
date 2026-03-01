"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const TOS_VERSION = "1.0";
const STORAGE_KEY = "primeos-tos-accepted";
const STORAGE_KEY_AT = "primeos-tos-accepted-at";

export function TOSGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [agreed, setAgreed] = useState(false);
  const [accepted, setAccepted] = useState<boolean | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    setAccepted(stored === TOS_VERSION);
  }, []);

  const handleAccept = () => {
    localStorage.setItem(STORAGE_KEY, TOS_VERSION);
    localStorage.setItem(STORAGE_KEY_AT, new Date().toISOString());
    setAccepted(true);
  };

  // Login, signup, welcome, partner, terms, and privacy — skip TOS gate entirely (before any localStorage check)
  if (["/", "/login", "/signup", "/welcome", "/partner", "/onboarding", "/terms", "/privacy"].includes(pathname ?? "")) {
    return <>{children}</>;
  }

  // Loading: prevent flash while reading localStorage
  if (accepted === null) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-600 border-t-blue-500" aria-hidden />
      </div>
    );
  }

  // Already accepted
  if (accepted === true) {
    return <>{children}</>;
  }

  // TOS gate screen
  return (
    <div className="fixed inset-0 z-[100] bg-slate-900 overflow-y-auto">
      <div className="max-w-lg mx-auto px-4 py-8 pb-12">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white">PrimeOS</h1>
          <p className="text-sm text-slate-400 mt-1">The Operating System for Pizza</p>
        </div>

        {/* TOS Summary Card */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-5 mb-6">
          <h2 className="text-base font-semibold text-white mb-3">Before you get started</h2>
          <p className="text-sm text-slate-300 leading-relaxed mb-3">
            Please review and accept our Terms of Service and Privacy Policy to continue using PrimeOS.
          </p>
          <p className="text-sm text-slate-300 leading-relaxed mb-4">
            Key points:
          </p>
          <ul className="space-y-2 text-sm text-slate-400">
            <li className="flex items-start gap-2">
              <span className="text-slate-500 mt-0.5">→</span>
              <span>PrimeOS is an educational tool. All business decisions are yours.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-slate-500 mt-0.5">→</span>
              <span>AI content may contain inaccuracies. Always verify before acting.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-slate-500 mt-0.5">→</span>
              <span>We never sell your individual business data.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-slate-500 mt-0.5">→</span>
              <span>Your data is encrypted and isolated from other operators.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-slate-500 mt-0.5">→</span>
              <span>You can export or delete your data at any time.</span>
            </li>
          </ul>
        </div>

        {/* Links to full documents */}
        <div className="flex gap-3 mb-6">
          <Link href="/terms" target="_blank" className="flex-1 text-center py-3 bg-slate-800 rounded-xl border border-slate-700 text-sm text-blue-400 hover:text-blue-300">
            Read Full Terms
          </Link>
          <Link href="/privacy" target="_blank" className="flex-1 text-center py-3 bg-slate-800 rounded-xl border border-slate-700 text-sm text-blue-400 hover:text-blue-300">
            Read Privacy Policy
          </Link>
        </div>

        {/* Checkbox + Accept */}
        <div className="space-y-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-1 w-5 h-5 rounded border-slate-600 bg-slate-700 text-blue-500 focus:ring-blue-500 focus:ring-offset-0 flex-shrink-0"
            />
            <span className="text-sm text-slate-300 leading-relaxed">
              I have read and agree to the <Link href="/terms" target="_blank" className="text-blue-400 underline">Terms of Service</Link> and <Link href="/privacy" target="_blank" className="text-blue-400 underline">Privacy Policy</Link>.
            </span>
          </label>

          <button
            onClick={handleAccept}
            disabled={!agreed}
            className={`w-full py-3.5 rounded-xl text-sm font-semibold transition-colors ${
              agreed
                ? "bg-blue-600 hover:bg-blue-500 text-white"
                : "bg-slate-700 text-slate-500 cursor-not-allowed"
            }`}
          >
            Continue to PrimeOS
          </button>
        </div>

        <p className="text-xs text-slate-600 text-center mt-6">Version 1.0 · February 23, 2026</p>
      </div>
    </div>
  );
}
