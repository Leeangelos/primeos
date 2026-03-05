import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const TOKEN = process.env.FOODTEC_API_TOKEN;
if (!TOKEN) { console.log("Missing FOODTEC_API_TOKEN"); process.exit(1); }

const BASE = "https://ambitionnlegacy.foodtecsolutions.com/ExportView";
const DAY = "03/04/26";
const VIEWS = ["order", "labor", "product"];

async function run() {
  console.log("=== FOODTEC API DIAGNOSTIC SUMMARY ===\n");

  for (const view of VIEWS) {
    const url = `${BASE}?view=${view}&day=${DAY}`;
    try {
      const res = await fetch(url, { headers: { "X-DATA-EXPORTS-TOKEN": TOKEN! } });
      if (!res.ok) {
        console.log(`${view.toUpperCase()} VIEW: HTTP ${res.status} ERROR\n`);
        continue;
      }
      const text = await res.text();
      const lines = text.trim().split("\n");
      const header = lines[0].split("\t");
      const dataRows = lines.slice(1);
      const storeCounts: Record<string, number> = {};
      dataRows.forEach(row => {
        const store = row.split("\t")[0] || "unknown";
        storeCounts[store] = (storeCounts[store] || 0) + 1;
      });
      console.log(`${view.toUpperCase()} VIEW (${DAY}):`);
      console.log(`  Status: ${res.status}`);
      console.log(`  Total rows: ${dataRows.length}`);
      console.log(`  Stores: ${Object.keys(storeCounts).join(", ")}`);
      console.log(`  Per store: ${Object.entries(storeCounts).map(([s,c]) => `${s}: ${c}`).join(", ")}`);
      if (view === "order") {
        const netIdx = header.findIndex(h => h.toLowerCase() === "net");
        if (netIdx >= 0) {
          let total = 0;
          dataRows.forEach(row => { total += parseFloat(row.split("\t")[netIdx]) || 0; });
          console.log(`  Total net sales: $${total.toFixed(2)}`);
        }
      }
      if (view === "labor") {
        const hoursIdx = header.findIndex(h => h.toLowerCase() === "regularhours");
        const nameIdx = header.findIndex(h => h.toLowerCase() === "name");
        const uniqueNames = new Set<string>();
        let totalHours = 0;
        dataRows.forEach(row => {
          const cols = row.split("\t");
          if (nameIdx >= 0) uniqueNames.add(cols[nameIdx]);
          if (hoursIdx >= 0) totalHours += parseFloat(cols[hoursIdx]) || 0;
        });
        console.log(`  Unique employees: ${uniqueNames.size}`);
        console.log(`  Total regular hours: ${totalHours.toFixed(1)}`);
      }
      if (view === "product") {
        const itemIdx = header.findIndex(h => h.toLowerCase() === "item");
        const qtyIdx = header.findIndex(h => h.toLowerCase() === "quantity");
        const itemQty: Record<string, number> = {};
        dataRows.forEach(row => {
          const cols = row.split("\t");
          const item = itemIdx >= 0 ? cols[itemIdx] : "unknown";
          const qty = qtyIdx >= 0 ? parseFloat(cols[qtyIdx]) || 0 : 0;
          itemQty[item] = (itemQty[item] || 0) + qty;
        });
        const top5 = Object.entries(itemQty).sort((a, b) => b[1] - a[1]).slice(0, 5);
        console.log(`  Top 5 items: ${top5.map(([i, q]) => `${i}: ${q}`).join(", ")}`);
      }
      console.log("");
    } catch (err: any) {
      console.log(`${view.toUpperCase()} VIEW: ERROR - ${err.message}\n`);
    }
  }
  console.log("=== END DIAGNOSTIC ===");
}

run();
