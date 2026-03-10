import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getMEStoreMap } from "@/src/lib/marginedge";

const BASE = "https://api.marginedge.com/public";

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

export async function GET() {
  const work = (async () => {
    try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Supabase environment variables are not set");
    }
    const supabase = createClient(supabaseUrl, supabaseKey);

    const storeMap = await getMEStoreMap();
    const summary: { storeName: string; productsSynced: number }[] = [];

    for (const unit of storeMap) {
      console.log(`\n--- Products sync for ${unit.storeName} (ME ID: ${unit.meUnitId}) ---`);
      let url: string | null = `/products?restaurantUnitId=${unit.meUnitId}`;
      let productCount = 0;

      if (!url) continue;

      const apiKey = process.env.MARGINEDGE_API_KEY;
      if (!apiKey) throw new Error("Missing MARGINEDGE_API_KEY");

      const res = await fetch(`${BASE}${url}`, {
        headers: { "X-Api-Key": apiKey, Accept: "application/json" },
      });
      if (!res.ok) {
        console.error("MarginEdge /products HTTP error", res.status, url);
        continue;
      }
      const data = await res.json();

      console.log("Raw /products response keys:", Object.keys(data || {}));

      const products = data.products || data.items || [];
      console.log(
        `Page 1: found ${Array.isArray(products) ? products.length : 0} products for unit ${unit.storeName}`,
        Array.isArray(products) && products.length > 0 ? products[0] : null
      );

      if (Array.isArray(products)) {
        for (const p of products) {
          const rawId = p.companyConceptProductId ?? p.productId ?? p.id ?? p.itemId ?? null;
          const meProductId = rawId != null ? String(rawId) : "";
          const productName = p.productName || p.name || "Unknown";
          const latestPrice = Number(p.latestPrice || p.unitPrice || 0);
          const unitName = p.reportByUnit || p.unit || "each";
          const category = mapProductCategory(p.categories || []);

          const { error: upsertError } = await supabase.from("me_products").upsert(
            {
              store_id: unit.storeId,
              me_product_id: meProductId || null,
              product_name: productName,
              latest_price: latestPrice,
              unit: unitName,
              category,
              synced_at: new Date().toISOString(),
            },
            { onConflict: "store_id,product_name" }
          );

          if (upsertError) {
            console.error("me_products upsert error", {
              storeId: unit.storeId,
              meProductId,
              message: upsertError.message,
            });
          } else {
            productCount += 1;
          }
        }
      }

      console.log(`Synced ${productCount} products for ${unit.storeName}`);
      summary.push({ storeName: unit.storeName, productsSynced: productCount });
    }

      return NextResponse.json({
        success: true,
        summary,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("MarginEdge products sync error:", err);
      return NextResponse.json({ error: message }, { status: 500 });
    }
  })();

  const timeout = new Promise<Response>((_resolve, reject) => {
    setTimeout(() => {
      reject(new Error("MarginEdge products sync timed out"));
    }, 5000);
  });

  return Promise.race([work, timeout]);
}

