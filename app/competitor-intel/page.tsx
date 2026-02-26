"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Target,
  Star,
  MapPin,
  ExternalLink,
  ChevronDown,
} from "lucide-react";
import {
  getCompetitorsByStore,
  getAlertsByStore,
  getMarketAvgPrice,
  type Competitor,
} from "@/src/lib/competitor-data";
import { MENU_DATA } from "@/src/lib/menu-data";
import { SEED_STORES } from "@/src/lib/seed-data";
import { getStoreLocation } from "@/src/lib/store-locations";
import { EducationInfoIcon } from "@/src/components/education/InfoIcon";
import { DataDisclaimer } from "@/src/components/ui/DataDisclaimer";
import DataSourceBadge from "@/src/components/ui/DataSourceBadge";
import { usePlacesData } from "@/src/hooks/usePlacesData";

const STORE_OPTIONS = [
  { value: "all", label: "All Locations" },
  ...SEED_STORES.map((s) => ({ value: s.slug, label: s.name })),
];

function formatTime(isoString: string): string {
  const now = new Date();
  const date = new Date(isoString);
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  const diffHours = Math.floor(diffMs / 3600000);
  if (diffHours < 24) return diffHours <= 1 ? "1 hour ago" : `${diffHours} hours ago`;
  if (diffDays === 1) return "1 day ago";
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined });
}

function getStoreName(storeId: string): string {
  return SEED_STORES.find((s) => s.slug === storeId)?.name ?? storeId;
}

export default function CompetitorIntelPage() {
  const [selectedStore, setSelectedStore] = useState("all");
  const [expandedCompetitor, setExpandedCompetitor] = useState<string | null>(null);
  const [view, setView] = useState<"overview" | "alerts" | "pricing">("overview");
  const [competitorInsights, setCompetitorInsights] = useState<{
    loading: boolean;
    themes: string[];
    topCompetitor: string | null;
  }>({ loading: false, themes: [], topCompetitor: null });

  const { competitors: liveCompetitors, storeProfile, loading: placesLoading, error: placesError } = usePlacesData(
    selectedStore === "all" ? "kent" : selectedStore
  );
  const existingSeedCompetitors = useMemo(() => getCompetitorsByStore(selectedStore), [selectedStore]);
  const isLiveData = liveCompetitors.length > 0;
  const alerts = useMemo(() => {
    const list = getAlertsByStore(selectedStore);
    return [...list].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [selectedStore]);
  const marketAvg = useMemo(() => getMarketAvgPrice(selectedStore), [selectedStore]);

  const yourCheese = useMemo(
    () => MENU_DATA.find((m) => m.store_id === selectedStore && m.item_name === "Cheese Pizza"),
    [selectedStore]
  );
  const yourPrice = yourCheese?.sizes.find((s) => s.size_name === "Large")?.price ?? 0;

  const priceDiffPct = marketAvg.avgCheese > 0 ? ((yourPrice - marketAvg.avgCheese) / marketAvg.avgCheese) * 100 : 0;

  const rankedLiveCompetitors = useMemo(() => {
    const sorted = [...liveCompetitors].sort((a, b) => {
      const ar = a.rating ?? -1;
      const br = b.rating ?? -1;
      if (br !== ar) return br - ar;
      if (b.reviewCount !== a.reviewCount) return b.reviewCount - a.reviewCount;
      return a.distance - b.distance;
    });
    return sorted.map((c, idx) => ({ ...c, rank: idx + 1 }));
  }, [liveCompetitors]);

  const competitorsSortedByPrice = useMemo(
    () =>
      [...existingSeedCompetitors]
        .filter((c) => c.price_large_cheese != null && c.price_large_cheese > 0)
        .sort((a, b) => (a.price_large_cheese ?? 0) - (b.price_large_cheese ?? 0)),
    [existingSeedCompetitors]
  );

  const yourStoreName = getStoreName(selectedStore);

  useEffect(() => {
    let cancelled = false;
    async function fetchInsights() {
      if (liveCompetitors.length === 0) return;

      const topRated = [...liveCompetitors]
        .filter((c) => c.rating !== null && c.rating > (storeProfile?.rating ?? 0))
        .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
        .slice(0, 3);

      if (topRated.length === 0) {
        if (!cancelled) setCompetitorInsights({ loading: false, themes: [], topCompetitor: null });
        return;
      }

      if (!cancelled) setCompetitorInsights((prev) => ({ ...prev, loading: true }));

      const allReviewTexts: string[] = [];
      const topName = topRated[0]?.name || null;

      for (const comp of topRated) {
        try {
          const res = await fetch(`/api/places/details?placeId=${comp.placeId}`);
          if (!res.ok) continue;
          const data = await res.json();
          if (data.reviews) {
            allReviewTexts.push(
              ...(data.reviews as Array<{ rating: number; text: string }>)
                .filter((r) => r.rating >= 4)
                .map((r) => r.text)
            );
          }
        } catch {
          // ignore
        }
      }

      const keywords: Record<string, number> = {};
      const meaningfulWords = [
        "fast",
        "quick",
        "friendly",
        "fresh",
        "hot",
        "delicious",
        "crispy",
        "cheesy",
        "consistent",
        "clean",
        "affordable",
        "generous",
        "portions",
        "service",
        "delivery",
        "staff",
        "atmosphere",
        "authentic",
        "homemade",
        "quality",
        "value",
        "price",
        "dough",
        "sauce",
        "cheese",
        "crust",
        "toppings",
        "wings",
        "salad",
        "breadsticks",
        "family",
        "kids",
        "welcoming",
        "cozy",
        "warm",
        "professional",
        "reliable",
        "menu",
        "variety",
        "options",
        "specials",
        "deals",
        "convenient",
        "location",
        "parking",
        "online",
        "ordering",
        "app",
        "pickup",
        "carryout",
      ];

      allReviewTexts.forEach((text) => {
        const lower = text.toLowerCase();
        meaningfulWords.forEach((word) => {
          if (lower.includes(word)) {
            keywords[word] = (keywords[word] || 0) + 1;
          }
        });
      });

      const themes = Object.entries(keywords)
        .filter(([_, count]) => count >= 2)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([word]) => word);

      if (!cancelled) setCompetitorInsights({ loading: false, themes, topCompetitor: topName });
    }

    fetchInsights();
    return () => {
      cancelled = true;
    };
  }, [liveCompetitors, storeProfile?.rating]);

  function toggleExpand(id: string) {
    setExpandedCompetitor((prev) => (prev === id ? null : id));
  }

  return (
    <div className="space-y-4 pb-28 min-w-0 overflow-x-hidden">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-white">Competitor Intel</h1>
          <p className="text-xs text-slate-400 mt-0.5">Know your market. Price with confidence.</p>
        </div>
        <EducationInfoIcon metricKey="competitor_intelligence" />
      </div>

      <div className="flex items-center gap-2">
        <label className="text-xs text-slate-500">Store:</label>
        <select
          value={selectedStore}
          onChange={(e) => setSelectedStore(e.target.value)}
          className="dashboard-input rounded-lg border border-slate-600 bg-black/30 px-3 py-2 text-sm text-white focus:border-brand/60 focus:outline-none"
        >
          {STORE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2 mb-2 flex-wrap">
        {isLiveData && <DataSourceBadge source="google" lastUpdated="Live" />}
        {!isLiveData && placesLoading && <span className="text-[10px] text-slate-500">Loading live data...</span>}
        {!isLiveData && !placesLoading && <DataSourceBadge source="manual" lastUpdated="Seed data" />}
      </div>

      <div className="flex bg-slate-800 rounded-lg p-0.5 border border-slate-700 mb-4">
        {(["overview", "alerts", "pricing"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setView(tab)}
            className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors capitalize ${
              view === tab ? "bg-slate-700 text-white" : "text-slate-400 hover:text-slate-300"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {view === "overview" && (
        <>
          {placesLoading && !storeProfile && (
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 mb-4">
              <p className="text-xs text-slate-500 animate-pulse">Loading your store data...</p>
            </div>
          )}
          {storeProfile && (() => {
            console.log("storeProfile:", JSON.stringify(storeProfile, null, 2));
            return (
              <div className="bg-[#E65100]/10 border border-[#E65100]/30 rounded-xl p-4 mb-4">
                {/* Badge row */}
                <div className="flex items-center gap-2 mb-2">
                  <div className="px-2 py-0.5 rounded bg-[#E65100]/20">
                    <span className="text-[9px] font-bold text-[#E65100] uppercase tracking-wide">Your Store</span>
                  </div>
                  {storeProfile.isOpen === true && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-600/20 text-emerald-400">Open Now</span>
                  )}
                  {storeProfile.isOpen === false && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-600/20 text-red-400">Closed</span>
                  )}
                </div>

                {/* Store name */}
                <p className="text-sm font-semibold text-white mb-0.5">
                  {storeProfile.name || getStoreLocation(selectedStore === "all" ? "kent" : selectedStore)?.name || "Your Store"}
                </p>

                {/* Address */}
                <p className="text-[10px] text-slate-500 mb-3">
                  {storeProfile.address || getStoreLocation(selectedStore === "all" ? "kent" : selectedStore)?.address || ""}
                </p>

                {/* Rating row — ALWAYS visible */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-2xl font-bold text-white">
                    ⭐ {storeProfile.rating != null ? storeProfile.rating : "—"}
                  </span>
                  <span className="text-xs text-slate-400">/ 5.0</span>
                  <span className="text-xs text-slate-400">
                    · {storeProfile.reviewCount != null ? storeProfile.reviewCount : 0} reviews
                  </span>
                  {storeProfile.googleMapsUrl && (
                    <a href={storeProfile.googleMapsUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-400 underline ml-auto">
                      View on Google
                    </a>
                  )}
                </div>

                {/* Market Position */}
                {liveCompetitors.length > 0 && storeProfile.rating != null && (
                  <div className="mt-3 pt-3 border-t border-[#E65100]/20">
                    {(() => {
                      const allRatings = [
                        { name: "You", rating: storeProfile.rating ?? 0, reviews: storeProfile.reviewCount ?? 0 },
                        ...liveCompetitors.filter(c => c.rating !== null).map(c => ({ name: c.name, rating: c.rating!, reviews: c.reviewCount }))
                      ].sort((a, b) => b.rating - a.rating || b.reviews - a.reviews);
                      const yourPosition = allRatings.findIndex(r => r.name === "You") + 1;
                      return (
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-slate-400">
                            Market Position: <span className="text-white font-semibold">#{yourPosition}</span> of {allRatings.length} nearby
                          </p>
                          {yourPosition === 1 && <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-600/20 text-emerald-400">Top Rated</span>}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            );
          })()}

          {competitorInsights.themes.length > 0 && (
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 mb-4">
              <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-2">
                What Higher-Rated Competitors Are Known For
              </p>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {competitorInsights.themes.map((theme) => (
                  <span
                    key={theme}
                    className="px-2 py-1 rounded-lg bg-slate-700/50 text-[11px] text-slate-300 capitalize"
                  >
                    {theme}
                  </span>
                ))}
              </div>
              <p className="text-[10px] text-slate-500 leading-relaxed">
                Based on positive Google reviews from higher-rated pizza restaurants within 5 miles. These are themes
                customers frequently mention — consider whether your operation reflects similar strengths.
              </p>
            </div>
          )}

          {competitorInsights.themes.length === 0 &&
            !competitorInsights.loading &&
            storeProfile?.rating &&
            liveCompetitors.length > 0 && (
              <div className="bg-emerald-600/10 border border-emerald-700/20 rounded-xl p-4 mb-4">
                <p className="text-xs text-emerald-400 font-medium">You're the top-rated pizza restaurant in your area.</p>
                <p className="text-[10px] text-slate-500 mt-1">
                  No nearby competitors have a higher Google rating than you right now.
                </p>
              </div>
            )}

          <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 mb-4">
            <h3 className="text-sm font-semibold text-white mb-3">Your Market Position</h3>
            {selectedStore === "all" ? (
              <p className="text-xs text-slate-400">Select a store to see your market position vs local competitors.</p>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs text-slate-500">Your Large Cheese</div>
                    <div className="text-lg text-emerald-400 font-bold">${yourPrice.toFixed(2)}</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <div>
                      <div className="text-xs text-slate-500">Market Average</div>
                      <div className="text-lg text-white font-bold">${marketAvg.avgCheese.toFixed(2)}</div>
                    </div>
                    <EducationInfoIcon metricKey="market_position" size="sm" />
                  </div>
                </div>
                <div className="mt-2 px-3 py-2 rounded-lg bg-slate-700/50">
                  <p className="text-xs text-slate-300">
                    Your price is{" "}
                    <span className={priceDiffPct > 0 ? "text-emerald-400" : "text-amber-400"}>
                      {Math.abs(priceDiffPct).toFixed(1)}% {priceDiffPct > 0 ? "above" : "below"}
                    </span>{" "}
                    the local market average of {marketAvg.competitorCount} competitors.
                  </p>
                </div>
              </>
            )}
          </div>

          {isLiveData
            ? rankedLiveCompetitors.map((comp) => (
                <div
                  key={comp.placeId}
                  className="bg-slate-800 rounded-xl border border-slate-700 p-3 mb-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-slate-700/50 border border-slate-700 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-slate-300">{comp.rank}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-white truncate">{comp.name}</div>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="text-xs text-slate-500">{comp.distance.toFixed(1)} mi</span>
                          {comp.isOpen !== null && (
                            <span
                              className={`text-[10px] ${
                                comp.isOpen ? "text-emerald-500" : "text-slate-500"
                              }`}
                            >
                              {comp.isOpen ? "Open" : "Closed"}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      <span className="text-sm text-white font-medium">{comp.rating ?? "—"}</span>
                      <span className="text-xs text-slate-500">({comp.reviewCount})</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-2">
                    <MapPin className="w-3 h-3 shrink-0" />
                    <span>{comp.address}</span>
                  </div>
                </div>
              ))
            : existingSeedCompetitors.map((comp) => (
            <div key={comp.id} className="bg-slate-800 rounded-xl border border-slate-700 p-3 mb-2">
              <button type="button" onClick={() => toggleExpand(comp.id)} className="w-full text-left">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white">{comp.name}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-slate-500">{comp.category}</span>
                      <span className="text-xs text-slate-600">·</span>
                      <span className="text-xs text-slate-500">{comp.distance_miles} mi</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      <span className="text-sm text-white font-medium">{comp.google_rating}</span>
                      <span className="text-xs text-slate-500">({comp.google_review_count})</span>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-500 transition-transform ${expandedCompetitor === comp.id ? "rotate-180" : ""}`}
                    />
                  </div>
                </div>
              </button>

              {expandedCompetitor === comp.id && (
                <div className="mt-3 pt-3 border-t border-slate-700 space-y-2">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <MapPin className="w-3 h-3 shrink-0" />
                    <span>{comp.address}</span>
                  </div>
                  {comp.website && (
                    <div className="flex items-center gap-2 text-xs">
                      <ExternalLink className="w-3 h-3 text-slate-400 shrink-0" />
                      <a href={`https://${comp.website}`} target="_blank" rel="noopener noreferrer" className="text-blue-400">
                        {comp.website}
                      </a>
                    </div>
                  )}
                  {(comp.price_large_cheese != null && comp.price_large_cheese > 0) && (
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div className="bg-slate-700/50 rounded-lg p-2">
                        <div className="text-[10px] text-slate-500">Large Cheese</div>
                        <div className="text-sm text-white">${comp.price_large_cheese.toFixed(2)}</div>
                      </div>
                      <div className="bg-slate-700/50 rounded-lg p-2">
                        <div className="text-[10px] text-slate-500">Large Pepperoni</div>
                        <div className="text-sm text-white">${(comp.price_large_pepperoni ?? 0).toFixed(2)}</div>
                      </div>
                    </div>
                  )}
                  {comp.notes && <p className="text-xs text-slate-500 mt-1">{comp.notes}</p>}
                </div>
              )}
            </div>
          ))}
        </>
      )}

      {view === "alerts" && (
        <div className="space-y-2">
          {alerts.length === 0 ? (
            <p className="text-xs text-slate-500">No alerts for this store.</p>
          ) : (
            alerts.map((alert) => (
              <div key={alert.id} className="bg-slate-800 rounded-xl border border-slate-700 p-3 mb-2">
                <div className="flex items-start gap-2">
                  <div
                    className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${alert.icon_color.replace(/^text-/, "bg-")}`}
                  />
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-white">{alert.title}</div>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">{alert.message}</p>
                    <span className="text-[10px] text-slate-600 mt-1 block">{formatTime(alert.created_at)}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {view === "pricing" && (
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white">Large Cheese Pizza — Price Map</h3>
            <EducationInfoIcon metricKey="market_position" />
          </div>

          {selectedStore === "all" ? (
            <p className="text-xs text-slate-400">Select a store to see your price vs competitor prices.</p>
          ) : (
            <>
              <div className="flex items-center justify-between p-2 rounded-lg bg-[#E65100]/10 border border-[#E65100]/30 mb-2">
                <span className="text-sm text-white font-medium">{yourStoreName}</span>
                <span className="text-sm text-[#E65100] font-bold">${yourPrice.toFixed(2)}</span>
              </div>

              {competitorsSortedByPrice.map((comp) => (
            <div
              key={comp.id}
              className="flex items-center justify-between p-2 border-b border-slate-700/50 last:border-0"
            >
              <div className="min-w-0">
                <span className="text-sm text-slate-300">{comp.name}</span>
                <span className="text-xs text-slate-600 ml-2">{comp.distance_miles}mi</span>
              </div>
              <span
                className={`text-sm font-medium shrink-0 ${(comp.price_large_cheese ?? 0) > yourPrice ? "text-slate-400" : "text-amber-400"}`}
              >
                ${(comp.price_large_cheese ?? 0).toFixed(2)}
              </span>
            </div>
          ))}

              <div className="flex items-center justify-between p-2 mt-2 rounded-lg bg-slate-700/50">
                <span className="text-xs text-slate-500 font-medium">
                  Market Average ({marketAvg.competitorCount} shops)
                </span>
                <span className="text-sm text-white font-medium">${marketAvg.avgCheese.toFixed(2)}</span>
              </div>
            </>
          )}
        </div>
      )}

      <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-3 mt-4">
        <p className="text-xs text-slate-500">
          Planned: automated competitor monitoring. PrimeOS will scan competitor websites, Google reviews, and
          social media for changes in pricing, menu items, promotions, and customer sentiment — and alert you
          automatically.
        </p>
      </div>

      <DataDisclaimer confidence="medium" details="Competitor prices and ratings from public data. May not reflect current pricing." />
    </div>
  );
}
