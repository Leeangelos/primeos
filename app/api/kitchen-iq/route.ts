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

export async function GET(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "Server config" }, { status: 500 });
    }
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { searchParams } = new URL(request.url);
    const storeSlug = searchParams.get("store_id");

    let storeUuid: string | null = null;
    if (storeSlug) {
      const { data: storeRow } = await supabase.from("stores").select("id").eq("slug", storeSlug).maybeSingle();
      storeUuid = storeRow?.id ?? null;
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
    const startISO = thirtyDaysAgo.toISOString().slice(0, 10);
    const endISO = now.toISOString().slice(0, 10);

    let productsQuery = supabase
      .from("foodtec_daily_products")
      .select("store_id, item_name, size, category, quantity, total_net")
      .gte("business_day", startISO)
      .lte("business_day", endISO);
    if (storeUuid) productsQuery = productsQuery.eq("store_id", storeUuid);

    const [productsRes, costsRes, hillcrestRes, allProductsRes] = await Promise.all([
      productsQuery,
      supabase.from("menu_item_costs").select("item_name, size, category, cost_to_make, includes_disposables, notes"),
      supabase
        .from("me_invoices")
        .select("total")
        .eq("vendor_name", "Hillcrest Foodservice")
        .gte("invoice_date", startISO)
        .lte("invoice_date", endISO),
      storeUuid
        ? supabase
            .from("foodtec_daily_products")
            .select("store_id, item_name, size, category, quantity, total_net")
            .gte("business_day", startISO)
            .lte("business_day", endISO)
        : Promise.resolve({ data: null }),
    ]);

    const rows = (productsRes.data ?? []) as {
      store_id: string;
      item_name: string;
      size: string;
      category: string;
      quantity: number;
      total_net: number;
    }[];

    const key = (name: string, size: string, cat: string) =>
      `${(name || "").toLowerCase()}|${normalizeSize(size)}|${(cat || "").toLowerCase()}`;
    const catalogKey = (storeId: string, name: string, size: string, cat: string) =>
      `${storeId}|${key(name, size, cat)}`;

    type CatalogRow = {
      store_id: string;
      item_name: string;
      size: string;
      sizeDisplay: string;
      category: string;
      total_units: number;
      total_revenue: number;
    };
    const catalogMap = new Map<string, CatalogRow>();
    for (const r of rows) {
      const storeId = String(r.store_id ?? "");
      const normSize = normalizeSize(r.size);
      const k = catalogKey(storeId, r.item_name, r.size, r.category);
      const existing = catalogMap.get(k);
      const qty = Number(r.quantity) || 0;
      const net = Number(r.total_net) || 0;
      if (existing) {
        existing.total_units += qty;
        existing.total_revenue += net;
      } else {
        catalogMap.set(k, {
          store_id: storeId,
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

    const costByKey = new Map<string, (typeof costsList)[0]>();
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

    let globalXp: number | undefined;
    if (storeUuid && (allProductsRes?.data ?? []).length > 0) {
      const allRows = (allProductsRes!.data ?? []) as {
        store_id: string;
        item_name: string;
        size: string;
        category: string;
        quantity: number;
        total_net: number;
      }[];
      const fullMap = new Map<string, CatalogRow>();
      for (const r of allRows) {
        const storeId = String(r.store_id ?? "");
        const normSize = normalizeSize(r.size);
        const k = catalogKey(storeId, r.item_name, r.size, r.category);
        const existing = fullMap.get(k);
        const qty = Number(r.quantity) || 0;
        const net = Number(r.total_net) || 0;
        if (existing) {
          existing.total_units += qty;
          existing.total_revenue += net;
        } else {
          fullMap.set(k, {
            store_id: storeId,
            item_name: r.item_name || "Unknown",
            size: normSize,
            sizeDisplay: (r.size || "—").trim() || normSize,
            category: r.category || "Other",
            total_units: qty,
            total_revenue: net,
          });
        }
      }
      const fullCatalog = Array.from(fullMap.values())
        .map((c) => ({
          ...c,
          avg_unit_price: c.total_units > 0 ? c.total_revenue / c.total_units : 0,
        }))
        .sort((a, b) => b.total_revenue - a.total_revenue);
      const fullWithCosts = fullCatalog.map((item) => {
        const k = key(item.item_name, item.size, item.category);
        const costRow = costByKey.get(k);
        return { ...item, cost_to_make: costRow?.cost_to_make ?? null };
      });
      const top20 = fullWithCosts.slice(0, 20);
      const costedGlobal = fullWithCosts.filter((i) => i.cost_to_make != null && i.cost_to_make > 0);
      const xpPerItem = 10;
      const highBonus = 25;
      const xpFromCosted = costedGlobal.length * xpPerItem;
      const xpFromHigh = costedGlobal.filter((i) =>
        top20.some((t) => t.item_name === i.item_name && t.size === i.size && t.category === i.category)
      ).length * highBonus;
      globalXp = xpFromCosted + xpFromHigh;
    } else if (!storeUuid) {
      const top20 = catalogWithCosts.slice(0, 20);
      const costedGlobal = catalogWithCosts.filter((i) => i.cost_to_make != null && i.cost_to_make > 0);
      const xpPerItem = 10;
      const highBonus = 25;
      globalXp = costedGlobal.length * xpPerItem + costedGlobal.filter((i) =>
        top20.some((t) => t.item_name === i.item_name && t.size === i.size && t.category === i.category)
      ).length * highBonus;
    }

    const actualHillcrest =
      (hillcrestRes.data ?? []).reduce((s, r) => s + (Number((r as { total: number }).total) || 0), 0) as number;

    const payload: { catalog: typeof catalogWithCosts; actualHillcrestLast30: number; globalXp?: number } = {
      catalog: catalogWithCosts,
      actualHillcrestLast30: actualHillcrest,
    };
    if (globalXp != null) payload.globalXp = globalXp;

    return NextResponse.json(payload);
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
