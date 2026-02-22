"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { COCKPIT_STORE_SLUGS, COCKPIT_TARGETS, type CockpitStoreSlug } from "@/lib/cockpit-config";
import { getStoreColor } from "@/lib/store-colors";

function formatDollars(n: number): string {
  return "$" + n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

type PnlData = {
  storeName: string;
  monthLabel: string;
  daysWithData: number;
  daysInMonth: number;
  daysRemaining: number;
  actual: { sales: number; labor: number; food: number; disposables: number; prime: number; customers: number };
  projected: { sales: number; labor: number; food: number; disposables: number; prime: number; customers: number };
  percentages: { primePct: number; laborPct: number; foodDispPct: number; fixedPct: number; profitPct: number };
  projectedProfit: number;
  whatIf: { targetPrime: number; targetProfit: number; savings: number };
};

export default function PnlPage() {
  const [store, setStore] = useState<CockpitStoreSlug>(COCKPIT_STORE_SLUGS[0]);
  const [data, setData] = useState<PnlData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEducation, setShowEducation] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`/api/live-pnl?store=${store}`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        if (d.ok && d.projected) {
          setData(d);
        } else {
          setData(null);
          setError(d.message || d.error || "No data");
        }
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setError("Network error");
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [store]);

  const pct = data?.percentages;
  const profit = data?.projectedProfit ?? 0;
  const profitColor = profit >= 0 ? "text-emerald-400" : "text-red-400";
  const primePctColor = pct && pct.primePct <= 55 ? "text-emerald-400" : "text-red-400";

  return (
    <div className="space-y-5">
      <div className={`dashboard-toolbar p-3 sm:p-5 space-y-3 ${getStoreColor(store).glow}`}>
        <h1 className="text-lg font-semibold sm:text-2xl">Live P&L Projection</h1>
        <p className="text-xs text-muted">Where you'll land this month based on current trends.</p>
        <select
          value={store}
          onChange={(e) => setStore(e.target.value as CockpitStoreSlug)}
          className={`sm:hidden min-h-[44px] w-full max-w-[200px] rounded-lg border-2 px-3 py-2 text-sm font-medium focus:outline-none ${getStoreColor(store).borderActive} ${getStoreColor(store).bgActive} ${getStoreColor(store).text}`}
        >
          {COCKPIT_STORE_SLUGS.map((slug) => (
            <option key={slug} value={slug}>{COCKPIT_TARGETS[slug].name}</option>
          ))}
        </select>
        <div className="hidden sm:flex flex-wrap gap-2">
          {COCKPIT_STORE_SLUGS.map((slug) => (
            <button
              key={slug}
              type="button"
              onClick={() => setStore(slug)}
              className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                store === slug
                  ? `${getStoreColor(slug).borderActive} ${getStoreColor(slug).bgActive} ${getStoreColor(slug).text}`
                  : "border-border/50 bg-black/30 text-muted hover:border-border hover:bg-black/40"
              }`}
            >
              {COCKPIT_TARGETS[slug].name}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-4 animate-pulse">
          <div className="rounded-lg border border-border/50 p-6"><div className="h-10 w-32 bg-muted/20 rounded mb-2" /><div className="h-4 w-48 bg-muted/20 rounded" /></div>
          <div className="rounded-lg border border-border/50 p-6"><div className="h-6 w-full bg-muted/20 rounded mb-3" /><div className="h-6 w-full bg-muted/20 rounded mb-3" /><div className="h-6 w-full bg-muted/20 rounded" /></div>
        </div>
      ) : error ? (
        <div className="rounded-lg border border-border/50 p-6 text-center text-muted text-sm">{error}</div>
      ) : data ? (
        <>
          {/* Month + Progress */}
          <div className="dashboard-surface rounded-lg border border-border p-3 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-medium text-white">{data.monthLabel}</div>
              <div className="text-xs text-muted">{data.daysWithData} of {data.daysInMonth} days</div>
            </div>
            <div className="h-2 bg-muted/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand rounded-full"
                style={{ width: `${(data.daysWithData / data.daysInMonth) * 100}%` }}
              />
            </div>
          </div>

          {/* Projected Profit Hero */}
          <div className={`dashboard-scoreboard rounded-lg border p-3 sm:p-5 text-center ${profit >= 0 ? "border-emerald-500/50 bg-emerald-500/10" : "border-red-500/50 bg-red-500/10"}`}>
            <div className="text-[10px] font-medium uppercase tracking-widest text-muted/70">Projected Monthly Profit</div>
            <div className={`mt-3 text-3xl sm:text-5xl font-black tabular-nums ${profitColor}`}>
              {formatDollars(profit)}
            </div>
            <div className="text-xs text-muted mt-2">
              {pct?.profitPct}% margin on {formatDollars(data.projected.sales)} projected revenue
            </div>
          </div>

          {/* Projected Gross Profit Hero */}
          <div className="dashboard-scoreboard rounded-lg border border-border/50 p-3 sm:p-5 text-center">
            <div className="text-[10px] font-medium uppercase tracking-widest text-muted/70 flex items-center justify-center gap-1.5 flex-wrap">
              Projected Gross Profit
              <button
                type="button"
                onClick={() => setShowEducation("gp")}
                className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-full bg-muted/20 text-muted hover:bg-brand/20 hover:text-brand transition-colors text-xs font-bold"
                aria-label="Learn more"
              >
                i
              </button>
            </div>
            <div className="text-xs text-muted mt-2">
              Revenue minus PRIME (controllable costs). Fixed costs not included.
            </div>
            <div className={`text-sm font-semibold mt-2 ${
              data.projected.sales > 0 && ((data.projected.sales - data.projected.prime) / data.projected.sales * 100) >= 45
                ? "text-emerald-400"
                : "text-red-400"
            }`}>
              GP: {data.projected.sales > 0 ? ((data.projected.sales - data.projected.prime) / data.projected.sales * 100).toFixed(1) : 0}%
              {" "}
              <span className="text-muted font-normal">Target: ≥45%</span>
            </div>
          </div>

          {/* P&L Breakdown */}
          <div className="dashboard-surface rounded-lg border border-border p-3 sm:p-5">
            <h2 className="text-[10px] font-semibold uppercase tracking-wider text-muted mb-4">Projected Month-End</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted">Revenue</span>
                <span className="text-sm font-bold tabular-nums">{formatDollars(data.projected.sales)}</span>
              </div>
              <div className="border-t border-border/30" />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted">Labor ({pct?.laborPct}%)</span>
                <span className="text-sm font-bold tabular-nums text-red-300">-{formatDollars(data.projected.labor)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted">Food + Disp ({pct?.foodDispPct}%)</span>
                <span className="text-sm font-bold tabular-nums text-red-300">-{formatDollars(data.projected.food + data.projected.disposables)}</span>
              </div>
              <div className="flex items-center justify-between font-semibold">
                <span className={`text-sm ${primePctColor} flex items-center gap-1.5`}>
                  PRIME ({pct?.primePct}%)
                  <button
                    type="button"
                    onClick={() => setShowEducation("prime")}
                    className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-full bg-muted/20 text-muted hover:bg-brand/20 hover:text-brand transition-colors text-xs font-bold"
                    aria-label="Learn more"
                  >
                    i
                  </button>
                </span>
                <span className={`text-sm tabular-nums ${primePctColor}`}>-{formatDollars(data.projected.prime)}</span>
              </div>
              <div className="border-t border-border/30" />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted">Fixed Costs ({pct?.fixedPct}%)</span>
                <span className="text-sm font-bold tabular-nums text-red-300">-{formatDollars(Math.round(data.projected.sales * (pct?.fixedPct ?? 30) / 100))}</span>
              </div>
              <div className="border-t border-border/50" />
              <div className="flex items-center justify-between">
                <span className={`text-sm font-bold ${profitColor}`}>Profit ({pct?.profitPct}%)</span>
                <span className={`text-sm font-black tabular-nums ${profitColor}`}>{formatDollars(profit)}</span>
              </div>
            </div>
          </div>

          {/* What-If */}
          <div className="rounded-lg border border-brand/30 bg-brand/5 p-3 sm:p-5">
            <h2 className="text-xs font-semibold text-brand mb-3 flex items-center gap-1.5">
              💡 What If PRIME Hit {data.whatIf.targetPrime}%?
              <button
                type="button"
                onClick={() => setShowEducation("whatif")}
                className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-full bg-muted/20 text-muted hover:bg-brand/20 hover:text-brand transition-colors text-xs font-bold"
                aria-label="Learn more"
              >
                i
              </button>
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-[10px] uppercase text-muted">Projected Profit</div>
                <div className="text-lg font-bold tabular-nums text-emerald-400">{formatDollars(data.whatIf.targetProfit)}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase text-muted">Extra Profit vs Current</div>
                <div className="text-lg font-bold tabular-nums text-brand">+{formatDollars(data.whatIf.savings)}</div>
              </div>
            </div>
            <p className="text-xs text-muted mt-3">
              Dropping PRIME from {pct?.primePct}% to {data.whatIf.targetPrime}% would add {formatDollars(data.whatIf.savings)} to your bottom line this month. That's {formatDollars(data.whatIf.savings * 12)}/year.
            </p>
          </div>

          {/* Actual vs Projected */}
          <div className="dashboard-surface rounded-lg border border-border p-3 sm:p-5">
            <h2 className="text-[10px] font-semibold uppercase tracking-wider text-muted mb-4">Actual So Far ({data.daysWithData} days)</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div>
                <div className="text-[10px] uppercase text-muted">Revenue</div>
                <div className="text-lg font-bold tabular-nums">{formatDollars(data.actual.sales)}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase text-muted">PRIME $</div>
                <div className="text-lg font-bold tabular-nums">{formatDollars(data.actual.prime)}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase text-muted">Customers</div>
                <div className="text-lg font-bold tabular-nums">{data.actual.customers.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase text-muted">Avg/Day</div>
                <div className="text-lg font-bold tabular-nums">{formatDollars(Math.round(data.actual.sales / data.daysWithData))}</div>
              </div>
            </div>
          </div>
        </>
      ) : null}

      {showEducation && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0 }} onClick={() => setShowEducation(null)}>
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          <div className="relative w-full max-w-md mx-auto rounded-2xl border border-border bg-[#0d0f13] p-4 sm:p-5 shadow-2xl overflow-y-auto max-h-[85vh] min-w-0" onClick={(e) => e.stopPropagation()}>
            <button type="button" onClick={() => setShowEducation(null)} className="absolute top-3 right-3 min-h-[44px] min-w-[44px] flex items-center justify-center text-muted hover:text-white text-lg -mr-2" aria-label="Close">✕</button>

            {showEducation === "gp" && (
              <div>
                <h3 className="text-base font-semibold text-brand mb-1">🎓 Gross Profit</h3>
                <p className="text-xs text-muted mb-4">What's left after controllable costs.</p>
                <div className="space-y-3 text-sm">
                  <div><h4 className="font-medium text-white mb-1">How It's Calculated</h4><p className="text-muted text-xs leading-relaxed">Gross Profit = Revenue − PRIME costs (Labor + Food + Disposables). This is NOT net profit — your fixed costs (rent, insurance, utilities) still come out of this number.</p></div>
                  <div><h4 className="font-medium text-white mb-1">Why It Matters</h4><p className="text-muted text-xs leading-relaxed">GP tells you how much money your operations generate before fixed costs. If GP is 45% and fixed costs are 30%, you net 15%. If GP drops to 38%, you're only netting 8% — nearly half the profit gone.</p></div>
                </div>
              </div>
            )}
            {showEducation === "prime" && (
              <div>
                <h3 className="text-base font-semibold text-brand mb-1">🎓 PRIME % on the P&L</h3>
                <p className="text-xs text-muted mb-4">Your total controllable cost burden.</p>
                <div className="space-y-3 text-sm">
                  <div><h4 className="font-medium text-white mb-1">Reading the P&L</h4><p className="text-muted text-xs leading-relaxed">PRIME on the P&L shows your projected month-end controllable costs as a dollar amount and percentage. The lower this number, the more gross profit you keep. Every point of PRIME you cut adds directly to the bottom line.</p></div>
                </div>
              </div>
            )}
            {showEducation === "whatif" && (
              <div>
                <h3 className="text-base font-semibold text-brand mb-1">🎓 The What-If Scenario</h3>
                <p className="text-xs text-muted mb-4">See the money you're leaving on the table.</p>
                <div className="space-y-3 text-sm">
                  <div><h4 className="font-medium text-white mb-1">How It Works</h4><p className="text-muted text-xs leading-relaxed">This shows what your profit would be if you hit the PRIME target of 55%. The difference between current projected profit and target profit is money left on the table — recoverable through better portioning, scheduling, and waste control.</p></div>
                  <div><h4 className="font-medium text-white mb-1">How To Use It</h4><p className="text-muted text-xs leading-relaxed">Show this number to your managers. "We're leaving $X on the table this month." Then use the playbooks on the Daily page to attack the biggest gap — usually food cost or labor.</p></div>
                </div>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
