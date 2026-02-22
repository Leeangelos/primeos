"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { EducationInfoIcon } from "@/src/components/education/InfoIcon";
import { SEED_MARKETING_CAMPAIGNS, type SeedMarketingCampaign } from "@/src/lib/seed-data";

const PLATFORMS: Record<string, string> = {
  facebook: "Meta/Facebook",
  google: "Google Ads",
  doordash: "DoorDash",
  referral: "Referral",
};

function roasGrade(roas: number): "green" | "yellow" | "red" {
  if (roas > 3) return "green";
  if (roas >= 2) return "yellow";
  return "red";
}

function roasClass(roas: number): string {
  const g = roasGrade(roas);
  if (g === "green") return "bg-emerald-500/20 text-emerald-400 border-emerald-500/40";
  if (g === "yellow") return "bg-amber-500/20 text-amber-400 border-amber-500/40";
  return "bg-red-500/20 text-red-400 border-red-500/40";
}

function fmtDollars(n: number): string {
  return "$" + n.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

export default function MarketingPage() {
  const campaigns = SEED_MARKETING_CAMPAIGNS;

  const summary = useMemo(() => {
    const totalSpend = campaigns.reduce((s, c) => s + c.spend, 0);
    const totalRevenue = campaigns.reduce((s, c) => s + c.revenue, 0);
    const blendedRoas = totalSpend > 0 ? totalRevenue / totalSpend : 0;
    return { totalSpend, totalRevenue, blendedRoas };
  }, [campaigns]);

  return (
    <div className="space-y-4 min-w-0 overflow-x-hidden pb-24">
      <div className="dashboard-toolbar p-3 sm:p-5 space-y-3">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold sm:text-2xl">Ad Accountability</h1>
          <EducationInfoIcon metricKey="marketing_roas" />
        </div>
        <p className="text-xs text-muted">
          Every dollar in. Every dollar out. ROAS by campaign.
        </p>
      </div>

      {/* Summary at top */}
      <div className="px-3 sm:px-5">
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4 min-w-0">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <div className="text-slate-400 text-xs uppercase tracking-wide mb-1">
                Total spend this month
              </div>
              <div className="text-xl font-bold text-white tabular-nums">
                {fmtDollars(summary.totalSpend)}
              </div>
            </div>
            <div>
              <div className="text-slate-400 text-xs uppercase tracking-wide mb-1">
                Total attributed revenue
              </div>
              <div className="text-xl font-bold text-emerald-400 tabular-nums">
                {fmtDollars(summary.totalRevenue)}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-slate-400 text-xs uppercase tracking-wide mb-1">
                Blended ROAS
                <EducationInfoIcon metricKey="marketing_roas" />
              </div>
              <div
                className={cn(
                  "text-xl font-bold tabular-nums",
                  roasGrade(summary.blendedRoas) === "green"
                    ? "text-emerald-400"
                    : roasGrade(summary.blendedRoas) === "yellow"
                      ? "text-amber-400"
                      : "text-red-400"
                )}
              >
                {summary.blendedRoas.toFixed(1)}x
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Campaign cards */}
      <div className="px-3 sm:px-5 space-y-3">
        <h2 className="text-sm font-medium text-slate-400 px-1">Campaigns</h2>
        {campaigns.map((c: SeedMarketingCampaign) => (
          <div
            key={c.id}
            className="rounded-xl border border-slate-700 bg-slate-800/50 p-4 min-w-0"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-bold text-white truncate">{c.name}</p>
                <p className="text-slate-400 text-sm mt-0.5">
                  {PLATFORMS[c.platform] || c.platform}
                </p>
              </div>
              <span
                className={cn(
                  "shrink-0 text-xs font-semibold tabular-nums px-2.5 py-1 rounded-lg border",
                  roasClass(c.roas)
                )}
              >
                {c.roas.toFixed(1)}x ROAS
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm">
              <span className="text-slate-300">
                <span className="text-slate-500">Spend:</span> {fmtDollars(c.spend)}
              </span>
              <span className="text-slate-300">
                <span className="text-slate-500">Revenue attributed:</span>{" "}
                <span className="text-emerald-400 font-medium">{fmtDollars(c.revenue)}</span>
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
