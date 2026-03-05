import { createClient } from "@supabase/supabase-js";

const FOODTEC_TOKEN = process.env.FOODTEC_API_TOKEN;
const ENTERPRISE_URL = "https://ambitionnlegacy.foodtecsolutions.com";

// Fetch raw TSV data from FoodTec ExportView
export async function fetchFoodTecView(view: string, day: string): Promise<Record<string, string>[]> {
  const url = `${ENTERPRISE_URL}/ExportView?view=${view}&day=${day}`;
  const res = await fetch(url, {
    headers: { "X-DATA-EXPORTS-TOKEN": FOODTEC_TOKEN! },
  });

  if (!res.ok) {
    throw new Error(`FoodTec ${view} view returned HTTP ${res.status}`);
  }

  const text = await res.text();
  const lines = text.trim().split("\n");
  if (lines.length < 2) return [];

  const headers = lines[0].split("\t").map((h) => h.trim().toLowerCase().replace(/\s+/g, ""));
  const rows = lines.slice(1).map((line) => {
    const cols = line.split("\t");
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = (cols[i] || "").trim();
    });
    return row;
  });

  return rows;
}

// Get store_id mapping from Supabase
export async function getStoreMap(): Promise<Record<string, string>> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Supabase environment variables are not set");
  }
  const supabase = createClient(url, key);
  const { data } = await supabase
    .from("foodtec_store_map")
    .select("foodtec_store_name, store_id");
  const map: Record<string, string> = {};
  (data || []).forEach((row: any) => {
    map[row.foodtec_store_name] = row.store_id;
  });
  return map;
}

// Format date for FoodTec API (mm/dd/yy)
export function formatFoodTecDate(date: Date): string {
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const y = String(date.getFullYear()).slice(-2);
  return `${m}/${d}/${y}`;
}

// Parse float safely
export function pf(val: string | undefined): number {
  if (!val) return 0;
  const n = parseFloat(val);
  return isFinite(n) ? n : 0;
}

// Parse int safely
export function pi(val: string | undefined): number {
  if (!val) return 0;
  const n = parseInt(val, 10);
  return isFinite(n) ? n : 0;
}

// Parse FoodTec date string to Date object
export function parseFoodTecTimestamp(val: string | undefined): Date | null {
  if (!val || val === "null") return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
}

// Calculate minutes between two FoodTec timestamps
export function minutesBetween(start: string | undefined, end: string | undefined): number | null {
  const s = parseFoodTecTimestamp(start);
  const e = parseFoodTecTimestamp(end);
  if (!s || !e) return null;
  const diff = (e.getTime() - s.getTime()) / 60000;
  return diff >= 0 && diff < 480 ? diff : null; // Cap at 8 hours to filter bad data
}

