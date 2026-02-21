import { NextRequest, NextResponse } from "next/server";
import { getClientForRoute } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const supabase = await getClientForRoute();
  const store = req.nextUrl.searchParams.get("store");
  const status = req.nextUrl.searchParams.get("status") || "all";

  let query = supabase
    .from("marketing_campaigns")
    .select("*")
    .order("start_date", { ascending: false });

  if (status && status !== "all") query = query.eq("status", status);

  if (store && store !== "all") {
    const { data: storeData } = await supabase.from("stores").select("id").eq("slug", store).single();
    if (storeData) query = query.eq("store_id", storeData.id);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ ok: false, error: error.message });
  return NextResponse.json({ ok: true, campaigns: data ?? [] });
}

export async function POST(req: NextRequest) {
  const supabase = await getClientForRoute();
  const body = await req.json();

  const spend = Number(body.total_spend) || 0;
  const customers = Number(body.new_customers) || 0;
  const avgTicket = Number(body.avg_ticket) || 0;
  const repeatVisits = Number(body.repeat_visits) || 1;

  const cac = customers > 0 ? +(spend / customers).toFixed(2) : 0;
  const ltv = +(avgTicket * repeatVisits).toFixed(2);
  const roi = cac > 0 ? +(ltv / cac).toFixed(2) : 0;
  const revenue = +(customers * ltv).toFixed(2);

  const { data, error } = await supabase
    .from("marketing_campaigns")
    .insert({
      store_id: body.store_id || null,
      name: body.name,
      platform: body.platform || "meta",
      status: body.status || "active",
      start_date: body.start_date || null,
      end_date: body.end_date || null,
      total_spend: spend,
      new_customers: customers,
      revenue_attributed: revenue,
      avg_ticket: avgTicket,
      repeat_visits: repeatVisits,
      customer_cac: cac,
      customer_ltv: ltv,
      roi_multiple: roi,
      notes: body.notes || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ ok: false, error: error.message });
  return NextResponse.json({ ok: true, campaign: data });
}

export async function PUT(req: NextRequest) {
  const supabase = await getClientForRoute();
  const body = await req.json();
  const { id, ...fields } = body;
  if (!id) return NextResponse.json({ ok: false, error: "Missing id" });

  const spend = Number(fields.total_spend) || 0;
  const customers = Number(fields.new_customers) || 0;
  const avgTicket = Number(fields.avg_ticket) || 0;
  const repeatVisits = Number(fields.repeat_visits) || 1;

  fields.customer_cac = customers > 0 ? +(spend / customers).toFixed(2) : 0;
  fields.customer_ltv = +(avgTicket * repeatVisits).toFixed(2);
  fields.roi_multiple = fields.customer_cac > 0 ? +(fields.customer_ltv / fields.customer_cac).toFixed(2) : 0;
  fields.revenue_attributed = +(customers * fields.customer_ltv).toFixed(2);

  const { data, error } = await supabase
    .from("marketing_campaigns")
    .update(fields)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ ok: false, error: error.message });
  return NextResponse.json({ ok: true, campaign: data });
}

export async function DELETE(req: NextRequest) {
  const supabase = await getClientForRoute();
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ ok: false, error: "Missing id" });

  const { error } = await supabase.from("marketing_campaigns").delete().eq("id", id);
  if (error) return NextResponse.json({ ok: false, error: error.message });
  return NextResponse.json({ ok: true });
}
