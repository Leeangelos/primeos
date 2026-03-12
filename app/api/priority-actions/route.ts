import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

type PriorityActionType =
  | "uncosted_item"
  | "price_gap"
  | "dog_item"
  | "food_cost_above_baseline"
  | "labor_pct_above_target";

type PriorityAction = {
  action_type: PriorityActionType;
  action_key: string;
  title: string;
  subtitle: string;
  dollar_impact: number;
  cta_label: string;
  cta_route: string;
};

function normalizeSize(raw: string): string {
  const s = (raw || "").trim();
  const u = s.toUpperCase();
  if (["LG", "LRG", "LARGE"].includes(u)) return "Large";
  if (["SM", "SMALL"].includes(u) || u === "SM") return "Small";
  if (["SHEET"].includes(u)) return "Sheet";
  if (["MED", "MEDIUM"].includes(u)) return "Medium";
  return s || "—";
}

async function getSupabaseServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Server config");
  }
  return createClient(supabaseUrl, supabaseKey);
}

async function resolveStoreId(supabase: any, storeParam: string) {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(storeParam);
  if (isUuid) return storeParam;
  const { data: storeRow } = await supabase.from("stores").select("id").eq("slug", storeParam).maybeSingle();
  return (storeRow as { id: string } | null)?.id ?? null;
}

export async function GET(request: Request) {
  try {
    const supabase = await getSupabaseServerClient();
    const { searchParams } = new URL(request.url);
    const storeParam = searchParams.get("store_id");
    if (!storeParam) {
      return NextResponse.json({ error: "store_id required" }, { status: 400 });
    }
    const storeId = await resolveStoreId(supabase, storeParam);
    if (!storeId) {
      return NextResponse.json({ actions: [] });
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
    const startISO = thirtyDaysAgo.toISOString().slice(0, 10);
    const endISO = now.toISOString().slice(0, 10);

    const sixMonthsAgo = new Date(now);
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const sixMonthsISO = sixMonthsAgo.toISOString().slice(0, 10);

    const [
      productsRes,
      costsRes,
      salesRangeRes,
      laborRangeRes,
      invoicesRes,
      invoicesRangeRes,
    ] = await Promise.all([
      supabase
        .from("foodtec_daily_products")
        .select("business_day, store_id, item_name, size, category, quantity, total_net")
        .eq("store_id", storeId)
        .gte("business_day", startISO)
        .lte("business_day", endISO),
      supabase
        .from("menu_item_costs")
        .select("item_name, size, category, cost_to_make")
        .eq("store_id", storeId),
      supabase
        .from("foodtec_daily_sales")
        .select("business_day, net_sales")
        .eq("store_id", storeId)
        .gte("business_day", startISO)
        .lte("business_day", endISO),
      supabase
        .from("foodtec_daily_labor")
        .select("business_day, total_labor_cost")
        .eq("store_id", storeId)
        .gte("business_day", startISO)
        .lte("business_day", endISO),
      supabase
        .from("me_invoices")
        .select("invoice_date, total")
        .eq("store_id", storeId)
        .in("category", ["food", "beverage"])
        .gte("invoice_date", sixMonthsISO)
        .lte("invoice_date", endISO),
      supabase
        .from("me_invoices")
        .select("invoice_date, total")
        .eq("store_id", storeId)
        .in("category", ["food", "beverage"])
        .gte("invoice_date", startISO)
        .lte("invoice_date", endISO),
    ]);

    const products = (productsRes.data ?? []) as {
      business_day: string;
      store_id: string;
      item_name: string;
      size: string;
      category: string;
      quantity: number;
      total_net: number;
    }[];
    const costs = (costsRes.data ?? []) as {
      item_name: string;
      size: string;
      category: string;
      cost_to_make: number | null;
    }[];
    const salesRange = (salesRangeRes.data ?? []) as { business_day: string; net_sales: number }[];
    const laborRange = (laborRangeRes.data ?? []) as {
      business_day: string;
      total_labor_cost: number;
    }[];
    const invoicesAll = (invoicesRes.data ?? []) as { invoice_date: string; total: number }[];
    const invoicesCurrent = (invoicesRangeRes.data ?? []) as {
      invoice_date: string;
      total: number;
    }[];

    const costByKey = new Map<string, number | null>();
    for (const row of costs) {
      const k = `${(row.item_name || "").toLowerCase()}|${normalizeSize(row.size)}|${(row.category || "").toLowerCase()}`;
      costByKey.set(k, row.cost_to_make != null ? Number(row.cost_to_make) : null);
    }

    type AggItem = {
      item_name: string;
      size: string;
      category: string;
      sizeDisplay: string;
      total_units: number;
      total_revenue: number;
    };
    const aggMap = new Map<string, AggItem>();
    for (const r of products) {
      const key = `${(r.item_name || "").toLowerCase()}|${normalizeSize(r.size)}|${(r.category || "").toLowerCase()}`;
      const existing = aggMap.get(key);
      const qty = Number(r.quantity) || 0;
      const net = Number(r.total_net) || 0;
      if (existing) {
        existing.total_units += qty;
        existing.total_revenue += net;
      } else {
        aggMap.set(key, {
          item_name: r.item_name || "Unknown",
          size: normalizeSize(r.size),
          category: r.category || "Other",
          sizeDisplay: (r.size || "—").trim() || normalizeSize(r.size),
          total_units: qty,
          total_revenue: net,
        });
      }
    }
    const catalog = Array.from(aggMap.values()).sort(
      (a, b) => b.total_revenue - a.total_revenue
    );

    const actions: PriorityAction[] = [];

    // (1) Uncosted menu items by revenue rank
    const uncosted = catalog.filter((item) => {
      const k = `${(item.item_name || "").toLowerCase()}|${item.size}|${(item.category || "").toLowerCase()}`;
      const cost = costByKey.get(k);
      return cost == null || cost <= 0;
    });
    if (uncosted.length > 0) {
      const topUncosted = uncosted.slice(0, 3);
      for (const item of topUncosted) {
        const estimatedMarginGain = 0.03; // assume +3 pts of margin once costed
        const dollarImpact = item.total_revenue * estimatedMarginGain;
        actions.push({
          action_type: "uncosted_item",
          action_key: `uncosted:${storeId}:${item.item_name}:${item.size}:${item.category}`,
          title: `Consider costing ${item.item_name} ${item.sizeDisplay}`,
          subtitle: `High-volume item without a confirmed cost — ${item.total_units} sold in last 30 days`,
          dollar_impact: Math.round(dollarImpact),
          cta_label: "Open Kitchen IQ",
          cta_route: `/menu-intelligence?view=kitchen-iq&store=${encodeURIComponent(
            storeParam
          )}`,
        });
      }
    }

    // (2) Price gaps above 7% vs store-average for same item across stores
    if (products.length > 0) {
      const { data: peerRows } = await supabase
        .from("foodtec_daily_products")
        .select("store_id, item_name, size, category, quantity, total_net")
        .neq("store_id", storeId)
        .gte("business_day", startISO)
        .lte("business_day", endISO);
      const peers = (peerRows ?? []) as {
        store_id: string;
        item_name: string;
        size: string;
        category: string;
        quantity: number;
        total_net: number;
      }[];
      const peerAgg = new Map<string, { units: number; revenue: number }>();
      for (const r of peers) {
        const k = `${(r.item_name || "").toLowerCase()}|${normalizeSize(
          r.size
        )}|${(r.category || "").toLowerCase()}`;
        const e = peerAgg.get(k) || { units: 0, revenue: 0 };
        e.units += Number(r.quantity) || 0;
        e.revenue += Number(r.total_net) || 0;
        peerAgg.set(k, e);
      }
      const priceGapActions: PriorityAction[] = [];
      for (const item of catalog) {
        const key = `${(item.item_name || "").toLowerCase()}|${item.size}|${(
          item.category || ""
        ).toLowerCase()}`;
        const peer = peerAgg.get(key);
        if (!peer || peer.units <= 0 || item.total_units <= 0) continue;
        const ourPrice =
          item.total_units > 0 ? item.total_revenue / item.total_units : 0;
        const peerPrice = peer.revenue / peer.units;
        if (ourPrice <= 0 || peerPrice <= 0) continue;
        const gapPct = (peerPrice - ourPrice) / ourPrice;
        if (gapPct <= 0.07) continue;
        const gapPerUnit = peerPrice - ourPrice;
        const dollarImpact = gapPerUnit * item.total_units;
        priceGapActions.push({
          action_type: "price_gap",
          action_key: `pricegap:${storeId}:${item.item_name}:${item.size}:${item.category}`,
          title: `Consider raising price on ${item.item_name} ${item.sizeDisplay}`,
          subtitle: `Your price is currently ${(gapPct * 100).toFixed(
            1
          )}% below peer average`,
          dollar_impact: Math.round(dollarImpact),
          cta_label: "Review menu price",
          cta_route: `/menu-intelligence?view=pricing-gaps&store=${encodeURIComponent(
            storeParam
          )}`,
        });
      }
      priceGapActions.sort((a, b) => b.dollar_impact - a.dollar_impact);
      actions.push(...priceGapActions.slice(0, 2));
    }

    // (3) Dogs: low margin, decent volume
    const dogActions: PriorityAction[] = [];
    for (const item of catalog) {
      const key = `${(item.item_name || "").toLowerCase()}|${item.size}|${(
        item.category || ""
      ).toLowerCase()}`;
      const cost = costByKey.get(key);
      const unitsPerWeek = item.total_units / 4;
      const price =
        item.total_units > 0 ? item.total_revenue / item.total_units : 0;
      if (cost == null || cost <= 0 || price <= 0) continue;
      const marginPct = ((price - cost) / price) * 100;
      if (marginPct >= 30 || unitsPerWeek <= 10) continue;
      const targetPrice = cost / (1 - 0.3);
      const extraPerUnit = targetPrice - price;
      if (extraPerUnit <= 0) continue;
      const dollarImpact = extraPerUnit * item.total_units;
      dogActions.push({
        action_type: "dog_item",
        action_key: `dog:${storeId}:${item.item_name}:${item.size}:${item.category}`,
        title: `Consider adjusting low-margin Dog: ${item.item_name} ${item.sizeDisplay}`,
        subtitle: `${Math.round(unitsPerWeek)} sold/week at ${marginPct.toFixed(
          1
        )}% margin — worth assessing portion or price`,
        dollar_impact: Math.round(dollarImpact),
        cta_label: "Review portion/price",
        cta_route: `/menu-intelligence?view=kitchen-iq&store=${encodeURIComponent(
          storeParam
        )}`,
      });
    }
    dogActions.sort((a, b) => b.dollar_impact - a.dollar_impact);
    actions.push(...dogActions.slice(0, 2));

    // (4) Food cost above baseline using invoices (like kitchen-score)
    let foodCostAction: PriorityAction | null = null;
    if (invoicesAll.length > 0 && salesRange.length > 0) {
      const hillcrestByMonth: Record<string, number> = {};
      const revenueByMonth: Record<string, number> = {};
      for (const row of invoicesAll) {
        const d = row.invoice_date;
        if (!d || typeof d !== "string") continue;
        const month = d.slice(0, 7);
        hillcrestByMonth[month] = (hillcrestByMonth[month] ?? 0) + (Number(row.total) || 0);
      }
      for (const r of salesRange) {
        const d = r.business_day;
        if (!d || typeof d !== "string") continue;
        const month = d.slice(0, 7);
        revenueByMonth[month] = (revenueByMonth[month] ?? 0) + (Number(r.net_sales) || 0);
      }
      const nowKey = `${now.getFullYear()}-${String(
        now.getMonth() + 1
      ).padStart(2, "0")}`;
      const months = Object.keys(revenueByMonth);
      const completeMonths: number[] = [];
      let avgMonthlyRevenue = 0;
      let completeCount = 0;
      for (const m of months) {
        if (m === nowKey) continue;
        const rev = revenueByMonth[m] ?? 0;
        const spend = hillcrestByMonth[m] ?? 0;
        if (rev > 0) {
          completeMonths.push((spend / rev) * 100);
          avgMonthlyRevenue += rev;
          completeCount += 1;
        }
      }
      const baselinePct =
        completeMonths.length > 0
          ? completeMonths.reduce((a, b) => a + b, 0) / completeMonths.length
          : null;
      const currentSpend = invoicesCurrent.reduce(
        (s, r) => s + (Number(r.total) || 0),
        0
      );
      const currentRevenue = salesRange.reduce(
        (s, r) => s + (Number(r.net_sales) || 0),
        0
      );
      const currentPct =
        currentRevenue > 0 ? (currentSpend / currentRevenue) * 100 : null;
      if (baselinePct != null && currentPct != null && currentPct > baselinePct) {
        const avgRev =
          completeCount > 0 ? avgMonthlyRevenue / completeCount : currentRevenue;
        const paceDollars = ((currentPct - baselinePct) / 100) * avgRev;
        foodCostAction = {
          action_type: "food_cost_above_baseline",
          action_key: `foodcost:${storeId}`,
          title: "Food cost running hot vs baseline",
          subtitle: `Current ${currentPct.toFixed(
            1
          )}% vs baseline ${baselinePct.toFixed(1)}%`,
          dollar_impact: Math.round(Math.abs(paceDollars)),
          cta_label: "Open Food Cost Analysis",
          cta_route: "/food-cost-analysis",
        };
      }
    }
    if (foodCostAction) actions.push(foodCostAction);

    // (5) Labor % above target using daily sales + labor range
    let laborAction: PriorityAction | null = null;
    if (salesRange.length > 0 && laborRange.length > 0) {
      const totalSales = salesRange.reduce(
        (s, r) => s + (Number(r.net_sales) || 0),
        0
      );
      const totalLabor = laborRange.reduce(
        (s, r) => s + (Number(r.total_labor_cost) || 0),
        0
      );
      const laborPct =
        totalSales > 0 ? (totalLabor / totalSales) * 100 : null;
      const targetLaborPct = 25; // default target if config not available
      if (laborPct != null && laborPct > targetLaborPct) {
        const excessPct = laborPct - targetLaborPct;
        const dollarImpact = (excessPct / 100) * totalSales;
        laborAction = {
          action_type: "labor_pct_above_target",
          action_key: `labor:${storeId}`,
          title: "Labor % above target",
          subtitle: `Current ${laborPct.toFixed(
            1
          )}% vs target ${targetLaborPct}% (last 30 days)`,
          dollar_impact: Math.round(Math.abs(dollarImpact)),
          cta_label: "Review schedule & staffing",
          cta_route: "/schedule",
        };
      }
    }
    if (laborAction) actions.push(laborAction);

    const top = actions
      .filter((a) => Number.isFinite(a.dollar_impact))
      .sort((a, b) => b.dollar_impact - a.dollar_impact)
      .slice(0, 3);

    return NextResponse.json({ actions: top });
  } catch (e) {
    console.error("priority-actions GET", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await getSupabaseServerClient();
    const url = new URL(request.url);
    const pathname = url.pathname;

    if (pathname.endsWith("/complete")) {
      const body = await request.json();
      const {
        store_id: storeParam,
        action_type,
        action_key,
        operator_id,
      } = body as {
        store_id: string;
        action_type: PriorityActionType;
        action_key: string;
        operator_id: string;
      };
      if (!storeParam || !action_type || !action_key || !operator_id) {
        return NextResponse.json(
          { error: "store_id, action_type, action_key, operator_id required" },
          { status: 400 }
        );
      }
      const storeId = await resolveStoreId(supabase, storeParam);
      if (!storeId) {
        return NextResponse.json({ error: "store not found" }, { status: 400 });
      }
      const { error } = await supabase.from("priority_actions_log").insert({
        store_id: storeId,
        action_type,
        action_key,
        operator_id,
        created_at: new Date().toISOString(),
      });
      if (error) {
        console.error("priority-actions POST complete", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Unsupported route" }, { status: 404 });
  } catch (e) {
    console.error("priority-actions POST", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

