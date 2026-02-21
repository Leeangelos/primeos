"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { COCKPIT_STORE_SLUGS, COCKPIT_TARGETS, type CockpitStoreSlug } from "@/lib/cockpit-config";
import { getStoreColor } from "@/lib/store-colors";

function todayYYYYMMDD(): string {
  const t = new Date();
  const y = t.getFullYear();
  const m = String(t.getMonth() + 1).padStart(2, "0");
  const d = String(t.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

type StoreSnapshot = {
  slug: CockpitStoreSlug;
  name: string;
  primePct: number | null;
  laborPct: number | null;
  slph: number | null;
  status: "on_track" | "over" | null;
  acknowledged?: boolean;
};

export default function HomePage() {
  const [snapshots, setSnapshots] = useState<StoreSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const today = todayYYYYMMDD();

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const results: StoreSnapshot[] = [];
      for (const slug of COCKPIT_STORE_SLUGS) {
        try {
          const res = await fetch(`/api/daily-kpi?store=${slug}&date=${today}`);
          const data = await res.json();
          const targets = COCKPIT_TARGETS[slug];
          if (data.ok && data.entry) {
            const e = data.entry;
            const ns = e.net_sales ?? 0;
            const lc = e.labor_dollars ?? 0;
            const fc = e.food_dollars ?? 0;
            const dc = e.disposables_dollars ?? 0;
            const lh = e.labor_hours ?? 0;
            const primeDollars = lc + fc + dc;
            const primePct = ns > 0 ? (primeDollars / ns) * 100 : null;
            const laborPct = ns > 0 ? (lc / ns) * 100 : null;
            const slph = lh > 0 ? ns / lh : null;
            const status = primePct != null ? (primePct <= targets.primeMax ? "on_track" : "over") : null;
            const acknowledged = !!(e as { acknowledged_at?: unknown }).acknowledged_at;
            results.push({ slug, name: targets.name, primePct, laborPct, slph, status, acknowledged });
          } else {
            results.push({ slug, name: targets.name, primePct: null, laborPct: null, slph: null, status: null });
          }
        } catch {
          results.push({ slug, name: COCKPIT_TARGETS[slug].name, primePct: null, laborPct: null, slph: null, status: null });
        }
      }
      if (!cancelled) {
        setSnapshots(results);
        setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [today]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">PrimeOS</h1>
          <p className="mt-1 text-sm text-muted">
            Today's pulse — {new Date(today + "T12:00:00Z").toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {COCKPIT_STORE_SLUGS.map((slug) => (
            <div key={slug} className="dashboard-scoreboard rounded-lg border border-border/50 p-5 animate-pulse">
              <div className="h-3 w-24 bg-muted/20 rounded mb-3" />
              <div className="h-10 w-20 bg-muted/20 rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {snapshots.map((s) => (
            <Link key={s.slug} href={`/daily?store=${s.slug}&date=${today}`} className="block">
              <div
                className={`rounded-lg border p-4 transition-colors active:bg-black/40 ${getStoreColor(s.slug).border} ${getStoreColor(s.slug).bg} ${getStoreColor(s.slug).glow}`}
              >
                <div className="flex items-center gap-2">
                  <div className={`h-2.5 w-2.5 rounded-full ${getStoreColor(s.slug).dot}`} />
                  <span className="font-medium text-white">{s.name}</span>
                  {s.acknowledged && <span className="text-emerald-400 text-xs">✓</span>}
                </div>
                <div
                  className={`mt-2 text-4xl font-black tabular-nums ${
                    s.status === "on_track"
                      ? "text-emerald-300"
                      : s.status === "over"
                        ? "text-red-300"
                        : "text-white"
                  }`}
                >
                  {s.primePct != null ? `${s.primePct.toFixed(1)}%` : "—"}
                </div>
                <div className="text-[10px] uppercase tracking-wider text-muted/70 mt-1">PRIME %</div>
                <div className="mt-3 flex gap-4 text-xs text-muted">
                  <span>Labor: {s.laborPct != null ? `${s.laborPct.toFixed(1)}%` : "—"}</span>
                  <span>SLPH: {s.slph != null ? s.slph.toFixed(0) : "—"}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Link href="/daily" className="block">
          <div className="dashboard-surface rounded-lg border border-border/50 p-4 hover:border-brand/30 transition-colors">
            <div className="text-sm font-medium">Daily Entry</div>
            <div className="text-xs text-muted mt-1">90-second number entry</div>
          </div>
        </Link>
        <Link href="/weekly" className="block">
          <div className="dashboard-surface rounded-lg border border-border/50 p-4 hover:border-brand/30 transition-colors">
            <div className="text-sm font-medium">Weekly Cockpit</div>
            <div className="text-xs text-muted mt-1">Trends + comparisons</div>
          </div>
        </Link>
      </div>
    </div>
  );
}
