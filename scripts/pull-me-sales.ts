const API_KEY = process.env.MARGINEDGE_API_KEY!;
const BASE = "https://api.marginedge.com/public";

const UNITS = [
  { meId: 375258487, name: "LeeAngelo's Aurora" },
  { meId: 559563420, name: "LeeAngelo's Kent" },
  { meId: 778992713, name: "Lindsey's Pizza" },
];

async function meGet(endpoint: string) {
  const url = `${BASE}${endpoint}`;
  const res = await fetch(url, {
    headers: { "X-Api-Key": API_KEY, "Accept": "application/json" },
  });
  if (!res.ok) {
    console.log(`ERROR ${res.status} ${url}: ${(await res.text()).slice(0, 300)}`);
    return null;
  }
  return res.json();
}

async function main() {
  console.log("=== EXPLORING MARGIN EDGE SALES DATA ===\n");

  // Try orders endpoint for recent dates
  const startDate = "2026-02-01";
  const endDate = "2026-02-21";

  for (const unit of UNITS) {
    console.log(`\n========== ${unit.name} (${unit.meId}) ==========\n`);

    // Try orders
    console.log("--- ORDERS ---");
    const orders = await meGet(`/orders?restaurantUnitId=${unit.meId}&startDate=${startDate}&endDate=${endDate}`);
    if (orders) {
      const list = orders.orders || orders.data || orders.items || (Array.isArray(orders) ? orders : []);
      console.log(`Found ${Array.isArray(list) ? list.length : "?"} orders`);
      if (Array.isArray(list) && list.length > 0) {
        // Show first 3 in detail
        for (const o of list.slice(0, 3)) {
          console.log(JSON.stringify(o).slice(0, 500));
          console.log("---");
        }
      } else {
        console.log("Raw:", JSON.stringify(orders).slice(0, 1000));
      }
    }

    // Try other possible endpoints for sales
    console.log("\n--- TRYING SALES ENDPOINTS ---");
    for (const ep of [
      `/sales?restaurantUnitId=${unit.meId}&startDate=${startDate}&endDate=${endDate}`,
      `/dailySales?restaurantUnitId=${unit.meId}&startDate=${startDate}&endDate=${endDate}`,
      `/salesSummary?restaurantUnitId=${unit.meId}&startDate=${startDate}&endDate=${endDate}`,
      `/reports/sales?restaurantUnitId=${unit.meId}&startDate=${startDate}&endDate=${endDate}`,
    ]) {
      const data = await meGet(ep);
      if (data) {
        console.log(`FOUND: ${ep}`);
        console.log(JSON.stringify(data).slice(0, 1000));
      }
    }

    // Only do first unit to save time
    break;
  }
}

main();
export {};
