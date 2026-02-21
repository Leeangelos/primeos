import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(url, key);

async function getStoreId(slug: string): Promise<string | null> {
  const { data } = await supabase.from("stores").select("id").eq("slug", slug).single();
  return data?.id || null;
}

async function seed() {
  const kent = await getStoreId("kent");
  const aurora = await getStoreId("aurora");
  const lindseys = await getStoreId("lindseys");

  if (!kent || !aurora || !lindseys) {
    console.log("Missing store IDs:", { kent, aurora, lindseys });
    return;
  }

  const parties = [
    // Upcoming
    {
      store_id: kent, customer_name: "Sarah Mitchell", customer_phone: "330-555-1234",
      party_date: "2026-02-28", party_time: "5:00 PM", guest_count: 35,
      items: [
        { name: "16\" Pepperoni Pizza", qty: 6, price: 16.99 },
        { name: "16\" Cheese Pizza", qty: 4, price: 14.99 },
        { name: "Buffalo Wings (50pc)", qty: 2, price: 34.99 },
        { name: "2-Liter Sodas", qty: 8, price: 3.49 },
        { name: "Caesar Salad (Large)", qty: 2, price: 12.99 },
      ],
      status: "approved", deposit: 100, notes: "Birthday party for 12yo. Needs balloons area.",
      prep_notes: "Start wings at 3:30. Pizzas fire at 4:15. Salads prepped by 4:00.", staff_assigned: "Rosario + Ashley"
    },
    {
      store_id: aurora, customer_name: "Mike Henderson", customer_phone: "330-555-5678",
      party_date: "2026-03-01", party_time: "12:00 PM", guest_count: 50,
      items: [
        { name: "16\" Pepperoni Pizza", qty: 8, price: 16.99 },
        { name: "16\" Supreme Pizza", qty: 4, price: 18.99 },
        { name: "16\" Cheese Pizza", qty: 6, price: 14.99 },
        { name: "Garlic Bread (20pc)", qty: 3, price: 8.99 },
        { name: "Buffalo Wings (50pc)", qty: 3, price: 34.99 },
        { name: "2-Liter Sodas", qty: 12, price: 3.49 },
      ],
      status: "approved", deposit: 200, notes: "Company lunch. Need by 11:45 for noon start. Delivery to 123 Main St Aurora.",
      prep_notes: "Delivery order. Start at 10:00. Everything boxed by 11:15. Kevin delivers.", staff_assigned: "Greg + Darius"
    },
    {
      store_id: lindseys, customer_name: "Jennifer Park", customer_phone: "330-555-9012",
      party_date: "2026-03-07", party_time: "6:00 PM", guest_count: 25,
      items: [
        { name: "16\" Pepperoni Pizza", qty: 4, price: 16.99 },
        { name: "16\" Cheese Pizza", qty: 3, price: 14.99 },
        { name: "Mozz Sticks (24pc)", qty: 2, price: 11.99 },
        { name: "2-Liter Sodas", qty: 6, price: 3.49 },
      ],
      status: "pending", deposit: 0, notes: "Soccer team end-of-season party. Checking if they want wings too.",
    },
    {
      store_id: kent, customer_name: "David Torres", customer_phone: "330-555-3456",
      party_date: "2026-03-14", party_time: "4:00 PM", guest_count: 40,
      items: [
        { name: "16\" Pepperoni Pizza", qty: 6, price: 16.99 },
        { name: "16\" Cheese Pizza", qty: 6, price: 14.99 },
        { name: "16\" Supreme Pizza", qty: 2, price: 18.99 },
        { name: "Buffalo Wings (50pc)", qty: 2, price: 34.99 },
        { name: "Caesar Salad (Large)", qty: 3, price: 12.99 },
        { name: "2-Liter Sodas", qty: 10, price: 3.49 },
      ],
      status: "pending", deposit: 0, notes: "March Madness watch party. Wants TV area reserved.",
    },
    {
      store_id: aurora, customer_name: "Lisa Wong", customer_phone: "330-555-7890",
      party_date: "2026-03-21", party_time: "1:00 PM", guest_count: 60,
      items: [
        { name: "16\" Pepperoni Pizza", qty: 10, price: 16.99 },
        { name: "16\" Cheese Pizza", qty: 8, price: 14.99 },
        { name: "16\" Supreme Pizza", qty: 4, price: 18.99 },
        { name: "Italian Sub Tray (10)", qty: 2, price: 54.99 },
        { name: "Buffalo Wings (50pc)", qty: 4, price: 34.99 },
        { name: "Caesar Salad (Large)", qty: 4, price: 12.99 },
        { name: "2-Liter Sodas", qty: 15, price: 3.49 },
      ],
      status: "pending", deposit: 0, notes: "Church fundraiser lunch. Need setup for 60. Will confirm by March 10.",
    },

    // Past completed
    {
      store_id: kent, customer_name: "Amanda Foster", customer_phone: "330-555-2222",
      party_date: "2026-02-14", party_time: "6:00 PM", guest_count: 20,
      items: [
        { name: "16\" Heart-Shaped Pizza", qty: 4, price: 19.99 },
        { name: "16\" Cheese Pizza", qty: 2, price: 14.99 },
        { name: "2-Liter Sodas", qty: 4, price: 3.49 },
      ],
      status: "completed", deposit: 50, notes: "Valentine's dinner party.",
      prep_notes: "Heart molds prepped day before.", staff_assigned: "Ashley"
    },
    {
      store_id: lindseys, customer_name: "Tom Bradley", customer_phone: "330-555-3333",
      party_date: "2026-02-08", party_time: "12:00 PM", guest_count: 45,
      items: [
        { name: "16\" Pepperoni Pizza", qty: 8, price: 16.99 },
        { name: "16\" Cheese Pizza", qty: 4, price: 14.99 },
        { name: "Buffalo Wings (50pc)", qty: 3, price: 34.99 },
        { name: "2-Liter Sodas", qty: 10, price: 3.49 },
      ],
      status: "completed", deposit: 150, notes: "Super Bowl party. Huge success — rebooking for March Madness.",
      prep_notes: "All prep done Saturday night. Sunday AM just fire and box.", staff_assigned: "Maria + James"
    },
  ];

  for (const p of parties) {
    const items = p.items;
    const subtotal = items.reduce((s, i) => s + (i.price * i.qty), 0);
    const tax = +(subtotal * 0.075).toFixed(2);
    const total = +(subtotal + tax).toFixed(2);

    const { error } = await supabase.from("party_orders").insert({
      ...p,
      subtotal: +subtotal.toFixed(2),
      tax,
      total,
      approved_at: p.status === "approved" || p.status === "completed" ? new Date().toISOString() : null,
    });

    if (error) {
      console.log("ERROR:", p.customer_name, error.message);
    } else {
      console.log("OK:", p.customer_name, `${p.guest_count} guests, $${total}, ${p.status}`);
    }
  }

  console.log(`\nDone. ${parties.length} party orders seeded.`);
}

seed();
