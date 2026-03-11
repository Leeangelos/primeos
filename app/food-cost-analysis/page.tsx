"use client";

import { useState, useMemo, useEffect } from "react";
import { Scale, Info } from "lucide-react";
import { useAuth } from "@/src/lib/auth-context";
import { isNewUser, getNewUserStoreName } from "@/src/lib/user-scope";
import { safeDollars, safePct } from "@/src/lib/format";
import { EducationInfoIcon } from "@/src/components/education/InfoIcon";
import { DataDisclaimer } from "@/src/components/ui/DataDisclaimer";
import { COCKPIT_STORE_SLUGS, COCKPIT_TARGETS } from "@/lib/cockpit-config";
import { createClient } from "@/lib/supabase";
import {
  getKitchenGrade,
  getKitchenGradeColorClass,
  getNextKitchenGradeTarget,
  isKitchenGradeInRange,
  type KitchenGrade,
} from "@/lib/kitchen-score";

const STORE_OPTIONS = [
  { value: "all", label: "All stores" },
  ...COCKPIT_STORE_SLUGS.map((s) => ({ value: s, label: COCKPIT_TARGETS[s].name })),
];

type BaselineMonth = {
  month: string;
  monthLabel: string;
  revenue: number;
  hillcrestSpend: number;
  foodCostPct: number | null;
  isCurrentMonth: boolean;
  isComplete: boolean;
  grade: KitchenGrade | null;
};

type BaselineData = {
  monthly: BaselineMonth[];
  baselinePct: number | null;
  baselineN: number;
  confidence: "Low" | "Medium" | "High";
  currentSpend: number;
  currentRevenue: number;
  currentPct: number | null;
  currentGrade: KitchenGrade | null;
  diffPct: number | null;
  paceDollars: number | null;
  avgMonthlyRevenue: number | null;
  streakMonths: number;
  nextGradeTarget: { nextGrade: KitchenGrade; reducePct: number } | null;
};

type LeaderboardRow = {
  slug: string;
  name: string;
  grade: KitchenGrade | null;
  currentPct: number | null;
  expectedPct: number | null;
  diffPct: number | null;
};

export default function FoodCostAnalysisPage() {
  const { session, loading } = useAuth();
  const newUser = isNewUser(session);
  const newUserStoreName = getNewUserStoreName(session);
  const [selectedStore, setSelectedStore] = useState("kent");
  const [showFormula, setShowFormula] = useState(false);
  const [baselineData, setBaselineData] = useState<BaselineData | null>(null);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardRow[] | null>(null);
  const [rangeData, setRangeData] = useState<{
    sales: { net_sales?: number }[];
    purchases: { food_spend?: number; paper_spend?: number; beverage_spend?: number }[];
    theoretical_food_cost_pct?: number | null;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/dashboard/daily-data?store_id=${encodeURIComponent(selectedStore)}&range=30`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled || !d.sales) return;
        setRangeData({
          sales: d.sales ?? [],
          purchases: d.purchases ?? [],
          theoretical_food_cost_pct: d.theoretical_food_cost_pct ?? null,
        });
      })
      .catch(() => setRangeData(null));
    return () => { cancelled = true; };
  }, [selectedStore]);

  useEffect(() => {
    let cancelled = false;
    async function loadBaseline() {
      try {
        const supabase = createClient();
        const now = new Date();
        const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

        if (selectedStore === "all") {
          const rows: LeaderboardRow[] = [];
          for (const slug of COCKPIT_STORE_SLUGS) {
            const { data: storeRow } = await supabase
              .from("stores")
              .select("id")
              .eq("slug", slug)
              .maybeSingle();
            const storeId = storeRow?.id as string | undefined;
            if (!storeId) continue;
            const [invRes, salesRes] = await Promise.all([
              supabase
                .from("me_invoices")
                .select("invoice_date, total")
                .eq("store_id", storeId)
                .eq("vendor_name", "Hillcrest Foodservice"),
              supabase
                .from("foodtec_daily_sales")
                .select("business_day, net_sales")
                .eq("store_id", storeId),
            ]);
            const invoices = (invRes.data ?? []) as { invoice_date: string; total: number }[];
            const sales = (salesRes.data ?? []) as { business_day: string; net_sales: number }[];
            const hillcrestByMonth: Record<string, number> = {};
            const revenueByMonth: Record<string, number> = {};
            for (const row of invoices) {
              const d = row.invoice_date;
              if (!d || typeof d !== "string") continue;
              const month = d.slice(0, 7);
              hillcrestByMonth[month] = (hillcrestByMonth[month] ?? 0) + (Number(row.total) || 0);
            }
            for (const row of sales) {
              const d = row.business_day;
              if (!d || typeof d !== "string") continue;
              const month = d.slice(0, 7);
              revenueByMonth[month] = (revenueByMonth[month] ?? 0) + (Number(row.net_sales) || 0);
            }
            const completeMonthsPct: number[] = [];
            for (const monthKey of Object.keys(revenueByMonth)) {
              if (monthKey === currentMonthKey) continue;
              const rev = revenueByMonth[monthKey] ?? 0;
              const spend = hillcrestByMonth[monthKey] ?? 0;
              if (rev > 0) completeMonthsPct.push((spend / rev) * 100);
            }
            const baselinePct =
              completeMonthsPct.length > 0
                ? completeMonthsPct.reduce((a, b) => a + b, 0) / completeMonthsPct.length
                : null;
            const currentSpend = hillcrestByMonth[currentMonthKey] ?? 0;
            const currentRevenue = revenueByMonth[currentMonthKey] ?? 0;
            const currentPct = currentRevenue > 0 ? (currentSpend / currentRevenue) * 100 : null;
            const diffPct = baselinePct != null && currentPct != null ? currentPct - baselinePct : null;
            rows.push({
              slug,
              name: COCKPIT_TARGETS[slug].name,
              grade: getKitchenGrade(diffPct),
              currentPct,
              expectedPct: baselinePct,
              diffPct,
            });
          }
          rows.sort((a, b) => {
            const order: Record<KitchenGrade, number> = { A: 0, B: 1, C: 2, D: 3, F: 4 };
            const ga = a.grade ? order[a.grade] : 5;
            const gb = b.grade ? order[b.grade] : 5;
            return ga - gb;
          });
          if (!cancelled) {
            setLeaderboardData(rows);
            setBaselineData(null);
          }
          return;
        }

        const { data: storeRow } = await supabase
          .from("stores")
          .select("id")
          .eq("slug", selectedStore)
          .maybeSingle();
        const storeId = storeRow?.id as string | undefined;
        if (!storeId) {
          if (!cancelled) {
            setBaselineData(null);
            setLeaderboardData(null);
          }
          return;
        }
        if (!cancelled) setLeaderboardData(null);
        const [invRes, salesRes] = await Promise.all([
          supabase
            .from("me_invoices")
            .select("invoice_date, total")
            .eq("store_id", storeId)
            .eq("vendor_name", "Hillcrest Foodservice"),
          supabase
            .from("foodtec_daily_sales")
            .select("business_day, net_sales")
            .eq("store_id", storeId),
        ]);
        if (cancelled) return;
        const invoices = (invRes.data ?? []) as { invoice_date: string; total: number }[];
        const sales = (salesRes.data ?? []) as { business_day: string; net_sales: number }[];
        const hillcrestByMonth: Record<string, number> = {};
        for (const row of invoices) {
          const d = row.invoice_date;
          if (!d || typeof d !== "string") continue;
          const month = d.slice(0, 7);
          hillcrestByMonth[month] = (hillcrestByMonth[month] ?? 0) + (Number(row.total) || 0);
        }
        const revenueByMonth: Record<string, number> = {};
        for (const row of sales) {
          const d = row.business_day;
          if (!d || typeof d !== "string") continue;
          const month = d.slice(0, 7);
          revenueByMonth[month] = (revenueByMonth[month] ?? 0) + (Number(row.net_sales) || 0);
        }
        const allMonths = new Set([...Object.keys(hillcrestByMonth), ...Object.keys(revenueByMonth)]);
        const sortedMonths = Array.from(allMonths).sort();
        const completeMonthsPct: number[] = [];
        let avgMonthlyRevenue = 0;
        let completeRevenueCount = 0;
        const monthly: BaselineMonth[] = [];
        for (const monthKey of sortedMonths) {
          const rev = revenueByMonth[monthKey] ?? 0;
          const spend = hillcrestByMonth[monthKey] ?? 0;
          const pct = rev > 0 ? (spend / rev) * 100 : null;
          const isCurrentMonth = monthKey === currentMonthKey;
          const isComplete = !isCurrentMonth;
          if (isComplete && pct != null) completeMonthsPct.push(pct);
          if (isComplete && rev > 0) {
            avgMonthlyRevenue += rev;
            completeRevenueCount += 1;
          }
          const [y, m] = monthKey.split("-").map(Number);
          const monthLabel = new Date(y, m - 1, 1).toLocaleDateString("en-US", { month: "short", year: "numeric" });
          monthly.push({
            month: monthKey,
            monthLabel,
            revenue: rev,
            hillcrestSpend: spend,
            foodCostPct: pct,
            isCurrentMonth,
            isComplete,
            grade: null,
          });
        }
        const baselinePct =
          completeMonthsPct.length > 0
            ? completeMonthsPct.reduce((a, b) => a + b, 0) / completeMonthsPct.length
            : null;
        const baselineN = completeMonthsPct.length;
        const confidence: "Low" | "Medium" | "High" =
          baselineN >= 6 ? "High" : baselineN >= 3 ? "Medium" : baselineN >= 1 ? "Low" : "Low";
        const avgRev = completeRevenueCount > 0 ? avgMonthlyRevenue / completeRevenueCount : null;
        for (let i = 0; i < monthly.length; i++) {
          const row = monthly[i];
          if (baselinePct != null && row.foodCostPct != null) {
            const diff = row.foodCostPct - baselinePct;
            row.grade = getKitchenGrade(diff);
          }
        }
        const currentRow = monthly.find((r) => r.isCurrentMonth);
        const currentSpend = currentRow?.hillcrestSpend ?? 0;
        const currentRevenue = currentRow?.revenue ?? 0;
        const currentPct = currentRevenue > 0 ? (currentSpend / currentRevenue) * 100 : null;
        const diffPct = baselinePct != null && currentPct != null ? currentPct - baselinePct : null;
        const currentGrade = getKitchenGrade(diffPct);
        let paceDollars: number | null = null;
        if (avgRev != null && baselinePct != null && currentPct != null) {
          paceDollars = ((currentPct - baselinePct) / 100) * avgRev;
        }
        const nextGradeTarget = getNextKitchenGradeTarget(currentGrade, diffPct);
        const completeOrdered = [...monthly].filter((r) => r.isComplete).sort((a, b) => b.month.localeCompare(a.month));
        let streakMonths = 0;
        for (const row of completeOrdered) {
          if (isKitchenGradeInRange(row.grade)) streakMonths += 1;
          else break;
        }
        if (!cancelled) {
          setBaselineData({
            monthly,
            baselinePct,
            baselineN,
            confidence,
            currentSpend,
            currentRevenue,
            currentPct,
            currentGrade,
            diffPct,
            paceDollars,
            avgMonthlyRevenue: avgRev,
            streakMonths,
            nextGradeTarget,
          });
        }
      } catch {
        if (!cancelled) {
          setBaselineData(null);
          setLeaderboardData(null);
        }
      }
    }
    loadBaseline();
    return () => {
      cancelled = true;
    };
  }, [selectedStore]);

  const { totalSales, totalFood, actualPct, hasPurchaseData } = useMemo(() => {
    if (!rangeData?.sales?.length) return { totalSales: 0, totalFood: 0, actualPct: 0, hasPurchaseData: false };
    const totalSales = rangeData.sales.reduce((s, r) => s + (r.net_sales ?? 0), 0);
    const totalFood = rangeData.purchases.reduce((s, r) => s + (r.food_spend ?? 0), 0);
    const hasPurchaseData = (rangeData.purchases?.length ?? 0) > 0;
    const actualPct = hasPurchaseData && totalSales > 0 ? (totalFood / totalSales) * 100 : 0;
    return { totalSales, totalFood, actualPct, hasPurchaseData };
  }, [rangeData]);

  const { foodTotal, paperTotal, beverageTotal, totalPurchases } = useMemo(() => {
    if (!rangeData?.purchases?.length) return { foodTotal: 0, paperTotal: 0, beverageTotal: 0, totalPurchases: 0 };
    const foodTotal = rangeData.purchases.reduce((s, r) => s + (r.food_spend ?? 0), 0);
    const paperTotal = rangeData.purchases.reduce((s, r) => s + (r.paper_spend ?? 0), 0);
    const beverageTotal = rangeData.purchases.reduce((s, r) => s + (r.beverage_spend ?? 0), 0);
    const totalPurchases = foodTotal + paperTotal + beverageTotal;
    return { foodTotal, paperTotal, beverageTotal, totalPurchases };
  }, [rangeData]);

  const gapDollars = useMemo(() => {
    if (!hasPurchaseData || totalSales <= 0 || actualPct <= 32) return 0;
    return ((actualPct - 32) / 100) * totalSales;
  }, [hasPurchaseData, totalSales, actualPct]);

  if (loading) return <div className="min-h-screen bg-zinc-950" />;
  if (newUser) {
    return (
      <div className="space-y-4 pb-28 min-w-0 overflow-x-hidden">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-white">Food Cost Analysis</h1>
            <p className="text-xs text-slate-400 mt-0.5">{newUserStoreName}</p>
          </div>
          <EducationInfoIcon metricKey="theoretical_food_cost" size="lg" />
        </div>
        <div className="bg-zinc-900/50 rounded-xl border border-zinc-800/50 shadow-sm p-6 space-y-3">
          <p className="text-sm text-zinc-300">Food Cost Analysis compares theoretical (recipe) cost to actual spend so you can spot variance and leaks. Once invoice and sales data are connected, you&apos;ll see full breakdowns by category and month.</p>
          <p className="text-sm text-zinc-300">Ready for live data? Reach out to us and we&apos;ll get your system connected.</p>
          <a href="mailto:hello@getprimeos.com" className="text-[#E65100] underline font-semibold inline-block">hello@getprimeos.com</a>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-28 min-w-0 overflow-x-hidden">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-white">Food Cost Analysis</h1>
          <p className="text-xs text-slate-400 mt-0.5">Actual food cost powered by MarginEdge invoices</p>
        </div>
        <EducationInfoIcon metricKey="theoretical_food_cost" size="lg" />
      </div>

      <div className="flex items-center gap-2 mb-2">
        <label className="text-xs text-slate-500">Store:</label>
        <select
          value={selectedStore}
          onChange={(e) => setSelectedStore(e.target.value)}
          className="dashboard-input rounded-lg border border-slate-600 bg-black/30 px-3 py-2 text-sm text-white focus:border-brand/60 focus:outline-none"
        >
          {STORE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {/* THE GAP — Hero Card */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <h3 className="text-xs text-slate-500 uppercase tracking-wide">Actual food cost</h3>
          <EducationInfoIcon metricKey="actual_food_cost" size="sm" />
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <div className="flex items-center gap-1">
              <span className="text-xs text-slate-500">Actual</span>
              <EducationInfoIcon metricKey="actual_food_cost" size="sm" />
            </div>
            <div className="text-lg text-red-400 font-bold">{safeDollars(totalFood)}</div>
            <div className="text-[10px] text-slate-600">
              {hasPurchaseData ? (
                <>
                  {safePct(actualPct)} of revenue <span className="text-emerald-400 text-xs">● Invoices</span>
                </>
              ) : (
                <span className="text-amber-400">Awaiting invoices</span>
              )}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Revenue (30d)</div>
            <div className="text-lg font-bold text-white">{safeDollars(totalSales)}</div>
            <div className="text-[10px] text-slate-600">Net sales <span className="text-emerald-400">● POS</span></div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowFormula(!showFormula)}
          className="flex items-center gap-1 mt-3 text-xs text-blue-400 hover:text-blue-300"
        >
          <Info className="w-3 h-3" />
          <span>{showFormula ? "Hide formula" : "Show your work"}</span>
        </button>
        {showFormula && (
          <div className="mt-2 p-3 rounded-lg bg-slate-700/50 text-[10px] text-slate-400 space-y-1 font-mono">
            <p>Actual = total food spend from MarginEdge (last 30 days) = {safeDollars(totalFood)}</p>
            <p>Revenue = net sales from POS = {safeDollars(totalSales)}</p>
            <p>Actual food cost % = {safePct(actualPct)}</p>
            <p>Benchmarks for pizza operations typically run 28–32% food cost.</p>
          </div>
        )}
      </div>

      {rangeData !== null && totalSales === 0 && (
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-6 text-center text-zinc-500 mb-4">
          <p className="text-sm">No data for this store.</p>
          <p className="text-xs mt-1">Connect your POS and upload invoices. <a href="mailto:hello@getprimeos.com" className="text-[#E65100] underline">hello@getprimeos.com</a></p>
        </div>
      )}

      {rangeData !== null && totalSales > 0 && (
        <>
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 mb-4">
            <h3 className="text-sm font-semibold text-white mb-2">Last 30 days — Actual food cost</h3>
            <p className="text-xs text-slate-500">Blended from MarginEdge invoices and POS sales.</p>
            <p className="text-2xl font-bold text-white mt-2">
                  {hasPurchaseData ? (
                <>
                  {safePct(actualPct)} <span className="text-emerald-400 text-xs">● Invoices + POS</span>
                </>
              ) : (
                <span className="text-amber-400 text-base">Awaiting invoices</span>
              )}
            </p>
          </div>

          <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 mb-4">
            <h3 className="text-sm font-semibold text-white mb-1">Industry benchmark — pizza operations</h3>
            <p className="text-xs text-slate-500 mb-2">Typical food cost benchmark: 28–32% of net sales.</p>
            {hasPurchaseData && totalSales > 0 ? (
              <>
                <div className="flex items-baseline justify-between mb-2">
                  <div>
                    <p className="text-xs text-slate-400">Your actual</p>
                    <p className="text-lg font-semibold text-white">{safePct(actualPct)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400">Status vs benchmark</p>
                    <p
                      className={`text-sm font-semibold ${
                        actualPct > 32 ? "text-red-400" : "text-emerald-400"
                      }`}
                    >
                      {actualPct > 32 ? "Above benchmark" : "Within benchmark"}
                    </p>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500">
                  Gap to upper benchmark (32%): {safePct(Math.abs(actualPct - 32))}
                </p>
                {actualPct > 32 && (
                  <p className="text-[11px] text-red-400 font-semibold">
                    That&apos;s {safeDollars(gapDollars)} in excess food spend this month
                  </p>
                )}
              </>
            ) : (
              <p className="text-xs text-amber-400">Awaiting invoices — benchmark comparison will appear once invoices are synced.</p>
            )}
          </div>

          <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 mb-4">
            <h3 className="text-sm font-semibold text-white mb-2">Category breakdown — where the spend goes</h3>
            {hasPurchaseData && totalPurchases > 0 ? (
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div>
                  <p className="text-slate-500">Food</p>
                  <p className="text-white font-semibold">
                    {safePct((foodTotal / totalPurchases) * 100)}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">Disposables</p>
                  <p className="text-white font-semibold">
                    {safePct((paperTotal / totalPurchases) * 100)}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">Beverages</p>
                  <p className="text-white font-semibold">
                    {safePct((beverageTotal / totalPurchases) * 100)}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-amber-400">Awaiting invoices — category mix will appear once purchases are synced.</p>
            )}
          </div>
        </>
      )}

      <DataDisclaimer confidence="high" details="Actual food cost powered by MarginEdge invoices and POS sales. Benchmarks are industry ranges for pizza operations." />

      {/* Your Baseline — Expected vs Actual */}
      <section className="mt-6 space-y-4">
        <h2 className="text-lg font-bold text-white">Your Baseline — Expected vs Actual</h2>

        {selectedStore === "all" && leaderboardData && (
          <>
            <h3 className="text-sm font-semibold text-white">This month&apos;s Kitchen Leaderboard</h3>
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 border-b border-slate-700">
                    <th className="pb-2 pr-4">Store</th>
                    <th className="pb-2 pr-4">Grade</th>
                    <th className="pb-2 pr-4">Food cost %</th>
                    <th className="pb-2">vs Expected</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboardData.map((row) => (
                    <tr key={row.slug} className="border-b border-slate-700/50">
                      <td className="py-2 pr-4 text-white">{row.name}</td>
                      <td className="py-2 pr-4">
                        <span className={`font-bold ${getKitchenGradeColorClass(row.grade)}`}>
                          {row.grade ?? "—"}
                        </span>
                      </td>
                      <td className="py-2 pr-4 text-slate-300">
                        {row.currentPct != null ? safePct(row.currentPct) : "—"}
                      </td>
                      <td className="py-2 text-slate-300">
                        {row.diffPct != null
                          ? (row.diffPct > 0 ? "+" : "") + safePct(row.diffPct) + " pts"
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {baselineData && selectedStore !== "all" && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
                <h3 className="text-sm font-semibold text-white mb-2">Baseline</h3>
                <p className="text-2xl font-bold text-white">
                  {baselineData.baselinePct != null ? safePct(baselineData.baselinePct) : "—"}
                </p>
                <p className="text-xs text-slate-500 mt-1">Expected Food Cost %</p>
                <p className="text-xs text-slate-400 mt-1">Based on {baselineData.baselineN} month{baselineData.baselineN !== 1 ? "s" : ""} of data</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Confidence:{" "}
                  <span
                    className={
                      baselineData.confidence === "High"
                        ? "text-emerald-400"
                        : baselineData.confidence === "Medium"
                          ? "text-amber-400"
                          : "text-slate-400"
                    }
                  >
                    {baselineData.confidence}
                  </span>
                  {baselineData.confidence === "Low" && " (1–2 months)"}
                  {baselineData.confidence === "Medium" && " (3–5 months)"}
                  {baselineData.confidence === "High" && " (6+ months)"}
                </p>
              </div>

              <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
                <p className="text-[10px] font-semibold tracking-[0.2em] text-slate-500 uppercase">
                  Kitchen Score — food cost efficiency
                </p>
                <div className={`mt-2 text-5xl sm:text-6xl font-black tabular-nums ${getKitchenGradeColorClass(baselineData.currentGrade)}`}>
                  {baselineData.currentGrade ?? "—"}
                </div>
                {baselineData.currentPct != null && baselineData.baselinePct != null && (
                  <p className="text-xs text-slate-400 mt-1">
                    Current {safePct(baselineData.currentPct)} vs expected {safePct(baselineData.baselinePct)}
                  </p>
                )}
                {baselineData.paceDollars != null && baselineData.paceDollars !== 0 && (
                  <p className="text-sm text-slate-300 mt-2">
                    Your {baselineData.currentGrade ?? "—"} grade means you are on pace to{" "}
                    {baselineData.paceDollars > 0
                      ? `overspend ${safeDollars(baselineData.paceDollars)} this month`
                      : `save ${safeDollars(-baselineData.paceDollars)} this month`}
                  </p>
                )}
                {baselineData.nextGradeTarget && (
                  <p className="text-xs text-slate-400 mt-2">
                    Reduce food cost by {safePct(baselineData.nextGradeTarget.reducePct)} to reach {baselineData.nextGradeTarget.nextGrade}
                  </p>
                )}
                {baselineData.streakMonths >= 2 && (
                  <p className="text-xs text-amber-400 mt-2">{baselineData.streakMonths} month streak 🔥</p>
                )}
              </div>
            </div>

            {baselineData.monthly.length > 0 && (
              <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 overflow-x-auto">
                <h3 className="text-sm font-semibold text-white mb-3">Month by month</h3>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-slate-500 border-b border-slate-700">
                      <th className="pb-2 pr-4">Month</th>
                      <th className="pb-2 pr-4">Revenue</th>
                      <th className="pb-2 pr-4">Hillcrest spend</th>
                      <th className="pb-2 pr-4">Food cost %</th>
                      <th className="pb-2">Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...baselineData.monthly].reverse().map((row) => (
                      <tr
                        key={row.month}
                        className={`border-b border-slate-700/50 ${
                          row.isCurrentMonth ? "bg-slate-700/50" : ""
                        }`}
                      >
                        <td className="py-2 pr-4 text-white">
                          {row.monthLabel}
                          {!row.isComplete && (
                            <span className="ml-1 text-xs text-amber-400">MTD</span>
                          )}
                        </td>
                        <td className="py-2 pr-4 text-slate-300">{safeDollars(row.revenue)}</td>
                        <td className="py-2 pr-4 text-slate-300">{safeDollars(row.hillcrestSpend)}</td>
                        <td className="py-2 pr-4 text-slate-300">
                          {row.foodCostPct != null ? safePct(row.foodCostPct) : "—"}
                        </td>
                        <td className="py-2">
                          <span className={`font-semibold ${getKitchenGradeColorClass(row.grade)}`}>
                            {row.grade ?? "—"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <p className="text-xs text-slate-500">
              Baseline updates automatically as each month closes. 4+ months recommended for a reliable baseline.
            </p>
          </>
        )}

        {baselineData === null && leaderboardData === null && !loading && selectedStore !== "all" && (
          <p className="text-sm text-slate-500">No baseline data for this store yet. Connect Hillcrest invoices and POS sales.</p>
        )}
        {selectedStore === "all" && leaderboardData === null && !loading && (
          <p className="text-sm text-slate-500">No leaderboard data yet.</p>
        )}
      </section>
    </div>
  );
}
