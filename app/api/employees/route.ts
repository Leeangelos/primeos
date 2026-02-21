import { NextRequest, NextResponse } from "next/server";
import { getClientForRoute } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const supabase = await getClientForRoute();
  const store = req.nextUrl.searchParams.get("store");
  const status = req.nextUrl.searchParams.get("status") || "all";

  let query = supabase
    .from("employees")
    .select("*")
    .order("name", { ascending: true });

  if (store && store !== "all") {
    const { data: storeData } = await supabase.from("stores").select("id").eq("slug", store).single();
    if (storeData) query = query.eq("store_id", storeData.id);
  }
  if (status && status !== "all") query = query.eq("status", status);

  const { data, error } = await query;
  if (error) return NextResponse.json({ ok: false, error: error.message });
  return NextResponse.json({ ok: true, employees: data ?? [] });
}

export async function POST(req: NextRequest) {
  const supabase = await getClientForRoute();
  const body = await req.json();

  const { data, error } = await supabase
    .from("employees")
    .insert({
      store_id: body.store_id,
      name: body.name,
      role: body.role || "team",
      pay_rate: body.pay_rate || null,
      hire_date: body.hire_date || null,
      exit_date: body.exit_date || null,
      exit_reason: body.exit_reason || null,
      source: body.source || null,
      status: body.status || "active",
      notes: body.notes || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ ok: false, error: error.message });
  return NextResponse.json({ ok: true, employee: data });
}

export async function PUT(req: NextRequest) {
  const supabase = await getClientForRoute();
  const body = await req.json();
  const { id, ...updates } = body;
  if (!id) return NextResponse.json({ ok: false, error: "Missing id" });

  const { data, error } = await supabase
    .from("employees")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ ok: false, error: error.message });
  return NextResponse.json({ ok: true, employee: data });
}

export async function DELETE(req: NextRequest) {
  const supabase = await getClientForRoute();
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ ok: false, error: "Missing id" });

  const { error } = await supabase.from("employees").delete().eq("id", id);
  if (error) return NextResponse.json({ ok: false, error: error.message });
  return NextResponse.json({ ok: true });
}
