import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Parser from "rss-parser";

const RSS_SOURCES = [
  { name: "PMQ Pizza Magazine", url: "https://www.pmq.com/feed" },
  { name: "Pizza Marketplace", url: "https://www.pizzamarketplace.com/rss" },
  { name: "Nation's Restaurant News", url: "https://nrn.com/rss.xml" },
];

const INCLUDE_KEYWORDS = [
  "food cost",
  "labor",
  "delivery",
  "doordash",
  "uber eats",
  "grubhub",
  "cheese",
  "dough",
  "ingredient",
  "pricing",
  "margin",
  "profit",
  "operator",
  "franchisee",
  "technology",
  "pos",
  "marketing",
  "social media",
  "staffing",
  "minimum wage",
  "supply chain",
  "inflation",
  "menu",
  "pizza",
  "restaurant",
  "takeout",
  "carryout",
  "tip",
  "wage",
  "health department",
  "inspection",
  "food safety",
  "online ordering",
  "catering",
  "loyalty",
  "review",
  "google",
  "yelp",
  "ai",
  "automation",
  "scheduling",
  "overtime",
  "training",
  "retention",
  "hiring",
  "turnover",
  "franchise",
  "independent",
  "small business",
  "cost",
  "revenue",
  "sales",
  "growth",
];

const EXCLUDE_PATTERNS = [
  /domino.s\s+(corporate|headquarters|ceo|stock|earnings)/i,
  /pizza\s+hut\s+(corporate|headquarters|ceo|stock|earnings)/i,
  /papa\s+john.s\s+(corporate|headquarters|ceo|stock|earnings)/i,
  /little\s+caesars?\s+(corporate|headquarters|ceo|stock|earnings)/i,
  /sponsored\s+content/i,
];

function scoreRelevance(title: string, description: string): number {
  const text = `${title} ${description}`.toLowerCase();
  for (const pattern of EXCLUDE_PATTERNS) {
    if (pattern.test(text)) return 0;
  }
  let score = 0;
  for (const keyword of INCLUDE_KEYWORDS) {
    if (text.includes(keyword.toLowerCase())) score += 10;
  }
  const bonusTerms = [
    "independent",
    "operator",
    "small business",
    "single unit",
    "pizzeria owner",
  ];
  for (const bonus of bonusTerms) {
    if (text.includes(bonus)) score += 15;
  }
  return Math.min(score, 100);
}

function mapContentType(title: string, description: string): string {
  const text = `${title} ${description}`.toLowerCase();
  if (text.match(/study|research|data|survey|report|percent|statistics/))
    return "didyouknow";
  if (text.match(/trend|growing|rise|surge|popular|future|forecast/))
    return "trending";
  if (text.match(/owner|operator|story|interview|profile|journey/)) return "story";
  if (text.match(/cost|price|margin|math|calculate|save|revenue/)) return "math";
  return "scoop";
}

function getActionableTip(title: string, description: string): string {
  const text = `${title} ${description}`.toLowerCase();
  if (
    text.match(
      /food cost|cheese|dough|ingredient|supply chain|inflation/
    )
  ) {
    return "Consider reviewing your current food costs against this week's market prices. Small shifts in commodity prices can compound quickly.";
  }
  if (
    text.match(
      /labor|staffing|wage|hiring|retention|overtime|scheduling/
    )
  ) {
    return "Consider auditing your schedule against your SLPH benchmark this week. Labor is the one cost you can adjust in real time.";
  }
  if (text.match(/delivery|doordash|uber eats|grubhub|commission/)) {
    return "Consider pulling your delivery economics report to see how platform fees are affecting your net margin per order.";
  }
  if (
    text.match(
      /marketing|social media|promotion|advertising|campaign/
    )
  ) {
    return "Consider tracking which marketing channels are actually driving orders — not just impressions, but cost per acquisition.";
  }
  if (
    text.match(
      /technology|pos|ai|automation|online ordering/
    )
  ) {
    return "Consider whether this technology could reduce a manual process in your operation. The best tech investments save labor hours.";
  }
  if (text.match(/review|reputation|google|yelp|rating/)) {
    return "Consider checking your latest reviews today. A single professional response to a negative review can influence hundreds of future customers.";
  }
  if (text.match(/menu|pricing|price increase|menu engineering/)) {
    return "Consider running a menu mix analysis to see which items are driving margin and which are dead weight.";
  }
  if (
    text.match(
      /inspection|health department|food safety|violation/
    )
  ) {
    return "Consider running through the Pre-Inspection Checklist in your Inspection Radar. Five minutes of prevention beats a violation every time.";
  }
  return "Consider how this applies to your operation. The operators who stay informed adapt faster when conditions change.";
}

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: "Missing Supabase config" }, {
      status: 500,
    });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const parser = new Parser({
    timeout: 10000,
    headers: {
      "User-Agent": "PrimeOS/1.0 (RSS Reader; https://getprimeos.com)",
    },
  });

  const results: Array<{
    source_name: string;
    source_url: string;
    title: string;
    summary: string;
    published_at: string;
    fetched_at: string;
    relevance_score: number;
    content_type: string;
    actionable_tip: string;
    is_active: boolean;
  }> = [];
  const errors: string[] = [];

  for (const source of RSS_SOURCES) {
    try {
      const feed = await parser.parseURL(source.url);
      const items = (feed.items || []).slice(0, 10);
      for (const item of items) {
        const title = item.title || "";
        const description =
          item.contentSnippet || item.content || item.summary || "";
        const summary = description.replace(/<[^>]*>/g, "").slice(0, 280);
        const score = scoreRelevance(title, summary);
        if (score < 10) continue;
        const link = item.link || "";
        results.push({
          source_name: source.name,
          source_url: link,
          title,
          summary,
          published_at: item.pubDate
            ? new Date(item.pubDate).toISOString()
            : new Date().toISOString(),
          fetched_at: new Date().toISOString(),
          relevance_score: score,
          content_type: mapContentType(title, summary),
          actionable_tip: getActionableTip(title, summary),
          is_active: true,
        });
      }
    } catch (err: unknown) {
      errors.push(
        `${source.name}: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  results.sort((a, b) => b.relevance_score - a.relevance_score);
  const topArticles = results.slice(0, 8);

  if (topArticles.length > 0) {
    const cutoff = new Date(
      Date.now() - 48 * 60 * 60 * 1000
    ).toISOString();
    await supabase
      .from("daily_edge_live_content")
      .update({ is_active: false })
      .lt("fetched_at", cutoff);

    for (const article of topArticles) {
      await supabase.from("daily_edge_live_content").upsert(article, {
        onConflict: "source_url",
      });
    }
  }

  return NextResponse.json({
    success: true,
    fetched: topArticles.length,
    errors: errors.length > 0 ? errors : undefined,
    articles: topArticles.map((a) => ({
      title: a.title,
      source: a.source_name,
      score: a.relevance_score,
    })),
  });
}

export async function GET(request: Request) {
  return POST(request);
}
