import { NextRequest, NextResponse } from "next/server";
import { getClientForRoute } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { store, business_date } = body;

  if (!store || !business_date) {
    return NextResponse.json({ ok: false, error: "Missing store or business_date" });
  }

  const supabase = await getClientForRoute();
  const { data: storeRow } = await supabase
    .from("stores")
    .select("id")
    .eq("slug", store)
    .single();

  if (!storeRow) {
    return NextResponse.json({ ok: false, error: "Store not found" });
  }

  const now = new Date().toISOString();

  const { error } = await supabase
    .from("daily_kpis")
    .update({ acknowledged_at: now })
    .eq("store_id", storeRow.id)
    .eq("business_date", business_date);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message });
  }

  return NextResponse.json({ ok: true, acknowledged_at: now });
}
