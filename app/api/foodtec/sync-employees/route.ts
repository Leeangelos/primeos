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

    // Build last 90 days list (excluding today), same pattern as main sync
    const daysToSync: Date[] = [];
    for (let d = 1; d <= 90; d++) {
      const t = new Date();
      t.setDate(t.getDate() - d);
      daysToSync.push(t);
    }

    let allLaborRows: any[] = [];
    for (const target of daysToSync) {
      const foodtecDay = formatFoodTecDate(target);
      const rows = await fetchFoodTecView("labor", foodtecDay);
      if (rows && rows.length) {
        allLaborRows = allLaborRows.concat(rows as any[]);
      }
    }

    console.log("labor row sample:", JSON.stringify(allLaborRows?.slice(0, 2)));

    type EmpAgg = {
      name: string;
      storeId: string;
      roles: Record<string, number>;
      rates: number[];
      firstname?: string;
      lastname?: string;
      punchin?: string;
      punchout?: string;
      salaried?: string;
      foodtecId?: string;
    };

    const employeesByStore: Record<string, Record<string, EmpAgg>> = {};
    let firstRowLogged = false;

    (allLaborRows || []).forEach((row: any) => {
      if (!firstRowLogged) {
        console.log("raw agg row:", JSON.stringify({ keys: Object.keys(row), firstname: row.firstname, lastname: row.lastname, id: row.id, salaried: row.salaried }));
        firstRowLogged = true;
      }
      const storeName = (row.store as string) || "unknown";
      const storeId = storeMap[storeName];
      if (!storeId) return;

      const firstname = (row.firstname as string)?.trim() || "";
      const lastname = (row.lastname as string)?.trim() || "";
      const fullNameFromParts =
        firstname && lastname ? `${firstname} ${lastname}`.trim() : "";
      const nameRaw =
        fullNameFromParts ||
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
          firstname: firstname || undefined,
          lastname: lastname || undefined,
          punchin: (row.punchin as string)?.trim() || undefined,
          punchout: (row.punchout as string)?.trim() || undefined,
          salaried: (row.salaried as string)?.trim() || undefined,
          foodtecId: (row.id as string)?.trim() || undefined,
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

        const fullName =
          emp.firstname && emp.lastname
            ? `${emp.firstname} ${emp.lastname}`.trim()
            : null;
        const isSalaried = (emp.salaried ?? "").toLowerCase() === "y";

        const { data: existing } = await supabase
          .from("employees")
          .select("id, role, pay_rate, firstname, lastname, punchin, punchout, salaried, full_name, foodtec_id, is_salaried")
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
            firstname: emp.firstname || null,
            lastname: emp.lastname || null,
            punchin: emp.punchin || null,
            punchout: emp.punchout || null,
            salaried: emp.salaried || null,
            full_name: fullName,
            foodtec_id: emp.foodtecId || null,
            is_salaried: isSalaried,
          });
          if (!error) seeded += 1;
        } else {
          const updates: Record<string, unknown> = {};
          if (bestRole && bestRole !== existing.role) updates.role = bestRole;
          if (avgRate != null && avgRate !== existing.pay_rate) {
            updates.pay_rate = avgRate;
          }
          if (emp.punchin !== undefined && emp.punchin !== existing.punchin) updates.punchin = emp.punchin || null;
          if (emp.punchout !== undefined && emp.punchout !== existing.punchout) updates.punchout = emp.punchout || null;
          if (emp.salaried !== undefined && emp.salaried !== existing.salaried) updates.salaried = emp.salaried || null;
          // Always write these on every sync (force update even when currently null)
          updates.firstname = emp.firstname || null;
          updates.lastname = emp.lastname || null;
          updates.full_name = fullName;
          updates.foodtec_id = emp.foodtecId || null;
          updates.is_salaried = isSalaried;
          const { error } = await supabase
            .from("employees")
            .update(updates)
            .eq("id", existing.id);
          if (!error) updated += 1;
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

