import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(url, key);

async function getStoreId(slug: string): Promise<string | null> {
  const { data } = await supabase.from("stores").select("id").eq("slug", slug).single();
  return data?.id || null;
}

function rand(min: number, max: number): number {
  return +(min + Math.random() * (max - min)).toFixed(2);
}

function randInt(min: number, max: number): number {
  return Math.floor(min + Math.random() * (max - min + 1));
}

async function seed() {
  const kent = await getStoreId("kent");
  const aurora = await getStoreId("aurora");
  const lindseys = await getStoreId("lindseys");

  if (!kent || !aurora || !lindseys) {
    console.log("Missing store IDs:", { kent, aurora, lindseys });
    return;
  }

  const stores = [
    { id: kent, name: "Kent", salesRange: [280, 650], ordersRange: [12, 28], adRange: [15, 45] },
    { id: aurora, name: "Aurora", salesRange: [220, 520], ordersRange: [10, 22], adRange: [10, 35] },
    { id: lindseys, name: "Lindsey's", salesRange: [380, 850], ordersRange: [16, 35], adRange: [20, 55] },
  ];

  let count = 0;
  const commPct = 25;

  // Last 30 days
  for (let d = 0; d < 30; d++) {
    const date = new Date();
    date.setDate(date.getDate() - d);
    const dateStr = date.toISOString().slice(0, 10);
    const dow = date.getDay();

    for (const store of stores) {
      // Weekend boost
      const multiplier = dow === 5 || dow === 6 ? 1.4 : dow === 0 ? 1.2 : 1.0;
      const gross = +(rand(store.salesRange[0], store.salesRange[1]) * multiplier).toFixed(2);
      const orders = Math.round(randInt(store.ordersRange[0], store.ordersRange[1]) * multiplier);
      const adSpend = rand(store.adRange[0], store.adRange[1]);
      const tips = +(orders * rand(1.5, 3.5)).toFixed(2);
      const errors = Math.random() < 0.15 ? rand(8, 35) : 0;

      const fees = +(gross * commPct / 100).toFixed(2);
      const netAfterFees = +(gross - fees - errors).toFixed(2);
      const trueProfit = +(netAfterFees - adSpend).toFixed(2);
      const avgTicket = orders > 0 ? +(gross / orders).toFixed(2) : 0;

      const { error } = await supabase.from("doordash_daily").insert({
        store_id: store.id,
        business_date: dateStr,
        gross_sales: gross,
        doordash_commission_pct: commPct,
        doordash_fees: fees,
        net_after_fees: netAfterFees,
        order_count: orders,
        avg_ticket: avgTicket,
        tips,
        errors_refunds: errors,
        ad_spend: adSpend,
        true_profit: trueProfit,
        walkin_equivalent: gross,
      });

      if (error) {
        console.log("ERROR:", store.name, dateStr, error.message);
      } else {
        count++;
      }
    }
  }

  console.log(`Done. ${count} DoorDash daily entries seeded across 30 days × 3 stores.`);
}

seed();
