import { NextResponse } from "next/server";
import { getClientForRoute, createClient } from "@/lib/supabase";

/**
 * GET /api/debug-supabase — Isolate which Supabase operation fails in production.
 * Uses getClientForRoute() like daily-kpi and weekly-cockpit.
 * Returns { session, stores, daily_kpis, raw_fetch } with "ok" or the error message for each.
 */
export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  console.log("[debug-supabase] NEXT_PUBLIC_SUPABASE_URL =", supabaseUrl);

  let sessionResult: string;
  let storesResult: string;
  let dailyKpisResult: string;
  let rawFetchResult: string;
  let supabase;

  try {
    supabase = await getClientForRoute();
    sessionResult = "ok";
  } catch (err) {
    sessionResult = err instanceof Error ? err.message : String(err);
    try {
      supabase = createClient();
    } catch {
      return NextResponse.json({
        session: sessionResult,
        stores: "no client (getSession failed)",
        daily_kpis: "no client (getSession failed)",
      });
    }
  }

  try {
    const { error } = await supabase
      .from("stores")
      .select("id, slug")
      .limit(1);
    storesResult = error ? error.message : "ok";
  } catch (err) {
    storesResult = err instanceof Error ? err.message : String(err);
  }

  try {
    const { error } = await supabase
      .from("daily_kpis")
      .select("id")
      .limit(1);
    dailyKpisResult = error ? error.message : "ok";
  } catch (err) {
    dailyKpisResult = err instanceof Error ? err.message : String(err);
  }

  try {
    const url = (supabaseUrl ?? "") + "/rest/v1/stores?select=id,slug&limit=1";
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const rawResult = await fetch(url, {
      headers: {
        apikey: key ?? "",
        Authorization: "Bearer " + (key ?? ""),
      },
    });
    await rawResult.json();
    rawFetchResult = "ok";
  } catch (err) {
    rawFetchResult = err instanceof Error ? err.message : String(err);
  }

  return NextResponse.json({
    session: sessionResult,
    stores: storesResult,
    daily_kpis: dailyKpisResult,
    raw_fetch: rawFetchResult,
  });
}
