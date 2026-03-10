import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { COCKPIT_STORE_SLUGS, COCKPIT_TARGETS, type CockpitStoreSlug } from "@/lib/cockpit-config";

export const dynamic = "force-dynamic";

export type AlertItem = {
  id: string;
  store_id: string;
  store_name: string;
  type: "red_kpi" | "vendor_increase" | "invoice_alert";
  title: string;
  message: string;
  link: string;
  icon_color: string;
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
    const nameBySlug = (slug: string) => COCKPIT_TARGETS[slug as CockpitStoreSlug]?.name ?? slug;

    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenStart = sevenDaysAgo.toISOString().slice(0, 10);
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyStart = thirtyDaysAgo.toISOString().slice(0, 10);
    const sixtyDaysAgo = new Date(now);
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
    const sixtyStart = sixtyDaysAgo.toISOString().slice(0, 10);

    const alerts: AlertItem[] = [];
    let alertSeq = 0;

    if (storeIds.length > 0) {
      const [purchasesRes, salesRes, invoicesRes, productsRes] = await Promise.all([
        supabase
          .from("me_daily_purchases")
          .select("store_id, business_day, food_spend")
          .in("store_id", storeIds)
          .gte("business_day", sevenStart)
          .lte("business_day", today)
          .order("business_day", { ascending: true }),
        supabase
          .from("foodtec_daily_sales")
          .select("store_id, business_day, net_sales")
          .in("store_id", storeIds)
          .gte("business_day", sevenStart)
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
        }

        const storeInvoices = invoices.filter((r) => r.store_id === storeId);
        const last30 = storeInvoices.filter((r) => r.invoice_date >= thirtyStart);
        const prior30 = storeInvoices.filter((r) => r.invoice_date >= sixtyStart && r.invoice_date < thirtyStart);
        const sumLast30 = last30.reduce((s, r) => s + (Number(r.total) || 0), 0);
        const sumPrior30 = prior30.reduce((s, r) => s + (Number(r.total) || 0), 0);
        if (sumPrior30 > 0 && sumLast30 > sumPrior30 * 1.05) {
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
    }

    return NextResponse.json({ alerts });
  } catch (err) {
    console.error("Alerts API error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Alerts failed" },
      { status: 500 }
    );
  }
}
