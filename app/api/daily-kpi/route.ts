import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase";

function safeNum(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

/**
 * GET /api/daily-kpi?store=slug&date=YYYY-MM-DD
 * Returns daily_kpis row for that store + date, or { ok: true, entry: null } if none.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const storeSlug = searchParams.get("store");
  const date = searchParams.get("date");

  if (!storeSlug || !date) {
    return NextResponse.json(
      { ok: false, error: "Missing store or date" },
      { status: 400 }
    );
  }

  try {
    const supabase = createClient();

    const { data: store, error: storeError } = await supabase
      .from("stores")
      .select("id")
      .eq("slug", storeSlug)
      .maybeSingle();

    if (storeError) {
      return NextResponse.json(
        { ok: false, error: storeError.message },
        { status: 500 }
      );
    }
    if (!store) {
      return NextResponse.json(
        { ok: false, error: "Store not found" },
        { status: 404 }
      );
    }

    const { data: entry, error: kpiError } = await supabase
      .from("daily_kpis")
      .select("*")
      .eq("store_id", store.id)
      .eq("business_date", date)
      .maybeSingle();

    if (kpiError) {
      return NextResponse.json(
        { ok: false, error: kpiError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, entry: entry ?? null });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { ok: false, error: message },
      { status: 502 }
    );
  }
}

/**
 * POST /api/daily-kpi — upsert daily KPI row by store slug + business_date.
 */
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON" },
      { status: 400 }
    );
  }

  const b = body as Record<string, unknown>;
  const storeSlug = typeof b.store === "string" ? b.store : null;
  const businessDate = typeof b.business_date === "string" ? b.business_date : null;

  if (!storeSlug || !businessDate) {
    return NextResponse.json(
      { ok: false, error: "Missing store or business_date" },
      { status: 400 }
    );
  }

  try {
    const supabase = createClient();

    const { data: store, error: storeError } = await supabase
      .from("stores")
      .select("id")
      .eq("slug", storeSlug)
      .maybeSingle();

    if (storeError) {
      return NextResponse.json(
        { ok: false, error: storeError.message },
        { status: 500 }
      );
    }
    if (!store) {
      return NextResponse.json(
        { ok: false, error: "Store not found" },
        { status: 404 }
      );
    }

    const row = {
      store_id: store.id,
      business_date: businessDate,
      net_sales: safeNum(b.net_sales),
      labor_dollars: safeNum(b.labor_dollars),
      labor_hours: safeNum(b.labor_hours),
      food_dollars: safeNum(b.food_dollars),
      disposables_dollars: safeNum(b.disposables_dollars),
      voids_dollars: safeNum(b.voids_dollars),
      waste_dollars: safeNum(b.waste_dollars),
      customers: safeNum(b.customers),
    };

    const { data: entry, error: upsertError } = await supabase
      .from("daily_kpis")
      .upsert(row, {
        onConflict: "store_id,business_date",
      })
      .select()
      .single();

    if (upsertError) {
      return NextResponse.json(
        { ok: false, error: upsertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, entry });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { ok: false, error: message },
      { status: 502 }
    );
  }
}
