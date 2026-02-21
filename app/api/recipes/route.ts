import { NextRequest, NextResponse } from "next/server";
import { getClientForRoute } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const supabase = await getClientForRoute();
  const category = req.nextUrl.searchParams.get("category");

  let query = supabase
    .from("recipes")
    .select("*")
    .order("category", { ascending: true })
    .order("name", { ascending: true });

  if (category && category !== "all") query = query.eq("category", category);

  const { data, error } = await query;

  if (error) return NextResponse.json({ ok: false, error: error.message });
  return NextResponse.json({ ok: true, recipes: data ?? [] });
}

export async function POST(req: NextRequest) {
  const supabase = await getClientForRoute();
  const body = await req.json();
  const { name, category, size, ingredients, menu_price, notes } = body;

  if (!name) return NextResponse.json({ ok: false, error: "Name is required" });

  const items = ingredients || [];
  const theoretical_cost = items.reduce((sum: number, i: any) => sum + (Number(i.cost) || 0), 0);
  const price = Number(menu_price) || 0;
  const food_cost_pct = price > 0 ? +((theoretical_cost / price) * 100).toFixed(1) : 0;

  const { data, error } = await supabase
    .from("recipes")
    .insert({
      name,
      category: category || "pizza",
      size: size || null,
      ingredients: items,
      theoretical_cost,
      menu_price: price,
      food_cost_pct,
      notes: notes || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ ok: false, error: error.message });
  return NextResponse.json({ ok: true, recipe: data });
}

export async function PUT(req: NextRequest) {
  const supabase = await getClientForRoute();
  const body = await req.json();
  const { id, name, category, size, ingredients, menu_price, notes } = body;

  if (!id) return NextResponse.json({ ok: false, error: "Missing id" });

  const items = ingredients || [];
  const theoretical_cost = items.reduce((sum: number, i: any) => sum + (Number(i.cost) || 0), 0);
  const price = Number(menu_price) || 0;
  const food_cost_pct = price > 0 ? +((theoretical_cost / price) * 100).toFixed(1) : 0;

  const { data, error } = await supabase
    .from("recipes")
    .update({
      name,
      category: category || "pizza",
      size: size || null,
      ingredients: items,
      theoretical_cost,
      menu_price: price,
      food_cost_pct,
      notes: notes || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ ok: false, error: error.message });
  return NextResponse.json({ ok: true, recipe: data });
}

export async function DELETE(req: NextRequest) {
  const supabase = await getClientForRoute();
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ ok: false, error: "Missing id" });

  const { error } = await supabase.from("recipes").delete().eq("id", id);
  if (error) return NextResponse.json({ ok: false, error: error.message });
  return NextResponse.json({ ok: true });
}
