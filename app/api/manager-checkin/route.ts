import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const serviceUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(req: NextRequest) {
  if (!serviceUrl || !serviceKey) {
    return NextResponse.json({ ok: false, error: "Missing Supabase service role configuration" }, { status: 500 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const { location_id, date, recognized_team, callouts, energy_level } = body ?? {};

  if (!location_id || !date || !energy_level || !["low", "medium", "high"].includes(energy_level)) {
    return NextResponse.json(
      { ok: false, error: "location_id, date, and energy_level ('low' | 'medium' | 'high') are required" },
      { status: 400 }
    );
  }

  const supabase = createSupabaseClient(serviceUrl, serviceKey);

  const { error } = await supabase.from("manager_checkins").insert({
    location_id,
    date,
    recognized_team: typeof recognized_team === "boolean" ? recognized_team : null,
    callouts: typeof callouts === "number" ? callouts : null,
    energy_level,
  });

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}

