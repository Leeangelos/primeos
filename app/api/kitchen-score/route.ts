import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getKitchenGrade } from "@/lib/kitchen-score";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "Server config" }, { status: 500 });
    }
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { searchParams } = new URL(request.url);
    const storeSlug = searchParams.get("store");
    if (!storeSlug) {
      return NextResponse.json({ error: "store required" }, { status: 400 });
    }

    const { data: storeRow } = await supabase
      .from("stores")
      .select("id")
      .eq("slug", storeSlug)
      .maybeSingle();
    const storeId = storeRow?.id as string | undefined;
    if (!storeId) {
      return NextResponse.json({ grade: null, currentPct: null, expectedPct: null, paceDollars: null });
    }

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

    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const completeMonthsPct: number[] = [];
    let avgMonthlyRevenue = 0;
    let completeRevenueCount = 0;
    for (const monthKey of Object.keys(revenueByMonth)) {
      if (monthKey === currentMonthKey) continue;
      const rev = revenueByMonth[monthKey] ?? 0;
      const spend = hillcrestByMonth[monthKey] ?? 0;
      if (rev > 0) completeMonthsPct.push((spend / rev) * 100);
      if (rev > 0) {
        avgMonthlyRevenue += rev;
        completeRevenueCount += 1;
      }
    }
    const baselinePct =
      completeMonthsPct.length > 0
        ? completeMonthsPct.reduce((a, b) => a + b, 0) / completeMonthsPct.length
        : null;
    const avgRev = completeRevenueCount > 0 ? avgMonthlyRevenue / completeRevenueCount : null;

    const currentSpend = hillcrestByMonth[currentMonthKey] ?? 0;
    const currentRevenue = revenueByMonth[currentMonthKey] ?? 0;
    const currentPct = currentRevenue > 0 ? (currentSpend / currentRevenue) * 100 : null;
    const diff = baselinePct != null && currentPct != null ? currentPct - baselinePct : null;
    const grade = getKitchenGrade(diff);
    const paceDollars =
      avgRev != null && baselinePct != null && currentPct != null
        ? ((currentPct - baselinePct) / 100) * avgRev
        : null;

    return NextResponse.json({
      grade,
      currentPct,
      expectedPct: baselinePct,
      paceDollars,
    });
  } catch (e) {
    console.error("kitchen-score", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
