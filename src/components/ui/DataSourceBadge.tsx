"use client";

interface DataSourceBadgeProps {
  source: "google" | "yelp" | "public-records" | "foodtec" | "hillcrest" | "manual";
  lastUpdated?: string;
}

const SOURCE_CONFIG: Record<
  DataSourceBadgeProps["source"],
  { label: string; color: string; bg: string; border: string }
> = {
  google: { label: "Google Places", color: "text-blue-400", bg: "bg-blue-600/10", border: "border-blue-700/20" },
  yelp: { label: "Yelp", color: "text-red-400", bg: "bg-red-600/10", border: "border-red-700/20" },
  "public-records": { label: "Public Records", color: "text-slate-400", bg: "bg-slate-600/10", border: "border-slate-700/20" },
  foodtec: { label: "FoodTec POS", color: "text-emerald-400", bg: "bg-emerald-600/10", border: "border-emerald-700/20" },
  hillcrest: { label: "Hillcrest Food Services", color: "text-amber-400", bg: "bg-amber-600/10", border: "border-amber-700/20" },
  manual: { label: "Manual Entry", color: "text-slate-400", bg: "bg-slate-600/10", border: "border-slate-700/20" },
};

export default function DataSourceBadge({ source, lastUpdated }: DataSourceBadgeProps) {
  const config = SOURCE_CONFIG[source];
  const dotColor = config.color.replace("text-", "bg-");
  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[9px] font-medium border ${config.bg} ${config.border}`}
    >
      <div className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      <span className={config.color}>{config.label}</span>
      {lastUpdated && <span className="text-slate-600">· {lastUpdated}</span>}
    </div>
  );
}
