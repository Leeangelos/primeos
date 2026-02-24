"use client";

import { useState } from "react";
import { FileSpreadsheet, Upload, Check, ChevronDown, HelpCircle } from "lucide-react";
import { formatDollars, formatPct } from "@/src/lib/formatters";
import { EducationInfoIcon } from "@/src/components/education/InfoIcon";
import { SEED_STORES } from "@/src/lib/seed-data";

const GL_CATEGORIES = [
  { range: "4000-4999", label: "Revenue", color: "text-emerald-400" },
  { range: "5000-5499", label: "COGS — Food", color: "text-red-400" },
  { range: "5500-5999", label: "COGS — Beverage", color: "text-red-400" },
  { range: "6000-6499", label: "Labor", color: "text-red-400" },
  { range: "6500-6999", label: "Occupancy", color: "text-amber-400" },
  { range: "7000-7499", label: "Operating Expenses", color: "text-amber-400" },
  { range: "7500-7999", label: "Marketing", color: "text-purple-400" },
  { range: "8000-8499", label: "Administrative", color: "text-blue-400" },
  { range: "8500-8999", label: "Other", color: "text-slate-400" },
];

const SEED_GL_RESULTS = {
  revenue: { label: "Total Revenue", amount: 47600, accounts: ["4100 — Dine-In Sales", "4200 — Takeout Sales", "4300 — Delivery Sales", "4400 — Catering Sales"] },
  food: { label: "COGS — Food", amount: 14280, accounts: ["5100 — Food Purchases", "5150 — Food Waste/Spoilage"] },
  beverage: { label: "COGS — Beverage", amount: 760, accounts: ["5500 — Beverage Purchases"] },
  labor: { label: "Labor", amount: 13328, accounts: ["6100 — Wages — Kitchen", "6200 — Wages — Front", "6300 — Payroll Taxes", "6400 — Workers Comp"] },
  occupancy: { label: "Occupancy", amount: 5590, accounts: ["6500 — Rent", "6600 — Electric", "6700 — Gas", "6800 — Water", "6900 — Property Insurance"] },
  operating: { label: "Operating Expenses", amount: 2680, accounts: ["7100 — Supplies", "7200 — Repairs", "7300 — Equipment Lease", "7400 — Technology/POS"] },
  marketing: { label: "Marketing", amount: 1850, accounts: ["7500 — Online Ads", "7600 — Print/Local", "7700 — Loyalty Program"] },
  admin: { label: "Administrative", amount: 1420, accounts: ["8100 — Office Supplies", "8200 — Legal/Accounting", "8300 — Bank Fees", "8400 — CC Processing Fees"] },
};

const STORE_OPTIONS = SEED_STORES.map((s) => ({ value: s.slug, label: s.name }));

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

type UploadState = "idle" | "uploading" | "mapping" | "complete";

type UnmappedAccount = {
  accountNumber: string;
  description: string;
  amount: number;
  suggestedCategory: string | null;
};

export default function GLUploadPage() {
  const [selectedStore, setSelectedStore] = useState("kent");
  const [selectedMonth, setSelectedMonth] = useState(2);
  const [selectedYear, setSelectedYear] = useState(2026);
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [unmappedAccounts, setUnmappedAccounts] = useState<UnmappedAccount[]>([]);
  const [mappedAccounts, setMappedAccounts] = useState<Record<string, string>>({});
  const [showHelp, setShowHelp] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const totalExpenses =
    SEED_GL_RESULTS.food.amount +
    SEED_GL_RESULTS.beverage.amount +
    SEED_GL_RESULTS.labor.amount +
    SEED_GL_RESULTS.occupancy.amount +
    SEED_GL_RESULTS.operating.amount +
    SEED_GL_RESULTS.marketing.amount +
    SEED_GL_RESULTS.admin.amount;
  const netProfit = SEED_GL_RESULTS.revenue.amount - totalExpenses;
  const netMarginPct = SEED_GL_RESULTS.revenue.amount ? (netProfit / SEED_GL_RESULTS.revenue.amount) * 100 : 0;

  const allMapped = unmappedAccounts.length === 0 || unmappedAccounts.every((acct) => !!mappedAccounts[acct.accountNumber]);

  function simulateUpload() {
    setUploadState("uploading");
    setTimeout(() => {
      setUnmappedAccounts([
        { accountNumber: "6150", description: "Employee Benefits", amount: 840, suggestedCategory: "Labor" },
        { accountNumber: "7450", description: "POS System Fee", amount: 189, suggestedCategory: "Operating Expenses" },
      ]);
      setUploadState("mapping");
    }, 2500);
  }

  function mapAccount(accountNumber: string, category: string) {
    setMappedAccounts((prev) => ({ ...prev, [accountNumber]: category }));
  }

  function finishMapping() {
    setUploadState("complete");
  }

  function toggleCategory(key: string) {
    setExpandedCategory((prev) => (prev === key ? null : key));
  }

  return (
    <div className="space-y-4 pb-28 min-w-0 overflow-x-hidden">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-white">GL Upload</h1>
          <p className="text-xs text-slate-400 mt-0.5">Upload your General Ledger for the cleanest data</p>
        </div>
        <EducationInfoIcon metricKey="gl_upload" />
      </div>

      <div className="flex flex-wrap items-center gap-2">
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
        <label className="text-xs text-slate-500 ml-2">Month:</label>
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(Number(e.target.value))}
          className="dashboard-input rounded-lg border border-slate-600 bg-black/30 px-3 py-2 text-sm text-white focus:border-brand/60 focus:outline-none"
        >
          {MONTHS.map((m, i) => (
            <option key={m} value={i}>
              {m}
            </option>
          ))}
        </select>
        <label className="text-xs text-slate-500">Year:</label>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
          className="dashboard-input rounded-lg border border-slate-600 bg-black/30 px-3 py-2 text-sm text-white focus:border-brand/60 focus:outline-none"
        >
          <option value={2025}>2025</option>
          <option value={2026}>2026</option>
        </select>
      </div>

      <div className="bg-blue-950/30 rounded-xl border border-blue-800/50 p-4 mb-4">
        <div className="flex items-start gap-2">
          <HelpCircle className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-medium text-blue-300 mb-1">What is a General Ledger?</h3>
            <p className="text-xs text-blue-300/70 leading-relaxed">
              A GL is the most detailed financial record your accountant produces. Every transaction, categorized by account number. Uploading your GL gives PrimeOS the cleanest data possible — more accurate than manual entry or P&L uploads.
            </p>
            <p className="text-xs text-blue-300/70 mt-2">
              Ask your accountant or bookkeeper for a monthly GL export. Most accounting software (QuickBooks, Xero, FreshBooks) can export this in 2 clicks.
            </p>
          </div>
        </div>
      </div>

      {uploadState === "idle" && (
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => simulateUpload()}
            className="w-full bg-slate-800 rounded-xl border border-dashed border-slate-600 p-6 text-center hover:border-slate-500 transition-colors"
          >
            <Upload className="w-8 h-8 text-slate-500 mx-auto mb-2" />
            <p className="text-sm text-white font-medium">Upload GL Export</p>
            <p className="text-xs text-slate-500 mt-1">CSV, PDF, or screenshot</p>
          </button>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => simulateUpload()}
              className="bg-slate-800 rounded-xl border border-slate-700 p-3 text-center"
            >
              <FileSpreadsheet className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
              <span className="text-xs text-slate-400">CSV</span>
            </button>
            <button
              type="button"
              onClick={() => simulateUpload()}
              className="bg-slate-800 rounded-xl border border-slate-700 p-3 text-center"
            >
              <FileSpreadsheet className="w-5 h-5 text-red-400 mx-auto mb-1" />
              <span className="text-xs text-slate-400">PDF</span>
            </button>
            <button
              type="button"
              onClick={() => simulateUpload()}
              className="bg-slate-800 rounded-xl border border-slate-700 p-3 text-center"
            >
              <FileSpreadsheet className="w-5 h-5 text-blue-400 mx-auto mb-1" />
              <span className="text-xs text-slate-400">Photo</span>
            </button>
          </div>
        </div>
      )}

      {uploadState === "uploading" && (
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 text-center">
          <div className="w-10 h-10 rounded-full border-2 border-blue-400 border-t-transparent animate-spin mx-auto mb-3" />
          <p className="text-sm text-white font-medium">Reading your General Ledger...</p>
          <p className="text-xs text-slate-500 mt-1">Categorizing accounts and calculating totals</p>
        </div>
      )}

      {uploadState === "mapping" && (
        <div className="space-y-3">
          <div className="bg-amber-600/10 rounded-xl border border-amber-700/30 p-3">
            <p className="text-xs text-amber-300">
              {unmappedAccounts.length} account{unmappedAccounts.length !== 1 ? "s" : ""} couldn&apos;t be auto-categorized. Select a category for each — PrimeOS will remember your mapping.
            </p>
          </div>

          {unmappedAccounts.map((acct) => (
            <div key={acct.accountNumber} className="bg-slate-800 rounded-xl border border-slate-700 p-3">
              <div className="text-sm text-white mb-1">Account {acct.accountNumber}</div>
              <div className="text-xs text-slate-500 mb-2">
                {acct.description} — {formatDollars(acct.amount)}
              </div>
              <select
                value={mappedAccounts[acct.accountNumber] ?? ""}
                onChange={(e) => mapAccount(acct.accountNumber, e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-xl text-xs text-white h-10 px-3"
              >
                <option value="">Select category...</option>
                {GL_CATEGORIES.map((cat) => (
                  <option key={cat.label} value={cat.label}>
                    {cat.label} ({cat.range})
                  </option>
                ))}
              </select>
            </div>
          ))}

          <button
            type="button"
            onClick={finishMapping}
            disabled={!allMapped}
            className="w-full py-3 rounded-xl bg-[#E65100] text-white text-sm font-semibold disabled:bg-slate-700 disabled:text-slate-500"
          >
            Continue
          </button>
        </div>
      )}

      {uploadState === "complete" && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-3">
            <Check className="w-5 h-5 text-emerald-400" />
            <span className="text-sm font-medium text-emerald-400">
              GL processed successfully — {Object.values(SEED_GL_RESULTS).reduce((sum, c) => sum + c.accounts.length, 0)} accounts mapped
            </span>
          </div>

          {Object.entries(SEED_GL_RESULTS).map(([key, cat]) => (
            <div key={key} className="bg-slate-800 rounded-xl border border-slate-700 p-3">
              <button
                type="button"
                onClick={() => toggleCategory(key)}
                className="w-full flex items-center justify-between"
              >
                <span className="text-sm text-white font-medium">{cat.label}</span>
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-medium ${key === "revenue" ? "text-emerald-400" : "text-red-400"}`}>
                    {formatDollars(cat.amount)}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${expandedCategory === key ? "rotate-180" : ""}`} />
                </div>
              </button>
              {expandedCategory === key && (
                <div className="mt-2 pt-2 border-t border-slate-700 space-y-1">
                  {cat.accounts.map((acct) => (
                    <div key={acct} className="text-xs text-slate-400 py-0.5">
                      {acct}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          <div className="bg-slate-700/50 rounded-xl p-4 mt-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-slate-500">Total Revenue</div>
                <div className="text-lg text-emerald-400 font-bold">{formatDollars(SEED_GL_RESULTS.revenue.amount)}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Total Expenses</div>
                <div className="text-lg text-red-400 font-bold">{formatDollars(totalExpenses)}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Net Profit</div>
                <div className="text-lg text-white font-bold">{formatDollars(netProfit)}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Net Margin</div>
                <div
                  className={`text-lg font-bold ${netMarginPct > 10 ? "text-emerald-400" : netMarginPct > 5 ? "text-amber-400" : "text-red-400"}`}
                >
                  {formatPct(netMarginPct)}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-blue-950/30 rounded-xl border border-blue-800/50 p-3 mt-3">
            <h4 className="text-xs text-blue-400 font-medium mb-2">This GL data now feeds into:</h4>
            <div className="space-y-1.5 text-xs text-blue-300/70">
              <p>→ Actual P&L (more accurate than manual upload)</p>
              <p>→ Vendor Tracker (matches GL line items to vendors)</p>
              <p>→ Food Cost Analysis (actual cost from GL food accounts)</p>
              <p>→ Occupancy Tracker (rent and utilities from GL)</p>
              <p>→ CC Processing Tracker (fees from GL admin accounts)</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
