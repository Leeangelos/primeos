import { NextRequest, NextResponse } from "next/server";
import { getClientForRoute } from "@/lib/supabase";
import { COCKPIT_TARGETS, COCKPIT_STORE_SLUGS, type CockpitStoreSlug } from "@/lib/cockpit-config";

function isValidSlug(s: string): s is CockpitStoreSlug {
  return COCKPIT_STORE_SLUGS.includes(s as CockpitStoreSlug);
}

/**
 * GET /api/parties?store=all|kent|aurora|lindseys
 * Returns large orders ($300+) from foodtec_large_orders for the Catering & Large Orders page.
 */
export async function GET(request: NextRequest) {
  const storeParam = request.nextUrl.searchParams.get("store") ?? "all";
  const slugs: CockpitStoreSlug[] =
    storeParam === "all"
      ? [...COCKPIT_STORE_SLUGS]
      : isValidSlug(storeParam)
        ? [storeParam]
        : [...COCKPIT_STORE_SLUGS];

  try {
    const supabase = await getClientForRoute();

    const { data: storesRows, error: storesErr } = await supabase
      .from("stores")
      .select("id, slug")
      .in("slug", slugs);

    if (storesErr) {
      return NextResponse.json({ ok: false, error: storesErr.message }, { status: 500 });
    }

    const storeIds = (storesRows ?? []).map((r) => String(r.id));
    if (storeIds.length === 0) {
      return NextResponse.json({ ok: true, orders: [] });
    }

    const { data: rows, error } = await supabase
      .from("foodtec_large_orders")
      .select("id, store_id, business_day, order_id, net_amount, flag_scheduling")
      .in("store_id", storeIds)
      .order("business_day", { ascending: false })
      .limit(200);

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    const idToSlug = new Map<string, string>();
    for (const r of storesRows ?? []) {
      idToSlug.set(String(r.id), r.slug as string);
    }

    const orders = (rows ?? []).map((r) => {
      const slug = idToSlug.get(String(r.store_id)) as CockpitStoreSlug | undefined;
      const storeName = slug ? COCKPIT_TARGETS[slug]?.name ?? slug : String(r.store_id);
      return {
        id: r.id,
        store_id: r.store_id,
        store_slug: slug ?? null,
        store_name: storeName,
        business_day: r.business_day,
        order_id: r.order_id,
        net_amount: Number(r.net_amount),
        flag_scheduling: Boolean(r.flag_scheduling),
      };
    });

    return NextResponse.json({ ok: true, orders });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}
