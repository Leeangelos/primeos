const API_KEY = process.env.MARGINEDGE_API_KEY;
const BASE = "https://api.marginedge.com/public";

const UNITS = [
  { meId: 375258487, name: "LeeAngelo's Aurora" },
  { meId: 559563420, name: "LeeAngelo's Kent" },
  { meId: 778992713, name: "Lindsey's Pizza" },
];

async function meGet(endpoint: string) {
  const url = `${BASE}${endpoint}`;
  const res = await fetch(url, {
    headers: { "X-Api-Key": API_KEY!, "Accept": "application/json" },
  });
  if (!res.ok) {
    console.log(`ERROR ${res.status} ${url}: ${(await res.text()).slice(0, 300)}`);
    return null;
  }
  return res.json();
}

async function main() {
  console.log("=== FULL MARGIN EDGE DATA PULL ===\n");

  for (const unit of UNITS) {
    console.log(`\n========== ${unit.name} (${unit.meId}) ==========\n`);

    // Products
    console.log("--- PRODUCTS ---");
    const products = await meGet(`/products?restaurantUnitId=${unit.meId}`);
    if (products) {
      const list = Array.isArray(products) ? products : products.data || products.products || products.items || Object.values(products)[0] || [];
      const arr = Array.isArray(list) ? list : [];
      console.log(`Found ${arr.length} products`);
      for (const p of arr.slice(0, 8)) {
        console.log(JSON.stringify(p));
      }
      if (arr.length > 8) console.log(`... and ${arr.length - 8} more`);
      if (arr.length === 0) {
        console.log("Raw response:", JSON.stringify(products).slice(0, 1000));
      }
    }

    // Categories
    console.log("\n--- CATEGORIES ---");
    const cats = await meGet(`/categories?restaurantUnitId=${unit.meId}`);
    if (cats) {
      console.log(JSON.stringify(cats).slice(0, 1500));
    }

    // Vendors
    console.log("\n--- VENDORS ---");
    const vendors = await meGet(`/vendors?restaurantUnitId=${unit.meId}`);
    if (vendors) {
      const list = Array.isArray(vendors) ? vendors : vendors.data || vendors.vendors || Object.values(vendors)[0] || [];
      const arr = Array.isArray(list) ? list : [];
      console.log(`Found ${arr.length} vendors`);
      for (const v of arr.slice(0, 5)) {
        console.log(JSON.stringify(v));
      }
    }
  }
}

main();
export {};
