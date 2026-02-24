"use client";

import { useState, useEffect } from "react";
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
import { useRouter } from "next/navigation";

export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const router = useRouter();

  useEffect(() => {
    setNotifications(generateNotifications());
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

  return (
    <>
      {/* Bell icon with badge */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="relative p-1.5 rounded-lg hover:bg-slate-700/50 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-4 h-4 text-slate-400" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 flex items-center justify-center rounded-full bg-red-500 text-[10px] text-white font-bold px-1">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Drawer */}
      {isOpen && (
        <>
          <div className="fixed inset-0 bg-black/60 z-50" onClick={() => setIsOpen(false)} />
          <div className="fixed inset-y-0 right-0 w-full max-w-sm z-50 bg-slate-900 border-l border-slate-700 flex flex-col animate-slide-left" style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}>
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
                        className={`w-full text-left p-4 flex gap-3 transition-colors hover:bg-slate-800/50 ${!n.is_read ? "bg-slate-800/30" : ""}`}
                      >
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${!n.is_read ? "bg-slate-700" : "bg-slate-800"}`}
                        >
                          <Icon className={`w-4 h-4 ${n.icon_color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-sm font-medium truncate ${!n.is_read ? "text-white" : "text-slate-400"}`}
                            >
                              {n.title}
                            </span>
                            {!n.is_read && (
                              <div className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0" />
                            )}
                          </div>
                          <p
                            className={`text-xs mt-0.5 line-clamp-2 ${!n.is_read ? "text-slate-300" : "text-slate-500"}`}
                          >
                            {n.message}
                          </p>
                          <span className="text-[10px] text-slate-600 mt-1 block">
                            {formatNotificationTime(n.created_at)}
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
      )}
    </>
  );
}
