"use client";

import { useState, useRef, useEffect } from "react";
import { FileUp, Camera, Image, FileText, FileSpreadsheet, ChevronDown } from "lucide-react";
import { EducationInfoIcon } from "@/src/components/education/InfoIcon";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "actual-pnl-uploaded";

function LineItem({
  label,
  amount,
  pct,
  badge,
}: {
  label: string;
  amount: string;
  pct?: string;
  badge?: "green" | "yellow" | "red";
}) {
  const amountClass =
    badge === "green"
      ? "text-emerald-400"
      : badge === "yellow"
        ? "text-amber-400"
        : badge === "red"
          ? "text-red-400"
          : "text-white";
  return (
    <div className="flex justify-between items-center gap-2 py-1.5 text-sm">
      <span className="text-slate-300">{label}</span>
      <div className="flex items-center gap-2 shrink-0">
        <span className={cn("font-medium tabular-nums", amountClass)}>{amount}</span>
        {pct != null && <span className="text-xs text-slate-400 tabular-nums">{pct}</span>}
      </div>
    </div>
  );
}

function BenchmarkRow({
  label,
  actual,
  target,
  status,
  detail,
}: {
  label: string;
  actual: string;
  target: string;
  status: "green" | "yellow" | "red";
  detail: string;
}) {
  const badgeClass =
    status === "green" ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40" : status === "yellow" ? "bg-amber-500/20 text-amber-400 border-amber-500/40" : "bg-red-500/20 text-red-400 border-red-500/40";
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm text-slate-200">{label}</span>
          <span className="text-sm font-medium text-white tabular-nums shrink-0">{actual}</span>
        </div>
        <span className={cn("text-[10px] uppercase px-2 py-0.5 rounded border font-medium shrink-0", badgeClass)}>
          {target}
        </span>
      </div>
      <p className="text-xs text-slate-500">{detail}</p>
    </div>
  );
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const NET_PROFIT_PLAYBOOK = [
  "Consider identifying the biggest gap: is GP (variable costs) down, or are fixed costs up? Focus on the bigger problem first.",
  "If GP is healthy but net is low, your fixed cost structure is the problem. Consider running the occupancy, insurance, and utilities playbooks.",
  "If GP is also weak, many operators find it helpful to address variable costs first. Food cost and labor improvements show up in days. Fixed cost savings take months to renegotiate.",
  "Consider calculating your monthly break-even: total fixed costs ÷ GP margin %. Example: $28,720 ÷ 0.45 = $63,822 minimum monthly revenue.",
  "Consider building a 90-day plan: target 1 point improvement in GP margin per month while holding fixed costs flat. At $148K revenue, 1 point = $1,482/month straight to the bottom line.",
];

export default function ActualPnlPage() {
  const [viewMode, setViewMode] = useState<"upload" | "processing" | "pnl">("upload");
  const [month, setMonth] = useState(1); // February = 1
  const [year, setYear] = useState(2026);
  const [playbookOpen, setPlaybookOpen] = useState(true);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "true") setViewMode("pnl");
  }, []);

  const handleFile = () => {
    setViewMode("processing");
    setTimeout(() => {
      setViewMode("pnl");
      if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, "true");
    }, 2000);
  };

  const prevMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else setMonth((m) => m + 1);
  };

  const monthLabel = `${MONTHS[month]} ${year}`;

  return (
    <div className="space-y-4 pb-28">
      <div className="flex items-center gap-2 flex-wrap">
        <h1 className="text-lg font-semibold sm:text-2xl text-white">Actual P&L</h1>
        <FileSpreadsheet className="w-6 h-6 text-slate-500 shrink-0" aria-hidden />
        <EducationInfoIcon metricKey="gp_vs_net_profit" />
      </div>
      <p className="text-sm text-slate-400">Upload your CPA&apos;s monthly financials. See your real net profit.</p>

      {/* Month selector */}
      <div className="flex items-center justify-center gap-2">
        <button
          type="button"
          onClick={prevMonth}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg border border-slate-600 bg-slate-800/80 text-slate-300 hover:text-white transition-colors"
          aria-label="Previous month"
        >
          ←
        </button>
        <span className="text-sm font-medium min-w-[160px] text-center">{monthLabel}</span>
        <button
          type="button"
          onClick={nextMonth}
          className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg border border-slate-600 bg-slate-800/80 text-slate-300 hover:text-white transition-colors"
          aria-label="Next month"
        >
          →
        </button>
      </div>

      {viewMode === "upload" && (
        <>
          <div className="bg-slate-800 rounded-xl border border-slate-700 border-dashed p-8 text-center">
            <FileUp className="w-12 h-12 text-slate-500 mx-auto mb-4" aria-hidden />
            <h3 className="text-lg font-semibold text-white mb-2">Upload CPA Financials</h3>
            <p className="text-sm text-slate-400 mb-6">
              PDF, photo, or screenshot of your monthly P&L from your accountant
            </p>
            <div className="grid grid-cols-3 gap-3">
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFile}
              />
              <input
                ref={galleryInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFile}
              />
              <input ref={pdfInputRef} type="file" accept="application/pdf,image/*" className="hidden" onChange={handleFile} />
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                className="bg-slate-700 rounded-xl p-4 flex flex-col items-center gap-2 active:bg-slate-600 transition-colors"
              >
                <Camera className="w-6 h-6 text-blue-400" aria-hidden />
                <span className="text-xs text-slate-300">Take Photo</span>
              </button>
              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                className="bg-slate-700 rounded-xl p-4 flex flex-col items-center gap-2 active:bg-slate-600 transition-colors"
              >
                <Image className="w-6 h-6 text-emerald-400" aria-hidden />
                <span className="text-xs text-slate-300">From Photos</span>
              </button>
              <button
                type="button"
                onClick={() => pdfInputRef.current?.click()}
                className="bg-slate-700 rounded-xl p-4 flex flex-col items-center gap-2 active:bg-slate-600 transition-colors"
              >
                <FileText className="w-6 h-6 text-amber-400" aria-hidden />
                <span className="text-xs text-slate-300">Upload PDF</span>
              </button>
            </div>
          </div>
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 mt-4">
            <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">Why This Matters</h4>
            <p className="text-sm text-slate-300 leading-relaxed mb-3">
              Your GP P&L shows what you control daily — food, labor, disposables. But between gross profit and your
              bank account, there&apos;s a gap. Rent. Insurance. Utilities. Loan payments. That gap is your fixed cost
              burden, and most operators don&apos;t see it clearly until tax time.
            </p>
            <p className="text-sm text-slate-300 leading-relaxed">
              Upload your CPA&apos;s monthly financials and PrimeOS maps every line item, calculates your real net
              profit, and shows you exactly where the money goes between GP and the bottom line.
            </p>
          </div>
        </>
      )}

      {viewMode === "processing" && (
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-8 text-center">
          <div className="inline-block w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin mb-4" aria-hidden />
          <p className="text-sm text-slate-300">Reading your financials...</p>
        </div>
      )}

      {viewMode === "pnl" && (
        <>
          <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
            <div className="p-4 border-b border-slate-700">
              <div className="text-xs text-slate-500 uppercase tracking-wide mb-2">Revenue</div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-300">Total Sales</span>
                <span className="text-white font-medium">$148,200</span>
              </div>
            </div>
            <div className="p-4 border-b border-slate-700">
              <div className="text-xs text-slate-500 uppercase tracking-wide mb-2">Variable Costs</div>
              <LineItem label="Food & Beverage" amount="$44,460" pct="30.0%" />
              <LineItem label="Labor" amount="$31,122" pct="21.0%" />
              <LineItem label="Disposables & Packaging" amount="$5,928" pct="4.0%" />
              <div className="flex justify-between text-sm font-semibold text-white pt-2 mt-2 border-t border-slate-600">
                <span>Total Variable</span>
                <span>$81,510 (55.0%)</span>
              </div>
            </div>
            <div className="p-4 border-b border-slate-700 bg-emerald-950/20">
              <div className="flex justify-between">
                <span className="text-emerald-400 font-bold">Gross Profit</span>
                <div>
                  <span className="text-emerald-400 font-bold text-lg">$66,690</span>
                  <span className="text-xs text-slate-400 ml-2">45.0%</span>
                </div>
              </div>
            </div>
            <div className="p-4 border-b border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs text-slate-500 uppercase tracking-wide">Fixed Costs</div>
                <EducationInfoIcon metricKey="occupancy_pct" size="sm" />
              </div>
              <LineItem label="Rent / Occupancy" amount="$8,400" pct="5.7%" badge="green" />
              <LineItem label="Insurance" amount="$2,800" pct="1.9%" badge="green" />
              <LineItem label="Utilities" amount="$5,190" pct="3.5%" badge="green" />
              <LineItem label="Loan Payments" amount="$4,200" pct="2.8%" />
              <LineItem label="Marketing & Advertising" amount="$3,100" pct="2.1%" />
              <LineItem label="Technology & Software" amount="$680" pct="0.5%" />
              <LineItem label="Professional Services (CPA, Legal)" amount="$850" pct="0.6%" />
              <LineItem label="Repairs & Maintenance" amount="$1,400" pct="0.9%" />
              <LineItem label="Miscellaneous" amount="$2,100" pct="1.4%" />
              <div className="flex justify-between text-sm font-semibold text-white pt-2 mt-2 border-t border-slate-600">
                <span>Total Fixed</span>
                <span>$28,720 (19.4%)</span>
              </div>
            </div>
            <div className="p-4 bg-slate-700/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-white font-bold text-lg">Net Profit</span>
                  <EducationInfoIcon metricKey="net_profit" size="sm" />
                </div>
                <div>
                  <span className="text-emerald-400 font-bold text-xl">$37,970</span>
                  <span className="text-xs text-slate-400 ml-2">25.6%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-amber-950/30 rounded-xl border border-amber-800/50 p-5 mt-4">
            <h3 className="text-base font-bold text-amber-400 mb-4">The Gap — Where Your Money Goes</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-300">Your GP P&L says you made</span>
                <span className="text-lg font-bold text-emerald-400">$66,690</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-300">Your Actual P&L says you kept</span>
                <span className="text-lg font-bold text-white">$37,970</span>
              </div>
              <div className="border-t border-amber-800/50 pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-amber-400">The gap (your fixed costs)</span>
                  <span className="text-lg font-bold text-amber-400">$28,720</span>
                </div>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <p className="text-xs text-amber-200/70">
                That&apos;s 19.4¢ of every dollar going to costs you don&apos;t see on your daily P&L.
              </p>
              <p className="text-xs text-amber-200/70">
                Biggest chunks: Rent $8,400 · Utilities $5,190 · Loan Payments $4,200
              </p>
            </div>
          </div>

          <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 mt-4">
            <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">Fixed Cost Benchmarks</h4>
            <div className="space-y-3">
              <BenchmarkRow
                label="Occupancy (Rent)"
                actual="5.7%"
                target="≤6%"
                status="green"
                detail="$8,400/mo on $148,200 revenue. You're within target."
              />
              <BenchmarkRow
                label="Insurance"
                actual="1.9%"
                target="1.5–2.5%"
                status="green"
                detail="$2,800/mo. Consider shopping insurance at the next renewal (3 quotes is a solid baseline)."
              />
              <BenchmarkRow
                label="Utilities"
                actual="3.5%"
                target="3–5%"
                status="green"
                detail="$5,190/mo. Consider checking walk-in seals, LED lighting, and thermostat schedule."
              />
              <BenchmarkRow
                label="Total Fixed"
                actual="19.4%"
                target="≤20%"
                status="green"
                detail="$28,720/mo. You're running a tight ship."
              />
            </div>
          </div>

          <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden mt-4 mb-4">
            <button
              type="button"
              onClick={() => setPlaybookOpen((o) => !o)}
              className="w-full flex justify-between items-center p-4 text-left"
            >
              <span className="text-base font-semibold text-red-400">When Net Profit Drops — Operator Playbook</span>
              <ChevronDown className={cn("w-5 h-5 shrink-0 text-slate-400 transition-transform", playbookOpen && "rotate-180")} aria-hidden />
            </button>
            {playbookOpen && (
              <div className="px-4 pb-4 space-y-3">
                {NET_PROFIT_PLAYBOOK.map((text, i) => (
                  <div key={i} className="flex gap-2">
                    <span className="text-red-400/70 shrink-0 font-medium">{i + 1}.</span>
                    <p className="text-sm text-slate-300 leading-relaxed">{text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
