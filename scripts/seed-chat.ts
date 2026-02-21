/**
 * Seed realistic pizza shop team chat messages.
 * Run after create-chat-table.sql. Requires stores: kent, aurora, lindseys.
 *
 * Run: npx tsx scripts/seed-chat.ts
 */

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error("Missing env: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  process.exit(1);
}

const supabase = createClient(url, key);

const MESSAGES: Array<{ store_slug: string; channel: string; sender_name: string; sender_role: string; message: string; is_pinned?: boolean; is_announcement?: boolean }> = [
  { store_slug: "kent", channel: "general", sender_name: "Jordan", sender_role: "manager", message: "Who can cover Friday 5-close? My kid has a game." },
  { store_slug: "kent", channel: "general", sender_name: "Casey", sender_role: "shift_lead", message: "I can do 5–9 if someone takes 9–close." },
  { store_slug: "kent", channel: "general", sender_name: "Sam", sender_role: "cook", message: "I’ll take 9–close." },
  { store_slug: "aurora", channel: "general", sender_name: "Morgan", sender_role: "manager", message: "Cheese delivery moved to Thursday this week." },
  { store_slug: "aurora", channel: "general", sender_name: "Riley", sender_role: "cook", message: "Got it, thanks." },
  { store_slug: "lindseys", channel: "general", sender_name: "Alex", sender_role: "shift_lead", message: "New portioning guide for 16-inch specialty posted in kitchen." },
  { store_slug: "kent", channel: "general", sender_name: "Jordan", sender_role: "manager", message: "Great job last night team. $6,200 Saturday with zero complaints." },
  { store_slug: "aurora", channel: "general", sender_name: "Morgan", sender_role: "manager", message: "Staff meeting Wednesday 3pm before shift." },
  { store_slug: "lindseys", channel: "general", sender_name: "Taylor", sender_role: "cashier", message: "Can someone swap my Monday for a Tuesday?" },
  { store_slug: "kent", channel: "shift-swap", sender_name: "Jordan", sender_role: "manager", message: "Who can cover Friday 5-close? My kid has a game." },
  { store_slug: "kent", channel: "shift-swap", sender_name: "Casey", sender_role: "shift_lead", message: "I can do 5–9 if someone takes 9–close." },
  { store_slug: "aurora", channel: "shift-swap", sender_name: "Drew", sender_role: "driver", message: "Looking to swap my Saturday lunch for a dinner shift." },
  { store_slug: "lindseys", channel: "shift-swap", sender_name: "Taylor", sender_role: "cashier", message: "Can someone swap my Monday for a Tuesday?" },
  { store_slug: "kent", channel: "announcements", sender_name: "Jordan", sender_role: "manager", message: "Reminder: health inspection next Tuesday. Deep clean Wednesday night.", is_announcement: true },
  { store_slug: "kent", channel: "announcements", sender_name: "Jordan", sender_role: "manager", message: "New portioning guide for 16-inch specialty posted in kitchen.", is_pinned: true, is_announcement: true },
  { store_slug: "aurora", channel: "announcements", sender_name: "Morgan", sender_role: "manager", message: "Staff meeting Wednesday 3pm before shift. Please be on time.", is_announcement: true },
  { store_slug: "aurora", channel: "announcements", sender_name: "Morgan", sender_role: "manager", message: "Cheese delivery moved to Thursday this week. Adjust prep accordingly.", is_announcement: true },
  { store_slug: "lindseys", channel: "announcements", sender_name: "Alex", sender_role: "manager", message: "Great job last night team. $6,200 Saturday with zero complaints.", is_announcement: true },
  { store_slug: "kent", channel: "managers-only", sender_name: "Jordan", sender_role: "manager", message: "Let’s discuss labor for next week—thinking we cut 2 hrs Tuesday." },
  { store_slug: "kent", channel: "managers-only", sender_name: "Casey", sender_role: "shift_lead", message: "Agreed. Tuesday was slow last week." },
  { store_slug: "aurora", channel: "managers-only", sender_name: "Morgan", sender_role: "manager", message: "Health inspection prep: assign deep-clean tasks by role by EOD." },
  { store_slug: "lindseys", channel: "managers-only", sender_name: "Alex", sender_role: "manager", message: "Reviewing P&L tomorrow 10am. Have prime and labor notes ready." },
  { store_slug: "kent", channel: "general", sender_name: "Quinn", sender_role: "cook", message: "Walk-in temp was 38 this morning. All good." },
  { store_slug: "aurora", channel: "general", sender_name: "Riley", sender_role: "cook", message: "We’re low on large dough. Can we get an extra pull for tomorrow?" },
  { store_slug: "lindseys", channel: "general", sender_name: "Jamie", sender_role: "driver", message: "Delivery bags are in good shape. No repairs needed." },
  { store_slug: "kent", channel: "general", sender_name: "Sam", sender_role: "cook", message: "Prepped extra wings for the game. Should be enough." },
  { store_slug: "kent", channel: "announcements", sender_name: "Jordan", sender_role: "manager", message: "Holiday hours: we close at 8pm on the 24th. Open normal 25th.", is_announcement: true },
  { store_slug: "aurora", channel: "general", sender_name: "Morgan", sender_role: "manager", message: "Reminder: clock in/out on the tablet. No paper timesheets." },
  { store_slug: "lindseys", channel: "shift-swap", sender_name: "Jamie", sender_role: "driver", message: "Need to swap my Thursday dinner. Family thing." },
  { store_slug: "kent", channel: "general", sender_name: "Casey", sender_role: "shift_lead", message: "Make line is set. Opening checklist done." },
  { store_slug: "aurora", channel: "general", sender_name: "Drew", sender_role: "driver", message: "Two more runs then I’m done. Who’s taking the next batch?" },
  { store_slug: "lindseys", channel: "general", sender_name: "Taylor", sender_role: "cashier", message: "Register 2 is acting slow. Might need a restart." },
  { store_slug: "kent", channel: "managers-only", sender_name: "Jordan", sender_role: "manager", message: "Approving overtime for Casey this week—short staffed Wed/Thu." },
  { store_slug: "aurora", channel: "announcements", sender_name: "Morgan", sender_role: "manager", message: "New menu items go live Monday. Training sheet in the back.", is_announcement: true },
  { store_slug: "lindseys", channel: "general", sender_name: "Alex", sender_role: "manager", message: "Thanks everyone for the smooth weekend. Tips were strong." },
  { store_slug: "kent", channel: "general", sender_name: "Quinn", sender_role: "cook", message: "Anyone know if we’re doing the football special again this Sunday?" },
  { store_slug: "aurora", channel: "shift-swap", sender_name: "Riley", sender_role: "cook", message: "Looking for someone to take my Sunday open. I’ll cover your close another day." },
  { store_slug: "lindseys", channel: "announcements", sender_name: "Alex", sender_role: "manager", message: "Inventory count is Tuesday 6am. Two people needed.", is_announcement: true },
  { store_slug: "kent", channel: "general", sender_name: "Jordan", sender_role: "manager", message: "Yes—same as last week. Board will be updated Friday." },
  { store_slug: "aurora", channel: "managers-only", sender_name: "Morgan", sender_role: "manager", message: "Let’s try to get SLPH above 85 this week. Focus on peak pacing." },
  { store_slug: "lindseys", channel: "general", sender_name: "Jamie", sender_role: "driver", message: "Road construction on Main—add 5 min to delivery estimates." },
];

async function main() {
  const { data: stores } = await supabase.from("stores").select("id, slug").in("slug", ["kent", "aurora", "lindseys"]);
  if (!stores?.length) {
    console.error("No stores found. Create kent, aurora, lindseys first.");
    process.exit(1);
  }

  const slugToId: Record<string, string> = {};
  for (const s of stores) slugToId[s.slug] = s.id;

  const rows = MESSAGES.map((m) => ({
    store_id: slugToId[m.store_slug] ?? null,
    channel: m.channel,
    sender_name: m.sender_name,
    sender_role: m.sender_role,
    message: m.message,
    is_pinned: m.is_pinned ?? false,
    is_announcement: m.is_announcement ?? false,
  }));

  const { error } = await supabase.from("chat_messages").insert(rows);
  if (error) {
    console.error("Insert error:", error.message);
    process.exit(1);
  }
  console.log(`Seeded ${rows.length} chat messages across ${stores.length} stores.`);
}

main();
