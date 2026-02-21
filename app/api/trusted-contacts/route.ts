import { NextRequest, NextResponse } from "next/server";
import { getClientForRoute } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const category = req.nextUrl.searchParams.get("category");
  const supabase = await getClientForRoute();

  let query = supabase
    .from("trusted_contacts")
    .select("*")
    .order("category", { ascending: true })
    .order("name", { ascending: true });

  if (category && category !== "all") query = query.eq("category", category);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ ok: false, error: error.message });
  }

  return NextResponse.json({ ok: true, contacts: data ?? [] });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { category, name, phone, email, account_number, notes } = body;

  if (!name || !category) {
    return NextResponse.json({ ok: false, error: "Name and category are required" });
  }

  const supabase = await getClientForRoute();
  const { data, error } = await supabase
    .from("trusted_contacts")
    .insert({ category, name, phone: phone || null, email: email || null, account_number: account_number || null, notes: notes || null })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message });
  }

  return NextResponse.json({ ok: true, contact: data });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { id, ...updates } = body;

  if (!id) {
    return NextResponse.json({ ok: false, error: "Missing id" });
  }

  const supabase = await getClientForRoute();
  const { data, error } = await supabase
    .from("trusted_contacts")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message });
  }

  return NextResponse.json({ ok: true, contact: data });
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");

  if (!id) {
    return NextResponse.json({ ok: false, error: "Missing id" });
  }

  const supabase = await getClientForRoute();
  const { error } = await supabase.from("trusted_contacts").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message });
  }

  return NextResponse.json({ ok: true });
}
