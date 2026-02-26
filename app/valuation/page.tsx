"use client";

import { useState, useMemo } from "react";
import { TrendingUp, ChevronDown } from "lucide-react";
import { EducationInfoIcon } from "@/src/components/education/InfoIcon";
import { calculateOperatorScore } from "@/src/lib/score-engine";

interface ValuationInputs {
  annualRevenue: number;
  primePercent: number;
  yearsOperating: number;
  numberOfLocations: number;
  ownsSpace: boolean;
  hasPOS: boolean;
  operatorScore: number;
}

interface ValuationResult {
  sde: number;
  lowMultiple: number;
  midMultiple: number;
  highMultiple: number;
  lowValuation: number;
  midValuation: number;
  highValuation: number;
  driversUp: string[];
  driversDown: string[];
}

function calculateValuation(inputs: ValuationInputs): ValuationResult {
  const overheadPercent = 0.15;
  const sde =
    inputs.annualRevenue *
    (1 - inputs.primePercent / 100 - overheadPercent);

  let lowMult = 1.5;
  let midMult = 2.5;
  let highMult = 3.5;

  const driversUp: string[] = [];
  const driversDown: string[] = [];

  if (inputs.yearsOperating >= 3) {
    lowMult += 0.25;
    midMult += 0.25;
    highMult += 0.25;
    driversUp.push("3+ years operating history");
  }
  if (inputs.numberOfLocations >= 2) {
    lowMult += 0.5;
    midMult += 0.5;
    highMult += 0.5;
    driversUp.push("Multiple locations");
  }
  if (inputs.ownsSpace) {
    lowMult += 0.5;
    midMult += 0.5;
    highMult += 0.5;
    driversUp.push("Real estate ownership");
  }
  if (inputs.primePercent < 55) {
    lowMult += 0.25;
    midMult += 0.25;
    highMult += 0.25;
    driversUp.push("PRIME cost under 55%");
  }
  if (inputs.operatorScore >= 80) {
    lowMult += 0.25;
    midMult += 0.25;
    highMult += 0.25;
    driversUp.push("Strong Operator Score");
  }
  if (inputs.hasPOS) {
    driversUp.push("Integrated POS system (systems maturity)");
  }

  if (inputs.primePercent > 65) {
    lowMult -= 0.5;
    midMult -= 0.5;
    highMult -= 0.5;
    driversDown.push("PRIME cost above 65%");
  }
  if (inputs.yearsOperating < 2) {
    lowMult -= 0.5;
    midMult -= 0.5;
    highMult -= 0.5;
    driversDown.push("Under 2 years operating");
  }
  if (inputs.numberOfLocations === 1 && !inputs.ownsSpace) {
    lowMult -= 0.25;
    midMult -= 0.25;
    highMult -= 0.25;
    driversDown.push("Single location, leased space");
  }

  lowMult = Math.max(0.5, lowMult);
  midMult = Math.max(1.0, midMult);
  highMult = Math.max(1.5, highMult);

  return {
    sde: Math.round(sde),
    lowMultiple: Math.round(lowMult * 100) / 100,
    midMultiple: Math.round(midMult * 100) / 100,
    highMultiple: Math.round(highMult * 100) / 100,
    lowValuation: Math.round(sde * lowMult),
    midValuation: Math.round(sde * midMult),
    highValuation: Math.round(sde * highMult),
    driversUp,
    driversDown,
  };
}

function formatCurrency(n: number): string {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `$${(n / 1000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

export default function ValuationPage() {
  const score = calculateOperatorScore();
  const [inputs, setInputs] = useState<ValuationInputs>({
    annualRevenue: 1700000,
    primePercent: 52.6,
    yearsOperating: 14,
    numberOfLocations: 3,
    ownsSpace: false,
    hasPOS: true,
    operatorScore: score.overall,
  });
  const [showMethodology, setShowMethodology] = useState(false);
  const result = useMemo(() => calculateValuation(inputs), [inputs]);

  return (
    <div className="space-y-6 pb-28">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-amber-400" />
            What&apos;s It Worth?
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Business valuation estimator</p>
        </div>
        <EducationInfoIcon metricKey="valuation" />
      </div>

      {/* Valuation Range Hero */}
      <div className="bg-amber-600/10 border border-amber-700/20 rounded-2xl p-5 mb-4 text-center">
        <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-2">
          Estimated Valuation Range
        </p>
        <div className="flex items-baseline justify-center gap-2">
          <span className="text-2xl font-bold text-amber-400">
            {formatCurrency(result.lowValuation)}
          </span>
          <span className="text-sm text-slate-500">—</span>
          <span className="text-2xl font-bold text-amber-400">
            {formatCurrency(result.highValuation)}
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Midpoint:{" "}
          <span className="text-white font-semibold">
            {formatCurrency(result.midValuation)}
          </span>
        </p>
        <p className="text-[9px] text-slate-600 mt-3">
          Based on restaurant industry SDE multiples. For informational purposes only — not an
          appraisal, and not financial advice.
        </p>
      </div>

      {/* SDE Card */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-white">Estimated SDE</p>
          <p className="text-lg font-bold text-white">
            {formatCurrency(result.sde)}
            <span className="text-[10px] text-slate-500 font-normal">/year</span>
          </p>
        </div>
        <p className="text-[10px] text-slate-500">
          Seller&apos;s Discretionary Earnings — what the business generates for its owner after
          food, labor, disposables, and estimated overhead.
        </p>
        <div className="mt-2 text-[10px] text-slate-600">
          Multiples applied: {result.lowMultiple}× — {result.highMultiple}×
        </div>
      </div>

      {/* Drivers */}
      {result.driversUp.length > 0 && (
        <div className="mb-4">
          <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-2">
            What&apos;s Driving Your Range Up
          </p>
          <div className="flex flex-wrap gap-1.5">
            {result.driversUp.map((d) => (
              <span
                key={d}
                className="px-2.5 py-1 rounded-lg bg-emerald-600/10 border border-emerald-700/20 text-[11px] text-emerald-400"
              >
                {d}
              </span>
            ))}
          </div>
        </div>
      )}

      {result.driversDown.length > 0 && (
        <div className="mb-4">
          <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-2">
            What&apos;s Holding Your Range Back
          </p>
          <div className="flex flex-wrap gap-1.5">
            {result.driversDown.map((d) => (
              <span
                key={d}
                className="px-2.5 py-1 rounded-lg bg-amber-600/10 border border-amber-700/20 text-[11px] text-amber-400"
              >
                {d}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Inputs — editable */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 mb-4">
        <p className="text-xs font-semibold text-white mb-3">Your Numbers</p>

        <div className="space-y-3">
          <div>
            <label className="text-[10px] text-slate-500 block mb-1">
              Annual Gross Revenue
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
                $
              </span>
              <input
                type="number"
                value={inputs.annualRevenue}
                onChange={(e) =>
                  setInputs({ ...inputs, annualRevenue: Number(e.target.value) })
                }
                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-7 pr-3 py-2 text-sm text-white"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] text-slate-500 block mb-1">PRIME Cost %</label>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                value={inputs.primePercent}
                onChange={(e) =>
                  setInputs({ ...inputs, primePercent: Number(e.target.value) })
                }
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">
                %
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-slate-500 block mb-1">
                Years Operating
              </label>
              <input
                type="number"
                value={inputs.yearsOperating}
                onChange={(e) =>
                  setInputs({ ...inputs, yearsOperating: Number(e.target.value) })
                }
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-500 block mb-1">Locations</label>
              <input
                type="number"
                value={inputs.numberOfLocations}
                onChange={(e) =>
                  setInputs({ ...inputs, numberOfLocations: Number(e.target.value) })
                }
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
              />
            </div>
          </div>

          <div className="flex items-center justify-between py-2">
            <span className="text-xs text-slate-400">Own the space?</span>
            <button
              type="button"
              onClick={() => setInputs({ ...inputs, ownsSpace: !inputs.ownsSpace })}
              className={`w-10 h-5 rounded-full transition-colors ${
                inputs.ownsSpace ? "bg-[#E65100]" : "bg-slate-700"
              }`}
              aria-pressed={inputs.ownsSpace}
            >
              <span
                className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                  inputs.ownsSpace ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between py-2">
            <span className="text-xs text-slate-400">Integrated POS system?</span>
            <button
              type="button"
              onClick={() => setInputs({ ...inputs, hasPOS: !inputs.hasPOS })}
              className={`w-10 h-5 rounded-full transition-colors ${
                inputs.hasPOS ? "bg-[#E65100]" : "bg-slate-700"
              }`}
              aria-pressed={inputs.hasPOS}
            >
              <span
                className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                  inputs.hasPOS ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Methodology toggle */}
      <button
        type="button"
        onClick={() => setShowMethodology(!showMethodology)}
        className="w-full flex items-center justify-between py-2 mb-2"
      >
        <span className="text-xs text-slate-500">How is this calculated?</span>
        <ChevronDown
          className={`w-4 h-4 text-slate-600 transition-transform ${
            showMethodology ? "rotate-180" : ""
          }`}
        />
      </button>

      {showMethodology && (
        <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4 mb-4">
          <p className="text-[11px] text-slate-400 leading-relaxed mb-2">
            This estimate uses Seller&apos;s Discretionary Earnings (SDE) — a standard method for
            valuing owner-operated restaurants. SDE represents the total financial benefit the
            business provides to its owner.
          </p>
          <p className="text-[11px] text-slate-400 leading-relaxed mb-2">
            <span className="text-white">SDE</span> = Annual Revenue × (1 − PRIME% − 15% estimated
            overhead)
          </p>
          <p className="text-[11px] text-slate-400 leading-relaxed mb-2">
            The valuation range applies industry-standard multiples (typically 1.5× to 3.5× SDE)
            adjusted for factors that buyers consider: operating history, number of locations, real
            estate, cost efficiency, and business systems.
          </p>
          <p className="text-[11px] text-slate-400 leading-relaxed mb-2">
            SDE multiples for independent restaurants typically range from 1.5× to 3.5× according to
            BizBuySell and industry brokerages. The adjustments applied (operating history,
            locations, real estate, cost efficiency) are standard factors documented by SCORE and
            the SBA that buyers and lenders evaluate.
          </p>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            This is an informational estimate, not an appraisal. Actual business valuations depend
            on many additional factors including local market conditions, lease terms, equipment
            condition, and buyer demand.
          </p>
        </div>
      )}

      {/* Sources & Methodology */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 mb-4">
        <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-3">
          Sources & Industry Data
        </p>

        <div className="space-y-2.5">
          <div>
            <a
              href="https://www.bizbuysell.com/insight-report/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-400 underline"
            >
              BizBuySell Insight Report
            </a>
            <p className="text-[10px] text-slate-600 mt-0.5">
              Largest marketplace for buying/selling businesses. Publishes quarterly data on
              restaurant sale prices, revenue multiples, and SDE multiples across the US.
            </p>
          </div>

          <div>
            <a
              href="https://www.sba.gov/business-guide/plan-your-business/calculate-your-startup-costs"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-400 underline"
            >
              U.S. Small Business Administration (SBA)
            </a>
            <p className="text-[10px] text-slate-600 mt-0.5">
              Federal resource on business valuation methods, SDE calculations, and what lenders and
              buyers look for when evaluating small businesses.
            </p>
          </div>

          <div>
            <a
              href="https://www.score.org/resource-article/how-value-small-business"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-400 underline"
            >
              SCORE — How to Value a Small Business
            </a>
            <p className="text-[10px] text-slate-600 mt-0.5">
              SBA partner and mentoring network. Provides free guidance on business valuation
              methods including SDE multiples for owner-operated businesses.
            </p>
          </div>

          <div>
            <a
              href="https://www.restaurantbroker.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-400 underline"
            >
              The Restaurant Broker
            </a>
            <p className="text-[10px] text-slate-600 mt-0.5">
              Industry-specific brokerage that publishes restaurant valuation benchmarks. SDE
              multiples for independent restaurants typically range from 1.5× to 3.5×.
            </p>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-700/50">
          <p className="text-[10px] text-slate-600 leading-relaxed">
            The multiples used in this estimator are based on publicly available restaurant
            industry data from these sources. Actual valuations vary based on local market
            conditions, lease terms, equipment, customer base, and current buyer demand. This is an
            informational estimate — not an appraisal, and not financial advice.
          </p>
        </div>
      </div>

      {/* Improve your range */}
      <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4 text-center">
        <p className="text-xs text-slate-400 mb-1">
          Improving your Operator Score can improve your range.
        </p>
        <p className="text-[10px] text-slate-600">
          Every dimension PrimeOS tracks — financials, reputation, consistency, vendors, team —
          contributes to how a business is valued.
        </p>
      </div>
    </div>
  );
}
