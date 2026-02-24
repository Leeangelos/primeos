export interface Competitor {
  id: string;
  store_id: string;
  name: string;
  address: string;
  website: string;
  phone: string;
  category: string;
  distance_miles: number;
  google_rating: number;
  google_review_count: number;
  price_large_cheese: number | null;
  price_large_pepperoni: number | null;
  notes: string;
}

export interface CompetitorAlert {
  id: string;
  store_id: string;
  type: "new_opening" | "price_change" | "rating_drop" | "trend" | "opportunity";
  title: string;
  message: string;
  created_at: string;
  icon_color: string;
}

export const COMPETITORS: Competitor[] = [
  { id: "comp-k1", store_id: "kent", name: "Ray's Place", address: "135 E Erie St, Kent, OH 44240", website: "raysplacekent.com", phone: "(330) 673-2233", category: "Bar & Pizza", distance_miles: 0.3, google_rating: 4.3, google_review_count: 1847, price_large_cheese: 16.99, price_large_pepperoni: 19.99, notes: "Kent State staple. Late night crowd. Strong bar revenue." },
  { id: "comp-k2", store_id: "kent", name: "Pizza Hut", address: "1096 S Water St, Kent, OH 44240", website: "pizzahut.com", phone: "(330) 673-6060", category: "Chain Pizza", distance_miles: 1.2, google_rating: 3.6, google_review_count: 412, price_large_cheese: 13.99, price_large_pepperoni: 15.99, notes: "National chain pricing. Heavy delivery. Aggressive online deals." },
  { id: "comp-k3", store_id: "kent", name: "Domino's Pizza", address: "310 S Water St, Kent, OH 44240", website: "dominos.com", phone: "(330) 678-1010", category: "Chain Pizza", distance_miles: 0.8, google_rating: 3.9, google_review_count: 287, price_large_cheese: 12.99, price_large_pepperoni: 14.99, notes: "Delivery focused. Mix-and-match deals." },
  { id: "comp-k4", store_id: "kent", name: "Papa John's", address: "1590 S Water St, Kent, OH 44240", website: "papajohns.com", phone: "(330) 678-7272", category: "Chain Pizza", distance_miles: 1.5, google_rating: 3.7, google_review_count: 198, price_large_cheese: 14.99, price_large_pepperoni: 17.49, notes: "BOGO deals. Delivery focused." },
  { id: "comp-k5", store_id: "kent", name: "Belleria Pizza", address: "1076 N Mantua St, Kent, OH 44240", website: "", phone: "(330) 678-0017", category: "Independent Pizza", distance_miles: 2.1, google_rating: 4.4, google_review_count: 523, price_large_cheese: 17.5, price_large_pepperoni: 20.5, notes: "Local favorite. Thick crust specialty. Dine-in focused." },

  { id: "comp-a1", store_id: "aurora", name: "Rosetta's Italian Restaurant", address: "106 E Garfield Rd, Aurora, OH 44202", website: "", phone: "(330) 562-5050", category: "Italian Restaurant", distance_miles: 0.5, google_rating: 4.5, google_review_count: 892, price_large_cheese: 18.5, price_large_pepperoni: 21.5, notes: "Full Italian menu. Higher price point. Dine-in ambiance." },
  { id: "comp-a2", store_id: "aurora", name: "Moe's Pizza", address: "33 E Garfield Rd, Aurora, OH 44202", website: "", phone: "(330) 995-0053", category: "Independent Pizza", distance_miles: 0.4, google_rating: 4.2, google_review_count: 341, price_large_cheese: 16.99, price_large_pepperoni: 19.99, notes: "Similar menu. Price competitive." },
  { id: "comp-a3", store_id: "aurora", name: "Domino's Pizza", address: "28 E Garfield Rd, Aurora, OH 44202", website: "dominos.com", phone: "(330) 562-0099", category: "Chain Pizza", distance_miles: 0.3, google_rating: 3.8, google_review_count: 156, price_large_cheese: 12.99, price_large_pepperoni: 14.99, notes: "" },
  { id: "comp-a4", store_id: "aurora", name: "Gionino's Pizzeria", address: "700 N Aurora Rd, Aurora, OH 44202", website: "gioninos.com", phone: "(330) 562-8090", category: "Independent Pizza", distance_miles: 1.8, google_rating: 4.3, google_review_count: 678, price_large_cheese: 15.99, price_large_pepperoni: 18.99, notes: "Northeast Ohio chain. Known for thick crust." },

  { id: "comp-l1", store_id: "lindseys", name: "Guido's Pizza", address: "216 S Chestnut St, Ravenna, OH 44266", website: "", phone: "(330) 296-9009", category: "Independent Pizza", distance_miles: 0.6, google_rating: 4.1, google_review_count: 287, price_large_cheese: 15.5, price_large_pepperoni: 18.5, notes: "Long-standing Ravenna shop. Loyal customer base." },
  { id: "comp-l2", store_id: "lindseys", name: "Domino's Pizza", address: "831 W Main St, Ravenna, OH 44266", website: "dominos.com", phone: "(330) 296-3030", category: "Chain Pizza", distance_miles: 1.0, google_rating: 3.5, google_review_count: 134, price_large_cheese: 12.99, price_large_pepperoni: 14.99, notes: "" },
  { id: "comp-l3", store_id: "lindseys", name: "Marco's Pizza", address: "924 E Main St, Ravenna, OH 44266", website: "marcos.com", phone: "(330) 296-1111", category: "Chain Pizza", distance_miles: 1.4, google_rating: 4.0, google_review_count: 245, price_large_cheese: 14.99, price_large_pepperoni: 17.49, notes: "Growing chain. Good online presence." },
  { id: "comp-l4", store_id: "lindseys", name: "Rocco's Pizza", address: "540 W Main St, Ravenna, OH 44266", website: "", phone: "(330) 296-5252", category: "Independent Pizza", distance_miles: 0.8, google_rating: 4.4, google_review_count: 412, price_large_cheese: 16.99, price_large_pepperoni: 19.99, notes: "Family owned since 1985. Community favorite." },
];

export const COMPETITOR_ALERTS: CompetitorAlert[] = [
  { id: "ca-1", store_id: "kent", type: "trend", title: "3 Competitors on Slice", message: "3 pizza shops within 5 miles of Kent now offer online ordering through Slice. Consider evaluating direct online ordering options to reduce third-party commission.", created_at: new Date(Date.now() - 2 * 86400000).toISOString(), icon_color: "text-blue-400" },
  { id: "ca-2", store_id: "aurora", type: "price_change", title: "Competitors Raising Prices", message: "2 competitors near Aurora recently raised large pizza prices above $20. Your large cheese at $18.99 is now below market. Consider whether a modest price increase is appropriate.", created_at: new Date(Date.now() - 3 * 86400000).toISOString(), icon_color: "text-emerald-400" },
  { id: "ca-3", store_id: "lindseys", type: "new_opening", title: "New Pizza Shop Nearby", message: "A new pizza shop opened 2.3 miles from Lindsey's: 'Portage Pies.' Monitor their Google reviews and menu pricing over the next 90 days.", created_at: new Date(Date.now() - 5 * 86400000).toISOString(), icon_color: "text-amber-400" },
  { id: "ca-4", store_id: "kent", type: "rating_drop", title: "Competitor Rating Dropped", message: "Pizza Hut near Kent dropped below 3.7 stars (now 3.6). Recent reviews mention slow delivery and incorrect orders. This is an opportunity to capture dissatisfied customers with targeted ads.", created_at: new Date(Date.now() - 1 * 86400000).toISOString(), icon_color: "text-emerald-400" },
  { id: "ca-5", store_id: "aurora", type: "opportunity", title: "Loyalty Program Trend", message: "Rosetta's added a loyalty program last month. Their Google reviews mention it 4 times positively. Consider promoting your existing loyalty program more aggressively or launching one if you haven't.", created_at: new Date(Date.now() - 4 * 86400000).toISOString(), icon_color: "text-purple-400" },
  { id: "ca-6", store_id: "kent", type: "opportunity", title: "Belleria Reviews Mention Wait Times", message: "Belleria's last 10 Google reviews mention 30+ minute wait times. If you can promote faster service in your marketing, you may capture their overflow customers.", created_at: new Date(Date.now() - 6 * 86400000).toISOString(), icon_color: "text-emerald-400" },
];

export function getCompetitorsByStore(storeId: string): Competitor[] {
  if (storeId === "all") return COMPETITORS;
  return COMPETITORS.filter((c) => c.store_id === storeId);
}

export function getAlertsByStore(storeId: string): CompetitorAlert[] {
  if (storeId === "all") return COMPETITOR_ALERTS;
  return COMPETITOR_ALERTS.filter((a) => a.store_id === storeId);
}

export function getMarketAvgPrice(storeId: string): { avgCheese: number; avgPepperoni: number; competitorCount: number } {
  const comps = getCompetitorsByStore(storeId).filter((c) => c.price_large_cheese != null && c.price_large_cheese > 0);
  const avgCheese = comps.length ? comps.reduce((sum, c) => sum + (c.price_large_cheese ?? 0), 0) / comps.length : 0;
  const pepComps = comps.filter((c) => c.price_large_pepperoni != null && c.price_large_pepperoni > 0);
  const avgPepperoni = pepComps.length ? pepComps.reduce((sum, c) => sum + (c.price_large_pepperoni ?? 0), 0) / pepComps.length : 0;
  return { avgCheese, avgPepperoni, competitorCount: comps.length };
}
