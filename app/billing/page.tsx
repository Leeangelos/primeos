"use client";

import { useState, useEffect } from "react";
import { TrendingUp, BookOpen, Trophy, ChevronDown, Flame, Target, DollarSign } from "lucide-react";
import { useTier } from "@/src/lib/tier-context";
import { createClient } from "@/lib/supabase";
import { calculateOperatorScore } from "@/src/lib/score-engine";

const DEMO_TIERS = [
  { id: "free", label: "Free", color: "text-slate-400" },
  { id: "starter", label: "Starter", color: "text-blue-400" },
  { id: "operator", label: "Operator", color: "text-amber-400" },
  { id: "owner", label: "Owner", color: "text-emerald-400" },
  { id: "enterprise", label: "Enterprise", color: "text-purple-400" },
] as const;

const MISTAKES = [
  {
    icon: DollarSign,
    bgColor: "bg-red-600/20",
    iconColor: "text-red-400",
    title: "We were bleeding $5,100/month on food cost",
    story:
      "Our food cost was 34% — we thought it was 30%. Cheese overportioning on every pizza (14oz instead of 12oz target), unrecorded employee meals, and a Hillcrest price increase on mozzarella that went unnoticed for 4 months. On 300+ pizzas a day, those 2 extra ounces added up to $1,200/month just on cheese.",
    feature: "Food Cost Analysis",
  },
  {
    icon: Flame,
    bgColor: "bg-amber-600/20",
    iconColor: "text-amber-400",
    title: "Overtime was eating our labor budget alive",
    story:
      "One location was at 28% labor while the others were at 22%. The difference? Two employees were consistently hitting 48+ hours because the schedule wasn't being watched. Nobody noticed because 'they always work hard.' Hard work shouldn't cost you $2,800/month in unnecessary overtime.",
    feature: "Schedule",
  },
  {
    icon: Target,
    bgColor: "bg-blue-600/20",
    iconColor: "text-blue-400",
    title: "Our CC processor was overcharging us",
    story:
      "We were quoted 2.6% processing. Actual effective rate? 3.8%. On $45,000/month in card transactions, that's $540/month — $6,480/year — just gone. We only caught it because PrimeOS calculated the effective rate from our actual settlement data.",
    feature: "Vendor Tracker",
  },
  {
    icon: TrendingUp,
    bgColor: "bg-emerald-600/20",
    iconColor: "text-emerald-400",
    title: "We had no idea what 'good' looked like",
    story:
      "Is 31% food cost good? Is 23% labor okay? We had no benchmarks, no targets, no grades. We were guessing every single day. The day we set targets and graded ourselves honestly was the day everything changed. Green means breathe. Red means dig in. That simple.",
    feature: "Daily KPIs",
  },
  {
    icon: BookOpen,
    bgColor: "bg-purple-600/20",
    iconColor: "text-purple-400",
    title: "Nobody taught us how to read our own numbers",
    story:
      "Our accountant sent P&Ls that looked like a foreign language. We'd nod and say 'looks good' when we had no idea what Gross Profit margin meant or why it mattered. PrimeOS explains every number in plain English because if you don't understand it, you can't fix it.",
    feature: "Training Guide",
  },
];

const currentStreak = 5;
const playbooksRead = 8;

const VALUE_OPTIONS = [
  "Consistency",
  "Community",
  "Quality",
  "Family",
  "Speed",
  "Hospitality",
  "Integrity",
  "Pride",
  "Generosity",
  "Transparency",
];

export default function BillingPage() {
  const { currentTier, setCurrentTier } = useTier();
  const [expandedMistake, setExpandedMistake] = useState<number | null>(null);
  const [resetToast, setResetToast] = useState<string | null>(null);
  const [daysTracked, setDaysTracked] = useState<number>(0);
  const [showScoreBreakdown, setShowScoreBreakdown] = useState<boolean>(false);
  const [selectedValues, setSelectedValues] = useState<string[]>([]);
  const [customValue, setCustomValue] = useState<string>("");
  const [showValues, setShowValues] = useState<boolean>(true);
  const score = calculateOperatorScore();

  useEffect(() => {
    const saved = localStorage.getItem("primeos_core_values");
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as string[];
        if (Array.isArray(parsed)) setSelectedValues(parsed);
      } catch {
        // ignore
      }
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadDaysTracked() {
      try {
        const supabase = createClient();
        const { data: storeRow } = await supabase.from("stores").select("id").limit(1).maybeSingle();
        if (cancelled || !storeRow?.id) {
          if (!cancelled) setDaysTracked(0);
          return;
        }
        const { data: rows, error } = await supabase
          .from("daily_kpis")
          .select("business_date")
          .eq("store_id", storeRow.id);
        if (cancelled) return;
        if (error || !rows) {
          setDaysTracked(0);
          return;
        }
        const distinctDates = new Set(rows.map((r) => r.business_date));
        setDaysTracked(distinctDates.size);
      } catch {
        if (!cancelled) setDaysTracked(0);
      }
    }
    loadDaysTracked();
    return () => { cancelled = true; };
  }, []);

  const toggleMistake = (i: number) => {
    setExpandedMistake((prev) => (prev === i ? null : i));
  };

  const handleReset = (keys: string[], label: string) => {
    keys.forEach((key) => {
      try {
        localStorage.removeItem(key);
      } catch {
        // ignore
      }
    });
    setResetToast(label);
    setTimeout(() => {
      window.location.reload();
    }, 300);
  };

  return (
    <div className="space-y-6 pb-28">
      {resetToast && (
        <div
          className="fixed z-50 bg-slate-700/90 border border-slate-600 rounded-xl px-4 py-2.5 shadow-lg left-1/2 -translate-x-1/2"
          style={{ top: "calc(4rem + env(safe-area-inset-top, 0px))" }}
        >
          <p className="text-xs text-slate-200 font-medium">{resetToast} reset — reloading...</p>
        </div>
      )}

      {/* 1. HERO MESSAGE */}
      <div className="mb-8 pt-4">
        <h1 className="font-serif text-3xl font-bold text-white">
          We Built This Because We Needed It.
        </h1>
        <p className="text-slate-400 text-base mt-3 max-w-prose leading-relaxed">
          Not because we saw a market opportunity. Because we were bleeding money we couldn&apos;t see, and nobody had built the thing that showed us where it was going.
        </p>
      </div>

      {/* 2. THE TRUTH CARD */}
      <div className="bg-slate-800 rounded-2xl border border-slate-700 p-5 mb-4">
        <h2 className="text-sm font-semibold text-white mb-3">Here&apos;s the truth</h2>
        <p className="text-sm text-slate-300 leading-relaxed mb-3">
          PrimeOS holds up the mirror — we don&apos;t tell you what to see. Many operators make decisions based on gut when the numbers are right there; now you can see them.
        </p>
        <p className="text-sm text-slate-300 leading-relaxed">
          PrimeOS puts every number in front of you, in plain English, in 90 seconds a day. No accounting degree needed. No consultants. Just your data, explained like a friend who happens to know the math.
        </p>
      </div>

      {/* 3. CASE STUDY */}
      <div className="bg-slate-800 rounded-2xl border border-slate-700 p-5 mb-4">
        <h2 className="font-serif text-sm font-semibold text-white mb-3">A story that might sound familiar</h2>
        <p className="text-sm text-slate-300 leading-relaxed mb-3">
          A 3-location pizza operator in Northeast Ohio was doing $1.5 million a year. Busy every night. Staff worked hard. By all appearances, things were fine.
        </p>
        <p className="text-sm text-slate-300 leading-relaxed mb-3">
          But the books told a different story. Food cost was running 34% — they thought it was 30%. That gap? $5,100 a month walking out the back door. Cheese overportioning. Unrecorded comps. A vendor price increase nobody caught for 4 months.
        </p>
        <p className="text-sm text-slate-300 leading-relaxed mb-3">
          Labor looked &quot;fine&quot; at 24% until they realized one location was at 28% because of unchecked overtime. That&apos;s $2,800 a month in overtime they didn&apos;t know existed.
        </p>
        <p className="text-sm text-slate-300 leading-relaxed mb-3">
          In 60 days of tracking with PrimeOS, they found $7,900 a month in leaks. Same staff. Same menu. Same customers. Just visibility.
        </p>
        <p className="text-sm text-[#E65100] font-medium">
          That operator is the person who built this app. These were our mistakes. We built PrimeOS so you don&apos;t have to make them.
        </p>
      </div>

      {/* 4. THE MISTAKES WE MADE */}
      <div className="bg-slate-800 rounded-2xl border border-slate-700 p-5 mb-4">
        <h2 className="font-serif text-sm font-semibold text-white mb-4">The Mistakes We Made (So You Don&apos;t Have To)</h2>
        {MISTAKES.map((mistake, i) => {
          const Icon = mistake.icon;
          return (
            <div key={i} className="mb-2">
              <button
                type="button"
                onClick={() => toggleMistake(i)}
                className="w-full text-left"
              >
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-700/30 hover:bg-slate-700/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg ${mistake.bgColor} flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`w-4 h-4 ${mistake.iconColor}`} />
                    </div>
                    <span className="text-sm text-white">{mistake.title}</span>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-500 transition-transform flex-shrink-0 ${expandedMistake === i ? "rotate-180" : ""}`}
                  />
                </div>
              </button>
              {expandedMistake === i && (
                <div className="px-3 pb-3 pt-2">
                  <p className="text-xs text-slate-400 leading-relaxed mb-2">{mistake.story}</p>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#E65100]/10 border border-[#E65100]/20">
                    <span className="text-xs text-[#E65100]">
                      💡 PrimeOS now catches this automatically on the {mistake.feature} page
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 5. YOUR PROGRESS */}
      <div className="bg-slate-800 rounded-2xl border border-slate-700 p-5 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="w-5 h-5 text-amber-400" />
          <h2 className="text-sm font-semibold text-white">Your Progress</h2>
        </div>
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{daysTracked}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Days Tracked</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-[#E65100]">{currentStreak}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Day Streak 🔥</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-amber-400">{playbooksRead}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Playbooks Read</div>
          </div>
        </div>
        <div className="space-y-2">
          <div
            className={`flex items-center gap-3 px-3 py-2 rounded-lg ${daysTracked >= 7 ? "bg-amber-600/10 border border-amber-700/30" : "bg-slate-700/30 border border-slate-700"}`}
          >
            <span className="text-sm">{daysTracked >= 7 ? "✅" : "⬜"}</span>
            <span className={`text-xs ${daysTracked >= 7 ? "text-amber-400" : "text-slate-500"}`}>
              First week — you showed up 7 days straight
            </span>
          </div>
          <div
            className={`flex items-center gap-3 px-3 py-2 rounded-lg ${daysTracked >= 30 ? "bg-amber-600/10 border border-amber-700/30" : "bg-slate-700/30 border border-slate-700"}`}
          >
            <span className="text-sm">{daysTracked >= 30 ? "✅" : "⬜"}</span>
            <span className={`text-xs ${daysTracked >= 30 ? "text-amber-400" : "text-slate-500"}`}>
              30 days — you know more than 90% of operators
            </span>
          </div>
          <div
            className={`flex items-center gap-3 px-3 py-2 rounded-lg ${daysTracked >= 90 ? "bg-amber-600/10 border border-amber-700/30" : "bg-slate-700/30 border border-slate-700"}`}
          >
            <span className="text-sm">{daysTracked >= 90 ? "✅" : "⬜"}</span>
            <span className={`text-xs ${daysTracked >= 90 ? "text-amber-400" : "text-slate-500"}`}>
              90 days — this is a habit now. Your business will never be the same.
            </span>
          </div>
        </div>
      </div>

      <div className="mt-8 mb-8">
        <h2 className="font-serif text-lg text-white mb-1">Your Operator Score</h2>
        <p className="text-xs text-slate-400 mb-4">
          A complete picture of your business health — not just one number, but everything PrimeOS tracks.
        </p>

        {/* Score hero */}
        <div
          className={`rounded-xl border p-5 text-center mb-4 ${
            score.overall >= 80
              ? "bg-emerald-600/10 border-emerald-700/20"
              : score.overall >= 60
                ? "bg-amber-600/10 border-amber-700/20"
                : "bg-red-600/10 border-red-700/20"
          }`}
        >
          <p className={`text-5xl font-bold ${score.color}`}>{score.overall}</p>
          <p className={`text-sm font-medium mt-1 ${score.color}`}>{score.label}</p>
          <p className="text-[10px] text-slate-600 mt-2">Based on 6 weeks of data across 5 dimensions</p>
        </div>

        {/* Category breakdown */}
        <button
          type="button"
          onClick={() => setShowScoreBreakdown(!showScoreBreakdown)}
          className="w-full flex items-center justify-between py-2 mb-2"
        >
          <span className="text-xs text-slate-400">See full breakdown</span>
          <ChevronDown
            className={`w-4 h-4 text-slate-500 transition-transform ${showScoreBreakdown ? "rotate-180" : ""}`}
          />
        </button>

        {showScoreBreakdown && (
          <div className="space-y-3">
            {score.categories.map((cat) => (
              <div key={cat.name} className="bg-slate-800 rounded-xl border border-slate-700 p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-white">{cat.name}</p>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm font-bold ${
                        cat.score >= 80 ? "text-emerald-400" : cat.score >= 60 ? "text-amber-400" : "text-red-400"
                      }`}
                    >
                      {cat.score}
                    </span>
                    <span className="text-[9px] text-slate-600">{Math.round(cat.weight * 100)}% weight</span>
                  </div>
                </div>
                {/* Progress bar */}
                <div className="h-1.5 rounded-full bg-slate-700 mb-3">
                  <div
                    className={`h-1.5 rounded-full transition-all ${
                      cat.score >= 80 ? "bg-emerald-400" : cat.score >= 60 ? "bg-amber-400" : "bg-red-400"
                    }`}
                    style={{ width: `${cat.score}%` }}
                  />
                </div>
                {/* Drivers */}
                {cat.drivers.map((driver, i) => (
                  <div key={i} className="flex items-start gap-2 mb-1.5">
                    <span
                      className={`text-[10px] mt-0.5 ${
                        driver.impact === "up"
                          ? "text-emerald-400"
                          : driver.impact === "down"
                            ? "text-amber-400"
                            : "text-slate-500"
                      }`}
                    >
                      {driver.impact === "up" ? "↑" : driver.impact === "down" ? "↓" : "—"}
                    </span>
                    <p className="text-[11px] text-slate-400 leading-relaxed">{driver.text}</p>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CORE VALUES REFLECTION */}
      <div className="mt-8 mb-8">
        <button
          type="button"
          onClick={() => setShowValues(!showValues)}
          className="w-full text-left"
        >
          <h2 className="font-serif text-lg text-white mb-1">What Do You Stand For?</h2>
          <p className="text-xs text-slate-400">What do people say about your shop when you&apos;re not in the room?</p>
        </button>

        {showValues && (
          <div className="mt-4">
            <p className="text-xs text-slate-500 mb-3">Pick 1 or 2 words that define your business. No wrong answers.</p>

            <div className="flex flex-wrap gap-2 mb-4">
              {VALUE_OPTIONS.map((value) => {
                const isSelected = selectedValues.includes(value);
                const isDisabled = selectedValues.length >= 2 && !isSelected;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        const updated = selectedValues.filter((v) => v !== value);
                        setSelectedValues(updated);
                        try {
                          localStorage.setItem("primeos_core_values", JSON.stringify(updated));
                        } catch {
                          // ignore
                        }
                      } else if (selectedValues.length < 2) {
                        const updated = [...selectedValues, value];
                        setSelectedValues(updated);
                        try {
                          localStorage.setItem("primeos_core_values", JSON.stringify(updated));
                        } catch {
                          // ignore
                        }
                      }
                    }}
                    disabled={isDisabled}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors min-h-[44px] touch-manipulation ${
                      isSelected
                        ? "bg-[#E65100]/20 border border-[#E65100]/40 text-[#E65100]"
                        : isDisabled
                          ? "bg-slate-800/50 border border-slate-700/30 text-slate-600 cursor-not-allowed"
                          : "bg-slate-800 border border-slate-700 text-slate-400 hover:border-slate-600"
                    }`}
                  >
                    {value}
                  </button>
                );
              })}
            </div>

            {selectedValues.length > 0 && (
              <div className="rounded-xl border border-slate-700/50 bg-slate-800/30 p-4 text-center">
                <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-2">Your Business Stands For</p>
                <p className="text-lg font-semibold text-white">{selectedValues.join(" & ")}</p>
                <p className="text-[10px] text-slate-600 mt-2">Does every customer experience feel like this?</p>
              </div>
            )}

            {selectedValues.length === 0 && (
              <div className="rounded-xl border border-dashed border-slate-700/50 p-4 text-center">
                <p className="text-xs text-slate-600">Tap 1 or 2 words above. There&apos;s no wrong answer.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 6. CLOSING MESSAGE */}
      <div className="text-center mb-6 px-4">
        <p className="text-sm text-slate-400 leading-relaxed mb-2">Driven by gratitude. Give without expectation.</p>
        <p className="text-sm text-slate-400 leading-relaxed mb-4">Community above competition.</p>
        <p className="font-serif text-sm text-[#E65100] font-semibold">We want you to win.</p>
      </div>

      {/* 7. PARTNER BADGE */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 mb-6">
        <div className="text-xs text-slate-500 uppercase tracking-widest mb-2">Partner Program</div>
        <h3 className="text-white font-semibold text-base">You May Already Have Access</h3>
        <p className="text-slate-400 text-sm mt-2 leading-relaxed">
          Some operators receive PrimeOS through their existing business relationships. If you think that might be you — it probably is. Ask whoever keeps your walk-in stocked.
        </p>
      </div>

      {/* Partner CTA — intentionally subtle */}
      <div className="mt-12 mb-8 pl-4 border-l-2 border-amber-600/40">
        <h3 className="text-sm text-slate-300 font-medium mb-2">Want a Partner in the Room?</h3>
        <p className="text-xs text-slate-500 leading-relaxed">
          Some operators reach a point where they want more than a tool on their phone. They want someone who&apos;s been in the stores, knows the numbers, and can help them figure out what&apos;s next — whether that&apos;s growing, optimizing, or planning an exit on their terms.
        </p>
        <p className="text-xs text-slate-500 leading-relaxed mt-2">
          If that&apos;s you, you probably already know who to call.
        </p>
      </div>

      {/* 8. DEVELOPER TOOLS */}
      <details className="mb-8">
        <summary className="text-[10px] text-slate-600 cursor-pointer py-2">Developer Tools</summary>
        <div className="mt-2 p-3 rounded-xl bg-slate-800 border border-slate-700 space-y-2">
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">Demo: Switch Tier</p>
          <p className="text-xs text-slate-400 mb-3">For internal demos only. Tier gating can be simulated here.</p>
          <div className="flex flex-wrap gap-2 items-center">
            {DEMO_TIERS.map((tier) => {
              const isActive = currentTier === tier.id;
              return (
                <button
                  key={tier.id}
                  type="button"
                  onClick={() => {
                    setCurrentTier(tier.id);
                    try {
                      localStorage.setItem("primeos-demo-tier", tier.id);
                    } catch {
                      // ignore
                    }
                  }}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 min-h-[44px] ${
                    isActive ? "bg-slate-600 text-white ring-2 ring-white/50" : `bg-slate-700 hover:bg-slate-600 hover:text-slate-300 ${tier.color}`
                  }`}
                >
                  <span>{tier.label}</span>
                  {isActive && (
                    <span className="bg-slate-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">CURRENT</span>
                  )}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={() => {
              setCurrentTier("enterprise");
              try {
                localStorage.setItem("primeos-demo-tier", "enterprise");
              } catch {
                // ignore
              }
            }}
            className="w-full py-2 rounded-lg bg-purple-600/20 border border-purple-700/30 text-purple-400 text-xs font-medium mt-2"
          >
            Reset to Enterprise (Full Access)
          </button>
          <div className="flex flex-wrap gap-2 items-center mt-3 pt-3 border-t border-slate-600">
            <button
              type="button"
              onClick={() => handleReset(["primeos-tos-accepted", "primeos-tos-accepted-at"], "Terms of Service")}
              className="px-3 py-2 rounded-lg text-xs font-medium bg-slate-700 text-slate-400 active:bg-slate-600 touch-manipulation min-h-[44px]"
            >
              Reset TOS
            </button>
            <button
              type="button"
              onClick={() => handleReset(["primeos-consent-dismissed"], "Cookie Consent")}
              className="px-3 py-2 rounded-lg text-xs font-medium bg-slate-700 text-slate-400 active:bg-slate-600 touch-manipulation min-h-[44px]"
            >
              Reset Consent
            </button>
            <button
              type="button"
              onClick={() => handleReset(["primeos-notification-prompt-dismissed"], "Notifications")}
              className="px-3 py-2 rounded-lg text-xs font-medium bg-slate-700 text-slate-400 active:bg-slate-600 touch-manipulation min-h-[44px]"
            >
              Reset Notifications
            </button>
            <button
              type="button"
              onClick={() => handleReset(["primeos-a2hs-dismissed"], "Add to Home Screen")}
              className="px-3 py-2 rounded-lg text-xs font-medium bg-slate-700 text-slate-400 active:bg-slate-600 touch-manipulation min-h-[44px]"
            >
              Reset A2HS
            </button>
          </div>
        </div>
      </details>
    </div>
  );
}
