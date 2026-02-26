"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import {
  Newspaper,
  Lightbulb,
  Calculator,
  Users,
  TrendingUp,
  ChevronDown,
  Sparkles,
  Clock,
} from "lucide-react";
import { EducationInfoIcon } from "@/src/components/education/InfoIcon";
import type { LucideIcon } from "lucide-react";

interface FeedItem {
  id: string;
  type: "scoop" | "didyouknow" | "math" | "story" | "trending";
  title: string;
  body: string;
  detail?: string;
  source?: string;
  sourceUrl?: string;
  date: string;
  readTime: string;
  actionable?: string;
}

const FEED_ITEMS: FeedItem[] = [
  {
    id: "f1",
    type: "scoop",
    title: "Cheese Prices Expected to Rise 6-8% in Q2",
    body: "USDA dairy forecasts project mozzarella block prices climbing through spring. Reduced milk production in the Midwest is driving the increase. Operators locking in pricing now with their distributor could save significantly over the next quarter.",
    detail: "Current CME block price: $1.87/lb (up from $1.72 in January). Industry analysts expect $1.95-2.05/lb by May. For a shop using 400 lbs/week, that's an extra $32-72/week or $140-310/month if you don't lock in.",
    source: "USDA Dairy Market News",
    sourceUrl: "https://www.ams.usda.gov/market-news/dairy",
    date: "Today",
    readTime: "2 min",
    actionable: "Consider calling Hillcrest this week to ask about locking in your mozzarella price for 90 days.",
  },
  {
    id: "f2",
    type: "didyouknow",
    title: "Your Busiest Hour Might Not Be Your Most Profitable",
    body: "Your highest volume hour isn't always your most profitable. Friday 6-7pm pushes the most orders, but Tuesday 5-6pm runs a 22% higher average ticket with 15% lower labor cost per order. Volume and Gross Profit aren't the same thing.",
    detail: "Friday 6-7pm: 38 orders, avg ticket $18.40, 4 staff on. Tuesday 5-6pm: 19 orders, avg ticket $22.50, 2 staff on. Revenue per labor hour: Friday $169, Tuesday $213.",
    date: "Today",
    readTime: "1 min",
    actionable: "Consider running a Tuesday promotion to boost volume during your most efficient hour. Even 5 more orders at $22.50 adds $487/month.",
  },
  {
    id: "f3",
    type: "math",
    title: "What If You Raised Prices $0.50 on Your Top 5 Items?",
    body: "Your top 5 sellers account for 62% of all orders. A $0.50 increase on each generates an estimated $1,840/month in additional revenue — with zero additional cost. That's pure Gross Profit.",
    detail: "Large Cheese: 340 orders/mo × $0.50 = $170\nLarge Pepperoni: 280 × $0.50 = $140\nWings 10pc: 260 × $0.50 = $130\nBreadsticks: 240 × $0.50 = $120\nPepperoni Roll: 220 × $0.50 = $110\nAll others (est): 2,540 × $0.50 = $1,270\nTotal: ~$1,840/month or $22,080/year. Pure Gross Profit.",
    date: "Yesterday",
    readTime: "2 min",
    actionable: "Consider testing the increase on delivery orders first — delivery customers tend to be less focused on price differences than dine-in.",
  },
  {
    id: "f4",
    type: "story",
    title: "How a 2-Store Operator Cut Food Waste by 40%",
    body: "A pizzeria owner in Columbus was losing $800/month in expired prep. The fix was simple — prep twice a day in smaller batches instead of once every morning. Labor went up 30 minutes. Waste dropped $320/month. Net savings: $95/month plus fresher product.",
    detail: "The key insight: morning prep amounts were based on the busiest day of the week, every day. Monday was getting Thursday-level prep. By splitting into AM prep (base amount) and a 2pm top-up (based on actual pace), he matched prep to demand. The 30 extra minutes of labor cost ~$7.50/day ($225/mo) but saved $320/mo in waste — net savings $95/mo plus fresher product.",
    date: "Yesterday",
    readTime: "3 min",
    actionable: "Consider tracking your daily waste for one week. Weigh what goes in the trash at close. The number will surprise you.",
  },
  {
    id: "f5",
    type: "trending",
    title: "Square Pizza Is Having a Moment",
    body: "Detroit-style and Sicilian pizza searches are up 34% year-over-year. Three new square pizza concepts opened in Northeast Ohio in the last 90 days. Detroit-style Gross Margins tend to run 3-5% higher than traditional round — simpler topping patterns and a cheaper cheese blend.",
    detail: "Detroit-style Gross Margins are typically 3-5% higher than traditional round pizzas due to simpler topping patterns and the brick cheese blend being cheaper than low-moisture mozzarella. Dough yield per batch is also higher because of the high-hydration recipe. Several operators report that adding a \"Detroit-style\" option increased their average ticket by $2-3.",
    source: "PMQ Pizza Magazine, Google Trends",
    sourceUrl: "https://www.pmq.com",
    date: "2 days ago",
    readTime: "2 min",
    actionable: "Consider testing a limited Detroit-style menu item. Low risk — uses existing ingredients with a different pan and technique.",
  },
  {
    id: "f6",
    type: "scoop",
    title: "DoorDash Testing 'Priority Delivery' Fee for Restaurants",
    body: "DoorDash is piloting a program where restaurants can pay an extra 5% commission to get their orders delivered first during peak hours. The pitch: faster delivery = higher ratings = more orders. The reality: another fee on top of 25-30% commission.",
    source: "Restaurant Business Online",
    sourceUrl: "https://www.restaurantbusinessonline.com",
    date: "2 days ago",
    readTime: "2 min",
    actionable: "Consider whether your DoorDash rating is suffering from slow delivery. If not, skip this. If yes, the real fix might be adjusting your prep time estimates, not paying more commission.",
  },
  {
    id: "f7",
    type: "didyouknow",
    title: "Responding to Negative Reviews Can Increase Revenue 18%",
    body: "Research from Harvard Business School found that businesses responding to negative reviews see an average 18% revenue increase from new customers. The response matters more than the complaint — 89% of consumers read how businesses handle problems.",
    detail: "The study analyzed 1.5 million Yelp reviews across 4,000 restaurants. Key finding: it's not about changing the reviewer's mind. 89% of consumers read business responses to reviews. A calm, professional response that acknowledges the issue and offers to make it right signals reliability to every future customer who reads it.",
    source: "Harvard Business School",
    sourceUrl: "https://hbswk.hbs.edu",
    date: "3 days ago",
    readTime: "2 min",
    actionable: "Consider setting a daily alarm to check and respond to any new negative reviews. 5 minutes a day protects your reputation.",
  },
  {
    id: "f8",
    type: "math",
    title: "Your Delivery Break-Even After Commission",
    body: "On a $20 delivery order through DoorDash at 25.2% commission, you keep $14.96. Your food cost on that order is approximately $6.40 (32%). That leaves $8.56 for labor, packaging, and net margin. After $1.20 in packaging and an estimated $2.80 in labor allocation, your actual net margin per delivery order is roughly $4.56.",
    detail: "$20.00 gross\n-$5.04 DoorDash commission (25.2%)\n=$14.96 net revenue\n-$6.40 food cost (32% of $20)\n-$1.20 packaging (box, napkins, bag)\n-$2.80 labor allocation (est. 8 min at $21/hr loaded)\n=$4.56 net margin per order\n\nAt 312 delivery orders/month: $1,423/month net margin from DoorDash\nIf you raised delivery prices $1: +$312/month",
    date: "3 days ago",
    readTime: "2 min",
    actionable: "Consider raising your DoorDash menu prices by $1-2 above in-store prices. Most operators do this — customers expect delivery to cost more.",
  },
  {
    id: "f9",
    type: "story",
    title: "The Operator Who Stopped Offering Discounts",
    body: "A single-store operator in Akron was running 15% off coupons every week. When he stopped cold turkey, he expected to lose 20% of business. He lost 8% of orders — but revenue only dropped 2% because the remaining customers were paying full price. Within 6 weeks, order volume recovered completely.",
    detail: "The math: 1,000 orders/month at avg $18 with 40% using 15% coupon = $16,920 revenue. After stopping: 920 orders at $18 (no discount) = $16,560. Drop: $360/month (2.1%). By week 6: back to 980 orders at $18 = $17,640 — actually $720/month MORE than before. The coupon customers were the lowest net margin, most price-sensitive customers. The regulars never needed the discount.",
    date: "4 days ago",
    readTime: "3 min",
    actionable: "Consider auditing how many of your orders use a discount. If it's over 30%, you might be training customers to wait for deals.",
  },
  {
    id: "f10",
    type: "trending",
    title: "QR Code Ordering Up 280% Since 2022",
    body: "More customers want to order from their phone even when sitting in your dining room. QR code table ordering reduces order errors by 24% and increases average ticket by 12% because customers browse the full menu instead of ordering from memory.",
    source: "National Restaurant Association Tech Report 2025",
    sourceUrl: "https://restaurant.org/research-and-media/research/research-reports/",
    date: "5 days ago",
    readTime: "2 min",
    actionable: "Consider testing QR code ordering at 2-3 tables. Free options exist through Square, Toast, and Slice. Track whether average ticket increases.",
  },
];

const CONTENT_TYPES: Record<
  FeedItem["type"],
  { label: string; icon: LucideIcon; color: string; bgColor: string; borderColor: string; emoji: string }
> = {
  scoop: { label: "The Scoop", icon: Newspaper, color: "text-blue-400", bgColor: "bg-blue-600/20", borderColor: "border-blue-700/30", emoji: "📰" },
  didyouknow: { label: "Did You Know?", icon: Lightbulb, color: "text-amber-400", bgColor: "bg-amber-600/20", borderColor: "border-amber-700/30", emoji: "💡" },
  math: { label: "The Math", icon: Calculator, color: "text-emerald-400", bgColor: "bg-emerald-600/20", borderColor: "border-emerald-700/30", emoji: "🧮" },
  story: { label: "Operator Story", icon: Users, color: "text-purple-400", bgColor: "bg-purple-600/20", borderColor: "border-purple-700/30", emoji: "👤" },
  trending: { label: "What's Trending", icon: TrendingUp, color: "text-pink-400", bgColor: "bg-pink-600/20", borderColor: "border-pink-700/30", emoji: "📈" },
};

export default function DailyEdgePage() {
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<"all" | "scoop" | "didyouknow" | "math" | "story" | "trending">("all");
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const todayItem = FEED_ITEMS[0];

  useEffect(() => {
    if (expandedItem && cardRefs.current[expandedItem]) {
      const t = setTimeout(() => {
        cardRefs.current[expandedItem]?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 100);
      return () => clearTimeout(t);
    }
  }, [expandedItem]);

  const filteredItems = useMemo(() => {
    const list = activeFilter === "all" ? FEED_ITEMS : FEED_ITEMS.filter((item) => item.type === activeFilter);
    return list.filter((item) => item.id !== todayItem.id);
  }, [activeFilter]);

  return (
    <div className="space-y-4 pb-28 min-w-0 overflow-x-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-white">The Daily Edge</h1>
          <p className="text-xs text-slate-400 mt-0.5">Get smarter about your business every day</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-purple-600/20 border border-purple-700/30">
            <Sparkles className="w-3 h-3 text-purple-400" />
            <span className="text-[10px] text-purple-400 font-medium">AI Powered</span>
          </div>
          <EducationInfoIcon metricKey="daily_edge" />
        </div>
      </div>

      {/* Today's highlight */}
      <div className={`rounded-2xl border p-5 mb-4 ${CONTENT_TYPES[todayItem.type].bgColor} ${CONTENT_TYPES[todayItem.type].borderColor}`}>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">{CONTENT_TYPES[todayItem.type].emoji}</span>
          <span className={`text-xs font-semibold ${CONTENT_TYPES[todayItem.type].color}`}>{CONTENT_TYPES[todayItem.type].label}</span>
          <span className="text-[10px] text-slate-500 ml-auto">{todayItem.readTime} read</span>
        </div>
        <h2 className="text-base font-bold text-white mb-2">{todayItem.title}</h2>
        <p className="text-sm text-slate-300 leading-relaxed">{todayItem.body}</p>
        {todayItem.source && (
          <p className="text-[10px] text-slate-600 mt-2">
            Source: {todayItem.sourceUrl ? (
              <a href={todayItem.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">
                {todayItem.source}
              </a>
            ) : todayItem.source}
          </p>
        )}
        {todayItem.actionable && (
          <div className="mt-3 px-3 py-2 rounded-lg bg-slate-900/50">
            <p className="text-xs text-[#E65100]">💡 {todayItem.actionable}</p>
          </div>
        )}
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
        <button
          type="button"
          onClick={() => setActiveFilter("all")}
          className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            activeFilter === "all" ? "bg-slate-700 text-white" : "bg-slate-800 text-slate-500 border border-slate-700"
          }`}
        >
          All
        </button>
        {(Object.entries(CONTENT_TYPES) as [FeedItem["type"], (typeof CONTENT_TYPES)[FeedItem["type"]]][]).map(([key, config]) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveFilter(key)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
              activeFilter === key ? `${config.bgColor} ${config.color} ${config.borderColor}` : "bg-slate-800 text-slate-500 border-slate-700"
            }`}
          >
            <span>{config.emoji}</span>
            <span>{config.label}</span>
          </button>
        ))}
      </div>

      {/* Feed items */}
      {filteredItems.map((item) => {
        const config = CONTENT_TYPES[item.type];
        const isExpanded = expandedItem === item.id;
        const IconComponent = config.icon;
        return (
          <div
            key={item.id}
            ref={(el) => {
              cardRefs.current[item.id] = el;
            }}
            className="bg-slate-800 rounded-xl border border-slate-700 mb-3"
          >
            <button type="button" onClick={() => setExpandedItem(isExpanded ? null : item.id)} className="w-full text-left p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-7 h-7 rounded-lg ${config.bgColor} flex items-center justify-center flex-shrink-0`}>
                  <IconComponent className={`w-3.5 h-3.5 ${config.color}`} />
                </div>
                <span className={`text-[10px] font-semibold ${config.color} uppercase tracking-wide`}>{config.label}</span>
                <span className="text-[10px] text-slate-600 ml-auto flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {item.readTime}
                </span>
              </div>
              <h3 className="text-sm font-semibold text-white mb-1">{item.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">{item.body}</p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-[10px] text-slate-600">{item.date}</span>
                <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
              </div>
            </button>

            {isExpanded && (
              <div className="px-4 pb-4 border-t border-slate-700 pt-3">
                {item.detail && (
                  <div className="p-3 rounded-lg bg-slate-700/30 mb-3">
                    <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">{item.detail}</p>
                  </div>
                )}
                {item.source && (
                  <p className="text-[10px] text-slate-600 mb-2">
                    Source: {item.sourceUrl ? (
                      <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">
                        {item.source}
                      </a>
                    ) : item.source}
                  </p>
                )}
                {item.actionable && (
                  <div className="px-3 py-2 rounded-lg bg-[#E65100]/10 border border-[#E65100]/20">
                    <p className="text-xs text-[#E65100]">💡 {item.actionable}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Bottom — coming soon note */}
      <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4 mt-4 text-center">
        <Sparkles className="w-5 h-5 text-purple-400 mx-auto mb-2" />
        <p className="text-xs text-slate-400">Fresh content generated daily based on your data, industry trends, and what operators like you are learning.</p>
        <p className="text-[10px] text-slate-600 mt-1">Powered by AI · Updated every morning at 6am</p>
      </div>
    </div>
  );
}
