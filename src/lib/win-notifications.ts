export type WinNotification = {
  id: string;
  title: string;
  message: string;
  emoji: string;
  metric?: string;
};

// Legacy client usage on the dashboard calls this synchronously.
// To avoid fake wins, we return an empty list here; real win detection
// should be done via live-data aware helpers or API routes.
export function getWinsForStore(_storeId: string): WinNotification[] {
  return [];
}

const STORE_NAMES: Record<string, string> = {
  kent: "Kent",
  aurora: "Aurora",
  lindseys: "Lindsey's",
};

/**
 * Live win detection helper using me_daily_purchases.
 * For each store, if 7-day rolling food cost % is below 32%,
 * generate: "Food cost within target — [store name]".
 */
export async function getRollingFoodCostWins(
  fetcher: (storeId: string) => Promise<{ foodSpend: number; totalSpend: number } | null>
): Promise<WinNotification[]> {
  const storeIds = Object.keys(STORE_NAMES);
  const wins: WinNotification[] = [];

  for (const storeId of storeIds) {
    const agg = await fetcher(storeId);
    if (!agg || agg.totalSpend <= 0) continue;
    const pct = (agg.foodSpend / agg.totalSpend) * 100;
    if (pct < 32) {
      wins.push({
        id: `food_cost_within_target_${storeId}`,
        metric: "food_cost_pct",
        title: "Food cost within target",
        message: `Food cost within target — ${STORE_NAMES[storeId]}`,
        emoji: "🏆",
      });
    }
  }

  return wins;
}
