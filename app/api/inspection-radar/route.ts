export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const storeId = searchParams.get("storeId");
  if (!storeId) {
    return NextResponse.json(
      { error: "storeId is required" },
      { status: 400 }
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json(
      { error: "Supabase not configured" },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const [profileRes, inspectionsRes, competitorsRes] = await Promise.all([
    supabase
      .from("store_competitor_profiles")
      .select("*")
      .eq("store_id", storeId)
      .eq("is_own_store", true)
      .maybeSingle(),
    supabase
      .from("own_inspections")
      .select("*")
      .eq("store_id", storeId)
      .order("inspection_date", { ascending: false }),
    supabase
      .from("store_competitor_profiles")
      .select("*")
      .eq("store_id", storeId)
      .eq("is_own_store", false)
      .order("google_rating", { ascending: false, nullsFirst: false }),
  ]);

  return NextResponse.json({
    profile: profileRes.data ?? null,
    inspections: inspectionsRes.data ?? [],
    competitors: competitorsRes.data ?? [],
  });
}
