import { createClient } from "@supabase/supabase-js";

const API_KEY = process.env.MARGINEDGE_API_KEY;
const BASE = "https://api.marginedge.com/public";

export async function fetchME(endpoint: string): Promise<any> {
  if (!API_KEY) throw new Error("Missing MARGINEDGE_API_KEY");
  const res = await fetch(`${BASE}${endpoint}`, {
    headers: { "X-Api-Key": API_KEY, Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`MarginEdge ${endpoint} returned HTTP ${res.status}`);
  return res.json();
}

export interface MEStoreMap {
  meUnitId: number;
  storeName: string;
  storeId: string;
}

export async function getMEStoreMap(): Promise<MEStoreMap[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase environment variables are not set");
  const supabase = createClient(url, key);
  const { data } = await supabase.from("me_store_map").select("me_unit_id, me_store_name, store_id");
  return (data || []).map((r: { me_unit_id: number; me_store_name: string; store_id: string }) => ({
    meUnitId: r.me_unit_id,
    storeName: r.me_store_name,
    storeId: r.store_id,
  }));
}
