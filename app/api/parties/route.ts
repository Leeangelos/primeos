import { NextRequest, NextResponse } from "next/server";
import { getClientForRoute } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const supabase = await getClientForRoute();
  const store = req.nextUrl.searchParams.get("store");
  const status = req.nextUrl.searchParams.get("status") || "all";

  let query = supabase
    .from("party_orders")
    .select("*")
    .order("party_date", { ascending: true });

  if (status && status !== "all") query = query.eq("status", status);

  if (store && store !== "all") {
    const { data: storeData } = await supabase.from("stores").select("id").eq("slug", store).single();
    if (storeData) query = query.eq("store_id", storeData.id);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ ok: false, error: error.message });
  return NextResponse.json({ ok: true, parties: data ?? [] });
}

export async function POST(req: NextRequest) {
  const supabase = await getClientForRoute();
  const body = await req.json();

  const items = body.items || [];
  const subtotal = items.reduce((s: number, i: any) => s + (Number(i.price) * Number(i.qty) || 0), 0);
  const tax = +(subtotal * 0.075).toFixed(2);
  const total = +(subtotal + tax).toFixed(2);

  const { data, error } = await supabase
    .from("party_orders")
    .insert({
      store_id: body.store_id || null,
      customer_name: body.customer_name,
      customer_phone: body.customer_phone || null,
      customer_email: body.customer_email || null,
      party_date: body.party_date,
      party_time: body.party_time || null,
      guest_count: body.guest_count || 10,
      items,
      subtotal,
      tax,
      total,
      deposit: body.deposit || 0,
      status: body.status || "pending",
      notes: body.notes || null,
      prep_notes: body.prep_notes || null,
      staff_assigned: body.staff_assigned || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ ok: false, error: error.message });
  return NextResponse.json({ ok: true, party: data });
}

export async function PUT(req: NextRequest) {
  const supabase = await getClientForRoute();
  const body = await req.json();
  const { id, ...fields } = body;
  if (!id) return NextResponse.json({ ok: false, error: "Missing id" });

  if (fields.items) {
    const items = fields.items;
    fields.subtotal = items.reduce((s: number, i: any) => s + (Number(i.price) * Number(i.qty) || 0), 0);
    fields.tax = +(fields.subtotal * 0.075).toFixed(2);
    fields.total = +(fields.subtotal + fields.tax).toFixed(2);
  }

  if (fields.status === "approved" && !fields.approved_at) {
    fields.approved_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from("party_orders")
    .update(fields)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ ok: false, error: error.message });
  return NextResponse.json({ ok: true, party: data });
}

export async function DELETE(req: NextRequest) {
  const supabase = await getClientForRoute();
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ ok: false, error: "Missing id" });

  const { error } = await supabase.from("party_orders").delete().eq("id", id);
  if (error) return NextResponse.json({ ok: false, error: error.message });
  return NextResponse.json({ ok: true });
}
