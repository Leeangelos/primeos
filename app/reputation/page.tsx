"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Star,
  ThumbsUp,
  ThumbsDown,
  TrendingUp,
  TrendingDown,
  Eye,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "@/src/lib/auth-context";
import { isNewUser, getNewUserStoreName } from "@/src/lib/user-scope";
import { SEED_STORES } from "@/src/lib/seed-data";
import { EducationInfoIcon } from "@/src/components/education/InfoIcon";
import DataSourceBadge from "@/src/components/ui/DataSourceBadge";
import { useAllStoreProfiles } from "@/src/hooks/usePlacesData";
import { SEED_REPUTATION_KPIS_BY_STORE } from "@/src/lib/seed-data";

// Store reputation data
const REPUTATION_DATA: Record<
  string,
  {
    google: { rating: number; reviewCount: number; trend: "up" | "flat" | "down"; recentChange: number };
    yelp: { rating: number; reviewCount: number; trend: "up" | "flat" | "down"; recentChange: number };
    facebook: { rating: number; reviewCount: number; trend: "up" | "flat" | "down"; recentChange: number };
    tripadvisor: { rating: number; reviewCount: number; trend: "up" | "flat" | "down"; recentChange: number };
  }
> = {
  kent: {
    google: { rating: 4.4, reviewCount: 847, trend: "up", recentChange: 0.1 },
    yelp: { rating: 4.0, reviewCount: 123, trend: "flat", recentChange: 0 },
    facebook: { rating: 4.6, reviewCount: 312, trend: "up", recentChange: 0.2 },
    tripadvisor: { rating: 4.5, reviewCount: 89, trend: "flat", recentChange: 0 },
  },
  aurora: {
    google: { rating: 4.3, reviewCount: 634, trend: "up", recentChange: 0.1 },
    yelp: { rating: 3.8, reviewCount: 87, trend: "down", recentChange: -0.2 },
    facebook: { rating: 4.5, reviewCount: 245, trend: "flat", recentChange: 0 },
    tripadvisor: { rating: 4.3, reviewCount: 56, trend: "up", recentChange: 0.1 },
  },
  lindseys: {
    google: { rating: 4.1, reviewCount: 298, trend: "flat", recentChange: 0 },
    yelp: { rating: 3.5, reviewCount: 42, trend: "down", recentChange: -0.3 },
    facebook: { rating: 4.2, reviewCount: 134, trend: "up", recentChange: 0.1 },
    tripadvisor: { rating: 4.0, reviewCount: 31, trend: "flat", recentChange: 0 },
  },
};

function calculateSentiment(data: (typeof REPUTATION_DATA)["kent"]): number {
  const weights = { google: 0.45, facebook: 0.25, yelp: 0.2, tripadvisor: 0.1 };
  const weighted =
    data.google.rating * weights.google +
    data.facebook.rating * weights.facebook +
    data.yelp.rating * weights.yelp +
    data.tripadvisor.rating * weights.tripadvisor;
  return Math.round((weighted / 5) * 100);
}

const RECENT_REVIEWS = [
  { id: "r1", store_id: "kent", platform: "Google", author: "Mike T.", rating: 5, snippet: "Best pizza in Kent. The pepperoni rolls are insane. Staff is always friendly.", date: "2 days ago", sentiment: "positive" as const },
  { id: "r2", store_id: "kent", platform: "Google", author: "Sarah L.", rating: 4, snippet: "Good pizza, solid wings. Delivery was a little slow on Friday night but food was hot.", date: "4 days ago", sentiment: "positive" as const },
  { id: "r3", store_id: "kent", platform: "Yelp", author: "Jason R.", rating: 3, snippet: "Pizza was okay. Nothing special. Took 45 minutes for pickup which felt long.", date: "1 week ago", sentiment: "neutral" as const },
  { id: "r4", store_id: "aurora", platform: "Google", author: "Christina M.", rating: 5, snippet: "We order from here every Friday. Kids love the breadsticks. Never had a bad experience.", date: "3 days ago", sentiment: "positive" as const },
  { id: "r5", store_id: "aurora", platform: "Facebook", author: "Dave K.", rating: 2, snippet: "Order was wrong twice in a row. Called and they made it right but shouldn't have to call.", date: "5 days ago", sentiment: "negative" as const },
  { id: "r6", store_id: "lindseys", platform: "Google", author: "Amanda P.", rating: 5, snippet: "Hidden gem! Way better than the chain places. The owner clearly cares about quality.", date: "1 day ago", sentiment: "positive" as const },
  { id: "r7", store_id: "kent", platform: "Google", author: "Tyler B.", rating: 1, snippet: "Cold pizza, wrong toppings, 50 minute wait. Won't be back.", date: "6 days ago", sentiment: "negative" as const },
  { id: "r8", store_id: "lindseys", platform: "Yelp", author: "Rachel W.", rating: 4, snippet: "Great local spot. Wish they had online ordering. Pizza is consistently good.", date: "3 days ago", sentiment: "positive" as const },
  { id: "r9", store_id: "aurora", platform: "Google", author: "Brian S.", rating: 5, snippet: "Been coming here for 6 years. Best calzones in Northeast Ohio, hands down.", date: "2 days ago", sentiment: "positive" as const },
  { id: "r10", store_id: "kent", platform: "TripAdvisor", author: "Visitor from PA", rating: 4, snippet: "Stopped in while visiting Kent State. Really solid NY-style pizza. Good value.", date: "1 week ago", sentiment: "positive" as const },
];

const MARKET_RATINGS: Record<string, { name: string; rating: number; reviewCount: number }[]> = {
  kent: [
    { name: "LeeAngelo's Kent", rating: 4.4, reviewCount: 847 },
    { name: "Belleria Pizza", rating: 4.4, reviewCount: 523 },
    { name: "Ray's Place", rating: 4.3, reviewCount: 1847 },
    { name: "Domino's", rating: 3.9, reviewCount: 287 },
    { name: "Papa John's", rating: 3.7, reviewCount: 198 },
    { name: "Pizza Hut", rating: 3.6, reviewCount: 412 },
  ],
  aurora: [
    { name: "Rosetta's", rating: 4.5, reviewCount: 892 },
    { name: "LeeAngelo's Aurora", rating: 4.3, reviewCount: 634 },
    { name: "Gionino's", rating: 4.3, reviewCount: 678 },
    { name: "Moe's Pizza", rating: 4.2, reviewCount: 341 },
    { name: "Domino's", rating: 3.8, reviewCount: 156 },
  ],
  lindseys: [
    { name: "Rocco's Pizza", rating: 4.4, reviewCount: 412 },
    { name: "Lindsey's", rating: 4.1, reviewCount: 298 },
    { name: "Guido's Pizza", rating: 4.1, reviewCount: 287 },
    { name: "Marco's Pizza", rating: 4.0, reviewCount: 245 },
    { name: "Domino's", rating: 3.5, reviewCount: 134 },
  ],
};

const REPUTATION_ALERTS = [
  { id: "ra1", store_id: "kent", type: "negative_review", title: "1-Star Review on Google", message: "Tyler B. left a 1-star review mentioning cold pizza and wrong toppings. Consider responding within 24 hours — professional responses show future customers you care.", date: "6 days ago", urgency: "high" as const },
  { id: "ra2", store_id: "aurora", type: "negative_review", title: "Repeat Complaint on Facebook", message: "Dave K. reported wrong orders twice. This is a pattern worth investigating — check if a specific shift or employee is involved.", date: "5 days ago", urgency: "high" as const },
  { id: "ra3", store_id: "kent", type: "milestone", title: "Approaching 850 Google Reviews", message: "You're 3 reviews away from 850. Higher review counts build trust. Consider a subtle ask — receipt message, counter sign, or follow-up text after delivery.", date: "today", urgency: "low" as const },
  { id: "ra4", store_id: "lindseys", type: "opportunity", title: "Review Velocity Low", message: "Lindsey's is averaging 4 new Google reviews per month. Market leaders get 10+. Consider implementing a review request process.", date: "2 days ago", urgency: "medium" as const },
  { id: "ra5", store_id: "aurora", type: "yelp_drop", title: "Yelp Rating Dropped to 3.8", message: "Aurora's Yelp rating dropped 0.2 points in the last 30 days. Two recent negative reviews pulled it down. Respond to both and focus on encouraging positive Yelp reviews.", date: "1 week ago", urgency: "medium" as const },
];

const STORE_OPTIONS = [
  { value: "all", label: "All Locations" },
  ...SEED_STORES.map((s) => ({ value: s.slug, label: s.name })),
];

const GOOGLE_PROFILE_URL: Record<string, string> = {
  kent: "https://www.google.com/maps/search/LeeAngelo's+Kent+OH",
  aurora: "https://www.google.com/maps/search/LeeAngelo's+Aurora+OH",
  lindseys: "https://www.google.com/maps/search/Lindsey's+Pizza+Kent+OH",
};

const PINNED_STORE_DISPLAY: Record<string, string> = {
  kent: "LeeAngelo's (Kent)",
  aurora: "LeeAngelo's (Aurora)",
  lindseys: "Lindsey's Pizza",
  all: "All Locations",
};

const AREA_RANKING: Record<string, { rank: number; total: number }> = {
  kent: { rank: 4, total: 20 },
  aurora: { rank: 9, total: 20 },
  lindseys: { rank: 6, total: 20 },
  all: { rank: 6, total: 20 },
};

type OnboardingData = {
  store_name?: string | null;
  google_business_name?: string | null;
  city?: string | null;
  state?: string | null;
};

export default function ReputationPage() {
  const { session } = useAuth();
  const newUser = isNewUser(session);
  const [onboardingData, setOnboardingData] = useState<OnboardingData | null>(null);
  const [selectedStore, setSelectedStore] = useState("kent");
  const [activeTab, setActiveTab] = useState<"overview" | "reviews" | "market" | "alerts">("overview");
  const [expandedReview, setExpandedReview] = useState<string | null>(null);
  const [reviewFilter, setReviewFilter] = useState<"all" | "positive" | "neutral" | "negative">("all");

  useEffect(() => {
    const token = session?.access_token;
    if (!token) return;
    let cancelled = false;
    fetch("/api/onboarding", { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then((body) => {
        if (!cancelled && body.completed && body.data) setOnboardingData(body.data);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [session?.access_token]);

  const { profiles: googleProfiles, loading: profilesLoading } = useAllStoreProfiles();
  const googleData = selectedStore === "all" ? null : googleProfiles[selectedStore] ?? null;

  const newUserStoreName = (onboardingData?.store_name as string) || getNewUserStoreName(session);
  const newUserGoogleUrl = useMemo(() => {
    const name = (onboardingData?.google_business_name as string)?.trim();
    const city = (onboardingData?.city as string)?.trim();
    const state = (onboardingData?.state as string)?.trim();
    if (!name) return null;
    const query = [name, city, state].filter(Boolean).join(" ");
    return query ? `https://www.google.com/maps/search/${encodeURIComponent(query)}` : null;
  }, [onboardingData?.google_business_name, onboardingData?.city, onboardingData?.state]);

  const storeData = useMemo(() => {
    if (selectedStore === "all") {
      const stores = ["kent", "aurora", "lindseys"] as const;
      const google = { rating: 0, reviewCount: 0, trend: "flat" as const, recentChange: 0 };
      const yelp = { rating: 0, reviewCount: 0, trend: "flat" as const, recentChange: 0 };
      const facebook = { rating: 0, reviewCount: 0, trend: "flat" as const, recentChange: 0 };
      const tripadvisor = { rating: 0, reviewCount: 0, trend: "flat" as const, recentChange: 0 };
      stores.forEach((s) => {
        const d = REPUTATION_DATA[s];
        google.rating += d.google.rating;
        google.reviewCount += d.google.reviewCount;
        yelp.rating += d.yelp.rating;
        yelp.reviewCount += d.yelp.reviewCount;
        facebook.rating += d.facebook.rating;
        facebook.reviewCount += d.facebook.reviewCount;
        tripadvisor.rating += d.tripadvisor.rating;
        tripadvisor.reviewCount += d.tripadvisor.reviewCount;
      });
      const n = stores.length;
      return {
        google: { ...google, rating: Math.round((google.rating / n) * 10) / 10 },
        yelp: { ...yelp, rating: Math.round((yelp.rating / n) * 10) / 10 },
        facebook: { ...facebook, rating: Math.round((facebook.rating / n) * 10) / 10 },
        tripadvisor: { ...tripadvisor, rating: Math.round((tripadvisor.rating / n) * 10) / 10 },
      };
    }
    const base = REPUTATION_DATA[selectedStore] ?? REPUTATION_DATA.kent;
    if (googleData && selectedStore !== "all") {
      return {
        ...base,
        google: {
          rating: googleData.rating ?? base.google.rating,
          reviewCount: googleData.reviewCount ?? base.google.reviewCount,
          trend: base.google.trend,
          recentChange: base.google.recentChange,
        },
      };
    }
    return base;
  }, [selectedStore, googleData]);

  const sentimentScore = useMemo(() => {
    if (selectedStore === "all") {
      const k = calculateSentiment(REPUTATION_DATA.kent);
      const a = calculateSentiment(REPUTATION_DATA.aurora);
      const l = calculateSentiment(REPUTATION_DATA.lindseys);
      return Math.round((k + a + l) / 3);
    }
    return calculateSentiment(storeData);
  }, [selectedStore, storeData]);

  const totalReviews = useMemo(() => {
    return (
      storeData.google.reviewCount +
      storeData.yelp.reviewCount +
      storeData.facebook.reviewCount +
      storeData.tripadvisor.reviewCount
    );
  }, [storeData]);

  const googleReviews = useMemo(() => {
    if (!googleData?.reviews?.length || selectedStore === "all") return [];
    return googleData.reviews.map((r, i) => ({
      id: `google-live-${i}`,
      store_id: selectedStore,
      platform: "Google" as const,
      author: r.author,
      rating: r.rating,
      snippet: r.text,
      date: r.time,
      sentiment: r.rating >= 4 ? "positive" : r.rating === 3 ? "neutral" : "negative",
    }));
  }, [googleData, selectedStore]);

  const allReviewsForStore = useMemo(
    () => [...googleReviews, ...RECENT_REVIEWS],
    [googleReviews]
  );

  const filteredReviews = useMemo(() => {
    let list = allReviewsForStore.filter((r) => selectedStore === "all" || r.store_id === selectedStore);
    if (reviewFilter === "positive") list = list.filter((r) => r.sentiment === "positive");
    else if (reviewFilter === "neutral") list = list.filter((r) => r.sentiment === "neutral");
    else if (reviewFilter === "negative") list = list.filter((r) => r.sentiment === "negative");
    return list;
  }, [selectedStore, reviewFilter, allReviewsForStore]);

  const positiveCount = useMemo(() => allReviewsForStore.filter((r) => r.sentiment === "positive" && (selectedStore === "all" || r.store_id === selectedStore)).length, [selectedStore, allReviewsForStore]);
  const negativeCount = useMemo(() => allReviewsForStore.filter((r) => r.sentiment === "negative" && (selectedStore === "all" || r.store_id === selectedStore)).length, [selectedStore, allReviewsForStore]);

  const storeAlerts = useMemo(
    () => REPUTATION_ALERTS.filter((a) => selectedStore === "all" || a.store_id === selectedStore),
    [selectedStore]
  );

  const marketKey = selectedStore === "all" ? "kent" : selectedStore;
  const marketData = MARKET_RATINGS[marketKey] ?? [];
  const marketPosition = useMemo(() => {
    const yourName = selectedStore === "all" ? "LeeAngelo's Kent" : SEED_STORES.find((s) => s.slug === selectedStore)?.name ?? "";
    const idx = marketData.findIndex((m) => m.name.includes("LeeAngelo") || m.name.includes("Lindsey"));
    return idx >= 0 ? idx + 1 : 0;
  }, [marketData, selectedStore]);

  const reputationKpis = useMemo(() => {
    if (selectedStore === "all") {
      const stores = ["kent", "aurora", "lindseys"] as const;
      const avgResponse = Math.round(
        stores.reduce((s, id) => s + (SEED_REPUTATION_KPIS_BY_STORE[id]?.responseRatePct ?? 0), 0) / stores.length
      );
      const avgAi = Math.round(
        stores.reduce((s, id) => s + (SEED_REPUTATION_KPIS_BY_STORE[id]?.aiVisibilityScore ?? 0), 0) / stores.length
      );
      return { responseRatePct: avgResponse, aiVisibilityScore: avgAi };
    }
    return SEED_REPUTATION_KPIS_BY_STORE[selectedStore] ?? SEED_REPUTATION_KPIS_BY_STORE.kent;
  }, [selectedStore]);

  const pinnedStoreDisplay = newUser ? newUserStoreName : (PINNED_STORE_DISPLAY[selectedStore] ?? PINNED_STORE_DISPLAY.all);
  const areaRanking = AREA_RANKING[selectedStore] ?? AREA_RANKING.all;
  const googleProfileUrl = newUser ? newUserGoogleUrl : (selectedStore !== "all" ? GOOGLE_PROFILE_URL[selectedStore] : null);

  return (
    <div className="space-y-4 pb-28 min-w-0 overflow-x-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-white">Do We Suck?</h1>
          <p className="text-xs text-slate-400 mt-0.5">What the internet thinks about your business</p>
        </div>
        <EducationInfoIcon metricKey="reputation" />
      </div>

      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <label className="text-xs text-slate-500 shrink-0">Store:</label>
        </div>
        <div className="flex flex-wrap gap-2 overflow-x-auto overflow-visible pb-1 min-h-[44px] p-1">
          {newUser ? (
            <div className="px-3 py-2 rounded-lg text-xs font-medium border shrink-0 min-h-[44px] bg-zinc-800 border-[#E65100]/50 ring-2 ring-[#E65100] shadow-[0_0_8px_rgba(230,81,0,0.5)] text-white">
              {newUserStoreName}
            </div>
          ) : (
            STORE_OPTIONS.map((o) => {
              const isActive = selectedStore === o.value;
              return (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => setSelectedStore(o.value)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors border shrink-0 min-h-[44px] ${
                    isActive
                      ? "bg-zinc-800 border-[#E65100]/50 ring-2 ring-[#E65100] shadow-[0_0_8px_rgba(230,81,0,0.5)] text-white"
                      : "bg-zinc-900 text-slate-400 border-zinc-800 hover:text-slate-300"
                  }`}
                >
                  {o.label}
                </button>
              );
            })
          )}
        </div>
      </div>

      {googleData && <div className="mb-2"><DataSourceBadge source="google" lastUpdated="Live" /></div>}

      {/* THE METER — Hero */}
      <div className="bg-slate-800 rounded-2xl border border-slate-700 p-5 mb-4 text-center">
        <div className="flex items-center justify-center gap-2 mb-1">
          <div className="text-6xl font-bold" style={{ color: sentimentScore >= 85 ? "#34d399" : sentimentScore >= 70 ? "#fbbf24" : "#f87171" }}>
            {sentimentScore}%
          </div>
          <EducationInfoIcon metricKey="sentiment_score" size="sm" />
        </div>
        <div className="text-sm text-slate-400 mb-3">of the internet says</div>
        <div
          className={`inline-block px-4 py-2 rounded-xl text-lg font-bold ${
            sentimentScore >= 85 ? "bg-emerald-600/20 text-emerald-400" : sentimentScore >= 70 ? "bg-amber-600/20 text-amber-400" : "bg-red-600/20 text-red-400"
          }`}
        >
          {sentimentScore >= 85 ? "NO 👏" : sentimentScore >= 70 ? "EHH... 🤷" : "YEAH, KINDA 😬"}
        </div>

        <div className="grid grid-cols-4 gap-2 mt-5">
          {Object.entries(storeData).map(([platform, data]) => (
            <div key={platform} className="text-center">
              <div className="text-lg font-bold text-white">{data.rating}</div>
              <div className="flex items-center justify-center gap-0.5">
                <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                <span className="text-[10px] text-slate-500">({data.reviewCount})</span>
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5 capitalize">{platform}</div>
              {data.trend === "up" && <TrendingUp className="w-3 h-3 text-emerald-400 mx-auto mt-0.5" />}
              {data.trend === "down" && <TrendingDown className="w-3 h-3 text-red-400 mx-auto mt-0.5" />}
            </div>
          ))}
        </div>

        <div className="mt-4 pt-3 border-t border-slate-700 flex items-center gap-2">
          <span className="text-xs text-slate-500">{totalReviews} total reviews across all platforms</span>
          <EducationInfoIcon metricKey="platform_breakdown" size="sm" />
        </div>

        <div className="mt-4 pt-3 border-t border-slate-700 flex flex-wrap items-center justify-center gap-2">
          <span className="text-sm text-zinc-400">🏅</span>
          <span className="text-xl font-bold text-[#E65100]">{areaRanking.rank}</span>
          <span className="text-sm text-zinc-400">/ {areaRanking.total} in your area</span>
          <EducationInfoIcon metricKey="area_ranking" size="sm" />
        </div>
      </div>

      <div className="w-full bg-zinc-900 border border-zinc-700 rounded-2xl px-5 py-4 flex items-center justify-between shadow-[0_0_12px_rgba(230,81,0,0.3)] ring-2 ring-[#E65100] mb-3">
        <div>
          <div className="text-lg font-bold text-white">{pinnedStoreDisplay}</div>
          {newUser ? (
            <p className="text-xs text-zinc-400 mt-1">Connect your Google Business Profile to see live reviews</p>
          ) : (
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-base font-semibold text-amber-500">
                <Star className="w-4 h-4 inline fill-amber-500 text-amber-500 mr-0.5 align-middle" />
                {storeData.google.rating}
              </span>
              <span className="text-xs text-zinc-500">({storeData.google.reviewCount} reviews)</span>
            </div>
          )}
        </div>
        {googleProfileUrl && (
          <a
            href={googleProfileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 text-sm font-medium underline inline-flex items-center gap-1 shrink-0"
          >
            View on Google <ExternalLink className="w-4 h-4" />
          </a>
        )}
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-800 rounded-lg p-0.5 border border-slate-700 mb-4">
        {(["overview", "reviews", "market", "alerts"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors capitalize ${
              activeTab === tab ? "bg-slate-700 text-white" : "text-slate-400 hover:text-slate-300"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === "overview" && (
        <>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-3">
              <div className="flex items-center gap-2 mb-1">
                <ThumbsUp className="w-4 h-4 text-emerald-400" />
                <span className="text-xs text-slate-500">Positive</span>
              </div>
              <div className="text-xl font-bold text-emerald-400">{positiveCount}</div>
              <div className="text-[10px] text-slate-600">last 30 days</div>
            </div>
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-3">
              <div className="flex items-center gap-2 mb-1">
                <ThumbsDown className="w-4 h-4 text-red-400" />
                <span className="text-xs text-slate-500">Negative</span>
              </div>
              <div className="text-xl font-bold text-red-400">{negativeCount}</div>
              <div className="text-[10px] text-slate-600">last 30 days</div>
            </div>
          </div>

          <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-white flex items-center gap-2">
                Response Rate
                <EducationInfoIcon metricKey="response_rate" size="sm" />
              </span>
              <span className={`text-sm font-bold ${reputationKpis.responseRatePct >= 80 ? "text-emerald-400" : reputationKpis.responseRatePct >= 70 ? "text-amber-400" : "text-red-400"}`}>
                {reputationKpis.responseRatePct}%
              </span>
            </div>
            <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${reputationKpis.responseRatePct >= 80 ? "bg-emerald-400" : reputationKpis.responseRatePct >= 70 ? "bg-amber-400" : "bg-red-400"}`}
                style={{ width: `${reputationKpis.responseRatePct}%` }}
              />
            </div>
            <p className="text-xs text-slate-500 mt-2">You&apos;ve responded to {reputationKpis.responseRatePct}% of negative reviews. Benchmark: aim for 100% within 24 hours. Every response is visible to future customers.</p>
          </div>

          <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <Eye className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-semibold text-white">AI Visibility</span>
              <EducationInfoIcon metricKey="ai_visibility_score" size="sm" />
              <span className="text-[10px] px-2 py-0.5 rounded bg-purple-600/20 text-purple-400">Beta</span>
              <span className={`ml-auto text-xs font-semibold ${reputationKpis.aiVisibilityScore >= 70 ? "text-emerald-400" : reputationKpis.aiVisibilityScore >= 55 ? "text-amber-400" : "text-red-400"}`}>
                {reputationKpis.aiVisibilityScore}/100
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-3">How your business appears when people ask AI assistants for pizza recommendations.</p>
            <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden mb-3">
              <div
                className={`h-full ${reputationKpis.aiVisibilityScore >= 70 ? "bg-emerald-400" : reputationKpis.aiVisibilityScore >= 55 ? "bg-amber-400" : "bg-red-400"}`}
                style={{ width: `${reputationKpis.aiVisibilityScore}%` }}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-700/30">
                <span className="text-xs text-slate-400">ChatGPT</span>
                <span className="text-xs text-emerald-400 font-medium">Mentioned in &quot;best pizza Kent OH&quot;</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-700/30">
                <span className="text-xs text-slate-400">Perplexity</span>
                <span className="text-xs text-emerald-400 font-medium">Listed #2 for &quot;pizza near Kent State&quot;</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-700/30">
                <span className="text-xs text-slate-400">Google AI Overview</span>
                <span className="text-xs text-amber-400 font-medium">Not appearing yet</span>
              </div>
            </div>
            <p className="text-[10px] text-slate-600 mt-2">AI assistants pull from Google reviews, website content, and social media. More reviews + active Google Business Profile = better AI visibility.</p>
          </div>
        </>
      )}

      {/* REVIEWS TAB */}
      {activeTab === "reviews" && (
        <>
          <div className="flex flex-wrap gap-2 mb-4">
            {(["all", "positive", "neutral", "negative"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setReviewFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize ${
                  reviewFilter === f ? "bg-slate-700 text-white" : "bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-300"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          {filteredReviews.map((review) => (
            <div key={review.id} className="bg-slate-800 rounded-xl border border-slate-700 p-3 mb-2">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-white">{review.author}</span>
                  <span className="text-[10px] text-slate-600">·</span>
                  <span className="text-[10px] text-slate-500">{review.platform}</span>
                </div>
                <span className="text-[10px] text-slate-600">{review.date}</span>
              </div>
              <div className="flex items-center gap-1 mb-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className={`w-3 h-3 ${s <= review.rating ? "text-amber-400 fill-amber-400" : "text-slate-700"}`} />
                ))}
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">&quot;{review.snippet}&quot;</p>
              {review.sentiment === "negative" && (
                <div className="mt-2 px-3 py-2 rounded-lg bg-amber-600/10 border border-amber-700/30">
                  <p className="text-[10px] text-amber-300">
                    💡{" "}
                    <a
                      href={review.store_id && GOOGLE_PROFILE_URL[review.store_id] ? GOOGLE_PROFILE_URL[review.store_id] : "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#E65100] underline cursor-pointer"
                    >
                      Consider responding to this review.
                    </a>{" "}
                    A professional response shows future customers you care and often prompts the reviewer to update their rating.
                  </p>
                </div>
              )}
            </div>
          ))}
        </>
      )}

      {/* MARKET TAB */}
      {activeTab === "market" && (
        <>
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-sm font-semibold text-white">Google Rating — Your Market</h3>
              <EducationInfoIcon metricKey="market_comparison" size="sm" />
            </div>
            {marketData.map((shop, i) => {
              const isYou = shop.name.includes("LeeAngelo") || shop.name.includes("Lindsey");
              return (
                <div key={i} className={`flex items-center justify-between p-2 rounded-lg mb-1 ${isYou ? "bg-[#E65100]/10 border border-[#E65100]/30" : ""}`}>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs ${isYou ? "text-white font-semibold" : "text-slate-400"}`}>
                      {i + 1}. {shop.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                    <span className={`text-sm font-medium ${isYou ? "text-[#E65100]" : "text-white"}`}>{shop.rating}</span>
                    <span className="text-[10px] text-slate-600">({shop.reviewCount})</span>
                  </div>
                </div>
              );
            })}
            <div className="mt-3 px-3 py-2 rounded-lg bg-slate-700/50">
              <p className="text-xs text-slate-400">
                {marketPosition === 1
                  ? "You're #1 in your market. Keep it there — review velocity matters as much as rating."
                  : `You're #${marketPosition} in your market. ${marketPosition <= 3 ? "Strong position. Focus on review volume to build separation." : "Room to grow. Focus on responding to negative reviews and asking happy customers to review."}`}
              </p>
            </div>
          </div>

          <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 mb-4">
            <h3 className="text-sm font-semibold text-white mb-3">Review Velocity — Last 30 Days</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-slate-500">Your Reviews</div>
                <div className="text-lg text-white font-bold">12</div>
                <div className="text-[10px] text-slate-600">this month</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Market Average</div>
                <div className="text-lg text-white font-bold">8</div>
                <div className="text-[10px] text-slate-600">per shop/month</div>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-3">You&apos;re getting 50% more reviews than the average competitor. This builds trust and improves your Google ranking.</p>
          </div>
        </>
      )}

      {/* ALERTS TAB */}
      {activeTab === "alerts" &&
        storeAlerts.map((alert) => (
          <div
            key={alert.id}
            className={`bg-slate-800 rounded-xl border p-3 mb-2 ${
              alert.urgency === "high" ? "border-red-700/30" : alert.urgency === "medium" ? "border-amber-700/30" : "border-slate-700"
            }`}
          >
            <div className="flex items-start gap-2">
              <div
                className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                  alert.urgency === "high" ? "bg-red-400" : alert.urgency === "medium" ? "bg-amber-400" : "bg-emerald-400"
                }`}
              />
              <div>
                <div className="text-sm font-medium text-white">{alert.title}</div>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">{alert.message}</p>
                <span className="text-[10px] text-slate-600 mt-1 block">{alert.date}</span>
              </div>
            </div>
          </div>
        ))}
    </div>
  );
}
