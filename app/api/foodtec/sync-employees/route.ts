import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { fetchFoodTecView, formatFoodTecDate, getStoreMap, pf } from "@/src/lib/foodtec";

export const dynamic = "force-dynamic";

type SyncResult = {
  store: string;
  seeded: number;
  updated: number;
};

export async function POST() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ ok: false, error: "Server config" }, { status: 500 });
    }
    const supabase = createClient(supabaseUrl, supabaseKey);

    const storeMap = await getStoreMap(); // foodtec_store_name -> store_id

    const target = new Date();
    target.setDate(target.getDate() - 1);
    const foodtecDay = formatFoodTecDate(target);

    const laborRows = await fetchFoodTecView("labor", foodtecDay);
    console.log("labor row sample:", JSON.stringify(laborRows?.slice(0, 2)));

    type EmpAgg = {
      name: string;
      storeId: string;
      roles: Record<string, number>;
      rates: number[];
    };

    const employeesByStore: Record<string, Record<string, EmpAgg>> = {};

    (laborRows || []).forEach((row: any) => {
      const storeName = (row.store as string) || "unknown";
      const storeId = storeMap[storeName];
      if (!storeId) return;

      const nameRaw =
        (row.name as string) ||
        (row.employee as string) ||
        (row.employee_name as string) ||
        "";
      const name = nameRaw.trim();
      if (!name) return;

      const roleRaw =
        (row.position as string) ||
        (row.job as string) ||
        (row.role as string) ||
        "team";
      const role = (roleRaw || "team").trim().toLowerCase();

      const rate = pf(row.rate as string) || pf(row.pay_rate as string) || 0;

      if (!employeesByStore[storeId]) employeesByStore[storeId] = {};
      if (!employeesByStore[storeId][name]) {
        employeesByStore[storeId][name] = {
          name,
          storeId,
          roles: {},
          rates: [],
        };
      }
      const agg = employeesByStore[storeId][name];
      agg.roles[role] = (agg.roles[role] ?? 0) + 1;
      if (rate > 0) agg.rates.push(rate);
    });

    const results: SyncResult[] = [];

    for (const [storeId, emps] of Object.entries(employeesByStore)) {
      let seeded = 0;
      let updated = 0;

      // Look up slug for reporting
      const { data: storeRow } = await supabase
        .from("stores")
        .select("slug")
        .eq("id", storeId)
        .maybeSingle();
      const storeSlug = (storeRow?.slug as string) || storeId;

      for (const emp of Object.values(emps)) {
        const rolesEntries = Object.entries(emp.roles);
        const bestRole =
          rolesEntries.length > 0
            ? rolesEntries.sort((a, b) => b[1] - a[1])[0][0]
            : "team";
        const avgRate =
          emp.rates.length > 0
            ? emp.rates.reduce((a, b) => a + b, 0) / emp.rates.length
            : null;

        const { data: existing } = await supabase
          .from("employees")
          .select("id, role, pay_rate")
          .eq("store_id", storeId)
          .eq("name", emp.name)
          .maybeSingle();

        if (!existing) {
          const { error } = await supabase.from("employees").insert({
            store_id: storeId,
            name: emp.name,
            role: bestRole || "team",
            pay_rate: avgRate,
            status: "active",
            source: "foodtec",
          });
          if (!error) seeded += 1;
        } else {
          const updates: Record<string, unknown> = {};
          if (bestRole && bestRole !== existing.role) updates.role = bestRole;
          if (avgRate != null && avgRate !== existing.pay_rate) {
            updates.pay_rate = avgRate;
          }
          if (Object.keys(updates).length > 0) {
            const { error } = await supabase
              .from("employees")
              .update(updates)
              .eq("id", existing.id);
            if (!error) updated += 1;
          }
        }
      }

      results.push({ store: storeSlug, seeded, updated });
    }

    return NextResponse.json({ ok: true, results });
  } catch (err: any) {
    console.error("foodtec sync-employees POST error", err);
    return NextResponse.json(
      { ok: false, error: err?.message || "Server error" },
      { status: 500 }
    );
  }
}

