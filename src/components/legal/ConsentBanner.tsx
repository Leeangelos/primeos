"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export function ConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem("primeos-consent-dismissed");
    if (!dismissed) {
      setVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem("primeos-consent-dismissed", "true");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed left-4 right-4 z-40 bg-slate-800 rounded-xl border border-slate-700 p-4 shadow-lg shadow-black/20" style={{ bottom: "calc(5rem + env(safe-area-inset-bottom, 0px))" }}>
      <p className="text-xs text-slate-300 leading-relaxed mb-3">
        PrimeOS uses cookies and collects data to operate. By continuing, you agree to our{" "}
        <Link href="/privacy" className="text-blue-400 underline">Privacy Policy</Link>
        {" "}and{" "}
        <Link href="/terms" className="text-blue-400 underline">Terms of Service</Link>.
      </p>
      <button
        onClick={handleDismiss}
        className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors"
      >
        Got it
      </button>
    </div>
  );
}
