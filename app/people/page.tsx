"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";
import { COCKPIT_STORE_SLUGS, COCKPIT_TARGETS, type CockpitStoreSlug } from "@/lib/cockpit-config";
import { EducationInfoIcon } from "@/src/components/education/InfoIcon";
import { useAuth } from "@/src/lib/auth-context";
import { isNewUser, getNewUserStoreName } from "@/src/lib/user-scope";

type TeamEnergy = "low" | "medium" | "high" | null;

type Employee = {
  id: number | string;
  name: string;
  role?: string | null;
  pay_rate?: number | null;
  status?: string | null;
  hire_date?: string | null;
  exit_date?: string | null;
};

const COST_PER_HIRE = 1800;
const AVG_WEEKLY_HOURS = 30;
const FALLBACK_PAY_RATE = 12;
const FALLBACK_WEEKS_TENURE = 12;
const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;
const PRIMEOS_MONTHLY = 99;

function todayYYYYMMDD(): string {
  const t = new Date();
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
}

function weeksBetween(start: string, end: Date): number {
  const s = new Date(start + "T12:00:00Z").getTime();
  const e = end.getTime();
  return Math.max(0, (e - s) / (7 * 24 * 60 * 60 * 1000));
}

function tenureMonths(hireDate: string | null | undefined, exitDate: string | null | undefined): number | null {
  if (!hireDate) return null;
  const end = exitDate ? new Date(exitDate + "T12:00:00Z") : new Date();
  const start = new Date(hireDate + "T12:00:00Z");
  return Math.round((end.getTime() - start.getTime()) / (30.44 * 24 * 60 * 60 * 1000));
}

function formatTenure(months: number | null): string {
  if (months == null) return "—";
  if (months < 12) return `${months} mo`;
  const y = Math.floor(months / 12);
  const m = months % 12;
  return m ? `${y}y ${m}mo` : `${y}y`;
}

export default function PeoplePage() {
  const { session, loading } = useAuth();
  const newUser = isNewUser(session);
  const newUserStoreName = getNewUserStoreName(session);
  const [store, setStore] = useState<CockpitStoreSlug>("kent");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeesLoading, setEmployeesLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setEmployeesLoading(true);
    fetch(`/api/employees?store=${encodeURIComponent(store)}`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        setEmployees(Array.isArray(d.employees) ? d.employees : []);
      })
      .catch(() => setEmployees([]))
      .finally(() => {
        if (!cancelled) setEmployeesLoading(false);
      });
    return () => { cancelled = true; };
  }, [store]);

  const now = useMemo(() => new Date(), []);
  const ninetyDaysAgo = useMemo(() => new Date(now.getTime() - NINETY_DAYS_MS), [now]);

  const churn = useMemo(() => {
    const active = employees.filter((e) => (e.status ?? "active") === "active");
    const activeCount = active.length;
    const lost90 = employees.filter((e) => {
      const exit = e.exit_date;
      if (!exit) return false;
      const exitDate = new Date(exit + "T12:00:00Z");
      return exitDate >= ninetyDaysAgo;
    }).length;
    const avgHeadcount = activeCount || 1;
    const annualizedTurnoverPct = lost90 === 0 ? 0 : (lost90 / avgHeadcount) * (365 / 90) * 100;
    const annualizedExits = lost90 * (365 / 90);
    return {
      activeCount,
      lost90,
      annualizedTurnoverPct: Math.round(annualizedTurnoverPct),
      annualizedExits,
    };
  }, [employees, ninetyDaysAgo]);

  const costOfChurn = useMemo(() => {
    const annualCost = churn.annualizedExits * COST_PER_HIRE;
    const save25 = annualCost * 0.25;
    return { annualCost, save25 };
  }, [churn.annualizedExits]);

  const ltvData = useMemo(() => {
    const active = employees.filter((e) => (e.status ?? "active") === "active");
    const withLtv = active.map((e) => {
      const rate = Number(e.pay_rate) || FALLBACK_PAY_RATE;
      const hire = e.hire_date ?? "";
      const weeks = hire ? weeksBetween(hire, now) : FALLBACK_WEEKS_TENURE;
      const ltv = rate * AVG_WEEKLY_HOURS * weeks;
      return { ...e, ltv, weeks, tenureMonths: tenureMonths(e.hire_date ?? null, null) };
    }).filter((e) => e.ltv >= 0);
    const sorted = [...withLtv].sort((a, b) => b.ltv - a.ltv);
    const top3 = sorted.slice(0, 3);
    const avgLtv = withLtv.length > 0 ? withLtv.reduce((s, e) => s + e.ltv, 0) / withLtv.length : 0;
    return { top3, avgLtv, all: withLtv };
  }, [employees, now]);

  const rosterSorted = useMemo(() => {
    return [...employees].sort((a, b) => {
      const am = tenureMonths(a.hire_date ?? null, a.exit_date ?? null) ?? 0;
      const bm = tenureMonths(b.hire_date ?? null, b.exit_date ?? null) ?? 0;
      return bm - am;
    });
  }, [employees]);

  const [pulseRecognized, setPulseRecognized] = useState<boolean | null>(null);
  const [pulseCallouts, setPulseCallouts] = useState<boolean | null>(null);
  const [pulseCalloutCount, setPulseCalloutCount] = useState("");
  const [pulseEnergy, setPulseEnergy] = useState<TeamEnergy>(null);
  const [pulseSaving, setPulseSaving] = useState(false);
  const [pulseToast, setPulseToast] = useState<"idle" | "saved" | "error">("idle");
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
          location_id: store,
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
  }, [teamPulseHasSelection, pulseSaving, pulseRecognized, pulseCallouts, pulseCalloutCount, pulseEnergy, store, teamPulseDate]);

  const retentionRoi = useMemo(() => {
    const saved = 3 * COST_PER_HIRE;
    const annualSub = PRIMEOS_MONTHLY * 12;
    const roi = annualSub > 0 ? saved / annualSub : 0;
    return { saved, roi };
  }, []);

  if (loading) return <div className="min-h-screen bg-zinc-950" />;
  if (newUser) {
    return (
      <div className="space-y-4 min-w-0 overflow-x-hidden pb-28">
        <div className="dashboard-toolbar p-3 sm:p-5 space-y-3">
          <h1 className="text-lg font-semibold sm:text-2xl text-white">People Economics</h1>
          <p className="text-xs text-slate-400">Your team is your second biggest cost. Here&apos;s the math.</p>
          <p className="text-xs text-muted">{newUserStoreName}</p>
        </div>
        <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-6 text-center">
          <p className="text-sm text-slate-400">Select your store and sync employees from Schedule to see churn, LTV, and roster.</p>
        </div>
      </div>
    );
  }

  const turnoverColor = churn.annualizedTurnoverPct < 50 ? "text-emerald-400" : churn.annualizedTurnoverPct <= 100 ? "text-amber-400" : "text-red-400";
  const costColor = costOfChurn.annualCost < 5000 ? "text-emerald-400" : costOfChurn.annualCost <= 10000 ? "text-amber-400" : "text-red-400";
  const storeName = COCKPIT_TARGETS[store]?.name ?? store;

  return (
    <div className="space-y-5 min-w-0 overflow-x-hidden pb-28">
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

      {/* HEADER */}
      <div className="px-3 sm:px-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">People Economics</h1>
          <p className="text-sm text-slate-400 mt-0.5">Your team is your second biggest cost. Here&apos;s the math.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Store</span>
          <select
            value={store}
            onChange={(e) => setStore(e.target.value as CockpitStoreSlug)}
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
          >
            {COCKPIT_STORE_SLUGS.map((slug) => (
              <option key={slug} value={slug}>{COCKPIT_TARGETS[slug]?.name ?? slug}</option>
            ))}
          </select>
        </div>
      </div>

      {/* CHURN METRICS CARD */}
      <div className="px-3 sm:px-5">
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
          <h2 className="text-sm font-semibold text-slate-200 mb-3 inline-flex items-center gap-1.5">Churn metrics <EducationInfoIcon metricKey="people_churn" size="sm" /></h2>
          {employeesLoading ? (
            <p className="text-sm text-slate-500">Loading…</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">Total active</p>
                <p className="text-xl font-bold text-white tabular-nums">{churn.activeCount}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">Lost last 90 days</p>
                <p className="text-xl font-bold text-white tabular-nums">{churn.lost90}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wide">Annualized turnover</p>
                <p className={cn("text-xl font-bold tabular-nums", turnoverColor)}>{churn.annualizedTurnoverPct}%</p>
              </div>
              <div>
                <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-medium bg-slate-700 text-slate-400">Industry avg: 150% annually</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* COST OF CHURN CARD */}
      <div className="px-3 sm:px-5">
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
          <h2 className="text-sm font-semibold text-slate-200 mb-3 inline-flex items-center gap-1.5">Cost of churn <EducationInfoIcon metricKey="people_cost_of_churn" size="sm" /></h2>
          <div className="space-y-2">
            <p className="text-xs text-slate-400">
              Estimated annual replacement cost: <span className={cn("font-bold", costColor)}>${Math.round(costOfChurn.annualCost).toLocaleString("en-US")}/yr</span>
            </p>
            <p className="text-xs text-slate-400">
              If you reduce churn by 25%: save <span className="font-semibold text-emerald-400">${Math.round(costOfChurn.save25).toLocaleString("en-US")}/yr</span>
            </p>
            <p className="text-[10px] text-slate-500 mt-2">
              Based on $1,800 industry avg cost per hire (job posting + interviews + training + lost productivity)
            </p>
          </div>
        </div>
      </div>

      {/* EMPLOYEE LTV CARD */}
      <div className="px-3 sm:px-5">
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
          <h2 className="text-sm font-semibold text-slate-200 mb-3 inline-flex items-center gap-1.5">Employee LTV <EducationInfoIcon metricKey="people_ltv" size="sm" /></h2>
          <p className="text-xs text-slate-500 mb-3">LTV = pay rate × 30 hrs/wk × weeks retained. Avg weekly hours: 30 (industry avg).</p>
          {ltvData.top3.length > 0 ? (
            <>
              <p className="text-[10px] uppercase tracking-wide text-slate-500 mb-2">Your most valuable players</p>
              <ul className="space-y-2 mb-4">
                {ltvData.top3.map((e) => (
                  <li key={e.id} className="flex items-center justify-between text-sm">
                    <span className="text-white font-medium">{e.name}</span>
                    <span className="text-slate-400 capitalize">{e.role ?? "team"}</span>
                    <span className="text-slate-400">{formatTenure(e.tenureMonths)}</span>
                    <span className="font-semibold text-emerald-400">${Math.round(e.ltv).toLocaleString("en-US")}</span>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-slate-400">
                Avg LTV (active): <span className="font-semibold text-white">${Math.round(ltvData.avgLtv).toLocaleString("en-US")}</span>
              </p>
            </>
          ) : (
            <p className="text-sm text-slate-500">No active employees to compute LTV.</p>
          )}
        </div>
      </div>

      {/* ROSTER */}
      <div className="px-3 sm:px-5">
        <h2 className="text-sm font-semibold text-slate-200 mb-2">Roster</h2>
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 overflow-hidden">
          {employeesLoading ? (
            <div className="p-6 text-center text-slate-500 text-sm">Loading…</div>
          ) : rosterSorted.length === 0 ? (
            <div className="p-6 text-center text-slate-500 text-sm">No employees for this store. Sync from Schedule or FoodTec.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-700 bg-slate-900/80">
                    <th className="px-3 py-2 text-left text-slate-400 font-medium">Name</th>
                    <th className="px-3 py-2 text-left text-slate-400 font-medium">Role</th>
                    <th className="px-3 py-2 text-left text-slate-400 font-medium">Status</th>
                    <th className="px-3 py-2 text-left text-slate-400 font-medium">Hire date</th>
                    <th className="px-3 py-2 text-left text-slate-400 font-medium">Tenure</th>
                    <th className="px-3 py-2 text-left text-slate-400 font-medium">Pay rate</th>
                    <th className="px-3 py-2 text-right text-slate-400 font-medium">Est. LTV</th>
                  </tr>
                </thead>
                <tbody>
                  {rosterSorted.map((e) => {
                    const isActive = (e.status ?? "active") === "active";
                    const rate = Number(e.pay_rate) || FALLBACK_PAY_RATE;
                    const hire = e.hire_date ?? "";
                    const endDate = isActive ? now : new Date((e.exit_date ?? e.hire_date ?? "") + "T12:00:00Z");
                    const weeks = hire ? weeksBetween(hire, endDate) : FALLBACK_WEEKS_TENURE;
                    const ltv = rate * AVG_WEEKLY_HOURS * weeks;
                    const tenure = tenureMonths(e.hire_date ?? null, e.exit_date ?? null);
                    return (
                      <tr key={e.id} className="border-t border-slate-700/50">
                        <td className="px-3 py-2 text-white font-medium">{e.name}</td>
                        <td className="px-3 py-2">
                          <span className="inline-flex px-2 py-0.5 rounded capitalize bg-slate-700 text-slate-200">{e.role ?? "team"}</span>
                        </td>
                        <td className="px-3 py-2">
                          <span className={cn("inline-flex px-2 py-0.5 rounded", isActive ? "bg-emerald-500/20 text-emerald-300" : "bg-red-500/20 text-red-300")}>
                            {isActive ? "Active" : "Exited"}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-slate-400">{e.hire_date ?? "—"}</td>
                        <td className="px-3 py-2 text-slate-300">{formatTenure(tenure)}</td>
                        <td className="px-3 py-2 text-slate-300">{rate > 0 ? `$${rate}/hr` : "—"}</td>
                        <td className="px-3 py-2 text-right text-slate-300">${Math.round(ltv).toLocaleString("en-US")}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* TEAM PULSE */}
      <div className="px-3 sm:px-5 space-y-3">
        <h2 className="text-sm font-semibold text-slate-200">Team Pulse</h2>
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4 space-y-4">
          <p className="text-xs text-slate-500">60 seconds. How&apos;s your crew? (saved for {storeName}, today)</p>
          <div className="space-y-2">
            <p className="text-xs text-slate-300">Did you recognize a team member by name today for specific work?</p>
            <div className="flex gap-2">
              <button type="button" onClick={() => setPulseRecognized(true)} className={cn("flex-1 rounded-lg border px-3 py-2 text-xs font-medium min-h-[44px]", pulseRecognized === true ? "border-emerald-500 bg-emerald-500/10 text-emerald-300" : "border-slate-700 bg-slate-900 text-zinc-400")}>Yes</button>
              <button type="button" onClick={() => setPulseRecognized(false)} className={cn("flex-1 rounded-lg border px-3 py-2 text-xs font-medium min-h-[44px]", pulseRecognized === false ? "border-slate-500 bg-slate-800 text-slate-200" : "border-slate-700 bg-slate-900 text-zinc-400")}>No</button>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-xs text-slate-300">Any call-outs or no-shows today?</p>
            <div className="flex gap-2 items-center">
              <button type="button" onClick={() => setPulseCallouts(true)} className={cn("flex-1 rounded-lg border px-3 py-2 text-xs font-medium min-h-[44px]", pulseCallouts === true ? "border-amber-500 bg-amber-500/10 text-amber-300" : "border-slate-700 bg-slate-900 text-zinc-400")}>Yes</button>
              <button type="button" onClick={() => setPulseCallouts(false)} className={cn("flex-1 rounded-lg border px-3 py-2 text-xs font-medium min-h-[44px]", pulseCallouts === false ? "border-slate-500 bg-slate-800 text-slate-200" : "border-slate-700 bg-slate-900 text-zinc-400")}>No</button>
              {pulseCallouts === true && (
                <input type="number" inputMode="numeric" min={0} max={10} value={pulseCalloutCount} onChange={(e) => setPulseCalloutCount(e.target.value)} className="w-16 rounded-lg border border-slate-700 bg-slate-800 text-xs text-white px-2 py-2 min-h-[44px]" placeholder="#" />
              )}
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-xs text-slate-300">Team energy today:</p>
            <div className="flex gap-2">
              <button type="button" onClick={() => setPulseEnergy("low")} className={cn("flex-1 rounded-lg border px-3 py-2 text-xs font-medium flex items-center justify-center gap-1 min-h-[44px]", pulseEnergy === "low" ? "border-red-500 bg-red-500/10 text-red-300" : "border-slate-700 bg-slate-900 text-zinc-400")}><span aria-hidden>🔴</span><span>Low</span></button>
              <button type="button" onClick={() => setPulseEnergy("medium")} className={cn("flex-1 rounded-lg border px-3 py-2 text-xs font-medium flex items-center justify-center gap-1 min-h-[44px]", pulseEnergy === "medium" ? "border-amber-500 bg-amber-500/10 text-amber-300" : "border-slate-700 bg-slate-900 text-zinc-400")}><span aria-hidden>🟡</span><span>Medium</span></button>
              <button type="button" onClick={() => setPulseEnergy("high")} className={cn("flex-1 rounded-lg border px-3 py-2 text-xs font-medium flex items-center justify-center gap-1 min-h-[44px]", pulseEnergy === "high" ? "border-emerald-500 bg-emerald-500/10 text-emerald-300" : "border-slate-700 bg-slate-900 text-zinc-400")}><span aria-hidden>🟢</span><span>High</span></button>
            </div>
          </div>
          <button type="button" onClick={handleSaveTeamPulse} disabled={!teamPulseHasSelection || pulseSaving} className="w-full mt-2 rounded-xl py-3 text-sm font-semibold text-white bg-[#E65100] hover:bg-[#f97316] disabled:bg-slate-700 disabled:text-zinc-400 disabled:cursor-not-allowed transition-colors min-h-[44px]">
            {pulseSaving ? "Saving…" : "Save Team Pulse"}
          </button>
        </div>
      </div>

      {/* RETENTION ROI CALLOUT */}
      <div className="px-3 sm:px-5">
        <div className="rounded-xl border border-teal-500/30 bg-teal-500/10 p-4">
          <p className="text-sm text-teal-200">
            If PrimeOS retains 3 employees this year at {storeName}: <span className="font-bold text-white">${retentionRoi.saved.toLocaleString("en-US")} saved</span>. At $99/month that&apos;s <span className="font-bold text-white">{retentionRoi.roi.toFixed(1)}x ROI</span> on your subscription. <EducationInfoIcon metricKey="people_retention_roi" size="sm" />
          </p>
        </div>
      </div>
    </div>
  );
}
