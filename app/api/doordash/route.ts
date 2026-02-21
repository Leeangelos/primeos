import { NextRequest, NextResponse } from "next/server";
import { getClientForRoute } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const supabase = await getClientForRoute();
  const store = req.nextUrl.searchParams.get("store");
  const days = Number(req.nextUrl.searchParams.get("days")) || 30;

  let query = supabase
    .from("doordash_daily")
    .select("*")
    .order("business_date", { ascending: false })
    .limit(days);

  if (store && store !== "all") {
    const { data: storeData } = await supabase.from("stores").select("id").eq("slug", store).single();
    if (storeData) query = query.eq("store_id", storeData.id);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ ok: false, error: error.message });
  return NextResponse.json({ ok: true, data: data ?? [] });
}

export async function POST(req: NextRequest) {
  const supabase = await getClientForRoute();
  const body = await req.json();

  const gross = Number(body.gross_sales) || 0;
  const commPct = Number(body.doordash_commission_pct) || 25;
  const adSpend = Number(body.ad_spend) || 0;
  const orders = Number(body.order_count) || 0;
  const tips = Number(body.tips) || 0;
  const errors = Number(body.errors_refunds) || 0;

  const fees = +((gross * commPct / 100)).toFixed(2);
  const netAfterFees = +(gross - fees - errors).toFixed(2);
  const trueProft = +(netAfterFees - adSpend).toFixed(2);
  const avgTicket = orders > 0 ? +(gross / orders).toFixed(2) : 0;
  const walkinEquivalent = gross; // walk-in keeps 100%

  const { data, error } = await supabase
    .from("doordash_daily")
    .insert({
      store_id: body.store_id || null,
      business_date: body.business_date,
      gross_sales: gross,
      doordash_commission_pct: commPct,
      doordash_fees: fees,
      net_after_fees: netAfterFees,
      order_count: orders,
      avg_ticket: avgTicket,
      tips,
      errors_refunds: errors,
      ad_spend: adSpend,
      true_profit: trueProft,
      walkin_equivalent: walkinEquivalent,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ ok: false, error: error.message });
  return NextResponse.json({ ok: true, entry: data });
}
