import { NextRequest, NextResponse } from "next/server";
import { getClientForRoute } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const supabase = await getClientForRoute();
  const store = req.nextUrl.searchParams.get("store");
  const week = req.nextUrl.searchParams.get("week");
  if (!week) return NextResponse.json({ ok: false, error: "Missing week param" });

  const endDate = new Date(week);
  endDate.setDate(endDate.getDate() + 6);
  const end = endDate.toISOString().slice(0, 10);

  let query = supabase
    .from("schedules")
    .select("*")
    .gte("shift_date", week)
    .lte("shift_date", end)
    .order("shift_date")
    .order("start_time");

  if (store && store !== "all") {
    const { data: storeRow } = await supabase.from("stores").select("id").eq("slug", store).single();
    if (storeRow) query = query.eq("store_id", storeRow.id);
  }

  const { data: shifts, error } = await query;
  if (error) return NextResponse.json({ ok: false, error: error.message });
  return NextResponse.json({ ok: true, shifts: shifts ?? [] });
}

const ROLES = ["manager", "shift_lead", "cook", "cashier", "driver", "team"] as const;
const DEFAULT_PAY_BY_ROLE: Record<string, number> = {
  manager: 18,
  shift_lead: 16,
  cook: 14,
  cashier: 12.5,
  driver: 12,
  team: 12,
};

function calcHours(start: string, end: string): number {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  return +((eh + em / 60) - (sh + sm / 60)).toFixed(2);
}

function computeLabor(hours: number, role: string): number {
  const rate = DEFAULT_PAY_BY_ROLE[role] ?? 12;
  return +(hours * rate).toFixed(2);
}

export async function POST(req: NextRequest) {
  const supabase = await getClientForRoute();
  const body = await req.json();

  const storeSlug = body.store_slug ?? body.store;
  if (!storeSlug) return NextResponse.json({ ok: false, error: "Missing store_slug" });

  const { data: storeRow } = await supabase.from("stores").select("id").eq("slug", storeSlug).single();
  if (!storeRow) return NextResponse.json({ ok: false, error: "Store not found" });

  const employee_name = (body.employee_name ?? "").trim() || "Unnamed";
  const role = ROLES.includes(body.role as (typeof ROLES)[number]) ? body.role : "team";
  const shift_date = body.shift_date;
  const start_time = body.start_time ?? "09:00";
  const end_time = body.end_time ?? "17:00";
  const notes = body.notes?.trim() || null;

  if (!shift_date) return NextResponse.json({ ok: false, error: "Missing shift_date" });

  const hours = calcHours(start_time, end_time);
  const labor_cost = computeLabor(hours, role);

  const insert: Record<string, unknown> = {
    store_id: storeRow.id,
    employee_name,
    role,
    shift_date,
    start_time,
    end_time,
    hours,
    labor_cost,
  };
  if (notes) insert.notes = notes;

  const { data, error } = await supabase.from("schedules").insert(insert).select().single();
  if (error) return NextResponse.json({ ok: false, error: error.message });
  return NextResponse.json({ ok: true, shift: data });
}

export async function PUT(req: NextRequest) {
  const supabase = await getClientForRoute();
  const body = await req.json();
  const id = body.id;
  if (!id) return NextResponse.json({ ok: false, error: "Missing id" });

  const { data: existing } = await supabase.from("schedules").select("*").eq("id", id).single();
  if (!existing) return NextResponse.json({ ok: false, error: "Shift not found" });

  const updates: Record<string, unknown> = {};
  if (body.employee_name !== undefined) updates.employee_name = (body.employee_name ?? "").trim() || "Unnamed";
  if (body.role !== undefined) updates.role = ROLES.includes(body.role as (typeof ROLES)[number]) ? body.role : existing.role;
  if (body.shift_date !== undefined) updates.shift_date = body.shift_date;
  if (body.start_time !== undefined) updates.start_time = body.start_time;
  if (body.end_time !== undefined) updates.end_time = body.end_time;
  if (body.notes !== undefined) updates.notes = (body.notes?.trim() || null) as string | null;

  const start = (updates.start_time as string) ?? existing.start_time ?? "09:00";
  const end = (updates.end_time as string) ?? existing.end_time ?? "17:00";
  const role = (updates.role as string) ?? existing.role ?? "team";
  updates.hours = calcHours(start, end);
  updates.labor_cost = computeLabor(Number(updates.hours), role);

  const { data, error } = await supabase.from("schedules").update(updates).eq("id", id).select().single();
  if (error) return NextResponse.json({ ok: false, error: error.message });
  return NextResponse.json({ ok: true, shift: data });
}

export async function DELETE(req: NextRequest) {
  const supabase = await getClientForRoute();
  const id = req.nextUrl.searchParams.get("id") ?? (await req.json().catch(() => ({}))).id;
  if (!id) return NextResponse.json({ ok: false, error: "Missing id" });

  const { error } = await supabase.from("schedules").delete().eq("id", id);
  if (error) return NextResponse.json({ ok: false, error: error.message });
  return NextResponse.json({ ok: true });
}
