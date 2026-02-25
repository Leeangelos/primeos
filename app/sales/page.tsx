"use client";

import { useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { cn } from "@/lib/utils";
import { EducationInfoIcon } from "@/src/components/education/InfoIcon";
import { ExportButton } from "@/src/components/ui/ExportButton";
import { formatPct } from "@/src/lib/formatters";
import {
  SEED_DAILY_KPIS,
  SEED_SALES_CHANNEL_PCT,
} from "@/src/lib/seed-data";

type PeriodKey = "this_week" | "last_week" | "this_month" | "custom";

function getMondayBefore(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00Z");
  const day = d.getUTCDay();
  const diff = day === 0 ? 6 : day - 1;
  d.setUTCDate(d.getUTCDate() - diff);
  return d.toISOString().slice(0, 10);
}

function getPeriodRange(key: PeriodKey): { start: string; end: string; label: string } {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);

  if (key === "this_week") {
    const mon = getMondayBefore(today);
    return { start: mon, end: yesterdayStr, label: "This Week" };
  }
  if (key === "last_week") {
    const thisMon = getMondayBefore(today);
    const monDate = new Date(thisMon + "T12:00:00Z");
    monDate.setUTCDate(monDate.getUTCDate() - 7);
    const lastMon = monDate.toISOString().slice(0, 10);
    const lastSun = new Date(monDate);
    lastSun.setUTCDate(lastSun.getUTCDate() + 6);
    const lastSunStr = lastSun.toISOString().slice(0, 10);
    return { start: lastMon, end: lastSunStr, label: "Last Week" };
  }
  if (key === "this_month") {
    const y = now.getFullYear();
    const m = now.getMonth();
    const first = `${y}-${String(m + 1).padStart(2, "0")}-01`;
    return { start: first, end: yesterdayStr, label: "This Month" };
  }
  // custom = last 7 days
  const end = new Date(now);
  end.setDate(end.getDate() - 1);
  const start = new Date(end);
  start.setDate(start.getDate() - 6);
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
    label: "Last 7 Days",
  };
}

function getComparisonRange(key: PeriodKey): { start: string; end: string; label: string } | null {
  if (key === "this_week") return getPeriodRange("last_week");
  if (key === "last_week") {
    const r = getPeriodRange("last_week");
    const mon = new Date(r.start + "T12:00:00Z");
    mon.setUTCDate(mon.getUTCDate() - 7);
    const end = new Date(mon);
    end.setUTCDate(end.getUTCDate() + 6);
    return {
      start: mon.toISOString().slice(0, 10),
      end: end.toISOString().slice(0, 10),
      label: "Prior Week",
    };
  }
  if (key === "this_month") {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth() - 1;
    const lastMonth = m < 0 ? 11 : m;
    const lastYear = m < 0 ? y - 1 : y;
    const first = `${lastYear}-${String(lastMonth + 1).padStart(2, "0")}-01`;
    const lastDay = new Date(lastYear, lastMonth + 1, 0).getDate();
    const end = `${lastYear}-${String(lastMonth + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
    return { start: first, end, label: "Last Month" };
  }
  // custom: compare to the 7 days before the current custom range
  const r = getPeriodRange("custom");
  const rangeStart = new Date(r.start + "T12:00:00Z");
  const compEnd = new Date(rangeStart);
  compEnd.setUTCDate(compEnd.getUTCDate() - 1);
  const compStart = new Date(compEnd);
  compStart.setUTCDate(compStart.getUTCDate() - 6);
  return {
    start: compStart.toISOString().slice(0, 10),
    end: compEnd.toISOString().slice(0, 10),
    label: "Prior 7 Days",
  };
}

function fmt(n: number): string {
  return "$" + n.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

const PERIODS: { key: PeriodKey; label: string }[] = [
  { key: "this_week", label: "This Week" },
  { key: "last_week", label: "Last Week" },
  { key: "this_month", label: "This Month" },
  { key: "custom", label: "Custom" },
];

const CHANNEL_LABELS: Record<string, string> = {
  dine_in: "Dine-in",
  pickup: "Pickup",
  delivery: "Delivery",
  doordash: "DoorDash",
};

export default function SalesPage() {
  const [period, setPeriod] = useState<PeriodKey>("this_week");

  const { start, end, label } = useMemo(() => getPeriodRange(period), [period]);

  const dailyRows = useMemo(() => {
    return SEED_DAILY_KPIS.filter(
      (r) => r.date >= start && r.date <= end && r.store_id === "kent"
    ).sort((a, b) => a.date.localeCompare(b.date));
  }, [start, end]);

  const totalSales = useMemo(() => dailyRows.reduce((s, r) => s + r.sales, 0), [dailyRows]);
  const dayCount = dailyRows.length;
  const avgDaily = dayCount > 0 ? Math.round(totalSales / dayCount) : 0;
  const bestDay = dailyRows.length
    ? dailyRows.reduce((best, r) => (r.sales > best.sales ? r : best), dailyRows[0])
    : null;
  const worstDay = dailyRows.length
    ? dailyRows.reduce((worst, r) => (r.sales < worst.sales ? r : worst), dailyRows[0])
    : null;

  const comparisonRange = useMemo(() => getComparisonRange(period), [period]);
  const comparisonRows = useMemo(() => {
    if (!comparisonRange) return [];
    return SEED_DAILY_KPIS.filter(
      (r) =>
        r.date >= comparisonRange.start &&
        r.date <= comparisonRange.end &&
        r.store_id === "kent"
    );
  }, [comparisonRange]);
  const comparisonTotal = useMemo(
    () => comparisonRows.reduce((s, r) => s + r.sales, 0),
    [comparisonRows]
  );
  const changePct =
    comparisonTotal > 0 && totalSales > 0
      ? Math.round(((totalSales - comparisonTotal) / comparisonTotal) * 1000) / 10
      : null;

  const chartData = useMemo(
    () =>
      dailyRows.map((r) => ({
        date: r.date,
        label: new Date(r.date + "T12:00:00Z").toLocaleDateString("en-US", {
          weekday: "short",
          month: "numeric",
          day: "numeric",
        }),
        sales: r.sales,
      })),
    [dailyRows]
  );

  const channelBreakdown = useMemo(() => {
    if (totalSales <= 0) return [];
    return Object.entries(SEED_SALES_CHANNEL_PCT).map(([key, pct]) => ({
      channel: CHANNEL_LABELS[key] || key,
      pct,
      amount: Math.round((totalSales * pct) / 100),
    }));
  }, [totalSales]);

  return (
    <div className="space-y-4 min-w-0 overflow-x-hidden pb-28">
      <div className="dashboard-toolbar p-3 sm:p-5 space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold sm:text-2xl">Sales Report</h1>
            <EducationInfoIcon metricKey="daily_sales" />
          </div>
          <ExportButton
          pageName="Sales Report"
          getData={() => ({
            headers: ["Date", "Sales"],
            rows: dailyRows.map((r) => [r.date, String(r.sales)]),
          })}
        />
        </div>
        <p className="text-xs text-muted">Daily sales and comparison by period.</p>

        {/* Date range selector */}
        <div className="flex flex-wrap gap-2">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => setPeriod(p.key)}
              className={cn(
                "min-h-[44px] rounded-lg border px-3 py-2 text-sm font-medium transition-colors shrink-0",
                period === p.key
                  ? "border-brand/50 bg-brand/15 text-brand"
                  : "border-border/50 bg-black/30 text-muted hover:border-border hover:bg-black/40"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary card: Total Sales, Avg Daily, Best Day, Worst Day */}
      <div className="px-3 sm:px-5">
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4 min-w-0">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-1.5 text-slate-400 text-xs uppercase tracking-wide mb-1">
                Total Sales
                <EducationInfoIcon metricKey="daily_sales" />
              </div>
              <div className="text-xl font-bold text-emerald-400 tabular-nums">{fmt(totalSales)}</div>
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-slate-400 text-xs uppercase tracking-wide mb-1">
                Avg Daily
                <EducationInfoIcon metricKey="avg_daily_sales" size="sm" />
              </div>
              <div className="text-xl font-bold text-white tabular-nums">{fmt(avgDaily)}</div>
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-slate-400 text-xs uppercase tracking-wide mb-1">
                Best Day
                <EducationInfoIcon metricKey="daily_sales" size="sm" />
              </div>
              <div className="text-lg font-semibold text-emerald-400 tabular-nums">
                {bestDay
                  ? `${new Date(bestDay.date + "T12:00:00Z").toLocaleDateString("en-US", { weekday: "short" })} ${fmt(bestDay.sales)}`
                  : "—"}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-slate-400 text-xs uppercase tracking-wide mb-1">
                Worst Day
                <EducationInfoIcon metricKey="daily_sales" size="sm" />
              </div>
              <div className="text-lg font-semibold text-red-400 tabular-nums">
                {worstDay
                  ? `${new Date(worstDay.date + "T12:00:00Z").toLocaleDateString("en-US", { weekday: "short" })} ${fmt(worstDay.sales)}`
                  : "—"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Comparison: vs Last Week / vs Same Period Last Month */}
      {comparisonRange && changePct != null && (
        <div className="px-3 sm:px-5">
          <div className="rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3 min-w-0 flex items-center justify-between gap-2">
            <span className="text-sm text-slate-400">
              vs {comparisonRange.label}
            </span>
            <span
              className={cn(
                "text-sm font-semibold tabular-nums",
                changePct > 0 ? "text-emerald-400" : changePct < 0 ? "text-red-400" : "text-slate-400"
              )}
            >
              {(changePct > 0 ? "+" : "") + formatPct(changePct)}
            </span>
          </div>
        </div>
      )}

      {/* Bar chart — daily sales */}
      <div className="px-3 sm:px-5">
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4 min-w-0">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
            Daily Sales — {label}
          </h2>
          <div className="w-full h-[280px] min-h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 8, right: 8, left: 8, bottom: 8 }}
              >
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: "#94a3b8" }}
                  interval={0}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "#94a3b8" }}
                  tickFormatter={(v) => (v >= 1000 ? `$${v / 1000}k` : `$${v}`)}
                  width={36}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "1px solid #334155",
                    borderRadius: "8px",
                    padding: "8px 12px",
                    fontSize: "12px",
                  }}
                  labelStyle={{ color: "#94a3b8", marginBottom: "4px" }}
                  formatter={(value: number | undefined) => [value != null ? fmt(value) : "—", "Sales"]}
                  labelFormatter={(_, payload) =>
                    payload?.[0]?.payload?.date ?? ""
                  }
                />
                <Bar dataKey="sales" radius={[4, 4, 0, 0]}>
                  {chartData.map((_, i) => (
                    <Cell key={i} fill="rgb(59, 130, 246)" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Breakdown by order type */}
      {channelBreakdown.length > 0 && (
        <div className="px-3 sm:px-5">
          <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4 min-w-0">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
              By order type
            </h2>
            <ul className="space-y-2">
              {channelBreakdown.map((row) => (
                <li
                  key={row.channel}
                  className="flex justify-between items-center text-sm"
                >
                  <span className="text-slate-300">{row.channel}</span>
                  <span className="text-white font-medium tabular-nums">
                    {fmt(row.amount)} <span className="text-slate-500 font-normal">({formatPct(row.pct)})</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
