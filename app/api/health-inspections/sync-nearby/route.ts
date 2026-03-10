export const dynamic = "force-dynamic";
export const maxDuration = 60;

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type RawInspection = {
  county: "portage" | "stark";
  establishment_name: string;
  address: string | null;
  inspection_date: string; // YYYY-MM-DD
  violations_count: number;
  critical_violations: number;
  result: string | null;
  raw: unknown;
};

const STORE_COORDS: Record<string, { lat: number; lng: number }> = {
  kent: { lat: 41.1534, lng: -81.3579 },
  aurora: { lat: 41.3145, lng: -81.3459 },
  lindseys: { lat: 40.7934, lng: -81.3784 },
};

function toISODate(input: string): string | null {
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

// Very simple table-row based extraction; if markup changes this will safely return an empty list.
function parseTableInspections(html: string, county: "portage" | "stark"): RawInspection[] {
  const rows = html.split(/<tr[^>]*>/i).slice(1);
  const inspections: RawInspection[] = [];
  const today = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  for (const row of rows) {
    const cellMatches = row.match(/<td[^>]*>(.*?)<\/td>/gi) || [];
    const cells = cellMatches.map((cell) =>
      cell
        .replace(/<td[^>]*>/i, "")
        .replace(/<\/td>/i, "")
        .replace(/<[^>]+>/g, "")
        .replace(/\s+/g, " ")
        .trim()
    );
    if (cells.length < 4) continue;

    const establishment_name = cells[0] || "";
    const address = cells[1] || null;
    const dateText = cells[2] || "";
    const result = cells[3] || null;
    const violationsText = cells[4] || "";

    const iso = toISODate(dateText);
    if (!iso) continue;
    const d = new Date(iso + "T00:00:00Z");
    if (d < thirtyDaysAgo || d > today) continue;

    const violations_count = parseInt(violationsText.replace(/[^\d]/g, ""), 10) || 0;

    inspections.push({
      county,
      establishment_name,
      address,
      inspection_date: iso,
      violations_count,
      critical_violations: 0,
      result,
      raw: { row: cells },
    });
  }

  return inspections;
}

async function fetchPortageInspections(): Promise<RawInspection[]> {
  try {
    const res = await fetch("https://inspections.myhealthdepartment.com/portage-ohio", {
      headers: { Accept: "text/html,application/xhtml+xml" },
      cache: "no-store",
    });
    if (!res.ok) {
      console.error("Portage inspections HTTP error", res.status);
      return [];
    }
    const html = await res.text();
    return parseTableInspections(html, "portage");
  } catch (err) {
    console.error("Portage inspections fetch error", err);
    return [];
  }
}

async function fetchStarkInspections(): Promise<RawInspection[]> {
  try {
    const res = await fetch(
      "https://www.healthspace.com/Clients/Ohio/Stark/Web.nsf/food-frameset",
      {
        headers: { Accept: "text/html,application/xhtml+xml" },
        cache: "no-store",
      }
    );
    if (!res.ok) {
      console.error("Stark inspections HTTP error", res.status);
      return [];
    }
    const html = await res.text();
    return parseTableInspections(html, "stark");
  } catch (err) {
    console.error("Stark inspections fetch error", err);
    return [];
  }
}

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Supabase environment variables are not set");
    }
    const supabase = createClient(supabaseUrl, supabaseKey);

    const [storesRes, portage, stark] = await Promise.all([
      supabase.from("stores").select("id, slug"),
      fetchPortageInspections(),
      fetchStarkInspections(),
    ]);

    const stores = (storesRes.data ?? []) as { id: string; slug: string }[];
    const idBySlug = new Map(stores.map((s) => [s.slug, s.id]));

    function pickNearestStore(county: "portage" | "stark"): { slug: string; id: string | undefined } {
      if (county === "portage") {
        return { slug: "kent", id: idBySlug.get("kent") };
      }
      return { slug: "lindseys", id: idBySlug.get("lindseys") };
    }

    const allRaw = [...portage, ...stark];
    let portageCount = 0;
    let starkCount = 0;

    for (const insp of allRaw) {
      const { slug, id: nearStoreId } = pickNearestStore(insp.county);
      if (!nearStoreId) continue;

      // Approximate distance: assume inspections are in the same city as the mapped store.
      const distanceMiles = 0;
      if (distanceMiles > 5) continue;

      const { error } = await supabase
        .from("nearby_inspections")
        .upsert(
          {
            county: insp.county,
            establishment_name: insp.establishment_name,
            address: insp.address,
            inspection_date: insp.inspection_date,
            violations_count: insp.violations_count,
            critical_violations: insp.critical_violations,
            result: insp.result,
            distance_miles: distanceMiles,
            near_store_id: nearStoreId,
            raw_data: insp.raw,
          },
          { onConflict: "county,establishment_name,inspection_date" }
        );

      if (error) {
        console.error("nearby_inspections upsert error", error);
        continue;
      }

      if (insp.county === "portage") portageCount += 1;
      else starkCount += 1;
    }

    return NextResponse.json({
      ok: true,
      portage_inspections_upserted: portageCount,
      stark_inspections_upserted: starkCount,
      total: portageCount + starkCount,
    });
  } catch (err) {
    console.error("Health inspections sync error:", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

