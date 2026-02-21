import { NextRequest, NextResponse } from "next/server";
import { getClientForRoute } from "@/lib/supabase";

const CHANNELS = ["general", "announcements", "shift-swap", "managers-only"] as const;
const DEFAULT_LIMIT = 50;

export async function GET(req: NextRequest) {
  const supabase = await getClientForRoute();
  const store = req.nextUrl.searchParams.get("store");
  const channel = req.nextUrl.searchParams.get("channel") || "general";
  const limit = Math.min(Number(req.nextUrl.searchParams.get("limit")) || DEFAULT_LIMIT, 100);

  let query = supabase
    .from("chat_messages")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (store && store !== "all") {
    const { data: storeRow } = await supabase.from("stores").select("id").eq("slug", store).single();
    if (storeRow) query = query.eq("store_id", storeRow.id);
  }

  if (CHANNELS.includes(channel as (typeof CHANNELS)[number])) {
    query = query.eq("channel", channel);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ ok: false, error: error.message });
  const messages = (data ?? []).reverse();
  return NextResponse.json({ ok: true, messages });
}

export async function POST(req: NextRequest) {
  const supabase = await getClientForRoute();
  const body = await req.json();

  const storeSlug = body.store_slug ?? body.store;
  let storeId: string | null = null;
  if (storeSlug) {
    const { data: storeRow } = await supabase.from("stores").select("id").eq("slug", storeSlug).single();
    if (storeRow) storeId = storeRow.id;
  }

  const channel = body.channel ?? "general";
  if (!CHANNELS.includes(channel as (typeof CHANNELS)[number])) {
    return NextResponse.json({ ok: false, error: "Invalid channel" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("chat_messages")
    .insert({
      store_id: storeId ?? body.store_id ?? null,
      channel,
      sender_name: body.sender_name ?? "Anonymous",
      sender_role: body.sender_role ?? null,
      message: body.message ?? "",
      is_pinned: body.is_pinned ?? false,
      is_announcement: body.is_announcement ?? false,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ ok: false, error: error.message });
  return NextResponse.json({ ok: true, message: data });
}
