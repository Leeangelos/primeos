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

function hoursAgo(now: Date, h: number): string {
  return new Date(now.getTime() - h * 3600000).toISOString();
}
function daysAgo(now: Date, d: number): string {
  return new Date(now.getTime() - d * 86400000).toISOString();
}

export function generateNotifications(): AppNotification[] {
  const now = new Date();
  const notifications: AppNotification[] = [];

  notifications.push({
    id: "n-1",
    store_id: "aurora",
    type: "red_kpi",
    title: "Food Cost RED — Aurora",
    message: "LeeAngelo's Aurora food cost hit 32.8% yesterday. Industry benchmark is under 30%. This is the 3rd consecutive day above that benchmark.",
    link: "/daily",
    is_read: false,
    created_at: hoursAgo(now, 2),
    icon_color: "text-red-400",
  });

  notifications.push({
    id: "n-2",
    store_id: "kent",
    type: "red_kpi",
    title: "PRIME Cost Yellow — Kent",
    message: "LeeAngelo's Kent PRIME cost is 53.9%. While not red, it's been trending up for 4 days. Consider reviewing labor scheduling.",
    link: "/daily",
    is_read: false,
    created_at: hoursAgo(now, 3),
    icon_color: "text-amber-400",
  });

  notifications.push({
    id: "n-3",
    store_id: "lindseys",
    type: "missing_entry",
    title: "Missing Daily Entry — Lindsey's",
    message: "No KPI entry for Lindsey's yesterday. Tap to enter numbers now.",
    link: "/daily",
    is_read: false,
    created_at: hoursAgo(now, 8),
    icon_color: "text-amber-400",
  });

  notifications.push({
    id: "n-4",
    store_id: "kent",
    type: "vendor_increase",
    title: "Hillcrest Invoice +9.2% — Kent",
    message: "February Hillcrest invoice is $15,400 vs $14,100 in January. That's a $1,300 increase. Consider requesting an itemized breakdown.",
    link: "/vendor-tracker",
    is_read: false,
    created_at: hoursAgo(now, 6),
    icon_color: "text-red-400",
  });

  notifications.push({
    id: "n-5",
    store_id: "kent",
    type: "vendor_increase",
    title: "Ohio Edison Up 1.5% — Kent",
    message: "Electric bill is $1,360 vs $1,340 last month. Within normal range — no action needed.",
    link: "/vendor-tracker",
    is_read: true,
    created_at: daysAgo(now, 2),
    icon_color: "text-slate-400",
  });

  notifications.push({
    id: "n-6",
    store_id: "kent",
    type: "overtime_risk",
    title: "Marcus Approaching Overtime — Kent",
    message: "Marcus Rivera has 36.5 hours through Wednesday. At current pace he'll hit 43 hours by Sunday. Consider adjusting Friday/Saturday schedule.",
    link: "/schedule",
    is_read: false,
    created_at: hoursAgo(now, 4),
    icon_color: "text-amber-400",
  });

  notifications.push({
    id: "n-7",
    store_id: "kent",
    type: "invoice_alert",
    title: "Mozzarella Price Up 8% — Kent",
    message: "Hillcrest invoice shows Grande mozzarella at $3.42/lb vs $3.17/lb last order. Consider checking if this is a temporary spike or a new price.",
    link: "/invoices",
    is_read: false,
    created_at: daysAgo(now, 1),
    icon_color: "text-red-400",
  });

  notifications.push({
    id: "n-8",
    store_id: "aurora",
    type: "data_gap",
    title: "3-Day Data Gap — Aurora",
    message: "No daily KPI entries for Aurora from Feb 18-20. Gaps in data reduce the accuracy of weekly trends and AI briefs.",
    link: "/daily",
    is_read: false,
    created_at: daysAgo(now, 1),
    icon_color: "text-amber-400",
  });

  notifications.push({
    id: "n-9",
    store_id: "kent",
    type: "system",
    title: "Weekly Snapshot Ready — Kent",
    message: "Your Week 8 cockpit is ready. Sales up 4.2% vs last week. Tap to review.",
    link: "/weekly",
    is_read: true,
    created_at: daysAgo(now, 1),
    icon_color: "text-blue-400",
  });

  notifications.push({
    id: "n-10",
    store_id: "kent",
    type: "system",
    title: "Food Cost Improved — Kent",
    message: "Kent food cost dropped from 30.1% to 29.4% this week. The portioning check worked. Keep it up.",
    link: "/weekly",
    is_read: true,
    created_at: daysAgo(now, 3),
    icon_color: "text-emerald-400",
  });

  notifications.push({
    id: "n-11",
    store_id: "aurora",
    type: "vendor_increase",
    title: "DoorDash Fees Up 12% — Aurora",
    message: "DoorDash commission was $1,420 this month vs $1,270 last month. Delivery order volume is up but so is the effective commission rate.",
    link: "/vendor-tracker",
    is_read: false,
    created_at: hoursAgo(now, 10),
    icon_color: "text-red-400",
  });

  notifications.push({
    id: "n-12",
    store_id: "lindseys",
    type: "red_kpi",
    title: "Delivery Mix High — Lindsey's",
    message: "Lindsey's delivery mix hit 38% yesterday. High delivery mix increases packaging costs and commission exposure. Target: under 30%.",
    link: "/doordash",
    is_read: false,
    created_at: hoursAgo(now, 5),
    icon_color: "text-amber-400",
  });

  return notifications.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
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
