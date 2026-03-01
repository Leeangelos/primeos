import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const ADMIN_EMAIL = "leeangelos.corp@gmail.com";

export async function GET(request: Request) {
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
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const authClient = createClient(supabaseUrl, anonKey);
    const { data: { user } } = await authClient.auth.getUser(token);
    if (!user?.email || user.email !== ADMIN_EMAIL) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const { data: listData } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    const users = listData?.users ?? [];
    const withStore = users.filter((u) => u.user_metadata && typeof (u.user_metadata as Record<string, unknown>).store_name === "string");

    const userIds = withStore.map((u) => u.id);
    const { data: onboardingRows } = await supabase
      .from("onboarding_data")
      .select("user_id, store_name, weekly_sales, food_cost_pct, labor_cost_pct, employee_count, monthly_rent, google_business_name, street_address, city, state, zip_code, county, goals, phone, website_url, completed_at")
      .in("user_id", userIds);

    type OnboardingRow = NonNullable<typeof onboardingRows>[number];
    const onboardingByUser = new Map<string, OnboardingRow>();
    if (onboardingRows) {
      for (const row of onboardingRows) {
        if (row.user_id) onboardingByUser.set(row.user_id, row);
      }
    }

    const signups = withStore
      .map((u) => {
        const meta = (u.user_metadata || {}) as Record<string, unknown>;
        const onboarding = onboardingByUser.get(u.id) ?? null;
        return {
          id: u.id,
          email: u.email ?? "",
          name: (meta.full_name as string) || (meta.name as string) || "",
          store_name: (meta.store_name as string) || "",
          phone: (meta.phone as string) || (onboarding?.phone ?? "") || "",
          city: (meta.city as string) || (onboarding?.city ?? "") || "",
          state: (meta.state as string) || (onboarding?.state ?? "") || "",
          pos: (meta.pos as string) || "",
          pos_system: (meta.pos_system as string) || (meta.pos as string) || "",
          invite_code: (meta.invite_code as string) || "",
          signed_up: u.created_at ?? "",
          onboarding: onboarding
            ? {
                weekly_sales: onboarding.weekly_sales,
                food_cost_pct: onboarding.food_cost_pct,
                labor_cost_pct: onboarding.labor_cost_pct,
                employee_count: onboarding.employee_count,
                monthly_rent: onboarding.monthly_rent,
                goals: onboarding.goals,
                google_business_name: onboarding.google_business_name,
                street_address: onboarding.street_address,
                city: onboarding.city,
                state: onboarding.state,
                zip_code: onboarding.zip_code,
                county: onboarding.county,
                phone: onboarding.phone,
                website_url: onboarding.website_url,
                completed_at: onboarding.completed_at,
              }
            : null,
        };
      })
      .sort((a, b) => (b.signed_up || "").localeCompare(a.signed_up || ""));

    return NextResponse.json({ signups });
  } catch (e) {
    console.error("Admin API error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
