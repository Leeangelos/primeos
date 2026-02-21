import { NextRequest, NextResponse } from "next/server";
import { getClientForRoute } from "@/lib/supabase";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function GET(req: NextRequest) {
  const dateParam = req.nextUrl.searchParams.get("date");
  const today = dateParam || new Date().toISOString().slice(0, 10);

  // Get yesterday for comparison
  const yesterday = new Date(today + "T12:00:00Z");
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);

  const supabase = await getClientForRoute();

  // Fetch all stores
  const { data: stores } = await supabase
    .from("stores")
    .select("id, slug, name")
    .in("slug", ["kent", "aurora", "lindseys"]);

  if (!stores || stores.length === 0) {
    return NextResponse.json({ ok: false, error: "No stores found" });
  }

  // Fetch today's and yesterday's KPIs for all stores
  const storeData: Record<string, any> = {};

  for (const store of stores) {
    const { data: todayKpi } = await supabase
      .from("daily_kpis")
      .select("*")
      .eq("store_id", store.id)
      .eq("business_date", today)
      .single();

    const { data: yesterdayKpi } = await supabase
      .from("daily_kpis")
      .select("*")
      .eq("store_id", store.id)
      .eq("business_date", yesterdayStr)
      .single();

    // Fetch last 7 days for trend
    const weekAgo = new Date(today + "T12:00:00Z");
    weekAgo.setUTCDate(weekAgo.getUTCDate() - 7);
    const { data: weekData } = await supabase
      .from("daily_kpis")
      .select("business_date, net_sales, labor_dollars, food_dollars, disposables_dollars, labor_hours")
      .eq("store_id", store.id)
      .gte("business_date", weekAgo.toISOString().slice(0, 10))
      .lte("business_date", today)
      .order("business_date", { ascending: true });

    storeData[store.name] = {
      slug: store.slug,
      today: todayKpi,
      yesterday: yesterdayKpi,
      weekTrend: weekData || [],
    };
  }

  // Build the prompt
  const storeSummaries = Object.entries(storeData).map(([name, d]: [string, any]) => {
    const t = d.today;
    if (!t) return `${name}: No data entered for ${today}.`;

    const sales = t.net_sales ?? 0;
    const labor = t.labor_dollars ?? 0;
    const food = t.food_dollars ?? 0;
    const disp = t.disposables_dollars ?? 0;
    const hours = t.labor_hours ?? 0;
    const prime = sales > 0 ? ((labor + food + disp) / sales * 100).toFixed(1) : "N/A";
    const laborPct = sales > 0 ? (labor / sales * 100).toFixed(1) : "N/A";
    const foodPct = sales > 0 ? (food / sales * 100).toFixed(1) : "N/A";
    const slph = hours > 0 ? (sales / hours).toFixed(0) : "N/A";

    let comparison = "";
    if (d.yesterday) {
      const ySales = d.yesterday.net_sales ?? 0;
      const yLabor = d.yesterday.labor_dollars ?? 0;
      const yFood = d.yesterday.food_dollars ?? 0;
      const yDisp = d.yesterday.disposables_dollars ?? 0;
      const yPrime = ySales > 0 ? ((yLabor + yFood + yDisp) / ySales * 100).toFixed(1) : "N/A";
      comparison = ` Yesterday's PRIME was ${yPrime}%.`;
    }

    // Check for multi-day trends
    let trend = "";
    if (d.weekTrend.length >= 3) {
      const lastThree = d.weekTrend.slice(-3);
      const foodPcts = lastThree.map((day: any) => {
        const s = day.net_sales ?? 0;
        const f = day.food_dollars ?? 0;
        return s > 0 ? (f / s * 100) : 0;
      });
      const allHigh = foodPcts.every((p: number) => p > 33);
      if (allHigh) {
        trend = ` Food cost has been above 33% for 3+ days — check portioning.`;
      }
    }

    return `${name}: Sales $${sales.toLocaleString()}, PRIME ${prime}%, Labor ${laborPct}%, Food ${foodPct}%, SLPH ${slph}.${comparison}${trend}${t.notes ? ` Notes: ${t.notes}` : ""}`;
  }).join("\n");

  const prompt = `You are the Morning Brief writer for PrimeOS, an operating system for pizzeria operators. Write a brief, plain-English summary of yesterday's operations for an independent pizza shop owner named Angelo who runs 3 locations.

Here is the data for ${today}:

${storeSummaries}

RULES:
- Write like a sharp business partner texting Angelo at 6:45 AM — casual but precise
- Lead with the headline: what needs attention RIGHT NOW
- Call out any red flags: PRIME over 55%, labor over 24%, food cost over 33%, SLPH below 65
- Mention wins too — any store that's on track deserves a callout
- Reference specific numbers and stores by name
- If there's a multi-day trend (like food cost creeping up), flag it clearly
- Keep it under 150 words
- No bullet points — flowing sentences, like a text message
- End with one specific action item for today
- Do NOT use greetings like "Good morning" or sign-offs`;

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 300,
      messages: [{ role: "user", content: prompt }],
    });

    const briefText = message.content[0].type === "text" ? message.content[0].text : "";

    return NextResponse.json({
      ok: true,
      date: today,
      brief: briefText,
      storeData: Object.fromEntries(
        Object.entries(storeData).map(([name, d]: [string, any]) => {
          const t = d.today;
          if (!t) return [name, null];
          const sales = t.net_sales ?? 0;
          const labor = t.labor_dollars ?? 0;
          const food = t.food_dollars ?? 0;
          const disp = t.disposables_dollars ?? 0;
          const hours = t.labor_hours ?? 0;
          return [name, {
            sales,
            primePct: sales > 0 ? +((labor + food + disp) / sales * 100).toFixed(1) : null,
            laborPct: sales > 0 ? +(labor / sales * 100).toFixed(1) : null,
            foodPct: sales > 0 ? +(food / sales * 100).toFixed(1) : null,
            slph: hours > 0 ? +(sales / hours).toFixed(0) : null,
          }];
        })
      ),
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message || "Claude API error" });
  }
}
