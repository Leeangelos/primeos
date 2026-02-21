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

  const campaigns = [
    // Kent campaigns
    { store_id: kent, name: "Super Bowl Sunday Special", platform: "meta", status: "completed", start_date: "2026-02-01", end_date: "2026-02-09", total_spend: 250, new_customers: 38, avg_ticket: 26.50, repeat_visits: 2.8 },
    { store_id: kent, name: "Valentine's Day Heart Pizza", platform: "meta", status: "completed", start_date: "2026-02-07", end_date: "2026-02-14", total_spend: 180, new_customers: 22, avg_ticket: 32.00, repeat_visits: 1.5 },
    { store_id: kent, name: "Kent State Student Deal", platform: "instagram", status: "active", start_date: "2026-01-15", end_date: "2026-03-15", total_spend: 400, new_customers: 85, avg_ticket: 18.50, repeat_visits: 3.2 },
    { store_id: kent, name: "Google Local Ads - Kent", platform: "google", status: "active", start_date: "2026-01-01", end_date: "2026-03-31", total_spend: 600, new_customers: 42, avg_ticket: 28.00, repeat_visits: 2.1 },
    { store_id: kent, name: "Door Hanger Drop - Twin Lakes", platform: "print", status: "completed", start_date: "2025-12-01", end_date: "2025-12-15", total_spend: 350, new_customers: 12, avg_ticket: 24.00, repeat_visits: 1.8 },

    // Aurora campaigns
    { store_id: aurora, name: "Aurora Family Night Promo", platform: "meta", status: "active", start_date: "2026-02-01", end_date: "2026-02-28", total_spend: 300, new_customers: 45, avg_ticket: 34.00, repeat_visits: 2.4 },
    { store_id: aurora, name: "Google Local Ads - Aurora", platform: "google", status: "active", start_date: "2026-01-01", end_date: "2026-03-31", total_spend: 550, new_customers: 35, avg_ticket: 29.50, repeat_visits: 2.0 },
    { store_id: aurora, name: "Nextdoor Neighborhood Offer", platform: "nextdoor", status: "completed", start_date: "2025-11-15", end_date: "2025-12-31", total_spend: 200, new_customers: 28, avg_ticket: 22.00, repeat_visits: 2.6 },
    { store_id: aurora, name: "Instagram Reels - Kitchen BTS", platform: "instagram", status: "active", start_date: "2026-01-10", end_date: "2026-03-10", total_spend: 150, new_customers: 18, avg_ticket: 25.00, repeat_visits: 1.9 },

    // Lindsey's campaigns
    { store_id: lindseys, name: "Grand Re-Opening Push", platform: "meta", status: "completed", start_date: "2025-10-01", end_date: "2025-10-31", total_spend: 1200, new_customers: 180, avg_ticket: 28.50, repeat_visits: 2.8 },
    { store_id: lindseys, name: "Lindsey's Lunch Special", platform: "meta", status: "active", start_date: "2026-01-15", end_date: "2026-03-15", total_spend: 500, new_customers: 62, avg_ticket: 14.80, repeat_visits: 4.2 },
    { store_id: lindseys, name: "Google Local Ads - Lindsey's", platform: "google", status: "active", start_date: "2026-01-01", end_date: "2026-03-31", total_spend: 750, new_customers: 55, avg_ticket: 26.00, repeat_visits: 2.3 },
    { store_id: lindseys, name: "TikTok Pizza Making Videos", platform: "tiktok", status: "active", start_date: "2026-02-01", end_date: "2026-04-01", total_spend: 200, new_customers: 30, avg_ticket: 22.00, repeat_visits: 1.6 },
    { store_id: lindseys, name: "Yelp Enhanced Profile", platform: "yelp", status: "active", start_date: "2025-12-01", end_date: "2026-05-31", total_spend: 480, new_customers: 20, avg_ticket: 30.00, repeat_visits: 1.4 },
    { store_id: lindseys, name: "Community Football Sponsorship", platform: "sponsorship", status: "completed", start_date: "2025-09-01", end_date: "2025-11-30", total_spend: 800, new_customers: 15, avg_ticket: 26.00, repeat_visits: 2.0 },
  ];

  for (const c of campaigns) {
    const spend = c.total_spend;
    const customers = c.new_customers;
    const cac = customers > 0 ? +(spend / customers).toFixed(2) : 0;
    const ltv = +(c.avg_ticket * c.repeat_visits).toFixed(2);
    const roi = cac > 0 ? +(ltv / cac).toFixed(2) : 0;
    const revenue = +(customers * ltv).toFixed(2);

    const { error } = await supabase.from("marketing_campaigns").insert({
      ...c,
      customer_cac: cac,
      customer_ltv: ltv,
      roi_multiple: roi,
      revenue_attributed: revenue,
    });

    if (error) {
      console.log("ERROR:", c.name, error.message);
    } else {
      console.log("OK:", c.name, `$${spend} spend → ${customers} customers → ${roi}x ROI`);
    }
  }

  console.log(`\nDone. ${campaigns.length} campaigns seeded.`);
}

seed();
