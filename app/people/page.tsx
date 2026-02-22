"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { COCKPIT_STORE_SLUGS, COCKPIT_TARGETS, type CockpitStoreSlug } from "@/lib/cockpit-config";
import { getStoreColor } from "@/lib/store-colors";
import { cn } from "@/lib/utils";

type Employee = {
  id: string;
  name: string;
  role: string;
  pay_rate: number | null;
  hire_date: string | null;
  exit_date: string | null;
  exit_reason: string | null;
  source: string | null;
  status: string;
  store_id: string;
};

function getStoreName(storeId: string, storeMap: Record<string, string>): string {
  return storeMap[storeId] || "Unknown";
}

type Analytics = {
  totalEmployees: number;
  active: number;
  exited: number;
  avgTenureMonths: number;
  avgExitedTenureMonths: number;
  churnRate90: number;
  estimatedCAC: number;
  annualTurnoverCost: number;
  recentExits: number;
  exitReasons: Record<string, number>;
  sources: Record<string, number>;
  storeChurn: Record<string, { active: number; exited: number; name: string }>;
};

function tenureLabel(hireDate: string | null, exitDate: string | null): string {
  if (!hireDate) return "—";
  const start = new Date(hireDate);
  const end = exitDate ? new Date(exitDate) : new Date();
  const months = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30));
  if (months < 1) return "<1 mo";
  if (months < 12) return `${months} mo`;
  const years = Math.floor(months / 12);
  const rem = months % 12;
  return rem > 0 ? `${years}y ${rem}m` : `${years}y`;
}

const ROLES: Record<string, string> = {
  manager: "Manager",
  shift_lead: "Shift Lead",
  cook: "Cook",
  cashier: "Cashier",
  driver: "Driver",
  team: "Team",
};

export default function PeoplePage() {
  const [store, setStore] = useState<CockpitStoreSlug | "all">("all");
  const [status, setStatus] = useState<"all" | "active" | "exited">("all");
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"dashboard" | "roster">("dashboard");
  const [showEducation, setShowEducation] = useState(false);
  const [storeMap, setStoreMap] = useState<Record<string, { name: string; slug: string }>>({});

  useEffect(() => {
    fetch("/api/stores").then(r => r.json()).then(d => {
      if (d.ok && d.stores) {
        const map: Record<string, { name: string; slug: string }> = {};
        for (const s of d.stores) map[s.id] = { name: s.name, slug: s.slug };
        setStoreMap(map);
      }
    });
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [empRes, anaRes] = await Promise.all([
      fetch(`/api/employees?store=${store}&status=${status}`).then((r) => r.json()),
      fetch(`/api/employees/analytics?store=${store}`).then((r) => r.json()),
    ]);
    if (empRes.ok) setEmployees(empRes.employees);
    if (anaRes.ok && anaRes.analytics) setAnalytics(anaRes.analytics);
    setLoading(false);
  }, [store, status]);

  useEffect(() => { loadData(); }, [loadData]);

  const a = analytics;

  return (
    <div className="space-y-5">
      <div className="dashboard-toolbar p-3 sm:p-5 space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold sm:text-2xl">People Economics</h1>
            <button type="button" onClick={() => setShowEducation(true)} className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-full bg-muted/20 text-muted hover:bg-brand/20 hover:text-brand transition-colors text-xs font-bold" aria-label="Learn more">i</button>
          </div>
        </div>
        <p className="text-xs text-muted">Track turnover cost, employee CAC, tenure, and churn across all locations.</p>

        <div className="flex flex-wrap gap-1.5 justify-center">
          <button type="button" onClick={() => setStore("all")} className={cn("min-h-[44px] rounded-lg border px-3 py-2 text-sm font-medium transition-colors", store === "all" ? "border-brand/50 bg-brand/15 text-brand" : "border-border/30 bg-black/20 text-muted hover:text-white")}>All Stores</button>
          {COCKPIT_STORE_SLUGS.map((slug) => {
            const sc = getStoreColor(slug);
            return (
              <button key={slug} type="button" onClick={() => setStore(slug)} className={cn("min-h-[44px] rounded-lg border px-3 py-2 text-sm font-medium transition-colors", store === slug ? `${sc.borderActive} ${sc.bgActive} ${sc.text}` : "border-border/30 bg-black/20 text-muted hover:text-white")}>{COCKPIT_TARGETS[slug].name}</button>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-2 justify-center">
          <button type="button" onClick={() => setTab("dashboard")} className={cn("min-h-[44px] rounded-lg border px-3 py-1.5 text-xs font-medium", tab === "dashboard" ? "border-brand/50 bg-brand/15 text-brand" : "border-border/30 bg-black/20 text-muted")}>Dashboard</button>
          <button type="button" onClick={() => setTab("roster")} className={cn("min-h-[44px] rounded-lg border px-3 py-1.5 text-xs font-medium", tab === "roster" ? "border-brand/50 bg-brand/15 text-brand" : "border-border/30 bg-black/20 text-muted")}>Roster</button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-lg border border-border/50 p-5"><div className="h-6 w-24 bg-muted/20 rounded mb-2" /><div className="h-4 w-40 bg-muted/20 rounded" /></div>
          ))}
        </div>
      ) : tab === "dashboard" && a ? (
        <>
          {/* Hero: Annual Turnover Cost */}
          <div className={cn("rounded-lg border p-3 sm:p-5 text-center", a.annualTurnoverCost > 20000 ? "border-red-500/50 bg-red-500/10" : "border-emerald-500/50 bg-emerald-500/10")}>
            <div className="text-[10px] font-medium uppercase tracking-widest text-muted/70">Est. Annual Turnover Cost</div>
            <div className={cn("mt-3 text-3xl sm:text-5xl font-black tabular-nums", a.annualTurnoverCost > 20000 ? "text-red-400" : "text-emerald-400")}>
              ${a.annualTurnoverCost.toLocaleString()}
            </div>
            <div className="text-xs text-muted mt-2">
              Based on {a.recentExits} exits in last 90 days × ${a.estimatedCAC.toLocaleString()} avg replacement cost
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="dashboard-surface rounded-lg border border-border p-4 text-center">
              <div className="text-[9px] uppercase text-muted">Active</div>
              <div className="text-2xl font-bold tabular-nums text-emerald-400">{a.active}</div>
            </div>
            <div className="dashboard-surface rounded-lg border border-border p-4 text-center">
              <div className="text-[9px] uppercase text-muted">Exited</div>
              <div className="text-2xl font-bold tabular-nums text-red-400">{a.exited}</div>
            </div>
            <div className="dashboard-surface rounded-lg border border-border p-4 text-center">
              <div className="text-[9px] uppercase text-muted">Avg Tenure</div>
              <div className="text-2xl font-bold tabular-nums">{a.avgTenureMonths} mo</div>
            </div>
            <div className="dashboard-surface rounded-lg border border-border p-4 text-center">
              <div className="text-[9px] uppercase text-muted">90-Day Churn</div>
              <div className={cn("text-2xl font-bold tabular-nums", a.churnRate90 > 25 ? "text-red-400" : a.churnRate90 > 15 ? "text-amber-400" : "text-emerald-400")}>{a.churnRate90}%</div>
            </div>
          </div>

          {/* Exit Reasons */}
          {Object.keys(a.exitReasons).length > 0 && (
            <div className="dashboard-surface rounded-lg border border-border p-5">
              <h2 className="text-[10px] font-semibold uppercase tracking-wider text-muted mb-3">Exit Reasons</h2>
              <div className="space-y-2">
                {Object.entries(a.exitReasons).sort((a, b) => b[1] - a[1]).map(([reason, count]) => (
                  <div key={reason} className="flex items-center justify-between">
                    <span className="text-sm text-white">{reason}</span>
                    <div className="flex items-center gap-2">
                      <div className="h-2 rounded-full bg-red-500/30" style={{ width: `${Math.min((count / a.exited) * 100, 100)}%`, minWidth: 20 }} />
                      <span className="text-sm font-bold tabular-nums text-muted">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Hire Sources */}
          {Object.keys(a.sources).length > 0 && (
            <div className="dashboard-surface rounded-lg border border-border p-5">
              <h2 className="text-[10px] font-semibold uppercase tracking-wider text-muted mb-3">Hire Sources</h2>
              <div className="space-y-2">
                {Object.entries(a.sources).sort((a, b) => b[1] - a[1]).map(([source, count]) => (
                  <div key={source} className="flex items-center justify-between">
                    <span className="text-sm text-white">{source}</span>
                    <span className="text-sm font-bold tabular-nums text-brand">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Store Comparison */}
          {Object.keys(a.storeChurn).length > 1 && (
            <div className="dashboard-surface rounded-lg border border-border p-5">
              <h2 className="text-[10px] font-semibold uppercase tracking-wider text-muted mb-3">By Location</h2>
              <div className="space-y-3">
                {Object.entries(a.storeChurn).map(([slug, data]) => {
                  const sc = getStoreColor(slug);
                  const total = data.active + data.exited;
                  const turnoverPct = total > 0 ? ((data.exited / total) * 100).toFixed(0) : "0";
                  return (
                    <div key={slug} className={cn("rounded-lg border p-3 flex flex-wrap items-center justify-between gap-2", sc.border, sc.bg)}>
                      <div className="flex items-center gap-2">
                        <div className={cn("h-2.5 w-2.5 rounded-full", sc.dot)} />
                        <span className="text-sm font-medium text-white">{data.name}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs tabular-nums">
                        <span className="text-emerald-400">{data.active} active</span>
                        <span className="text-red-400">{data.exited} exited</span>
                        <span className="text-muted">{turnoverPct}% turnover</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      ) : tab === "roster" ? (
        <>
          <div className="flex flex-wrap gap-2 justify-center">
            {["all", "active", "exited"].map((s) => (
              <button key={s} type="button" onClick={() => setStatus(s as any)} className={cn("min-h-[44px] rounded-lg border px-2.5 py-1.5 text-xs font-medium capitalize", status === s ? "border-brand/50 bg-brand/15 text-brand" : "border-border/30 bg-black/20 text-muted")}>{s}</button>
            ))}
          </div>
          <div className="space-y-2">
            {employees.map((emp) => {
              const sc = getStoreColor(storeMap[emp.store_id]?.slug || "");
              return (
                <div key={emp.id} className={cn("rounded-lg border p-3", emp.status === "exited" ? "border-red-500/20 bg-red-500/5" : "border-border/50 bg-black/20")}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className={cn("h-2 w-2 rounded-full", sc.dot)} />
                      <span className="font-medium text-white text-sm">{emp.name}</span>
                      <span className="text-[10px] uppercase tracking-wider text-muted bg-muted/10 px-1.5 py-0.5 rounded">{ROLES[emp.role] || emp.role}</span>
                    </div>
                    {emp.status === "exited" && <span className="text-[10px] text-red-400 uppercase">Exited</span>}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted">
                    {emp.pay_rate && <span>${emp.pay_rate}/hr</span>}
                    <span>{tenureLabel(emp.hire_date, emp.exit_date)}</span>
                    {emp.source && <span>via {emp.source}</span>}
                    {emp.exit_reason && <span className="text-red-400">Left: {emp.exit_reason}</span>}
                    <span>{storeMap[emp.store_id]?.name}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : null}

      {/* Education Modal */}
      {showEducation && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0 }} onClick={() => setShowEducation(false)}>
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          <div className="relative w-full max-w-md mx-auto rounded-2xl border border-border bg-[#0d0f13] p-4 sm:p-5 shadow-2xl overflow-y-auto max-h-[85vh] min-w-0" onClick={(e) => e.stopPropagation()}>
            <button type="button" onClick={() => setShowEducation(false)} className="absolute top-3 right-3 min-h-[44px] min-w-[44px] flex items-center justify-center text-muted hover:text-white text-lg -mr-2" aria-label="Close">✕</button>
            <h3 className="text-base font-semibold text-brand mb-1">🎓 People Economics</h3>
            <p className="text-xs text-muted mb-4">Your most expensive hidden cost.</p>
            <div className="space-y-3 text-sm">
              <div>
                <h4 className="font-medium text-white mb-1">Employee CAC (Cost to Hire)</h4>
                <p className="text-muted text-xs leading-relaxed">Employee CAC = job posting fees + manager interview hours + training period + uniform/setup. Average pizzeria: $2,800-$4,200 per hire. If you lose 8 employees/year, that's $22K-$34K in hidden replacement cost.</p>
              </div>
              <div>
                <h4 className="font-medium text-white mb-1">Employee LTV (Value of Retention)</h4>
                <p className="text-muted text-xs leading-relaxed">A $14/hr employee who stays 18 months and generates $80/hr in SLPH has an LTV of ~$35,000 in productivity. One who quits at 3 months: ~$5,800. A $0.50/hr raise that keeps someone 6 months longer saves $3K+ in replacement cost.</p>
              </div>
              <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-3">
                <h4 className="font-medium text-red-400 text-xs mb-2">📕 When Churn Goes RED (&gt; 25% quarterly)</h4>
                <ol className="space-y-1.5 text-muted text-xs list-decimal list-inside leading-relaxed">
                  <li>Pull exit reasons for last 90 days. Group by: scheduling, pay, management, personal.</li>
                  <li>Compare churn by location — if one store is bleeding, it's usually management.</li>
                  <li>Review scheduling fairness — same people always getting bad shifts?</li>
                  <li>Calculate: exits × $3,500 avg replacement. Show this number to your managers.</li>
                  <li>Implement 30-day check-ins with new hires. Most turnover happens in first 60 days.</li>
                </ol>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
