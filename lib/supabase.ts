import { createClient as createSupabaseClient, SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let urlLogged = false;

/**
 * Supabase client for API routes and client components.
 * Uses Supabase's default localStorage-based session persistence in the browser.
 */
export function createClient(): SupabaseClient {
  if (!url || !anonKey) {
    throw new Error("Missing Supabase env: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set.");
  }
  if (!urlLogged) {
    urlLogged = true;
    console.log("[Supabase] NEXT_PUBLIC_SUPABASE_URL prefix:", url.slice(0, 10) + "...");
  }
  return createSupabaseClient(url, anonKey);
}

/**
 * Same code path as /api/db-check: create client + getSession(). Use in routes that must share db-check connectivity.
 * Returns the client on success; throws on error.
 */
export async function getClientForRoute(): Promise<SupabaseClient> {
  const supabase = createClient();
  const { error } = await supabase.auth.getSession();
  if (error) throw new Error(error.message);
  return supabase;
}
