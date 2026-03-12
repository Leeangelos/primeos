import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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

    const { data: stores, error: storesError } = await supabase
      .from("stores")
      .select("id, slug");
    if (storesError) {
      return NextResponse.json(
        { ok: false, error: storesError.message },
        { status: 500 }
      );
    }

    const results: SyncResult[] = [];

    for (const store of stores ?? []) {
      const storeId = store.id as string;
      const storeSlug = store.slug as string;
      let seeded = 0;
      let updated = 0;

      try {
        const { data: laborRows, error: laborError } = await supabase
          .from("foodtec_daily_labor")
          .select("*")
          .eq("store_id", storeId);
        if (laborError || !laborRows || laborRows.length === 0) {
          results.push({ store: storeSlug, seeded, updated });
          continue;
        }

        type EmpAgg = {
          name: string;
          roles: Record<string, number>;
          rates: number[];
          lastSeen: string | null;
        };

        const byEmployee: Record<string, EmpAgg> = {};

        (laborRows as any[]).forEach((row) => {
          const name =
            (row.employee_name as string) ||
            (row.name as string) ||
            (row.employee as string) ||
            "";
          if (!name || !name.trim()) return;
          const cleanName = name.trim();

          const roleRaw =
            (row.role as string) ||
            (row.position as string) ||
            (row.job_title as string) ||
            "team";
          const role = (roleRaw || "team").trim().toLowerCase();

          const rateVal =
            Number(row.pay_rate) ||
            Number(row.hourly_rate) ||
            Number(row.rate) ||
            0;

          const businessDay =
            (row.business_day as string) ||
            (row.date as string) ||
            null;

          if (!byEmployee[cleanName]) {
            byEmployee[cleanName] = {
              name: cleanName,
              roles: {},
              rates: [],
              lastSeen: businessDay,
            };
          }
          const agg = byEmployee[cleanName];
          agg.roles[role] = (agg.roles[role] ?? 0) + 1;
          if (rateVal > 0) agg.rates.push(rateVal);
          if (businessDay) {
            if (!agg.lastSeen || businessDay > agg.lastSeen) {
              agg.lastSeen = businessDay;
            }
          }
        });

        for (const emp of Object.values(byEmployee)) {
          if (!emp.name) continue;
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
      } catch (e) {
        console.error("foodtec sync-employees error", storeSlug, e);
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

