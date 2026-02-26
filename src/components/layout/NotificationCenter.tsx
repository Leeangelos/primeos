"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Bell,
  X,
  AlertTriangle,
  TrendingUp,
  Clock,
  FileWarning,
  Server,
  ChevronRight,
} from "lucide-react";
import {
  generateNotifications,
  formatNotificationTime,
  AppNotification,
} from "@/src/lib/notifications";
import { SEED_WINS } from "@/src/lib/win-engine";
import { useRouter } from "next/navigation";

function winDateToIso(dateStr: string): string {
  const now = new Date();
  if (dateStr === "Today") return now.toISOString();
  if (dateStr === "Yesterday") return new Date(now.getTime() - 86400000).toISOString();
  const match = dateStr.match(/^(\d+) days ago$/);
  if (match) return new Date(now.getTime() - parseInt(match[1], 10) * 86400000).toISOString();
  return now.toISOString();
}

export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const regular = generateNotifications();
    const winNotifications: AppNotification[] = SEED_WINS.map((win) => ({
      id: win.id,
      store_id: win.storeId ?? "kent",
      type: "win" as const,
      title: win.title,
      message: win.body.length > 80 ? win.body.slice(0, 77) + "..." : win.body,
      link: "/",
      is_read: false,
      created_at: winDateToIso(win.date),
      icon_color: "text-emerald-400",
      isWin: true,
      displayTime: win.date,
    }));
    const combined = [...winNotifications, ...regular].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    setNotifications(combined);
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const markAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const handleTap = (notification: AppNotification) => {
    markAsRead(notification.id);
    setIsOpen(false);
    router.push(notification.link);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "red_kpi":
        return AlertTriangle;
      case "missing_entry":
        return Clock;
      case "vendor_increase":
        return TrendingUp;
      case "overtime_risk":
        return Clock;
      case "invoice_alert":
        return FileWarning;
      case "data_gap":
        return Server;
      default:
        return Bell;
    }
  };

  const drawerContent = isOpen && mounted && typeof document !== "undefined" ? (
    <>
      <div
        className="fixed inset-0 bg-black/60 z-[100]"
        onClick={() => setIsOpen(false)}
        aria-hidden
      />
      <div
        className="fixed inset-y-0 right-0 w-full sm:w-80 sm:max-w-[20rem] z-[100] bg-slate-900 border-l border-slate-700 flex flex-col animate-slide-left"
        style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
        role="dialog"
        aria-label="Notifications"
      >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-white" />
                <h2 className="text-base font-semibold text-white">Notifications</h2>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-xs font-medium">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllAsRead}
                    className="text-xs text-blue-400 hover:text-blue-300"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1 text-slate-500 hover:text-slate-300"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Notification list */}
            <div className="flex-1 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-slate-500">
                  <Bell className="w-8 h-8 mb-2 opacity-30" />
                  <p className="text-sm">No notifications</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-800">
                  {notifications.map((n) => {
                    const Icon = getIcon(n.type);
                    return (
                      <button
                        key={n.id}
                        type="button"
                        onClick={() => handleTap(n)}
                        className={`w-full text-left p-4 flex gap-3 transition-colors hover:bg-slate-800/50 ${
                          n.isWin ? "bg-emerald-600/10 border-l-2 border-emerald-700/30" : ""
                        } ${!n.is_read && !n.isWin ? "bg-slate-800/30" : ""}`}
                      >
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            n.isWin ? "bg-emerald-600/20" : !n.is_read ? "bg-slate-700" : "bg-slate-800"
                          }`}
                        >
                          {n.isWin ? (
                            <span className="text-base" role="img" aria-label="Win">🎉</span>
                          ) : (
                            <Icon className={`w-4 h-4 ${n.icon_color}`} />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-sm font-medium truncate ${!n.is_read ? "text-white" : "text-slate-400"}`}
                            >
                              {n.title}
                            </span>
                            {!n.is_read && !n.isWin && (
                              <div className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0" />
                            )}
                          </div>
                          <p
                            className={`text-xs mt-0.5 line-clamp-2 ${!n.is_read ? "text-slate-300" : "text-slate-500"}`}
                          >
                            {n.message}
                          </p>
                          <span className="text-[10px] text-slate-600 mt-1 block">
                            {n.displayTime ?? formatNotificationTime(n.created_at)}
                          </span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-600 flex-shrink-0 mt-1" />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>
  ) : null;

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="relative min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-slate-700/50 transition-colors touch-manipulation"
        aria-label="Notifications"
        aria-expanded={isOpen}
      >
        <Bell className="w-4 h-4 text-slate-400" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 flex items-center justify-center rounded-full bg-red-500 text-[10px] text-white font-bold px-1">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>
      {drawerContent && createPortal(drawerContent, document.body)}
    </>
  );
}
