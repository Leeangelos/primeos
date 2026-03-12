import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getKitchenGrade } from "@/lib/kitchen-score";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const message = typeof body.message === "string" ? body.message.trim() : "";
    const storeSlug = typeof body.store_slug === "string" ? body.store_slug : "";
    const pagePath = typeof body.page_path === "string" ? body.page_path : "/";

    if (!message) {
      return NextResponse.json({ error: "message required" }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "Server config" }, { status: 500 });
    }
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Resolve store
    const resolvedSlug = storeSlug || "kent";
    const { data: storeRow } = await supabase
      .from("stores")
      .select("id, name, slug")
      .eq("slug", resolvedSlug)
      .maybeSingle();
    const storeId = storeRow?.id as string | undefined;
    const storeName = (storeRow?.name as string | undefined) ?? resolvedSlug;

    if (!storeId) {
      return NextResponse.json({ error: "store not found" }, { status: 400 });
    }

    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
    const startISO = thirtyDaysAgo.toISOString().slice(0, 10);
    const endISO = today.toISOString().slice(0, 10);

    const currentMonthKey = `${today.getFullYear()}-${String(
      today.getMonth() + 1
    ).padStart(2, "0")}`;

    const [sales30Res, labor30Res, purchases30Res, invoicesRes, salesAllRes] =
      await Promise.all([
        supabase
          .from("foodtec_daily_sales")
          .select("business_day, net_sales")
          .eq("store_id", storeId)
          .gte("business_day", startISO)
          .lte("business_day", endISO),
        supabase
          .from("foodtec_daily_labor")
          .select("business_day, total_labor_cost, total_overtime_cost")
          .eq("store_id", storeId)
          .gte("business_day", startISO)
          .lte("business_day", endISO),
        supabase
          .from("me_daily_purchases")
          .select("business_day, food_spend")
          .eq("store_id", storeId)
          .gte("business_day", startISO)
          .lte("business_day", endISO),
        supabase
          .from("me_invoices")
          .select("invoice_date, total")
          .eq("store_id", storeId)
          .in("category", ["food", "beverage"]),
        supabase
          .from("foodtec_daily_sales")
          .select("business_day, net_sales")
          .eq("store_id", storeId),
      ]);

    const sales30 =
      (sales30Res.data ?? []) as { business_day: string; net_sales: number }[];
    const labor30 =
      (labor30Res.data ?? []) as {
        business_day: string;
        total_labor_cost: number | null;
        total_overtime_cost: number | null;
      }[];
    const purchases30 =
      (purchases30Res.data ?? []) as {
        business_day: string;
        food_spend: number | null;
      }[];
    const invoices =
      (invoicesRes.data ?? []) as { invoice_date: string; total: number }[];
    const salesAll =
      (salesAllRes.data ?? []) as { business_day: string; net_sales: number }[];

    const totalNetSales30 = sales30.reduce(
      (s, r) => s + (Number(r.net_sales) || 0),
      0
    );
    const totalFoodSpend30 = purchases30.reduce(
      (s, r) => s + (Number(r.food_spend) || 0),
      0
    );
    const totalLaborCost30 = labor30.reduce(
      (s, r) =>
        s +
        (Number(r.total_labor_cost) || 0) +
        (Number(r.total_overtime_cost) || 0),
      0
    );

    const foodCostPct30 =
      totalNetSales30 > 0
        ? (totalFoodSpend30 / totalNetSales30) * 100
        : null;
    const laborPct30 =
      totalNetSales30 > 0
        ? (totalLaborCost30 / totalNetSales30) * 100
        : null;

    // Sales MTD
    const salesByMonth: Record<string, number> = {};
    for (const row of salesAll) {
      const d = row.business_day;
      if (!d || typeof d !== "string") continue;
      const month = d.slice(0, 7);
      salesByMonth[month] = (salesByMonth[month] ?? 0) + (Number(row.net_sales) || 0);
    }
    const salesMTD = salesByMonth[currentMonthKey] ?? 0;

    // Kitchen Score grade (reuse kitchen-score logic)
    const hillcrestByMonth: Record<string, number> = {};
    for (const row of invoices) {
      const d = row.invoice_date;
      if (!d || typeof d !== "string") continue;
      const month = d.slice(0, 7);
      hillcrestByMonth[month] =
        (hillcrestByMonth[month] ?? 0) + (Number(row.total) || 0);
    }
    const revenueByMonth: Record<string, number> = {};
    for (const row of salesAll) {
      const d = row.business_day;
      if (!d || typeof d !== "string") continue;
      const month = d.slice(0, 7);
      revenueByMonth[month] =
        (revenueByMonth[month] ?? 0) + (Number(row.net_sales) || 0);
    }

    const completeMonthsPct: number[] = [];
    let avgMonthlyRevenue = 0;
    let completeRevenueCount = 0;
    for (const monthKey of Object.keys(revenueByMonth)) {
      if (monthKey === currentMonthKey) continue;
      const rev = revenueByMonth[monthKey] ?? 0;
      const spend = hillcrestByMonth[monthKey] ?? 0;
      if (rev > 0) {
        completeMonthsPct.push((spend / rev) * 100);
        avgMonthlyRevenue += rev;
        completeRevenueCount += 1;
      }
    }
    const baselinePct =
      completeMonthsPct.length > 0
        ? completeMonthsPct.reduce((a, b) => a + b, 0) / completeMonthsPct.length
        : null;

    const currentSpend = hillcrestByMonth[currentMonthKey] ?? 0;
    const currentRevenue = revenueByMonth[currentMonthKey] ?? 0;
    const currentPct =
      currentRevenue > 0 ? (currentSpend / currentRevenue) * 100 : null;
    const diff = baselinePct != null && currentPct != null ? currentPct - baselinePct : null;
    const kitchenGrade = getKitchenGrade(diff);

    const foodCostDisplay =
      foodCostPct30 != null ? `${foodCostPct30.toFixed(1)}%` : "N/A";
    const laborDisplay =
      laborPct30 != null ? `${laborPct30.toFixed(1)}%` : "N/A";
    const salesDisplay = `$${Math.round(salesMTD).toLocaleString("en-US")}`;
    const gradeDisplay = kitchenGrade ?? "N/A";

    const systemPrompt = `You are PrimeOS, an operations advisor for ${storeName}, an independent pizza operation. Current data: Food Cost: ${foodCostDisplay}, Kitchen Score: ${gradeDisplay}, Labor: ${laborDisplay}, Sales MTD: ${salesDisplay}. The operator is currently on the ${pagePath} page. Answer specifically for this store and situation. Be direct, practical, and conversational. You are their business partner, not a generic chatbot. Keep responses under 150 words unless asked for detail.`;

    let reply = "";
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.ANTHROPIC_API_KEY ?? "",
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: systemPrompt,
          messages: [{ role: "user", content: message }],
        }),
      });
      const data = await response.json();
      reply =
        data.content?.[0]?.text ??
        "I had trouble generating a response.";
    } catch (apiErr: any) {
      console.error("ask-primeos Anthropic error", apiErr);
      throw apiErr;
    }

    console.log("ask-primeos reply:", reply);

    return NextResponse.json({ reply });
  } catch (err: any) {
    console.error("ask-primeos POST error", err);
    return NextResponse.json(
      { error: err?.message || "Server error" },
      { status: 500 }
    );
  }
}

