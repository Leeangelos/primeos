import { NextRequest, NextResponse } from "next/server";
import { getClientForRoute } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const supabase = await getClientForRoute();
  const status = req.nextUrl.searchParams.get("status");

  let query = supabase
    .from("invoices")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  if (status && status !== "all") query = query.eq("status", status);

  const { data, error } = await query;
  if (error) return NextResponse.json({ ok: false, error: error.message });
  return NextResponse.json({ ok: true, invoices: data ?? [] });
}

export async function POST(req: NextRequest) {
  const supabase = await getClientForRoute();
  const body = await req.json();

  const { data, error } = await supabase
    .from("invoices")
    .insert({
      vendor_name: body.vendor_name || null,
      invoice_number: body.invoice_number || null,
      invoice_date: body.invoice_date || null,
      total: body.total || null,
      line_items: body.line_items || [],
      status: body.status || "pending",
      raw_extraction: body.raw_extraction || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ ok: false, error: error.message });
  return NextResponse.json({ ok: true, invoice: data });
}

export async function PUT(req: NextRequest) {
  const supabase = await getClientForRoute();
  const body = await req.json();
  const { id, ...updates } = body;

  if (!id) return NextResponse.json({ ok: false, error: "Missing id" });

  if (updates.status === "approved") {
    updates.approved_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from("invoices")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ ok: false, error: error.message });
  return NextResponse.json({ ok: true, invoice: data });
}
