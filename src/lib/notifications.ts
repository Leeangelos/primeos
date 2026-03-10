"use client";

export interface AppNotification {
  id: string;
  store_id: string;
  type: "red_kpi" | "missing_entry" | "vendor_increase" | "overtime_risk" | "invoice_alert" | "data_gap" | "system" | "win";
  title: string;
  message: string;
  link: string;
  is_read: boolean;
  created_at: string;
  icon_color: string;
  /** Win notifications get green styling in the drawer */
  isWin?: boolean;
  /** When set, show this instead of formatNotificationTime(created_at) */
  displayTime?: string;
}

export type AlertItem = {
  id: string;
  store_id: string;
  store_name: string;
  type: "red_kpi" | "vendor_increase" | "invoice_alert";
  title: string;
  message: string;
  link: string;
  icon_color: string;
  created_at: string;
};

export async function generateNotifications(): Promise<AppNotification[]> {
  try {
    const res = await fetch("/api/notifications/alerts");
    if (!res.ok) return [];
    const { alerts } = (await res.json()) as { alerts?: AlertItem[] };
    const list = alerts ?? [];
    return list.map((a) => ({
      id: a.id,
      store_id: a.store_id,
      type: a.type,
      title: a.title,
      message: a.message,
      link: a.link,
      is_read: false,
      created_at: a.created_at,
      icon_color: a.icon_color,
    }));
  } catch {
    return [];
  }
}

export function formatNotificationTime(isoString: string): string {
  const now = new Date();
  const date = new Date(isoString);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  return `${diffDays}d ago`;
}
