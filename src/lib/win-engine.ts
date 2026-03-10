"use client";

/**
 * Win Notifications engine — detects and surfaces operator progress.
 * Compares current week vs previous week (future: real data from FoodTec).
 * SEED_WINS is intentionally empty — real wins come from live data.
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

export const SEED_WINS: Win[] = [];
