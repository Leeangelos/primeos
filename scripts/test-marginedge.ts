import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const API_KEY = process.env.MARGINEDGE_API_KEY;
if (!API_KEY) { console.log("Missing MARGINEDGE_API_KEY"); process.exit(1); }

const BASE = "https://api.marginedge.com/public";
const headers = { 'X-Api-Key': API_KEY!, 'Accept': 'application/json' };

const UNITS = [
  { meId: 375258487, name: "Aurora" },
  { meId: 559563420, name: "Kent" },
  { meId: 778992713, name: "Lindsey's" },
];

async function meGet(endpoint: string) {
  const res = await fetch(`${BASE}${endpoint}`, { headers });
  if (!res.ok) return { error: res.status };
  return res.json();
}

async function run() {
  console.log("=== MARGINEDGE DIAGNOSTIC v3 ===\n");

  for (const unit of UNITS) {
    console.log(`--- ${unit.name} (ID: ${unit.meId}) ---\n`);

    // Products
    const products = await meGet(`/products?restaurantUnitId=${unit.meId}`);
    if (products.error) {
      console.log(`  Products: ❌ ${products.error}`);
    } else {
      const items = products.products || products.data || (Array.isArray(products) ? products : []);
      console.log(`  Products: ✅ ${items.length} items`);
      if (items.length > 0) {
        const sample = items[0];
        console.log(`  Sample: ${sample.productName || sample.name} — $${sample.latestPrice || sample.price || 'N/A'}`);
      }
    }

    // Vendors
    const vendorsData = await meGet(`/vendors?restaurantUnitId=${unit.meId}`);
    if (vendorsData.error) {
      console.log(`  Vendors: ❌ ${vendorsData.error}`);
    } else {
      const vendors = vendorsData.vendors || (Array.isArray(vendorsData) ? vendorsData : []);
      console.log(`  Vendors: ✅ ${vendors.length} vendors`);
      if (vendors.length > 0) {
        console.log(`  Sample vendors: ${vendors.slice(0, 5).map((v: any) => v.vendorName || v.name).join(', ')}`);
      }
    }

    // Orders (invoices) — last 30 days
    const endDate = "2026-03-05";
    const startDate = "2026-02-03";
    const ordersData = await meGet(`/orders?restaurantUnitId=${unit.meId}&startDate=${startDate}&endDate=${endDate}`);
    if (ordersData.error) {
      console.log(`  Orders: ❌ ${ordersData.error}`);
    } else {
      const orders = ordersData.orders || ordersData.data || (Array.isArray(ordersData) ? ordersData : []);
      console.log(`  Orders (${startDate} to ${endDate}): ✅ ${orders.length} invoices`);
      
      // Calculate total spend
      let totalSpend = 0;
      const vendorSpend: Record<string, number> = {};
      for (const o of orders) {
        const total = Number(o.orderTotal) || 0;
        const vendor = o.vendorName || 'Unknown';
        totalSpend += total;
        vendorSpend[vendor] = (vendorSpend[vendor] || 0) + total;
      }
      console.log(`  Total spend: $${totalSpend.toFixed(2)}`);
      
      // Top 5 vendors by spend
      const topVendors = Object.entries(vendorSpend)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
      console.log(`  Top vendors: ${topVendors.map(([v, s]) => `${v}: $${s.toFixed(2)}`).join(', ')}`);
    }

    // Categories
    const cats = await meGet(`/categories?restaurantUnitId=${unit.meId}`);
    if (cats.error) {
      console.log(`  Categories: ❌ ${cats.error}`);
    } else {
      const catList = cats.categories || (Array.isArray(cats) ? cats : []);
      console.log(`  Categories: ✅ ${catList.length}`);
    }

    console.log("");
  }

  console.log("=== END ===");
}

run();
