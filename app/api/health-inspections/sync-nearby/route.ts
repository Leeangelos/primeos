export const dynamic = "force-dynamic";
export const maxDuration = 60;

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type RawInspection = {
  county: "portage" | "stark";
  establishment_name: string;
  address: string | null;
  inspection_date: string;
  violations_count: number;
  critical_violations: number;
  result: string | null;
  raw: unknown;
};

type EndpointResult = {
  url: string;
  status: number;
  preview: string;
  skipped: boolean;
  dataShape?: string;
  inspectionCount?: number;
};

const PORTAGE_ENDPOINTS = [
  "https://inspections.myhealthdepartment.com/portage-ohio/api/inspections?limit=50&offset=0",
  "https://inspections.myhealthdepartment.com/portage-ohio/api/facilities/search?q=pizza&limit=50",
  "https://inspections.myhealthdepartment.com/portage-ohio/api/inspections/recent?days=30",
];

const STARK_ENDPOINTS = [
  "https://www.healthspace.com/Clients/Ohio/Stark/Web.nsf/api/inspections?format=json",
  "https://www.healthspace.com/Clients/Ohio/Stark/Web.nsf/food-inspections.xsp?format=json",
];

function toISODate(input: unknown): string | null {
  if (input == null) return null;
  const s = String(input).trim();
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

function normalizeInspectionsFromPayload(
  data: unknown,
  county: "portage" | "stark"
): RawInspection[] {
  const out: RawInspection[] = [];
  const arr = Array.isArray(data) ? data : (data as Record<string, unknown>)?.data != null ? (data as Record<string, unknown>).data as unknown[] : Array.isArray((data as Record<string, unknown>)?.inspections) ? (data as Record<string, unknown>).inspections as unknown[] : [];
  if (!Array.isArray(arr)) return out;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  for (const item of arr) {
    const o = item as Record<string, unknown>;
    const name =
      (o.facilityName as string) ??
      (o.establishment_name as string) ??
      (o.establishmentName as string) ??
      (o.name as string) ??
      "";
    const dateStr =
      toISODate(o.inspection_date ?? o.inspectionDate ?? o.date) ?? null;
    if (!dateStr || name === "") continue;
    const d = new Date(dateStr + "T00:00:00Z");
    if (d < thirtyDaysAgo) continue;

    const violations = Number(o.violations_count ?? o.violationsCount ?? o.violations ?? 0) || 0;
    const critical = Number(o.critical_violations ?? o.criticalViolations ?? o.critical ?? 0) || 0;
    const result = (o.result as string) ?? (o.grade as string) ?? (o.status as string) ?? null;
    const address = (o.address as string) ?? (o.facilityAddress as string) ?? null;

    out.push({
      county,
      establishment_name: name,
      address: address ? String(address).trim() || null : null,
      inspection_date: dateStr,
      violations_count: violations,
      critical_violations: critical,
      result: result != null ? String(result) : null,
      raw: o,
    });
  }
  return out;
}

async function tryEndpoint(
  url: string,
  county: "portage" | "stark"
): Promise<{ result: EndpointResult; inspections: RawInspection[] }> {
  const inspections: RawInspection[] = [];
  let status = 0;
  let preview = "";
  let dataShape: string | undefined;
  let inspectionCount: number | undefined;

  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    status = res.status;

    const text = await res.text();
    preview = text.slice(0, 200).replace(/\s+/g, " ");

    if (res.status === 403 || res.status === 404) {
      console.log(`[${url}] status=${res.status}, skipped`);
      return {
        result: { url, status, preview, skipped: true },
        inspections: [],
      };
    }

    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      return {
        result: { url, status, preview, skipped: false, dataShape: "not JSON" },
        inspections: [],
      };
    }

    const normalized = normalizeInspectionsFromPayload(data, county);
    if (normalized.length > 0) {
      inspections.push(...normalized);
      inspectionCount = normalized.length;
      const first = normalized[0];
      const raw = first?.raw as Record<string, unknown> | undefined;
      const keys = raw && typeof raw === "object" ? Object.keys(raw) : [];
      dataShape = `inspections array, item keys: ${keys.slice(0, 10).join(", ")}`;
    } else {
      const type = Array.isArray(data) ? "array" : typeof data;
      const keys = data !== null && typeof data === "object" ? Object.keys(data as object) : [];
      dataShape = `${type}${keys.length ? ` keys: ${keys.slice(0, 8).join(", ")}` : ""}`;
    }

    console.log(`[${url}] status=${status} preview=${preview.slice(0, 100)}... dataShape=${dataShape}`);
  } catch (err) {
    preview = err instanceof Error ? err.message : String(err);
    console.log(`[${url}] fetch error: ${preview}`);
  }

  return {
    result: {
      url,
      status,
      preview,
      skipped: status === 403 || status === 404,
      dataShape,
      inspectionCount,
    },
    inspections,
  };
}

export async function GET() {
  const endpointResults: EndpointResult[] = [];
  const allPortage: RawInspection[] = [];
  const allStark: RawInspection[] = [];

  for (const url of PORTAGE_ENDPOINTS) {
    const { result, inspections } = await tryEndpoint(url, "portage");
    endpointResults.push(result);
    allPortage.push(...inspections);
  }

  for (const url of STARK_ENDPOINTS) {
    const { result, inspections } = await tryEndpoint(url, "stark");
    endpointResults.push(result);
    allStark.push(...inspections);
  }

  // Dedupe by (county, establishment_name, inspection_date)
  const seen = new Set<string>();
  const portageDeduped = allPortage.filter((i) => {
    const key = `${i.county}|${i.establishment_name}|${i.inspection_date}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  const starkDeduped = allStark.filter((i) => {
    const key = `${i.county}|${i.establishment_name}|${i.inspection_date}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  let portageUpserted = 0;
  let starkUpserted = 0;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (supabaseUrl && supabaseKey) {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data: stores } = await supabase.from("stores").select("id, slug");
    const idBySlug = new Map(
      ((stores ?? []) as { id: string; slug: string }[]).map((s) => [s.slug, s.id])
    );
    const kentId = idBySlug.get("kent");
    const lindseysId = idBySlug.get("lindseys");

    for (const insp of portageDeduped) {
      if (!kentId) continue;
      const { error } = await supabase.from("nearby_inspections").upsert(
        {
          county: insp.county,
          establishment_name: insp.establishment_name,
          address: insp.address,
          inspection_date: insp.inspection_date,
          violations_count: insp.violations_count,
          critical_violations: insp.critical_violations,
          result: insp.result,
          distance_miles: 0,
          near_store_id: kentId,
          raw_data: insp.raw,
        },
        { onConflict: "county,establishment_name,inspection_date" }
      );
      if (!error) portageUpserted += 1;
    }
    for (const insp of starkDeduped) {
      if (!lindseysId) continue;
      const { error } = await supabase.from("nearby_inspections").upsert(
        {
          county: insp.county,
          establishment_name: insp.establishment_name,
          address: insp.address,
          inspection_date: insp.inspection_date,
          violations_count: insp.violations_count,
          critical_violations: insp.critical_violations,
          result: insp.result,
          distance_miles: 0,
          near_store_id: lindseysId,
          raw_data: insp.raw,
        },
        { onConflict: "county,establishment_name,inspection_date" }
      );
      if (!error) starkUpserted += 1;
    }
  }

  return NextResponse.json({
    ok: true,
    endpoints: endpointResults,
    summary: {
      portage_inspections_parsed: portageDeduped.length,
      stark_inspections_parsed: starkDeduped.length,
      portage_upserted: portageUpserted,
      stark_upserted: starkUpserted,
    },
  });
}
