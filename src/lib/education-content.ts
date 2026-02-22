/**
 * Education engine — Layer 2 (what it means) and Layer 3 (when red playbook) for every KPI.
 * Single source of truth for in-app education. No placeholders.
 */

export type EducationEntry = {
  title: string;
  whatItMeans: string;
  whenRedPlaybook: string[];
};

export const EDUCATION_CONTENT: Record<string, EducationEntry> = {
  food_cost: {
    title: "Food Cost %",
    whatItMeans:
      "Total Food Purchases ÷ Total Sales × 100. On $5,000/day in sales, every single point above your target costs you $50 per day — that's $1,500 per month and $18,000 per year walking out the door. Target range: 28–31%. Above 33% is red — something is wrong and it's costing you real money.",
    whenRedPlaybook: [
      "Check last 3 vendor deliveries for price increases — suppliers raise prices quietly",
      "Weigh 10 cheese portions on 16-inch pies against your recipe spec — this is where most waste hides",
      "Run a 48-hour waste log — track every tossed pizza, dropped order, and remake",
      "Compare theoretical food cost vs actual on your top 5 selling items",
      "Check for vendor substitutions — different brand, different yield, different cost",
    ],
  },

  labor_pct: {
    title: "Labor %",
    whatItMeans:
      "Total Labor Dollars ÷ Net Sales × 100. Your biggest controllable cost. Target: 19–21% for full-service, 18–20% for QSR. On $5K/day, every point over target is $50/day — $1,500/month. Labor creeps when you overstaff slow days, don't cut when sales drop, or carry too many managers on the clock.",
    whenRedPlaybook: [
      "Compare scheduled hours to sales by day-part — cut overlap where sales don't justify it",
      "Audit manager hours: are they on the floor or in the office? Every manager hour must earn its keep",
      "Check start times vs first ticket — if you're open at 11, why is labor clocked at 9?",
      "Run a week of actual vs theoretical labor (sales ÷ target labor %) — gap = overstaff or overtime",
      "Review break compliance and punch edits — off-the-clock work and missed punches distort the number",
    ],
  },

  prime_cost: {
    title: "Prime Cost %",
    whatItMeans:
      "Labor % + Food Cost % (sometimes includes disposables). The number that decides whether you make money. Target: 55–58%. Above 60% and you're giving back profit. Every point over 55% on a $50K week is about $500 left on the table. Prime is the lever you control — portioning, scheduling, waste, and purchasing.",
    whenRedPlaybook: [
      "Identify which leg is high — labor or food — and attack that first; don't spread effort thin",
      "Lock in a 2-week schedule at target labor % and don't add shifts without a sales spike",
      "Run theoretical vs actual food cost on top 10 items — biggest gaps are waste or over-portioning",
      "Compare prime by day of week — one bad day can drag the week; fix the pattern",
      "If both labor and food are red, fix labor first — it's usually the faster win",
    ],
  },

  slph: {
    title: "Sales per Labor Hour",
    whatItMeans:
      "Net Sales ÷ Total Labor Hours. How much revenue each labor hour produces. Target: $65–$85+ depending on concept. Below $60 and you're either overstaffed or under-selling. SLPH tells you if your labor is productive — same hours with higher SLPH means better deployment or stronger sales, not more bodies.",
    whenRedPlaybook: [
      "Map labor hours to day-parts — find the hours where SLPH collapses and trim or redeploy",
      "Check if slow days have the same headcount as busy days — spread labor to match demand",
      "Verify labor hours are clocked correctly — missed punches and ghost hours kill SLPH",
      "Compare SLPH by day of week — Tuesday at $48 and Saturday at $92 means Tuesday is overstaffed",
      "Drive check average during weak day-parts before adding labor — sometimes the fix is revenue, not cuts",
    ],
  },

  labor_optimization: {
    title: "Labor & Schedule Optimization",
    whatItMeans:
      "Every shift is a financial decision. Labor optimization means right-sizing staff to demand: match scheduled hours to projected sales so labor % stays on target (e.g. ≤21%) and SLPH stays strong ($65–$85+). Build the schedule around day-part demand, reduce overlap (especially closer/driver), and use projected sales by day-of-week so you see the impact before the week starts — not after.",
    whenRedPlaybook: [
      "Compare scheduled hours to sales by day-part — cut overlap where sales don't justify it",
      "Check start times vs first ticket — if you're open at 11, labor at 9 may be waste",
      "Do you need both a mid-shift and a closer? One 10–close might be cheaper",
      "Build SLPH targets by day of week; Mon/Tue need different staffing than Fri/Sat",
      "Review projected labor % before publishing — trim one shift and see the impact",
    ],
  },

  ticket_avg: {
    title: "Average Ticket",
    whatItMeans:
      "Total Sales ÷ Transaction Count. How much each customer spends per visit. Every $1 increase on 500 transactions/day is $500/day — $15K/month. Ticket is driven by mix (premium vs value), add-ons (sides, drinks, desserts), and size (large vs medium). It's the easiest lever that doesn't require more traffic.",
    whenRedPlaybook: [
      "Run mix report: what % of orders are premium vs value? Shift mix with boards and training",
      "Check add-on attach rate — drinks, sides, desserts; one more add-on per ticket moves the needle",
      "Audit size mix — are you defaulting to medium? Large and family sizes carry margin",
      "Review discounts and comps — every comp is a full ticket loss; tighten approval and track reasons",
      "Test limited-time offers and bundles — one strong LTO can lift ticket for the whole period",
    ],
  },

  transaction_count: {
    title: "Transaction Count",
    whatItMeans:
      "Number of customer transactions (checks or orders) in the period. Traffic. It's the top of the funnel — no transactions, no sales. Compare to same day last week and last year. Transaction count plus average ticket equals sales; if sales are flat, you need to know whether it's traffic or ticket (or both) that's off.",
    whenRedPlaybook: [
      "Compare transactions by day-part — which day-part dropped? That's where to look (operations, marketing, or competition)",
      "Check for POS or integration errors — double rings, voided orders, or missed channels can undercount",
      "Compare to last year same period — are you losing traffic to a new competitor or a closed road?",
      "If ticket is up but transactions are down, you may have priced out frequency — watch retention",
      "Correlate with marketing and promotions — did a pullback in ads or offers coincide with the drop?",
    ],
  },

  cogs: {
    title: "Cost of Goods Sold",
    whatItMeans:
      "Total cost of food, beverage, and packaging used to produce what you sold. COGS ÷ Sales = food cost %. COGS goes up with higher prices from vendors, waste, over-portioning, or theft. It's the direct cost of putting product on the plate. Track it weekly — by the time the accountant tells you, the month is gone.",
    whenRedPlaybook: [
      "Compare COGS to receiving and invoices — are you paying for more than you're ringing?",
      "Reconcile inventory: beginning + purchases − ending should match COGS; big variance = waste or shrink",
      "Break COGS by category (dairy, meat, produce, dry) — which category spiked?",
      "Check portioning on top 5 items — one over-portioned item can move COGS a full point",
      "Audit comps, staff meals, and giveaways — they're in COGS but not in sales; track them separately",
    ],
  },

  gross_profit: {
    title: "Gross Profit",
    whatItMeans:
      "Sales minus COGS. What's left after the cost of the product. Gross profit pays for labor, rent, and everything else. Gross margin (gross profit ÷ sales) should be 65–70%+ in pizza. If gross profit drops, either sales dropped or COGS rose — or both. This is the first line of defense before fixed costs.",
    whenRedPlaybook: [
      "Separate the impact: did sales fall or COGS rise? Fix the right lever",
      "If COGS rose, run the food cost and COGS playbooks — vendor prices, waste, portioning",
      "If sales fell, look at transaction count and ticket — traffic, mix, or pricing",
      "Compare gross profit by store or day-part — one weak segment can drag the whole number",
      "Lock in food cost and then push ticket and traffic — gross profit grows from both sides",
    ],
  },

  daily_sales: {
    title: "Daily Sales",
    whatItMeans:
      "Total net sales for the day. The top line. Daily sales drive everything — labor targets, food cost targets, and whether you make money. Compare to same day last week and last year. One bad day is a blip; a pattern of down days is a trend. Track the number, then break it into transactions and ticket to know why it moved.",
    whenRedPlaybook: [
      "Break daily sales into transactions × ticket — which one dropped? That's your focus",
      "Compare to weather, events, and holidays — external factors explain some variance",
      "Check for POS or reporting errors — missing channels, wrong date range, or failed sync",
      "If multiple days in a row are down, look at operations (speed, quality) and marketing (visibility)",
      "Use last year same day as baseline — are you gaining or losing share of wallet and traffic?",
    ],
  },

  employee_cac: {
    title: "Employee CAC",
    whatItMeans:
      "Cost to Acquire (hire) an Employee: job posts, manager time interviewing, training, uniforms, and onboarding. Average pizzeria: $2,800–$4,200 per hire. 8 replacements/year = $22K–$34K hidden cost. CAC is why retention pays — one hire that stays 2 years is worth two that quit in 6 months.",
    whenRedPlaybook: [
      "Track CAC by source — which channel (Indeed, referral, walk-in) gives you keepers? Double down there",
      "Reduce time-to-fill and time-to-productivity — faster onboarding cuts effective CAC",
      "Audit manager hours spent on hiring — streamline interviews and use scorecards",
      "Invest in training so new hires ramp faster — same CAC, higher yield",
      "If CAC is climbing, fix turnover first — fewer open roles means less spend on recruiting",
    ],
  },

  employee_ltv: {
    title: "Employee LTV",
    whatItMeans:
      "Employee Lifetime Value — the productivity and value an employee generates over their tenure. A $14/hr employee who stays 18 months and generates $80/hr in SLPH has an LTV of ~$35,000 in productivity. One who quits at 3 months: ~$5,800. LTV must be higher than CAC or you lose money on every hire. A $0.50/hr raise that keeps someone 6 months longer often pays for itself in lower turnover cost.",
    whenRedPlaybook: [
      "Calculate LTV by role and tenure — which roles and tenures are profitable? Hire and retain for those",
      "Improve training and support so new hires reach full productivity faster — raises LTV",
      "Address exit reasons — scheduling, pay, management — so tenure extends and LTV grows",
      "Use 30- and 90-day check-ins to catch flight risk early; one saved hire saves full CAC",
      "If LTV is below CAC, either reduce CAC (faster hire, cheaper source) or extend tenure (retention)",
    ],
  },

  churn_rate: {
    title: "Employee Churn Rate",
    whatItMeans:
      "Percentage of employees who leave in a period (e.g. 90 days). Churn rate = (exits ÷ average headcount) × 100. Above 25% quarterly is red — you're bleeding talent and money. Every exit costs $2,800–$4,200 to replace. High churn means constant recruiting, constant training, and weaker operations. Fix churn before scaling hiring.",
    whenRedPlaybook: [
      "Pull exit reasons for last 90 days — group by scheduling, pay, management, personal; attack the biggest bucket",
      "Compare churn by location — if one store is high, it's usually management or culture",
      "Review scheduling fairness — same people always getting bad shifts? That drives quits",
      "Calculate cost: exits × $3,500 avg replacement; show that number to managers and owners",
      "Implement 30-day check-ins with new hires — most turnover happens in first 60 days; catch it early",
    ],
  },

  marketing_roas: {
    title: "Marketing ROAS",
    whatItMeans:
      "Return on Ad Spend. Revenue attributed to ads ÷ Ad Spend. If you spend $500 on Meta and attribute $2,500 in revenue, ROAS = 5x. For pizza, 3x+ is strong; 1–3x is okay; below 1x you're losing money. ROAS tells you which channels and campaigns earn their keep. Blended ROAS across all spend is your overall marketing efficiency.",
    whenRedPlaybook: [
      "Pause or cut spend on campaigns or channels below 1x ROAS immediately — they're costing money",
      "Break ROAS by campaign and creative — double down on what works, kill what doesn't",
      "Check attribution — are you counting first-touch, last-touch, or blended? Be consistent",
      "Compare ROAS to LTV/CAC — if CAC from ads is too high, improve offer or targeting",
      "Test one variable at a time (audience, creative, offer) so you know what moved the number",
    ],
  },

  inventory_par: {
    title: "Par Levels & Inventory",
    whatItMeans:
      "Par is the target quantity you want on hand — enough to get through to the next order without running out. Below 25% of par = Low (yellow); zero = Out (red). Tracking inventory weekly catches waste, overportioning, and theft. Beginning + Purchases − Ending = Actual Usage. Compare to theoretical usage from recipes; the gap is money walking out the door.",
    whenRedPlaybook: [
      "Count weekly — Monday before deliveries is ideal; walk-in is at its lowest",
      "Identify items with the biggest dollar variance and check portioning first",
      "Review waste logs and unrecorded comps or staff meals",
      "Compare variance across locations — one store off points to process or theft",
    ],
  },

  invoice_scanning: {
    title: "Invoice Scanning",
    whatItMeans:
      "Snap a photo of any vendor invoice. AI extracts every line item — product names, quantities, unit prices, totals. You review and approve. No manual data entry. Most operators don't track individual product prices because it's tedious; when cheese goes up $0.40/lb you don't notice until month-end when food cost is 3 points over. Invoice scanning catches price changes the day they happen. Approved invoices can update ingredient costs in Recipe Cards so theoretical food cost stays accurate.",
    whenRedPlaybook: [
      "If you're not scanning invoices, you're flying blind on vendor price changes",
      "Reconcile scanned totals to actual payments — catch duplicate or wrong charges",
      "Use line-item data to re-bid: compare unit prices across vendors and negotiate",
      "Flag invoices that don't match PO or delivery — catch short shipments and billing errors",
    ],
  },

  party_orders: {
    title: "Party Order Margins & Upsell",
    whatItMeans:
      "Party and catering orders are prepaid, predictable, and bulk-prepped — typically 15–20% higher margin than walk-in. You prep efficiently, staff precisely, and avoid waste. A shop doing 4 parties per weekend at $400 avg = $6,400/month in premium revenue. Upsell strategy: always quote a package (e.g. pizza + wings + drinks) first; add-ons like salads, desserts, and premium toppings lift the ticket. Require a deposit (e.g. 25–50%) to lock the date; balance due on pickup or delivery. Track repeat party customers — they're your best referral source.",
    whenRedPlaybook: [
      "Check: do customers know you do parties? Add it to menu, bags, and social.",
      "Review pricing vs other catering options; make ordering dead simple (one form, one call).",
      "Follow up on every completed party for a review and referral.",
      "Track repeat party customers and margin by order size.",
    ],
  },

  task_management: {
    title: "Task Completion Rate",
    whatItMeans:
      "Task completion rate measures what percentage of assigned tasks get done on time. In a pizzeria, dropped tasks cascade — a missed food order means 86'd items Friday night, a missed repair call means the walk-in dies Saturday morning. Tracking completion turns chaos into accountability.",
    whenRedPlaybook: [
      "Check if tasks have clear owners — unassigned tasks don't get done. Every task needs one name, not 'someone should.'",
      "Check if deadlines are realistic — if everything is 'ASAP' nothing is urgent. Set real dates.",
      "Look for repeat offenders — if one person drops tasks consistently, it's a training or motivation issue, not a task issue.",
      "Check if tasks are too vague — 'Clean up' fails. 'Sanitize prep table and restock station by 4pm' succeeds.",
      "Review in your daily pre-shift meeting — 30 seconds on yesterday's incomplete tasks. Public accountability works.",
    ],
  },

  team_communication: {
    title: "Team Communication",
    whatItMeans:
      "Most pizzeria problems start as communication failures. The walk-in temp was wrong but nobody told the owner. A driver called out but the closer didn't know. Team chat creates a written record — no more 'I told him' vs 'nobody told me.'",
    whenRedPlaybook: [
      "Require shift leads to post one end-of-shift update: what happened, what's left, what the next shift needs to know.",
      "Pin critical messages — health inspector visit dates, menu changes, policy updates. Don't let them scroll away.",
      "If the chat goes quiet for 48+ hours, something is wrong. Either the team doesn't trust it or they don't check it. Ask in the next pre-shift.",
      "Keep it professional but human — 'Great job handling the rush tonight' goes further than another rule reminder.",
      "Never deliver bad news or discipline through chat. That's a face-to-face conversation. Chat is for operations, not conflict.",
    ],
  },

  doordash_effective_commission: {
    title: "DoorDash Effective Commission & True Cost",
    whatItMeans:
      "Effective Commission = Total fees to DoorDash ÷ DoorDash sales × 100. Green: <20%. Yellow: 20–25%. Red: >25%. But the TRUE cost is higher: commission + packaging (extra boxes, bags, utensils), tablet/pos fees, and marketing (promoted listings, boosts). Many operators only look at the % on the statement and miss packaging and ad spend — so true cost can be 28–35% of DoorDash revenue. Know your all-in cost so you can decide if the channel is worth it and push direct ordering where you keep 100%.",
    whenRedPlaybook: [
      "Break fees: delivery vs commission vs marketing — which line item grew? Negotiate or reduce that",
      "Audit promos and boost participation — every unnecessary boost raises effective commission",
      "Add packaging and tablet costs to your DoorDash P&L — true cost is often 5–8 points higher",
      "Compare effective rate to in-store margin — if you keep more in-store, push pickup and own delivery",
      "Track what you keep (after all fees, packaging, and ads) — that's the number that pays the bills",
    ],
  },
};
