"use client";

import { useState, useEffect } from "react";
import { Smartphone, X } from "lucide-react";

export function AddToHomeScreenPrompt() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const dismissed = localStorage.getItem("primeos-a2hs-dismissed");
    const tosAccepted = localStorage.getItem("primeos-tos-accepted");

    // Only show after TOS accepted, not dismissed, and not already in standalone mode
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as { standalone?: boolean }).standalone === true;

    if (!dismissed && tosAccepted === "1.0" && !isStandalone) {
      // Delay so it doesn't compete with notification prompt
      const timer = setTimeout(() => setShow(true), 5000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem("primeos-a2hs-dismissed", "true");
    setShow(false);
  };

  if (!show) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-50" onClick={handleDismiss} aria-hidden />
      <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 bg-slate-800 rounded-2xl border border-slate-700 shadow-xl shadow-black/30 overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-4 pb-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E65100]/20 flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-[#E65100]" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Add PrimeOS to Your Home Screen</h3>
              <p className="text-xs text-slate-400">Opens full screen, just like a real app</p>
            </div>
          </div>
          <button type="button" onClick={handleDismiss} className="p-1 text-slate-600 hover:text-slate-400" aria-label="Dismiss">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          {/* iPhone instructions */}
          <div className="bg-slate-700/50 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm">🍎</span>
              <h4 className="text-xs font-semibold text-white">iPhone</h4>
            </div>
            <div className="space-y-1.5 text-xs text-slate-300">
              <p><span className="text-white font-medium">1.</span> Tap the <span className="text-white font-medium">Share</span> button <span className="text-slate-500">(square with arrow, bottom of screen)</span></p>
              <p><span className="text-white font-medium">2.</span> Scroll down → <span className="text-white font-medium">Add to Home Screen</span></p>
              <p><span className="text-white font-medium">3.</span> Tap <span className="text-white font-medium">Add</span></p>
            </div>
          </div>

          {/* Android instructions */}
          <div className="bg-slate-700/50 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm">🤖</span>
              <h4 className="text-xs font-semibold text-white">Android</h4>
            </div>
            <div className="space-y-1.5 text-xs text-slate-300">
              <p><span className="text-white font-medium">1.</span> Tap the <span className="text-white font-medium">⋮ menu</span> <span className="text-slate-500">(top right)</span></p>
              <p><span className="text-white font-medium">2.</span> Tap <span className="text-white font-medium">Add to Home screen</span></p>
              <p><span className="text-white font-medium">3.</span> Tap <span className="text-white font-medium">Add</span></p>
            </div>
          </div>

          {/* Got it button */}
          <button type="button" onClick={handleDismiss} className="w-full py-3 rounded-xl bg-[#E65100] hover:bg-orange-600 text-white text-sm font-semibold transition-colors">
            Got it
          </button>
        </div>
      </div>
    </>
  );
}
