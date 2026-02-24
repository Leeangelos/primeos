/**
 * Tier configuration for PrimeOS billing and tier-gated navigation.
 * Used to determine which routes are included in each plan and the minimum tier required for a route.
 */

export const TIERS = {
  free: {
    name: "Free",
    price: 0,
    routes: ["/", "/daily", "/weekly", "/monthly", "/training", "/billing", "/terms", "/privacy"],
  },
  starter: {
    name: "Starter",
    price: 79,
    routes: ["/", "/daily", "/weekly", "/monthly", "/training", "/billing", "/terms", "/privacy", "/brief", "/pnl", "/schedule"],
  },
  operator: {
    name: "Operator",
    price: 149,
    routes: [
      "/",
      "/daily",
      "/weekly",
      "/monthly",
      "/training",
      "/billing",
      "/terms",
      "/privacy",
      "/brief",
      "/pnl",
      "/schedule",
      "/recipes",
      "/inventory",
      "/invoices",
      "/menu-intelligence",
      "/vendor-tracker",
      "/sales",
      "/actual-pnl",
      "/tasks",
      "/chat",
    ],
  },
  owner: {
    name: "Owner",
    price: 249,
    routes: [
      "/",
      "/daily",
      "/weekly",
      "/monthly",
      "/training",
      "/billing",
      "/terms",
      "/privacy",
      "/brief",
      "/pnl",
      "/schedule",
      "/recipes",
      "/inventory",
      "/invoices",
      "/sales",
      "/actual-pnl",
      "/tasks",
      "/chat",
      "/people",
      "/marketing",
      "/doordash",
      "/parties",
      "/hiring",
      "/local-intel",
      "/merch",
      "/rolodex",
    ],
  },
  enterprise: {
    name: "Enterprise",
    price: null,
    routes: ["*"],
  },
} as const;

/**
 * Returns the minimum tier key needed for a given route.
 */
export function getRequiredTier(route: string): string {
  if ((TIERS.free.routes as readonly string[]).includes(route)) return "free";
  if ((TIERS.starter.routes as readonly string[]).includes(route)) return "starter";
  if ((TIERS.operator.routes as readonly string[]).includes(route)) return "operator";
  if ((TIERS.owner.routes as readonly string[]).includes(route)) return "owner";
  return "enterprise";
}

/**
 * Returns the display name for a tier key.
 */
export function getTierLabel(tierKey: string): string {
  const tier = TIERS[tierKey as keyof typeof TIERS];
  return tier?.name ?? "Enterprise";
}
