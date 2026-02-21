"use client";

import { useState, useEffect } from "react";

function todayYYYYMMDD(): string {
  const t = new Date();
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
}

function prevDay(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

function nextDay(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00Z");
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

type StoreMetrics = {
  sales: number;
  primePct: number | null;
  laborPct: number | null;
  foodPct: number | null;
  slph: number | null;
};

export default function BriefPage() {
  const [date, setDate] = useState(todayYYYYMMDD);
  const [brief, setBrief] = useState<string | null>(null);
  const [storeData, setStoreData] = useState<Record<string, StoreMetrics | null>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadBrief(d: string) {
    setLoading(true);
    setError(null);
    setBrief(null);
    setStoreData({});

    try {
      const res = await fetch(`/api/morning-brief?date=${d}`);
      const data = await res.json();

      if (data.ok) {
        setBrief(data.brief);
        setStoreData(data.storeData || {});
      } else {
        setError(data.error || "Failed to generate brief");
      }
    } catch {
      setError("Network error — check your connection");
    }

    setLoading(false);
  }

  useEffect(() => {
    loadBrief(date);
  }, [date]);

  function pctColor(val: number | null, redAbove: number): string {
    if (val == null) return "text-muted";
    return val > redAbove ? "text-red-400" : "text-emerald-400";
  }

  return (
    <div className="space-y-5">
      <div className="dashboard-toolbar p-4 sm:p-5 space-y-3">
        <h1 className="text-lg font-semibold sm:text-2xl">Morning Brief</h1>
        <p className="text-xs text-muted">AI-generated summary of yesterday's operations. Powered by Claude.</p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setDate(prevDay(date))}
            className="rounded-lg border border-border/50 bg-black/30 px-3 py-3 text-muted hover:text-white hover:border-border transition-colors"
          >
            ←
          </button>
          <div className="flex-1 text-center">
            <div className="text-sm font-medium">{formatDate(date)}</div>
          </div>
          <button
            type="button"
            onClick={() => setDate(nextDay(date))}
            disabled={date >= todayYYYYMMDD()}
            className="rounded-lg border border-border/50 bg-black/30 px-3 py-3 text-muted hover:text-white hover:border-border transition-colors disabled:opacity-30"
          >
            →
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className="dashboard-surface rounded-lg border border-border p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-8 w-8 rounded-full bg-brand/20 animate-pulse" />
              <div className="h-4 w-48 bg-muted/20 rounded animate-pulse" />
            </div>
            <div className="space-y-2 animate-pulse">
              <div className="h-3 w-full bg-muted/20 rounded" />
              <div className="h-3 w-11/12 bg-muted/20 rounded" />
              <div className="h-3 w-10/12 bg-muted/20 rounded" />
              <div className="h-3 w-9/12 bg-muted/20 rounded" />
              <div className="h-3 w-full bg-muted/20 rounded" />
              <div className="h-3 w-8/12 bg-muted/20 rounded" />
            </div>
          </div>
          <div className="text-center text-xs text-muted">Generating brief with Claude AI — takes a few seconds...</div>
        </div>
      ) : error ? (
        <div className="dashboard-surface rounded-lg border border-red-500/30 bg-red-500/5 p-5">
          <p className="text-sm text-red-400 mb-3">{error}</p>
          <button
            type="button"
            onClick={() => loadBrief(date)}
            className="rounded-lg border border-brand/50 bg-brand/15 px-4 py-2 text-sm font-semibold text-brand hover:bg-brand/25"
          >
            Retry
          </button>
        </div>
      ) : brief ? (
        <>
          <div className="dashboard-surface rounded-lg border border-border p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-8 w-8 rounded-full bg-brand/20 flex items-center justify-center text-brand text-sm font-bold">P</div>
              <div>
                <div className="text-sm font-semibold text-white">Profit Pulse</div>
                <div className="text-[10px] text-muted uppercase tracking-wider">Morning Brief • {formatDate(date)}</div>
              </div>
            </div>
            <div className="text-sm text-muted leading-relaxed whitespace-pre-wrap">{brief}</div>
          </div>

          {Object.keys(storeData).length > 0 && (
            <div className="space-y-2">
              <h2 className="text-[10px] font-semibold uppercase tracking-wider text-muted px-1">Store Snapshot</h2>
              {Object.entries(storeData).map(([name, metrics]) => {
                if (!metrics) return (
                  <div key={name} className="rounded-lg border border-border/50 bg-black/20 p-4">
                    <span className="font-medium text-white">{name}</span>
                    <span className="text-xs text-muted ml-2">No data</span>
                  </div>
                );
                return (
                  <div key={name} className="rounded-lg border border-border/50 bg-black/20 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-medium text-white">{name}</span>
                      <span className="text-sm font-medium tabular-nums text-muted">
                        ${metrics.sales.toLocaleString()}
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-center">
                      <div>
                        <div className="text-[9px] uppercase text-muted">PRIME</div>
                        <div className={`text-sm font-bold tabular-nums ${pctColor(metrics.primePct, 55)}`}>
                          {metrics.primePct != null ? `${metrics.primePct}%` : "—"}
                        </div>
                      </div>
                      <div>
                        <div className="text-[9px] uppercase text-muted">Labor</div>
                        <div className={`text-sm font-bold tabular-nums ${pctColor(metrics.laborPct, 24)}`}>
                          {metrics.laborPct != null ? `${metrics.laborPct}%` : "—"}
                        </div>
                      </div>
                      <div>
                        <div className="text-[9px] uppercase text-muted">Food</div>
                        <div className={`text-sm font-bold tabular-nums ${pctColor(metrics.foodPct, 33)}`}>
                          {metrics.foodPct != null ? `${metrics.foodPct}%` : "—"}
                        </div>
                      </div>
                      <div>
                        <div className="text-[9px] uppercase text-muted">SLPH</div>
                        <div className={`text-sm font-bold tabular-nums ${metrics.slph != null && metrics.slph < 65 ? "text-red-400" : "text-emerald-400"}`}>
                          {metrics.slph != null ? metrics.slph : "—"}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
