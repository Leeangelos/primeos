import { createClient } from "@supabase/supabase-js";

const SLUG_MAP: Record<string, string> = {
  kent: "7cd4cb61-7e90-44f5-8739-5f19074262b8",
  aurora: "906e5dfb-6199-4460-936d-fc1e783e4574",
  lindseys: "3fb37b49-cfe7-4a9f-9940-a472b5def680",
};

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const store = searchParams.get("store") ?? "";
  const storeId = SLUG_MAP[store];
  if (!storeId) return Response.json({ ok: false, error: "unknown store" });
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { data, error } = await supabase
    .from("employees")
    .select("*")
    .eq("store_id", storeId);
  if (error) return Response.json({ ok: false, error: error.message });
  return Response.json({ ok: true, employees: data });
}
