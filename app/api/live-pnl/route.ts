import { NextRequest, NextResponse } from "next/server";
import { getClientForRoute } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const store = req.nextUrl.searchParams.get("store");

  if (!store) {
    return NextResponse.json({ ok: false, error: "Missing store param" });
  }

  const supabase = await getClientForRoute();

  // Get store
  const { data: storeRow } = await supabase
    .from("stores")
    .select("id, name")
    .eq("slug", store)
    .single();

  if (!storeRow) {
    return NextResponse.json({ ok: false, error: "Store not found" });
  }

  // Current month range
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const monthStart = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const monthEnd = `${year}-${String(month + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  const today = now.toISOString().slice(0, 10);
  const dayOfMonth = now.getDate();

  // Fetch all entries this month
  const { data: entries, error } = await supabase
    .from("daily_kpis")
    .select("business_date, net_sales, labor_dollars, labor_hours, food_dollars, disposables_dollars, voids_dollars, waste_dollars, customers")
    .eq("store_id", storeRow.id)
    .gte("business_date", monthStart)
    .lte("business_date", today)
    .order("business_date", { ascending: true });

  if (error) {
    return NextResponse.json({ ok: false, error: error.message });
  }

  if (!entries || entries.length === 0) {
    return NextResponse.json({ ok: true, projection: null, message: "No data this month yet" });
  }

  // Actual totals
  const actual = entries.reduce(
    (acc, e) => ({
      sales: acc.sales + (e.net_sales ?? 0),
      labor: acc.labor + (e.labor_dollars ?? 0),
      food: acc.food + (e.food_dollars ?? 0),
      disposables: acc.disposables + (e.disposables_dollars ?? 0),
      hours: acc.hours + (e.labor_hours ?? 0),
      voids: acc.voids + (e.voids_dollars ?? 0),
      waste: acc.waste + (e.waste_dollars ?? 0),
      customers: acc.customers + (e.customers ?? 0),
    }),
    { sales: 0, labor: 0, food: 0, disposables: 0, hours: 0, voids: 0, waste: 0, customers: 0 }
  );

  const daysWithData = entries.length;
  const daysInMonth = lastDay;
  const daysRemaining = daysInMonth - dayOfMonth;

  // Daily averages
  const dailyAvg = {
    sales: actual.sales / daysWithData,
    labor: actual.labor / daysWithData,
    food: actual.food / daysWithData,
    disposables: actual.disposables / daysWithData,
    hours: actual.hours / daysWithData,
    customers: actual.customers / daysWithData,
  };

  // Projected month-end totals
  const projected = {
    sales: actual.sales + dailyAvg.sales * daysRemaining,
    labor: actual.labor + dailyAvg.labor * daysRemaining,
    food: actual.food + dailyAvg.food * daysRemaining,
    disposables: actual.disposables + dailyAvg.disposables * daysRemaining,
    hours: actual.hours + dailyAvg.hours * daysRemaining,
    customers: actual.customers + dailyAvg.customers * daysRemaining,
  };

  // Fixed costs estimate (30% of sales as per spec)
  const fixedCostPct = 30;
  const projectedPrime = projected.sales > 0
    ? ((projected.labor + projected.food + projected.disposables) / projected.sales) * 100
    : 0;
  const projectedProfit = projected.sales * (1 - projectedPrime / 100 - fixedCostPct / 100);
  const projectedProfitPct = projected.sales > 0
    ? ((projected.sales - projected.labor - projected.food - projected.disposables - projected.sales * fixedCostPct / 100) / projected.sales) * 100
    : 0;

  // What-if: if PRIME drops to 55%
  const targetPrime = 55;
  const targetPrimeProfit = projected.sales * (1 - targetPrime / 100 - fixedCostPct / 100);
  const primeSavings = targetPrimeProfit - projectedProfit;

  return NextResponse.json({
    ok: true,
    storeName: storeRow.name,
    monthLabel: now.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
    daysWithData,
    daysInMonth,
    daysRemaining,
    actual: {
      sales: Math.round(actual.sales),
      labor: Math.round(actual.labor),
      food: Math.round(actual.food),
      disposables: Math.round(actual.disposables),
      prime: Math.round(actual.labor + actual.food + actual.disposables),
      customers: actual.customers,
    },
    projected: {
      sales: Math.round(projected.sales),
      labor: Math.round(projected.labor),
      food: Math.round(projected.food),
      disposables: Math.round(projected.disposables),
      prime: Math.round(projected.labor + projected.food + projected.disposables),
      customers: Math.round(projected.customers),
    },
    percentages: {
      primePct: +projectedPrime.toFixed(1),
      laborPct: projected.sales > 0 ? +((projected.labor / projected.sales) * 100).toFixed(1) : 0,
      foodDispPct: projected.sales > 0 ? +(((projected.food + projected.disposables) / projected.sales) * 100).toFixed(1) : 0,
      fixedPct: fixedCostPct,
      profitPct: +projectedProfitPct.toFixed(1),
    },
    projectedProfit: Math.round(projectedProfit),
    whatIf: {
      targetPrime,
      targetProfit: Math.round(targetPrimeProfit),
      savings: Math.round(primeSavings),
    },
  });
}
