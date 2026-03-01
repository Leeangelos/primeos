import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const PROFILE_FIELDS = [
  "target_food_cost",
  "target_labor_cost",
  "busiest_day",
  "avg_hourly_wage",
  "top_sellers",
  "menu_item_count",
  "manager_count",
  "avg_tenure_months",
  "main_distributor",
  "delivery_platforms",
  "review_response_goal",
  "daily_sales_goal",
] as const;

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace(/^Bearer\s+/i, "").trim();
    if (!token) {
      return NextResponse.json({ profile: {} }, { status: 200 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      return NextResponse.json({ profile: {} }, { status: 200 });
    }

    const authClient = createClient(supabaseUrl, anonKey);
    const { data: { user } } = await authClient.auth.getUser(token);
    if (!user?.id) {
      return NextResponse.json({ profile: {} }, { status: 200 });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const { data } = await supabase
      .from("operator_profile")
      .select("*")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    const profile: Record<string, unknown> = {};
    if (data) {
      for (const key of PROFILE_FIELDS) {
        if (key in data) profile[key] = (data as Record<string, unknown>)[key];
      }
    }
    return NextResponse.json({ profile });
  } catch {
    return NextResponse.json({ profile: {} }, { status: 200 });
  }
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace(/^Bearer\s+/i, "").trim();
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      return NextResponse.json({ error: "Server error" }, { status: 500 });
    }

    const authClient = createClient(supabaseUrl, anonKey);
    const { data: { user } } = await authClient.auth.getUser(token);
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const field = typeof body.field === "string" ? body.field : "";
    const value = body.value;

    if (!field || !PROFILE_FIELDS.includes(field as (typeof PROFILE_FIELDS)[number])) {
      return NextResponse.json({ error: "Invalid field" }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const update: Record<string, unknown> = { user_id: user.id, updated_at: new Date().toISOString(), [field]: value ?? null };

    const { data: row, error } = await supabase
      .from("operator_profile")
      .upsert(update, { onConflict: "user_id" })
      .select()
      .single();

    if (error) {
      console.error("operator_profile upsert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const profile: Record<string, unknown> = {};
    if (row) {
      for (const k of PROFILE_FIELDS) {
        if (k in row) profile[k] = (row as Record<string, unknown>)[k];
      }
    }
    return NextResponse.json({ profile });
  } catch (e) {
    console.error("operator-profile POST error:", e);
    return NextResponse.json({ error: "Request failed" }, { status: 500 });
  }
}
