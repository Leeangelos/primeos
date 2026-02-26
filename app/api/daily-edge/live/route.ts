import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ articles: [] });
  }
  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data, error } = await supabase
    .from("daily_edge_live_content")
    .select("*")
    .eq("is_active", true)
    .order("relevance_score", { ascending: false })
    .limit(8);
  if (error) {
    return NextResponse.json({ articles: [] });
  }
  return NextResponse.json({ articles: data || [] });
}
