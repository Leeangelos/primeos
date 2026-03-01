"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Sparkles, ClipboardList, ChevronRight, Volume2, VolumeX } from "lucide-react";
import { COCKPIT_STORE_SLUGS, COCKPIT_TARGETS, type CockpitStoreSlug } from "@/lib/cockpit-config";
import { getStoreColor } from "@/lib/store-colors";
import { cn } from "@/lib/utils";
import { formatPct } from "@/src/lib/formatters";
import { useAuth } from "@/src/lib/auth-context";
import { isNewUser, getNewUserStoreName } from "@/src/lib/user-scope";
import { useRedAlert } from "@/src/lib/useRedAlert";
import { SEED_MORNING_BRIEF_BY_STORE } from "@/src/lib/seed-data";
import { EducationInfoIcon } from "@/src/components/education/InfoIcon";

type BriefStore = "all" | CockpitStoreSlug;

const BRIEF_STORE_OPTIONS: { value: BriefStore; label: string }[] = [
  { value: "all", label: "All Locations" },
  ...COCKPIT_STORE_SLUGS.map((s) => ({ value: s as BriefStore, label: COCKPIT_TARGETS[s].name })),
];

function todayYYYYMMDD(): string {
  const t = new Date();
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
}

function prevDay(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

function nextDay(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00Z");
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function formatDateLong(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00Z");
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

/** Split brief into paragraphs (by sentence groups). */
function briefToParagraphs(text: string): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [];
  const sentences = trimmed.split(/(?<=[.!])\s+/).filter(Boolean);
  if (sentences.length <= 2) return [trimmed];
  const p1 = sentences.slice(0, 5).join(" ");
  const p2 = sentences.slice(5, 6).join(" ");
  const p3 = sentences.slice(6, 9).join(" ");
  const p4 = sentences.slice(9).join(" ");
  return [p1, p2, p3, p4].filter(Boolean);
}

/** Highlight $ amounts, X.X%, and words green/red/yellow in brief text. Returns React nodes. */
function highlightBriefContent(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const regex = /(\$[\d,]+(?:\.[\d]+)?|[\d.]+%|\bgreen\b|\bred\b|\byellow\b)/gi;
  let lastIndex = 0;
  let match;
  let key = 0;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    const value = match[1];
    const lower = value.toLowerCase();
    if (lower === "green") {
      parts.push(<span key={`b-${key++}`} className="text-emerald-400">{value}</span>);
    } else if (lower === "red") {
      parts.push(<span key={`b-${key++}`} className="text-red-400">{value}</span>);
    } else if (lower === "yellow") {
      parts.push(<span key={`b-${key++}`} className="text-amber-400">{value}</span>);
    } else {
      parts.push(<span key={`b-${key++}`} className="text-white font-semibold">{value}</span>);
    }
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  return parts.length > 0 ? <>{parts}</> : text;
}

type StoreMetrics = {
  sales: number;
  primePct: number | null;
  laborPct: number | null;
  foodPct: number | null;
  slph: number | null;
};

function getSeedBriefForStore(store: BriefStore): string | null {
  const key = store === "all" ? "kent" : store;
  return SEED_MORNING_BRIEF_BY_STORE[key] ?? null;
}

export default function BriefPage() {
  const { session } = useAuth();
  const newUser = isNewUser(session);
  const newUserStoreName = getNewUserStoreName(session);
  const today = todayYYYYMMDD();
  const yesterday = prevDay(today);
  const [date, setDate] = useState(yesterday);
  const [store, setStore] = useState<BriefStore>("kent");
  const [brief, setBrief] = useState<string | null>(null);
  const [storeData, setStoreData] = useState<Record<string, StoreMetrics | null>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showEducation, setShowEducation] = useState(false);
  const [isReading, setIsReading] = useState(false);

  const briefDate = (() => {
    const d = new Date(date + "T12:00:00Z");
    return d.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  })();

  async function loadBrief(d: string) {
    setLoading(true);
    setError(null);
    setBrief(null);
    setStoreData({});

    try {
      const res = await fetch(`/api/morning-brief?date=${d}`);
      const data = await res.json();

      if (data.ok && data.brief) {
        setBrief(data.brief);
        setStoreData(data.storeData || {});
      } else {
        const seed = getSeedBriefForStore(store);
        if (seed) {
          setBrief(seed);
          setStoreData({});
        } else {
          setBrief(null);
        }
      }
    } catch {
      const seed = getSeedBriefForStore(store);
      if (seed) setBrief(seed);
      else setError("Network error — check your connection");
    }

    setLoading(false);
  }

  useEffect(() => {
    loadBrief(date);
  }, [date, store]);

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const briefHasRed =
    (brief?.toLowerCase().includes("— red") ?? false) ||
    (brief?.toLowerCase().includes("yellow for 3 straight") ?? false);
  useRedAlert(briefHasRed ? ["red"] : []);

  function handleReadAloud() {
    if (isReading) {
      window.speechSynthesis.cancel();
      setIsReading(false);
      return;
    }
    const briefText = brief ? briefToParagraphs(brief).join(". ") : "";
    if (!briefText || !window.speechSynthesis) return;

    const utterance = new SpeechSynthesisUtterance(briefText);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.lang = "en-US";

    const voices = window.speechSynthesis.getVoices();
    const preferred =
      voices.find((v) => v.name.includes("Samantha")) ||
      voices.find((v) => v.name.includes("Google US English")) ||
      voices.find((v) => v.lang === "en-US" && v.localService);
    if (preferred) utterance.voice = preferred;

    utterance.onend = () => setIsReading(false);
    utterance.onerror = () => setIsReading(false);

    setIsReading(true);
    window.speechSynthesis.speak(utterance);
  }

  function pctColor(val: number | null, redAbove: number): string {
    if (val == null) return "text-muted";
    return val > redAbove ? "text-red-400" : "text-emerald-400";
  }

  if (newUser) {
    return (
      <div className="space-y-5 min-w-0 overflow-x-hidden pb-28">
        <div className="dashboard-toolbar p-3 sm:p-5 space-y-3">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold sm:text-2xl flex items-center gap-2">
              Morning Brief
              <EducationInfoIcon metricKey="morning_brief" />
            </h1>
            <button type="button" onClick={() => setShowEducation(true)} className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-full bg-muted/20 text-muted hover:bg-brand/20 hover:text-brand transition-colors text-xs font-bold" aria-label="Learn more">i</button>
          </div>
          <p className="text-xs text-muted">{newUserStoreName}</p>
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 text-center">
          <p className="text-sm text-zinc-300">Your Morning Brief builds automatically from your daily data. Connect your POS to start receiving daily insights.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 min-w-0 overflow-x-hidden pb-28">
      <div className="dashboard-toolbar p-3 sm:p-5 space-y-3">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold sm:text-2xl flex items-center gap-2">
            Morning Brief
            <EducationInfoIcon metricKey="morning_brief" />
          </h1>
          <button type="button" onClick={() => setShowEducation(true)} className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-full bg-muted/20 text-muted hover:bg-brand/20 hover:text-brand transition-colors text-xs font-bold" aria-label="Learn more">i</button>
        </div>
        <p className="text-xs text-muted">AI-generated summary of yesterday&apos;s operations.</p>

        {/* Store selector */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-500 uppercase tracking-wide shrink-0">Store</span>
          <select
            value={store}
            onChange={(e) => setStore(e.target.value as BriefStore)}
            className={cn(
              "flex-1 min-w-0 max-w-[240px] flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium bg-black/30 border-slate-600 text-white focus:outline-none focus:ring-2 focus:ring-brand/50",
              store !== "all" && getStoreColor(store).borderActive,
              store !== "all" && getStoreColor(store).bgActive,
              store !== "all" && getStoreColor(store).text
            )}
          >
            {BRIEF_STORE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <div className="hidden sm:flex items-center gap-1.5 flex-wrap">
            {BRIEF_STORE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setStore(opt.value)}
                className={cn(
                  "rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                  store === opt.value
                    ? opt.value === "all"
                      ? "border-brand/50 bg-brand/15 text-brand"
                      : cn(getStoreColor(opt.value as CockpitStoreSlug).borderActive, getStoreColor(opt.value as CockpitStoreSlug).bgActive, getStoreColor(opt.value as CockpitStoreSlug).text)
                    : "border-border/50 bg-black/20 text-muted hover:text-white"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={() => setDate(prevDay(date))}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg border border-border/50 bg-black/30 text-muted hover:text-white hover:border-border transition-colors shrink-0"
            aria-label="Previous day"
          >
            ←
          </button>
          <div className="flex-1 text-center min-h-[44px] flex flex-col items-center justify-center min-w-0 gap-1">
            <div className="text-sm font-medium text-white whitespace-nowrap">{formatDateLong(date)}</div>
            {date === yesterday && (
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Showing your most recent complete business day</p>
            )}
          </div>
          {date !== today && (
            <button
              type="button"
              onClick={() => setDate(today)}
              className="min-h-[44px] px-3 py-2 rounded-lg border border-[#E65100]/50 bg-[#E65100]/10 text-[#E65100] text-sm font-medium hover:bg-[#E65100]/20 transition-colors shrink-0"
              aria-label="Jump to today"
            >
              Today
            </button>
          )}
          <button
            type="button"
            onClick={() => setDate(nextDay(date))}
            disabled={date >= today}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg border border-border/50 bg-black/30 text-muted hover:text-white hover:border-border transition-colors disabled:opacity-30 shrink-0"
            aria-label="Next day"
          >
            →
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className="dashboard-surface rounded-lg border border-border p-4 sm:p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-8 w-8 rounded-full bg-brand/20 animate-pulse" />
              <div className="h-4 w-48 bg-muted/20 rounded animate-pulse" />
            </div>
            <div className="space-y-2 animate-pulse">
              <div className="h-3 w-full bg-muted/20 rounded" />
              <div className="h-3 w-11/12 bg-muted/20 rounded" />
              <div className="h-3 w-10/12 bg-muted/20 rounded" />
              <div className="h-3 w-9/12 bg-muted/20 rounded" />
              <div className="h-3 w-full bg-muted/20 rounded" />
              <div className="h-3 w-8/12 bg-muted/20 rounded" />
            </div>
          </div>
          <div className="text-center text-xs text-muted">Generating brief…</div>
        </div>
      ) : error ? (
        <div className="dashboard-surface rounded-lg border border-red-500/30 bg-red-500/5 p-5">
          <p className="text-sm text-red-400 mb-3">{error}</p>
          <button
            type="button"
            onClick={() => loadBrief(date)}
            className="rounded-lg border border-brand/50 bg-brand/15 px-4 py-2 text-sm font-semibold text-brand hover:bg-brand/25 min-h-[44px]"
          >
            Retry
          </button>
        </div>
      ) : brief ? (
        <>
          <div className="dashboard-surface rounded-xl border border-slate-700 bg-slate-800/50 p-4 sm:p-5 min-w-0">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xs text-slate-500 uppercase tracking-wide">Morning Brief</h2>
                <p className="text-sm text-slate-400 whitespace-nowrap">{briefDate}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleReadAloud}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                    isReading
                      ? "bg-red-600/20 border-red-700/50 text-red-400 hover:bg-red-600/30"
                      : "bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-300"
                  }`}
                >
                  {isReading ? (
                    <>
                      <VolumeX className="w-3.5 h-3.5" />
                      <span>Stop</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>Read Aloud</span>
                    </>
                  )}
                </button>
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <Sparkles className="w-3.5 h-3.5" aria-hidden />
                  <span>AI Generated</span>
                </div>
              </div>
            </div>
            {isReading && (
              <div className="flex items-center gap-2 mt-3 mb-1">
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" style={{ animationDelay: "0.2s" }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" style={{ animationDelay: "0.4s" }} />
                </div>
                <span className="text-xs text-blue-400">Reading aloud...</span>
              </div>
            )}
            <div className="text-sm leading-relaxed text-slate-200 break-words">
              {briefToParagraphs(brief).map((para, i) => (
                <p key={i} className="mb-4 last:mb-0">
                  {highlightBriefContent(para)}
                </p>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-4">Brief generated at 6:00 AM from yesterday&apos;s data.</p>
          </div>

          {Object.keys(storeData).length > 0 && (
            <div className="space-y-2">
              <h2 className="text-[10px] font-semibold uppercase tracking-wider text-muted px-1">Store Snapshot</h2>
              {Object.entries(storeData).map(([name, metrics]) => {
                const slug = COCKPIT_STORE_SLUGS.find((s) => COCKPIT_TARGETS[s].name === name) ?? "";
                const colors = getStoreColor(slug);
                if (!metrics) return (
                  <div key={name} className={`rounded-lg border p-4 ${colors.border} ${colors.bg}`}>
                    <div className="flex items-center gap-2">
                      <div className={`h-2.5 w-2.5 rounded-full ${colors.dot}`} />
                      <span className="font-medium text-white">{name}</span>
                    </div>
                    <span className="text-xs text-muted ml-2">No data</span>
                  </div>
                );
                return (
                  <div key={name} className={`rounded-lg border p-4 ${colors.border} ${colors.bg}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className={`h-2.5 w-2.5 rounded-full ${colors.dot}`} />
                        <span className="font-medium text-white">{name}</span>
                      </div>
                      <span className="text-sm font-medium tabular-nums text-muted">
                        ${metrics.sales.toLocaleString()}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                      <div>
                        <div className="text-[9px] uppercase text-muted">PRIME</div>
                        <div className={`text-sm font-bold tabular-nums ${pctColor(metrics.primePct, 55)}`}>
                          {metrics.primePct != null ? formatPct(metrics.primePct) : "—"}
                        </div>
                      </div>
                      <div>
                        <div className="text-[9px] uppercase text-muted">Labor</div>
                        <div className={`text-sm font-bold tabular-nums ${pctColor(metrics.laborPct, 24)}`}>
                          {metrics.laborPct != null ? formatPct(metrics.laborPct) : "—"}
                        </div>
                      </div>
                      <div>
                        <div className="text-[9px] uppercase text-muted">Food</div>
                        <div className={`text-sm font-bold tabular-nums ${pctColor(metrics.foodPct, 33)}`}>
                          {metrics.foodPct != null ? formatPct(metrics.foodPct) : "—"}
                        </div>
                      </div>
                      <div>
                        <div className="text-[9px] uppercase text-muted">SLPH</div>
                        <div className={`text-sm font-bold tabular-nums ${metrics.slph != null && metrics.slph < 65 ? "text-red-400" : "text-emerald-400"}`}>
                          {metrics.slph != null ? metrics.slph : "—"}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 text-center">
          <ClipboardList className="w-10 h-10 text-slate-600 mx-auto mb-3" aria-hidden />
          <p className="text-sm text-slate-400 mb-1">No data yet for this date.</p>
          <p className="text-sm text-slate-500 mb-4">Enter yesterday&apos;s numbers on the Daily page first.</p>
          <Link
            href="/daily"
            className="inline-flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300"
          >
            Go to Daily KPIs <ChevronRight className="w-4 h-4" aria-hidden />
          </Link>
        </div>
      )}

      {showEducation && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0 }} onClick={() => setShowEducation(false)}>
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          <div className="relative w-full max-w-md mx-auto rounded-2xl border border-border bg-[#0d0f13] p-4 sm:p-5 shadow-2xl overflow-y-auto max-h-[85vh] min-w-0" onClick={(e) => e.stopPropagation()}>
            <button type="button" onClick={() => setShowEducation(false)} className="absolute top-3 right-3 min-h-[44px] min-w-[44px] flex items-center justify-center text-muted hover:text-white text-lg -mr-2" aria-label="Close">✕</button>
            <h3 className="text-base font-semibold text-brand mb-1">🎓 Why Morning Briefs Change Behavior</h3>
            <p className="text-xs text-muted mb-4">AI analyzes your numbers overnight. You act before lunch.</p>
            <div className="space-y-3 text-sm">
              <div>
                <h4 className="font-medium text-white mb-1">Why a Brief Beats Raw Numbers</h4>
                <p className="text-muted text-xs leading-relaxed">Most owners see sales and labor on a spreadsheet and don't know what to do. The brief turns yesterday's data into plain English: "Kent was over on labor; Aurora's food cost spiked." One read and you know where to look. Operators who read the brief every morning address problems in days, not months. That's $500–$2K back in your pocket per month when you act fast.</p>
              </div>
              <div>
                <h4 className="font-medium text-white mb-1">How AI Analyzes Your Numbers Overnight</h4>
                <p className="text-muted text-xs leading-relaxed">Claude reads your daily KPIs — sales, labor, food, disposables, voids, waste — and compares them to benchmarks and to prior periods. It flags what's off and why it might be. No more digging through rows. The brief is your 60-second debrief so you can walk in and say "check the walk-in" or "who was on the make line Tuesday?" instead of guessing.</p>
              </div>
              <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-3">
                <h4 className="font-medium text-red-400 text-xs mb-2">📕 When the Brief Says You're Over</h4>
                <p className="text-muted text-xs leading-relaxed">If the brief calls out labor or food, it may help to avoid ignoring it. Same-day options often include trimming a shift, checking portioning, and looking at the last invoice. One red day is a signal. A week of red in the brief means you're leaving real money on the table. Use the brief to decide what to address first — then follow through.</p>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
