import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getMEStoreMap } from "@/src/lib/marginedge";

const BASE = "https://api.marginedge.com/public";

async function fetchWithTimeout(endpoint: string, timeoutMs = 10000): Promise<any | null> {
  const apiKey = process.env.MARGINEDGE_API_KEY;
  if (!apiKey) throw new Error("Missing MARGINEDGE_API_KEY");

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${BASE}${endpoint}`, {
      headers: { "X-Api-Key": apiKey, Accept: "application/json" },
      signal: controller.signal,
    });
    if (!res.ok) {
      console.error("MarginEdge /products HTTP error", res.status, endpoint);
      return null;
    }
    return await res.json();
  } catch (err) {
    console.error("MarginEdge /products fetch failed", endpoint, err);
    return null;
  } finally {
    clearTimeout(id);
  }
}

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
      let page = 0;

      while (url && page < 20) {
        page += 1;
        const data = await fetchWithTimeout(url, 10000);
        if (!data) {
          console.log("No data returned for", url);
          break;
        }

        console.log("Raw /products response keys:", Object.keys(data || {}));

        const products = data.products || data.items || [];
        console.log(
          `Page ${page}: found ${Array.isArray(products) ? products.length : 0} products for unit ${unit.storeName}`,
          Array.isArray(products) && products.length > 0 ? products[0] : null
        );

        if (Array.isArray(products)) {
          for (const p of products) {
            const rawId = p.productId ?? p.id ?? p.itemId ?? null;
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

        if (data.nextPage && page < 20) {
          url = `/products?restaurantUnitId=${unit.meUnitId}&page=${data.nextPage}`;
        } else {
          url = null;
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
}

