import { NextRequest, NextResponse } from "next/server";
import { getClientForRoute } from "@/lib/supabase";
import { VENDORS } from "@/src/lib/vendor-data";

const STORE_SLUGS = ["kent", "aurora", "lindseys"] as const;

/** Extra contacts to seed per store: Professional (CPA, insurance agent), Repairs (equipment). */
function getExtraContactsForStore(store_id: string): { category: string; name: string; phone: string; email: string; account_number: string | null; notes: string }[] {
  return [
    { category: "professional", name: "CPA / Accountant", phone: "(330) 555-0200", email: "cpa@example.com", account_number: null, notes: "Tax prep and bookkeeping." },
    { category: "professional", name: "Erie Insurance Agent (Tom Barker)", phone: "(330) 555-0190", email: "tbarker@erie.com", account_number: null, notes: "GL, property, workers comp." },
    { category: "service_contract", name: "General Equipment Repair", phone: "(330) 555-0250", email: "repairs@example.com", account_number: null, notes: "Ovens, coolers, general equipment." },
  ];
}

export async function POST(req: NextRequest) {
  const supabase = await getClientForRoute();
  const inserted: string[] = [];
  const skipped: string[] = [];

  for (const store_id of STORE_SLUGS) {
    const existing = await supabase
      .from("trusted_contacts")
      .select("id, name, category")
      .eq("store_id", store_id);
    const existingSet = new Set(
      (existing.data ?? []).map((r) => `${r.name}|${r.category}`)
    );

    const vendorsForStore = VENDORS.filter((v) => v.store_id === store_id);
    for (const v of vendorsForStore) {
      const name = v.vendor_name;
      const key = `${name}|vendor`;
      if (existingSet.has(key)) {
        skipped.push(`${store_id}: ${name} (vendor)`);
        continue;
      }
      const notes = [v.contact_name && `Contact: ${v.contact_name}`, v.notes].filter(Boolean).join(". ");
      const { error } = await supabase.from("trusted_contacts").insert({
        store_id,
        category: "vendor",
        name,
        phone: v.phone || null,
        email: v.email || null,
        account_number: v.account_number || null,
        notes: notes || null,
      });
      if (error) {
        return NextResponse.json({ ok: false, error: error.message });
      }
      existingSet.add(key);
      inserted.push(`${store_id}: ${name} (vendor)`);
    }

    for (const c of getExtraContactsForStore(store_id)) {
      const key = `${c.name}|${c.category}`;
      if (existingSet.has(key)) {
        skipped.push(`${store_id}: ${c.name} (${c.category})`);
        continue;
      }
      const { error } = await supabase.from("trusted_contacts").insert({
        store_id,
        category: c.category,
        name: c.name,
        phone: c.phone || null,
        email: c.email || null,
        account_number: c.account_number,
        notes: c.notes || null,
      });
      if (error) {
        return NextResponse.json({ ok: false, error: error.message });
      }
      existingSet.add(key);
      inserted.push(`${store_id}: ${c.name} (${c.category})`);
    }
  }

  return NextResponse.json({
    ok: true,
    inserted: inserted.length,
    inserted_details: inserted,
    skipped: skipped.length,
    skipped_details: skipped,
  });
}
