"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Star, ExternalLink, ChevronDown, RefreshCw, MapPin } from "lucide-react";
import { useAuth } from "@/src/lib/auth-context";
import { isNewUser, getNewUserStoreName } from "@/src/lib/user-scope";
import { EducationInfoIcon } from "@/src/components/education/InfoIcon";

const STORES = [
  { id: "7cd4cb61-7e90-44f5-8739-5f19074262b8", name: "Kent" },
  { id: "906e5dfb-6199-4460-936d-fc1e783e4574", name: "Aurora" },
  { id: "3fb37b49-cfe7-4a9f-9940-a472b5def680", name: "Lindsey's" },
];

type Profile = {
  id: string;
  name: string;
  address: string | null;
  google_rating: number | null;
  google_review_count: number | null;
  price_level: string | null;
  google_maps_url: string | null;
  last_synced_at: string | null;
};

type Inspection = {
  id: string;
  inspection_date: string;
  inspection_type: string;
  result: string | null;
  critical_violations: unknown[];
  noncritical_violations: unknown[];
};

type Competitor = {
  id: string;
  name: string;
  distance_miles: number | null;
  google_rating: number | null;
  google_review_count: number | null;
  price_level: string | null;
  google_maps_url: string | null;
};

function formatDate(dateStr: string): string {
  return new Date(dateStr + "T00:00:00Z").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function resultBadgeClass(result: string | null): string {
  if (!result) return "bg-slate-600/30 text-slate-300";
  const r = result.toLowerCase();
  if (r.includes("pass") && !r.includes("condition")) return "bg-emerald-600/30 text-emerald-300";
  if (r.includes("condition")) return "bg-amber-600/30 text-amber-300";
  if (r.includes("fail")) return "bg-red-600/30 text-red-300";
  return "bg-slate-600/30 text-slate-300";
}

function priceLevelDollars(level: string | null): string {
  if (!level) return "—";
  const v = level.replace(/[^0-9]/g, "");
  const n = parseInt(v, 10) || 0;
  return "$".repeat(Math.min(n, 4)) || "—";
}

type Tier = "gold" | "silver" | "bronze" | "red";
function getTier(score: number): { tier: Tier; label: string; emoji: string } {
  if (score >= 80) return { tier: "gold", label: "Market Leader", emoji: "🥇" };
  if (score >= 60) return { tier: "silver", label: "Above Average", emoji: "🥈" };
  if (score >= 40) return { tier: "bronze", label: "Holding Your Own", emoji: "🥉" };
  return { tier: "red", label: "At Risk", emoji: "⚠️" };
}

function calculateMarketPosition(
  profile: Profile | null,
  competitors: Competitor[]
): {
  score: number;
  yourRank: number;
  totalCompetitors: number;
  marketAvgRating: number | null;
  tier: Tier;
  tierLabel: string;
  tierEmoji: string;
  displayPercentile: number;
} {
  if (!profile) {
    return {
      score: 0,
      yourRank: 0,
      totalCompetitors: competitors.length,
      marketAvgRating: null,
      tier: "red",
      tierLabel: "At Risk",
      tierEmoji: "⚠️",
      displayPercentile: 0,
    };
  }

  const totalCompetitors = 1 + competitors.length;
  const ownRating = profile.google_rating ?? 0;
  const ratings = competitors
    .map((c) => c.google_rating)
    .filter((r): r is number => r != null);
  const countHigher = competitors.filter((c) => (c.google_rating ?? 0) > ownRating).length;
  const yourRank = countHigher + 1;
  const percentile =
    totalCompetitors > 0
      ? ((totalCompetitors - yourRank + 1) / totalCompetitors) * 100
      : 0;
  const displayPercentile = Math.round(percentile);
  let score = Math.round(percentile);
  if (ownRating >= 4.5) score += 5;
  if ((profile.google_review_count ?? 0) > 500) score += 5;
  score = Math.min(100, score);

  const marketAvgRating =
    ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null;
  const { tier, label: tierLabel, emoji: tierEmoji } = getTier(score);

  return {
    score,
    yourRank,
    totalCompetitors,
    marketAvgRating,
    tier,
    tierLabel,
    tierEmoji,
    displayPercentile,
  };
}

function getCoachingLine(
  tier: Tier,
  score: number,
  yourRank: number,
  totalCompetitors: number,
  reviewCount: number | null
): string {
  if (tier === "red") {
    return "To reach Bronze: climb to top 60% of your market or get your rating above the market average.";
  }
  if (tier === "bronze") {
    const targetRank = Math.max(1, Math.ceil(totalCompetitors * 0.4 + 1));
    const reviewsNeeded = (reviewCount ?? 0) < 500 ? 500 - (reviewCount ?? 0) : 0;
    const reviewPart =
      reviewsNeeded > 0 ? `, or reach ${reviewsNeeded} more Google reviews` : "";
    return `To reach Silver 🥈: Move from #${yourRank} to #${targetRank} in your market${reviewPart}.`;
  }
  if (tier === "silver") {
    return "To reach Gold 🥇: Reach top 25% of your market and maintain a 4.5+ rating.";
  }
  return "🥇 Market Leader — you're in the top 20% of your market. Defend your position.";
}

function getProgressBarFillClass(tier: Tier): string {
  if (tier === "gold") return "bg-amber-400";
  if (tier === "silver") return "bg-slate-400";
  if (tier === "bronze") return "bg-orange-400";
  return "bg-red-400";
}

function consecutiveCleanStreak(inspections: Inspection[]): number {
  const sorted = [...inspections].sort(
    (a, b) => new Date(b.inspection_date).getTime() - new Date(a.inspection_date).getTime()
  );
  let count = 0;
  for (const i of sorted) {
    const r = (i.result ?? "").toLowerCase();
    if (r.includes("pass with condition") || (r.includes("pass") && !r.includes("fail"))) {
      count++;
    } else {
      break;
    }
  }
  return count;
}

export default function InspectionRadarPage() {
  const { session, loading } = useAuth();
  const newUser = isNewUser(session);
  const newUserStoreName = getNewUserStoreName(session);
  const [selectedStoreId, setSelectedStoreId] = useState(STORES[0].id);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [syncLoading, setSyncLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [animatedScore, setAnimatedScore] = useState(0);

  const fetchRadar = useCallback(async (storeId: string) => {
    setLoadingData(true);
    try {
      const res = await fetch(`/api/inspection-radar?storeId=${encodeURIComponent(storeId)}`);
      if (!res.ok) {
        setProfile(null);
        setInspections([]);
        setCompetitors([]);
        return;
      }
      const data = await res.json();
      setProfile(data.profile);
      setInspections(data.inspections ?? []);
      setCompetitors(data.competitors ?? []);
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    fetchRadar(selectedStoreId);
  }, [selectedStoreId, fetchRadar]);

  const handleSync = async () => {
    setSyncLoading(true);
    try {
      const res = await fetch("/api/google-places/sync", { method: "POST" });
      if (res.ok) await fetchRadar(selectedStoreId);
    } finally {
      setSyncLoading(false);
    }
  };

  const position = useMemo(
    () => calculateMarketPosition(profile, competitors),
    [profile, competitors]
  );

  const threats = useMemo(() => {
    const ownRating = profile?.google_rating ?? 0;
    return competitors.filter(
      (c) => (c.google_rating ?? 0) >= ownRating && (c.distance_miles ?? 999) <= 2
    );
  }, [profile, competitors]);

  const opportunities = useMemo(() => {
    return competitors.filter(
      (c) => (c.google_rating ?? 0) < 3.5 && (c.distance_miles ?? 999) <= 3
    );
  }, [competitors]);

  const allTableRows = useMemo(() => {
    const list: (Competitor & { isOwn?: boolean })[] = profile
      ? [
          {
            id: profile.id,
            name: profile.name,
            distance_miles: 0,
            google_rating: profile.google_rating,
            google_review_count: profile.google_review_count,
            price_level: profile.price_level,
            google_maps_url: profile.google_maps_url,
            isOwn: true,
          },
          ...competitors,
        ]
      : [...competitors];
    return list.sort((a, b) => (b.google_rating ?? 0) - (a.google_rating ?? 0));
  }, [profile, competitors]);

  const lastSynced = profile?.last_synced_at ?? null;
  const streak = useMemo(() => consecutiveCleanStreak(inspections), [inspections]);
  const ownRating = profile?.google_rating ?? null;

  // Animate progress bar fill on load when score is available
  useEffect(() => {
    if (!profile || loadingData) return;
    setAnimatedScore(0);
    const t = requestAnimationFrame(() => {
      requestAnimationFrame(() => setAnimatedScore(position.score));
    });
    return () => cancelAnimationFrame(t);
  }, [profile, loadingData, position.score]);

  if (loading) return <div className="min-h-screen bg-zinc-950" />;
  if (newUser) {
    return (
      <div className="space-y-4 pb-28">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-white">Are We Winning?</h1>
            <p className="text-xs text-slate-400 mt-0.5">{newUserStoreName}</p>
          </div>
          <EducationInfoIcon metricKey="inspection_radar" size="lg" />
        </div>
        <div className="bg-zinc-900/50 rounded-xl border border-zinc-800/50 shadow-sm p-6 text-center">
          <p className="text-sm text-zinc-300">Are We Winning? will be available here soon.</p>
        </div>
      </div>
    );
  }

  const tierBg =
    position.tier === "gold"
      ? "bg-amber-900/20 border-amber-500/30"
      : position.tier === "silver"
        ? "bg-slate-700/30 border-slate-400/30"
        : position.tier === "bronze"
          ? "bg-orange-900/20 border-orange-500/30"
          : "bg-red-900/20 border-red-500/30";
  const tierBadgeClass =
    position.tier === "gold"
      ? "bg-amber-500/30 text-amber-400"
      : position.tier === "silver"
        ? "bg-slate-500/30 text-slate-300"
        : position.tier === "bronze"
          ? "bg-orange-500/30 text-orange-400"
          : "bg-red-500/30 text-red-400";

  return (
    <div className="space-y-5 pb-28">
      {/* SECTION 0 — Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white">Are We Winning?</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Your market position against every pizza competitor within 5 miles.
          </p>
        </div>
        <EducationInfoIcon metricKey="inspection_radar" size="lg" />
      </div>

      {/* Store tabs */}
      <div className="flex gap-1 bg-slate-800 rounded-lg p-1">
        {STORES.map((store) => (
          <button
            key={store.id}
            type="button"
            onClick={() => setSelectedStoreId(store.id)}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors min-h-[44px] touch-manipulation ${
              selectedStoreId === store.id ? "bg-slate-700 text-white" : "text-slate-500"
            }`}
          >
            {store.name}
          </button>
        ))}
      </div>

      {loadingData ? (
        <div className="text-center py-12 text-slate-500 text-sm">Loading…</div>
      ) : (
        <>
          {/* SECTION 1 — Market Position Score (hero) */}
          <div className={`rounded-2xl border p-6 sm:p-8 ${tierBg}`}>
            {profile ? (
              <>
                <div className="text-center">
                  <p className="text-6xl sm:text-7xl font-bold text-white tabular-nums">
                    {position.score}
                  </p>
                  <p className={`mt-2 inline-block px-4 py-1.5 rounded-full text-sm font-semibold ${tierBadgeClass}`}>
                    {position.tierEmoji} {position.tierLabel}
                  </p>

                  {/* Progress bar */}
                  <div className="mt-6 max-w-md mx-auto">
                    <div
                      className="h-3 w-full rounded-full bg-slate-700 overflow-hidden"
                      role="progressbar"
                      aria-valuenow={position.score}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    >
                      <div
                        className={`h-full rounded-full transition-[width] duration-1000 ease-out ${getProgressBarFillClass(position.tier)}`}
                        style={{ width: `${animatedScore}%` }}
                      />
                    </div>
                    <div className="flex justify-between mt-1.5 text-[10px] text-slate-500">
                      <span>⚠️ 0</span>
                      <span>🥉 40</span>
                      <span>🥈 60</span>
                      <span>🥇 80</span>
                      <span>100</span>
                    </div>
                  </div>

                  {/* Next tier coaching line */}
                  <p className="text-slate-300 text-sm mt-4 max-w-lg mx-auto">
                    {getCoachingLine(
                      position.tier,
                      position.score,
                      position.yourRank,
                      position.totalCompetitors,
                      profile.google_review_count
                    )}
                  </p>

                  <p className="text-slate-400 text-sm mt-3">
                    Ranked #{position.yourRank} out of {position.totalCompetitors} pizza spots within 5 miles
                    {position.totalCompetitors > 0 && (
                      <> — top {position.displayPercentile}% of your market</>
                    )}
                  </p>
                  <p className="text-white text-sm mt-2">
                    Your rating: {ownRating != null ? `${ownRating.toFixed(1)}` : "—"} ⭐
                    {position.marketAvgRating != null && (
                      <> vs Market avg: {position.marketAvgRating.toFixed(1)} ⭐</>
                    )}
                  </p>
                </div>
              </>
            ) : (
              <div className="text-center py-6">
                <p className="text-slate-400 text-sm mb-4">Sync to calculate your score</p>
                <button
                  type="button"
                  onClick={handleSync}
                  disabled={syncLoading}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#E65100] text-white font-medium disabled:opacity-50"
                >
                  <RefreshCw className={`w-5 h-5 ${syncLoading ? "animate-spin" : ""}`} />
                  Sync
                </button>
              </div>
            )}
          </div>

          {/* SECTION 2 — Your Google Profile (compact) */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
              Your Google Profile
            </h2>
            {profile ? (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                <span className="font-medium text-white">{profile.name}</span>
                <span className="text-slate-400">
                  {profile.google_rating != null ? (
                    <span className="inline-flex items-center gap-0.5 text-white">
                      {profile.google_rating.toFixed(1)} <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    </span>
                  ) : (
                    "—"
                  )}
                </span>
                <span className="text-slate-500">
                  {profile.google_review_count != null
                    ? `${profile.google_review_count} reviews`
                    : ""}
                </span>
                <span className="text-slate-500">
                  {profile.price_level ? priceLevelDollars(profile.price_level) : ""}
                </span>
                {profile.google_maps_url && (
                  <a
                    href={profile.google_maps_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-amber-400 hover:text-amber-300"
                  >
                    Maps <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
                {profile.last_synced_at && (
                  <span className="text-slate-600 text-xs ml-auto">
                    Synced {new Date(profile.last_synced_at).toLocaleDateString()}
                  </span>
                )}
              </div>
            ) : (
              <p className="text-slate-500 text-sm">Sync to load your Google profile.</p>
            )}
          </div>

          {/* SECTION 3 — Threats & Opportunities */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-red-950/30 rounded-xl border border-red-900/50 p-4">
              <h3 className="text-sm font-bold text-red-400 mb-1">
                🔴 Nearby Threats — High rated competitors close to you
              </h3>
              {threats.length === 0 ? (
                <p className="text-slate-400 text-sm mt-2">
                  🟢 No high-rated competitors within 2 miles. Hold your ground.
                </p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {threats.map((c) => (
                    <li key={c.id} className="flex justify-between items-baseline text-sm">
                      <span className="text-white font-medium">{c.name}</span>
                      <span className="text-slate-400">
                        {c.distance_miles != null ? `${c.distance_miles.toFixed(1)} mi` : "—"} ·{" "}
                        {c.google_rating != null ? c.google_rating.toFixed(1) : "—"} ⭐ ·{" "}
                        {c.google_review_count ?? "—"} reviews
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="bg-green-950/20 rounded-xl border border-green-900/40 p-4">
              <h3 className="text-sm font-bold text-amber-400 mb-1">
                🟡 Opportunities — Underperforming competitors nearby
              </h3>
              <p className="text-slate-500 text-xs mb-2">
                Their customers are looking for better. Be the answer.
              </p>
              {opportunities.length === 0 ? (
                <p className="text-slate-400 text-sm">
                  Strong market — competitors near you are performing well.
                </p>
              ) : (
                <ul className="space-y-2">
                  {opportunities.map((c) => (
                    <li key={c.id} className="flex justify-between items-baseline text-sm">
                      <span className="text-white font-medium">{c.name}</span>
                      <span className="text-slate-400">
                        {c.distance_miles != null ? `${c.distance_miles.toFixed(1)} mi` : "—"} ·{" "}
                        {c.google_rating != null ? c.google_rating.toFixed(1) : "—"} ⭐
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* SECTION 4 — Inspection Streak */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
            <h2 className="text-sm font-semibold text-white mb-2">Inspection Streak</h2>
            {inspections.length > 0 && streak > 0 ? (
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-2xl font-bold text-amber-400">🔥 {streak} consecutive clean inspections</span>
                {inspections[0] && (
                  <>
                    <span className="text-slate-500 text-sm">
                      Last: {formatDate(inspections[0].inspection_date)}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-xs ${resultBadgeClass(inspections[0].result)}`}
                    >
                      {inspections[0].result ?? "—"}
                    </span>
                  </>
                )}
              </div>
            ) : inspections.length > 0 ? (
              <p className="text-slate-400 text-sm">
                Last inspection: {formatDate(inspections[0].inspection_date)} —{" "}
                <span className={resultBadgeClass(inspections[0].result)}>{inspections[0].result ?? "—"}</span>
              </p>
            ) : (
              <>
                <p className="text-slate-300 font-medium">Inspection streak starts with your first report.</p>
                <p className="text-slate-500 text-sm mt-1">
                  Reports are filed by your health district twice a year. They load here automatically as they come in.
                </p>
              </>
            )}
          </div>

          {/* SECTION 5 — Inspection History */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
            <div className="p-4 border-b border-slate-700">
              <h2 className="text-sm font-semibold text-white">Inspection History</h2>
            </div>
            <div className="p-4">
              {inspections.length === 0 ? (
                <p className="text-slate-500 text-sm py-2 text-center">
                  Inspection reports are loaded as they come in. No reports on file yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {inspections.map((insp) => {
                    const isExpanded = expandedId === insp.id;
                    const critical = Array.isArray(insp.critical_violations)
                      ? insp.critical_violations
                      : [];
                    const noncritical = Array.isArray(insp.noncritical_violations)
                      ? insp.noncritical_violations
                      : [];
                    return (
                      <div
                        key={insp.id}
                        className="rounded-lg border border-slate-700 overflow-hidden"
                      >
                        <button
                          type="button"
                          onClick={() => setExpandedId(isExpanded ? null : insp.id)}
                          className="w-full text-left p-3 flex items-center justify-between gap-2"
                        >
                          <div className="flex flex-wrap items-center gap-2 min-w-0">
                            <span className="text-sm text-white font-medium">
                              {formatDate(insp.inspection_date)}
                            </span>
                            <span className="px-2 py-0.5 rounded text-xs bg-slate-600/50 text-slate-300">
                              {insp.inspection_type}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded text-xs ${resultBadgeClass(insp.result)}`}
                            >
                              {insp.result ?? "—"}
                            </span>
                            {critical.length > 0 && (
                              <span className="px-2 py-0.5 rounded text-xs bg-red-600/30 text-red-300">
                                {critical.length} critical
                              </span>
                            )}
                            {noncritical.length > 0 && (
                              <span className="px-2 py-0.5 rounded text-xs bg-slate-600/50 text-slate-400">
                                {noncritical.length} non-critical
                              </span>
                            )}
                          </div>
                          <ChevronDown
                            className={`w-4 h-4 text-slate-500 flex-shrink-0 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                          />
                        </button>
                        {isExpanded && (
                          <div className="px-3 pb-3 pt-1 border-t border-slate-700 space-y-2">
                            {critical.length > 0 && (
                              <div>
                                <p className="text-xs font-medium text-red-400 mb-1">Critical</p>
                                <ul className="space-y-0.5">
                                  {critical.map((v, i) => (
                                    <li key={i} className="text-xs text-red-300/90">
                                      {typeof v === "string" ? v : JSON.stringify(v)}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {noncritical.length > 0 && (
                              <div>
                                <p className="text-xs font-medium text-slate-500 mb-1">Non-critical</p>
                                <ul className="space-y-0.5">
                                  {noncritical.map((v, i) => (
                                    <li key={i} className="text-xs text-slate-400">
                                      {typeof v === "string" ? v : JSON.stringify(v)}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* SECTION 6 — Full competitor table */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
            <div className="p-4 border-b border-slate-700 flex items-center justify-between flex-wrap gap-2">
              <h2 className="text-sm font-semibold text-white">All Competitors Within 5 Miles</h2>
              <button
                type="button"
                onClick={handleSync}
                disabled={syncLoading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700 text-slate-200 text-xs font-medium hover:bg-slate-600 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncLoading ? "animate-spin" : ""}`} />
                Sync
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 border-b border-slate-700 bg-slate-800/80">
                    <th className="py-3 px-3 font-medium">Rank</th>
                    <th className="py-3 px-3 font-medium">Name</th>
                    <th className="py-3 px-3 font-medium">Miles Away</th>
                    <th className="py-3 px-3 font-medium">Rating</th>
                    <th className="py-3 px-3 font-medium">Reviews</th>
                    <th className="py-3 px-3 font-medium">Price</th>
                    <th className="py-3 px-3 font-medium">Threat Level</th>
                    <th className="py-3 px-3 font-medium">Maps</th>
                  </tr>
                </thead>
                <tbody>
                  {allTableRows.map((row, idx) => {
                    const rank = idx + 1;
                    const dist = row.distance_miles ?? 999;
                    const rating = row.google_rating ?? 0;
                    const isOwn = "isOwn" in row && row.isOwn;
                    const threatLevel =
                      rating >= (ownRating ?? 0) && dist <= 2
                        ? "🔴"
                        : rating >= (ownRating ?? 0) && dist <= 5
                          ? "🟡"
                          : "🟢";
                    return (
                      <tr
                        key={row.id}
                        className={`border-b border-slate-700/50 ${
                          isOwn ? "bg-amber-900/10 border-l-2 border-l-amber-500/50" : ""
                        }`}
                      >
                        <td className="py-2.5 px-3 font-medium text-slate-400">{rank}</td>
                        <td className="py-2.5 px-3 text-white font-medium">
                          {row.name}
                          {isOwn && (
                            <span className="ml-2 text-xs text-amber-400 font-normal">← You</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-slate-400">
                          {row.distance_miles != null ? `${row.distance_miles.toFixed(1)} mi` : "—"}
                        </td>
                        <td className="py-2.5 px-3 text-slate-300">
                          {row.google_rating != null ? (
                            <span className="inline-flex items-center gap-0.5">
                              {row.google_rating.toFixed(1)}{" "}
                              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-slate-400">{row.google_review_count ?? "—"}</td>
                        <td className="py-2.5 px-3 text-slate-400">
                          {priceLevelDollars(row.price_level)}
                        </td>
                        <td className="py-2.5 px-3 text-lg">{threatLevel}</td>
                        <td className="py-2.5 px-3">
                          {row.google_maps_url ? (
                            <a
                              href={row.google_maps_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-slate-400 hover:text-white"
                              aria-label="Open in Maps"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          ) : (
                            "—"
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-slate-500 p-4 border-t border-slate-700/50">
              Google ratings synced weekly
              {lastSynced && ` — last synced ${new Date(lastSynced).toLocaleDateString()}`}
            </p>
          </div>
        </>
      )}
    </div>
  );
}
