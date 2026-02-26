import { SEED_STORES } from "@/src/lib/seed-data";

export interface ScoopItem {
  id: string;
  type: "scoop" | "didyouknow" | "math" | "story" | "trending";
  title: string;
  body: string;
  detail?: string;
  source?: string;
  sourceUrl?: string;
  date: string;
  readTime: string;
}

function getDaySeed(): number {
  const now = new Date();
  return (
    now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate()
  );
}

function shuffleByDay<T>(arr: T[], seed: number): T[] {
  const shuffled = [...arr];
  let s = seed;
  for (let i = shuffled.length - 1; i > 0; i--) {
    s = (s * 16807 + 0) % 2147483647;
    const j = s % (i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export interface StoreMetrics {
  storeId: string;
  storeName: string;
  todaySales: number;
  yesterdaySales: number;
  weekAvgSales: number;
  foodCostPct: number;
  foodCostPctWeekAvg: number;
  laborCostPct: number;
  laborCostPctWeekAvg: number;
  primePct: number;
  primePctTarget: number;
  laborHoursToday: number;
  laborHoursYesterday: number;
  avgTicket: number;
  avgTicketWeekAvg: number;
  transactionsToday: number;
  transactionsYesterday: number;
  slph: number;
  slphBenchmark: number;
  googleRating: number;
  googleReviewCount: number;
  topSellerName: string;
  topSellerOrders: number;
  deliveryPct: number;
  deliveryNetMargin: number;
  vendorTotalThisWeek: number;
  vendorAvg4Week: number;
  overtimeHoursThisWeek: number;
  scheduledHoursThisWeek: number;
  scheduledHoursLastWeek: number;
}

function getStoreMetrics(storeId: string): StoreMetrics {
  const store = SEED_STORES.find((s) => s.id === storeId);
  const name = store?.name ?? "Your store";
  const daySeed = getDaySeed();
  const variance = ((daySeed % 100) - 50) / 1000;
  const baseSales =
    storeId === "kent" ? 4520 : storeId === "aurora" ? 3890 : 3240;
  const baseFoodCost =
    storeId === "kent" ? 30.2 : storeId === "aurora" ? 32.1 : 31.5;
  const baseLabor =
    storeId === "kent" ? 28.5 : storeId === "aurora" ? 30.8 : 29.2;
  const ticket =
    storeId === "kent" ? 22.4 : storeId === "aurora" ? 20.8 : 19.6;

  return {
    storeId,
    storeName: name,
    todaySales: Math.round(baseSales * (1 + variance)),
    yesterdaySales: Math.round(baseSales * (1 + variance * 0.7)),
    weekAvgSales: baseSales,
    foodCostPct: parseFloat((baseFoodCost + variance * 100).toFixed(1)),
    foodCostPctWeekAvg: baseFoodCost,
    laborCostPct: parseFloat((baseLabor + variance * 80).toFixed(1)),
    laborCostPctWeekAvg: baseLabor,
    primePct: parseFloat(
      (baseFoodCost + baseLabor + 4.2 + variance * 150).toFixed(1)
    ),
    primePctTarget: 60,
    laborHoursToday: storeId === "kent" ? 68 : storeId === "aurora" ? 54 : 48,
    laborHoursYesterday:
      storeId === "kent" ? 72 : storeId === "aurora" ? 52 : 50,
    avgTicket: ticket,
    avgTicketWeekAvg:
      storeId === "kent" ? 21.9 : storeId === "aurora" ? 20.5 : 19.8,
    transactionsToday: Math.round(
      (baseSales * (1 + variance)) / ticket
    ),
    transactionsYesterday: Math.round(
      (baseSales * (1 + variance * 0.7)) / ticket
    ),
    slph: storeId === "kent" ? 66.5 : storeId === "aurora" ? 72.0 : 67.5,
    slphBenchmark: 65,
    googleRating: storeId === "kent" ? 4.4 : storeId === "aurora" ? 4.3 : 4.1,
    googleReviewCount:
      storeId === "kent" ? 130 : storeId === "aurora" ? 89 : 42,
    topSellerName: "Large Pepperoni",
    topSellerOrders: Math.round(38 + (daySeed % 12)),
    deliveryPct: storeId === "kent" ? 34 : storeId === "aurora" ? 28 : 22,
    deliveryNetMargin: 4.56,
    vendorTotalThisWeek:
      storeId === "kent" ? 4280 : storeId === "aurora" ? 3640 : 3120,
    vendorAvg4Week:
      storeId === "kent" ? 3940 : storeId === "aurora" ? 3580 : 3050,
    overtimeHoursThisWeek:
      storeId === "kent" ? 6.5 : storeId === "aurora" ? 3.0 : 1.5,
    scheduledHoursThisWeek:
      storeId === "kent" ? 142 : storeId === "aurora" ? 118 : 98,
    scheduledHoursLastWeek:
      storeId === "kent" ? 128 : storeId === "aurora" ? 122 : 96,
  };
}

const SCOOP_TEMPLATES: ((
  m: StoreMetrics,
  idx: number
) => ScoopItem | null)[] = [
  (m, idx) => {
    const diff = m.foodCostPct - m.foodCostPctWeekAvg;
    if (Math.abs(diff) < 0.3) return null;
    const direction = diff > 0 ? "above" : "below";
    return {
      id: `data-fc-${idx}`,
      type: "math",
      title: `Food Cost: ${m.foodCostPct}% vs Your 7-Day Average of ${m.foodCostPctWeekAvg}%`,
      body: `${m.storeName} ran ${Math.abs(diff).toFixed(1)} points ${direction} your own 7-day trend yesterday. At your current revenue, each point of food cost represents approximately $${Math.round(m.weekAvgSales * 0.01 * 30)}/month.`,
      detail: `Yesterday: ${m.foodCostPct}%\n7-day average: ${m.foodCostPctWeekAvg}%\nDifference: ${diff > 0 ? "+" : ""}${diff.toFixed(1)} points\nMonthly impact per point: ~$${Math.round(m.weekAvgSales * 0.01 * 30)}`,
      date: "Today",
      readTime: "1 min",
    };
  },
  (m, idx) => {
    const diff = m.scheduledHoursThisWeek - m.scheduledHoursLastWeek;
    if (Math.abs(diff) < 4) return null;
    return {
      id: `data-labor-${idx}`,
      type: "math",
      title: `${m.storeName}: ${Math.abs(diff)} ${diff > 0 ? "More" : "Fewer"} Labor Hours This Week`,
      body: `This week: ${m.scheduledHoursThisWeek} hours scheduled. Last week: ${m.scheduledHoursLastWeek} hours. That is ${Math.abs(diff)} ${diff > 0 ? "additional" : "fewer"} hours at approximately $16-21/hr loaded cost.`,
      detail: `This week: ${m.scheduledHoursThisWeek} hrs\nLast week: ${m.scheduledHoursLastWeek} hrs\nDifference: ${diff > 0 ? "+" : ""}${diff} hrs\nEstimated cost difference: $${Math.abs(diff) * 18}/week or $${Math.abs(diff) * 18 * 4}/month at $18/hr avg`,
      date: "Today",
      readTime: "1 min",
    };
  },
  (m, idx) => {
    if (m.overtimeHoursThisWeek < 2) return null;
    const otCost = m.overtimeHoursThisWeek * 18 * 0.5;
    return {
      id: `data-ot-${idx}`,
      type: "scoop",
      title: `${m.overtimeHoursThisWeek} Overtime Hours This Week at ${m.storeName}`,
      body: `Overtime pays 1.5x. Those ${m.overtimeHoursThisWeek} OT hours cost approximately $${Math.round(otCost)} more than if they were regular hours. Over a month that is roughly $${Math.round(otCost * 4)}.`,
      detail: `OT hours this week: ${m.overtimeHoursThisWeek}\nOT premium (0.5x at ~$18/hr): ~$${Math.round(otCost)}/week\nMonthly OT premium: ~$${Math.round(otCost * 4)}\nAnnual if sustained: ~$${Math.round(otCost * 52)}`,
      date: "Today",
      readTime: "1 min",
    };
  },
  (m, idx) => {
    const diff = m.todaySales - m.yesterdaySales;
    const pctDiff = ((diff / m.yesterdaySales) * 100).toFixed(1);
    return {
      id: `data-sales-${idx}`,
      type: "scoop",
      title: `${m.storeName}: $${m.todaySales.toLocaleString()} Yesterday vs $${m.yesterdaySales.toLocaleString()} the Day Before`,
      body: `That is a ${diff >= 0 ? "+" : ""}${pctDiff}% change day over day. Your 7-day average is $${m.weekAvgSales.toLocaleString()}.`,
      detail: `Yesterday: $${m.todaySales.toLocaleString()}\nDay before: $${m.yesterdaySales.toLocaleString()}\nChange: ${diff >= 0 ? "+" : ""}$${Math.abs(diff).toLocaleString()} (${pctDiff}%)\n7-day avg: $${m.weekAvgSales.toLocaleString()}`,
      date: "Today",
      readTime: "1 min",
    };
  },
  (m, idx) => {
    const rplh = m.todaySales / (m.laborHoursToday || 1);
    return {
      id: `data-rplh-${idx}`,
      type: "math",
      title: `Revenue Per Labor Hour: $${rplh.toFixed(2)} at ${m.storeName}`,
      body: `$${m.todaySales.toLocaleString()} in revenue across ${m.laborHoursToday} labor hours. Your SLPH benchmark is $${m.slphBenchmark}. ${rplh > m.slphBenchmark ? "Above" : "Below"} benchmark by $${Math.abs(rplh - m.slphBenchmark).toFixed(2)}.`,
      detail: `Revenue: $${m.todaySales.toLocaleString()}\nLabor hours: ${m.laborHoursToday}\nRevenue/labor hour: $${rplh.toFixed(2)}\nSLPH benchmark: $${m.slphBenchmark}\nDifference: ${rplh > m.slphBenchmark ? "+" : "-"}$${Math.abs(rplh - m.slphBenchmark).toFixed(2)}`,
      date: "Today",
      readTime: "1 min",
    };
  },
  (m, idx) => {
    return {
      id: `data-prime-${idx}`,
      type: "math",
      title: `PRIME Cost at ${m.storeName}: ${m.primePct}%`,
      body: `Food (${m.foodCostPct}%) + Labor (${m.laborCostPct}%) + Disposables. Industry benchmark for independents: under 60%. ${m.primePct > 60 ? `Currently ${(m.primePct - 60).toFixed(1)} points above.` : `Currently ${(60 - m.primePct).toFixed(1)} points under.`}`,
      detail: `Food cost: ${m.foodCostPct}%\nLabor cost: ${m.laborCostPct}%\nDisposables: ~4.2%\nPRIME total: ${m.primePct}%\nBenchmark: under 60%\nDifference: ${m.primePct > 60 ? "+" : ""}${(m.primePct - 60).toFixed(1)} points`,
      date: "Today",
      readTime: "1 min",
    };
  },
  (m, idx) => {
    const diff = m.avgTicket - m.avgTicketWeekAvg;
    return {
      id: `data-ticket-${idx}`,
      type: "didyouknow",
      title: `Average Ticket: $${m.avgTicket.toFixed(2)} vs 7-Day Avg of $${m.avgTicketWeekAvg.toFixed(2)}`,
      body: `${m.storeName} average ticket ${diff >= 0 ? "rose" : "dropped"} $${Math.abs(diff).toFixed(2)} from your weekly average. At ${m.transactionsToday} transactions yesterday, that ${diff >= 0 ? "adds" : "removes"} approximately $${Math.abs(Math.round(diff * m.transactionsToday))} per day.`,
      detail: `Yesterday avg ticket: $${m.avgTicket.toFixed(2)}\n7-day avg ticket: $${m.avgTicketWeekAvg.toFixed(2)}\nDifference: ${diff >= 0 ? "+" : ""}$${diff.toFixed(2)}\nTransactions: ${m.transactionsToday}\nDaily impact: ${diff >= 0 ? "+" : "-"}$${Math.abs(Math.round(diff * m.transactionsToday))}`,
      date: "Today",
      readTime: "1 min",
    };
  },
  (m, idx) => {
    const diff = m.vendorTotalThisWeek - m.vendorAvg4Week;
    const pct = ((diff / m.vendorAvg4Week) * 100).toFixed(1);
    if (Math.abs(diff) < 100) return null;
    return {
      id: `data-vendor-${idx}`,
      type: "scoop",
      title: `Vendor Spend: $${m.vendorTotalThisWeek.toLocaleString()} This Week`,
      body: `4-week average: $${m.vendorAvg4Week.toLocaleString()}. This week is ${diff > 0 ? "up" : "down"} ${Math.abs(parseFloat(pct))}% ($${Math.abs(diff).toLocaleString()}) from your own trend.`,
      detail: `This week: $${m.vendorTotalThisWeek.toLocaleString()}\n4-week avg: $${m.vendorAvg4Week.toLocaleString()}\nDifference: ${diff > 0 ? "+" : ""}$${diff.toLocaleString()} (${pct}%)\nMonthly impact if sustained: ${diff > 0 ? "+" : ""}$${(diff * 4).toLocaleString()}`,
      date: "Today",
      readTime: "1 min",
    };
  },
  (m, idx) => {
    return {
      id: `data-delivery-${idx}`,
      type: "didyouknow",
      title: `${m.deliveryPct}% of ${m.storeName} Orders Are Delivery`,
      body: `Net margin per delivery order after commission and packaging: approximately $${m.deliveryNetMargin.toFixed(2)}. Net margin on a comparable pickup order: approximately $${(m.deliveryNetMargin + 5.04).toFixed(2)}. The gap is $${5.04.toFixed(2)} per order.`,
      detail: `Delivery mix: ${m.deliveryPct}%\nPickup/dine-in: ${100 - m.deliveryPct}%\nNet margin per delivery order: ~$${m.deliveryNetMargin.toFixed(2)}\nNet margin per pickup order: ~$${(m.deliveryNetMargin + 5.04).toFixed(2)}\nGap per order: $5.04\nAt ${Math.round((m.transactionsToday * m.deliveryPct) / 100)} delivery orders/day: $${Math.round((m.transactionsToday * m.deliveryPct) / 100 * 5.04)}/day in commission + packaging`,
      date: "Today",
      readTime: "1 min",
    };
  },
  (m, idx) => {
    return {
      id: `data-google-${idx}`,
      type: "trending",
      title: `${m.storeName} Google Rating: ${m.googleRating} Stars (${m.googleReviewCount} Reviews)`,
      body: `Research shows a 0.5-star difference on Google can mean 20-30% more or fewer customers finding you. 93% of customers read reviews before choosing a restaurant.`,
      source: "Harvard Business School",
      date: "Today",
      readTime: "1 min",
    };
  },
  (m, idx) => {
    return {
      id: `data-topseller-${idx}`,
      type: "didyouknow",
      title: `Top Seller Yesterday: ${m.topSellerName} (${m.topSellerOrders} Orders)`,
      body: `${m.topSellerName} accounted for ${m.topSellerOrders} orders at ${m.storeName}. At current pricing, a $0.50 increase on this single item would generate approximately $${Math.round(m.topSellerOrders * 0.5 * 30)}/month in additional revenue.`,
      detail: `Item: ${m.topSellerName}\nOrders yesterday: ${m.topSellerOrders}\nMonthly volume (est): ${m.topSellerOrders * 30}\n$0.50 increase impact: +$${Math.round(m.topSellerOrders * 0.5 * 30)}/month\n$1.00 increase impact: +$${Math.round(m.topSellerOrders * 1.0 * 30)}/month`,
      date: "Today",
      readTime: "1 min",
    };
  },
  (m, idx) => {
    const laborDollars = Math.round(
      (m.todaySales * m.laborCostPct) / 100
    );
    return {
      id: `data-labordollar-${idx}`,
      type: "math",
      title: `${m.storeName} Spent $${laborDollars.toLocaleString()} on Labor Yesterday`,
      body: `That is ${m.laborCostPct}% of $${m.todaySales.toLocaleString()} in revenue. Industry benchmark for independents: 28-32%. ${m.laborCostPct > 32 ? `Currently ${(m.laborCostPct - 32).toFixed(1)} points above the high end.` : m.laborCostPct < 28 ? `Currently ${(28 - m.laborCostPct).toFixed(1)} points below the low end.` : "Within benchmark range."}`,
      detail: `Revenue: $${m.todaySales.toLocaleString()}\nLabor cost: $${laborDollars.toLocaleString()} (${m.laborCostPct}%)\nBenchmark range: 28-32%\nLabor hours: ${m.laborHoursToday}\nCost per labor hour: $${(laborDollars / m.laborHoursToday).toFixed(2)}`,
      date: "Today",
      readTime: "1 min",
    };
  },
  (m, idx) => {
    const diff = m.transactionsToday - m.transactionsYesterday;
    return {
      id: `data-transactions-${idx}`,
      type: "scoop",
      title: `${m.transactionsToday} Transactions Yesterday at ${m.storeName}`,
      body: `${diff >= 0 ? "Up" : "Down"} ${Math.abs(diff)} from the day before. Average ticket: $${m.avgTicket.toFixed(2)}. Total revenue: $${m.todaySales.toLocaleString()}.`,
      detail: `Yesterday: ${m.transactionsToday} transactions\nDay before: ${m.transactionsYesterday} transactions\nChange: ${diff >= 0 ? "+" : ""}${diff}\nAvg ticket: $${m.avgTicket.toFixed(2)}\nRevenue: $${m.todaySales.toLocaleString()}`,
      date: "Today",
      readTime: "1 min",
    };
  },
  (m, idx) => {
    const monthlyOrders = m.transactionsToday * 30;
    return {
      id: `data-pricemath-${idx}`,
      type: "math",
      title: `The Math on a $0.50 Menu Increase at ${m.storeName}`,
      body: `At ${m.transactionsToday} orders/day, a $0.50 across-the-board increase adds approximately $${Math.round(monthlyOrders * 0.5).toLocaleString()}/month. A $1.00 increase: $${Math.round(monthlyOrders * 1.0).toLocaleString()}/month. Zero additional cost. Zero additional labor.`,
      detail: `Daily transactions: ${m.transactionsToday}\nMonthly (est): ${monthlyOrders.toLocaleString()}\n$0.50 increase: +$${Math.round(monthlyOrders * 0.5).toLocaleString()}/month (+$${Math.round(monthlyOrders * 0.5 * 12).toLocaleString()}/year)\n$1.00 increase: +$${Math.round(monthlyOrders * 1.0).toLocaleString()}/month (+$${Math.round(monthlyOrders * 1.0 * 12).toLocaleString()}/year)\nPure margin — no cost increase`,
      date: "Today",
      readTime: "1 min",
    };
  },
  (m, idx) => {
    const allMetrics = ["kent", "aurora", "lindseys"].map((id) =>
      getStoreMetrics(id)
    );
    const best = allMetrics.reduce((a, b) =>
      a.foodCostPct < b.foodCostPct ? a : b
    );
    const worst = allMetrics.reduce((a, b) =>
      a.foodCostPct > b.foodCostPct ? a : b
    );
    if (best.storeId === worst.storeId) return null;
    return {
      id: `data-compare-${idx}`,
      type: "didyouknow",
      title: `Food Cost Spread Across Locations: ${(worst.foodCostPct - best.foodCostPct).toFixed(1)} Points`,
      body: `${best.storeName}: ${best.foodCostPct}%. ${worst.storeName}: ${worst.foodCostPct}%. Same menu, same suppliers. The gap is ${(worst.foodCostPct - best.foodCostPct).toFixed(1)} percentage points.`,
      detail:
        allMetrics
          .map((s) => `${s.storeName}: ${s.foodCostPct}%`)
          .join("\n") +
        `\nSpread: ${(worst.foodCostPct - best.foodCostPct).toFixed(1)} points\nAt $${worst.weekAvgSales.toLocaleString()}/day revenue, each point = ~$${Math.round(worst.weekAvgSales * 0.01 * 30)}/month`,
      date: "Today",
      readTime: "1 min",
    };
  },
  (m, idx) => {
    const allMetrics = ["kent", "aurora", "lindseys"].map((id) =>
      getStoreMetrics(id)
    );
    const best = allMetrics.reduce((a, b) =>
      a.laborCostPct < b.laborCostPct ? a : b
    );
    const worst = allMetrics.reduce((a, b) =>
      a.laborCostPct > b.laborCostPct ? a : b
    );
    if (best.storeId === worst.storeId) return null;
    return {
      id: `data-laborcompare-${idx}`,
      type: "didyouknow",
      title: `Labor Cost Spread: ${best.storeName} at ${best.laborCostPct}% vs ${worst.storeName} at ${worst.laborCostPct}%`,
      body: `${(worst.laborCostPct - best.laborCostPct).toFixed(1)} point difference across locations. Same pay rates. The difference is scheduling efficiency and volume.`,
      detail: allMetrics
        .map(
          (s) =>
            `${s.storeName}: ${s.laborCostPct}% (${s.scheduledHoursThisWeek} hrs/week)`
        )
        .join("\n"),
      date: "Today",
      readTime: "1 min",
    };
  },
  (m, idx) => {
    if (m.laborHoursToday <= m.laborHoursYesterday) return null;
    const extraHours = m.laborHoursToday - m.laborHoursYesterday;
    if (extraHours < 3) return null;
    return {
      id: `data-overstaff-${idx}`,
      type: "scoop",
      title: `${m.storeName}: ${extraHours} More Labor Hours Yesterday Than the Day Before`,
      body: `${m.laborHoursToday} hours yesterday vs ${m.laborHoursYesterday} the day before. Revenue change: ${m.todaySales > m.yesterdaySales ? "+" : ""}$${(m.todaySales - m.yesterdaySales).toLocaleString()}. Additional labor cost: approximately $${Math.round(extraHours * 18)}.`,
      detail: `Yesterday hours: ${m.laborHoursToday}\nDay before hours: ${m.laborHoursYesterday}\nExtra hours: ${extraHours}\nExtra cost (~$18/hr): ~$${Math.round(extraHours * 18)}\nRevenue change: ${m.todaySales > m.yesterdaySales ? "+" : ""}$${(m.todaySales - m.yesterdaySales).toLocaleString()}\nWas the extra labor matched by extra revenue?`,
      date: "Today",
      readTime: "1 min",
    };
  },
];

export function getDailyScoops(storeId: string = "kent"): ScoopItem[] {
  const metrics = getStoreMetrics(storeId);
  const daySeed = getDaySeed();
  const allScoops = SCOOP_TEMPLATES.map((template, idx) => {
    try {
      return template(metrics, idx);
    } catch {
      return null;
    }
  }).filter((s): s is ScoopItem => s !== null);
  const shuffled = shuffleByDay(allScoops, daySeed);
  return shuffled.slice(0, 5);
}
