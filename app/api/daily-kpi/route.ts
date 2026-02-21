import { NextRequest, NextResponse } from "next/server";
import { getClientForRoute } from "@/lib/supabase";

function safeNum(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function safeNumOptional(value: unknown): number | null {
  if (value == null) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
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
    const supabase = await getClientForRoute();

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

    // Fetch last 7 days for rolling averages
    const weekAgo = new Date(date + "T12:00:00Z");
    weekAgo.setUTCDate(weekAgo.getUTCDate() - 6);
    const { data: rolling } = await supabase
      .from("daily_kpis")
      .select("net_sales, food_dollars, disposables_dollars, labor_dollars, labor_hours, voids_dollars, waste_dollars")
      .eq("store_id", store.id)
      .gte("business_date", weekAgo.toISOString().slice(0, 10))
      .lte("business_date", date)
      .order("business_date", { ascending: true });

    let rolling7 = null;
    if (rolling && rolling.length > 0) {
      const totals = rolling.reduce(
        (acc, r) => ({
          sales: acc.sales + (r.net_sales ?? 0),
          food: acc.food + (r.food_dollars ?? 0),
          disp: acc.disp + (r.disposables_dollars ?? 0),
          labor: acc.labor + (r.labor_dollars ?? 0),
          hours: acc.hours + (r.labor_hours ?? 0),
          voids: acc.voids + (r.voids_dollars ?? 0),
          waste: acc.waste + (r.waste_dollars ?? 0),
        }),
        { sales: 0, food: 0, disp: 0, labor: 0, hours: 0, voids: 0, waste: 0 }
      );
      rolling7 = {
        days: rolling.length,
        foodPct: totals.sales > 0 ? +((totals.food / totals.sales) * 100).toFixed(1) : null,
        dispPct: totals.sales > 0 ? +((totals.disp / totals.sales) * 100).toFixed(1) : null,
        foodDispPct: totals.sales > 0 ? +(((totals.food + totals.disp) / totals.sales) * 100).toFixed(1) : null,
        laborPct: totals.sales > 0 ? +((totals.labor / totals.sales) * 100).toFixed(1) : null,
        primePct: totals.sales > 0 ? +(((totals.labor + totals.food + totals.disp) / totals.sales) * 100).toFixed(1) : null,
        slph: totals.hours > 0 ? +(totals.sales / totals.hours).toFixed(1) : null,
        voidsPct: totals.sales > 0 ? +((totals.voids / totals.sales) * 100).toFixed(1) : null,
        wastePct: totals.sales > 0 ? +((totals.waste / totals.sales) * 100).toFixed(1) : null,
      };
    }

    return NextResponse.json({ ok: true, entry: entry ?? null, rolling7 });
  } catch (err) {
    console.error("[daily-kpi GET]", err);
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
    const supabase = await getClientForRoute();

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
      notes: typeof b.notes === "string" ? b.notes : null,
      scheduled_hours: safeNumOptional(b.scheduled_hours),
      bump_time_minutes: safeNumOptional(b.bump_time_minutes),
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
    console.error("[daily-kpi POST]", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { ok: false, error: message },
      { status: 502 }
    );
  }
}
