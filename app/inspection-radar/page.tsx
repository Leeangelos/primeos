"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback } from "react";
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

  if (loading) return <div className="min-h-screen bg-zinc-950" />;
  if (newUser) {
    return (
      <div className="space-y-4 pb-28">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-orange-400">Inspection Radar</span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">{newUserStoreName}</p>
          </div>
          <EducationInfoIcon metricKey="inspection_radar" size="lg" />
        </div>
        <div className="bg-zinc-900/50 rounded-xl border border-zinc-800/50 shadow-sm p-6 text-center">
          <p className="text-sm text-zinc-300">Inspection Radar will be available here soon.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-28">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-white">Inspection Radar</h1>
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
        <div className="text-center py-8 text-slate-500 text-sm">Loading…</div>
      ) : (
        <>
          {/* Card 1 — Your Google Profile */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
            <div className="p-4 border-b border-slate-700">
              <h2 className="text-sm font-semibold text-white">Your Google Profile</h2>
            </div>
            <div className="p-4">
              {profile ? (
                <>
                  <p className="text-lg font-semibold text-white">{profile.name}</p>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-3xl font-bold text-white">
                      {profile.google_rating != null ? profile.google_rating.toFixed(1) : "—"}
                    </span>
                    <span className="text-slate-400 flex items-center gap-1">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      {profile.google_review_count != null
                        ? `based on ${profile.google_review_count} reviews`
                        : ""}
                    </span>
                  </div>
                  {profile.price_level && (
                    <p className="text-sm text-slate-400 mt-1">
                      Price: {priceLevelDollars(profile.price_level)}
                    </p>
                  )}
                  {profile.google_maps_url && (
                    <a
                      href={profile.google_maps_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-lg bg-slate-700 text-slate-200 text-sm hover:bg-slate-600"
                    >
                      <MapPin className="w-4 h-4" />
                      Google Maps
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                  {profile.last_synced_at && (
                    <p className="text-xs text-slate-500 mt-3 text-right">
                      Last synced: {new Date(profile.last_synced_at).toLocaleString()}
                    </p>
                  )}
                </>
              ) : (
                <div className="text-center py-6 rounded-lg bg-slate-800/50 border border-slate-700/50">
                  <p className="text-slate-500 text-sm mb-3">Sync to load your Google profile</p>
                  <button
                    type="button"
                    onClick={handleSync}
                    disabled={syncLoading}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#E65100] text-white text-sm font-medium disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${syncLoading ? "animate-spin" : ""}`} />
                    Sync
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Card 2 — Inspection History */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
            <div className="p-4 border-b border-slate-700">
              <h2 className="text-sm font-semibold text-white">Inspection History</h2>
            </div>
            <div className="p-4">
              {inspections.length === 0 ? (
                <p className="text-slate-500 text-sm py-4 text-center">
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

          {/* Card 3 — Nearby Competitors */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
            <div className="p-4 border-b border-slate-700 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">Nearby Competitors</h2>
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
            <div className="p-4">
              {competitors.length === 0 ? (
                <p className="text-slate-500 text-sm py-4 text-center">
                  Tap Sync to load nearby competitors.
                </p>
              ) : (
                <>
                  <div className="overflow-x-auto -mx-4 px-4">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-slate-500 border-b border-slate-700">
                          <th className="pb-2 pr-2 font-medium">Name</th>
                          <th className="pb-2 pr-2 font-medium">Miles Away</th>
                          <th className="pb-2 pr-2 font-medium">Rating</th>
                          <th className="pb-2 pr-2 font-medium">Reviews</th>
                          <th className="pb-2 pr-2 font-medium">Price</th>
                          <th className="pb-2 font-medium">Maps</th>
                        </tr>
                      </thead>
                      <tbody>
                        {competitors.map((c) => (
                          <tr key={c.id} className="border-b border-slate-700/50">
                            <td className="py-2 pr-2 text-white font-medium">{c.name}</td>
                            <td className="py-2 pr-2 text-slate-400">
                              {c.distance_miles != null ? `${c.distance_miles.toFixed(1)} mi` : "—"}
                            </td>
                            <td className="py-2 pr-2 text-slate-300">
                              {c.google_rating != null ? (
                                <span className="inline-flex items-center gap-0.5">
                                  {c.google_rating.toFixed(1)} <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                </span>
                              ) : (
                                "—"
                              )}
                            </td>
                            <td className="py-2 pr-2 text-slate-400">{c.google_review_count ?? "—"}</td>
                            <td className="py-2 pr-2 text-slate-400">
                              {priceLevelDollars(c.price_level)}
                            </td>
                            <td className="py-2">
                              {c.google_maps_url ? (
                                <a
                                  href={c.google_maps_url}
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
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-xs text-slate-500 mt-3">
                    Google ratings within 5 miles — synced weekly
                  </p>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
