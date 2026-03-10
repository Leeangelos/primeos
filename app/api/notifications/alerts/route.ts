import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { COCKPIT_STORE_SLUGS, COCKPIT_TARGETS, type CockpitStoreSlug } from "@/lib/cockpit-config";
import { getRollingFoodCostWins } from "@/src/lib/win-notifications";

export const dynamic = "force-dynamic";

const STORE_IDS = {
  kent: "7cd4cb61-7e90-44f5-8739-5f19074262b8",
  aurora: "906e5dfb-6199-4460-936d-fc1e783e4574",
  lindseys: "3fb37b49-cfe7-4a9f-9940-a472b5def680",
} as const;

const STORE_NAMES = {
  kent: "LeeAngelo's Kent",
  aurora: "LeeAngelo's Aurora",
  lindseys: "Lindsey's Pizza",
} as const;

export type AlertItem = {
  id: string;
  store_id: string;
  store_name: string;
  type: "red_kpi" | "vendor_increase" | "invoice_alert" | "google_rating_below_market";
  title: string;
  message: string;
  link: string;
  icon_color: string;
  created_at: string;
};

export type WinItem = {
  id: string;
  store_id: string;
  store_name: string;
  title: string;
  message: string;
  link: string;
  created_at: string;
};

function formatDollars(n: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}
function formatPct(n: number): string {
  return `${Math.round(n * 10) / 10}%`;
}

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: storesRows } = await supabase
      .from("stores")
      .select("id, slug")
      .in("slug", COCKPIT_STORE_SLUGS);
    const stores = (storesRows ?? []).filter((r) => r.slug != null) as { id: string; slug: string }[];
    const storeIds = stores.map((s) => s.id);
    const slugById = new Map(stores.map((s) => [s.id, s.slug]));
    const idBySlug = new Map(stores.map((s) => [s.slug, s.id]));
    const nameBySlug = (slug: string) => COCKPIT_TARGETS[slug as CockpitStoreSlug]?.name ?? slug;

    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyStart = thirtyDaysAgo.toISOString().slice(0, 10);
    const sixtyDaysAgo = new Date(now);
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
    const sixtyStart = sixtyDaysAgo.toISOString().slice(0, 10);

    const alerts: AlertItem[] = [];
    const wins: WinItem[] = [];
    const foodCostPctBySlug = new Map<string, number>();
    let alertSeq = 0;

    if (storeIds.length > 0) {
      const [purchasesRes, salesRes, invoicesRes, productsRes] = await Promise.all([
        supabase
          .from("me_daily_purchases")
          .select("store_id, business_day, food_spend")
          .in("store_id", storeIds)
          .gte("business_day", thirtyStart)
          .lte("business_day", today)
          .order("business_day", { ascending: true }),
        supabase
          .from("foodtec_daily_sales")
          .select("store_id, business_day, net_sales")
          .in("store_id", storeIds)
          .gte("business_day", thirtyStart)
          .lte("business_day", today)
          .order("business_day", { ascending: true }),
        supabase
          .from("me_invoices")
          .select("store_id, invoice_date, total")
          .in("store_id", storeIds)
          .ilike("vendor_name", "%Hillcrest%")
          .gte("invoice_date", sixtyStart)
          .lte("invoice_date", today),
        supabase
          .from("me_products")
          .select("store_id, product_name, latest_price, previous_latest_price")
          .in("store_id", storeIds),
      ]);

      const purchases = purchasesRes.data ?? [];
      const sales = salesRes.data ?? [];
      const invoices = invoicesRes.data ?? [];
      const products = productsRes.data ?? [];

      for (const storeId of storeIds) {
        const slug = slugById.get(storeId) ?? "";
        const storeName = nameBySlug(slug);

        const storePurchases = purchases.filter((r) => r.store_id === storeId);
        const storeSales = sales.filter((r) => r.store_id === storeId);
        const totalFood = storePurchases.reduce((s, r) => s + (Number(r.food_spend) || 0), 0);
        const totalNetSales = storeSales.reduce((s, r) => s + (Number(r.net_sales) || 0), 0);
        const foodCostPct = totalNetSales > 0 ? (totalFood / totalNetSales) * 100 : null;
        if (foodCostPct != null && foodCostPct > 32) {
          const targetSpend = totalNetSales * 0.32;
          const aboveDollars = totalFood - targetSpend;
          alerts.push({
            id: `alert-${++alertSeq}-food`,
            store_id: storeId,
            store_name: storeName,
            type: "red_kpi",
            title: `Food Cost Above Benchmark — ${storeName}`,
            message: `Food cost is ${formatPct(foodCostPct)} vs 28-32% industry benchmark. That's ${formatDollars(aboveDollars)} above target.`,
            link: "/food-cost-analysis",
            icon_color: "text-red-400",
            created_at: now.toISOString(),
          });
        } else if (foodCostPct != null && foodCostPct < 32 && totalNetSales > 0) {
          foodCostPctBySlug.set(slug, foodCostPct);
        }

        const storeInvoices = invoices.filter((r) => r.store_id === storeId);
        const last30 = storeInvoices.filter((r) => r.invoice_date >= thirtyStart);
        const prior30 = storeInvoices.filter((r) => r.invoice_date >= sixtyStart && r.invoice_date < thirtyStart);
        const sumLast30 = last30.reduce((s, r) => s + (Number(r.total) || 0), 0);
        const sumPrior30 = prior30.reduce((s, r) => s + (Number(r.total) || 0), 0);
        const priorEnoughForComparison = sumLast30 > 0 && sumPrior30 >= sumLast30 * 0.5;
        if (priorEnoughForComparison && sumLast30 > sumPrior30 * 1.05) {
          const pctUp = ((sumLast30 - sumPrior30) / sumPrior30) * 100;
          alerts.push({
            id: `alert-${++alertSeq}-hillcrest`,
            store_id: storeId,
            store_name: storeName,
            type: "vendor_increase",
            title: `Hillcrest Invoice Up ${formatPct(pctUp)} — ${storeName}`,
            message: `Invoice is ${formatDollars(sumLast30)} this period vs ${formatDollars(sumPrior30)} last period.`,
            link: "/vendor-tracker",
            icon_color: "text-red-400",
            created_at: now.toISOString(),
          });
        }

        const storeProducts = products.filter(
          (r) => r.store_id === storeId && (/(mozzarella|cheese)/i.test(String(r.product_name)))
        );
        for (const p of storeProducts) {
          const prev = p.previous_latest_price != null ? Number(p.previous_latest_price) : null;
          const curr = Number(p.latest_price) || 0;
          if (prev != null && prev > 0 && curr > prev * 1.03) {
            const pctUp = ((curr - prev) / prev) * 100;
            alerts.push({
              id: `alert-${++alertSeq}-cheese-${p.product_name}-${storeId}`,
              store_id: storeId,
              store_name: storeName,
              type: "invoice_alert",
              title: `Cheese Price Up ${formatPct(pctUp)} — ${storeName}`,
              message: `${String(p.product_name)}: ${formatDollars(prev)} → ${formatDollars(curr)}.`,
              link: "/invoices",
              icon_color: "text-red-400",
              created_at: now.toISOString(),
            });
            break;
          }
        }
      }

      // Google rating below market average — run for all three stores in parallel
      const googleRatingChecks = (["kent", "aurora", "lindseys"] as const).map(
        async (storeKey) => {
          const storeId = STORE_IDS[storeKey];
          const storeName = STORE_NAMES[storeKey];
          const [ownRes, competitorsRes] = await Promise.all([
            supabase
              .from("store_competitor_profiles")
              .select("google_rating, last_synced_at")
              .eq("store_id", storeId)
              .eq("is_own_store", true)
              .maybeSingle(),
            supabase
              .from("store_competitor_profiles")
              .select("google_rating")
              .eq("store_id", storeId)
              .eq("is_own_store", false),
          ]);
          const own = ownRes.data;
          const competitors = competitorsRes.data ?? [];
          if (!own?.last_synced_at || competitors.length === 0) return null;
          const ownRating = own.google_rating != null ? Number(own.google_rating) : null;
          const ratings = competitors
            .map((r) => (r.google_rating != null ? Number(r.google_rating) : null))
            .filter((r): r is number => r != null);
          if (ratings.length === 0 || ownRating == null) return null;
          const marketAvg = ratings.reduce((a, b) => a + b, 0) / ratings.length;
          if (ownRating >= marketAvg) return null;
          return { storeKey, storeId, storeName, ownRating, marketAvg };
        }
      );
      const googleResults = await Promise.all(googleRatingChecks);
      for (const r of googleResults) {
        if (!r) continue;
        alerts.push({
          id: `alert-${++alertSeq}-google-rating-${r.storeKey}`,
          store_id: r.storeId,
          store_name: r.storeName,
          type: "google_rating_below_market",
          title: `${r.storeName} Below Market Average`,
          message: `${r.storeName} is rated ${r.ownRating.toFixed(1)} vs market average ${r.marketAvg.toFixed(1)}. A Google review push could close this gap.`,
          link: "/inspection-radar",
          icon_color: "text-amber-400",
          created_at: now.toISOString(),
        });
      }

      const fetcher = async (storeSlug: string) => {
        const uuid = idBySlug.get(storeSlug);
        if (!uuid) return null;
        const foodSpend = purchases.filter((r) => r.store_id === uuid).reduce((s, r) => s + (Number(r.food_spend) || 0), 0);
        const totalSpend = sales.filter((r) => r.store_id === uuid).reduce((s, r) => s + (Number(r.net_sales) || 0), 0);
        return totalSpend > 0 ? { foodSpend, totalSpend } : null;
      };
      const winNotifications = await getRollingFoodCostWins(fetcher);
      for (const w of winNotifications) {
        const slug = w.id.replace("food_cost_within_target_", "");
        const storeId = idBySlug.get(slug);
        const storeName = nameBySlug(slug);
        const pct = storeId ? foodCostPctBySlug.get(slug) : null;
        if (storeId != null && pct != null) {
          wins.push({
            id: w.id,
            store_id: storeId,
            store_name: storeName,
            title: `Food Cost Within Target — ${storeName}`,
            message: `Food cost is running at ${formatPct(pct)} — within the 28-32% industry benchmark. Good work.`,
            link: "/food-cost-analysis",
            created_at: now.toISOString(),
          });
        }
      }
    }

    return NextResponse.json({ alerts, wins });
  } catch (err) {
    console.error("Alerts API error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Alerts failed" },
      { status: 500 }
    );
  }
}
