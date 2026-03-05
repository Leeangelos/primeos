import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Supabase environment variables are not set");
    }
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get("store_id");
    const day = searchParams.get("day");
    const range = searchParams.get("range");

    if (!storeId) return NextResponse.json({ error: "store_id required" }, { status: 400 });

    if (day && !range) {
      const [salesRes, laborRes, purchasesRes] = await Promise.all([
        supabase.from("foodtec_daily_sales").select("*").eq("store_id", storeId).eq("business_day", day).maybeSingle(),
        supabase.from("foodtec_daily_labor").select("*").eq("store_id", storeId).eq("business_day", day).maybeSingle(),
        supabase.from("me_daily_purchases").select("*").eq("store_id", storeId).eq("business_day", day).maybeSingle(),
      ]);

      const sales = salesRes.data;
      const labor = laborRes.data;
      const purchases = purchasesRes.data;

      const netSales = sales?.net_sales ?? 0;
      const foodSpend = purchases?.food_spend ?? 0;
      const laborCost = (labor?.total_labor_cost ?? 0) + (labor?.total_overtime_cost ?? 0);
      const paperSpend = purchases?.paper_spend ?? 0;

      const foodCostPct = netSales > 0 ? (foodSpend / netSales) * 100 : null;
      const laborPct = netSales > 0 ? (laborCost / netSales) * 100 : null;
      const disposablesPct = netSales > 0 ? (paperSpend / netSales) * 100 : null;
      const cogsPct =
        foodCostPct != null && laborPct != null ? foodCostPct + laborPct + (disposablesPct ?? 0) : null;
      const grossProfitPct = cogsPct != null ? 100 - cogsPct : null;
      const totalHours = (labor?.regular_hours ?? 0) + (labor?.overtime_hours ?? 0);
      const splh = totalHours > 0 ? netSales / totalHours : null;

      return NextResponse.json({
        day,
        hasLiveData: !!(sales || labor || purchases),
        hasSalesData: !!sales,
        hasLaborData: !!labor,
        hasPurchaseData: !!purchases,
        netSales: sales?.net_sales ?? 0,
        grossSales: sales?.gross_sales ?? 0,
        totalOrders: sales?.total_orders ?? 0,
        avgTicket: sales?.avg_ticket ?? 0,
        guestCount: sales?.guest_count ?? 0,
        totalTips: sales?.total_tips ?? 0,
        totalDiscounts: sales?.total_discounts ?? 0,
        dineInOrders: sales?.dine_in_orders ?? 0,
        dineInSales: sales?.dine_in_sales ?? 0,
        pickupOrders: sales?.pickup_orders ?? 0,
        pickupSales: sales?.pickup_sales ?? 0,
        deliveryOrders: sales?.delivery_orders ?? 0,
        deliverySales: sales?.delivery_sales ?? 0,
        doordashOrders: sales?.doordash_orders ?? 0,
        doordashSales: sales?.doordash_sales ?? 0,
        doordashCommission: sales?.doordash_commission ?? 0,
        doordashNewCustomers: sales?.doordash_new_customers ?? 0,
        doordashReturningCustomers: sales?.doordash_returning_customers ?? 0,
        avgBumpTime: sales?.avg_bump_time ?? 0,
        avgBumpTimeDineIn: sales?.avg_bump_time_dinein ?? 0,
        avgBumpTimePickup: sales?.avg_bump_time_pickup ?? 0,
        avgBumpTimeDelivery: sales?.avg_bump_time_delivery ?? 0,
        ordersEarly: sales?.orders_early ?? 0,
        ordersOnTime: sales?.orders_on_time ?? 0,
        ordersLate: sales?.orders_late ?? 0,
        regularHours: labor?.regular_hours ?? 0,
        overtimeHours: labor?.overtime_hours ?? 0,
        totalLaborCost: laborCost,
        uniqueEmployees: labor?.unique_employees ?? 0,
        avgHourlyRate: labor?.avg_hourly_rate ?? 0,
        splh,
        foodSpend,
        paperSpend,
        beverageSpend: purchases?.beverage_spend ?? 0,
        hillcrestSpend: purchases?.hillcrest_spend ?? 0,
        totalPurchases: purchases?.total_spend ?? 0,
        foodCostPct,
        laborPct,
        disposablesPct,
        cogsPct,
        grossProfitPct,
      });
    }

    if (range) {
      const daysBack = range === "week" ? 7 : range === "month" ? 30 : parseInt(range, 10) || 7;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysBack);
      const startISO = startDate.toISOString().split("T")[0];

      const [salesRes, laborRes, purchasesRes] = await Promise.all([
        supabase
          .from("foodtec_daily_sales")
          .select("*")
          .eq("store_id", storeId)
          .gte("business_day", startISO)
          .order("business_day", { ascending: true }),
        supabase
          .from("foodtec_daily_labor")
          .select("*")
          .eq("store_id", storeId)
          .gte("business_day", startISO)
          .order("business_day", { ascending: true }),
        supabase
          .from("me_daily_purchases")
          .select("*")
          .eq("store_id", storeId)
          .gte("business_day", startISO)
          .order("business_day", { ascending: true }),
      ]);

      return NextResponse.json({
        range: daysBack,
        sales: salesRes.data ?? [],
        labor: laborRes.data ?? [],
        purchases: purchasesRes.data ?? [],
      });
    }

    return NextResponse.json({ error: "day or range required" }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
