/**
 * Seed 30 days of realistic daily_kpis test data for kent, aurora, lindseys.
 * Date range: 2026-01-18 through 2026-02-16.
 * Uses upsert (ON CONFLICT store_id, business_date DO UPDATE) — does not delete existing data.
 *
 * Run from project root:
 *   npx tsx scripts/seed-daily-kpis.ts
 * Or with env from .env.local:
 *   node --env-file=.env.local -e "require('tsx/cjs').register(); require('./scripts/seed-daily-kpis.ts')"
 *
 * Requires: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY (or SUPABASE_SERVICE_ROLE_KEY for write).
 */

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error("Missing env: NEXT_PUBLIC_SUPABASE_URL and (SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY)");
  process.exit(1);
}

const supabase = createClient(url, key);

type Slug = "kent" | "aurora" | "lindseys";

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

/** Day of week 0=Sun, 5=Fri, 6=Sat */
function getDayOfWeek(dateStr: string): number {
  const d = new Date(dateStr + "T12:00:00Z");
  return d.getUTCDay();
}

function isWeekend(dateStr: string): boolean {
  const day = getDayOfWeek(dateStr);
  return day === 5 || day === 6; // Fri, Sat
}

const NOTE_OPTIONS = [null, null, null, null, null, "Short staffed", "Catering order", "Busy lunch"];
function pickNote(): string | null {
  return NOTE_OPTIONS[Math.floor(Math.random() * NOTE_OPTIONS.length)];
}

interface StoreRow {
  id: string;
  slug: string;
}

interface KentRow {
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
  notes: string | null;
}

function genKent(dateStr: string): KentRow {
  const weekend = isWeekend(dateStr);
  const netSales = weekend ? rand(7500, 10000) : rand(6000, 9000);
  const laborHours = rand(55, 95);
  const laborDollars = weekend ? rand(1400, 1900) : rand(1100, 1900);
  const foodDollars = rand(1200, 2000);
  const disposablesDollars = rand(200, 400);
  const voidsDollars = rand(10, 80);
  const wasteDollars = rand(20, 100);
  const customers = weekend ? rand(200, 300) : rand(150, 300);
  const scheduledHours = laborHours + rand(-5, 5);
  const bumpTime = rand(3.5, 7.0);
  return {
    net_sales: round2(netSales),
    labor_dollars: round2(laborDollars),
    labor_hours: round1(laborHours),
    food_dollars: round2(foodDollars),
    disposables_dollars: round2(disposablesDollars),
    voids_dollars: round2(voidsDollars),
    waste_dollars: round2(wasteDollars),
    customers: Math.round(customers),
    scheduled_hours: round1(Math.max(50, Math.min(90, scheduledHours))),
    bump_time_minutes: round1(bumpTime),
    notes: pickNote(),
  };
}

function genAurora(dateStr: string): KentRow {
  const weekend = isWeekend(dateStr);
  const netSales = weekend ? rand(8500, 11000) : rand(7000, 10000);
  const laborHours = rand(60, 98);
  const laborDollars = weekend ? rand(1500, 2000) : rand(1200, 1900);
  const foodDollars = rand(1400, 2200);
  const disposablesDollars = rand(220, 420);
  const voidsDollars = rand(15, 85);
  const wasteDollars = rand(25, 105);
  const customers = weekend ? rand(220, 350) : rand(180, 350);
  const scheduledHours = laborHours + rand(-5, 5);
  const bumpTime = rand(3.5, 7.0);
  return {
    net_sales: round2(netSales),
    labor_dollars: round2(laborDollars),
    labor_hours: round1(laborHours),
    food_dollars: round2(foodDollars),
    disposables_dollars: round2(disposablesDollars),
    voids_dollars: round2(voidsDollars),
    waste_dollars: round2(wasteDollars),
    customers: Math.round(customers),
    scheduled_hours: round1(Math.max(55, Math.min(95, scheduledHours))),
    bump_time_minutes: round1(bumpTime),
    notes: pickNote(),
  };
}

function genLindseys(dateStr: string): KentRow {
  const weekend = isWeekend(dateStr);
  const netSales = weekend ? rand(5000, 7000) : rand(4000, 6500);
  const laborHours = rand(40, 75);
  const laborDollars = weekend ? rand(1100, 1500) : rand(900, 1500);
  const foodDollars = rand(800, 1400);
  const disposablesDollars = rand(150, 300);
  const voidsDollars = rand(5, 60);
  const wasteDollars = rand(15, 80);
  const customers = weekend ? rand(130, 200) : rand(100, 200);
  const scheduledHours = laborHours + rand(-4, 4);
  const bumpTime = rand(4.0, 8.0);
  return {
    net_sales: round2(netSales),
    labor_dollars: round2(laborDollars),
    labor_hours: round1(laborHours),
    food_dollars: round2(foodDollars),
    disposables_dollars: round2(disposablesDollars),
    voids_dollars: round2(voidsDollars),
    waste_dollars: round2(wasteDollars),
    customers: Math.round(customers),
    scheduled_hours: round1(Math.max(38, Math.min(70, scheduledHours))),
    bump_time_minutes: round1(bumpTime),
    notes: pickNote(),
  };
}

function genRow(slug: Slug, dateStr: string): KentRow {
  switch (slug) {
    case "kent":
      return genKent(dateStr);
    case "aurora":
      return genAurora(dateStr);
    case "lindseys":
      return genLindseys(dateStr);
  }
}

function datesBetween(start: string, end: string): string[] {
  const out: string[] = [];
  const d = new Date(start + "T12:00:00Z");
  const endDate = new Date(end + "T12:00:00Z");
  while (d <= endDate) {
    out.push(d.toISOString().slice(0, 10));
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return out;
}

async function main() {
  const { data: stores, error: storesErr } = await supabase
    .from("stores")
    .select("id, slug")
    .in("slug", ["kent", "aurora", "lindseys"]);

  if (storesErr) {
    console.error("Stores fetch error:", storesErr.message);
    process.exit(1);
  }
  if (!stores?.length) {
    console.error("No stores found for kent, aurora, lindseys");
    process.exit(1);
  }

  const storeById = new Map<string, StoreRow>();
  for (const s of stores as StoreRow[]) {
    storeById.set(s.slug, s);
  }

  const dateRange = datesBetween("2026-01-18", "2026-02-16");
  const rows: Record<string, unknown>[] = [];

  for (const dateStr of dateRange) {
    for (const slug of ["kent", "aurora", "lindseys"] as Slug[]) {
      const store = storeById.get(slug);
      if (!store) continue;
      const g = genRow(slug, dateStr);
      rows.push({
        store_id: store.id,
        business_date: dateStr,
        net_sales: g.net_sales,
        labor_dollars: g.labor_dollars,
        labor_hours: g.labor_hours,
        food_dollars: g.food_dollars,
        disposables_dollars: g.disposables_dollars,
        voids_dollars: g.voids_dollars,
        waste_dollars: g.waste_dollars,
        customers: g.customers,
        scheduled_hours: g.scheduled_hours,
        bump_time_minutes: g.bump_time_minutes,
        notes: g.notes,
      });
    }
  }

  const { data, error } = await supabase
    .from("daily_kpis")
    .upsert(rows, { onConflict: "store_id,business_date" })
    .select("id");

  if (error) {
    console.error("Upsert error:", error.message);
    process.exit(1);
  }

  console.log(`Upserted ${data?.length ?? rows.length} rows (${storeById.size} stores × ${dateRange.length} days).`);
}

main();
