"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";
import { COCKPIT_STORE_SLUGS, COCKPIT_TARGETS, type CockpitStoreSlug } from "@/lib/cockpit-config";
import { useAuth } from "@/src/lib/auth-context";
import { isNewUser, getNewUserStoreName } from "@/src/lib/user-scope";
import { EducationInfoIcon } from "@/src/components/education/InfoIcon";
import { SmartQuestion } from "@/src/components/ui/SmartQuestion";

type TeamEnergy = "low" | "medium" | "high" | null;

function getStoreName(storeId: string): string {
  const slug = storeId as CockpitStoreSlug;
  return COCKPIT_TARGETS[slug]?.name ?? storeId;
}

function todayYYYYMMDD(): string {
  const t = new Date();
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
}

type LaborRow = {
  business_day: string;
  unique_employees?: number;
  regular_hours?: number;
  overtime_hours?: number;
  total_labor_cost?: number;
  total_overtime_cost?: number;
  avg_hourly_rate?: number;
};

export default function PeoplePage() {
  const { session, loading } = useAuth();
  const newUser = isNewUser(session);
  const newUserStoreName = getNewUserStoreName(session);
  const [store, setStore] = useState<CockpitStoreSlug>("kent");
  const [labor, setLabor] = useState<LaborRow[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/dashboard/daily-data?store_id=${encodeURIComponent(store)}&range=30`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled || !d.labor) return;
        setLabor(Array.isArray(d.labor) ? d.labor : []);
      })
      .catch(() => setLabor([]));
    return () => { cancelled = true; };
  }, [store]);

  const laborAgg = useMemo(() => {
    if (!labor.length) return null;
    const totalHours = labor.reduce((s, r) => s + (Number(r.regular_hours) || 0) + (Number(r.overtime_hours) || 0), 0);
    const totalOvertime = labor.reduce((s, r) => s + (Number(r.overtime_hours) || 0), 0);
    const totalCost = labor.reduce((s, r) => s + (Number(r.total_labor_cost) || 0) + (Number(r.total_overtime_cost) || 0), 0);
    const avgHeadcount = labor.reduce((s, r) => s + (Number(r.unique_employees) || 0), 0) / labor.length;
    const avgRate = totalHours > 0 ? totalCost / totalHours : 0;
    return { totalHours, totalOvertime, avgHeadcount: Math.round(avgHeadcount * 10) / 10, avgRate: Math.round(avgRate * 100) / 100 };
  }, [labor]);

  const [pulseRecognized, setPulseRecognized] = useState<boolean | null>(null);
  const [pulseCallouts, setPulseCallouts] = useState<boolean | null>(null);
  const [pulseCalloutCount, setPulseCalloutCount] = useState("");
  const [pulseEnergy, setPulseEnergy] = useState<TeamEnergy>(null);
  const [pulseSaving, setPulseSaving] = useState(false);
  const [pulseToast, setPulseToast] = useState<"idle" | "saved" | "error">("idle");
  const teamPulseStoreId: CockpitStoreSlug = "kent";
  const teamPulseDate = todayYYYYMMDD();
  const teamPulseHasSelection = pulseRecognized !== null || pulseCallouts !== null || pulseEnergy !== null;
  const handleSaveTeamPulse = useCallback(async () => {
    if (!teamPulseHasSelection || pulseSaving) return;
    try {
      setPulseSaving(true);
      setPulseToast("idle");
      const res = await fetch("/api/manager-checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location_id: teamPulseStoreId,
          date: teamPulseDate,
          recognized_team: pulseRecognized,
          callouts: pulseCallouts ? Number(pulseCalloutCount) || 0 : null,
          energy_level: pulseEnergy ?? "medium",
        }),
      });
      if (!res.ok) setPulseToast("error");
      else setPulseToast("saved");
    } catch {
      setPulseToast("error");
    } finally {
      setPulseSaving(false);
      setTimeout(() => setPulseToast("idle"), 3000);
    }
  }, [teamPulseHasSelection, pulseSaving, pulseRecognized, pulseCallouts, pulseCalloutCount, pulseEnergy]);

  if (loading) return <div className="min-h-screen bg-zinc-950" />;
  if (newUser) {
    return (
      <div className="space-y-4 min-w-0 overflow-x-hidden pb-28">
        <div className="dashboard-toolbar p-3 sm:p-5 space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold sm:text-2xl">People Economics</h1>
              <EducationInfoIcon metricKey="employee_cac" size="lg" />
            </div>
          </div>
          <p className="text-xs text-muted">{newUserStoreName}</p>
        </div>
        <SmartQuestion page="people" />
        <div className="bg-zinc-900/50 rounded-xl border border-zinc-800/50 shadow-sm p-6 text-center">
          <p className="text-sm text-zinc-300">Your team roster will appear here. Start by adding shifts in the Schedule.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 min-w-0 overflow-x-hidden pb-28">
      {pulseToast !== "idle" && (
        <div
          className={cn(
            "fixed bottom-20 left-4 right-4 z-50 rounded-xl px-4 py-2.5 text-center border",
            pulseToast === "saved" ? "bg-emerald-600/20 border-emerald-700/50 text-emerald-300" : "bg-red-600/20 border-red-700/50 text-red-300"
          )}
        >
          <p className="text-xs font-medium">{pulseToast === "saved" ? "Team Pulse saved" : "Could not save Team Pulse"}</p>
        </div>
      )}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide">TEAM PULSE</h3>
        <div className="rounded-xl bg-zinc-900 border border-zinc-800/50 shadow-sm p-4 space-y-4">
          <div className="flex items-center gap-2">
            <EducationInfoIcon metricKey="team_pulse" />
            <p className="text-xs text-zinc-500">60 seconds. How&apos;s your crew?</p>
          </div>
          <div className="space-y-2">
            <p className="text-xs text-zinc-300">Did you recognize a team member by name today for specific work?</p>
            <div className="flex gap-2">
              <button type="button" onClick={() => setPulseRecognized(true)} className={cn("flex-1 rounded-lg border px-3 py-2 text-xs font-medium min-h-[44px]", pulseRecognized === true ? "border-emerald-500 bg-emerald-500/10 text-emerald-300" : "border-slate-700 bg-slate-900 text-zinc-400")}>Yes</button>
              <button type="button" onClick={() => setPulseRecognized(false)} className={cn("flex-1 rounded-lg border px-3 py-2 text-xs font-medium min-h-[44px]", pulseRecognized === false ? "border-slate-500 bg-slate-800 text-slate-200" : "border-slate-700 bg-slate-900 text-zinc-400")}>No</button>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-xs text-zinc-300">Any call-outs or no-shows today?</p>
            <div className="flex gap-2 items-center">
              <button type="button" onClick={() => setPulseCallouts(true)} className={cn("flex-1 rounded-lg border px-3 py-2 text-xs font-medium min-h-[44px]", pulseCallouts === true ? "border-amber-500 bg-amber-500/10 text-amber-300" : "border-slate-700 bg-slate-900 text-zinc-400")}>Yes</button>
              <button type="button" onClick={() => setPulseCallouts(false)} className={cn("flex-1 rounded-lg border px-3 py-2 text-xs font-medium min-h-[44px]", pulseCallouts === false ? "border-slate-500 bg-slate-800 text-slate-200" : "border-slate-700 bg-slate-900 text-zinc-400")}>No</button>
              {pulseCallouts === true && (
                <input type="number" inputMode="numeric" min={0} max={10} value={pulseCalloutCount} onChange={(e) => setPulseCalloutCount(e.target.value)} className="w-16 rounded-lg border border-zinc-700 bg-zinc-800 text-xs text-white px-2 py-2 min-h-[44px]" placeholder="#" />
              )}
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-xs text-zinc-300">Team energy today:</p>
            <div className="flex gap-2">
              <button type="button" onClick={() => setPulseEnergy("low")} className={cn("flex-1 rounded-lg border px-3 py-2 text-xs font-medium flex items-center justify-center gap-1 min-h-[44px]", pulseEnergy === "low" ? "border-red-500 bg-red-500/10 text-red-300" : "border-slate-700 bg-slate-900 text-zinc-400")}><span aria-hidden>🔴</span><span>Low</span></button>
              <button type="button" onClick={() => setPulseEnergy("medium")} className={cn("flex-1 rounded-lg border px-3 py-2 text-xs font-medium flex items-center justify-center gap-1 min-h-[44px]", pulseEnergy === "medium" ? "border-amber-500 bg-amber-500/10 text-amber-300" : "border-slate-700 bg-slate-900 text-zinc-400")}><span aria-hidden>🟡</span><span>Medium</span></button>
              <button type="button" onClick={() => setPulseEnergy("high")} className={cn("flex-1 rounded-lg border px-3 py-2 text-xs font-medium flex items-center justify-center gap-1 min-h-[44px]", pulseEnergy === "high" ? "border-emerald-500 bg-emerald-500/10 text-emerald-300" : "border-slate-700 bg-slate-900 text-zinc-400")}><span aria-hidden>🟢</span><span>High</span></button>
            </div>
          </div>
          <button type="button" onClick={handleSaveTeamPulse} disabled={!teamPulseHasSelection || pulseSaving} className="w-full mt-2 rounded-xl py-3 text-sm font-semibold text-white bg-[#E65100] hover:bg-[#f97316] disabled:bg-slate-700 disabled:text-zinc-400 disabled:cursor-not-allowed transition-colors min-h-[44px]">
            {pulseSaving ? "Saving..." : "Save Team Pulse"}
          </button>
        </div>
      </div>
      <div className="dashboard-toolbar p-3 sm:p-5 space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold sm:text-2xl">People Economics</h1>
            <EducationInfoIcon metricKey="employee_cac" size="lg" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500">Store</span>
            <select
              value={store}
              onChange={(e) => setStore(e.target.value as CockpitStoreSlug)}
              className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm text-white"
            >
              {COCKPIT_STORE_SLUGS.map((slug) => (
                <option key={slug} value={slug}>{COCKPIT_TARGETS[slug]?.name ?? slug}</option>
              ))}
            </select>
          </div>
        </div>
        <p className="text-xs text-muted">
          Labor metrics from POS. <span className="text-emerald-500/90">● POS</span> Team Pulse is operator-entered.
        </p>
      </div>
      <SmartQuestion page="people" />
      {/* Summary from labor */}
      <div className="px-3 sm:px-5">
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4 min-w-0">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-1.5 text-slate-400 text-xs uppercase tracking-wide mb-1">
                Avg headcount (30d)
                <EducationInfoIcon metricKey="total_employees" size="sm" />
              </div>
              <div className="text-xl font-bold text-white tabular-nums">
                {laborAgg ? laborAgg.avgHeadcount : "—"}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-slate-400 text-xs uppercase tracking-wide mb-1">
                Total hours (30d)
                <EducationInfoIcon metricKey="labor_hours" size="sm" />
              </div>
              <div className="text-xl font-bold text-white tabular-nums">
                {laborAgg ? laborAgg.totalHours.toFixed(1) : "—"}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-slate-400 text-xs uppercase tracking-wide mb-1">
                Overtime hours (30d)
                <EducationInfoIcon metricKey="labor_hours" size="sm" />
              </div>
              <div className="text-xl font-bold text-amber-400 tabular-nums">
                {laborAgg ? laborAgg.totalOvertime.toFixed(1) : "—"}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-slate-400 text-xs uppercase tracking-wide mb-1">
                Avg hourly rate
                <EducationInfoIcon metricKey="pay_rate" size="sm" />
              </div>
              <div className="text-xl font-bold text-white tabular-nums">
                {laborAgg && laborAgg.avgRate > 0 ? `$${laborAgg.avgRate}/hr` : "—"}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-3 sm:px-5 space-y-3">
        <h2 className="text-sm font-medium text-slate-400 px-1">Roster</h2>
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6 text-center">
          <p className="text-slate-400 text-sm">Employee roster will appear here when connected to your POS.</p>
        </div>
      </div>
    </div>
  );
}
