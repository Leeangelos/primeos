export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      store_id,
      inspection_date,
      inspection_type,
      result,
      critical_violations,
      noncritical_violations,
      inspector_notes,
    } = body;

    if (!store_id || !inspection_date || !inspection_type || !result) {
      return NextResponse.json(
        { error: "store_id, inspection_date, inspection_type, and result are required" },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const critical = Array.isArray(critical_violations)
      ? critical_violations.filter((s: unknown) => typeof s === "string" && s.trim() !== "")
      : [];
    const noncritical = Array.isArray(noncritical_violations)
      ? noncritical_violations.filter((s: unknown) => typeof s === "string" && s.trim() !== "")
      : [];

    const { data, error } = await supabase
      .from("own_inspections")
      .insert({
        store_id,
        inspection_date: String(inspection_date).slice(0, 10),
        inspection_type: String(inspection_type),
        result: String(result),
        critical_violations: critical,
        noncritical_violations: noncritical,
        inspector_notes: inspector_notes != null ? String(inspector_notes) : null,
        source: "manual",
      })
      .select("id")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: data?.id });
  } catch (err) {
    console.error("Inspection add error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to save report" },
      { status: 500 }
    );
  }
}
