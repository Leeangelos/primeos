import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(url, key);

async function seed() {
  // Clear existing
  await supabase.from("merch_items").delete().neq("id", "00000000-0000-0000-0000-000000000000");

  const items = [
    // LeeAngelo's Individual Items
    { name: "Classic Logo Tee", brand: "leeangelos", category: "apparel", price: 24.99, sizes: ["S", "M", "L", "XL", "2XL"], description: "Black tee with orange LeeAngelo's logo. Soft cotton blend.", sort_order: 10 },
    { name: "Staff Polo", brand: "leeangelos", category: "apparel", price: 34.99, sizes: ["S", "M", "L", "XL", "2XL"], description: "Black polo with embroidered orange logo. Professional front-of-house look.", sort_order: 11 },
    { name: "Kitchen Crew Tee", brand: "leeangelos", category: "apparel", price: 22.99, sizes: ["S", "M", "L", "XL", "2XL", "3XL"], description: "Moisture-wicking black tee. Built for the heat of the kitchen.", sort_order: 12 },
    { name: "Zip Hoodie", brand: "leeangelos", category: "apparel", price: 49.99, sizes: ["S", "M", "L", "XL", "2XL"], description: "Black zip hoodie with orange logo on chest and back.", sort_order: 13 },
    { name: "Snapback Hat", brand: "leeangelos", category: "apparel", price: 27.99, sizes: ["One Size"], description: "Black snapback with orange embroidered logo.", sort_order: 14 },
    { name: "Beanie", brand: "leeangelos", category: "apparel", price: 19.99, sizes: ["One Size"], description: "Black knit beanie with orange logo patch.", sort_order: 15 },
    { name: "Apron", brand: "leeangelos", category: "gear", price: 29.99, sizes: ["One Size"], description: "Heavy-duty black apron with orange logo. Adjustable neck strap.", sort_order: 16 },

    // LeeAngelo's Packages — Hormozi style
    { name: "The Starter", brand: "leeangelos", category: "package", price: 44.99, sizes: ["S", "M", "L", "XL", "2XL"], description: "INCLUDES: 2× Kitchen Crew Tees ($45.98 value). Perfect for your first week. You save $1.", sort_order: 1 },
    { name: "The Team Player", brand: "leeangelos", category: "package", price: 79.99, sizes: ["S", "M", "L", "XL", "2XL"], description: "MOST POPULAR · INCLUDES: 2× Classic Logo Tees + 1× Snapback Hat + 1× Apron ($107.96 value). Everything you need to rep the brand. You save $28.", sort_order: 2 },
    { name: "The All-In", brand: "leeangelos", category: "package", price: 139.99, sizes: ["S", "M", "L", "XL", "2XL"], description: "BEST VALUE · INCLUDES: 1× Zip Hoodie + 2× Classic Logo Tees + 1× Staff Polo + 1× Snapback Hat + 1× Beanie + 1× Apron ($212.93 value). The complete collection. You save $73.", sort_order: 3 },

    // Lindsey's Individual Items
    { name: "Classic Logo Tee", brand: "lindseys", category: "apparel", price: 24.99, sizes: ["S", "M", "L", "XL", "2XL"], description: "Black tee with Lindsey's Pizza logo. Soft cotton blend.", sort_order: 30 },
    { name: "Staff Polo", brand: "lindseys", category: "apparel", price: 34.99, sizes: ["S", "M", "L", "XL", "2XL"], description: "Black polo with embroidered Lindsey's logo.", sort_order: 31 },
    { name: "Kitchen Crew Tee", brand: "lindseys", category: "apparel", price: 22.99, sizes: ["S", "M", "L", "XL", "2XL", "3XL"], description: "Moisture-wicking black tee for the kitchen.", sort_order: 32 },
    { name: "Zip Hoodie", brand: "lindseys", category: "apparel", price: 49.99, sizes: ["S", "M", "L", "XL", "2XL"], description: "Black zip hoodie with Lindsey's logo on chest and back.", sort_order: 33 },
    { name: "Snapback Hat", brand: "lindseys", category: "apparel", price: 27.99, sizes: ["One Size"], description: "Black snapback with Lindsey's embroidered logo.", sort_order: 34 },
    { name: "Apron", brand: "lindseys", category: "gear", price: 29.99, sizes: ["One Size"], description: "Heavy-duty black apron with Lindsey's logo.", sort_order: 35 },

    // Lindsey's Packages — Hormozi style
    { name: "The Starter", brand: "lindseys", category: "package", price: 44.99, sizes: ["S", "M", "L", "XL", "2XL"], description: "INCLUDES: 2× Kitchen Crew Tees ($45.98 value). Perfect for your first week. You save $1.", sort_order: 20 },
    { name: "The Team Player", brand: "lindseys", category: "package", price: 79.99, sizes: ["S", "M", "L", "XL", "2XL"], description: "MOST POPULAR · INCLUDES: 2× Classic Logo Tees + 1× Snapback Hat + 1× Apron ($107.96 value). Everything you need to rep the brand. You save $28.", sort_order: 21 },
    { name: "The All-In", brand: "lindseys", category: "package", price: 139.99, sizes: ["S", "M", "L", "XL", "2XL"], description: "BEST VALUE · INCLUDES: 1× Zip Hoodie + 2× Classic Logo Tees + 1× Staff Polo + 1× Snapback Hat + 1× Apron ($192.94 value). The complete collection. You save $53.", sort_order: 22 },
  ];

  for (const item of items) {
    const { error } = await supabase.from("merch_items").insert(item);
    if (error) {
      console.log("ERROR:", item.name, item.brand, error.message);
    } else {
      console.log("OK:", item.brand, item.category.toUpperCase(), item.name, `$${item.price}`);
    }
  }

  console.log(`\nDone. ${items.length} merch items seeded.`);
}

seed();
