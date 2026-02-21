import { NextRequest, NextResponse } from "next/server";
import { getClientForRoute } from "@/lib/supabase";

export async function GET() {
  const supabase = await getClientForRoute();
  const { data, error } = await supabase
    .from("inventory_items")
    .select("*")
    .eq("active", true)
    .order("category", { ascending: true })
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) return NextResponse.json({ ok: false, error: error.message });
  return NextResponse.json({ ok: true, items: data ?? [] });
}

export async function POST(req: NextRequest) {
  const supabase = await getClientForRoute();
  const body = await req.json();

  const { data, error } = await supabase
    .from("inventory_items")
    .insert({
      name: body.name,
      category: body.category || "other",
      default_unit: body.default_unit || "each",
      unit_cost: body.unit_cost || 0,
      par_level: body.par_level || null,
      sort_order: body.sort_order || 0,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ ok: false, error: error.message });
  return NextResponse.json({ ok: true, item: data });
}
