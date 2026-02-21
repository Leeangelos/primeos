import { createClient } from "@supabase/supabase-js";

const API_KEY = process.env.MARGINEDGE_API_KEY!;
const BASE = "https://api.marginedge.com/public";
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const UNITS = [
  { meId: 375258487, name: "LeeAngelo's Aurora", slug: "aurora" },
  { meId: 559563420, name: "LeeAngelo's Kent", slug: "kent" },
  { meId: 778992713, name: "Lindsey's Pizza", slug: "lindseys" },
];

async function meGet(endpoint: string) {
  const url = `${BASE}${endpoint}`;
  const res = await fetch(url, {
    headers: { "X-Api-Key": API_KEY, "Accept": "application/json" },
  });
  if (!res.ok) return null;
  return res.json();
}

async function main() {
  console.log("=== SYNCING MARGIN EDGE PURCHASE ORDERS → PRIMEOS ===\n");

  const startDate = "2025-12-01";
  const endDate = "2026-02-21";

  for (const unit of UNITS) {
    console.log(`\n--- ${unit.name} ---`);

    // Get store ID from PrimeOS
    const { data: store } = await supabase
      .from("stores")
      .select("id")
      .eq("slug", unit.slug)
      .single();

    if (!store) {
      console.log(`  Store ${unit.slug} not found in PrimeOS, skipping`);
      continue;
    }

    // Pull orders
    const ordersData = await meGet(`/orders?restaurantUnitId=${unit.meId}&startDate=${startDate}&endDate=${endDate}`);
    if (!ordersData) {
      console.log("  No orders data");
      continue;
    }

    const orders = ordersData.orders || ordersData.data || (Array.isArray(ordersData) ? ordersData : []);
    console.log(`  Found ${orders.length} purchase orders`);

    // Group orders by date to get daily food cost
    const dailyPurchases: Record<string, { total: number; vendors: string[]; count: number }> = {};

    for (const o of orders) {
      const date = o.invoiceDate || o.createdDate;
      if (!date) continue;

      // Normalize date format
      const normalizedDate = date.includes("/")
        ? `${date.split("/")[2]}-${date.split("/")[0].padStart(2, "0")}-${date.split("/")[1].padStart(2, "0")}`
        : date.slice(0, 10);

      if (!dailyPurchases[normalizedDate]) {
        dailyPurchases[normalizedDate] = { total: 0, vendors: [], count: 0 };
      }

      const vendor = o.vendorName || "Unknown";
      const total = Number(o.orderTotal) || 0;

      // Skip non-food vendors (labor, taxes, etc)
      const skipVendors = ["hourly labor", "salary", "tax", "taxes", "salary taxes", "insurance"];
      if (skipVendors.some((s) => vendor.toLowerCase().includes(s))) continue;

      dailyPurchases[normalizedDate].total += total;
      if (!dailyPurchases[normalizedDate].vendors.includes(vendor)) {
        dailyPurchases[normalizedDate].vendors.push(vendor);
      }
      dailyPurchases[normalizedDate].count++;
    }

    // Save to invoices table
    let savedCount = 0;
    for (const [date, data] of Object.entries(dailyPurchases)) {
      if (data.total <= 0) continue;

      // Check if already exists
      const { data: existing } = await supabase
        .from("invoices")
        .select("id")
        .eq("invoice_date", date)
        .eq("vendor_name", `ME Sync: ${unit.name}`)
        .limit(1);

      if (existing && existing.length > 0) continue;

      await supabase.from("invoices").insert({
        vendor_name: `ME Sync: ${unit.name}`,
        invoice_date: date,
        total: data.total,
        line_items: data.vendors.map((v) => ({ product: v, qty: 1, unit: "order", unit_price: 0, extended_price: 0 })),
        status: "approved",
        approved_at: new Date().toISOString(),
      });
      savedCount++;
    }

    console.log(`  ${Object.keys(dailyPurchases).length} days with purchases`);
    console.log(`  ${savedCount} new daily summaries saved to invoices`);

    // Summary stats
    const totalSpend = Object.values(dailyPurchases).reduce((s, d) => s + d.total, 0);
    console.log(`  Total food purchases: $${totalSpend.toFixed(2)}`);
  }

  console.log("\n=== SYNC COMPLETE ===");
}

main();
