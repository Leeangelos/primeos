import { NextRequest, NextResponse } from "next/server";
import { getClientForRoute } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const supabase = await getClientForRoute();
  const brand = req.nextUrl.searchParams.get("brand") || "all";

  let query = supabase
    .from("merch_items")
    .select("*")
    .eq("active", true)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (brand && brand !== "all") query = query.eq("brand", brand);

  const { data, error } = await query;
  if (error) return NextResponse.json({ ok: false, error: error.message });
  return NextResponse.json({ ok: true, items: data ?? [] });
}
