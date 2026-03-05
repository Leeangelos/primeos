"use client";

import { useMemo, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { COCKPIT_TARGETS, type CockpitStoreSlug } from "@/lib/cockpit-config";
import { useAuth } from "@/src/lib/auth-context";
import { isNewUser, getNewUserStoreName } from "@/src/lib/user-scope";
import { EducationInfoIcon } from "@/src/components/education/InfoIcon";

type TeamEnergy = "low" | "medium" | "high" | null;
import { ExportButton } from "@/src/components/ui/ExportButton";
import { SmartQuestion } from "@/src/components/ui/SmartQuestion";
import { formatPct } from "@/src/lib/formatters";
import { SEED_EMPLOYEES, type SeedEmployee } from "@/src/lib/seed-data";

const ROLES: Record<string, string> = {
  manager: "Manager",
  cook: "Cook",
  cashier: "Cashier",
  driver: "Driver",
};

type StatusBadge = "Active" | "New" | "Termed";

function getStatusBadge(e: SeedEmployee): StatusBadge {
  if (e.status === "terminated") return "Termed";
  if (e.tenure_months < 3) return "New";
  return "Active";
}

function statusClass(s: StatusBadge): string {
  if (s === "Active") return "bg-emerald-500/20 text-emerald-400 border-emerald-500/40";
  if (s === "New") return "bg-blue-500/20 text-blue-400 border-blue-500/40";
  return "bg-red-500/20 text-red-400 border-red-500/40";
}

function formatHireDate(dateStr: string): string {
  return new Date(dateStr + "T12:00:00Z").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function tenureLabel(months: number): string {
  if (months < 1) return "<1 mo";
  if (months < 12) return `${months} mo`;
  const years = Math.floor(months / 12);
  const rem = months % 12;
  return rem > 0 ? `${years}y ${rem}m` : `${years}y`;
}

function getStoreName(storeId: string): string {
  const slug = storeId as CockpitStoreSlug;
  return COCKPIT_TARGETS[slug]?.name ?? storeId;
}

// Quarterly churn: exits in last 90 days / avg headcount. Seed has 1 termed (e8).
// CAC this quarter: sum of CAC for employees who exited in last 90 days (replacement cost).
const QUARTERLY_EXITS = 1;
const AVG_HEADCOUNT = 12;
const QUARTERLY_CHURN_RATE = Math.round((QUARTERLY_EXITS / AVG_HEADCOUNT) * 1000) / 10;
const CAC_SPENT_THIS_QUARTER = 2900; // e8's CAC as replacement cost

function churnGrade(pct: number): "green" | "yellow" | "red" {
  if (pct <= 15) return "green";
  if (pct <= 25) return "yellow";
  return "red";
}

function todayYYYYMMDD(): string {
  const t = new Date();
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
}

export default function PeoplePage() {
  const { session, loading } = useAuth();
  const newUser = isNewUser(session);
  const newUserStoreName = getNewUserStoreName(session);
  const employees = SEED_EMPLOYEES;

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

  const activeCount = useMemo(() => employees.filter((e) => e.status === "active").length, [employees]);
  const avgTenure = useMemo(() => {
    const active = employees.filter((e) => e.status === "active");
    if (active.length === 0) return 0;
    return Math.round(active.reduce((s, e) => s + e.tenure_months, 0) / active.length);
  }, [employees]);

  const payRates = useMemo(() => {
    const managers = employees.filter((e) => e.role === "manager");
    const kitchen = employees.filter((e) => e.role === "cook" || e.role === "cashier");
    const drivers = employees.filter((e) => e.role === "driver");
    const avg = (arr: SeedEmployee[]) =>
      arr.length === 0 ? 0 : arr.reduce((s, e) => s + e.pay_rate, 0) / arr.length;
    const blended = employees.length === 0 ? 0 : employees.reduce((s, e) => s + e.pay_rate, 0) / employees.length;
    return {
      managerAvg: avg(managers).toFixed(2),
      kitchenAvg: avg(kitchen).toFixed(2),
      driverAvg: avg(drivers).toFixed(2),
      blendedAvg: blended.toFixed(2),
    };
  }, [employees]);

  const churnColor = churnGrade(QUARTERLY_CHURN_RATE) === "green" ? "text-emerald-400" : churnGrade(QUARTERLY_CHURN_RATE) === "yellow" ? "text-amber-400" : "text-red-400";

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
          <ExportButton
          pageName="People Economics"
          getData={() => ({
            headers: ["Name", "Role", "Store", "Status", "Hire Date", "Tenure (months)", "Pay Rate"],
            rows: employees.map((e) => [
              e.name,
              ROLES[e.role] ?? e.role,
              getStoreName(e.store_id),
              e.status,
              e.hire_date,
              String(e.tenure_months),
              String(e.pay_rate),
            ]),
          })}
        />
        </div>
        <p className="text-xs text-muted">
          Turnover cost, CAC, tenure, and churn. 12 seed employees.
        </p>
      </div>
      <SmartQuestion page="people" />
      {/* Summary at top */}
      <div className="px-3 sm:px-5">
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4 min-w-0">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-1.5 text-slate-400 text-xs uppercase tracking-wide mb-1">
                Total employees
                <EducationInfoIcon metricKey="total_employees" size="sm" />
              </div>
              <div className="text-xl font-bold text-white tabular-nums">{employees.length}</div>
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-slate-400 text-xs uppercase tracking-wide mb-1">
                Avg tenure
                <EducationInfoIcon metricKey="employee_tenure" size="sm" />
              </div>
              <div className="text-xl font-bold text-white tabular-nums">{avgTenure} mo</div>
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-slate-400 text-xs uppercase tracking-wide mb-1">
                Quarterly churn rate
                <EducationInfoIcon metricKey="employee_churn" size="sm" />
              </div>
              <div className={cn("text-xl font-bold tabular-nums", churnColor)}>
                {formatPct(QUARTERLY_CHURN_RATE)}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-slate-400 text-xs uppercase tracking-wide mb-1">
                CAC spent this quarter
                <EducationInfoIcon metricKey="employee_acquisition_cost" size="sm" />
              </div>
              <div className="text-xl font-bold text-red-400 tabular-nums">
                ${CAC_SPENT_THIS_QUARTER.toLocaleString()}
              </div>
            </div>
          </div>
        </div>
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 mt-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs text-slate-500 uppercase tracking-wide">Pay Rates</h3>
            <EducationInfoIcon metricKey="pay_rate" size="sm" />
          </div>
          <div className="text-lg font-bold text-white mb-2">
            ${payRates.blendedAvg}/hr <span className="text-xs text-slate-400 font-normal">blended average</span>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
            <span>Managers: ${payRates.managerAvg}/hr</span>
            <span>Kitchen: ${payRates.kitchenAvg}/hr</span>
            <span>Drivers: ${payRates.driverAvg}/hr</span>
          </div>
        </div>
      </div>

      {/* Employee list as cards */}
      <div className="px-3 sm:px-5 space-y-3">
        <h2 className="text-sm font-medium text-slate-400 px-1">Roster</h2>
        {employees.map((emp) => {
          const status = getStatusBadge(emp);
          return (
            <div
              key={emp.id}
              className="rounded-xl border border-slate-700 bg-slate-800/50 p-4 min-w-0"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-bold text-white truncate">{emp.name}</p>
                  <p className="text-slate-400 text-sm mt-0.5">
                    {ROLES[emp.role]} · {getStoreName(emp.store_id)}
                  </p>
                </div>
                <span
                  className={cn(
                    "shrink-0 text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded-lg border",
                    statusClass(status)
                  )}
                >
                  {status}
                </span>
              </div>
              <p className="text-slate-500 text-sm mt-2">
                Hired {formatHireDate(emp.hire_date)}
              </p>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm">
                <span className="text-slate-300">
                  <span className="text-slate-500">Rate:</span> ${emp.pay_rate}/hr
                </span>
                <span className="text-slate-300">
                  <span className="text-slate-500">Hours/wk:</span> {emp.hours_per_week}
                </span>
                <span className="text-slate-300">
                  <span className="text-slate-500">Tenure:</span> {tenureLabel(emp.tenure_months)}
                </span>
              </div>
              <div className="flex gap-4 mt-2 pt-2 border-t border-slate-700/50">
                <div>
                  <div className="text-xs text-slate-500">Annual Gross</div>
                  <div className="text-sm text-red-400 font-medium">
                    ${(emp.pay_rate * emp.hours_per_week * 52).toLocaleString("en-US", { maximumFractionDigits: 0 })}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Lifetime Gross</div>
                  <div className="text-sm text-red-400 font-medium">
                    ${(emp.pay_rate * emp.hours_per_week * (emp.tenure_months * 52 / 12)).toLocaleString("en-US", { maximumFractionDigits: 0 })}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="px-3 sm:px-5">
        <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-3 mt-4">
          <p className="text-xs text-slate-500 text-center">
            Employee financial details are visible to Owner tier only.
          </p>
        </div>
      </div>
    </div>
  );
}
