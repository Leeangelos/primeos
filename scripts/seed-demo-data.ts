import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(url, key);

type DayData = {
  net_sales: number;
  labor_dollars: number;
  labor_hours: number;
  food_dollars: number;
  disposables_dollars: number;
  voids_dollars: number;
  waste_dollars: number;
  customers: number;
  scheduled_hours: number;
  bump_time_minutes: number;
};

function rand(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

function generateDay(dayOfWeek: number, store: "kent" | "aurora" | "lindseys"): DayData {
  // Base sales by day of week (Mon=1 ... Sun=7)
  const salesByDay: Record<number, [number, number]> = {
    1: [2800, 3600],  // Mon - slowest
    2: [3000, 3800],  // Tue
    3: [3200, 4000],  // Wed
    4: [3400, 4200],  // Thu
    5: [4800, 6200],  // Fri - busy
    6: [5200, 6800],  // Sat - busiest
    0: [3800, 5000],  // Sun
  };

  // Store multipliers
  const storeMultiplier = store === "kent" ? 1.0 : store === "aurora" ? 0.85 : 0.75;

  const [minSales, maxSales] = salesByDay[dayOfWeek] || [3500, 4500];
  const net_sales = rand(minSales * storeMultiplier, maxSales * storeMultiplier);

  // Labor: Kent/Aurora target 19-21%, Lindsey's target 22-25%
  const laborPctTarget = store === "lindseys" ? rand(21, 26) : rand(18, 23);
  const labor_dollars = rand(net_sales * laborPctTarget / 100 * 0.95, net_sales * laborPctTarget / 100 * 1.05);

  // Labor hours: ~$14-16/hr average
  const avgWage = store === "lindseys" ? rand(13, 15) : rand(14, 16);
  const labor_hours = rand(labor_dollars / avgWage * 0.95, labor_dollars / avgWage * 1.05);

  // Food: target 28-32%
  const foodPct = rand(27, 33);
  const food_dollars = rand(net_sales * foodPct / 100 * 0.97, net_sales * foodPct / 100 * 1.03);

  // Disposables: target 4-5%
  const dispPct = rand(3.5, 5.5);
  const disposables_dollars = rand(net_sales * dispPct / 100 * 0.95, net_sales * dispPct / 100 * 1.05);

  // Voids: target < 2%
  const voids_dollars = rand(net_sales * 0.005, net_sales * 0.025);

  // Waste: target < 1.5%
  const waste_dollars = rand(net_sales * 0.003, net_sales * 0.018);

  // Customers: avg ticket $18-26
  const avgTicket = rand(18, 26);
  const customers = Math.round(net_sales / avgTicket);

  // Scheduled hours: close to actual, sometimes over
  const scheduled_hours = rand(labor_hours * 0.95, labor_hours * 1.08);

  // Bump time: 8-14 min average
  const bump_time_minutes = rand(8, 14);

  return {
    net_sales: Math.round(net_sales * 100) / 100,
    labor_dollars: Math.round(labor_dollars * 100) / 100,
    labor_hours: Math.round(labor_hours * 10) / 10,
    food_dollars: Math.round(food_dollars * 100) / 100,
    disposables_dollars: Math.round(disposables_dollars * 100) / 100,
    voids_dollars: Math.round(voids_dollars * 100) / 100,
    waste_dollars: Math.round(waste_dollars * 100) / 100,
    customers,
    scheduled_hours: Math.round(scheduled_hours * 10) / 10,
    bump_time_minutes: Math.round(bump_time_minutes * 10) / 10,
  };
}

function getDateStr(date: Date): string {
  return date.toISOString().slice(0, 10);
}

async function seed() {
  console.log("Fetching store IDs...");
  const { data: stores, error: storesErr } = await supabase
    .from("stores")
    .select("id, slug")
    .in("slug", ["kent", "aurora", "lindseys"]);

  if (storesErr || !stores?.length) {
    console.error("Failed to fetch stores:", storesErr);
    return;
  }

  const storeMap = new Map<string, number>();
  for (const s of stores) {
    storeMap.set(s.slug, s.id);
  }
  console.log("Stores:", Object.fromEntries(storeMap));

  // Generate 60 days of data: Jan 22 - Feb 21, 2026
  const startDate = new Date("2026-01-22T12:00:00Z");
  const endDate = new Date("2026-02-21T12:00:00Z");
  const rows: Record<string, unknown>[] = [];

  for (const slug of ["kent", "aurora", "lindseys"] as const) {
    const storeId = storeMap.get(slug);
    if (!storeId) {
      console.error(`Store ${slug} not found`);
      continue;
    }

    const current = new Date(startDate);
    while (current <= endDate) {
      const dayOfWeek = current.getUTCDay();
      const data = generateDay(dayOfWeek, slug);

      rows.push({
        store_id: storeId,
        business_date: getDateStr(current),
        ...data,
        notes: null,
      });

      current.setUTCDate(current.getUTCDate() + 1);
    }
  }

  console.log(`Upserting ${rows.length} rows...`);

  // Upsert in batches of 50
  for (let i = 0; i < rows.length; i += 50) {
    const batch = rows.slice(i, i + 50);
    const { error } = await supabase
      .from("daily_kpis")
      .upsert(batch, { onConflict: "store_id,business_date" });

    if (error) {
      console.error(`Batch ${i / 50 + 1} failed:`, error);
      return;
    }
    console.log(`  Batch ${Math.floor(i / 50) + 1}/${Math.ceil(rows.length / 50)} done`);
  }

  console.log("Done! Seeded 60 days × 3 stores = ~180 rows of demo data.");
  console.log("Date range: Jan 22 - Feb 21, 2026");

  // Add some intentional bad days for demo storytelling
  const badDays = [
    // Kent had a rough Wednesday — food cost spiked (vendor sub)
    {
      store_id: storeMap.get("kent")!,
      business_date: "2026-02-19",
      net_sales: 4200,
      labor_dollars: 870,
      labor_hours: 58,
      food_dollars: 1554, // 37% - way over
      disposables_dollars: 210,
      voids_dollars: 42,
      waste_dollars: 84,
      customers: 185,
      scheduled_hours: 56,
      bump_time_minutes: 11.2,
      notes: "Vendor subbed mozzarella — price up $0.40/lb",
    },
    // Aurora labor ran hot on Tuesday — extra closer scheduled
    {
      store_id: storeMap.get("aurora")!,
      business_date: "2026-02-18",
      net_sales: 3100,
      labor_dollars: 806, // 26% - way over
      labor_hours: 54,
      food_dollars: 930,
      disposables_dollars: 155,
      voids_dollars: 31,
      waste_dollars: 47,
      customers: 142,
      scheduled_hours: 48,
      bump_time_minutes: 13.5,
      notes: "Greg scheduled extra closer — not needed",
    },
    // Lindsey's food trending up 3 days — portioning issue
    {
      store_id: storeMap.get("lindseys")!,
      business_date: "2026-02-19",
      net_sales: 2900,
      labor_dollars: 696,
      labor_hours: 48,
      food_dollars: 1015, // 35% - high
      disposables_dollars: 145,
      voids_dollars: 29,
      waste_dollars: 58,
      customers: 128,
      scheduled_hours: 46,
      bump_time_minutes: 12.8,
      notes: null,
    },
    {
      store_id: storeMap.get("lindseys")!,
      business_date: "2026-02-20",
      net_sales: 3400,
      labor_dollars: 782,
      labor_hours: 52,
      food_dollars: 1224, // 36% - high again
      disposables_dollars: 170,
      voids_dollars: 34,
      waste_dollars: 68,
      customers: 148,
      scheduled_hours: 50,
      bump_time_minutes: 11.5,
      notes: null,
    },
    {
      store_id: storeMap.get("lindseys")!,
      business_date: "2026-02-21",
      net_sales: 3600,
      labor_dollars: 828,
      labor_hours: 55,
      food_dollars: 1332, // 37% - third day in a row
      disposables_dollars: 180,
      voids_dollars: 36,
      waste_dollars: 72,
      customers: 155,
      scheduled_hours: 53,
      bump_time_minutes: 10.9,
      notes: "Check 16-inch specialty portioning",
    },
  ];

  const { error: badErr } = await supabase
    .from("daily_kpis")
    .upsert(badDays, { onConflict: "store_id,business_date" });

  if (badErr) {
    console.error("Bad days upsert failed:", badErr);
  } else {
    console.log("Injected storytelling days (vendor sub, extra closer, portioning trend).");
  }
}

seed().catch(console.error);
