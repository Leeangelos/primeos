import { NextRequest, NextResponse } from "next/server";
import { getClientForRoute } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const supabase = await getClientForRoute();
  const store = req.nextUrl.searchParams.get("store");
  const date = req.nextUrl.searchParams.get("date");
  const status = req.nextUrl.searchParams.get("status");
  const category = req.nextUrl.searchParams.get("category");
  const role = req.nextUrl.searchParams.get("role");

  let query = supabase.from("tasks").select("*").order("due_time", { ascending: true, nullsFirst: false }).order("created_at", { ascending: true });

  if (store && store !== "all") {
    const { data: storeRow } = await supabase.from("stores").select("id").eq("slug", store).single();
    if (storeRow) query = query.eq("store_id", storeRow.id);
  }

  if (date) query = query.eq("due_date", date);
  if (status && status !== "all") query = query.eq("status", status);
  if (category && category !== "all") query = query.eq("category", category);
  if (role && role !== "all") query = query.eq("assigned_role", role);

  const { data, error } = await query;
  if (error) return NextResponse.json({ ok: false, error: error.message });
  return NextResponse.json({ ok: true, tasks: data ?? [] });
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

  const { data, error } = await supabase
    .from("tasks")
    .insert({
      store_id: storeId ?? body.store_id ?? null,
      title: body.title ?? "Untitled",
      category: body.category ?? "custom",
      assigned_role: body.assigned_role ?? "team",
      due_date: body.due_date,
      due_time: body.due_time ?? null,
      is_recurring: body.is_recurring ?? false,
      recurrence: body.recurrence ?? null,
      status: body.status ?? "pending",
      completed_by: body.completed_by ?? null,
      completed_at: body.completed_at ?? null,
      created_by: body.created_by ?? null,
      priority: body.priority ?? "medium",
      notes: body.notes ?? null,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) return NextResponse.json({ ok: false, error: error.message });
  return NextResponse.json({ ok: true, task: data });
}

export async function PUT(req: NextRequest) {
  const supabase = await getClientForRoute();
  const body = await req.json();
  const id = body.id;
  if (!id) return NextResponse.json({ ok: false, error: "Missing id" });

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.title !== undefined) updates.title = body.title;
  if (body.category !== undefined) updates.category = body.category;
  if (body.assigned_role !== undefined) updates.assigned_role = body.assigned_role;
  if (body.due_date !== undefined) updates.due_date = body.due_date;
  if (body.due_time !== undefined) updates.due_time = body.due_time;
  if (body.is_recurring !== undefined) updates.is_recurring = body.is_recurring;
  if (body.recurrence !== undefined) updates.recurrence = body.recurrence;
  if (body.status !== undefined) updates.status = body.status;
  if (body.completed_by !== undefined) updates.completed_by = body.completed_by;
  if (body.completed_at !== undefined) updates.completed_at = body.completed_at;
  if (body.priority !== undefined) updates.priority = body.priority;
  if (body.notes !== undefined) updates.notes = body.notes;

  const { data, error } = await supabase.from("tasks").update(updates).eq("id", id).select().single();
  if (error) return NextResponse.json({ ok: false, error: error.message });
  return NextResponse.json({ ok: true, task: data });
}

export async function DELETE(req: NextRequest) {
  const supabase = await getClientForRoute();
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ ok: false, error: "Missing id" });

  const { error } = await supabase.from("tasks").delete().eq("id", id);
  if (error) return NextResponse.json({ ok: false, error: error.message });
  return NextResponse.json({ ok: true });
}
