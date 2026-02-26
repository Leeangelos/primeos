"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { FileUp, Camera, Image, FileText, FileSpreadsheet, ChevronDown } from "lucide-react";
import { EducationInfoIcon } from "@/src/components/education/InfoIcon";
import { ExportButton } from "@/src/components/ui/ExportButton";
import { formatPct, formatDollars } from "@/src/lib/formatters";
import { cn } from "@/lib/utils";

const STORAGE_KEY_MONTHS = "primeos-actual-pnl-months";
const STORAGE_KEY_DATA = "primeos-actual-pnl-data";
const STORAGE_KEY_LEGACY = "actual-pnl-uploaded";

export type PnlRawData = {
  revenue: number;
  food: number;
  labor: number;
  disposables: number;
  rent: number;
  insurance: number;
  utilities: number;
  loans: number;
  marketing: number;
  tech: number;
  professional: number;
  repairs: number;
  misc: number;
};

/** Seasonal revenue multiplier by month (1–12): lower Jan/Feb, higher summer. */
function getSeasonalMultiplier(monthKey: string): number {
  const [, m] = monthKey.split("-").map(Number);
  const monthIndex = typeof m === "number" && m >= 1 && m <= 12 ? m : 6;
  const multipliers: Record<number, number> = {
    1: 0.92, 2: 0.94, 3: 0.98, 4: 1.0, 5: 1.02, 6: 1.04,
    7: 1.06, 8: 1.05, 9: 1.02, 10: 1.0, 11: 0.98, 12: 1.04,
  };
  return multipliers[monthIndex] ?? 1.0;
}

function getMonthlyPnlData(monthKey: string): PnlRawData {
  const multiplier = getSeasonalMultiplier(monthKey);
  const base = {
    revenue: 148200,
    food: 44460,
    labor: 31122,
    disposables: 5928,
    rent: 8400,
    insurance: 2800,
    utilities: 5190,
    loans: 4200,
    marketing: 3100,
    tech: 680,
    professional: 850,
    repairs: 1400,
    misc: 2100,
  };
  return {
    revenue: Math.round(base.revenue * multiplier),
    food: Math.round(base.food * multiplier),
    labor: Math.round(base.labor * multiplier),
    disposables: Math.round(base.disposables * multiplier),
    rent: base.rent,
    insurance: base.insurance,
    utilities: base.utilities,
    loans: base.loans,
    marketing: base.marketing,
    tech: base.tech,
    professional: base.professional,
    repairs: base.repairs,
    misc: base.misc,
  };
}

function LineItem({
  label,
  amount,
  pct,
  badge,
  metricKey,
  amountColor,
}: {
  label: string;
  amount: string;
  pct?: string;
  badge?: "green" | "yellow" | "red";
  metricKey?: string;
  amountColor?: "green" | "red";
}) {
  const badgeClass =
    badge === "green"
      ? "text-emerald-400"
      : badge === "yellow"
        ? "text-amber-400"
        : badge === "red"
          ? "text-red-400"
          : "text-white";
  const amountClass =
    amountColor === "red"
      ? "text-red-400"
      : amountColor === "green"
        ? "text-emerald-400"
        : badgeClass;
  return (
    <div className="flex justify-between items-center gap-2 py-1.5 text-sm">
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-slate-300">{label}</span>
        {metricKey != null && <EducationInfoIcon metricKey={metricKey} size="sm" />}
      </div>
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
  "Consider building a 90-day plan: target 1 point improvement in GP margin per month while holding fixed costs flat. At $148K revenue, 1 point = $1,482/month straight to Net Profit.",
];

export default function ActualPnlPage() {
  const [uploadedMonths, setUploadedMonths] = useState<Record<string, boolean>>({});
  const [uploadedPnlData, setUploadedPnlData] = useState<Record<string, PnlRawData>>({});
  const [viewMode, setViewMode] = useState<"upload" | "processing" | "pnl">("upload");
  const [month, setMonth] = useState(1); // February = 1
  const [year, setYear] = useState(2026);
  const [playbookOpen, setPlaybookOpen] = useState(true);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  const currentMonthKey = `${year}-${String(month + 1).padStart(2, "0")}`;
  const isUploaded = uploadedMonths[currentMonthKey] === true;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem(STORAGE_KEY_MONTHS);
    if (stored) {
      try {
        setUploadedMonths(JSON.parse(stored));
      } catch {
        // ignore
      }
    }
    const dataStored = localStorage.getItem(STORAGE_KEY_DATA);
    if (dataStored) {
      try {
        setUploadedPnlData(JSON.parse(dataStored));
      } catch {
        // ignore
      }
    }
    const legacy = localStorage.getItem(STORAGE_KEY_LEGACY);
    if (legacy === "true") {
      const key = "2026-02";
      const snapshot = getMonthlyPnlData(key);
      setUploadedMonths((prev) => ({ ...prev, [key]: true }));
      setUploadedPnlData((prev) => ({ ...prev, [key]: snapshot }));
      localStorage.setItem(STORAGE_KEY_MONTHS, JSON.stringify({ [key]: true }));
      localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify({ [key]: snapshot }));
      localStorage.removeItem(STORAGE_KEY_LEGACY);
    }
  }, []);

  useEffect(() => {
    if (viewMode === "processing") return;
    setViewMode(isUploaded ? "pnl" : "upload");
  }, [currentMonthKey, isUploaded]);

  const handleFile = () => {
    setViewMode("processing");
    setTimeout(() => {
      const snapshot = getMonthlyPnlData(currentMonthKey);
      const nextMonths = { ...uploadedMonths, [currentMonthKey]: true };
      const nextData = { ...uploadedPnlData, [currentMonthKey]: snapshot };
      setUploadedMonths(nextMonths);
      setUploadedPnlData(nextData);
      setViewMode("pnl");
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY_MONTHS, JSON.stringify(nextMonths));
        localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(nextData));
      }
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

  const pnl = useMemo(() => {
    const d: PnlRawData = uploadedPnlData[currentMonthKey] ?? getMonthlyPnlData(currentMonthKey);
    const rev = d.revenue;
    const totalVariable = d.food + d.labor + d.disposables;
    const grossProfit = rev - totalVariable;
    const totalFixed = d.rent + d.insurance + d.utilities + d.loans + d.marketing + d.tech + d.professional + d.repairs + d.misc;
    const netProfit = grossProfit - totalFixed;
    const pct = (x: number) => (rev > 0 ? (x / rev) * 100 : 0);
    return {
      ...d,
      totalVariable,
      grossProfit,
      totalFixed,
      netProfit,
      variablePct: pct(totalVariable),
      gpPct: pct(grossProfit),
      fixedPct: pct(totalFixed),
      netPct: pct(netProfit),
      foodPct: pct(d.food),
      laborPct: pct(d.labor),
      dispPct: pct(d.disposables),
      rentPct: pct(d.rent),
      insurancePct: pct(d.insurance),
      utilitiesPct: pct(d.utilities),
      loansPct: pct(d.loans),
      marketingPct: pct(d.marketing),
      techPct: pct(d.tech),
      professionalPct: pct(d.professional),
      repairsPct: pct(d.repairs),
      miscPct: pct(d.misc),
    };
  }, [currentMonthKey, uploadedPnlData]);

  return (
    <div className="space-y-4 pb-28">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold sm:text-2xl text-white">Actual P&L</h1>
          <FileSpreadsheet className="w-6 h-6 text-slate-500 shrink-0" aria-hidden />
          <EducationInfoIcon metricKey="gp_vs_net_profit" />
        </div>
        <ExportButton
        pageName="Actual P&L"
        getData={() => ({
          headers: ["Month", "Revenue", "Food", "Labor", "Disposables", "Gross Profit", "Rent", "Insurance", "Utilities", "Loans", "Marketing", "Tech", "Professional", "Repairs", "Misc", "Total Fixed", "Net Profit"],
          rows: [[
            monthLabel,
            String(pnl.revenue),
            String(pnl.food),
            String(pnl.labor),
            String(pnl.disposables),
            String(pnl.grossProfit),
            String(pnl.rent),
            String(pnl.insurance),
            String(pnl.utilities),
            String(pnl.loans),
            String(pnl.marketing),
            String(pnl.tech),
            String(pnl.professional),
            String(pnl.repairs),
            String(pnl.misc),
            String(pnl.totalFixed),
            String(pnl.netProfit),
          ]],
        })}
      />
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
              Your GP P&L shows what you control daily — food, labor, disposables. But between Gross Profit and your
              bank account, there&apos;s a gap. Rent. Insurance. Utilities. Loan payments. That gap is your fixed cost
              burden, and most operators don&apos;t see it clearly until tax time.
            </p>
            <p className="text-sm text-slate-300 leading-relaxed">
              Upload your CPA&apos;s monthly financials and PrimeOS maps every line item, calculates your real net
              profit, and shows you exactly where the money goes between Gross Profit and Net Profit.
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
                <span className="text-emerald-400 font-medium">{formatDollars(pnl.revenue)}</span>
              </div>
            </div>
            <div className="p-4 border-b border-slate-700">
              <div className="text-xs text-slate-500 uppercase tracking-wide mb-2">Variable Costs</div>
              <LineItem label="Food & Beverage" amount={formatDollars(pnl.food)} pct={formatPct(pnl.foodPct)} amountColor="red" />
              <LineItem label="Labor" amount={formatDollars(pnl.labor)} pct={formatPct(pnl.laborPct)} amountColor="red" />
              <LineItem label="Disposables & Packaging" amount={formatDollars(pnl.disposables)} pct={formatPct(pnl.dispPct)} amountColor="red" />
              <div className="flex justify-between text-sm font-semibold text-red-400 pt-2 mt-2 border-t border-slate-600">
                <span>Total Variable</span>
                <span>{formatDollars(pnl.totalVariable)} ({formatPct(pnl.variablePct)})</span>
              </div>
            </div>
            <div className="p-4 border-b border-slate-700 bg-emerald-950/20">
              <div className="flex justify-between">
                <span className="text-emerald-400 font-bold">Gross Profit</span>
                <div>
                  <span className="text-emerald-400 font-bold text-lg">{formatDollars(pnl.grossProfit)}</span>
                  <span className="text-xs text-slate-400 ml-2">{formatPct(pnl.gpPct)}</span>
                </div>
              </div>
            </div>
            <div className="p-4 border-b border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs text-slate-500 uppercase tracking-wide">Fixed Costs</div>
                <EducationInfoIcon metricKey="occupancy_pct" size="sm" />
              </div>
              <LineItem label="Rent / Occupancy" amount={formatDollars(pnl.rent)} pct={formatPct(pnl.rentPct)} badge="green" metricKey="occupancy_pct" amountColor="red" />
              <LineItem label="Insurance" amount={formatDollars(pnl.insurance)} pct={formatPct(pnl.insurancePct)} badge="green" metricKey="insurance_pct" amountColor="red" />
              <LineItem label="Utilities" amount={formatDollars(pnl.utilities)} pct={formatPct(pnl.utilitiesPct)} badge="green" metricKey="utilities_pct" amountColor="red" />
              <LineItem label="Loan Payments" amount={formatDollars(pnl.loans)} pct={formatPct(pnl.loansPct)} amountColor="red" />
              <LineItem label="Marketing & Advertising" amount={formatDollars(pnl.marketing)} pct={formatPct(pnl.marketingPct)} amountColor="red" />
              <LineItem label="Technology & Software" amount={formatDollars(pnl.tech)} pct={formatPct(pnl.techPct)} amountColor="red" />
              <LineItem label="Professional Services (CPA, Legal)" amount={formatDollars(pnl.professional)} pct={formatPct(pnl.professionalPct)} amountColor="red" />
              <LineItem label="Repairs & Maintenance" amount={formatDollars(pnl.repairs)} pct={formatPct(pnl.repairsPct)} amountColor="red" />
              <LineItem label="Miscellaneous" amount={formatDollars(pnl.misc)} pct={formatPct(pnl.miscPct)} amountColor="red" />
              <div className="flex justify-between text-sm font-semibold text-red-400 pt-2 mt-2 border-t border-slate-600">
                <span>Total Fixed</span>
                <span>{formatDollars(pnl.totalFixed)} ({formatPct(pnl.fixedPct)})</span>
              </div>
            </div>
            <div className="p-4 bg-slate-700/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-white font-bold text-lg">Net Profit</span>
                  <EducationInfoIcon metricKey="net_profit" size="sm" />
                </div>
                <div>
                  <span className="text-emerald-400 font-bold text-xl">{formatDollars(pnl.netProfit)}</span>
                  <span className="text-xs text-slate-400 ml-2">{formatPct(pnl.netPct)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-amber-950/30 rounded-xl border border-amber-800/50 p-5 mt-4">
            <h3 className="text-base font-bold text-amber-400 mb-4">The Gap — Where Your Money Goes</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-300">Your GP P&L says you made</span>
                <span className="text-lg font-bold text-emerald-400">{formatDollars(pnl.grossProfit)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-300">Your Actual P&L says you kept</span>
                <span className="text-lg font-bold text-emerald-400">{formatDollars(pnl.netProfit)}</span>
              </div>
              <div className="border-t border-amber-800/50 pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-amber-400">The gap (your fixed costs)</span>
                  <span className="text-lg font-bold text-red-400">{formatDollars(pnl.totalFixed)}</span>
                </div>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <p className="text-xs text-amber-200/70">
                That&apos;s {formatPct(pnl.fixedPct)} of every dollar going to costs you don&apos;t see on your daily P&L.
              </p>
              <p className="text-xs text-amber-200/70">
                Biggest chunks: Rent {formatDollars(pnl.rent)} · Utilities {formatDollars(pnl.utilities)} · Loan Payments {formatDollars(pnl.loans)}
              </p>
            </div>
          </div>

          <div className="bg-slate-800 rounded-xl border border-slate-700 p-4 mt-4">
            <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">Fixed Cost Benchmarks</h4>
            <div className="space-y-3">
              <BenchmarkRow
                label="Occupancy (Rent)"
                actual={formatPct(pnl.rentPct)}
                target="≤6%"
                status="green"
                detail={`${formatDollars(pnl.rent)}/mo on ${formatDollars(pnl.revenue)} revenue. You're within target.`}
              />
              <BenchmarkRow
                label="Insurance"
                actual={formatPct(pnl.insurancePct)}
                target="1.5–2.5%"
                status="green"
                detail={`${formatDollars(pnl.insurance)}/mo. Consider shopping insurance at the next renewal (3 quotes is a solid baseline).`}
              />
              <BenchmarkRow
                label="Utilities"
                actual={formatPct(pnl.utilitiesPct)}
                target="3–5%"
                status="green"
                detail={`${formatDollars(pnl.utilities)}/mo. Consider checking walk-in seals, LED lighting, and thermostat schedule.`}
              />
              <BenchmarkRow
                label="Total Fixed"
                actual={formatPct(pnl.fixedPct)}
                target="≤20%"
                status="green"
                detail={`${formatDollars(pnl.totalFixed)}/mo. You're running a tight ship.`}
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
