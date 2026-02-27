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
  ExternalLink,
} from "lucide-react";
import { EducationInfoIcon } from "@/src/components/education/InfoIcon";
import type { LucideIcon } from "lucide-react";
import { getDailyScoops } from "@/src/lib/daily-edge-engine";
import type { ScoopItem } from "@/src/lib/daily-edge-engine";

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
  const selectedStore = "kent";
  const dataScoops = useMemo(() => getDailyScoops(selectedStore), [selectedStore]);

  // Hero uses the top scoop of the day; feed below skips it.
  const heroItem: FeedItem | null = dataScoops[0]
    ? { ...dataScoops[0], actionable: undefined }
    : null;
  const FEED_ITEMS: FeedItem[] = dataScoops.slice(1).map((scoop) => ({
    ...scoop,
    actionable: undefined,
  }));

  const FILTER_PILL_LABELS: Record<FeedItem["type"], string> = {
    scoop: "Scoop",
    didyouknow: "Did You Know",
    math: "Math",
    story: "Story",
    trending: "Trending",
  };

  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<"all" | "scoop" | "didyouknow" | "math" | "story" | "trending">("all");
  const [liveArticles, setLiveArticles] = useState<
    Array<{
      id?: number;
      source_name: string;
      source_url?: string;
      title: string;
      summary: string;
      published_at?: string;
      content_type: string;
      actionable_tip?: string;
    }>
  >([]);
  const [liveLoading, setLiveLoading] = useState(true);
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    async function fetchLive() {
      try {
        const res = await fetch("/api/daily-edge/live");
        const data = await res.json();
        setLiveArticles(data.articles || []);
      } catch {
        // Silent fail — seed content still shows
      } finally {
        setLiveLoading(false);
      }
    }
    fetchLive();
  }, []);

  const todayItem = heroItem;

  useEffect(() => {
    if (expandedItem && cardRefs.current[expandedItem]) {
      const t = setTimeout(() => {
        cardRefs.current[expandedItem]?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 100);
      return () => clearTimeout(t);
    }
  }, [expandedItem]);

  const filteredItems = useMemo(() => {
    return activeFilter === "all"
      ? FEED_ITEMS
      : FEED_ITEMS.filter((item) => item.type === activeFilter);
  }, [activeFilter, FEED_ITEMS]);

  return (
    <div className="space-y-4 pb-28 min-w-0 overflow-x-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-white">The Daily Edge</h1>
          <p className="text-xs text-slate-400 mt-0.5">Your numbers. Your trends. Every morning.</p>
        </div>
        <div className="flex items-center gap-2">
          <EducationInfoIcon metricKey="daily_edge" />
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-purple-600/20 border border-purple-700/30">
            {liveArticles.length > 0 ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                <span className="text-[10px] text-orange-400 font-medium">
                  {liveArticles.length} Live
                </span>
              </>
            ) : (
              <>
                <Sparkles className="w-3 h-3 text-purple-400" />
                <span className="text-[10px] text-purple-400 font-medium">AI Powered</span>
          </>
            )}
          </div>
        </div>
      </div>

      {/* Today's highlight */}
      {todayItem && (
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
      )}

      {/* Filter pills */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          type="button"
          onClick={() => setActiveFilter("all")}
          className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
            activeFilter === "all"
              ? "bg-[#E65100] text-white border-[#E65100]"
              : "bg-transparent text-zinc-600 dark:text-zinc-400 border-zinc-300 dark:border-zinc-600"
          }`}
        >
          All
        </button>
        {(Object.entries(CONTENT_TYPES) as [FeedItem["type"], (typeof CONTENT_TYPES)[FeedItem["type"]]][]).map(([key, config]) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveFilter(key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-full border transition-colors ${
              activeFilter === key
                ? "bg-[#E65100] text-white border-[#E65100]"
                : "bg-transparent text-zinc-600 dark:text-zinc-400 border-zinc-300 dark:border-zinc-600"
            }`}
          >
            <span>{config.emoji}</span>
            <span>{FILTER_PILL_LABELS[key]}</span>
          </button>
        ))}
      </div>

      {/* Live articles from RSS */}
      {liveArticles.length > 0 &&
        liveArticles
          .filter(
            (a) => activeFilter === "all" || a.content_type === activeFilter
          )
          .map((article) => {
            const config =
              CONTENT_TYPES[article.content_type as keyof typeof CONTENT_TYPES] ||
              CONTENT_TYPES.scoop;
            const isExpanded =
              expandedItem === `live-${article.id ?? article.source_url}`;
            const Icon = config.icon;
            return (
              <div
                key={article.id ?? article.source_url ?? article.title}
                className="bg-slate-800 rounded-xl border border-slate-700 mb-3 overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() =>
                    setExpandedItem(
                      isExpanded ? null : `live-${article.id ?? article.source_url}`
                    )
                  }
                  className="w-full text-left p-4"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className={`w-7 h-7 rounded-lg ${config.bgColor} flex items-center justify-center flex-shrink-0`}
                    >
                      <Icon className={`w-3.5 h-3.5 ${config.color}`} />
                    </div>
                    <span
                      className={`text-[10px] font-semibold ${config.color} uppercase tracking-wide`}
                    >
                      {config.label}
                    </span>
                    <span className="flex items-center gap-1 ml-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                      <span className="text-[9px] font-bold text-orange-400 uppercase tracking-widest">
                        LIVE
                      </span>
                    </span>
                    <span className="text-[10px] text-slate-600 ml-auto">
                      via {article.source_name}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-white mb-1">
                    {article.title}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                    {article.summary}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[10px] text-slate-600">
                      {article.published_at
                        ? new Date(article.published_at).toLocaleDateString(
                            "en-US",
                            { month: "short", day: "numeric" }
                          )
                        : "Today"}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-500 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                    />
                  </div>
                </button>
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-slate-700 pt-3">
                    {article.summary && (
                      <div className="p-3 rounded-lg bg-slate-700/30 mb-3">
                        <p className="text-xs text-slate-300 leading-relaxed">
                          {article.summary}
                        </p>
                      </div>
                    )}
                    {article.source_url && (
                      <a
                        href={article.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-[10px] text-blue-400 hover:text-blue-300 mb-2"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Read full article at {article.source_name}
                      </a>
                    )}
                    {article.actionable_tip && (
                      <div className="px-3 py-2 rounded-lg bg-[#E65100]/10 border border-[#E65100]/20">
                        <p className="text-xs text-[#E65100]">
                          💡 {article.actionable_tip}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

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

      {/* Bottom note */}
      <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4 mt-4 text-center">
        <Sparkles className="w-5 h-5 text-purple-400 mx-auto mb-2" />
        {liveArticles.length > 0 ? (
          <>
            <p className="text-xs text-slate-400">
              Live content sourced from PMQ Pizza Magazine, Pizza Marketplace, and
              Nation&apos;s Restaurant News. Updated daily at 6am EST.
            </p>
            <p className="text-[10px] text-slate-600 mt-1">
              {liveArticles.length} live articles &middot; {dataScoops.length} data scoops from your stores
            </p>
          </>
        ) : (
          <>
            <p className="text-xs text-slate-400">
              Your Daily Edge is generated from your actual store data — sales, labor, food cost, vendor trends, and reputation. Different numbers every day means a different Daily Edge every day.
            </p>
            <p className="text-[10px] text-slate-600 mt-1">
              Powered by your data &middot; Refreshed every time you open the app
            </p>
          </>
        )}
      </div>
    </div>
  );
}
