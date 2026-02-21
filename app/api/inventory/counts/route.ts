import { NextRequest, NextResponse } from "next/server";
import { getClientForRoute } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const supabase = await getClientForRoute();
  const store = req.nextUrl.searchParams.get("store");

  let query = supabase
    .from("inventory_counts")
    .select("*")
    .order("count_date", { ascending: false })
    .limit(20);

  const { data, error } = await query;
  if (error) return NextResponse.json({ ok: false, error: error.message });
  return NextResponse.json({ ok: true, counts: data ?? [] });
}

export async function POST(req: NextRequest) {
  const supabase = await getClientForRoute();
  const body = await req.json();

  const items = body.items || [];
  const total_value = items.reduce((sum: number, i: any) => sum + ((Number(i.qty) || 0) * (Number(i.unit_cost) || 0)), 0);

  const { data, error } = await supabase
    .from("inventory_counts")
    .insert({
      location_id: body.location_id || null,
      count_date: body.count_date || new Date().toISOString().slice(0, 10),
      items,
      total_value: +total_value.toFixed(2),
      status: body.status || "completed",
      notes: body.notes || null,
      completed_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) return NextResponse.json({ ok: false, error: error.message });
  return NextResponse.json({ ok: true, count: data });
}
