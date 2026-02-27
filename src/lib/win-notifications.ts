import { SEED_DAILY_KPIS, SEED_REPUTATION_KPIS_BY_STORE, SEED_WEEKLY_COCKPIT } from "@/src/lib/seed-data";

export type WinNotification = {
  id: string;
  metric: string;
  title: string;
  message: string;
  emoji: string;
};

type MetricKey =
  | "food_cost_pct"
  | "labor_pct"
  | "prime_pct"
  | "google_rating"
  | "response_rate"
  | "rplh";

type StoreSlug = "kent" | "aurora" | "lindseys" | "all";

function normalizeStoreId(storeId: string): StoreSlug {
  if (storeId === "aurora" || storeId === "lindseys" || storeId === "all") return storeId;
  return "kent";
}

function getLatestDailyForStore(storeId: StoreSlug) {
  const id = storeId === "all" ? "kent" : storeId;
  const rows = SEED_DAILY_KPIS.filter((r) => r.store_id === id);
  if (!rows.length) return null;
  const sorted = [...rows].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  return sorted[0];
}

function getLatestWeeklyForStore(storeId: StoreSlug) {
  const id = storeId === "all" ? "kent" : storeId;
  const rows = SEED_WEEKLY_COCKPIT.filter((r) => r.store_id === id);
  if (!rows.length) return null;
  const sorted = [...rows].sort((a, b) => (a.week_start < b.week_start ? 1 : a.week_start > b.week_start ? -1 : 0));
  return sorted[0];
}

type RawMetrics = {
  food_cost_pct: number | null;
  labor_pct: number | null;
  prime_pct: number | null;
  google_rating: number | null;
  response_rate: number | null;
  rplh: number | null;
};

function getRawMetricsForStore(storeId: StoreSlug): RawMetrics {
  const daily = getLatestDailyForStore(storeId);
  const weekly = getLatestWeeklyForStore(storeId);
  const rep = SEED_REPUTATION_KPIS_BY_STORE[storeId === "all" ? "kent" : storeId];

  const food_cost_pct = daily?.food_cost_pct ?? null;
  const labor_pct = daily?.labor_pct ?? null;
  const prime_pct =
    daily && typeof daily.food_cost_pct === "number" && typeof daily.labor_pct === "number"
      ? 100 - daily.food_cost_pct - daily.labor_pct
      : daily?.prime_pct ?? null;

  const rplh = weekly?.slph ?? daily?.slph ?? null;
  const google_rating = rep ? 4.3 + (storeId === "kent" ? 0.3 : storeId === "aurora" ? 0.2 : 0.0) : null;
  const response_rate = rep?.responseRatePct ?? null;

  return { food_cost_pct, labor_pct, prime_pct, google_rating, response_rate, rplh };
}

type ConditionFn = (metrics: RawMetrics) => { active: boolean; value?: number };

type WinDefinition = {
  id: string;
  metric: MetricKey;
  title: string;
  messageTemplate: string;
  emoji: string;
  condition: ConditionFn;
};

function rounded(value: number | undefined | null): number {
  if (value == null || Number.isNaN(value)) return 0;
  return Math.round(value * 10) / 10;
}

const WIN_DEFINITIONS: WinDefinition[] = [
  {
    id: "food_cost_under_30",
    metric: "food_cost_pct",
    title: "Food Cost Under 30%",
    messageTemplate: "Food cost at {value}% today. That's a win. Keep doing what you're doing.",
    emoji: "🏆",
    condition: (m) => {
      if (m.food_cost_pct == null) return { active: false };
      return { active: m.food_cost_pct <= 30, value: rounded(m.food_cost_pct) };
    },
  },
  {
    id: "food_cost_under_33",
    metric: "food_cost_pct",
    title: "Food Cost In The Zone",
    messageTemplate: "Food cost at {value}%. Right where you want it. Tight operation.",
    emoji: "💪",
    condition: (m) => {
      if (m.food_cost_pct == null) return { active: false };
      return { active: m.food_cost_pct > 30 && m.food_cost_pct <= 33, value: rounded(m.food_cost_pct) };
    },
  },
  {
    id: "labor_under_28",
    metric: "labor_pct",
    title: "Labor Locked In",
    messageTemplate: "Labor at {value}%. Your schedule is dialed. That's money in the bank.",
    emoji: "🔥",
    condition: (m) => {
      if (m.labor_pct == null) return { active: false };
      return { active: m.labor_pct <= 28, value: rounded(m.labor_pct) };
    },
  },
  {
    id: "prime_above_60",
    metric: "prime_pct",
    title: "PRIME Above 60%",
    messageTemplate: "PRIME at {value}%. You're running clean. This is what control looks like.",
    emoji: "🔥",
    condition: (m) => {
      if (m.prime_pct == null) return { active: false };
      return { active: m.prime_pct >= 60, value: rounded(m.prime_pct) };
    },
  },
  {
    id: "prime_above_55",
    metric: "prime_pct",
    title: "PRIME Holding Strong",
    messageTemplate: "PRIME at {value}%. Solid ground. Keep the pressure on food and labor.",
    emoji: "💪",
    condition: (m) => {
      if (m.prime_pct == null) return { active: false };
      return { active: m.prime_pct >= 55 && m.prime_pct < 60, value: rounded(m.prime_pct) };
    },
  },
  {
    id: "google_rating_above_4_5",
    metric: "google_rating",
    title: "Rating Above 4.5 Stars",
    messageTemplate: "Google rating at {value} stars. The work is showing. Customers notice.",
    emoji: "⭐",
    condition: (m) => {
      if (m.google_rating == null) return { active: false };
      return { active: m.google_rating >= 4.5, value: rounded(m.google_rating) };
    },
  },
  {
    id: "response_rate_above_80",
    metric: "response_rate",
    title: "Response Rate Above 80%",
    messageTemplate: "You're responding to {value}% of reviews. That builds trust. Keep it up.",
    emoji: "💬",
    condition: (m) => {
      if (m.response_rate == null) return { active: false };
      return { active: m.response_rate >= 80, value: rounded(m.response_rate) };
    },
  },
  {
    id: "rplh_above_45",
    metric: "rplh",
    title: "Revenue Per Labor Hour Above $45",
    messageTemplate: "RPLH at ${value}. Every hour on the schedule is earning. Efficient operation.",
    emoji: "📈",
    condition: (m) => {
      if (m.rplh == null) return { active: false };
      return { active: m.rplh >= 45, value: rounded(m.rplh) };
    },
  },
];

export function getWinsForStore(storeId: string): WinNotification[] {
  const slug = normalizeStoreId(storeId);
  const metrics = getRawMetricsForStore(slug);

  const winsByMetric = new Map<MetricKey, WinNotification>();

  for (const def of WIN_DEFINITIONS) {
    const { active, value } = def.condition(metrics);
    if (!active) continue;

    const existing = winsByMetric.get(def.metric);
    if (existing) continue;

    const formattedValue =
      def.metric === "rplh" ? (value != null ? value.toFixed(1) : "") : value != null ? value.toString() : "";
    const message = def.messageTemplate.replace("{value}", formattedValue);

    winsByMetric.set(def.metric, {
      id: def.id,
      metric: def.metric,
      title: def.title,
      message,
      emoji: def.emoji,
    });
  }

  return Array.from(winsByMetric.values());
}

