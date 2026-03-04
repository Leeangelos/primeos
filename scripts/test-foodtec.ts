import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

// Load .env.local if present (local run); Vercel/CI use process.env
const envLocal = resolve(process.cwd(), ".env.local");
if (existsSync(envLocal)) {
  const content = readFileSync(envLocal, "utf-8");
  for (const line of content.split("\n")) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (m && !process.env[m[1]]) {
      const val = m[2].replace(/^["']|["']$/g, "").trim();
      process.env[m[1]] = val;
    }
  }
}

const token =
  process.env.FOODTEC_TOKEN_KENT ?? process.env.FOODTEC_API_TOKEN ?? "";

const CHAINS = [
  { name: "Kent", url: "https://leeangelos-kent.foodtecsolutions.com" },
  { name: "Aurora", url: "https://leeangelos-aurora.foodtecsolutions.com" },
  { name: "Lindsey's", url: "https://lindseyspizzeria.foodtecsolutions.com" },
];

const TEST_DAY = "03/03/26";

async function fetchView(
  baseUrl: string,
  view: string,
  day: string
): Promise<{ ok: boolean; status: number; text: string }> {
  const url = `${baseUrl}/ExportView?view=${view}&day=${day}`;
  const res = await fetch(url, {
    headers: { "X-DATA-EXPORTS-TOKEN": token },
  });
  const text = await res.text();
  return { ok: res.ok, status: res.status, text };
}

function firstThreeLines(text: string): string {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  return lines.slice(0, 3).join("\n");
}

function rowCount(text: string): number {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  return Math.max(0, lines.length - 1); // minus header
}

async function main() {
  console.log("=== FoodTec API diagnostic ===\n");
  if (!token) {
    console.log("Missing FOODTEC_TOKEN_KENT or FOODTEC_API_TOKEN in env.");
    process.exit(1);
  }

  for (const chain of CHAINS) {
    console.log(`\n--- ${chain.name} (${chain.url}) ---`);
    const result = await fetchView(chain.url, "order", TEST_DAY);
    if (result.ok) {
      const rows = rowCount(result.text);
      console.log(`Rows returned: ${rows}`);
      console.log("First 3 lines:");
      console.log(firstThreeLines(result.text));
    } else {
      console.log(`Error: HTTP ${result.status}`);
      console.log(result.text.slice(0, 500));
    }
  }

  console.log("\n--- Kent labor view ---");
  const labor = await fetchView(
    "https://leeangelos-kent.foodtecsolutions.com",
    "labor",
    TEST_DAY
  );
  if (labor.ok) {
    console.log("First 3 lines:");
    console.log(firstThreeLines(labor.text));
  } else {
    console.log(`Error: HTTP ${labor.status}`);
    console.log(labor.text.slice(0, 500));
  }

  console.log("\nDone.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
