"use client";

/**
 * Win Notifications engine — detects and surfaces operator progress.
 * Compares current week vs previous week (future: real data from FoodTec).
 * For now exports SEED_WINS for demo. When FoodTec connects, detection functions will generate real wins.
 */

export interface Win {
  id: string;
  type: "improvement" | "streak" | "milestone" | "record";
  metric: string;
  title: string;
  body: string;
  magnitude: "small" | "medium" | "big";
  emoji: string;
  date: string;
  /** Store slug for filtering; "all" = show for any store. Omit = show for all. */
  storeId?: "kent" | "aurora" | "lindseys" | "all";
}

export const SEED_WINS: Win[] = [
  {
    id: "w1",
    type: "improvement",
    metric: "food_cost",
    title: "Food Cost Improving",
    body: "Food cost dropped from 32.1% to 29.8% this week at Kent. That's $890 back in your pocket this month if you hold it.",
    magnitude: "medium",
    emoji: "🔥",
    date: "Today",
    storeId: "kent",
  },
  {
    id: "w2",
    type: "streak",
    metric: "tracking",
    title: "7-Day Tracking Streak",
    body: "You haven't missed a day of data entry in a week. Consistency is how you catch the leaks early.",
    magnitude: "medium",
    emoji: "⚡",
    date: "Today",
    storeId: "all",
  },
  {
    id: "w3",
    type: "improvement",
    metric: "labor",
    title: "Labor Cost Down",
    body: "Labor dropped from 24.2% to 22.8% this week at Aurora. The schedule changes are working.",
    magnitude: "small",
    emoji: "📈",
    date: "Yesterday",
    storeId: "aurora",
  },
  {
    id: "w4",
    type: "record",
    metric: "sales",
    title: "New Sales Record!",
    body: "Lindsey's hit $4,280 on Saturday — your best single day ever at that location. Whatever you did, do it again.",
    magnitude: "big",
    emoji: "👑",
    date: "2 days ago",
    storeId: "lindseys",
  },
  {
    id: "w5",
    type: "milestone",
    metric: "food_cost",
    title: "First Sub-30% Week",
    body: "Kent averaged 29.8% food cost this week — the first time you've broken under 30% for a full week. The portion training is paying off.",
    magnitude: "big",
    emoji: "🏆",
    date: "2 days ago",
    storeId: "kent",
  },
  {
    id: "w6",
    type: "improvement",
    metric: "prime",
    title: "PRIME Cost Improving",
    body: "Combined food + labor (PRIME) dropped from 56.3% to 52.6% across all locations. That's the number that matters most.",
    magnitude: "big",
    emoji: "🚀",
    date: "3 days ago",
    storeId: "all",
  },
  {
    id: "w7",
    type: "streak",
    metric: "food_cost",
    title: "5-Day Food Cost Streak",
    body: "Aurora has been under 31% food cost for 5 straight days. The team is dialed in.",
    magnitude: "medium",
    emoji: "⚡",
    date: "3 days ago",
    storeId: "aurora",
  },
];
