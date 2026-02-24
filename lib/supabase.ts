import { createClient as createSupabaseClient, SupabaseClient } from "@supabase/supabase-js";
import { createCookieStorage } from "./supabase-cookie-storage";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let urlLogged = false;

/**
 * Supabase client for browser and server.
 * In the browser we use cookie-based auth storage so the session persists in iOS PWA/standalone
 * (sameSite: lax, secure in production). Server/scripts get default storage.
 */
export function createClient(): SupabaseClient {
  if (!url || !anonKey) {
    throw new Error("Missing Supabase env: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set.");
  }
  if (!urlLogged) {
    urlLogged = true;
    console.log("[Supabase] NEXT_PUBLIC_SUPABASE_URL prefix:", url.slice(0, 10) + "...");
  }
  const isBrowser = typeof window !== "undefined";
  const options = isBrowser
    ? { auth: { storage: createCookieStorage(), persistSession: true } }
    : undefined;
  return createSupabaseClient(url, anonKey, options);
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
