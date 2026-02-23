"use client";

import { useState, useEffect } from "react";
import { Bell, X } from "lucide-react";

export function NotificationPrompt() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem("primeos-notification-prompt-dismissed");
    const tosAccepted = localStorage.getItem("primeos-tos-accepted");

    if (
      !dismissed &&
      tosAccepted === "1.0" &&
      typeof window !== "undefined" &&
      "Notification" in window &&
      Notification.permission === "default"
    ) {
      const timer = setTimeout(() => setShow(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleEnable = async () => {
    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        if ("serviceWorker" in navigator) {
          await navigator.serviceWorker.register("/sw.js");
        }
        new Notification("PrimeOS", {
          body: "Notifications enabled! You'll get your Morning Brief at 7am daily.",
          icon: "/icon.svg",
        });
      }
    } catch (e) {
      console.error("Notification setup failed:", e);
    }
    localStorage.setItem("primeos-notification-prompt-dismissed", "true");
    setShow(false);
  };

  const handleDismiss = () => {
    localStorage.setItem("primeos-notification-prompt-dismissed", "true");
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed top-14 left-4 right-4 z-50 bg-slate-800 rounded-xl border border-slate-700 p-4 shadow-lg shadow-black/30 animate-slide-up">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center flex-shrink-0">
          <Bell className="w-5 h-5 text-blue-400" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-white mb-1">Turn on notifications?</h3>
          <p className="text-xs text-slate-400 leading-relaxed mb-3">
            Get your Morning Brief every day at 7am. We&apos;ll also alert you when any KPI grades red so you can catch it early.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleEnable}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors"
            >
              Enable Notifications
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              className="px-4 py-2 rounded-lg bg-slate-700 text-slate-400 text-xs font-medium transition-colors"
            >
              Not Now
            </button>
          </div>
        </div>
        <button type="button" onClick={handleDismiss} className="text-slate-600 hover:text-slate-400" aria-label="Dismiss">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
