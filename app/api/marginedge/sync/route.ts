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
      "electric",
      "gas company",
      "utility",
      "rent",
      "lease",
      "mortgage",
      "loan",
    ];

    const isHillcrest = (name: string) => name.toLowerCase().includes("hillcrest");

    const categorizeVendor = (name: string): string => {
      const n = name.toLowerCase();

      // Beverages
      if (n.includes("coca cola") || n.includes("coke") || n.includes("pepsi") || n.includes("dr pepper") || n.includes("beverage")) {
        return "beverage";
      }

      // Paper / disposables / cleaning supplies
      if (
        n.includes("paper") ||
        n.includes("disposable") ||
        n.includes("supply") ||
        n.includes("supplies") ||
        n.includes("packaging") ||
        n.includes("cleaning") ||
        n.includes("chemical") ||
        n.includes("janitorial") ||
        n.includes("cintas") ||
        n.includes("sysco supply")
      ) {
        return "paper";
      }

      // Rent / property
      if (
        n.includes("university plaza") ||
        n.includes("plaza") ||
        n.includes("property") ||
        n.includes("realty") ||
        n.includes("real estate") ||
        (n.includes("llc") && (n.includes("plaza") || n.includes("property") || n.includes("realty") || n.includes("real estate")))
      ) {
        return "rent";
      }

      // Utilities
      if (
        n.includes("electric") ||
        n.includes("gas") ||
        n.includes("water") ||
        n.includes("spectrum") ||
        n.includes("att") ||
        n.includes("at&t") ||
        n.includes("verizon") ||
        n.includes("internet") ||
        n.includes("phone") ||
        n.includes("waste") ||
        n.includes("wm") ||
        n.includes("republic") ||
        n.includes("trash") ||
        n.includes("utility") ||
        n.includes("utilities")
      ) {
        return "utilities";
      }

      // Payroll / HR
      if (
        n.includes("adp") ||
        n.includes("paychex") ||
        n.includes("payroll") ||
        n.includes("7shifts") ||
        n.includes("scheduling") ||
        n.includes("gusto")
      ) {
        return "payroll_hr";
      }

      // Software / POS
      if (
        n.includes("marginedge") ||
        n.includes("foodtec") ||
        n.includes("toast") ||
        n.includes("square") ||
        n.includes("clover") ||
        n.includes("pizza cloud") ||
        n.includes("pos")
      ) {
        return "software";
      }

      // Accounting / legal
      if (
        n.includes("accounting") ||
        n.includes("cpa") ||
        n.includes("legal") ||
        n.includes("attorney") ||
        n.includes("law")
      ) {
        return "accounting_legal";
      }

      // Insurance
      if (
        n.includes("state farm") ||
        n.includes("progressive") ||
        n.includes("allstate") ||
        n.includes("insurance") ||
        n.includes("liability")
      ) {
        return "insurance";
      }

      // Maintenance / repairs
      if (
        n.includes("drain") ||
        n.includes("plumbing") ||
        n.includes("hvac") ||
        n.includes("repair") ||
        n.includes("hardware") ||
        n.includes("ace hardware") ||
        n.includes("service inc")
      ) {
        return "maintenance";
      }

      // Marketing / advertising
      if (
        n.includes("marketing") ||
        n.includes("advertising") ||
        n.includes("google") ||
        n.includes("facebook") ||
        n.includes("meta") ||
        n.includes("social")
      ) {
        return "marketing";
      }

      // Known food distributors / vendors that clearly imply food
      if (
        n.includes("hillcrest") ||
        n.includes("gordon food") ||
        n.includes("restaurant depot") ||
        n.includes("sysco") ||
        n.includes("us foods") ||
        n.includes("u.s. foods") ||
        n.includes("performance food") ||
        n.includes("buckeye brownies") ||
        n.includes("brownies") ||
        n.includes("grocery") ||
        n.includes("market") ||
        n.includes("farm") ||
        n.includes("bakery") ||
        n.includes("brewery") ||
        n.includes("amazon")
      ) {
        return "food";
      }

      // Default: non-food other
      return "other";
    };

    const mapProductCategory = (meCategories: any[]): string => {
      if (!meCategories || meCategories.length === 0) return "other";
      const catName = meCategories[0]?.categoryName?.toLowerCase() || "";

      if (catName.includes("cheese") || catName.includes("dairy")) return "cheese";
      if (catName.includes("meat") || catName.includes("poultry") || catName.includes("chicken") || catName.includes("pork") || catName.includes("beef")) return "meats";
      if (catName.includes("produce") || catName.includes("vegetable") || catName.includes("fruit")) return "produce";
      if (catName.includes("bread") || catName.includes("dough") || catName.includes("flour") || catName.includes("dry") || catName.includes("grocery")) return "dough_dry";
      if (catName.includes("sauce") || catName.includes("dressing") || catName.includes("condiment") || catName.includes("oil")) return "sauces";
      if (catName.includes("paper") || catName.includes("disposable") || catName.includes("supply") || catName.includes("supplies")) return "paper";
      if (catName.includes("beverage") || catName.includes("drink") || catName.includes("soda") || catName.includes("water") || catName.includes("beer") || catName.includes("liquor")) return "beverages";
      if (catName.includes("seafood") || catName.includes("fish")) return "meats";
      if (catName.includes("dessert")) return "dough_dry";
      if (catName.includes("food")) return "other";

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

    // Re-run categorization on existing invoices in the synced window
    const { data: existingInvoices, error: existingInvoicesError } = await supabase
      .from("me_invoices")
      .select("store_id, me_order_id, vendor_name, invoice_date")
      .gte("invoice_date", startISO)
      .lte("invoice_date", endISO);

    if (existingInvoicesError) {
      console.error("Error loading existing invoices for recategorization:", existingInvoicesError);
    } else if (existingInvoices && existingInvoices.length > 0) {
      for (const inv of existingInvoices) {
        const newCategory = categorizeVendor(inv.vendor_name || "");
        await supabase
          .from("me_invoices")
          .update({ category: newCategory })
          .eq("store_id", inv.store_id)
          .eq("me_order_id", inv.me_order_id);
      }
    }

    // Targeted recategorization for specific vendors across all history
    const { data: vendorInvoices, error: vendorInvoicesError } = await supabase
      .from("me_invoices")
      .select("store_id, me_order_id, vendor_name")
      .or(
        "vendor_name.ilike.%university plaza%,vendor_name.ilike.%adp%,vendor_name.ilike.%cintas%,vendor_name.ilike.%buckeye brownies%,vendor_name.ilike.%brownies%"
      );

    if (vendorInvoicesError) {
      console.error("Error loading vendor-specific invoices for recategorization:", vendorInvoicesError);
    } else if (vendorInvoices && vendorInvoices.length > 0) {
      for (const inv of vendorInvoices) {
        const newCategory = categorizeVendor(inv.vendor_name || "");
        await supabase
          .from("me_invoices")
          .update({ category: newCategory })
          .eq("store_id", inv.store_id)
          .eq("me_order_id", inv.me_order_id);
      }
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
