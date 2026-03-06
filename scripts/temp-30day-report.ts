/**
 * Temporary script: 30-day metrics per store (Feb 3 - Mar 4, 2026).
 * Run: npx tsx scripts/temp-30day-report.ts
 * Requires: .env.local with NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { resolve } from "path";

const cwd = process.cwd();
config({ path: resolve(cwd, ".env") });
config({ path: resolve(cwd, ".env.local") });

const url =
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  process.env.SUPABASE_URL;
const key =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.SUPABASE_ANON_KEY;
if (!url || !key) {
  const supabaseKeys = Object.keys(process.env).filter(
    (k) => k.includes("SUPABASE") || k.includes("SUPA") || k.toLowerCase().includes("supabase")
  );
  console.error("Missing Supabase URL and key. Expected one of: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_URL");
  console.error("Expected one of: SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_ANON_KEY");
  console.error("Supabase-related keys in env:", supabaseKeys.length ? supabaseKeys : "(none)");
  process.exit(1);
}

const supabase = createClient(url, key);

const START = "2026-02-03";
const END = "2026-03-04";

type Row = {
  total_revenue: number;
  day_count: number;
  avg_daily_sales: number;
  dine_in_revenue: number;
  pickup_revenue: number;
  delivery_revenue: number;
  doordash_revenue: number;
  total_labor_cost: number;
  total_hours: number;
  labor_pct: number;
  total_food_spend: number;
  total_paper_spend: number;
  food_cost_pct: number;
  disposables_pct: number;
  cogs_pct: number;
  splh: number;
};

async function getStoreIds(): Promise<{ id: string; name: string }[]> {
  const slugs = ["kent", "aurora", "lindseys"] as const;
  const names: Record<string, string> = { kent: "Kent", aurora: "Aurora", lindseys: "Lindsey's" };
  const out: { id: string; name: string }[] = [];
  for (const slug of slugs) {
    const { data } = await supabase.from("stores").select("id").eq("slug", slug).maybeSingle();
    if (data?.id) out.push({ id: data.id, name: names[slug] ?? slug });
  }
  return out;
}

async function getMetricsForStore(storeId: string): Promise<Row> {
  const [salesRes, laborRes, purchasesRes] = await Promise.all([
    supabase
      .from("foodtec_daily_sales")
      .select("net_sales, dine_in_sales, pickup_sales, delivery_sales, doordash_sales")
      .eq("store_id", storeId)
      .gte("business_day", START)
      .lte("business_day", END),
    supabase
      .from("foodtec_daily_labor")
      .select("total_labor_cost, total_overtime_cost, regular_hours, overtime_hours")
      .eq("store_id", storeId)
      .gte("business_day", START)
      .lte("business_day", END),
    supabase
      .from("me_daily_purchases")
      .select("food_spend, paper_spend")
      .eq("store_id", storeId)
      .gte("business_day", START)
      .lte("business_day", END),
  ]);

  const sales = salesRes.data ?? [];
  const labor = laborRes.data ?? [];
  const purchases = purchasesRes.data ?? [];

  const total_revenue = sales.reduce((s, r) => s + (Number(r.net_sales) || 0), 0);
  const day_count = sales.length || 1;
  const avg_daily_sales = total_revenue / day_count;
  const dine_in_revenue = sales.reduce((s, r) => s + (Number(r.dine_in_sales) || 0), 0);
  const pickup_revenue = sales.reduce((s, r) => s + (Number(r.pickup_sales) || 0), 0);
  const delivery_revenue = sales.reduce((s, r) => s + (Number(r.delivery_sales) || 0), 0);
  const doordash_revenue = sales.reduce((s, r) => s + (Number(r.doordash_sales) || 0), 0);

  const total_labor_cost = labor.reduce(
    (s, r) => s + (Number(r.total_labor_cost) || 0) + (Number(r.total_overtime_cost) || 0),
    0
  );
  const total_hours = labor.reduce(
    (s, r) => s + (Number(r.regular_hours) || 0) + (Number(r.overtime_hours) || 0),
    0
  );
  const labor_pct = total_revenue > 0 ? (total_labor_cost / total_revenue) * 100 : 0;

  const total_food_spend = purchases.reduce((s, r) => s + (Number(r.food_spend) || 0), 0);
  const total_paper_spend = purchases.reduce((s, r) => s + (Number(r.paper_spend) || 0), 0);
  const food_cost_pct = total_revenue > 0 ? (total_food_spend / total_revenue) * 100 : 0;
  const disposables_pct = total_revenue > 0 ? (total_paper_spend / total_revenue) * 100 : 0;
  const cogs_pct =
    total_revenue > 0
      ? ((total_food_spend + total_paper_spend + total_labor_cost) / total_revenue) * 100
      : 0;
  const splh = total_hours > 0 ? total_revenue / total_hours : 0;

  return {
    total_revenue,
    day_count,
    avg_daily_sales,
    dine_in_revenue,
    pickup_revenue,
    delivery_revenue,
    doordash_revenue,
    total_labor_cost,
    total_hours,
    labor_pct,
    total_food_spend,
    total_paper_spend,
    food_cost_pct,
    disposables_pct,
    cogs_pct,
    splh,
  };
}

function printRow(label: string, r: Row) {
  console.log(`\n${label}`);
  console.log("─".repeat(60));
  console.log(`  Total revenue:        $${r.total_revenue.toLocaleString("en-US", { maximumFractionDigits: 0 })}`);
  console.log(`  Day count:           ${r.day_count}`);
  console.log(`  Avg daily sales:     $${r.avg_daily_sales.toLocaleString("en-US", { maximumFractionDigits: 0 })}`);
  console.log(`  Dine-in revenue:     $${r.dine_in_revenue.toLocaleString("en-US", { maximumFractionDigits: 0 })}`);
  console.log(`  Pickup revenue:      $${r.pickup_revenue.toLocaleString("en-US", { maximumFractionDigits: 0 })}`);
  console.log(`  Delivery revenue:    $${r.delivery_revenue.toLocaleString("en-US", { maximumFractionDigits: 0 })}`);
  console.log(`  DoorDash revenue:    $${r.doordash_revenue.toLocaleString("en-US", { maximumFractionDigits: 0 })}`);
  console.log(`  Total labor cost:    $${r.total_labor_cost.toLocaleString("en-US", { maximumFractionDigits: 0 })}`);
  console.log(`  Total hours:         ${r.total_hours.toLocaleString("en-US", { maximumFractionDigits: 1 })}`);
  console.log(`  Labor %:             ${r.labor_pct.toFixed(1)}%`);
  console.log(`  Total food spend:    $${r.total_food_spend.toLocaleString("en-US", { maximumFractionDigits: 0 })}`);
  console.log(`  Total paper spend:   $${r.total_paper_spend.toLocaleString("en-US", { maximumFractionDigits: 0 })}`);
  console.log(`  Food cost %:        ${r.food_cost_pct.toFixed(1)}%`);
  console.log(`  Disposables %:      ${r.disposables_pct.toFixed(1)}%`);
  console.log(`  COGS %:             ${r.cogs_pct.toFixed(1)}%`);
  console.log(`  SPLH:               $${r.splh.toFixed(0)}`);
}

async function main() {
  const stores = await getStoreIds();
  if (stores.length === 0) {
    console.log("No stores found.");
    return;
  }

  console.log(`\n30-day report: ${START} to ${END}\n`);

  const allRows: Row[] = [];
  for (const store of stores) {
    const row = await getMetricsForStore(store.id);
    allRows.push(row);
    printRow(store.name.toUpperCase(), row);
  }

  const combined: Row = {
    total_revenue: allRows.reduce((s, r) => s + r.total_revenue, 0),
    day_count: allRows.reduce((s, r) => s + r.day_count, 0),
    avg_daily_sales: 0,
    dine_in_revenue: allRows.reduce((s, r) => s + r.dine_in_revenue, 0),
    pickup_revenue: allRows.reduce((s, r) => s + r.pickup_revenue, 0),
    delivery_revenue: allRows.reduce((s, r) => s + r.delivery_revenue, 0),
    doordash_revenue: allRows.reduce((s, r) => s + r.doordash_revenue, 0),
    total_labor_cost: allRows.reduce((s, r) => s + r.total_labor_cost, 0),
    total_hours: allRows.reduce((s, r) => s + r.total_hours, 0),
    labor_pct: 0,
    total_food_spend: allRows.reduce((s, r) => s + r.total_food_spend, 0),
    total_paper_spend: allRows.reduce((s, r) => s + r.total_paper_spend, 0),
    food_cost_pct: 0,
    disposables_pct: 0,
    cogs_pct: 0,
    splh: 0,
  };
  combined.avg_daily_sales = combined.total_revenue / (combined.day_count || 1);
  combined.labor_pct = combined.total_revenue > 0 ? (combined.total_labor_cost / combined.total_revenue) * 100 : 0;
  combined.food_cost_pct = combined.total_revenue > 0 ? (combined.total_food_spend / combined.total_revenue) * 100 : 0;
  combined.disposables_pct = combined.total_revenue > 0 ? (combined.total_paper_spend / combined.total_revenue) * 100 : 0;
  combined.cogs_pct =
    combined.total_revenue > 0
      ? ((combined.total_food_spend + combined.total_paper_spend + combined.total_labor_cost) / combined.total_revenue) * 100
      : 0;
  combined.splh = combined.total_hours > 0 ? combined.total_revenue / combined.total_hours : 0;

  printRow("ALL STORES COMBINED", combined);
  console.log("\n");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
