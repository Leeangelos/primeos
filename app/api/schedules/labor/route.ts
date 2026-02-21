import { NextRequest, NextResponse } from "next/server";
import { getClientForRoute } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const supabase = await getClientForRoute();
  const store = req.nextUrl.searchParams.get("store") || "all";
  const weekOf = req.nextUrl.searchParams.get("week");

  if (!weekOf) return NextResponse.json({ ok: false, error: "Missing week param" });

  const endDate = new Date(weekOf);
  endDate.setDate(endDate.getDate() + 6);
  const end = endDate.toISOString().slice(0, 10);

  let shiftQuery = supabase
    .from("schedules")
    .select("*")
    .gte("shift_date", weekOf)
    .lte("shift_date", end);

  if (store !== "all") {
    const { data: storeData } = await supabase.from("stores").select("id").eq("slug", store).single();
    if (storeData) shiftQuery = shiftQuery.eq("store_id", storeData.id);
  }

  const { data: shifts } = await shiftQuery;
  if (!shifts) return NextResponse.json({ ok: true, labor: null });

  let salesQuery = supabase
    .from("daily_kpis")
    .select("net_sales, business_date, store_id")
    .order("business_date", { ascending: false })
    .limit(28);

  if (store !== "all") {
    const { data: storeData } = await supabase.from("stores").select("id").eq("slug", store).single();
    if (storeData) salesQuery = salesQuery.eq("store_id", storeData.id);
  }

  const { data: recentSales } = await salesQuery;

  const salesByDow: Record<number, number[]> = {};
  for (const s of (recentSales || [])) {
    const dow = new Date(s.business_date + "T12:00:00Z").getDay();
    if (!salesByDow[dow]) salesByDow[dow] = [];
    salesByDow[dow].push(s.net_sales || 0);
  }

  const avgSalesByDow: Record<number, number> = {};
  for (const [dow, values] of Object.entries(salesByDow)) {
    avgSalesByDow[Number(dow)] = values.reduce((a, b) => a + b, 0) / values.length;
  }

  const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dailyBreakdown: any[] = [];
  let totalHours = 0;
  let totalLaborCost = 0;
  let totalProjectedSales = 0;

  for (let i = 0; i < 7; i++) {
    const d = new Date(weekOf);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().slice(0, 10);
    const dow = d.getDay();

    const dayShifts = (shifts || []).filter((s: any) => s.shift_date === dateStr);
    const dayHours = dayShifts.reduce((s: number, sh: any) => s + (Number(sh.hours) || 0), 0);
    const dayLaborCost = dayShifts.reduce((s: number, sh: any) => s + (Number(sh.labor_cost) || 0), 0);
    const projectedSales = avgSalesByDow[dow] || 0;
    const laborPct = projectedSales > 0 ? (dayLaborCost / projectedSales) * 100 : 0;
    const slph = dayHours > 0 ? projectedSales / dayHours : 0;

    totalHours += dayHours;
    totalLaborCost += dayLaborCost;
    totalProjectedSales += projectedSales;

    dailyBreakdown.push({
      date: dateStr,
      day: DAYS[dow],
      shifts: dayShifts.length,
      hours: +dayHours.toFixed(1),
      laborCost: +dayLaborCost.toFixed(2),
      projectedSales: Math.round(projectedSales),
      laborPct: +laborPct.toFixed(1),
      slph: Math.round(slph),
      employees: dayShifts.map((s: any) => ({ name: s.employee_name, role: s.role, start: s.start_time, end: s.end_time, hours: s.hours, cost: s.labor_cost })),
    });
  }

  const weekLaborPct = totalProjectedSales > 0 ? (totalLaborCost / totalProjectedSales) * 100 : 0;
  const weekSlph = totalHours > 0 ? totalProjectedSales / totalHours : 0;
  const targetLaborPct = 21;
  const targetLaborCost = totalProjectedSales * (targetLaborPct / 100);
  const overUnder = totalLaborCost - targetLaborCost;

  return NextResponse.json({
    ok: true,
    labor: {
      weekOf,
      totalHours: +totalHours.toFixed(1),
      totalLaborCost: +totalLaborCost.toFixed(2),
      totalProjectedSales: Math.round(totalProjectedSales),
      laborPct: +weekLaborPct.toFixed(1),
      slph: Math.round(weekSlph),
      targetLaborPct,
      targetLaborCost: Math.round(targetLaborCost),
      overUnder: Math.round(overUnder),
      daily: dailyBreakdown,
    },
  });
}
