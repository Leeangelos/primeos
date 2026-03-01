import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type PostBody = {
  user_id?: string;
  store_name?: string;
  weekly_sales?: number | null;
  food_cost_pct?: number | null;
  labor_cost_pct?: number | null;
  employee_count?: number | null;
  monthly_rent?: number | null;
  google_business_name?: string | null;
  street_address?: string | null;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
  county?: string | null;
  goals?: string[];
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as PostBody;
    const {
      user_id,
      store_name,
      weekly_sales,
      food_cost_pct,
      labor_cost_pct,
      employee_count,
      monthly_rent,
      google_business_name,
      street_address,
      city,
      state,
      zip_code,
      county,
      goals,
    } = body;

    if (!user_id) {
      return NextResponse.json({ error: "Missing user_id" }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const { error } = await supabase.from("onboarding_data").insert({
      user_id,
      store_name: store_name ?? null,
      weekly_sales: weekly_sales ?? null,
      food_cost_pct: food_cost_pct ?? null,
      labor_cost_pct: labor_cost_pct ?? null,
      employee_count: employee_count ?? null,
      monthly_rent: monthly_rent ?? null,
      google_business_name: google_business_name ?? null,
      street_address: street_address ?? null,
      city: city ?? null,
      state: state ?? null,
      zip_code: zip_code ?? null,
      county: county ?? null,
      goals: goals ?? null,
      completed_at: new Date().toISOString(),
    });

    if (error) {
      console.error("Onboarding insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Onboarding POST error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Request failed" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !anonKey) {
      return NextResponse.json({ completed: false }, { status: 200 });
    }
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ completed: false }, { status: 200 });
    }
    const authClient = createClient(supabaseUrl, anonKey);
    const { data: { user } } = await authClient.auth.getUser(token);
    if (!user?.id) {
      return NextResponse.json({ completed: false }, { status: 200 });
    }
    if (!serviceRoleKey) {
      return NextResponse.json({ completed: false }, { status: 200 });
    }
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const { data } = await supabase
      .from("onboarding_data")
      .select("id, store_name, weekly_sales, food_cost_pct, labor_cost_pct, employee_count, monthly_rent, google_business_name, street_address, city, state, zip_code, county, goals")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    if (data) {
      return NextResponse.json({ completed: true, data });
    }
    return NextResponse.json({ completed: false }, { status: 200 });
  } catch {
    return NextResponse.json({ completed: false }, { status: 200 });
  }
}
