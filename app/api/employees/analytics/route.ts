import { NextRequest, NextResponse } from "next/server";
import { getClientForRoute } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const supabase = await getClientForRoute();
  const store = req.nextUrl.searchParams.get("store");

  let query = supabase
    .from("employees")
    .select("*");

  if (store && store !== "all") {
    const { data: storeData } = await supabase.from("stores").select("id").eq("slug", store).single();
    if (storeData) query = query.eq("store_id", storeData.id);
  }

  const { data: employees, error } = await query;
  if (error) return NextResponse.json({ ok: false, error: error.message });
  if (!employees) return NextResponse.json({ ok: true, analytics: null });

  const { data: stores } = await supabase.from("stores").select("id, slug, name");
  const storeById: Record<string, { slug: string; name: string }> = {};
  for (const s of (stores || [])) storeById[s.id] = { slug: s.slug, name: s.name };

  const now = new Date();
  const active = employees.filter((e) => e.status === "active");
  const exited = employees.filter((e) => e.status === "exited");

  // Average tenure (active employees)
  const tenures = active
    .filter((e) => e.hire_date)
    .map((e) => {
      const hire = new Date(e.hire_date);
      return (now.getTime() - hire.getTime()) / (1000 * 60 * 60 * 24 * 30); // months
    });
  const avgTenure = tenures.length > 0 ? tenures.reduce((a, b) => a + b, 0) / tenures.length : 0;

  // Exited tenure
  const exitedTenures = exited
    .filter((e) => e.hire_date && e.exit_date)
    .map((e) => {
      const hire = new Date(e.hire_date);
      const exit = new Date(e.exit_date);
      return (exit.getTime() - hire.getTime()) / (1000 * 60 * 60 * 24 * 30);
    });
  const avgExitedTenure = exitedTenures.length > 0 ? exitedTenures.reduce((a, b) => a + b, 0) / exitedTenures.length : 0;

  // Churn rate (last 90 days)
  const ninetyDaysAgo = new Date(now);
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  const recentExits = exited.filter((e) => e.exit_date && new Date(e.exit_date) >= ninetyDaysAgo);
  const avgHeadcount = active.length + recentExits.length / 2;
  const churnRate90 = avgHeadcount > 0 ? (recentExits.length / avgHeadcount) * 100 : 0;

  // CAC estimate ($3,500 average per hire)
  const estimatedCAC = 3500;
  const annualizedExits = exited.length > 0
    ? (recentExits.length / 90) * 365
    : 0;
  const annualTurnoverCost = annualizedExits * estimatedCAC;

  // Exit reasons breakdown
  const exitReasons: Record<string, number> = {};
  for (const e of exited) {
    const reason = e.exit_reason || "Unknown";
    exitReasons[reason] = (exitReasons[reason] || 0) + 1;
  }

  // Source breakdown
  const sources: Record<string, number> = {};
  for (const e of employees) {
    const source = e.source || "Unknown";
    sources[source] = (sources[source] || 0) + 1;
  }

  // Churn by store
  const storeChurn: Record<string, { active: number; exited: number; name: string }> = {};
  for (const e of employees) {
    const storeInfo = storeById[e.store_id] || { slug: "unknown", name: "Unknown" };
    const storeName = storeInfo.name;
    const slug = storeInfo.slug;
    if (!storeChurn[slug]) storeChurn[slug] = { active: 0, exited: 0, name: storeName };
    if (e.status === "active") storeChurn[slug].active++;
    else storeChurn[slug].exited++;
  }

  return NextResponse.json({
    ok: true,
    analytics: {
      totalEmployees: employees.length,
      active: active.length,
      exited: exited.length,
      avgTenureMonths: +avgTenure.toFixed(1),
      avgExitedTenureMonths: +avgExitedTenure.toFixed(1),
      churnRate90: +churnRate90.toFixed(1),
      estimatedCAC,
      annualTurnoverCost: Math.round(annualTurnoverCost),
      recentExits: recentExits.length,
      exitReasons,
      sources,
      storeChurn,
    },
  });
}
