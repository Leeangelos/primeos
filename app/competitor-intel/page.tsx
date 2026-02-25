"use client";

import { useState, useMemo } from "react";
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
import { EducationInfoIcon } from "@/src/components/education/InfoIcon";
import { DataDisclaimer } from "@/src/components/ui/DataDisclaimer";

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

  const competitors = useMemo(() => getCompetitorsByStore(selectedStore), [selectedStore]);
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

  const competitorsSortedByPrice = useMemo(
    () =>
      [...competitors].filter((c) => c.price_large_cheese != null && c.price_large_cheese > 0).sort((a, b) => (a.price_large_cheese ?? 0) - (b.price_large_cheese ?? 0)),
    [competitors]
  );

  const yourStoreName = getStoreName(selectedStore);

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

          {competitors.map((comp) => (
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
