import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getStoreMap } from "@/src/lib/foodtec";

export const dynamic = "force-dynamic";

type SyncResult = {
  store: string;
  seeded: number;
  updated: number;
};

export async function POST() {
  try {
    const FOODTEC_TOKEN = process.env.FOODTEC_API_TOKEN;
    const ENTERPRISE_URL = "https://ambitionnlegacy.foodtecsolutions.com";
    if (!FOODTEC_TOKEN) {
      return NextResponse.json({ ok: false, error: "Missing FOODTEC_API_TOKEN" }, { status: 500 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ ok: false, error: "Server config" }, { status: 500 });
    }
    const supabase = createClient(supabaseUrl, supabaseKey);

    const storeMap = await getStoreMap(); // foodtec_store_name -> store_id

    const results: SyncResult[] = [];

    for (const [foodtecStoreName, storeId] of Object.entries(storeMap)) {
      let seeded = 0;
      let updated = 0;

      try {
        const url = `${ENTERPRISE_URL}/ExportView?view=employee&store=${encodeURIComponent(
          foodtecStoreName
        )}`;
        const res = await fetch(url, {
          headers: { "X-DATA-EXPORTS-TOKEN": FOODTEC_TOKEN },
        });
        if (!res.ok) {
          console.error(
            `FoodTec employee view error for ${foodtecStoreName}: HTTP ${res.status}`
          );
          results.push({ store: foodtecStoreName, seeded, updated });
          continue;
        }
        const text = await res.text();
        const lines = text.trim().split("\n");
        if (lines.length < 2) {
          results.push({ store: foodtecStoreName, seeded, updated });
          continue;
        }
        const headers = lines[0]
          .split("\t")
          .map((h) => h.trim().toLowerCase().replace(/\s+/g, ""));
        const rows = lines.slice(1).map((line) => {
          const cols = line.split("\t");
          const row: Record<string, string> = {};
          headers.forEach((h, i) => {
            row[h] = (cols[i] || "").trim();
          });
          return row;
        });

        for (const row of rows) {
          const name = (row.name || row.employee || "").trim();
          if (!name) continue;
          const jobTitle = (row.jobtitle || row.position || "").trim();
          const payRateRaw = row.payrate || row.rate || "";
          const phone = (row.phone || row.phonenumber || "").trim();
          const email = (row.email || "").trim();
          const statusRaw = (row.status || row.employmentstatus || "").toLowerCase();

          const payRate = payRateRaw ? Number(payRateRaw) || null : null;
          const status = statusRaw.includes("inactive") || statusRaw.includes("terminated") ? "inactive" : "active";

          const { data: existing } = await supabase
            .from("employees")
            .select("id, status, pay_rate, role, phone, email")
            .eq("store_id", storeId)
            .eq("name", name)
            .maybeSingle();

          if (!existing) {
            const { error } = await supabase.from("employees").insert({
              store_id: storeId,
              name,
              role: jobTitle || "team",
              pay_rate: payRate,
              phone: phone || null,
              email: email || null,
              status,
              source: "foodtec",
            });
            if (!error) seeded += 1;
          } else {
            const updates: Record<string, unknown> = {};
            updates.status = status;
            if (payRate != null && payRate !== existing.pay_rate) updates.pay_rate = payRate;
            if (jobTitle && jobTitle !== existing.role) updates.role = jobTitle;
            if (phone && phone !== existing.phone) updates.phone = phone;
            if (email && email !== existing.email) updates.email = email;
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
        console.error("foodtec sync-employees error", foodtecStoreName, e);
      }

      results.push({ store: foodtecStoreName, seeded, updated });
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

