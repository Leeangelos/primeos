import { NextRequest, NextResponse } from "next/server";
import { getClientForRoute } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const { vendor_name, invoice_date, total, notes } = body ?? {};

  if (!vendor_name || !invoice_date || typeof total !== "number" || Number.isNaN(total)) {
    return NextResponse.json(
      { ok: false, error: "vendor_name, invoice_date, and numeric total are required" },
      { status: 400 }
    );
  }

  const supabase = await getClientForRoute();

  const { error } = await supabase.from("invoices").insert({
    vendor_name,
    invoice_date,
    total,
    notes: notes || null,
    status: "pending",
    source: "manual",
  });

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}

