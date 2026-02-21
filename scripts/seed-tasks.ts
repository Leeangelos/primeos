/**
 * Seed realistic pizza shop tasks for Task Manager.
 * Run after create-tasks-table.sql. Requires stores with slugs: kent, aurora, lindseys.
 *
 * Run: npx tsx scripts/seed-tasks.ts
 */

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error("Missing env: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  process.exit(1);
}

const supabase = createClient(url, key);

const OPENING_TASKS = [
  { title: "Turn on ovens", role: "opening" as const, roleVal: "cook" as const },
  { title: "Check walk-in temps", role: "opening" as const, roleVal: "manager" as const },
  { title: "Count cash drawer", role: "opening" as const, roleVal: "shift_lead" as const },
  { title: "Check prep levels", role: "opening" as const, roleVal: "cook" as const },
  { title: "Turn on open sign", role: "opening" as const, roleVal: "cashier" as const },
  { title: "Check delivery bags", role: "opening" as const, roleVal: "driver" as const },
];

const CLOSING_TASKS = [
  { title: "Clean make line", role: "closing" as const, roleVal: "cook" as const },
  { title: "Sweep and mop", role: "closing" as const, roleVal: "team" as const },
  { title: "Empty trash", role: "closing" as const, roleVal: "team" as const },
  { title: "Lock doors", role: "closing" as const, roleVal: "shift_lead" as const },
  { title: "Count cash drawer", role: "closing" as const, roleVal: "shift_lead" as const },
  { title: "Turn off ovens", role: "closing" as const, roleVal: "cook" as const },
  { title: "Restock stations", role: "closing" as const, roleVal: "team" as const },
];

const PREP_TASKS = [
  "Dice onions and peppers",
  "Portion cheese",
  "Make dough",
  "Prep wings",
  "Slice mushrooms",
  "Portion pepperoni",
];

const CLEANING_TASKS = [
  "Clean bathrooms",
  "Wipe tables",
  "Clean hood vents",
  "Sanitize prep surfaces",
];

const ROLES = ["manager", "shift_lead", "cook", "cashier", "driver", "team"] as const;
const PRIORITIES = ["low", "medium", "high"] as const;

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function main() {
  const { data: stores } = await supabase.from("stores").select("id, slug").in("slug", ["kent", "aurora", "lindseys"]);
  if (!stores?.length) {
    console.error("No stores found. Create kent, aurora, lindseys first.");
    process.exit(1);
  }

  const today = new Date();
  const dates: string[] = [];
  for (let i = -2; i <= 3; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    dates.push(d.toISOString().slice(0, 10));
  }

  const rows: Array<{
    store_id: string;
    title: string;
    category: string;
    assigned_role: string;
    due_date: string;
    due_time: string | null;
    is_recurring: boolean;
    recurrence: string | null;
    status: string;
    priority: string;
    notes: string | null;
  }> = [];

  for (const store of stores) {
    for (const dueDate of dates) {
      for (const t of OPENING_TASKS) {
        rows.push({
          store_id: store.id,
          title: t.title,
          category: "opening",
          assigned_role: t.roleVal,
          due_date: dueDate,
          due_time: "08:00",
          is_recurring: true,
          recurrence: "daily",
          status: Math.random() > 0.6 ? "completed" : "pending",
          priority: pick(PRIORITIES),
          notes: null,
        });
      }
      for (const t of CLOSING_TASKS) {
        rows.push({
          store_id: store.id,
          title: t.title,
          category: "closing",
          assigned_role: t.roleVal,
          due_date: dueDate,
          due_time: "21:30",
          is_recurring: true,
          recurrence: "daily",
          status: Math.random() > 0.5 ? "completed" : "pending",
          priority: pick(PRIORITIES),
          notes: null,
        });
      }
      for (const title of PREP_TASKS) {
        rows.push({
          store_id: store.id,
          title,
          category: "prep",
          assigned_role: "cook",
          due_date: dueDate,
          due_time: dueDate === dates[0] ? "10:00" : null,
          is_recurring: false,
          recurrence: null,
          status: Math.random() > 0.7 ? "completed" : "pending",
          priority: pick(PRIORITIES),
          notes: null,
        });
      }
      for (const title of CLEANING_TASKS) {
        rows.push({
          store_id: store.id,
          title,
          category: "cleaning",
          assigned_role: "team",
          due_date: dueDate,
          due_time: null,
          is_recurring: true,
          recurrence: "weekday",
          status: Math.random() > 0.6 ? "completed" : "pending",
          priority: pick(PRIORITIES),
          notes: null,
        });
      }
    }
  }

  const { error } = await supabase.from("tasks").insert(rows);
  if (error) {
    console.error("Insert error:", error.message);
    process.exit(1);
  }
  console.log(`Seeded ${rows.length} tasks across ${stores.length} stores and ${dates.length} dates.`);
}

main();
