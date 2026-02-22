"use client";

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { EducationInfoIcon } from "@/src/components/education/InfoIcon";
import { SEED_DOORDASH } from "@/src/lib/seed-data";
import { cn } from "@/lib/utils";

function fmt(n: number): string {
  return n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${Math.round(n)}`;
}

export default function DoorDashPage() {
  const data = SEED_DOORDASH;

  const totalRevenue = data.reduce((s, d) => s + d.gross_sales, 0);
  const totalCommission = data.reduce((s, d) => s + d.commission_dollars, 0);
  const effectiveCommissionPct = totalRevenue > 0 ? (totalCommission / totalRevenue) * 100 : 0;
  const netRevenue = data.reduce((s, d) => s + d.net_revenue, 0);

  const commissionGrade = effectiveCommissionPct < 20 ? "green" : effectiveCommissionPct <= 25 ? "yellow" : "red";

  const chartData = useMemo(() => {
    return data.map((d) => ({
      date: d.date,
      label: new Date(d.date + "T12:00:00Z").toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      revenue: d.gross_sales,
      commission: d.commission_dollars,
    }));
  }, [data]);

  return (
    <div className="space-y-5">
      <div className="dashboard-toolbar p-3 sm:p-5 space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-lg font-semibold sm:text-2xl">DoorDash Economics</h1>
          <EducationInfoIcon metricKey="doordash_effective_commission" />
        </div>
        <p className="text-xs text-muted">What you really keep after DoorDash takes their cut.</p>
      </div>

      {/* Summary card */}
      <div className="rounded-xl border border-border bg-black/20 p-4 space-y-4">
        <div className="text-[10px] uppercase text-muted tracking-wider">30-day summary</div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-[9px] uppercase text-muted">DoorDash Revenue</div>
            <div className="text-xl font-bold tabular-nums text-white">{fmt(totalRevenue)}</div>
          </div>
          <div>
            <div className="text-[9px] uppercase text-muted">Commission Paid</div>
            <div className="text-xl font-bold tabular-nums text-red-400">−{fmt(totalCommission)}</div>
          </div>
          <div>
            <div className="text-[9px] uppercase text-muted flex items-center gap-1">
              Effective Commission %
              <EducationInfoIcon metricKey="doordash_effective_commission" size="sm" />
            </div>
            <div
              className={cn(
                "text-xl font-bold tabular-nums",
                commissionGrade === "green" && "text-emerald-400",
                commissionGrade === "yellow" && "text-amber-400",
                commissionGrade === "red" && "text-red-400"
              )}
            >
              {effectiveCommissionPct.toFixed(1)}%
            </div>
            <div className="text-[10px] text-muted mt-0.5">
              {commissionGrade === "green" && "Strong (<20%)"}
              {commissionGrade === "yellow" && "OK (20–25%)"}
              {commissionGrade === "red" && "High (>25%)"}
            </div>
          </div>
          <div>
            <div className="text-[9px] uppercase text-muted">Net Revenue</div>
            <div className="text-xl font-bold tabular-nums text-emerald-400">{fmt(netRevenue)}</div>
          </div>
        </div>
      </div>

      {/* Trend chart: last 30 days revenue vs commission */}
      <div className="rounded-xl border border-border bg-black/20 p-4 min-w-0">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted mb-3">
          Last 30 days — DoorDash revenue vs commission
        </h2>
        <div className="w-full h-[260px] min-h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
              <XAxis dataKey="label" tick={{ fontSize: 9, fill: "#94a3b8" }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} tickFormatter={(v) => (v >= 1000 ? `$${v / 1000}k` : `$${v}`)} width={36} />
              <Tooltip
                contentStyle={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "8px", padding: "8px 12px", fontSize: "12px" }}
                labelStyle={{ color: "#94a3b8", marginBottom: "4px" }}
                labelFormatter={(_, payload) => payload?.[0]?.payload?.date ?? ""}
                formatter={(value: number | undefined, name?: string) => [value != null ? fmt(value) : "—", name === "revenue" ? "Revenue" : "Commission"]}
              />
              <Legend formatter={(v) => (v === "revenue" ? "Revenue" : "Commission")} />
              <Bar dataKey="revenue" name="revenue" fill="rgb(34 197 94)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="commission" name="commission" fill="rgb(239 68 68)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* What DoorDash Really Costs You — key demo section */}
      <section className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 space-y-3">
        <h2 className="text-sm font-semibold text-amber-400 flex items-center gap-2">
          What DoorDash Really Costs You
          <EducationInfoIcon metricKey="doordash_effective_commission" size="sm" />
        </h2>
        <p className="text-xs text-muted leading-relaxed">
          The number on your statement is only part of it. <strong className="text-white">True cost</strong> includes:
        </p>
        <ul className="text-xs text-muted space-y-1.5 list-disc list-inside">
          <li><strong className="text-white">Commission</strong> — delivery fee + % of order (often 18–25%)</li>
          <li><strong className="text-white">Packaging</strong> — extra boxes, bags, napkins, utensils for delivery</li>
          <li><strong className="text-white">Tablet & POS fees</strong> — hardware and integration costs</li>
          <li><strong className="text-white">Marketing</strong> — promoted listings, boosts, and promos</li>
        </ul>
        <p className="text-xs text-muted leading-relaxed">
          Many operators only look at commission. Add packaging and ad spend and your <strong className="text-amber-400">true cost can be 28–35%</strong> of DoorDash revenue. Know your all-in number so you can push direct ordering and keep 100% where it matters.
        </p>
      </section>
    </div>
  );
}
