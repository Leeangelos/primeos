"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/src/lib/auth-context";
import { cn } from "@/lib/utils";

function AnimatedStep({ delay, text }: { delay: number; text: string }) {
  const [visible, setVisible] = useState(false);
  const [checked, setChecked] = useState(false);
  useEffect(() => {
    const showTimer = setTimeout(() => setVisible(true), delay);
    const checkTimer = setTimeout(() => setChecked(true), delay + 500);
    return () => {
      clearTimeout(showTimer);
      clearTimeout(checkTimer);
    };
  }, [delay]);
  if (!visible) return null;
  return (
    <div className="flex items-center gap-3">
      <div
        className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-500 ${checked ? "bg-emerald-500" : "bg-zinc-700 animate-pulse"}`}
      >
        {checked && <span className="text-white text-xs">✓</span>}
      </div>
      <span className={`text-sm transition-all duration-500 ${checked ? "text-white" : "text-zinc-500"}`}>{text}</span>
    </div>
  );
}

type LetterGrade = "A" | "B" | "C" | "D" | "F";

function gradePillarProduct(foodCostPct: number): LetterGrade {
  if (foodCostPct <= 30) return "A";
  if (foodCostPct <= 33) return "B";
  if (foodCostPct <= 35) return "C";
  if (foodCostPct <= 38) return "D";
  return "F";
}

function gradePillarPeople(laborPct: number): LetterGrade {
  if (laborPct <= 25) return "A";
  if (laborPct <= 28) return "B";
  if (laborPct <= 30) return "C";
  if (laborPct <= 33) return "D";
  return "F";
}

function gradePillarPerformance(primePct: number): LetterGrade {
  if (primePct >= 65) return "A";
  if (primePct >= 60) return "B";
  if (primePct >= 55) return "C";
  if (primePct >= 50) return "D";
  return "F";
}

function pillarGradeColorClass(grade: LetterGrade): string {
  if (grade === "A" || grade === "B") return "text-emerald-400";
  if (grade === "C") return "text-amber-400";
  return "text-red-400";
}

const US_STATES = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut",
  "Delaware", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa",
  "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan",
  "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire",
  "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio",
  "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota",
  "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia",
  "Wisconsin", "Wyoming",
];

const GOAL_OPTIONS = [
  { id: "food", emoji: "🍕", label: "Lower my food cost" },
  { id: "team", emoji: "👥", label: "Manage my team better" },
  { id: "numbers", emoji: "📊", label: "Understand my numbers" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { session } = useAuth();
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (step !== 0) return;
    setProgress(0);
    const tProgress = setTimeout(() => setProgress(100), 100);
    const tAdvance = setTimeout(() => setStep(1), 4800);
    return () => {
      clearTimeout(tProgress);
      clearTimeout(tAdvance);
    };
  }, [step]);
  const [weeklySales, setWeeklySales] = useState<string>("");
  const [foodCostPct, setFoodCostPct] = useState<string>("");
  const [laborCostPct, setLaborCostPct] = useState<string>("");
  const [employeeCount, setEmployeeCount] = useState<string>("");
  const [monthlyRent, setMonthlyRent] = useState<string>("");
  const [googleBusinessName, setGoogleBusinessName] = useState<string>("");
  const [streetAddress, setStreetAddress] = useState<string>("");
  const [city, setCity] = useState<string>("");
  const [state, setState] = useState<string>("");
  const [zipCode, setZipCode] = useState<string>("");
  const [county, setCounty] = useState<string>("");
  const [goals, setGoals] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const metadata = session?.user?.user_metadata as Record<string, unknown> | undefined;
  if (typeof metadata === "object" && metadata !== null) {
    console.log("Onboarding: user_metadata", metadata);
  }
  const name = (metadata?.name as string) ?? "there";
  const storeNameRaw =
    (metadata?.store_name as string) ||
    (metadata?.storeName as string) ||
    (metadata?.store as string) ||
    "";
  const cityState =
    [metadata?.city, metadata?.state].filter(Boolean).join(", ") ||
    (metadata?.city_state as string) ||
    "";
  const storeName = storeNameRaw.trim() || cityState || "Your store";

  const toggleGoal = (id: string) => {
    setGoals((prev) => (prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]));
  };

  const handleComplete = async () => {
    setSubmitting(true);
    const userId = session?.user?.id;
    const onboardingPayload = {
      user_id: userId,
      store_name: storeName,
      weekly_sales: weeklySales ? Number(weeklySales) : null,
      food_cost_pct: foodCostPct ? Number(foodCostPct) : null,
      labor_cost_pct: laborCostPct ? Number(laborCostPct) : null,
      employee_count: employeeCount ? Number(employeeCount) : null,
      monthly_rent: monthlyRent ? Number(monthlyRent) : null,
      google_business_name: googleBusinessName || null,
      street_address: streetAddress || null,
      city: city || null,
      state: state || null,
      zip_code: zipCode || null,
      county: county || null,
      goals,
    };
    try {
      console.log("COMPLETING ONBOARDING", onboardingPayload);
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(onboardingPayload),
      });
      console.log("ONBOARDING API RESPONSE", res.status);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error("ONBOARDING API ERROR", err);
      }
      if (typeof userId === "string" && userId) {
        localStorage.setItem(`primeos-onboarding-complete-${userId}`, "true");
      }
      console.log("LOCALSTORAGE SET, REDIRECTING");
      window.location.href = "/";
    } catch (err) {
      console.error("ONBOARDING COMPLETE ERROR", err);
      if (typeof userId === "string" && userId) {
        localStorage.setItem(`primeos-onboarding-complete-${userId}`, "true");
      }
      window.location.href = "/";
    }
  };

  const foodNum = foodCostPct ? Number(foodCostPct) : 33;
  const laborNum = laborCostPct ? Number(laborCostPct) : 30;
  const primePct = 100 - foodNum - laborNum;
  const productGrade = gradePillarProduct(foodNum);
  const peopleGrade = gradePillarPeople(laborNum);
  const processGrade = gradePillarPerformance(primePct);

  const totalSteps = 5;

  return (
    <div className="h-screen overflow-hidden bg-zinc-950 text-white flex flex-col px-4 py-4">
      <div className="w-full max-w-md flex-1 flex flex-col justify-center mx-auto min-h-0">
        {step > 0 && (
          <div className="flex justify-center gap-2 mt-2 mb-2 shrink-0">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "w-2 h-2 rounded-full transition-colors",
                  i + 1 === step ? "bg-[#E65100]" : "bg-zinc-700"
                )}
              />
            ))}
          </div>
        )}

        {step === 0 && (
          <>
            <div className="fixed top-0 left-0 right-0 h-1 bg-zinc-800 z-50">
              <div
                className="h-full bg-[#E65100] transition-all duration-[5000ms] ease-linear"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="text-center space-y-6 max-w-sm mx-auto">
              <h1 className="text-2xl font-bold text-white">Setting up PrimeOS</h1>
              <div className="space-y-3 text-left">
                <AnimatedStep delay={0} text="Verifying your account" />
                <AnimatedStep delay={1000} text="Loading your store" />
                <AnimatedStep delay={2000} text="Preparing your dashboard" />
                <AnimatedStep delay={3000} text="Crunching your numbers" />
                <AnimatedStep delay={4000} text="You're in 🔥" />
              </div>
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <div className="flex-1 flex flex-col justify-center space-y-2 text-center min-h-0">
              <h1 className="text-lg font-bold">Welcome to PrimeOS, {name}!</h1>
              <p className="text-zinc-400 text-xs">Let&apos;s set up your store. Takes about 60 seconds.</p>
              {storeName && storeName !== "Your store" && (
                <p className="text-zinc-500 text-xs">Your store: {storeName}</p>
              )}
            </div>
            <div className="shrink-0">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="w-full py-2.5 rounded-xl bg-[#E65100] text-white font-semibold text-sm mt-2"
              >
                Let&apos;s Go →
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="flex-1 flex flex-col justify-center min-h-0 overflow-auto">
              <h2 className="text-lg font-bold mb-0.5">Enter a few numbers about your business.</h2>
              <p className="text-zinc-400 text-xs mb-2">Don&apos;t worry about being exact — estimates work.</p>
              <div className="space-y-1.5">
                <div>
                  <label className="block text-xs text-zinc-500 mb-0.5">Average weekly sales ($)</label>
                  <input
                    type="number"
                    value={weeklySales}
                    onChange={(e) => setWeeklySales(e.target.value)}
                    placeholder="$8,000"
                    className="w-full h-10 py-1.5 bg-zinc-900 border border-zinc-700 rounded-lg px-3 text-white placeholder:text-zinc-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-0.5">Estimated food cost (%)</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={foodCostPct}
                      onChange={(e) => setFoodCostPct(e.target.value)}
                      placeholder="32"
                      className="flex-1 h-10 py-1.5 bg-zinc-900 border border-zinc-700 rounded-lg px-3 text-white placeholder:text-zinc-500 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setFoodCostPct("33")}
                      className="px-2 py-0.5 rounded border border-zinc-600 text-zinc-400 text-xs whitespace-nowrap"
                    >
                      I don&apos;t know
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-0.5">Estimated labor cost (%)</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={laborCostPct}
                      onChange={(e) => setLaborCostPct(e.target.value)}
                      placeholder="30"
                      className="flex-1 h-10 py-1.5 bg-zinc-900 border border-zinc-700 rounded-lg px-3 text-white placeholder:text-zinc-500 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setLaborCostPct("30")}
                      className="px-2 py-0.5 rounded border border-zinc-600 text-zinc-400 text-xs whitespace-nowrap"
                    >
                      I don&apos;t know
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-0.5">Number of employees</label>
                  <input
                    type="number"
                    value={employeeCount}
                    onChange={(e) => setEmployeeCount(e.target.value)}
                    placeholder="12"
                    className="w-full h-10 py-1.5 bg-zinc-900 border border-zinc-700 rounded-lg px-3 text-white placeholder:text-zinc-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-0.5">Monthly rent ($)</label>
                  <input
                    type="number"
                    value={monthlyRent}
                    onChange={(e) => setMonthlyRent(e.target.value)}
                    placeholder="$3,500"
                    className="w-full h-10 py-1.5 bg-zinc-900 border border-zinc-700 rounded-lg px-3 text-white placeholder:text-zinc-500 text-sm"
                  />
                </div>
              </div>
            </div>
            <div className="shrink-0">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="w-full py-2.5 rounded-xl bg-[#E65100] text-white font-semibold text-sm mt-2"
              >
                Next →
              </button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <div className="flex-1 flex flex-col justify-center min-h-0 overflow-auto">
              <h2 className="text-lg font-bold mb-0.5">Let&apos;s find you online.</h2>
              <p className="text-zinc-400 text-xs mb-2">This helps PrimeOS pull your real Google reviews, competitor data, and local insights.</p>
              <div className="space-y-1.5">
                <div>
                  <label className="block text-xs text-zinc-500 mb-0.5">Your Google Business name *</label>
                  <input
                    type="text"
                    value={googleBusinessName}
                    onChange={(e) => setGoogleBusinessName(e.target.value)}
                    placeholder="e.g., Joe's Pizza"
                    className="w-full h-10 py-1.5 bg-zinc-900 border border-zinc-700 rounded-lg px-3 text-white placeholder:text-zinc-500 text-sm"
                  />
                  <p className="text-xs text-zinc-500 mt-0.5">Exactly as it appears on Google Maps</p>
                </div>
                <div>
                  <label className="block text-xs text-zinc-500 mb-0.5">Street address *</label>
                  <input
                    type="text"
                    value={streetAddress}
                    onChange={(e) => setStreetAddress(e.target.value)}
                    placeholder="e.g., 123 Main St"
                    className="w-full h-10 py-1.5 bg-zinc-900 border border-zinc-700 rounded-lg px-3 text-white placeholder:text-zinc-500 text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-zinc-500 mb-0.5">City *</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g., Kent"
                      className="w-full h-10 py-1.5 bg-zinc-900 border border-zinc-700 rounded-lg px-3 text-white placeholder:text-zinc-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-500 mb-0.5">State *</label>
                    <select
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="w-full h-10 py-1.5 bg-zinc-900 border border-zinc-700 rounded-lg px-3 text-white text-sm"
                    >
                      <option value="">Select</option>
                      {US_STATES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-zinc-500 mb-0.5">Zip code *</label>
                    <input
                      type="text"
                      value={zipCode}
                      onChange={(e) => setZipCode(e.target.value)}
                      placeholder="e.g., 44240"
                      className="w-full h-10 py-1.5 bg-zinc-900 border border-zinc-700 rounded-lg px-3 text-white placeholder:text-zinc-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-500 mb-0.5">County</label>
                    <input
                      type="text"
                      value={county}
                      onChange={(e) => setCounty(e.target.value)}
                      placeholder="e.g., Portage"
                      className="w-full h-10 py-1.5 bg-zinc-900 border border-zinc-700 rounded-lg px-3 text-white placeholder:text-zinc-500 text-sm"
                    />
                  </div>
                </div>
                <p className="text-xs text-zinc-500">County helps us track local health inspections.</p>
              </div>
            </div>
            <div className="shrink-0">
              <button
                type="button"
                onClick={() => setStep(4)}
                disabled={!googleBusinessName.trim() || !streetAddress.trim() || !city.trim() || !state || !zipCode.trim()}
                className="w-full py-2.5 rounded-xl bg-[#E65100] text-white font-semibold text-sm mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next →
              </button>
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <div className="flex-1 flex flex-col justify-center min-h-0">
              <h2 className="text-lg font-bold mb-1">What matters most to you right now?</h2>
              <div className="space-y-2">
                {GOAL_OPTIONS.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => toggleGoal(g.id)}
                    className={cn(
                      "w-full flex items-center gap-2 p-2.5 rounded-xl border-2 text-left transition-colors text-xs",
                      goals.includes(g.id) ? "border-[#E65100] bg-[#E65100]/10" : "border-zinc-700 bg-zinc-900"
                    )}
                  >
                    <span className="text-lg">{g.emoji}</span>
                    <span className="font-medium">{g.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="shrink-0">
              <button
                type="button"
                onClick={() => setStep(5)}
                className="w-full py-2.5 rounded-xl bg-[#E65100] text-white font-semibold text-sm mt-2"
              >
                Next →
              </button>
            </div>
          </>
        )}

        {step === 5 && (
          <>
            <div className="flex-1 flex flex-col justify-center min-h-0">
              <h2 className="text-lg font-bold mb-0.5">Your dashboard is ready.</h2>
              <p className="text-zinc-400 text-xs mb-2">We built your PrimeOS around the numbers you just gave us.</p>
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-lg bg-zinc-900 border border-zinc-700 p-2 text-center">
                  <div className="text-base mb-0.5">🍕</div>
                  <div className="text-[10px] text-zinc-500">Product</div>
                  <div className={cn("text-sm font-bold", pillarGradeColorClass(productGrade))}>{productGrade}</div>
                </div>
                <div className="rounded-lg bg-zinc-900 border border-zinc-700 p-2 text-center">
                  <div className="text-base mb-0.5">👥</div>
                  <div className="text-[10px] text-zinc-500">People</div>
                  <div className={cn("text-sm font-bold", pillarGradeColorClass(peopleGrade))}>{peopleGrade}</div>
                </div>
                <div className="rounded-lg bg-zinc-900 border border-zinc-700 p-2 text-center">
                  <div className="text-base mb-0.5">📊</div>
                  <div className="text-[10px] text-zinc-500">Process</div>
                  <div className={cn("text-sm font-bold", pillarGradeColorClass(processGrade))}>{processGrade}</div>
                </div>
              </div>
            </div>
            <div className="shrink-0">
              <button
                type="button"
                onClick={handleComplete}
                disabled={submitting}
                className="w-full py-2.5 rounded-xl bg-[#E65100] text-white font-semibold text-sm mt-2 disabled:opacity-70"
              >
                {submitting ? "Saving…" : "Open My Dashboard →"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
