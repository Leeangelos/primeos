"use client";

import { useState, useMemo, useEffect } from "react";
import {
  STORE_TARGETS,
  getPrimeStatus,
  getLaborStatus,
  getSlphStatus,
  getFoodStatus,
  type StoreId,
  type KpiStatus,
} from "@/lib/daily-targets";
import { cn } from "@/lib/utils";

function todayYYYYMMDD(): string {
  const t = new Date();
  const y = t.getFullYear();
  const m = String(t.getMonth() + 1).padStart(2, "0");
  const d = String(t.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatPct(n: number | null): string {
  if (n == null || Number.isNaN(n)) return "—";
  return `${n.toFixed(1)}%`;
}

function formatSlph(n: number | null): string {
  if (n == null || Number.isNaN(n)) return "—";
  return n.toFixed(1);
}

const STATUS_STYLES: Record<KpiStatus, string> = {
  green:
    "bg-emerald-500/15 ring-emerald-500/30 text-emerald-400 dark:ring-emerald-400/25",
  yellow:
    "bg-amber-500/15 ring-amber-500/30 text-amber-400 dark:ring-amber-400/25",
  red: "bg-red-500/15 ring-red-500/30 text-red-400 dark:ring-red-400/25",
};

type SaveStatus = "idle" | "saving" | "saved" | "error";

export default function DailyPage() {
  const [storeId, setStoreId] = useState<StoreId>("leeangelo");
  const [businessDate, setBusinessDate] = useState<string>(() => todayYYYYMMDD());
  const [sales, setSales] = useState<string>("");
  const [primeCost, setPrimeCost] = useState<string>("");
  const [laborCost, setLaborCost] = useState<string>("");
  const [foodCost, setFoodCost] = useState<string>("");
  const [disposablesCost, setDisposablesCost] = useState<string>("");
  const [laborHours, setLaborHours] = useState<string>("");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");

  useEffect(() => {
    const slug = storeId;
    const date = businessDate;
    let cancelled = false;
    setSaveStatus("idle");
    fetch(`/api/daily-kpi?store=${encodeURIComponent(slug)}&date=${encodeURIComponent(date)}`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled || !data.ok) return;
        const e = data.entry;
        if (e) {
          setSales(e.net_sales != null ? String(e.net_sales) : "");
          setLaborHours(e.labor_hours != null ? String(e.labor_hours) : "");
          setLaborCost(e.labor_dollars != null ? String(e.labor_dollars) : "");
          setFoodCost(e.food_dollars != null ? String(e.food_dollars) : "");
          setDisposablesCost(e.disposables_dollars != null ? String(e.disposables_dollars) : "");
        } else {
          setSales("");
          setLaborHours("");
          setLaborCost("");
          setFoodCost("");
          setDisposablesCost("");
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [storeId, businessDate]);

  const num = (s: string) => (s === "" ? null : parseFloat(s)) ?? null;
  const s = num(sales);
  const pH = num(laborHours);

  const kpis = useMemo(() => {
    const primePct = s != null && s > 0 && num(primeCost) != null
      ? (num(primeCost)! / s) * 100
      : null;
    const laborPct = s != null && s > 0 && num(laborCost) != null
      ? (num(laborCost)! / s) * 100
      : null;
    const foodPct = s != null && s > 0 && num(foodCost) != null && num(disposablesCost) != null
      ? ((num(foodCost)! + num(disposablesCost)!) / s) * 100
      : null;
    const slph = s != null && pH != null && pH > 0 ? s / pH : null;
    return {
      primePct,
      laborPct,
      foodPct,
      slph,
    };
  }, [sales, primeCost, laborCost, foodCost, disposablesCost, laborHours]);

  const targets = STORE_TARGETS[storeId];
  const primeStatus = getPrimeStatus(storeId, kpis.primePct);
  const laborStatus = getLaborStatus(storeId, kpis.laborPct);
  const slphStatus = getSlphStatus(storeId, kpis.slph);
  const foodStatus = getFoodStatus(storeId, kpis.foodPct);

  const scoreboardItems: { label: string; value: string; target: string; status: KpiStatus }[] = [
    { label: "PRIME %", value: formatPct(kpis.primePct), target: `≤${targets.primeMax}%`, status: primeStatus },
    { label: "Labor %", value: formatPct(kpis.laborPct), target: targets.laborMin != null ? `${targets.laborMin}–${targets.laborMax}%` : `≤${targets.laborMax}%`, status: laborStatus },
    { label: "SLPH", value: formatSlph(kpis.slph), target: `${targets.slphMin}+`, status: slphStatus },
    { label: "Food %", value: formatPct(kpis.foodPct), target: `≤${targets.foodDisposablesMax}%`, status: foodStatus },
  ];

  return (
    <div className="space-y-6">
      {/* Store + context */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold sm:text-2xl">Daily KPI Entry</h1>
          <p className="mt-0.5 text-sm text-muted">
            Business cutoff: 4:00 AM America/New_York • Manual entry • PRIME-first
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="date"
            value={businessDate}
            onChange={(e) => setBusinessDate(e.target.value)}
            className="rounded-2xl border-0 bg-panel/50 px-3 py-2.5 text-sm ring-1 ring-border/30 focus:ring-2 focus:ring-brand/50"
          />
          {(["leeangelo", "lindsey"] as const).map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setStoreId(id)}
              className={cn(
                "rounded-2xl px-4 py-2.5 text-sm font-medium transition-all",
                storeId === id
                  ? "bg-brand/20 text-brand ring-1 ring-brand/40"
                  : "bg-panel/50 text-muted ring-1 ring-border/30 hover:ring-border/50"
              )}
            >
              {STORE_TARGETS[id].name}
            </button>
          ))}
        </div>
      </div>

      {/* Live scoreboard — 4 KPIs in priority order */}
      <div className="grid grid-cols-2 gap-3">
        {scoreboardItems.map(({ label, value, target, status }) => (
          <div
            key={label}
            className={cn(
              "rounded-2xl p-4 ring-1 transition-all",
              STATUS_STYLES[status]
            )}
          >
            <div className="text-xs font-medium uppercase tracking-wide opacity-90">
              {label}
            </div>
            <div className="mt-1 text-2xl font-semibold tabular-nums">
              {value}
            </div>
            <div className="mt-0.5 text-xs opacity-85">
              Target: {target}
            </div>
          </div>
        ))}
      </div>

      {/* Large numeric inputs — thumb-friendly, minimal scroll */}
      <div className="space-y-4">
        <h2 className="text-sm font-medium text-muted">Enter numbers</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="block text-sm text-muted">Sales ($)</span>
            <input
              type="number"
              inputMode="decimal"
              placeholder="0"
              value={sales}
              onChange={(e) => setSales(e.target.value)}
              className="mt-1 w-full rounded-2xl border-0 bg-panel/60 px-4 py-3.5 text-lg font-medium tabular-nums ring-1 ring-border/40 placeholder:text-muted focus:ring-2 focus:ring-brand/50"
            />
          </label>
          <label className="block">
            <span className="block text-sm text-muted">Labor hours</span>
            <input
              type="number"
              inputMode="decimal"
              placeholder="0"
              value={laborHours}
              onChange={(e) => setLaborHours(e.target.value)}
              className="mt-1 w-full rounded-2xl border-0 bg-panel/60 px-4 py-3.5 text-lg font-medium tabular-nums ring-1 ring-border/40 placeholder:text-muted focus:ring-2 focus:ring-brand/50"
            />
          </label>
          <label className="block">
            <span className="block text-sm text-muted">PRIME cost ($)</span>
            <input
              type="number"
              inputMode="decimal"
              placeholder="0"
              value={primeCost}
              onChange={(e) => setPrimeCost(e.target.value)}
              className="mt-1 w-full rounded-2xl border-0 bg-panel/60 px-4 py-3.5 text-lg font-medium tabular-nums ring-1 ring-border/40 placeholder:text-muted focus:ring-2 focus:ring-brand/50"
            />
          </label>
          <label className="block">
            <span className="block text-sm text-muted">Labor cost ($)</span>
            <input
              type="number"
              inputMode="decimal"
              placeholder="0"
              value={laborCost}
              onChange={(e) => setLaborCost(e.target.value)}
              className="mt-1 w-full rounded-2xl border-0 bg-panel/60 px-4 py-3.5 text-lg font-medium tabular-nums ring-1 ring-border/40 placeholder:text-muted focus:ring-2 focus:ring-brand/50"
            />
          </label>
          <label className="block">
            <span className="block text-sm text-muted">Food cost ($)</span>
            <input
              type="number"
              inputMode="decimal"
              placeholder="0"
              value={foodCost}
              onChange={(e) => setFoodCost(e.target.value)}
              className="mt-1 w-full rounded-2xl border-0 bg-panel/60 px-4 py-3.5 text-lg font-medium tabular-nums ring-1 ring-border/40 placeholder:text-muted focus:ring-2 focus:ring-brand/50"
            />
          </label>
          <label className="block">
            <span className="block text-sm text-muted">Disposables cost ($)</span>
            <input
              type="number"
              inputMode="decimal"
              placeholder="0"
              value={disposablesCost}
              onChange={(e) => setDisposablesCost(e.target.value)}
              className="mt-1 w-full rounded-2xl border-0 bg-panel/60 px-4 py-3.5 text-lg font-medium tabular-nums ring-1 ring-border/40 placeholder:text-muted focus:ring-2 focus:ring-brand/50"
            />
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="button"
            onClick={async () => {
              setSaveStatus("saving");
              try {
                const res = await fetch("/api/daily-kpi", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    store: storeId,
                    business_date: businessDate,
                    net_sales: num(sales) ?? 0,
                    labor_dollars: num(laborCost) ?? 0,
                    labor_hours: num(laborHours) ?? 0,
                    food_dollars: num(foodCost) ?? 0,
                    disposables_dollars: num(disposablesCost) ?? 0,
                    voids_dollars: 0,
                    waste_dollars: 0,
                    customers: 0,
                  }),
                });
                const data = await res.json();
                setSaveStatus(data.ok ? "saved" : "error");
              } catch {
                setSaveStatus("error");
              }
            }}
            disabled={saveStatus === "saving"}
            className="rounded-2xl bg-brand/20 px-4 py-2.5 text-sm font-medium text-brand ring-1 ring-brand/40 hover:bg-brand/25 disabled:opacity-60"
          >
            Save
          </button>
          <span className="text-sm text-muted">
            {saveStatus === "saving" && "Saving…"}
            {saveStatus === "saved" && "Saved"}
            {saveStatus === "error" && "Error saving"}
          </span>
        </div>
      </div>
    </div>
  );
}
