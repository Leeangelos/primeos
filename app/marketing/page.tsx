"use client";

import { useState, useMemo } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/src/lib/auth-context";
import { isNewUser, getNewUserStoreName } from "@/src/lib/user-scope";
import { EducationInfoIcon } from "@/src/components/education/InfoIcon";
import { formatPct } from "@/src/lib/formatters";
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

function getWeekStart(): string {
  const d = new Date();
  d.setDate(d.getDate() - d.getDay() + 1);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getWeekEnd(): string {
  const d = new Date();
  d.setDate(d.getDate() - d.getDay() + 7);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

type DateRange = "daily" | "weekly" | "monthly" | "custom";

export default function MarketingPage() {
  const { session, loading } = useAuth();
  const newUser = isNewUser(session);
  const newUserStoreName = getNewUserStoreName(session);
  const campaigns = SEED_MARKETING_CAMPAIGNS;
  const [expandedCampaign, setExpandedCampaign] = useState<string | null>(null);
  const [range, setRange] = useState<DateRange>("monthly");
  const [customStart, setCustomStart] = useState("2026-02-01");
  const [customEnd, setCustomEnd] = useState("2026-02-22");

  const summary = useMemo(() => {
    const totalSpend = campaigns.reduce((s, c) => s + c.spend, 0);
    const totalRevenue = campaigns.reduce((s, c) => s + c.revenue, 0);
    const blendedRoas = totalSpend > 0 ? totalRevenue / totalSpend : 0;
    return { totalSpend, totalRevenue, blendedRoas };
  }, [campaigns]);

  if (loading) return <div className="min-h-screen bg-zinc-950" />;
  if (newUser) {
    return (
      <div className="space-y-4 min-w-0 overflow-x-hidden pb-28">
        <div className="dashboard-toolbar p-3 sm:p-5 space-y-3">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold sm:text-2xl">Ad Accountability</h1>
            <EducationInfoIcon metricKey="marketing_roas" />
          </div>
          <p className="text-xs text-muted">{newUserStoreName}</p>
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 text-center">
          <p className="text-sm text-zinc-300">Marketing insights build from your sales and customer data. Connect your POS to get started.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 min-w-0 overflow-x-hidden pb-28">
      <div className="dashboard-toolbar p-3 sm:p-5 space-y-3">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold sm:text-2xl">Ad Accountability</h1>
          <EducationInfoIcon metricKey="marketing_roas" />
        </div>
        <p className="text-xs text-muted">
          Every dollar in. Every dollar out. ROAS by campaign.
        </p>

        <div className="flex bg-slate-800 rounded-lg p-0.5 border border-slate-700 mb-4">
          <button type="button" onClick={() => setRange("daily")} className={cn("px-3 py-1.5 rounded-md text-xs font-medium transition-colors", range === "daily" ? "bg-slate-700 text-white" : "text-slate-400")}>Daily</button>
          <button type="button" onClick={() => setRange("weekly")} className={cn("px-3 py-1.5 rounded-md text-xs font-medium transition-colors", range === "weekly" ? "bg-slate-700 text-white" : "text-slate-400")}>Weekly</button>
          <button type="button" onClick={() => setRange("monthly")} className={cn("px-3 py-1.5 rounded-md text-xs font-medium transition-colors", range === "monthly" ? "bg-slate-700 text-white" : "text-slate-400")}>Monthly</button>
          <button type="button" onClick={() => setRange("custom")} className={cn("px-3 py-1.5 rounded-md text-xs font-medium transition-colors", range === "custom" ? "bg-slate-700 text-white" : "text-slate-400")}>Custom</button>
        </div>
        {range !== "custom" && (
          <p className="text-xs text-slate-400 mb-3">
            {range === "daily"
              ? `Today — ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
              : range === "weekly"
                ? `Week of ${getWeekStart()} — ${getWeekEnd()}`
                : `${new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}`}
          </p>
        )}
        {range === "custom" && (
          <div className="flex items-center gap-2 mb-3">
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="bg-slate-700 border border-slate-600 rounded-lg text-xs text-white h-9 px-2"
            />
            <span className="text-xs text-slate-500">to</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="bg-slate-700 border border-slate-600 rounded-lg text-xs text-white h-9 px-2"
            />
          </div>
        )}
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
                <EducationInfoIcon metricKey="campaign_roi" size="sm" />
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
            <button
              type="button"
              onClick={() => setExpandedCampaign(expandedCampaign === c.id ? null : c.id)}
              className="w-full text-left"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-bold text-white truncate">{c.name}</p>
                  <p className="text-slate-400 text-sm mt-0.5">
                    {PLATFORMS[c.platform] || c.platform}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={cn(
                      "text-xs font-semibold tabular-nums px-2.5 py-1 rounded-lg border",
                      roasClass(c.roas)
                    )}
                  >
                    {c.roas.toFixed(1)}x ROAS
                  </span>
                  <ChevronDown className={cn("w-4 h-4 text-slate-400 transition-transform", expandedCampaign === c.id ? "rotate-180" : "")} />
                </div>
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
            </button>
            {expandedCampaign === c.id && (
              <div className="mt-3 pt-3 border-t border-slate-700 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs text-slate-500">Impressions</div>
                    <div className="text-sm text-white font-medium">{c.impressions.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Clicks</div>
                    <div className="text-sm text-white font-medium">{c.clicks.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Click Rate</div>
                    <div className="text-sm text-white font-medium">
                      {c.impressions > 0 ? formatPct((c.clicks / c.impressions) * 100) : "—"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Cost per Click</div>
                    <div className="text-sm text-white font-medium">
                      {c.clicks > 0 ? `$${(c.spend / c.clicks).toFixed(2)}` : "—"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Orders Attributed</div>
                    <div className="text-sm text-white font-medium">{c.orders}</div>
                  </div>
                  <div>
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      Cost per Order
                      <EducationInfoIcon metricKey="marketing_cac" size="sm" />
                    </div>
                    <div className="text-sm text-white font-medium">
                      {c.orders > 0 ? `$${(c.spend / c.orders).toFixed(2)}` : "—"}
                    </div>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 mb-1">Offer / Creative</div>
                  <p className="text-sm text-slate-300">{c.offer}</p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
