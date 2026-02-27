"use client";

import Link from "next/link";
import { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { BarChart3, Calendar, Check, ChevronDown, ChevronRight, ClipboardList, MapPin, Sparkles, TriangleAlert, AlertTriangle, X } from "lucide-react";
import { Area, AreaChart, ReferenceLine, ResponsiveContainer } from "recharts";
import { COLORS } from "@/src/lib/design-tokens";
import { useRedAlert } from "@/src/lib/useRedAlert";
import { EducationInfoIcon } from "@/src/components/education/InfoIcon";
import { formatPct } from "@/src/lib/formatters";
import { EDUCATION_CONTENT } from "@/src/lib/education-content";
import { SEED_DAILY_KPIS, SEED_MORNING_BRIEF, SEED_MORNING_BRIEF_BY_STORE, SEED_STORES, STORE_BENCHMARKS } from "@/src/lib/seed-data";
import { SEED_WINS } from "@/src/lib/win-engine";
import { calculateOperatorScore } from "@/src/lib/score-engine";
import { WinNotifications } from "@/src/components/ui/WinNotifications";

/** Map alert keys to education content keys (for playbook modal). */
const ALERT_TO_EDUCATION: Record<string, string> = {
  food_cost: "food_cost",
  labor_pct: "labor_pct",
  prime_cost: "prime_cost",
  daily_sales: "daily_sales",
};

function firstSentences(text: string, count: number): string {
  const parts = text.split(/(?<=[.!?])\s+/);
  const slice = parts.slice(0, count);
  return slice.length ? slice.join(" ").trim() : text;
}

function todayYYYYMMDD(): string {
  const t = new Date();
  const y = t.getFullYear();
  const m = String(t.getMonth() + 1).padStart(2, "0");
  const d = String(t.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function yesterdayYYYYMMDD(): string {
  const t = new Date();
  t.setDate(t.getDate() - 1);
  return t.toISOString().slice(0, 10);
}

type KpiSnapshot = {
  sales: number;
  foodCostPct: number;
  laborPct: number;
  primePct: number;
  isYesterday: boolean;
};

const KENT_DAILY_TARGET = 5200;
const WARNING_BAND_PCT = 3;

type Grade = "green" | "yellow" | "red";

/** Cost metrics (Food %, Labor %, PRIME %): green <= target, amber target < x <= target+3, red > target+3 */
function gradeCost(value: number, target: number): Grade {
  if (value <= target) return "green";
  if (value <= target + WARNING_BAND_PCT) return "yellow";
  return "red";
}

type LetterGrade = "A" | "B" | "C" | "D" | "F";

function gradePillarProduct(foodCostPct: number): LetterGrade {
  if (foodCostPct <= 30) return "A";
  if (foodCostPct <= 33) return "B";
  if (foodCostPct <= 35) return "C";
  if (foodCostPct <= 38) return "D";
  return "F";
}

function gradePillarPeople(laborPct: number): LetterGrade {
  if (laborPct <= 25) return "A";
  if (laborPct <= 28) return "B";
  if (laborPct <= 30) return "C";
  if (laborPct <= 33) return "D";
  return "F";
}

function gradePillarPerformance(primePct: number): LetterGrade {
  if (primePct >= 65) return "A";
  if (primePct >= 60) return "B";
  if (primePct >= 55) return "C";
  if (primePct >= 50) return "D";
  return "F";
}

function pillarGradeColorClass(grade: LetterGrade): string {
  if (grade === "A" || grade === "B") return "text-emerald-400";
  if (grade === "C") return "text-amber-400";
  return "text-red-400";
}

function gradeFoodCost(pct: number, target: number): Grade {
  return gradeCost(pct, target);
}

function gradeLabor(pct: number, target: number): Grade {
  return gradeCost(pct, target);
}

function gradePrime(pct: number, target: number): Grade {
  return gradeCost(pct, target);
}

function gradeSales(sales: number, target: number): Grade {
  return sales >= target ? "green" : "red";
}

function getBenchmarksForStore(storeSlug: StoreSlug): { foodCostTargetPct: number; laborTargetPct: number; primeTargetPct: number } {
  const key = storeSlug === "all" ? "kent" : storeSlug;
  return STORE_BENCHMARKS[key] ?? STORE_BENCHMARKS.kent;
}

function gradeToHex(grade: Grade): string {
  return grade === "green" ? COLORS.grade.green : grade === "yellow" ? COLORS.grade.yellow : COLORS.grade.red;
}

type AlertItem = { severity: "red" | "yellow"; key: string; label: string; message: string };

type StoreSlug = "kent" | "aurora" | "lindseys" | "all";

const STORE_OPTIONS: { slug: StoreSlug; name: string }[] = [
  ...SEED_STORES.map((s) => ({ slug: s.slug as StoreSlug, name: s.name })),
  { slug: "all", name: "All Locations" },
];

function getStoreLabel(slug: StoreSlug): string {
  if (slug === "all") return "All Locations";
  return SEED_STORES.find((s) => s.slug === slug)?.name ?? slug;
}

/** For API/seed: use single store slug; "all" → kent for demo combined view. */
function storeSlugForFetch(slug: StoreSlug): string {
  return slug === "all" ? "kent" : slug;
}

function PillarPill({
  emoji,
  label,
  grade,
  metricKey,
}: {
  emoji: string;
  label: string;
  grade: LetterGrade;
  metricKey: string;
}) {
  const rootRef = useRef<HTMLDivElement | null>(null);

  const openEducation = useCallback(() => {
    const btn = rootRef.current?.querySelector(
      'button[data-testid="education-info-icon"]'
    ) as HTMLButtonElement | null;
    btn?.click();
  }, []);

  return (
    <div
      ref={rootRef}
      role="button"
      tabIndex={0}
      onClick={openEducation}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openEducation();
        }
      }}
      className="flex-1 min-w-0 flex items-center justify-between gap-2 rounded-full bg-zinc-900 border border-zinc-800 px-3 py-2 min-h-[44px] cursor-pointer active:opacity-90"
      aria-label={`${label} pillar grade ${grade}. Tap to learn more.`}
    >
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-base leading-none" aria-hidden="true">
          {emoji}
        </span>
        <span className="text-xs font-semibold text-white truncate">
          {label}
        </span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <EducationInfoIcon metricKey={metricKey} size="sm" />
        <span className={`text-sm font-bold ${pillarGradeColorClass(grade)}`}>
          {grade}
        </span>
      </div>
    </div>
  );
}

export default function HomePage() {
  const [selectedStore, setSelectedStore] = useState<StoreSlug>("kent");
  const [storeOpen, setStoreOpen] = useState(false);
  const [kpi, setKpi] = useState<KpiSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [usedSeedData, setUsedSeedData] = useState(false);
  const [showEducation, setShowEducation] = useState(false);
  const [educationKey, setEducationKey] = useState<string | null>(null);
  const [showMissingBanner, setShowMissingBanner] = useState(true);
  const [showAllWins, setShowAllWins] = useState(false);
  const today = todayYYYYMMDD();
  const yesterday = yesterdayYYYYMMDD();

  const pillarSeed = useMemo(() => {
    const store = storeSlugForFetch(selectedStore);
    const forStore = SEED_DAILY_KPIS.filter((r) => r.store_id === store);
    const todayRow = forStore.find((r) => r.date === today);
    const yesterdayRow = forStore.find((r) => r.date === yesterday);
    const row = todayRow ?? yesterdayRow ?? forStore[forStore.length - 1] ?? null;
    if (!row) return null;
    const foodCostPct = row.food_cost_pct;
    const laborPct = row.labor_pct;
    const primePct = 100 - foodCostPct - laborPct;
    return { foodCostPct, laborPct, primePct };
  }, [selectedStore, today, yesterday]);

  const pillarGrades = useMemo(() => {
    if (!pillarSeed) {
      return { product: "C" as LetterGrade, people: "C" as LetterGrade, performance: "C" as LetterGrade };
    }
    return {
      product: gradePillarProduct(pillarSeed.foodCostPct),
      people: gradePillarPeople(pillarSeed.laborPct),
      performance: gradePillarPerformance(pillarSeed.primePct),
    };
  }, [pillarSeed]);

  useEffect(() => {
    let cancelled = false;
    const store = storeSlugForFetch(selectedStore);
    async function load() {
      try {
        const res = await fetch(`/api/daily-kpi?store=${store}&date=${today}`);
        const data = await res.json();
        if (!cancelled && data.ok && data.entry) {
          const e = data.entry;
          const ns = e.net_sales ?? 0;
          const lc = e.labor_dollars ?? 0;
          const fc = e.food_dollars ?? 0;
          const dc = e.disposables_dollars ?? 0;
          const primeDollars = lc + fc + dc;
          const primePct = ns > 0 ? (primeDollars / ns) * 100 : 0;
          const laborPct = ns > 0 ? (lc / ns) * 100 : 0;
          const foodCostPct = ns > 0 ? (fc / ns) * 100 : 0;
          setKpi({
            sales: ns,
            foodCostPct,
            laborPct,
            primePct,
            isYesterday: false,
          });
          setLoading(false);
          return;
        }
        const resY = await fetch(`/api/daily-kpi?store=kent&date=${yesterday}`);
        const dataY = await resY.json();
        if (!cancelled && dataY.ok && dataY.entry) {
          setUsedSeedData(false);
          const e = dataY.entry;
          const ns = e.net_sales ?? 0;
          const lc = e.labor_dollars ?? 0;
          const fc = e.food_dollars ?? 0;
          const dc = e.disposables_dollars ?? 0;
          const primeDollars = lc + fc + dc;
          const primePct = ns > 0 ? (primeDollars / ns) * 100 : 0;
          const laborPct = ns > 0 ? (lc / ns) * 100 : 0;
          const foodCostPct = ns > 0 ? (fc / ns) * 100 : 0;
          setKpi({
            sales: ns,
            foodCostPct,
            laborPct,
            primePct,
            isYesterday: true,
          });
          setLoading(false);
          return;
        }
      } catch {
        // fall through to seed
      }
      if (!cancelled) {
        setUsedSeedData(true);
        const seedForStore = SEED_DAILY_KPIS.filter((r) => r.store_id === store);
        const todayRow = seedForStore.find((r) => r.date === today);
        const yesterdayRow = seedForStore.find((r) => r.date === yesterday);
        const row = todayRow ?? yesterdayRow ?? seedForStore[0];
        if (row) {
          setKpi({
            sales: row.sales,
            foodCostPct: row.food_cost_pct,
            laborPct: row.labor_pct,
            primePct: row.prime_pct,
            isYesterday: !todayRow,
          });
        } else {
          setKpi(null);
        }
        setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [today, yesterday, selectedStore]);

  const dailyTargetSales = useMemo(() => {
    if (selectedStore === "all") return SEED_STORES.find((s) => s.slug === "kent")?.avgDailySales ?? KENT_DAILY_TARGET;
    return SEED_STORES.find((s) => s.slug === selectedStore)?.avgDailySales ?? KENT_DAILY_TARGET;
  }, [selectedStore]);

  const benchmarks = useMemo(() => getBenchmarksForStore(selectedStore), [selectedStore]);

  const { last7Days, salesTrendPct, foodCostAvg, foodCostGrade } = useMemo(() => {
    const store = storeSlugForFetch(selectedStore);
    const forStore = SEED_DAILY_KPIS.filter((r) => r.store_id === store);
    const last7 = forStore.slice(-7).map((r) => ({ date: r.date, sales: r.sales, foodCost: r.food_cost_pct }));
    const prev7 = forStore.slice(-14, -7);
    const thisSum = last7.reduce((s, d) => s + d.sales, 0);
    const prevSum = prev7.reduce((s, r) => s + r.sales, 0);
    const salesTrendPct = prevSum > 0 ? Math.round(((thisSum - prevSum) / prevSum) * 1000) / 10 : 0;
    const foodCostAvg = last7.length > 0 ? Math.round((last7.reduce((s, d) => s + d.foodCost, 0) / last7.length) * 10) / 10 : 0;
    const foodCostGrade = gradeFoodCost(foodCostAvg, benchmarks.foodCostTargetPct);
    return { last7Days: last7, salesTrendPct, foodCostAvg, foodCostGrade };
  }, [selectedStore, benchmarks.foodCostTargetPct]);

  const storeLabel = selectedStore === "all" ? "All" : getStoreLabel(selectedStore);

  const heroGrades = useMemo((): string[] => {
    if (!kpi) return [];
    return [
      gradeFoodCost(kpi.foodCostPct, benchmarks.foodCostTargetPct),
      gradeLabor(kpi.laborPct, benchmarks.laborTargetPct),
      gradePrime(kpi.primePct, benchmarks.primeTargetPct),
    ];
  }, [kpi, benchmarks]);
  useRedAlert(heroGrades);

  const alerts = useMemo((): AlertItem[] => {
    const list: AlertItem[] = [];
    if (!kpi) return list;

    const foodGrade = gradeFoodCost(kpi.foodCostPct, benchmarks.foodCostTargetPct);
    if (foodGrade === "red") {
      list.push({
        severity: "red",
        key: "food_cost",
        label: `Food Cost (${storeLabel})`,
        message: `Food cost is above the benchmark. You're at ${formatPct(kpi.foodCostPct)}. Target: ≤${benchmarks.foodCostTargetPct}%. Tap for playbook.`,
      });
    } else if (foodGrade === "yellow") {
      list.push({
        severity: "yellow",
        key: "food_cost",
        label: `Food Cost (${storeLabel})`,
        message: `Food cost is creeping up. You're at ${formatPct(kpi.foodCostPct)}. Target: ≤${benchmarks.foodCostTargetPct}%. Tap for playbook.`,
      });
    }

    const laborGrade = gradeLabor(kpi.laborPct, benchmarks.laborTargetPct);
    if (laborGrade === "red") {
      list.push({
        severity: "red",
        key: "labor_pct",
        label: `Labor % (${storeLabel})`,
        message: `Labor cost is above the benchmark. You're at ${formatPct(kpi.laborPct)}. Target: ≤${benchmarks.laborTargetPct}%. Tap for playbook.`,
      });
    } else if (laborGrade === "yellow") {
      list.push({
        severity: "yellow",
        key: "labor_pct",
        label: `Labor % (${storeLabel})`,
        message: `Labor is getting close to the benchmark. You're at ${formatPct(kpi.laborPct)}. Target: ≤${benchmarks.laborTargetPct}%. Tap for playbook.`,
      });
    }

    const primeGrade = gradePrime(kpi.primePct, benchmarks.primeTargetPct);
    if (primeGrade === "red") {
      list.push({
        severity: "red",
        key: "prime_cost",
        label: `PRIME % (${storeLabel})`,
        message: `PRIME is above the benchmark. You're at ${formatPct(kpi.primePct)}. Target: ≤${benchmarks.primeTargetPct}%. Tap for playbook.`,
      });
    } else if (primeGrade === "yellow") {
      list.push({
        severity: "yellow",
        key: "prime_cost",
        label: `PRIME % (${storeLabel})`,
        message: `PRIME is getting close to the benchmark. You're at ${formatPct(kpi.primePct)}. Target: ≤${benchmarks.primeTargetPct}%. Tap for playbook.`,
      });
    }

    const salesGrade = gradeSales(kpi.sales, dailyTargetSales);
    if (salesGrade === "red") {
      list.push({
        severity: "red",
        key: "daily_sales",
        label: `Today's Sales (${storeLabel})`,
        message: `Sales are below the typical range today. You're at $${kpi.sales.toLocaleString()}. Benchmark: $${(dailyTargetSales / 1000).toFixed(1)}K/day. Tap for playbook.`,
      });
    }

    return list;
  }, [kpi, dailyTargetSales, storeLabel, benchmarks]);

  const wins = useMemo(
    () =>
      SEED_WINS.filter(
        (w) => !w.storeId || w.storeId === "all" || w.storeId === selectedStore
      ),
    [selectedStore]
  );
  const displayedWins = showAllWins ? wins : wins.slice(0, 3);

  const trendArrow = salesTrendPct >= 0 ? "↑" : "↓";

  const selectedStoreName = getStoreLabel(selectedStore);
  const stores = STORE_OPTIONS.map((opt) => ({ id: opt.slug, name: opt.name }));
  const score = calculateOperatorScore();

  return (
    <div className="space-y-6 pb-28">
      <div className="relative mb-4">
        <button
          type="button"
          onClick={() => setStoreOpen(!storeOpen)}
          className="flex items-center gap-2 bg-slate-800 rounded-lg px-3 py-2 border border-slate-700 text-sm text-white min-h-[44px]"
          aria-haspopup="listbox"
          aria-expanded={storeOpen}
          aria-label={`Store: ${selectedStoreName}. Select location.`}
        >
          <MapPin className="w-4 h-4 text-blue-400 shrink-0" aria-hidden />
          <span className="truncate">{selectedStoreName}</span>
          <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${storeOpen ? "rotate-180" : ""}`} aria-hidden />
        </button>

        {storeOpen && (
          <>
            <div className="fixed inset-0 z-30" aria-hidden="true" onClick={() => setStoreOpen(false)} />
            <div className="absolute top-full left-0 mt-1 z-40 w-64 bg-slate-800 rounded-xl border border-slate-700 shadow-lg shadow-black/30 overflow-hidden">
              {stores.map((store) => (
                <button
                  key={store.id}
                  type="button"
                  onClick={() => {
                    setSelectedStore(store.id as StoreSlug);
                    setStoreOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3 text-sm hover:bg-slate-700/50 transition-colors ${
                    selectedStore === store.id ? "text-blue-400" : "text-slate-300"
                  }`}
                >
                  <span>{store.name}</span>
                  {selectedStore === store.id && <Check className="w-4 h-4 text-blue-400 shrink-0" aria-hidden />}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold">PrimeOS</h1>
            <button type="button" onClick={() => setShowEducation(true)} className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] h-8 w-8 rounded-full bg-muted/20 text-muted hover:bg-brand/20 hover:text-brand transition-colors text-xs font-bold" aria-label="Learn more">i</button>
          </div>
          <p className="mt-1 text-sm text-muted">
            Today's pulse — {new Date(today + "T12:00:00Z").toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
          </p>
        </div>
      </div>

      <div key={selectedStore} className="space-y-6">
      <div className="w-full min-w-0">
        <p className="text-base md:text-lg font-bold text-[#E65100] drop-shadow-[0_0_8px_rgba(230,81,0,0.4)] mb-2">
          3 Pillars of Success
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <PillarPill emoji="🍕" label="Product" grade={pillarGrades.product} metricKey="pillar_product" />
          <PillarPill emoji="👥" label="People" grade={pillarGrades.people} metricKey="pillar_people" />
          <PillarPill emoji="📊" label="Process" grade={pillarGrades.performance} metricKey="pillar_process" />
        </div>
      </div>

      <WinNotifications storeId={selectedStore} />

      {showMissingBanner && (
        <div className="bg-amber-600/10 rounded-xl border border-amber-700/30 p-3 mb-4 flex items-start justify-between">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-amber-300 font-medium">Yesterday&apos;s numbers are missing</p>
              <p className="text-xs text-amber-400/70 mt-0.5">
                You entered data for 5 of 7 days last week. Missing: Tuesday, Thursday.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link href="/daily" className="text-xs text-amber-400 hover:text-amber-300 font-medium">
              Enter Now →
            </Link>
            <button
              type="button"
              onClick={() => setShowMissingBanner(false)}
              className="text-slate-600 hover:text-slate-400"
              aria-label="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 gap-3 min-w-0">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-slate-800 rounded-xl p-4 border border-slate-700 animate-pulse min-w-0">
              <div className="h-3 w-16 bg-slate-600 rounded mb-2" />
              <div className="h-8 w-20 bg-slate-600 rounded" />
              <div className="h-3 w-24 bg-slate-600 rounded mt-2" />
            </div>
          ))}
        </div>
      ) : kpi ? (
        <div className="grid grid-cols-2 gap-3 min-w-0">
          {(() => {
            const salesGrade = gradeSales(kpi.sales, dailyTargetSales);
            const salesBorder = gradeToHex(salesGrade);
            return (
              <div className="bg-slate-800 rounded-xl p-4 border-l-4 min-w-0 border-slate-700" style={{ borderLeftColor: salesBorder }}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-400 uppercase tracking-wide">Today&apos;s Sales</span>
                  <EducationInfoIcon metricKey="todays_sales" />
                </div>
                <div className="text-2xl font-bold tabular-nums" style={{ color: salesGrade === "green" ? COLORS.grade.green : COLORS.grade.red }}>
                  ${kpi.sales.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                </div>
                <div className="text-xs text-slate-500">
                  Target: ${(dailyTargetSales / 1000).toFixed(1)}K/day{kpi.isYesterday ? " (Yesterday)" : ""}
                </div>
              </div>
            );
          })()}
          {(() => {
            const grade = gradeFoodCost(kpi.foodCostPct, benchmarks.foodCostTargetPct);
            const borderColor = gradeToHex(grade);
            return (
              <div className="bg-slate-800 rounded-xl p-4 border-l-4 min-w-0 border-slate-700" style={{ borderLeftColor: borderColor }}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-400 uppercase tracking-wide">Food Cost</span>
                  <EducationInfoIcon metricKey="food_cost_pct" />
                </div>
                <div className="text-2xl font-bold tabular-nums" style={{ color: borderColor }}>
                  {formatPct(kpi.foodCostPct)}
                </div>
                <div className="text-xs text-slate-500">Target: ≤{benchmarks.foodCostTargetPct}%{kpi.isYesterday ? " (Yesterday)" : ""}</div>
              </div>
            );
          })()}
          {(() => {
            const grade = gradeLabor(kpi.laborPct, benchmarks.laborTargetPct);
            const borderColor = gradeToHex(grade);
            return (
              <div className="bg-slate-800 rounded-xl p-4 border-l-4 min-w-0 border-slate-700" style={{ borderLeftColor: borderColor }}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-400 uppercase tracking-wide">Labor %</span>
                  <EducationInfoIcon metricKey="labor_pct_home" />
                </div>
                <div className="text-2xl font-bold tabular-nums" style={{ color: borderColor }}>
                  {formatPct(kpi.laborPct)}
                </div>
                <div className="text-xs text-slate-500">Target: ≤{benchmarks.laborTargetPct}%{kpi.isYesterday ? " (Yesterday)" : ""}</div>
              </div>
            );
          })()}
          {(() => {
            const grade = gradePrime(kpi.primePct, benchmarks.primeTargetPct);
            const borderColor = gradeToHex(grade);
            return (
              <div className="bg-slate-800 rounded-xl p-4 border-l-4 min-w-0 border-slate-700" style={{ borderLeftColor: borderColor }}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-slate-400 uppercase tracking-wide">PRIME %</span>
                  <EducationInfoIcon metricKey="prime_pct" />
                </div>
                <div className="text-2xl font-bold tabular-nums" style={{ color: borderColor }}>
                  {formatPct(kpi.primePct)}
                </div>
                <div className="text-xs text-slate-500">Target: ≤{benchmarks.primeTargetPct}%{kpi.isYesterday ? " (Yesterday)" : ""}</div>
              </div>
            );
          })()}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 min-w-0">
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-slate-400 uppercase tracking-wide">Today&apos;s Sales</span>
              <EducationInfoIcon metricKey="todays_sales" />
            </div>
            <div className="text-2xl font-bold text-slate-500">—</div>
            <div className="text-xs text-slate-500">Target: ${(dailyTargetSales / 1000).toFixed(1)}K/day</div>
          </div>
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-slate-400 uppercase tracking-wide">Food Cost</span>
              <EducationInfoIcon metricKey="food_cost_pct" />
            </div>
            <div className="text-2xl font-bold text-slate-500">—</div>
            <div className="text-xs text-slate-500">Target: ≤{benchmarks.foodCostTargetPct}%</div>
          </div>
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-slate-400 uppercase tracking-wide">Labor %</span>
              <EducationInfoIcon metricKey="labor_pct_home" />
            </div>
            <div className="text-2xl font-bold text-slate-500">—</div>
            <div className="text-xs text-slate-500">Target: ≤{benchmarks.laborTargetPct}%</div>
          </div>
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-slate-400 uppercase tracking-wide">PRIME %</span>
              <EducationInfoIcon metricKey="prime_pct" />
            </div>
            <div className="text-2xl font-bold text-slate-500">—</div>
            <div className="text-xs text-slate-500">Target: ≤{benchmarks.primeTargetPct}%</div>
          </div>
        </div>
      )}

      </div>

      <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 min-w-0">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">7-Day Trend</h3>
        <div className="grid grid-cols-2 gap-4 min-w-0">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
              Sales
              <EducationInfoIcon metricKey="daily_sales" size="sm" />
            </div>
            <div className="w-full h-[60px] min-h-[60px]">
              <ResponsiveContainer width="100%" height={60}>
                <AreaChart data={last7Days} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
                  <defs>
                    <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="sales" stroke="#3b82f6" fill="url(#salesFill)" strokeWidth={2} dot={false} isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="text-xs text-slate-400 mt-1">
              {trendArrow} {salesTrendPct}% vs last week
            </div>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
              Food Cost
              <EducationInfoIcon metricKey="food_cost" size="sm" />
            </div>
            <div className="w-full h-[60px] min-h-[60px]">
              <ResponsiveContainer width="100%" height={60}>
                <AreaChart data={last7Days} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
                  <defs>
                    <linearGradient id="foodCostFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#22c55e" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <ReferenceLine y={benchmarks.foodCostTargetPct} stroke="#ef4444" strokeDasharray="3 3" strokeWidth={1} />
                  <Area type="monotone" dataKey="foodCost" stroke="#22c55e" fill="url(#foodCostFill)" strokeWidth={2} dot={false} isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Avg: {foodCostAvg}% ({foodCostGrade})
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 min-w-0">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-400 shrink-0" aria-hidden />
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">Morning Brief</h3>
          </div>
          <span className="text-xs text-slate-500 shrink-0">
            Today, {new Date(today + "T12:00:00Z").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </span>
        </div>
        {(() => {
          const briefForStore = selectedStore === "all" ? SEED_MORNING_BRIEF : (SEED_MORNING_BRIEF_BY_STORE[selectedStore] ?? SEED_MORNING_BRIEF);
          return briefForStore ? (
            <>
              <p className="text-sm text-slate-300 leading-relaxed line-clamp-3">
                {firstSentences(briefForStore, 3)}
              </p>
              <Link href="/brief" className="inline-flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300 mt-3">
                Read full brief <ChevronRight className="w-4 h-4 shrink-0" aria-hidden />
              </Link>
            </>
          ) : null;
        })() ?? (
          <>
            <p className="text-sm text-slate-300 leading-relaxed">
              Your morning brief generates after daily KPIs are entered. Enter today&apos;s numbers to unlock.
            </p>
            <Link href="/daily" className="inline-flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300 mt-3">
              Enter daily numbers <ChevronRight className="w-4 h-4 shrink-0" aria-hidden />
            </Link>
          </>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3 min-w-0">
        <Link href="/daily" className="bg-slate-800 rounded-xl p-3 border border-slate-700 flex flex-col items-center justify-center gap-2 min-h-[44px] active:bg-slate-700 transition-colors min-w-[44px]">
          <ClipboardList className="w-6 h-6 text-blue-400 shrink-0" aria-hidden />
          <span className="text-xs text-slate-300 text-center leading-tight">Enter Today&apos;s Numbers</span>
        </Link>
        <Link href="/weekly" className="bg-slate-800 rounded-xl p-3 border border-slate-700 flex flex-col items-center justify-center gap-2 min-h-[44px] active:bg-slate-700 transition-colors min-w-[44px]">
          <BarChart3 className="w-6 h-6 text-emerald-400 shrink-0" aria-hidden />
          <span className="text-xs text-slate-300 text-center leading-tight">Weekly Snapshot</span>
        </Link>
        <Link href="/schedule" className="bg-slate-800 rounded-xl p-3 border border-slate-700 flex flex-col items-center justify-center gap-2 min-h-[44px] active:bg-slate-700 transition-colors min-w-[44px]">
          <Calendar className="w-6 h-6 text-amber-400 shrink-0" aria-hidden />
          <span className="text-xs text-slate-300 text-center leading-tight">This Week&apos;s Schedule</span>
        </Link>
      </div>

      <div className="mb-4">
        <div
          className={`rounded-xl border p-4 ${
            score.overall >= 80
              ? "bg-emerald-600/10 border-emerald-700/20"
              : score.overall >= 60
                ? "bg-amber-600/10 border-amber-700/20"
                : "bg-red-600/10 border-red-700/20"
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-1">Business Health Score</p>
              <div className="flex items-baseline gap-2">
                <span className={`text-3xl font-bold ${score.color}`}>{score.overall}</span>
                <span className="text-xs text-slate-400">/ 100</span>
              </div>
              <p className={`text-xs font-medium mt-1 ${score.color}`}>{score.label}</p>
            </div>
            <div className="text-right">
              <p className="text-[9px] text-slate-600 leading-relaxed max-w-[140px]">
                Based on 6 weeks of data across financials, reputation, and operations.
              </p>
            </div>
          </div>

          {/* Mini category bars */}
          <div className="mt-3 pt-3 border-t border-slate-700/30 grid grid-cols-5 gap-1">
            {score.categories.map((cat) => (
              <div key={cat.name} className="text-center">
                <div className="h-1 rounded-full bg-slate-700 mb-1">
                  <div
                    className={`h-1 rounded-full ${
                      cat.score >= 80 ? "bg-emerald-400" : cat.score >= 60 ? "bg-amber-400" : "bg-red-400"
                    }`}
                    style={{ width: `${cat.score}%` }}
                  />
                </div>
                <p className="text-[8px] text-slate-600 leading-tight">{cat.name.split(" ")[0]}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Wins This Week — positive first, above alerts */}
      {wins.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-base">🎉</span>
            <h2 className="text-sm font-bold text-white">WINS THIS WEEK</h2>
            <span className="text-[10px] text-slate-500">({wins.length})</span>
          </div>
          {displayedWins.map((win) => (
            <div
              key={win.id}
              className={`mb-2 rounded-xl border p-3 ${
                win.magnitude === "big"
                  ? "bg-emerald-600/15 border-emerald-700/30"
                  : win.magnitude === "medium"
                    ? "bg-emerald-600/10 border-emerald-700/20"
                    : "bg-slate-800 border-slate-700"
              }`}
            >
              <div className="flex items-start gap-2">
                <span className="text-lg flex-shrink-0 mt-0.5">{win.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-white">{win.title}</span>
                    {win.magnitude === "big" && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-600/30 text-emerald-400 font-medium">
                        BIG WIN
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{win.body}</p>
                  <span className="text-[10px] text-slate-600 mt-1 block">{win.date}</span>
                </div>
              </div>
            </div>
          ))}
          {wins.length > 3 && (
            <button
              type="button"
              onClick={() => setShowAllWins(!showAllWins)}
              className="w-full text-center py-2 text-xs text-slate-500"
            >
              {showAllWins ? "Show less" : `Show ${wins.length - 3} more wins`}
            </button>
          )}
        </div>
      )}

      {/* Alerts section: header + red/yellow cards or "All good" */}
      <div className="rounded-xl p-4 border min-w-0 border-slate-700 bg-slate-800/50">
        {alerts.length > 0 ? (
          <>
            <div className="flex items-center gap-2 mb-3">
              <TriangleAlert
                className={`w-4 h-4 shrink-0 ${alerts.some((a) => a.severity === "red") ? "text-red-400" : "text-amber-400"}`}
                aria-hidden
              />
              <h3
                className={`text-sm font-semibold uppercase tracking-wide flex items-center gap-1.5 ${
                  alerts.some((a) => a.severity === "red") ? "text-red-400" : "text-amber-400"
                }`}
              >
                {alerts.some((a) => a.severity === "red")
                  ? "⚠ NEEDS ATTENTION"
                  : "👀 KEEP AN EYE ON"}
                <EducationInfoIcon metricKey={alerts.some((a) => a.severity === "red") ? "needs_attention" : "keep_an_eye_on"} />
              </h3>
            </div>
            <div className="space-y-2">
              {alerts.map((alert) => {
                const educationKeyForAlert = ALERT_TO_EDUCATION[alert.key] ?? alert.key;
                const isRed = alert.severity === "red";
                return (
                  <button
                    key={`${alert.key}-${alert.label}`}
                    type="button"
                    onClick={() => setEducationKey(educationKeyForAlert)}
                    className={`w-full text-left rounded-xl p-3 min-h-[44px] active:opacity-90 transition-opacity ${
                      isRed
                        ? "bg-red-600/10 border border-red-700/30"
                        : "bg-amber-600/10 border border-amber-700/30"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <AlertTriangle
                            className={`w-4 h-4 flex-shrink-0 ${isRed ? "text-red-400" : "text-amber-400"}`}
                            aria-hidden
                          />
                          <span
                            className={`text-sm font-medium ${isRed ? "text-red-400" : "text-amber-400"}`}
                          >
                            {alert.label}
                          </span>
                        </div>
                        <p className={`text-xs mt-1 ${isRed ? "text-red-300" : "text-amber-300"}`}>
                          {alert.message}
                        </p>
                      </div>
                      <span
                        className={`text-[10px] flex-shrink-0 ${isRed ? "text-red-400/60" : "text-amber-400/60"}`}
                      >
                        Tap for playbook →
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <div className="flex items-start gap-2">
            <span className="text-emerald-400 text-lg shrink-0" aria-hidden>✅</span>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-semibold text-emerald-400 uppercase tracking-wide">
                  ✅ ALL GOOD TODAY
                </h3>
                <EducationInfoIcon metricKey="all_good_today" />
              </div>
              <p className="text-xs text-slate-400 mt-0.5">All KPIs within target.</p>
            </div>
          </div>
        )}
      </div>

      {educationKey && EDUCATION_CONTENT[educationKey] && typeof document !== "undefined" && createPortal(
        <>
          <div className="fixed inset-0 bg-black/60 z-50" onClick={() => setEducationKey(null)} aria-hidden />
          <div
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 bg-slate-800 rounded-2xl border border-slate-700 p-5 max-h-[80vh] overflow-y-auto"
            style={{ marginTop: "env(safe-area-inset-top, 0px)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-white mb-2">{EDUCATION_CONTENT[educationKey].title}</h3>
            <p className="text-sm text-slate-300 mb-4 leading-relaxed">{EDUCATION_CONTENT[educationKey].whatItMeans}</p>
            <h4 className="text-xs text-slate-500 uppercase tracking-wide mb-2">Playbook</h4>
            <div className="space-y-2">
              {(EDUCATION_CONTENT[educationKey].whenRedPlaybook ?? []).map((tip: string, i: number) => (
                <div key={i} className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                  <p className="text-xs text-slate-400 leading-relaxed">{tip}</p>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setEducationKey(null)}
              className="w-full mt-4 py-2.5 rounded-xl bg-slate-700 text-slate-300 text-sm font-medium"
            >
              Close
            </button>
          </div>
        </>,
        document.body
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
            <div className="text-sm font-medium">Weekly Snapshot</div>
            <div className="text-xs text-muted mt-1">Trends + comparisons</div>
          </div>
        </Link>
      </div>

      {showEducation && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0 }} onClick={() => setShowEducation(false)}>
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          <div className="relative w-full max-w-md mx-auto rounded-2xl border border-border bg-[#0d0f13] p-4 sm:p-5 shadow-2xl overflow-y-auto max-h-[85vh] min-w-0" onClick={(e) => e.stopPropagation()}>
            <button type="button" onClick={() => setShowEducation(false)} className="absolute top-3 right-3 min-h-[44px] min-w-[44px] flex items-center justify-center text-muted hover:text-white text-lg -mr-2">✕</button>
            <h3 className="text-base font-semibold text-brand mb-1">🎓 Command Center</h3>
            <p className="text-xs text-muted mb-4">Your 90-second daily routine.</p>
            <div className="space-y-3 text-sm">
              <div>
                <h4 className="font-medium text-white mb-1">What to Check First Each Morning</h4>
                <p className="text-muted text-xs leading-relaxed">This screen shows today's PRIME % at a glance for every store. Green means you're on target. Red means you're bleeding — labor, food, or disposables (or all three) ate too much of yesterday's sales. One store at 58% PRIME when target is 55% is roughly $300–$600 lost to the house on a $10K day.</p>
              </div>
              <div>
                <h4 className="font-medium text-white mb-1">The 90-Second Daily Routine</h4>
                <p className="text-muted text-xs leading-relaxed">Tap a store card to open Daily Entry. Enter yesterday's numbers: sales, labor, food, disposables, voids, waste. That's it. PrimeOS turns them into PRIME %, labor %, SLPH. If you haven't acknowledged the day, do it. Then hit Morning Brief to see what the AI made of it. Operators who do this every morning catch problems in days, not months.</p>
              </div>
              <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-3">
                <h4 className="font-medium text-red-400 text-xs mb-2">📕 When a Store Goes Red</h4>
                <p className="text-muted text-xs leading-relaxed">Tap that store. Check which lever is over — labor, food+disposables, or both. Same-day fixes: trim a shift tomorrow, check prep waste and portioning, look for a price creep on an invoice. One red day is a signal. A week of red is a $2K+ problem. Fix it before the month closes.</p>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
