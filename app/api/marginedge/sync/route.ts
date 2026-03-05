import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { fetchME, getMEStoreMap } from "@/src/lib/marginedge";

export async function GET(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Supabase environment variables are not set");
    }
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { searchParams } = new URL(request.url);
    const daysBack = parseInt(searchParams.get("days") || "30", 10);

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    const startISO = startDate.toISOString().split("T")[0];
    const endISO = endDate.toISOString().split("T")[0];

    console.log(`Syncing MarginEdge data from ${startISO} to ${endISO}`);

    const storeMap = await getMEStoreMap();
    let totalInvoices = 0;
    let totalStores = 0;

    const skipVendors = [
      "hourly labor",
      "salary",
      "tax",
      "taxes",
      "salary taxes",
      "insurance",
      "workers comp",
      "unemployment",
    ];

    const isHillcrest = (name: string) => name.toLowerCase().includes("hillcrest");

    const categorizeVendor = (name: string): string => {
      const n = name.toLowerCase();
      if (n.includes("paper") || n.includes("disposable") || n.includes("supply") || n.includes("supplies") || n.includes("packaging")) return "paper";
      if (n.includes("beverage") || n.includes("coca") || n.includes("pepsi") || n.includes("drink")) return "beverage";
      if (n.includes("restaurant depot") || n.includes("jetro") || n.includes("sysco") || n.includes("us foods") || n.includes("hillcrest") || n.includes("food")) return "food";
      return "other";
    };

    for (const unit of storeMap) {
      console.log(`\n--- ${unit.storeName} (ME ID: ${unit.meUnitId}) ---`);

      const ordersData = await fetchME(`/orders?restaurantUnitId=${unit.meUnitId}&startDate=${startISO}&endDate=${endISO}`);
      const orders = ordersData.orders || ordersData.data || (Array.isArray(ordersData) ? ordersData : []);

      console.log(`Found ${orders.length} invoices`);

      for (const o of orders) {
        const vendorName = o.vendorName || "Unknown";
        const total = Number(o.orderTotal) || 0;
        const invoiceDate = o.invoiceDate || o.createdDate || "";
        const orderId = String(o.orderId || o.id || "");

        if (skipVendors.some((s) => vendorName.toLowerCase().includes(s))) continue;
        if (total <= 0) continue;

        let normalizedDate = invoiceDate;
        if (invoiceDate.includes("/")) {
          const parts = invoiceDate.split("/");
          normalizedDate = `${parts[2]}-${parts[0].padStart(2, "0")}-${parts[1].padStart(2, "0")}`;
        } else {
          normalizedDate = invoiceDate.slice(0, 10);
        }

        await supabase.from("me_invoices").upsert(
          {
            store_id: unit.storeId,
            me_order_id: orderId,
            vendor_name: vendorName,
            invoice_date: normalizedDate,
            total,
            is_hillcrest: isHillcrest(vendorName),
            category: categorizeVendor(vendorName),
            status: "synced",
            raw_data: o,
            synced_at: new Date().toISOString(),
          },
          { onConflict: "store_id,me_order_id" }
        );
      }

      const dailyMap: Record<
        string,
        {
          totalSpend: number;
          foodSpend: number;
          paperSpend: number;
          beverageSpend: number;
          otherSpend: number;
          hillcrestSpend: number;
          nonHillcrestSpend: number;
          invoiceCount: number;
          vendors: Set<string>;
        }
      > = {};

      for (const o of orders) {
        const vendorName = o.vendorName || "Unknown";
        const total = Number(o.orderTotal) || 0;
        const invoiceDate = o.invoiceDate || o.createdDate || "";

        if (skipVendors.some((s) => vendorName.toLowerCase().includes(s))) continue;
        if (total <= 0) continue;

        let normalizedDate = invoiceDate;
        if (invoiceDate.includes("/")) {
          const parts = invoiceDate.split("/");
          normalizedDate = `${parts[2]}-${parts[0].padStart(2, "0")}-${parts[1].padStart(2, "0")}`;
        } else {
          normalizedDate = invoiceDate.slice(0, 10);
        }

        if (!dailyMap[normalizedDate]) {
          dailyMap[normalizedDate] = {
            totalSpend: 0,
            foodSpend: 0,
            paperSpend: 0,
            beverageSpend: 0,
            otherSpend: 0,
            hillcrestSpend: 0,
            nonHillcrestSpend: 0,
            invoiceCount: 0,
            vendors: new Set(),
          };
        }

        const day = dailyMap[normalizedDate];
        const cat = categorizeVendor(vendorName);

        day.totalSpend += total;
        day.invoiceCount++;
        day.vendors.add(vendorName);

        if (cat === "food") day.foodSpend += total;
        else if (cat === "paper") day.paperSpend += total;
        else if (cat === "beverage") day.beverageSpend += total;
        else day.otherSpend += total;

        if (isHillcrest(vendorName)) day.hillcrestSpend += total;
        else day.nonHillcrestSpend += total;
      }

      for (const [date, day] of Object.entries(dailyMap)) {
        await supabase.from("me_daily_purchases").upsert(
          {
            store_id: unit.storeId,
            business_day: date,
            me_store_name: unit.storeName,
            total_invoices: day.invoiceCount,
            total_spend: day.totalSpend,
            food_spend: day.foodSpend,
            paper_spend: day.paperSpend,
            beverage_spend: day.beverageSpend,
            other_spend: day.otherSpend,
            hillcrest_spend: day.hillcrestSpend,
            non_hillcrest_spend: day.nonHillcrestSpend,
            vendor_count: day.vendors.size,
            synced_at: new Date().toISOString(),
          },
          { onConflict: "store_id,business_day" }
        );
      }

      totalInvoices += orders.length;
      totalStores++;
    }

    return NextResponse.json({
      success: true,
      startDate: startISO,
      endDate: endISO,
      totalInvoices,
      stores: totalStores,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("MarginEdge sync error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
