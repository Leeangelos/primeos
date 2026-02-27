import { NextRequest, NextResponse } from "next/server";
import { getClientForRoute } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const { vendor_name, invoice_date, total } = body ?? {};

  if (!vendor_name || !invoice_date || typeof total !== "number" || Number.isNaN(total)) {
    return NextResponse.json(
      { ok: false, error: "vendor_name, invoice_date, and numeric total are required" },
      { status: 400 }
    );
  }

  const supabase = await getClientForRoute();

  const payload = {
    vendor_name,
    invoice_date,
    total,
    line_items: [],
    status: "pending",
  };

  const { error } = await supabase.from("invoices").insert(payload);

  if (error) {
    console.error("quick-invoice insert error", { error, payload });
    return NextResponse.json(
      {
        ok: false,
        error: "Insert failed",
        detail: error.message,
        code: (error as any).code ?? null,
        hint: (error as any).hint ?? null,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}

