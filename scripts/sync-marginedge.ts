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

async function meGetAll(endpoint: string) {
  let allItems: any[] = [];
  let url = endpoint;
  
  while (url) {
    const data = await meGet(url);
    if (!data) break;
    
    // Products come in a wrapper with nextPage
    const items = data.products || data.items || data.categories || data.vendors || [];
    if (Array.isArray(items)) {
      allItems = allItems.concat(items);
    }
    
    // Handle pagination
    if (data.nextPage) {
      url = `/products?restaurantUnitId=${url.match(/restaurantUnitId=(\d+)/)?.[1]}&page=${data.nextPage}`;
    } else {
      break;
    }
  }
  
  return allItems;
}

function mapCategory(meCategories: any[]): string {
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
}

async function main() {
  console.log("=== SYNCING MARGIN EDGE → PRIMEOS ===\n");

  // Clear existing generic inventory items
  console.log("Clearing generic seed data...");
  const { error: delError } = await supabase.from("inventory_items").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  if (delError) console.log("Delete error:", delError.message);

  let totalSynced = 0;
  let totalVendors = 0;

  for (const unit of UNITS) {
    console.log(`\n--- ${unit.name} ---`);

    // Pull all products
    const products = await meGetAll(`/products?restaurantUnitId=${unit.meId}`);
    console.log(`Found ${products.length} products in Margin Edge`);

    let sortOrder = 0;
    for (const p of products) {
      const name = p.productName || p.name || "Unknown";
      const price = p.latestPrice || p.price || p.unitPrice || 0;
      const reportUnit = p.reportByUnit || p.unit || "each";
      const category = mapCategory(p.categories || []);

      const { error } = await supabase.from("inventory_items").insert({
        name: `${name}`,
        category,
        default_unit: reportUnit,
        unit_cost: price,
        sort_order: sortOrder++,
        active: true,
      });

      if (error) {
        console.log(`  ERROR: ${name} - ${error.message}`);
      }
    }

    console.log(`Synced ${products.length} products as inventory items`);
    totalSynced += products.length;

    // Pull vendors and sync to trusted contacts
    const vendorsData = await meGet(`/vendors?restaurantUnitId=${unit.meId}`);
    const vendors = vendorsData?.vendors || (Array.isArray(vendorsData) ? vendorsData : []);
    console.log(`Found ${vendors.length} vendors`);

    for (const v of vendors) {
      const vendorName = v.vendorName || v.name || "Unknown";
      const accounts = v.vendorAccounts || [];
      const accountNum = accounts.length > 0 ? accounts[0].vendorAccountNumber : null;

      // Check if already exists in trusted_contacts
      const { data: existing } = await supabase
        .from("trusted_contacts")
        .select("id")
        .eq("name", vendorName)
        .eq("category", "vendor")
        .limit(1);

      if (!existing || existing.length === 0) {
        await supabase.from("trusted_contacts").insert({
          name: vendorName,
          category: "vendor",
          account_number: accountNum,
          notes: `Synced from Margin Edge (${unit.name})`,
        });
        totalVendors++;
      }
    }

    console.log(`Synced ${vendors.length} vendors to Trusted Contacts`);
  }

  console.log(`\n=== SYNC COMPLETE ===`);
  console.log(`${totalSynced} inventory items synced`);
  console.log(`${totalVendors} new vendors added to Trusted Contacts`);
}

main();
