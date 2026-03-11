import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function normalizeSize(raw: string): string {
  const s = (raw || "").trim();
  const u = s.toUpperCase();
  if (["LG", "LRG", "LARGE"].includes(u)) return "Large";
  if (["SM", "SMALL"].includes(u) || u === "SM") return "Small";
  if (["SHEET"].includes(u)) return "Sheet";
  if (["MED", "MEDIUM"].includes(u)) return "Medium";
  return s || "—";
}

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "Server config" }, { status: 500 });
    }
    const supabase = createClient(supabaseUrl, supabaseKey);

    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
    const startISO = thirtyDaysAgo.toISOString().slice(0, 10);
    const endISO = now.toISOString().slice(0, 10);

    const [productsRes, costsRes, hillcrestRes] = await Promise.all([
      supabase
        .from("foodtec_daily_products")
        .select("item_name, size, category, quantity, total_net")
        .gte("business_day", startISO)
        .lte("business_day", endISO),
      supabase.from("menu_item_costs").select("item_name, size, category, cost_to_make, includes_disposables, notes"),
      supabase
        .from("me_invoices")
        .select("total")
        .eq("vendor_name", "Hillcrest Foodservice")
        .gte("invoice_date", startISO)
        .lte("invoice_date", endISO),
    ]);

    const rows = (productsRes.data ?? []) as {
      item_name: string;
      size: string;
      category: string;
      quantity: number;
      total_net: number;
    }[];

    const key = (name: string, size: string, cat: string) =>
      `${(name || "").toLowerCase()}|${normalizeSize(size)}|${(cat || "").toLowerCase()}`;

    const catalogMap = new Map<
      string,
      { item_name: string; size: string; sizeDisplay: string; category: string; total_units: number; total_revenue: number }
    >();
    for (const r of rows) {
      const normSize = normalizeSize(r.size);
      const k = key(r.item_name, r.size, r.category);
      const existing = catalogMap.get(k);
      const qty = Number(r.quantity) || 0;
      const net = Number(r.total_net) || 0;
      if (existing) {
        existing.total_units += qty;
        existing.total_revenue += net;
      } else {
        catalogMap.set(k, {
          item_name: r.item_name || "Unknown",
          size: normSize,
          sizeDisplay: (r.size || "—").trim() || normSize,
          category: r.category || "Other",
          total_units: qty,
          total_revenue: net,
        });
      }
    }

    const catalog = Array.from(catalogMap.values())
      .map((c) => ({
        ...c,
        avg_unit_price: c.total_units > 0 ? c.total_revenue / c.total_units : 0,
      }))
      .sort((a, b) => b.total_revenue - a.total_revenue);

    const costsList = (costsRes.data ?? []) as {
      item_name: string;
      size: string;
      category: string;
      cost_to_make: number | null;
      includes_disposables: boolean;
      notes: string | null;
    }[];

    const costByKey = new Map<string | number, (typeof costsList)[0]>();
    for (const c of costsList) {
      costByKey.set(key(c.item_name, c.size, c.category), c);
    }

    const catalogWithCosts = catalog.map((item) => {
      const k = key(item.item_name, item.size, item.category);
      const costRow = costByKey.get(k);
      return {
        ...item,
        cost_to_make: costRow?.cost_to_make ?? null,
        includes_disposables: costRow?.includes_disposables ?? false,
        notes: costRow?.notes ?? null,
      };
    });

    const actualHillcrest =
      (hillcrestRes.data ?? []).reduce((s, r) => s + (Number((r as { total: number }).total) || 0), 0) as number;

    return NextResponse.json({
      catalog: catalogWithCosts,
      actualHillcrestLast30: actualHillcrest,
    });
  } catch (e) {
    console.error("kitchen-iq", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "Server config" }, { status: 500 });
    }
    const supabase = createClient(supabaseUrl, supabaseKey);
    const body = await request.json();
    const {
      item_name,
      size,
      category,
      cost_to_make,
      includes_disposables = false,
      notes,
    } = body as {
      item_name: string;
      size: string;
      category: string;
      cost_to_make: number | null;
      includes_disposables?: boolean;
      notes?: string | null;
    };
    if (!item_name || size == null || !category) {
      return NextResponse.json({ error: "item_name, size, category required" }, { status: 400 });
    }
    const normalizedSize = normalizeSize(size);
    const { error } = await supabase.from("menu_item_costs").upsert(
      {
        item_name: item_name.trim(),
        size: normalizedSize,
        category: (category || "").trim(),
        cost_to_make: cost_to_make != null ? Number(cost_to_make) : null,
        includes_disposables: !!includes_disposables,
        notes: notes != null ? String(notes).trim() : null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "item_name,size,category" }
    );
    if (error) {
      console.error("kitchen-iq POST", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("kitchen-iq POST", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
