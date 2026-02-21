import { NextRequest, NextResponse } from "next/server";
import { getClientForRoute } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const store = req.nextUrl.searchParams.get("store");
  const startDate = req.nextUrl.searchParams.get("start");
  const endDate = req.nextUrl.searchParams.get("end");

  if (!store || !startDate || !endDate) {
    return NextResponse.json({ ok: false, error: "Missing store, start, or end param" });
  }

  const supabase = await getClientForRoute();
  const { data: storeRow } = await supabase
    .from("stores")
    .select("id")
    .eq("slug", store)
    .single();

  if (!storeRow) {
    return NextResponse.json({ ok: false, error: "Store not found" });
  }

  const { data, error } = await supabase
    .from("daily_kpis")
    .select("net_sales, labor_dollars, labor_hours, food_dollars, disposables_dollars, voids_dollars, waste_dollars, customers")
    .eq("store_id", storeRow.id)
    .gte("business_date", startDate)
    .lte("business_date", endDate);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message });
  }

  if (!data || data.length === 0) {
    return NextResponse.json({ ok: true, summary: null, daysCount: 0 });
  }

  const totals = {
    totalSales: 0,
    totalLabor: 0,
    totalFood: 0,
    totalDisposables: 0,
    totalHours: 0,
    totalCustomers: 0,
    totalVoids: 0,
    totalWaste: 0,
  };

  for (const row of data) {
    totals.totalSales += row.net_sales ?? 0;
    totals.totalLabor += row.labor_dollars ?? 0;
    totals.totalFood += row.food_dollars ?? 0;
    totals.totalDisposables += row.disposables_dollars ?? 0;
    totals.totalHours += row.labor_hours ?? 0;
    totals.totalCustomers += row.customers ?? 0;
    totals.totalVoids += row.voids_dollars ?? 0;
    totals.totalWaste += row.waste_dollars ?? 0;
  }

  return NextResponse.json({ ok: true, summary: totals, daysCount: data.length });
}
