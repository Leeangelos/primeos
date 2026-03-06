import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  fetchFoodTecView,
  getStoreMap,
  formatFoodTecDate,
  pf,
  pi,
  minutesBetween,
} from "@/src/lib/foodtec";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dayParam = searchParams.get("day");

    const daysToSync: Date[] = [];
    if (dayParam) {
      daysToSync.push(new Date(dayParam + "T12:00:00"));
    } else {
      for (let d = 1; d <= 3; d++) {
        const t = new Date();
        t.setDate(t.getDate() - d);
        daysToSync.push(t);
      }
    }

    const storeMap = await getStoreMap();

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Supabase environment variables are not set");
    }
    const supabase = createClient(supabaseUrl, supabaseKey);

    let totalOrders = 0, totalLabor = 0, totalProducts = 0;
    const syncedDays: string[] = [];

    for (const targetDate of daysToSync) {
      const foodtecDay = formatFoodTecDate(targetDate);
      const isoDay = targetDate.toISOString().split("T")[0];
      console.log(`Syncing FoodTec data for ${isoDay} (${foodtecDay})`);
      syncedDays.push(isoDay);

    // ========== SYNC ORDERS ==========
    const orders = await fetchFoodTecView("order", foodtecDay);

    const ordersByStore: Record<string, typeof orders> = {};
    orders.forEach((order) => {
      const store = (order.store as string) || "unknown";
      if (!ordersByStore[store]) ordersByStore[store] = [];
      ordersByStore[store].push(order);
    });

    const houseAccounts = await fetchFoodTecView("houseAccountReceipt", foodtecDay);
    const payments = await fetchFoodTecView("payment", foodtecDay);
    const houseByStore: Record<string, { owed: number; received: number }> = {};
    houseAccounts.forEach((r) => {
      const store = (r.store as string) || "unknown";
      const voided = (r.voided ?? "").toLowerCase();
      const orderVoided = (r.ordervoided ?? "").toLowerCase();
      if (voided === "y" || orderVoided === "y") return;
      if (!houseByStore[store]) houseByStore[store] = { owed: 0, received: 0 };
      houseByStore[store].owed += pf(r.amount);
    });
    payments.forEach((p) => {
      const paymentType = (p.paymenttype ?? "").toLowerCase();
      const voided = (p.voided ?? "").toLowerCase();
      if (voided === "y" || !paymentType.includes("house account")) return;
      const store = (p.store as string) || "unknown";
      if (!houseByStore[store]) houseByStore[store] = { owed: 0, received: 0 };
      houseByStore[store].received += pf(p.amount);
    });

    for (const [storeName, storeOrders] of Object.entries(ordersByStore)) {
      const storeId = storeMap[storeName];
      if (!storeId) {
        console.log(`No store mapping for "${storeName}", skipping`);
        continue;
      }

      let netSales = 0,
        grossSales = 0,
        totalFoodCost = 0,
        totalDiscounts = 0;
      let totalTips = 0,
        totalTax = 0,
        guestCount = 0;
      let dineInOrders = 0,
        dineInSales = 0,
        pickupOrders = 0,
        pickupSales = 0;
      let deliveryOrders = 0,
        deliverySales = 0,
        webOrders = 0,
        webSales = 0;
      let doordashOrders = 0,
        doordashSales = 0,
        doordashNew = 0,
        doordashReturning = 0;
      let cashOrders = 0,
        cashSales = 0,
        cardOrders = 0,
        cardSales = 0;

      // Bump time tracking
      const bumpTimes: number[] = [];
      const bumpTimesDineIn: number[] = [];
      const bumpTimesPickup: number[] = [];
      const bumpTimesDelivery: number[] = [];
      let ordersEarly = 0,
        ordersOnTime = 0,
        ordersLate = 0;
      const promiseVsActual: number[] = [];

      storeOrders.forEach((o) => {
        const net = pf(o.net);
        const gross = pf(o.gross);
        netSales += net;
        grossSales += gross;
        totalFoodCost += pf(o.foodcost);
        totalDiscounts += pf(o.discount);
        totalTips += pf(o.tip);
        totalTax += pf(o.salestax);
        guestCount += pi(o.guestcount);

        const type = (o.type || "").toLowerCase();
        const source = (o.source || "").toLowerCase();
        const paymentType = (o.paymenttype || "").toLowerCase();
        const isNew = (o.isnew || "").toLowerCase() === "y";

        // Bump time: TimeOrdered → TimeMade (kitchen print to food ready)
        const bumpTime = minutesBetween(o.timeordered, o.timemade);
        if (bumpTime !== null) {
          bumpTimes.push(bumpTime);

          if (type.includes("dine") || type.includes("here") || type.includes("bar")) {
            bumpTimesDineIn.push(bumpTime);
          } else if (type.includes("pickup") || type.includes("to go")) {
            bumpTimesPickup.push(bumpTime);
          } else if (type.includes("deliver")) {
            bumpTimesDelivery.push(bumpTime);
          }
        }

        // Promise vs actual: PromiseTime vs TimeDone
        const promiseDiff = minutesBetween(o.timedone, o.promisetime);
        if (promiseDiff !== null) {
          promiseVsActual.push(promiseDiff);
          if (promiseDiff > 5) ordersEarly++; // Customer came early (done before promise)
          else if (promiseDiff >= -5) ordersOnTime++; // Within 5 min window
          else ordersLate++; // Late (done after promise)
        }

        // Order type breakdown
        if (type.includes("dine") || type.includes("here") || type.includes("bar")) {
          dineInOrders++;
          dineInSales += net;
        } else if (type.includes("pickup") || type.includes("to go")) {
          pickupOrders++;
          pickupSales += net;
        } else if (type.includes("deliver")) {
          deliveryOrders++;
          deliverySales += net;
        }

        if (source.includes("web") || source.includes("kiosk")) {
          webOrders++;
          webSales += net;
        }

        // DoorDash detection
        const allFields = `${o.station || ""} ${o.source || ""} ${o.cashier || ""} ${o.driver || ""} ${
          o.orderid || ""
        }`.toLowerCase();
        if (allFields.includes("door dash") || allFields.includes("doordash")) {
          doordashOrders++;
          doordashSales += net;
          if (isNew) doordashNew++;
          else doordashReturning++;
        }

        // Payment type
        if (paymentType.includes("cash")) {
          cashOrders++;
          cashSales += net;
        } else if (paymentType.includes("credit") || paymentType.includes("card")) {
          cardOrders++;
          cardSales += net;
        }
      });

      const totalOrders = storeOrders.length;
      const avgTicket = totalOrders > 0 ? netSales / totalOrders : 0;
      const doordashCommission = doordashSales * 0.25;

      // Large orders ($300+) for Catering & Large Orders page
      const LARGE_ORDER_THRESHOLD = 300;
      const largeOrderRows = storeOrders
        .filter((o) => pf(o.net) >= LARGE_ORDER_THRESHOLD)
        .map((o, idx) => ({
          store_id: storeId,
          business_day: isoDay,
          order_id: (o.orderid || "").trim() || `day-${isoDay}-${idx}`,
          net_amount: pf(o.net),
          flag_scheduling: false,
        }));
      if (largeOrderRows.length > 0) {
        await supabase.from("foodtec_large_orders").upsert(largeOrderRows, {
          onConflict: "store_id,business_day,order_id",
        });
      }

      // Bump time averages
      const avg = (arr: number[]) =>
        arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
      const min = (arr: number[]) => (arr.length > 0 ? Math.min(...arr) : 0);
      const max = (arr: number[]) => (arr.length > 0 ? Math.max(...arr) : 0);

      await supabase.from("foodtec_daily_sales").upsert(
        {
          store_id: storeId,
          business_day: isoDay,
          foodtec_store_name: storeName,
          total_orders: totalOrders,
          net_sales: netSales,
          gross_sales: grossSales,
          total_food_cost: totalFoodCost,
          total_discounts: totalDiscounts,
          total_tips: totalTips,
          total_tax: totalTax,
          guest_count: guestCount,
          avg_ticket: avgTicket,
          dine_in_orders: dineInOrders,
          dine_in_sales: dineInSales,
          pickup_orders: pickupOrders,
          pickup_sales: pickupSales,
          delivery_orders: deliveryOrders,
          delivery_sales: deliverySales,
          web_orders: webOrders,
          web_sales: webSales,
          doordash_orders: doordashOrders,
          doordash_sales: doordashSales,
          doordash_commission: doordashCommission,
          doordash_new_customers: doordashNew,
          doordash_returning_customers: doordashReturning,
          cash_orders: cashOrders,
          cash_sales: cashSales,
          card_orders: cardOrders,
          card_sales: cardSales,
          avg_bump_time: avg(bumpTimes),
          min_bump_time: min(bumpTimes),
          max_bump_time: max(bumpTimes),
          avg_bump_time_dinein: avg(bumpTimesDineIn),
          avg_bump_time_pickup: avg(bumpTimesPickup),
          avg_bump_time_delivery: avg(bumpTimesDelivery),
          orders_with_bump_data: bumpTimes.length,
          avg_promise_vs_actual: avg(promiseVsActual),
          orders_early: ordersEarly,
          orders_on_time: ordersOnTime,
          orders_late: ordersLate,
          house_account_owed: houseByStore[storeName]?.owed ?? 0,
          house_account_received: houseByStore[storeName]?.received ?? 0,
          house_account_net: (houseByStore[storeName]?.owed ?? 0) - (houseByStore[storeName]?.received ?? 0),
          synced_at: new Date().toISOString(),
        },
        { onConflict: "store_id,business_day" }
      );
    }

    // ========== SYNC LABOR ==========
    const labor = await fetchFoodTecView("labor", foodtecDay);

    const laborByStore: Record<string, typeof labor> = {};
    labor.forEach((shift) => {
      const store = (shift.store as string) || "unknown";
      if (!laborByStore[store]) laborByStore[store] = [];
      laborByStore[store].push(shift);
    });

    for (const [storeName, storeShifts] of Object.entries(laborByStore)) {
      const storeId = storeMap[storeName];
      if (!storeId) continue;

      let regularHours = 0,
        overtimeHours = 0,
        totalLaborCost = 0,
        totalOTCost = 0;
      let totalTipsDeclared = 0;
      const uniqueNames = new Set<string>();
      const rates: number[] = [];

      storeShifts.forEach((s) => {
        const regHrs = pf(s.regularhours);
        const otHrs = pf(s.overtimehours);
        const rate = pf(s.rate);
        const otRate = pf(s.overtimerate);

        regularHours += regHrs;
        overtimeHours += otHrs;
        totalLaborCost += regHrs * rate;
        totalOTCost += otHrs * (otRate > 0 ? otRate : rate * 1.5);
        totalTipsDeclared += pf(s.declaredtips);
        uniqueNames.add((s.name as string) || "unknown");
        if (rate > 0) rates.push(rate);
      });

      const avgRate =
        rates.length > 0 ? rates.reduce((a, b) => a + b, 0) / rates.length : 0;

      // Get net sales for labor % and SPLH
      const { data: salesData } = await supabase
        .from("foodtec_daily_sales")
        .select("net_sales")
        .eq("store_id", storeId)
        .eq("business_day", isoDay)
        .single();

      const netSales = salesData?.net_sales || 0;
      const totalHours = regularHours + overtimeHours;
      const laborPct =
        netSales > 0 ? ((totalLaborCost + totalOTCost) / netSales) * 100 : 0;
      const splh = totalHours > 0 ? netSales / totalHours : 0;

      await supabase.from("foodtec_daily_labor").upsert(
        {
          store_id: storeId,
          business_day: isoDay,
          foodtec_store_name: storeName,
          total_shifts: storeShifts.length,
          unique_employees: uniqueNames.size,
          regular_hours: regularHours,
          overtime_hours: overtimeHours,
          total_labor_cost: totalLaborCost,
          total_overtime_cost: totalOTCost,
          total_tips_declared: totalTipsDeclared,
          avg_hourly_rate: avgRate,
          labor_pct: laborPct,
          splh: splh,
          synced_at: new Date().toISOString(),
        },
        { onConflict: "store_id,business_day" }
      );
    }

    // ========== SYNC PRODUCTS ==========
    const products = await fetchFoodTecView("product", foodtecDay);

    const productsByStore: Record<string, typeof products> = {};
    products.forEach((p) => {
      const store = (p.store as string) || "unknown";
      if (!productsByStore[store]) productsByStore[store] = [];
      productsByStore[store].push(p);
    });

    for (const [storeName, storeProducts] of Object.entries(productsByStore)) {
      const storeId = storeMap[storeName];
      if (!storeId) continue;

      const itemKey = (p: Record<string, string>) =>
        `${p.item || "Unknown"}|${p.sz || ""}|${p.category || ""}`;
      const itemMap: Record<
        string,
        {
          category: string;
          item: string;
          size: string;
          qty: number;
          gross: number;
          net: number;
          foodCost: number;
        }
      > = {};

      storeProducts.forEach((p) => {
        const key = itemKey(p);
        if (!itemMap[key]) {
          itemMap[key] = {
            category: p.category || "",
            item: p.item || "Unknown",
            size: p.sz || "",
            qty: 0,
            gross: 0,
            net: 0,
            foodCost: 0,
          };
        }
        itemMap[key].qty += pf(p.quantity);
        itemMap[key].gross += pf(p.gross);
        itemMap[key].net += pf(p.net);
        itemMap[key].foodCost += pf(p.foodcost);
      });

      for (const item of Object.values(itemMap)) {
        const foodCostPct = item.net > 0 ? (item.foodCost / item.net) * 100 : 0;

        await supabase.from("foodtec_daily_products").upsert(
          {
            store_id: storeId,
            business_day: isoDay,
            foodtec_store_name: storeName,
            category: item.category,
            item_name: item.item,
            size: item.size,
            quantity: item.qty,
            unit_price: item.qty > 0 ? item.net / item.qty : 0,
            total_gross: item.gross,
            total_net: item.net,
            total_food_cost: item.foodCost,
            food_cost_pct: foodCostPct,
            synced_at: new Date().toISOString(),
          },
          { onConflict: "store_id,business_day,item_name,size,category" }
        );
      }
    }

      totalOrders += orders.length;
      totalLabor += labor.length;
      totalProducts += products.length;
    }

    return NextResponse.json({
      success: true,
      days: syncedDays,
      orders: totalOrders,
      labor: totalLabor,
      products: totalProducts,
      stores: Object.keys(storeMap),
    });
  } catch (err: any) {
    console.error("FoodTec sync error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

