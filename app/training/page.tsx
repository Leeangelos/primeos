"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

function CollapsibleSection({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 mb-3 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex justify-between items-center p-4 text-left"
      >
        <span className="text-base font-semibold text-white">{title}</span>
        <ChevronDown
          className={cn("w-5 h-5 shrink-0 text-slate-400 transition-transform", open && "rotate-180")}
          aria-hidden
        />
      </button>
      {open && <div className="px-4 pb-4 text-sm text-slate-300 leading-relaxed">{children}</div>}
    </div>
  );
}

const BENCHMARKS: { metric: string; target: string; red: string }[] = [
  { metric: "Food Cost %", target: "28–31%", red: ">33%" },
  { metric: "Labor %", target: "19–21%", red: ">24%" },
  { metric: "PRIME Cost %", target: "≤55%", red: ">58%" },
  { metric: "SLPH", target: "≥$65", red: "<$55" },
  { metric: "Average Ticket", target: "Track trend", red: ">10% decline WoW" },
  { metric: "Void %", target: "<1%", red: ">2%" },
  { metric: "Waste %", target: "<3%", red: ">5%" },
  { metric: "Gross Profit %", target: "38–42%", red: "<35%" },
  { metric: "Employee Churn", target: "<15%/quarter", red: ">25%/quarter" },
  { metric: "Marketing ROAS", target: "3–5x", red: "<2x" },
  { metric: "Occupancy", target: "≤6% of revenue", red: ">8%" },
  { metric: "Insurance", target: "1.5–2.5% of revenue", red: ">3%" },
  { metric: "Utilities", target: "3–5% of revenue", red: ">6%" },
];

export default function TrainingPage() {
  return (
    <div className="space-y-2 pb-28">
      <div className="mb-6">
        <h1 className="text-lg font-semibold sm:text-2xl text-white">Training Guide</h1>
        <p className="text-sm text-slate-400 mt-1">Everything you need to run your numbers in 90 seconds a day.</p>
      </div>

      <CollapsibleSection title="Add PrimeOS to Your Phone" defaultOpen={true}>
        <p className="text-sm text-slate-300 leading-relaxed mb-4">
          PrimeOS works best when it&apos;s one tap away on your home screen — just like any other app. No app store needed.
        </p>

        <div className="bg-slate-700/50 rounded-lg p-4 mb-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-base">🍎</span>
            <h4 className="text-sm font-semibold text-white">iPhone (iOS Safari)</h4>
          </div>
          <ol className="space-y-2 text-sm text-slate-300 ml-1">
            <li className="flex items-start gap-2">
              <span className="text-xs text-slate-500 font-mono mt-0.5">1.</span>
              <span>Open <span className="text-white font-medium">primeos-nine.vercel.app</span> in Safari (not Chrome)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-xs text-slate-500 font-mono mt-0.5">2.</span>
              <span>Tap the <span className="text-white font-medium">Share button</span> (square with arrow at the bottom of the screen)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-xs text-slate-500 font-mono mt-0.5">3.</span>
              <span>Scroll down and tap <span className="text-white font-medium">Add to Home Screen</span></span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-xs text-slate-500 font-mono mt-0.5">4.</span>
              <span>Tap <span className="text-white font-medium">Add</span> in the top right</span>
            </li>
          </ol>
          <p className="text-xs text-slate-500 mt-2">PrimeOS will appear on your home screen with the pizza icon. Opens full screen, no browser bar.</p>
        </div>

        <div className="bg-slate-700/50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-base">🤖</span>
            <h4 className="text-sm font-semibold text-white">Android (Chrome)</h4>
          </div>
          <ol className="space-y-2 text-sm text-slate-300 ml-1">
            <li className="flex items-start gap-2">
              <span className="text-xs text-slate-500 font-mono mt-0.5">1.</span>
              <span>Open <span className="text-white font-medium">primeos-nine.vercel.app</span> in Chrome</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-xs text-slate-500 font-mono mt-0.5">2.</span>
              <span>Tap the <span className="text-white font-medium">three-dot menu</span> (top right)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-xs text-slate-500 font-mono mt-0.5">3.</span>
              <span>Tap <span className="text-white font-medium">Add to Home screen</span></span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-xs text-slate-500 font-mono mt-0.5">4.</span>
              <span>Tap <span className="text-white font-medium">Add</span></span>
            </li>
          </ol>
          <p className="text-xs text-slate-500 mt-2">PrimeOS will appear on your home screen. Opens like a native app.</p>
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Welcome to PrimeOS" defaultOpen={false}>
        <p className="mb-3">
          PrimeOS is the operating system for independent pizzeria operators. One app, every number, plain English, 90 seconds a day.
        </p>
        <p className="mb-3">
          Built by an operator with 14 years behind the line — not by a software company guessing what you need. Every screen shows your numbers, teaches what they mean, and offers practical playbooks to consider when something goes red.
        </p>
        <p className="mb-0">
          Your daily routine: Open the app. Enter your numbers. Read your grade. Look for red. Use the playbook when needed. That&apos;s it. 90 seconds — then get back to running your shop.
        </p>
      </CollapsibleSection>

      <CollapsibleSection title="The Three Layers">
        <div className="bg-slate-700/50 rounded-lg p-3 mb-2">
          <div className="font-medium text-white mb-1">Layer 1 — The Numbers:</div>
          <p className="mb-0">
            Every metric is color-coded and graded. Green means you&apos;re on target. Yellow means you&apos;re close to the edge. Red means something needs attention right now. You see your grade before you see the number — so you know instantly where to focus.
          </p>
        </div>
        <div className="bg-slate-700/50 rounded-lg p-3 mb-2">
          <div className="font-medium text-white mb-1">Layer 2 — The Education:</div>
          <p className="mb-0">
            Tap the (i) icon next to any metric. A panel slides up explaining what the number means, how it&apos;s calculated, and why it matters. Written in plain English by an operator, not a textbook. Example: &apos;Food Cost 34.2% means for every dollar of sales, you&apos;re spending 34.2 cents on food. Target is 28–31 cents. You&apos;re 3 cents over on every dollar — that&apos;s $150/day on $5,000 in sales.&apos;
          </p>
        </div>
        <div className="bg-slate-700/50 rounded-lg p-3 mb-0">
          <div className="font-medium text-white mb-1">Layer 3 — The Playbook:</div>
          <p className="mb-0">
            When a number goes red, PrimeOS doesn&apos;t just tell you it&apos;s bad — it outlines what operators typically check next. Step-by-step. Pizza-specific. Written by someone who&apos;s actually worked through these problems at 11pm on a Friday. Every red number has a playbook. Every playbook has been tested in a real pizzeria.
          </p>
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Your Daily Workflow">
        <div className="flex gap-3 mb-3">
          <span className="shrink-0 w-6 h-6 rounded-full bg-blue-500/30 text-blue-400 flex items-center justify-center text-xs font-semibold">1</span>
          <p className="mb-0">
            Open PrimeOS. Consider checking your Morning Brief — AI already read yesterday&apos;s numbers and wrote you a summary.
          </p>
        </div>
        <div className="flex gap-3 mb-3">
          <span className="shrink-0 w-6 h-6 rounded-full bg-blue-500/30 text-blue-400 flex items-center justify-center text-xs font-semibold">2</span>
          <p className="mb-0">
            Enter today&apos;s numbers. Total sales, food purchases, labor cost, disposables, transactions, hours worked. Six fields. Takes 60 seconds.
          </p>
        </div>
        <div className="flex gap-3 mb-3">
          <span className="shrink-0 w-6 h-6 rounded-full bg-blue-500/30 text-blue-400 flex items-center justify-center text-xs font-semibold">3</span>
          <p className="mb-0">
            Read your grades. Food Cost, Labor, PRIME, SLPH, Average Ticket — all calculated and graded instantly.
          </p>
        </div>
        <div className="flex gap-3 mb-3">
          <span className="shrink-0 w-6 h-6 rounded-full bg-blue-500/30 text-blue-400 flex items-center justify-center text-xs font-semibold">4</span>
          <p className="mb-0">
            Look for red. If everything is green, you&apos;re done — get back to running your shop.
          </p>
        </div>
        <div className="flex gap-3 mb-0">
          <span className="shrink-0 w-6 h-6 rounded-full bg-blue-500/30 text-blue-400 flex items-center justify-center text-xs font-semibold">5</span>
          <p className="mb-0">
            If something is red, tap it. Read the playbook. Work through the steps. A common approach is one specific lever — a portioning issue, an overtime shift, a vendor price hike.
          </p>
        </div>
        <p className="mt-3 mb-0">
          That&apos;s it. 90 seconds. Every day. The operators who do this daily catch problems before they cost thousands.
        </p>
      </CollapsibleSection>

      <CollapsibleSection title="KPI Dictionary">
        {[
          {
            name: "Food Cost %",
            def: "Total Food Purchases ÷ Total Sales × 100. How much of every dollar goes to food. Target: 28–31%. Every point over target on $5,000/day = $50/day = $1,500/month = $18,000/year.",
          },
          {
            name: "Labor %",
            def: "Total Labor Cost ÷ Total Sales × 100. How much of every dollar goes to wages. Target: 19–21% (no overtime). Includes hourly wages, not salary or benefits.",
          },
          {
            name: "PRIME Cost %",
            def: "Food + Disposables + Labor ÷ Total Sales × 100. The three costs you control daily. Target: ≤55%. If PRIME is 60% and fixed costs are 30%, Net Profit is 10%. Drop PRIME to 55%, Net Profit doubles to 15%.",
          },
          {
            name: "SLPH (Sales per Labor Hour)",
            def: "Total Sales ÷ Total Labor Hours. How productive is every hour you're paying for. Target: ≥$65. Below $55 = overstaffed. Above $80 = understaffed and burning out your team.",
          },
          {
            name: "Average Ticket",
            def: "Total Sales ÷ Total Transactions. How much each customer spends. Low ticket = upsell training needed. Track this weekly — if it drops, your team stopped suggesting add-ons.",
          },
          {
            name: "Void %",
            def: "Total Voids ÷ Total Sales × 100. Voided orders as a percentage of sales. Target: <1%. Above 2% = either training issue or theft. Check void reasons and who's voiding.",
          },
          {
            name: "Waste %",
            def: "Total Waste ÷ Total Food Purchases × 100. Food thrown away vs food bought. Target: <3%. Track by category — dough waste, prepped ingredients past shelf life, dropped/remade orders.",
          },
          {
            name: "Gross Profit %",
            def: "Revenue minus COGS, Labor, and Disposables. What's left from the money you control. This is NOT your take-home — fixed costs haven't been subtracted yet.",
          },
          {
            name: "Employee CAC",
            def: "Cost to Acquire (hire) one employee. Indeed post + manager interview hours + training hours + uniform + onboarding paperwork. Average pizzeria: $2,800–$4,200 per hire. At 8 replacements/year = $22K–$34K in hidden cost.",
          },
          {
            name: "Employee LTV",
            def: "Lifetime Value of an employee. Revenue generated during their tenure minus their total cost. High-tenure employees have dramatically higher LTV because training cost is amortized and productivity peaks at 6+ months.",
          },
          {
            name: "Churn Rate",
            def: "Employees who leave ÷ Total headcount per quarter. Target: <15% quarterly. Above 25% = crisis. Every departure costs $2,800–$4,200 to replace plus the productivity loss during training.",
          },
          {
            name: "Marketing ROAS",
            def: "Return on Ad Spend. Revenue attributed to a campaign ÷ cost of the campaign. Target: 3–5x. Below 2x = the campaign is losing money after food and labor costs.",
          },
          {
            name: "AOV (Average Order Value)",
            def: "Same as Average Ticket. Total Revenue ÷ Number of Orders. Used more in digital/delivery context. Track separately for dine-in, pickup, and delivery — they'll be very different.",
          },
          {
            name: "Occupancy %",
            def: "Rent ÷ Total Revenue × 100. What percentage of your sales goes to rent. Target: ≤6%. At 8% on $40K/month revenue, you're paying $3,200 for a space that should cost $2,400 at your volume — or you need to grow sales to $53,333/month to hit 6%.",
          },
        ].map(({ name, def }) => (
          <div key={name} className="bg-slate-700/50 rounded-lg p-3 mb-2">
            <div className="font-medium text-white mb-1">{name}</div>
            <p className="mb-0 text-slate-300">{def}</p>
          </div>
        ))}
      </CollapsibleSection>

      <CollapsibleSection title="KPI Benchmarks">
        <div className="space-y-2">
          {BENCHMARKS.map((row) => (
            <div key={row.metric} className="bg-slate-700/50 rounded-lg p-3 flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="font-medium text-white">{row.metric}</span>
              <span className="text-slate-400">|</span>
              <span className="text-emerald-400">{row.target}</span>
              <span className="text-slate-400">|</span>
              <span className="text-red-400">{row.red}</span>
            </div>
          ))}
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Red Number Playbooks">
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-red-400/90 mb-2">When Food Cost Goes RED (&gt;33%)</h4>
            <ol className="list-decimal list-inside space-y-1">
              <li>Consider checking last 3 vendor deliveries for price increases</li>
              <li>Consider weighing 10 cheese portions on 16-inch pies vs recipe spec</li>
              <li>Consider running a 48-hour waste log</li>
              <li>Consider comparing theoretical vs actual on top 5 items</li>
              <li>Consider checking for vendor substitutions</li>
            </ol>
          </div>
          <div>
            <h4 className="font-medium text-red-400/90 mb-2">When Labor Goes RED (&gt;24%)</h4>
            <ol className="list-decimal list-inside space-y-1">
              <li>Consider comparing scheduled vs actual clock-in/out</li>
              <li>Consider checking shift overlaps</li>
              <li>Consider reviewing SLPH — below $55 = overstaffed</li>
              <li>Consider checking last 4 same weekdays — pattern or one-off?</li>
              <li>Consider reviewing overtime — one OT shift can blow the whole week</li>
            </ol>
          </div>
          <div>
            <h4 className="font-medium text-red-400/90 mb-2">When PRIME Goes RED (&gt;58%)</h4>
            <ol className="list-decimal list-inside space-y-1">
              <li>Consider identifying which component is driving it — food or labor</li>
              <li>If both are yellow, the combination pushes PRIME red — many operators address the worse one first</li>
              <li>Consider checking disposables — cups, boxes, bags add up fast if uncontrolled</li>
              <li>Consider running the food cost playbook AND labor playbook in parallel</li>
              <li>Consider setting a 7-day checkpoint to verify PRIME is trending back</li>
            </ol>
          </div>
          <div>
            <h4 className="font-medium text-red-400/90 mb-2">When Churn Goes RED (&gt;25% quarterly)</h4>
            <ol className="list-decimal list-inside space-y-1">
              <li>Consider pulling exit reasons for last 90 days</li>
              <li>Consider comparing churn by location — is one store worse?</li>
              <li>Consider reviewing scheduling fairness — are some people getting all the bad shifts?</li>
              <li>Consider calculating the cost: number of exits × $3,500 average replacement cost. Show managers that number.</li>
              <li>Consider implementing 30-day check-ins with every new hire — most quits happen in the first 30 days</li>
            </ol>
          </div>
          <div>
            <h4 className="font-medium text-red-400/90 mb-2">When ROAS Goes RED (&lt;2x)</h4>
            <ol className="list-decimal list-inside space-y-1">
              <li>Consider checking targeting — are you reaching the right zip codes?</li>
              <li>Consider checking creative — when did you last update the ad image or offer?</li>
              <li>Consider checking attribution — are orders coming from the ad but not being tracked?</li>
              <li>Consider comparing cost per acquisition across platforms — consider pausing the worst performer</li>
              <li>Consider testing a referral program instead — existing customers convert 3x better than cold ads</li>
            </ol>
          </div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="How to Read Your Weekly Snapshot">
        <p className="mb-3">
          The Weekly Snapshot shows this week vs last week for every KPI. Three columns: This Week, Last Week, Change.
        </p>
        <p className="mb-3">
          Green change = improving. Red change = getting worse. The direction matters more than the absolute number — a food cost of 31% that was 34% last week is a win, even though 31% is still yellow.
        </p>
        <p className="mb-0">
          Consider focusing on the red arrows first. If food cost went up and labor went up, consider checking if it was the same day — a big sales day can push both up temporarily. Look at the 4-week trend before reacting to one week.
        </p>
      </CollapsibleSection>

      <CollapsibleSection title="How to Read Your GP P&L">
        <p className="mb-3">
          Your GP P&L (Gross Profit & Loss) shows the money you control daily: Revenue minus Food, Labor, and Disposables.
        </p>
        <p className="mb-3">
          Revenue at the top. Subtract COGS (food + disposables). Subtract Labor. What&apos;s left is Gross Profit.
        </p>
        <p className="mb-3">
          GP is NOT your take-home pay. Rent, insurance, utilities, loan payments, and other fixed costs still come out. That&apos;s what the Actual P&L shows.
        </p>
        <p className="mb-0">
          If GP is 38% and your fixed costs are 28% of revenue, your Net Profit is 10%. Every point you improve GP drops straight to Net Profit.
        </p>
      </CollapsibleSection>

      <CollapsibleSection title="How to Read Your Actual P&L">
        <div className="rounded-lg border border-blue-900/50 bg-blue-950/30 p-4">
          <p className="mb-3">
            Coming in Phase 2. Upload your CPA&apos;s monthly financials and PrimeOS will show you the gap between your GP P&L and your actual Net Profit.
          </p>
          <p className="mb-0">
            The gap is your fixed cost burden — rent, insurance, utilities, loans, misc. Most operators never see this number clearly until it&apos;s too late.
          </p>
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="The Morning Brief">
        <p className="mb-3">
          Every morning, PrimeOS AI reads yesterday&apos;s numbers and writes you a plain-English summary. No jargon. No charts to interpret. Just: here&apos;s what happened, here&apos;s what&apos;s good, here&apos;s what needs attention, and here&apos;s what&apos;s coming up.
        </p>
        <p className="mb-3">
          The Brief pulls from your daily KPIs, weekly trends, employee data, and local events (planned). It&apos;s like having a business partner who reviewed everything before you woke up.
        </p>
        <p className="mb-0">
          How to use it: Read it with your coffee. If it flags something red, consider going to that page and using the playbook. If everything is green, you just saved yourself 20 minutes of spreadsheet scanning.
        </p>
      </CollapsibleSection>

      <footer className="text-xs text-slate-500 text-center py-4 pt-6">
        © 2026 Ambition & Legacy LLC. All rights reserved.
      </footer>
    </div>
  );
}
