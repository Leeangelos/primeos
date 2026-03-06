import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// --- FOOD COST % CALCULATION LOCATIONS (for range response) ---
// RANGE "all" stores (exact lines):
//   const totalNetSales = salesRows.reduce((s, r) => s + (Number(r.net_sales) || 0), 0);
//   const totalFoodSpend = purchasesRows.reduce((s, r) => s + (Number(r.food_spend) || 0), 0);
//   const totalPaperSpend = purchasesRows.reduce((s, r) => s + (Number(r.paper_spend) || 0), 0);
//   const totalLaborCost = laborRows.reduce(...);
//   const foodCostPct = totalNetSales > 0 ? (totalFoodSpend / totalNetSales) * 100 : null;
//   const paperCostPct = totalNetSales > 0 ? (totalPaperSpend / totalNetSales) * 100 : null;
//   const cogsPct = totalNetSales > 0 ? ((totalFoodSpend + totalPaperSpend + totalLaborCost) / totalNetSales) * 100 : null;
// RANGE single store: same pattern (totalNetSales from salesRows, totalFoodSpend/totalPaperSpend from purchasesRows, totalLaborCost from laborRows; foodCostPct, paperCostPct, cogsPct).
// Day response: foodCostPct at "all" and single-store via totalFoodSpendRange/totalNetSalesRange from separate sales + purchases range queries.

export async function GET(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Supabase environment variables are not set");
    }
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { searchParams } = new URL(request.url);
    const storeIdParam = searchParams.get("store_id");
    const day = searchParams.get("day");
    const range = searchParams.get("range");

    console.log(`DAILY-DATA API: store_id=${storeIdParam}, day=${day ?? "n/a"}, range=${range ?? "n/a"}`);

    if (!storeIdParam) return NextResponse.json({ error: "store_id required" }, { status: 400 });

    const isAllStores = storeIdParam.toLowerCase() === "all";
    let storeIds: string[] = [];
    if (isAllStores) {
      const { data: stores } = await supabase.from("stores").select("id");
      storeIds = (stores ?? []).map((r) => r.id);
      if (storeIds.length === 0) return NextResponse.json({ error: "No stores found" }, { status: 404 });
    }

    let storeId = storeIdParam;
    if (!isAllStores) {
      const isSlug = storeIdParam.length < 36 || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(storeIdParam);
      if (isSlug) {
        const { data: storeRow } = await supabase.from("stores").select("id").eq("slug", storeIdParam).maybeSingle();
        if (storeRow?.id) storeId = storeRow.id;
      }
    }

    if (day && !range) {
      const dayStart = new Date(day + "T00:00:00Z");
      const rollStart = new Date(dayStart);
      rollStart.setUTCDate(rollStart.getUTCDate() - 6);
      const startISO = rollStart.toISOString().split("T")[0];

      if (isAllStores) {
        const [salesRowsRes, laborRowsRes, purchasesRowsRes, salesRangeRes, purchasesRangeRes] = await Promise.all([
          supabase.from("foodtec_daily_sales").select("*").in("store_id", storeIds).eq("business_day", day),
          supabase.from("foodtec_daily_labor").select("*").in("store_id", storeIds).eq("business_day", day),
          supabase.from("me_daily_purchases").select("*").in("store_id", storeIds).eq("business_day", day),
          supabase.from("foodtec_daily_sales").select("net_sales").in("store_id", storeIds).gte("business_day", startISO).lte("business_day", day),
          supabase.from("me_daily_purchases").select("food_spend, paper_spend").in("store_id", storeIds).gte("business_day", startISO).lte("business_day", day),
        ]);
        const salesRows = salesRowsRes.data ?? [];
        const laborRows = laborRowsRes.data ?? [];
        const purchasesRows = purchasesRowsRes.data ?? [];

        const sum = (arr: Record<string, unknown>[], key: string) => arr.reduce((s, r) => s + (Number(r[key]) || 0), 0);
        const netSales = sum(salesRows, "net_sales");
        const totalOrders = sum(salesRows, "total_orders");
        const foodSpend = sum(purchasesRows, "food_spend");
        const paperSpend = sum(purchasesRows, "paper_spend");
        const laborCost = sum(laborRows, "total_labor_cost") + sum(laborRows, "total_overtime_cost");
        const totalHours = sum(laborRows, "regular_hours") + sum(laborRows, "overtime_hours");

        const totalNetSalesRange = (salesRangeRes.data ?? []).reduce((s, r) => s + (Number(r.net_sales) || 0), 0);
        const totalFoodSpendRange = (purchasesRangeRes.data ?? []).reduce((s, r) => s + (Number(r.food_spend) || 0), 0);
        const totalPaperSpendRange = (purchasesRangeRes.data ?? []).reduce((s, r) => s + (Number(r.paper_spend) || 0), 0);
        const foodCostPctFinal = totalNetSalesRange > 0 && totalFoodSpendRange >= 0 ? (totalFoodSpendRange / totalNetSalesRange) * 100 : null;
        const laborPct = netSales > 0 ? (laborCost / netSales) * 100 : null;
        const disposablesPctRolling = totalNetSalesRange > 0 && totalPaperSpendRange >= 0 ? (totalPaperSpendRange / totalNetSalesRange) * 100 : null;
        const foodDisposablesPctRolling =
          totalNetSalesRange > 0 ? ((totalFoodSpendRange + totalPaperSpendRange) / totalNetSalesRange) * 100 : null;
        const cogsPct = laborPct != null ? (foodCostPctFinal ?? 0) + laborPct + (disposablesPctRolling ?? 0) : null;
        const grossProfitPct = cogsPct != null ? 100 - cogsPct : null;
        const splh = totalHours > 0 ? netSales / totalHours : null;
        const avgTicket = totalOrders > 0 ? netSales / totalOrders : 0;

        const bumpTimes = salesRows.map((r) => Number(r.avg_bump_time)).filter((v) => v != null && v > 0);
        const bumpDineIn = salesRows.map((r) => Number(r.avg_bump_time_dinein)).filter((v) => v != null && v > 0);
        const bumpPickup = salesRows.map((r) => Number(r.avg_bump_time_pickup)).filter((v) => v != null && v > 0);
        const bumpDelivery = salesRows.map((r) => Number(r.avg_bump_time_delivery)).filter((v) => v != null && v > 0);
        const avgBump = (arr: number[]) => (arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);

        return NextResponse.json({
          day,
          hasLiveData: salesRows.length > 0 || laborRows.length > 0 || purchasesRows.length > 0,
          hasSalesData: salesRows.length > 0,
          hasLaborData: laborRows.length > 0,
          hasPurchaseData: purchasesRows.length > 0,
          netSales,
          grossSales: sum(salesRows, "gross_sales"),
          totalOrders,
          avgTicket,
          guestCount: sum(salesRows, "guest_count"),
          totalTips: sum(salesRows, "total_tips"),
          totalDiscounts: sum(salesRows, "total_discounts"),
          dineInOrders: sum(salesRows, "dine_in_orders"),
          dineInSales: sum(salesRows, "dine_in_sales"),
          pickupOrders: sum(salesRows, "pickup_orders"),
          pickupSales: sum(salesRows, "pickup_sales"),
          deliveryOrders: sum(salesRows, "delivery_orders"),
          deliverySales: sum(salesRows, "delivery_sales"),
          doordashOrders: sum(salesRows, "doordash_orders"),
          doordashSales: sum(salesRows, "doordash_sales"),
          doordashCommission: sum(salesRows, "doordash_commission"),
          doordashNewCustomers: sum(salesRows, "doordash_new_customers"),
          doordashReturningCustomers: sum(salesRows, "doordash_returning_customers"),
          avgBumpTime: avgBump(bumpTimes),
          avgBumpTimeDineIn: avgBump(bumpDineIn),
          avgBumpTimePickup: avgBump(bumpPickup),
          avgBumpTimeDelivery: avgBump(bumpDelivery),
          ordersEarly: sum(salesRows, "orders_early"),
          ordersOnTime: sum(salesRows, "orders_on_time"),
          ordersLate: sum(salesRows, "orders_late"),
          regularHours: sum(laborRows, "regular_hours"),
          overtimeHours: sum(laborRows, "overtime_hours"),
          totalLaborCost: laborCost,
          uniqueEmployees: laborRows.reduce((s, r) => s + (Number(r.unique_employees) || 0), 0),
          avgHourlyRate: laborRows.length > 0 ? laborCost / totalHours : 0,
          splh,
          foodSpend,
          paperSpend,
          beverageSpend: sum(purchasesRows, "beverage_spend"),
          hillcrestSpend: sum(purchasesRows, "hillcrest_spend"),
          totalPurchases: sum(purchasesRows, "total_spend"),
          foodCostPct: foodCostPctFinal,
          foodCostRaw: netSales > 0 ? (foodSpend / netSales) * 100 : null,
          foodCostPeriod: "7-day rolling average",
          laborPct,
          disposablesPct: disposablesPctRolling,
          foodDisposablesPctRolling,
          cogsPct,
          grossProfitPct,
        });
      }

      const [salesRes, laborRes, purchasesRes, salesRangeRes, purchasesRangeRes] = await Promise.all([
        supabase.from("foodtec_daily_sales").select("*").eq("store_id", storeId).eq("business_day", day).maybeSingle(),
        supabase.from("foodtec_daily_labor").select("*").eq("store_id", storeId).eq("business_day", day).maybeSingle(),
        supabase.from("me_daily_purchases").select("*").eq("store_id", storeId).eq("business_day", day).maybeSingle(),
        supabase.from("foodtec_daily_sales").select("net_sales").eq("store_id", storeId).gte("business_day", startISO).lte("business_day", day),
        supabase.from("me_daily_purchases").select("food_spend, paper_spend").eq("store_id", storeId).gte("business_day", startISO).lte("business_day", day),
      ]);

      console.log(`Sales data: ${salesRes.data ? "FOUND" : "NULL"}, Labor data: ${laborRes.data ? "FOUND" : "NULL"}, Purchases data: ${purchasesRes.data ? "FOUND" : "NULL"}`);

      const sales = salesRes.data;
      const labor = laborRes.data;
      const purchases = purchasesRes.data;

      const netSales = sales?.net_sales ?? 0;
      const foodSpend = purchases?.food_spend ?? 0;
      const laborCost = (labor?.total_labor_cost ?? 0) + (labor?.total_overtime_cost ?? 0);
      const paperSpend = purchases?.paper_spend ?? 0;

      const totalNetSalesRange = (salesRangeRes.data ?? []).reduce((s, r) => s + (Number(r.net_sales) || 0), 0);
      const totalFoodSpendRange = (purchasesRangeRes.data ?? []).reduce((s, r) => s + (Number(r.food_spend) || 0), 0);
      const totalPaperSpendRange = (purchasesRangeRes.data ?? []).reduce((s, r) => s + (Number(r.paper_spend) || 0), 0);
      const foodCostPctFinal = totalNetSalesRange > 0 && totalFoodSpendRange >= 0 ? (totalFoodSpendRange / totalNetSalesRange) * 100 : null;
      const disposablesPctRolling = totalNetSalesRange > 0 && totalPaperSpendRange >= 0 ? (totalPaperSpendRange / totalNetSalesRange) * 100 : null;
      const foodDisposablesPctRolling =
        totalNetSalesRange > 0
          ? ((totalFoodSpendRange + totalPaperSpendRange) / totalNetSalesRange) * 100
          : null;

      const foodCostRaw = netSales > 0 ? (foodSpend / netSales) * 100 : null;

      const laborPct = netSales > 0 ? (laborCost / netSales) * 100 : null;
      const cogsPct =
        laborPct != null
          ? (foodCostPctFinal ?? 0) + laborPct + (disposablesPctRolling ?? 0)
          : null;
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
        foodCostPct: foodCostPctFinal,
        foodCostRaw,
        foodCostPeriod: "7-day rolling average",
        laborPct,
        disposablesPct: disposablesPctRolling,
        foodDisposablesPctRolling,
        cogsPct,
        grossProfitPct,
      });
    }

    if (range) {
      const daysBack = range === "week" ? 7 : range === "month" ? 30 : parseInt(range, 10) || 7;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysBack);
      const startISO = startDate.toISOString().split("T")[0];

      if (isAllStores) {
        const [salesRes, laborRes, purchasesRes] = await Promise.all([
          supabase.from("foodtec_daily_sales").select("*").in("store_id", storeIds).gte("business_day", startISO).order("business_day", { ascending: true }),
          supabase.from("foodtec_daily_labor").select("*").in("store_id", storeIds).gte("business_day", startISO).order("business_day", { ascending: true }),
          supabase.from("me_daily_purchases").select("*").in("store_id", storeIds).gte("business_day", startISO).order("business_day", { ascending: true }),
        ]);
        const salesRows = salesRes.data ?? [];
        const laborRows = laborRes.data ?? [];
        const purchasesRows = purchasesRes.data ?? [];

        const days = [...new Set(salesRows.map((r) => r.business_day).concat(laborRows.map((r) => r.business_day)).concat(purchasesRows.map((r) => r.business_day)))].filter(Boolean).sort() as string[];
        const sumByDay = (rows: Record<string, unknown>[], day: string, key: string) =>
          rows.filter((r) => r.business_day === day).reduce((s, r) => s + (Number(r[key]) || 0), 0);
        const sales = days.map((d) => ({
          business_day: d,
          net_sales: sumByDay(salesRows, d, "net_sales"),
          total_orders: sumByDay(salesRows, d, "total_orders"),
          dine_in_sales: sumByDay(salesRows, d, "dine_in_sales"),
          pickup_sales: sumByDay(salesRows, d, "pickup_sales"),
          delivery_sales: sumByDay(salesRows, d, "delivery_sales"),
          web_sales: sumByDay(salesRows, d, "web_sales"),
          doordash_sales: sumByDay(salesRows, d, "doordash_sales"),
          cash_sales: sumByDay(salesRows, d, "cash_sales"),
          card_sales: sumByDay(salesRows, d, "card_sales"),
          house_account_owed: sumByDay(salesRows, d, "house_account_owed"),
          house_account_received: sumByDay(salesRows, d, "house_account_received"),
        }));
        const labor = days.map((d) => ({
          business_day: d,
          total_labor_cost: sumByDay(laborRows, d, "total_labor_cost"),
          total_overtime_cost: sumByDay(laborRows, d, "total_overtime_cost"),
          regular_hours: sumByDay(laborRows, d, "regular_hours"),
          overtime_hours: sumByDay(laborRows, d, "overtime_hours"),
        }));
        const purchases = days.map((d) => ({
          business_day: d,
          total_spend: sumByDay(purchasesRows, d, "total_spend"),
          food_spend: sumByDay(purchasesRows, d, "food_spend"),
          paper_spend: sumByDay(purchasesRows, d, "paper_spend"),
        }));

        const totalNetSales = salesRows.reduce((s, r) => s + (Number(r.net_sales) || 0), 0);
        const totalFoodSpend = purchasesRows.reduce((s, r) => s + (Number(r.food_spend) || 0), 0);
        const totalPaperSpend = purchasesRows.reduce((s, r) => s + (Number(r.paper_spend) || 0), 0);
        const totalLaborCost = laborRows.reduce((s, r) => s + (Number(r.total_labor_cost) || 0) + (Number(r.total_overtime_cost) || 0), 0);
        const foodCostPct = totalNetSales > 0 ? (totalFoodSpend / totalNetSales) * 100 : null;
        const paperCostPct = totalNetSales > 0 ? (totalPaperSpend / totalNetSales) * 100 : null;
        const cogsPct = totalNetSales > 0 ? ((totalFoodSpend + totalPaperSpend + totalLaborCost) / totalNetSales) * 100 : null;
        console.log(`FOOD COST CHECK: totalFoodSpend=${totalFoodSpend} totalNetSales=${totalNetSales} foodCostPct=${foodCostPct}`);

        return NextResponse.json({
          range: daysBack,
          sales,
          labor,
          purchases,
          totalNetSales,
          totalFoodSpend,
          totalPaperSpend,
          totalLaborCost,
          foodCostPct,
          paperCostPct,
          cogsPct,
        });
      }

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

      const salesRows = salesRes.data ?? [];
      const laborRows = laborRes.data ?? [];
      const purchasesRows = purchasesRes.data ?? [];
      const totalNetSales = salesRows.reduce((s, r) => s + (Number(r.net_sales) || 0), 0);
      const totalFoodSpend = purchasesRows.reduce((s, r) => s + (Number(r.food_spend) || 0), 0);
      const totalPaperSpend = purchasesRows.reduce((s, r) => s + (Number(r.paper_spend) || 0), 0);
      const totalLaborCost = laborRows.reduce((s, r) => s + (Number(r.total_labor_cost) || 0) + (Number(r.total_overtime_cost) || 0), 0);
      const foodCostPct = totalNetSales > 0 ? (totalFoodSpend / totalNetSales) * 100 : null;
      const paperCostPct = totalNetSales > 0 ? (totalPaperSpend / totalNetSales) * 100 : null;
      const cogsPct = totalNetSales > 0 ? ((totalFoodSpend + totalPaperSpend + totalLaborCost) / totalNetSales) * 100 : null;
      console.log(`FOOD COST CHECK: totalFoodSpend=${totalFoodSpend} totalNetSales=${totalNetSales} foodCostPct=${foodCostPct}`);

      console.log(`Range: Sales rows=${salesRows.length}, Labor rows=${laborRows.length}, Purchases rows=${purchasesRows.length}`);

      return NextResponse.json({
        range: daysBack,
        sales: salesRows,
        labor: laborRows,
        purchases: purchasesRows,
        totalNetSales,
        totalFoodSpend,
        totalPaperSpend,
        totalLaborCost,
        foodCostPct,
        paperCostPct,
        cogsPct,
      });
    }

    return NextResponse.json({ error: "day or range required" }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
