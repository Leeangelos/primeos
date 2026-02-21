"use client";

import { Suspense, useState, useEffect } from "react";
import {
  COCKPIT_STORE_SLUGS,
  COCKPIT_TARGETS,
  type CockpitStoreSlug,
} from "@/lib/cockpit-config";

function formatPct(n: number | null): string {
  if (n == null || Number.isNaN(n)) return "—";
  return `${n.toFixed(1)}%`;
}

function formatDollars(n: number | null): string {
  if (n == null || Number.isNaN(n)) return "—";
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function formatNum(n: number | null): string {
  if (n == null || Number.isNaN(n)) return "—";
  return n.toFixed(1);
}

type MonthOption = { label: string; startDate: string; endDate: string };

function getMonthOptions(): MonthOption[] {
  const options: MonthOption[] = [];
  const now = new Date();
  for (let i = 0; i < 3; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = d.getFullYear();
    const month = d.getMonth();
    const start = `${year}-${String(month + 1).padStart(2, "0")}-01`;
    const lastDay = new Date(year, month + 1, 0).getDate();
    const end = `${year}-${String(month + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
    const label = d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    options.push({ label, startDate: start, endDate: end });
  }
  return options;
}

type StoreSummary = {
  slug: CockpitStoreSlug;
  name: string;
  totalSales: number;
  totalLabor: number;
  totalFood: number;
  totalDisposables: number;
  totalHours: number;
  totalCustomers: number;
  totalVoids: number;
  totalWaste: number;
  daysCount: number;
  primePct: number | null;
  laborPct: number | null;
  foodDispPct: number | null;
  slph: number | null;
  avgDailySales: number | null;
  status: "on_track" | "over" | null;
};

function MonthlyContent() {
  const monthOptions = getMonthOptions();
  const [selectedMonth, setSelectedMonth] = useState(0);
  const [storeFilter, setStoreFilter] = useState<"all" | CockpitStoreSlug>("all");
  const [summaries, setSummaries] = useState<StoreSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const month = monthOptions[selectedMonth];

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    async function load() {
      const slugs = storeFilter === "all" ? [...COCKPIT_STORE_SLUGS] : [storeFilter];
      const results: StoreSummary[] = [];

      const fetches = slugs.map(async (slug) => {
        const res = await fetch(
          `/api/monthly-summary?store=${slug}&start=${month.startDate}&end=${month.endDate}`
        );
        const data = await res.json();
        const targets = COCKPIT_TARGETS[slug];

        if (!data.ok || !data.summary) {
          return {
            slug, name: targets.name,
            totalSales: 0, totalLabor: 0, totalFood: 0, totalDisposables: 0,
            totalHours: 0, totalCustomers: 0, totalVoids: 0, totalWaste: 0,
            daysCount: 0, primePct: null, laborPct: null, foodDispPct: null,
            slph: null, avgDailySales: null, status: null,
          } as StoreSummary;
        }

        const s = data.summary;
        const primeDollars = s.totalLabor + s.totalFood + s.totalDisposables;
        const primePct = s.totalSales > 0 ? (primeDollars / s.totalSales) * 100 : null;
        const laborPct = s.totalSales > 0 ? (s.totalLabor / s.totalSales) * 100 : null;
        const foodDispPct = s.totalSales > 0 ? ((s.totalFood + s.totalDisposables) / s.totalSales) * 100 : null;
        const slph = s.totalHours > 0 ? s.totalSales / s.totalHours : null;
        const avgDailySales = data.daysCount > 0 ? s.totalSales / data.daysCount : null;
        const status = primePct != null ? (primePct <= targets.primeMax ? "on_track" : "over") : null;

        return {
          slug, name: targets.name,
          totalSales: s.totalSales, totalLabor: s.totalLabor,
          totalFood: s.totalFood, totalDisposables: s.totalDisposables,
          totalHours: s.totalHours, totalCustomers: s.totalCustomers,
          totalVoids: s.totalVoids, totalWaste: s.totalWaste,
          daysCount: data.daysCount,
          primePct, laborPct, foodDispPct, slph, avgDailySales, status,
        } as StoreSummary;
      });

      const settled = await Promise.all(fetches);
      if (!cancelled) {
        setSummaries(settled);
        setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [selectedMonth, storeFilter, month.startDate, month.endDate]);

  const orgTotals = summaries.length > 1 ? {
    totalSales: summaries.reduce((s, r) => s + r.totalSales, 0),
    totalLabor: summaries.reduce((s, r) => s + r.totalLabor, 0),
    totalFood: summaries.reduce((s, r) => s + r.totalFood, 0),
    totalDisp: summaries.reduce((s, r) => s + r.totalDisposables, 0),
    totalHours: summaries.reduce((s, r) => s + r.totalHours, 0),
    totalCustomers: summaries.reduce((s, r) => s + r.totalCustomers, 0),
    daysCount: Math.max(...summaries.map((r) => r.daysCount)),
  } : null;

  const orgPrime = orgTotals && orgTotals.totalSales > 0
    ? ((orgTotals.totalLabor + orgTotals.totalFood + orgTotals.totalDisp) / orgTotals.totalSales) * 100
    : null;

  return (
    <div className="space-y-6">
      <div className="dashboard-toolbar p-4 sm:p-5 space-y-3">
        <h1 className="text-lg font-semibold sm:text-2xl">Monthly P&L Summary</h1>
        <div className="flex flex-wrap gap-2">
          {monthOptions.map((opt, i) => (
            <button
              key={opt.startDate}
              type="button"
              onClick={() => setSelectedMonth(i)}
              className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                selectedMonth === i
                  ? "border-brand/50 bg-brand/15 text-brand"
                  : "border-border/50 bg-black/30 text-muted hover:border-border hover:bg-black/40"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={storeFilter}
            onChange={(e) => setStoreFilter(e.target.value as "all" | CockpitStoreSlug)}
            className="sm:hidden dashboard-input rounded-lg border border-border/50 bg-black/30 px-3 py-2 text-sm font-medium text-brand focus:border-brand/60 focus:ring-1 focus:ring-brand/40 focus:outline-none"
          >
            <option value="all">All Stores</option>
            {COCKPIT_STORE_SLUGS.map((slug) => (
              <option key={slug} value={slug}>{COCKPIT_TARGETS[slug].name}</option>
            ))}
          </select>
          <div className="hidden sm:flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setStoreFilter("all")}
              className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                storeFilter === "all"
                  ? "border-brand/50 bg-brand/15 text-brand"
                  : "border-border/50 bg-black/30 text-muted hover:border-border hover:bg-black/40"
              }`}
            >
              All Stores
            </button>
            {COCKPIT_STORE_SLUGS.map((slug) => (
              <button
                key={slug}
                type="button"
                onClick={() => setStoreFilter(slug)}
                className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                  storeFilter === slug
                    ? "border-brand/50 bg-brand/15 text-brand"
                    : "border-border/50 bg-black/30 text-muted hover:border-border hover:bg-black/40"
                }`}
              >
                {COCKPIT_TARGETS[slug].name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="dashboard-scoreboard rounded-lg border border-border/50 p-5 animate-pulse">
              <div className="h-4 w-32 bg-muted/20 rounded mb-3" />
              <div className="h-10 w-24 bg-muted/20 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <>
          {orgTotals && orgPrime != null && (
            <div className={`dashboard-scoreboard rounded-lg border p-5 text-center ${
              orgPrime <= 55 ? "border-emerald-500/50 bg-emerald-500/10" : "border-red-500/50 bg-red-500/10"
            }`}>
              <div className="text-[10px] font-medium uppercase tracking-widest text-muted/70">Org PRIME %</div>
              <div className={`mt-3 text-5xl font-black tabular-nums ${
                orgPrime <= 55 ? "text-emerald-300" : "text-red-300"
              }`}>
                {orgPrime.toFixed(1)}%
              </div>
              <div className="mt-2 text-xs text-muted">
                {formatDollars(orgTotals.totalSales)} revenue · {orgTotals.totalCustomers.toLocaleString()} customers · {orgTotals.daysCount} days
              </div>
            </div>
          )}

          <div className="space-y-3">
            {summaries.map((s) => (
              <div
                key={s.slug}
                className={`rounded-lg border p-5 ${
                  s.status === "on_track"
                    ? "border-emerald-500/50 bg-emerald-500/10"
                    : s.status === "over"
                      ? "border-red-500/50 bg-red-500/10"
                      : "border-border/50"
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="font-medium">{s.name}</span>
                  <span className={`text-sm font-medium ${
                    s.status === "on_track" ? "text-emerald-400" : s.status === "over" ? "text-red-400" : "text-muted"
                  }`}>
                    PRIME: {formatPct(s.primePct)}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div>
                    <div className="text-[10px] uppercase text-muted">Revenue</div>
                    <div className="text-lg font-bold tabular-nums">{formatDollars(s.totalSales)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase text-muted">Avg Daily</div>
                    <div className="text-lg font-bold tabular-nums">{formatDollars(s.avgDailySales)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase text-muted">Labor %</div>
                    <div className="text-lg font-bold tabular-nums">{formatPct(s.laborPct)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase text-muted">Food+Disp %</div>
                    <div className="text-lg font-bold tabular-nums">{formatPct(s.foodDispPct)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase text-muted">SLPH</div>
                    <div className="text-lg font-bold tabular-nums">{formatNum(s.slph)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase text-muted">Customers</div>
                    <div className="text-lg font-bold tabular-nums">{s.totalCustomers.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase text-muted">Days</div>
                    <div className="text-lg font-bold tabular-nums">{s.daysCount}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase text-muted">Labor $</div>
                    <div className="text-lg font-bold tabular-nums">{formatDollars(s.totalLabor)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function MonthlyPage() {
  return (
    <Suspense fallback={
      <div className="space-y-4 animate-pulse">
        <div className="dashboard-toolbar p-5"><div className="h-7 w-48 bg-muted/20 rounded" /></div>
        <div className="h-32 bg-muted/20 rounded-lg" />
        <div className="h-48 bg-muted/20 rounded-lg" />
      </div>
    }>
      <MonthlyContent />
    </Suspense>
  );
}
