import { NextRequest, NextResponse } from "next/server";
import { getClientForRoute } from "@/lib/supabase";

const CHANNELS = ["general", "announcements", "shift-swap", "managers-only"] as const;

export async function GET(req: NextRequest) {
  const supabase = await getClientForRoute();
  const store = req.nextUrl.searchParams.get("store");

  let storeId: string | null = null;
  if (store && store !== "all") {
    const { data: storeRow } = await supabase.from("stores").select("id").eq("slug", store).single();
    if (storeRow) storeId = storeRow.id;
  }

  const counts: Record<string, number> = { general: 0, announcements: 0, "shift-swap": 0, "managers-only": 0 };

  for (const ch of CHANNELS) {
    let q = supabase.from("chat_messages").select("*", { count: "exact", head: true });
    if (storeId) q = q.eq("store_id", storeId);
    const { count } = await q.eq("channel", ch);
    counts[ch] = count ?? 0;
  }

  return NextResponse.json({ ok: true, counts });
}
