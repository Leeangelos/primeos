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
      "Consider checking last 3 vendor deliveries for price increases — suppliers raise prices quietly",
      "Consider weighing 10 cheese portions on 16-inch pies against your recipe spec — this is where most waste hides",
      "Consider running a 48-hour waste log — track every tossed pizza, dropped order, and remake",
      "Consider comparing theoretical food cost vs actual on your top 5 selling items",
      "Consider checking for vendor substitutions — different brand, different yield, different cost",
    ],
  },

  labor_pct: {
    title: "Labor %",
    whatItMeans:
      "Total Labor Dollars ÷ Net Sales × 100. Your biggest controllable cost. Target: 19–21% for full-service, 18–20% for QSR. On $5K/day, every point over target is $50/day — $1,500/month. Labor creeps when you overstaff slow days, don't cut when sales drop, or carry too many managers on the clock.",
    whenRedPlaybook: [
      "Consider comparing scheduled hours to sales by day-part — adjust overlap where sales don't justify it",
      "Consider auditing manager hours: are they on the floor or in the office? Every manager hour should earn its keep",
      "Consider checking start times vs first ticket — if you're open at 11, why is labor clocked at 9?",
      "Consider running a week of actual vs theoretical labor (sales ÷ target labor %) — gap = overstaff or overtime",
      "Consider reviewing break compliance and punch edits — off-the-clock work and missed punches distort the number",
    ],
  },

  prime_cost: {
    title: "Prime Cost %",
    whatItMeans:
      "Labor % + Food Cost % (sometimes includes disposables). The number that decides whether you make money. Target: 55–58%. Above 60% and you're giving back profit. Every point over 55% on a $50K week is about $500 left on the table. Prime is the lever you control — portioning, scheduling, waste, and purchasing.",
    whenRedPlaybook: [
      "Consider identifying which leg is high — labor or food — and attack that first; don't spread effort thin",
      "Consider locking in a 2-week schedule at target labor % and avoid adding shifts without a sales spike",
      "Consider running theoretical vs actual food cost on top 10 items — biggest gaps are waste or over-portioning",
      "Consider comparing prime by day of week — one bad day can drag the week; adjust the pattern",
      "If both labor and food are red, many operators find it helpful to address labor first — it's usually the faster win",
    ],
  },

  slph: {
    title: "Sales per Labor Hour",
    whatItMeans:
      "Net Sales ÷ Total Labor Hours. How much revenue each labor hour produces. Target: $65–$85+ depending on concept. Below $60 and you're either overstaffed or under-selling. SLPH tells you if your labor is productive — same hours with higher SLPH means better deployment or stronger sales, not more bodies.",
    whenRedPlaybook: [
      "Consider mapping labor hours to day-parts — find the hours where SLPH collapses and trim or redeploy",
      "Consider checking if slow days have the same headcount as busy days — spread labor to match demand",
      "Consider verifying labor hours are clocked correctly — missed punches and ghost hours kill SLPH",
      "Consider comparing SLPH by day of week — Tuesday at $48 and Saturday at $92 often means Tuesday is overstaffed",
      "Before adding labor, consider lifting check average during weak day-parts — sometimes the lever is revenue, not cuts",
    ],
  },

  labor_optimization: {
    title: "Labor & Schedule Optimization",
    whatItMeans:
      "Every shift is a financial decision. Labor optimization means right-sizing staff to demand: match scheduled hours to projected sales so labor % stays on target (e.g. ≤21%) and SLPH stays strong ($65–$85+). Build the schedule around day-part demand, reduce overlap (especially closer/driver), and use projected sales by day-of-week so you see the impact before the week starts — not after.",
    whenRedPlaybook: [
      "Consider comparing scheduled hours to sales by day-part — adjust overlap where sales don't justify it",
      "Consider checking start times vs first ticket — if you're open at 11, labor at 9 may be waste",
      "Consider whether you need both a mid-shift and a closer. One 10–close might be cheaper",
      "Consider building SLPH targets by day of week; Mon/Tue need different staffing than Fri/Sat",
      "Consider reviewing projected labor % before publishing — trim one shift and see the impact",
    ],
  },

  ticket_avg: {
    title: "Average Ticket",
    whatItMeans:
      "Total Sales ÷ Transaction Count. How much each customer spends per visit. Every $1 increase on 500 transactions/day is $500/day — $15K/month. Ticket is driven by mix (premium vs value), add-ons (sides, drinks, desserts), and size (large vs medium). It's the easiest lever that doesn't require more traffic.",
    whenRedPlaybook: [
      "Consider running a mix report: what % of orders are premium vs value? Shift mix with boards and training",
      "Consider checking add-on attach rate — drinks, sides, desserts; one more add-on per ticket moves the needle",
      "Consider auditing size mix — are you defaulting to medium? Large and family sizes carry margin",
      "Consider reviewing discounts and comps — every comp is a full ticket loss; tighten approval and track reasons",
      "Consider testing a limited-time offer or bundle — one strong LTO can lift ticket for the whole period",
    ],
  },

  transaction_count: {
    title: "Transaction Count",
    whatItMeans:
      "Number of customer transactions (checks or orders) in the period. Traffic. It's the top of the funnel — no transactions, no sales. Compare to same day last week and last year. Transaction count plus average ticket equals sales; if sales are flat, you need to know whether it's traffic or ticket (or both) that's off.",
    whenRedPlaybook: [
      "Consider comparing transactions by day-part — which day-part dropped? That's where to look (operations, marketing, or competition)",
      "Consider checking for POS or integration errors — double rings, voided orders, or missed channels can undercount",
      "Consider comparing to last year same period — are you losing traffic to a new competitor or a closed road?",
      "If ticket is up but transactions are down, you may have priced out frequency — watch retention",
      "Consider correlating with marketing and promotions — did a pullback in ads or offers coincide with the drop?",
    ],
  },

  cogs: {
    title: "Cost of Goods Sold",
    whatItMeans:
      "Total cost of food, beverage, and packaging used to produce what you sold. COGS ÷ Sales = food cost %. COGS goes up with higher prices from vendors, waste, over-portioning, or theft. It's the direct cost of putting product on the plate. Track it weekly — by the time the accountant tells you, the month is gone.",
    whenRedPlaybook: [
      "Consider comparing COGS to receiving and invoices — are you paying for more than you're ringing?",
      "Consider reconciling inventory: beginning + purchases − ending should match COGS; big variance = waste or shrink",
      "Consider breaking COGS by category (dairy, meat, produce, dry) — which category spiked?",
      "Consider checking portioning on top 5 items — one over-portioned item can move COGS a full point",
      "Consider auditing comps, staff meals, and giveaways — they're in COGS but not in sales; track them separately",
    ],
  },

  gross_profit: {
    title: "Gross Profit",
    whatItMeans:
      "Sales minus COGS. What's left after the cost of the product. Gross profit pays for labor, rent, and everything else. Gross margin (gross profit ÷ sales) should be 65–70%+ in pizza. If gross profit drops, either sales dropped or COGS rose — or both. This is the first line of defense before fixed costs.",
    whenRedPlaybook: [
      "Consider separating the impact: did sales fall or COGS rise? Focus on the right lever",
      "If COGS rose, consider running the food cost and COGS playbooks — vendor prices, waste, portioning",
      "If sales fell, look at transaction count and ticket — traffic, mix, or pricing",
      "Consider comparing gross profit by store or day-part — one weak segment can drag the whole number",
      "Consider locking in food cost and then lifting ticket and traffic — gross profit grows from both sides",
    ],
  },

  daily_sales: {
    title: "Daily Sales",
    whatItMeans:
      "Total net sales for the day. The top line. Daily sales drive everything — labor targets, food cost targets, and whether you make money. Compare to same day last week and last year. One bad day is a blip; a pattern of down days is a trend. Track the number, then break it into transactions and ticket to know why it moved.",
    whenRedPlaybook: [
      "Consider breaking daily sales into transactions × ticket — which one dropped? That's your focus",
      "Consider comparing to weather, events, and holidays — external factors explain some variance",
      "Consider checking for POS or reporting errors — missing channels, wrong date range, or failed sync",
      "If multiple days in a row are down, look at operations (speed, quality) and marketing (visibility)",
      "Consider using last year same day as baseline — are you gaining or losing share of wallet and traffic?",
    ],
  },

  employee_cac: {
    title: "Employee CAC",
    whatItMeans:
      "Cost to Acquire (hire) an Employee: job posts, manager time interviewing, training, uniforms, and onboarding. Average pizzeria: $2,800–$4,200 per hire. 8 replacements/year = $22K–$34K hidden cost. CAC is why retention pays — one hire that stays 2 years is worth two that quit in 6 months.",
    whenRedPlaybook: [
      "Consider tracking CAC by source — which channel (Indeed, referral, walk-in) gives you keepers? Double down there",
      "Consider reducing time-to-fill and time-to-productivity — faster onboarding cuts effective CAC",
      "Consider auditing manager hours spent on hiring — streamline interviews and use scorecards",
      "Consider investing in training so new hires ramp faster — same CAC, higher yield",
      "If CAC is climbing, consider addressing turnover first — fewer open roles means less recruiting spend",
    ],
  },

  employee_ltv: {
    title: "Employee LTV",
    whatItMeans:
      "Employee Lifetime Value — the productivity and value an employee generates over their tenure. A $14/hr employee who stays 18 months and generates $80/hr in SLPH has an LTV of ~$35,000 in productivity. One who quits at 3 months: ~$5,800. LTV must be higher than CAC or you lose money on every hire. A $0.50/hr raise that keeps someone 6 months longer often pays for itself in lower turnover cost.",
    whenRedPlaybook: [
      "Consider calculating LTV by role and tenure — which roles and tenures are profitable? Hire and retain for those",
      "Consider improving training and support so new hires reach full productivity faster — raises LTV",
      "Consider addressing exit reasons — scheduling, pay, management — so tenure extends and LTV grows",
      "Consider using 30- and 90-day check-ins to catch flight risk early; one saved hire saves full CAC",
      "If LTV is below CAC, it may help to either reduce CAC (faster hire, cheaper source) or extend tenure (retention)",
    ],
  },

  churn_rate: {
    title: "Employee Churn Rate",
    whatItMeans:
      "Percentage of employees who leave in a period (e.g. 90 days). Churn rate = (exits ÷ average headcount) × 100. Above 25% quarterly is red — you're bleeding talent and money. Every exit costs $2,800–$4,200 to replace. High churn means constant recruiting, constant training, and weaker operations. Fix churn before scaling hiring.",
    whenRedPlaybook: [
      "Consider pulling exit reasons for last 90 days — group by scheduling, pay, management, personal; attack the biggest bucket",
      "Consider comparing churn by location — if one store is high, it's usually management or culture",
      "Consider reviewing scheduling fairness — same people always getting bad shifts? That drives quits",
      "Consider calculating cost: exits × $3,500 avg replacement; show that number to managers and owners",
      "Consider implementing 30-day check-ins with new hires — most turnover happens in first 60 days; catch it early",
    ],
  },

  marketing_roas: {
    title: "Marketing ROAS",
    whatItMeans:
      "Return on Ad Spend. Revenue attributed to ads ÷ Ad Spend. If you spend $500 on Meta and attribute $2,500 in revenue, ROAS = 5x. For pizza, 3x+ is strong; 1–3x is okay; below 1x you're losing money. ROAS tells you which channels and campaigns earn their keep. Blended ROAS across all spend is your overall marketing efficiency.",
    whenRedPlaybook: [
      "Consider pausing or reducing spend on campaigns or channels below 1x ROAS — they're costing money",
      "Consider breaking ROAS by campaign and creative — double down on what works, pause what doesn't",
      "Consider checking attribution — are you counting first-touch, last-touch, or blended? Be consistent",
      "Consider comparing ROAS to LTV/CAC — if CAC from ads is too high, improve offer or targeting",
      "Consider testing one variable at a time (audience, creative, offer) so you know what moved the number",
    ],
  },

  inventory_par: {
    title: "Par Levels & Inventory",
    whatItMeans:
      "Par is the target quantity you want on hand — enough to get through to the next order without running out. Below 25% of par = Low (yellow); zero = Out (red). Tracking inventory weekly catches waste, overportioning, and theft. Beginning + Purchases − Ending = Actual Usage. Compare to theoretical usage from recipes; the gap is money walking out the door.",
    whenRedPlaybook: [
      "Consider counting weekly — Monday before deliveries is ideal; walk-in is at its lowest",
      "Consider identifying items with the biggest dollar variance and check portioning first",
      "Consider reviewing waste logs and unrecorded comps or staff meals",
      "Consider comparing variance across locations — one store off points to process or theft",
    ],
  },

  invoice_scanning: {
    title: "Invoice Scanning",
    whatItMeans:
      "Snap a photo of any vendor invoice. AI extracts every line item — product names, quantities, unit prices, totals. You review and approve. No manual data entry. Most operators don't track individual product prices because it's tedious; when cheese goes up $0.40/lb you don't notice until month-end when food cost is 3 points over. Invoice scanning catches price changes the day they happen. Approved invoices can update ingredient costs in Recipe Cards so theoretical food cost stays accurate.",
    whenRedPlaybook: [
      "If you aren't scanning invoices, many operators find they're flying blind on vendor price changes",
      "Consider reconciling scanned totals to actual payments — catch duplicate or wrong charges",
      "Consider using line-item data to re-bid: compare unit prices across vendors and consider renegotiating",
      "Consider flagging invoices that don't match PO or delivery — catch short shipments and billing errors",
    ],
  },

  party_orders: {
    title: "Party Order Margins & Upsell",
    whatItMeans:
      "Party and catering orders are prepaid, predictable, and bulk-prepped — typically 15–20% higher margin than walk-in. You prep efficiently, staff precisely, and avoid waste. A shop doing 4 parties per weekend at $400 avg = $6,400/month in premium revenue. Upsell strategy: always quote a package (e.g. pizza + wings + drinks) first; add-ons like salads, desserts, and premium toppings lift the ticket. Consider establishing a deposit (e.g. 25–50%) to lock the date; balance due on pickup or delivery. Track repeat party customers — they're your best referral source.",
    whenRedPlaybook: [
      "Consider checking: do customers know you do parties? Consider adding it to menu, bags, and social.",
      "Consider reviewing pricing vs other catering options; make ordering dead simple (one form, one call).",
      "Consider following up on every completed party for a review and referral.",
      "Consider tracking repeat party customers and margin by order size.",
    ],
  },

  task_management: {
    title: "Task Completion Rate",
    whatItMeans:
      "Task completion rate measures what percentage of assigned tasks get done on time. In a pizzeria, dropped tasks cascade — a missed food order means 86'd items Friday night, a missed repair call means the walk-in dies Saturday morning. Tracking completion turns chaos into accountability.",
    whenRedPlaybook: [
      "Consider checking if tasks have clear owners — unassigned tasks don't get done. Every task needs one name, not 'someone should.'",
      "Consider checking if deadlines are realistic — if everything is 'ASAP' nothing is urgent. Consider setting real dates.",
      "Consider identifying repeat patterns — if one person drops tasks consistently, it's usually a training or motivation issue, not a task issue.",
      "Consider checking if tasks are too vague — 'Clean up' fails. 'Sanitize prep table and restock station by 4pm' succeeds.",
      "Consider reviewing in your daily pre-shift meeting — 30 seconds on yesterday's incomplete tasks. Public accountability works.",
    ],
  },

  team_communication: {
    title: "Team Communication",
    whatItMeans:
      "Most pizzeria problems start as communication failures. The walk-in temp was wrong but nobody told the owner. A driver called out but the closer didn't know. Team chat creates a written record — no more 'I told him' vs 'nobody told me.'",
    whenRedPlaybook: [
      "Consider establishing a norm for shift leads to post one end-of-shift update: what happened, what's left, what the next shift needs to know.",
      "Consider pinning critical messages — health inspector visit dates, menu changes, policy updates. Don't let them scroll away.",
      "If the chat goes quiet for 48+ hours, something is wrong. Either the team doesn't trust it or they don't check it. Consider asking in the next pre-shift.",
      "Consider keeping it professional but human — 'Great job handling the rush tonight' goes further than another rule reminder.",
      "It's generally best to avoid delivering bad news or discipline through chat. That's a face-to-face conversation. Chat is for operations, not conflict.",
    ],
  },

  doordash_effective_commission: {
    title: "DoorDash Effective Commission & True Cost",
    whatItMeans:
      "Effective Commission = Total fees to DoorDash ÷ DoorDash sales × 100. Green: <20%. Yellow: 20–25%. Red: >25%. But the TRUE cost is higher: commission + packaging (extra boxes, bags, utensils), tablet/pos fees, and marketing (promoted listings, boosts). Many operators only look at the % on the statement and miss packaging and ad spend — so true cost can be 28–35% of DoorDash revenue. Know your all-in cost so you can decide if the channel is worth it and push direct ordering where you keep 100%.",
    whenRedPlaybook: [
      "Consider breaking fees: delivery vs commission vs marketing — which line item grew? Consider renegotiating or reducing that",
      "Consider auditing promos and boost participation — every unnecessary boost raises effective commission",
      "Consider adding packaging and tablet costs to your DoorDash P&L — true cost is often 5–8 points higher",
      "Consider comparing effective rate to in-store margin — if you keep more in-store, push pickup and own delivery",
      "Consider tracking what you keep (after all fees, packaging, and ads) — that's the number that pays the bills",
    ],
  },

  gp_vs_net_profit: {
    title: "GP vs Net Profit",
    whatItMeans:
      "Your GP P&L shows what you control daily — food, labor, disposables. Your Actual P&L shows everything — rent, insurance, utilities, loans, marketing, miscellaneous. The gap between them is your fixed cost burden. Most operators track GP but never see the full picture until tax season. By then it's too late to fix.",
    whenRedPlaybook: [
      "Consider listing fixed cost line items and their percentage of revenue — rent, insurance, utilities, loan payments, marketing, misc",
      "Consider comparing occupancy (rent ÷ revenue) to the 6% target — if you're at 8%, it may help to grow sales or consider renegotiating",
      "Consider shopping insurance annually — get 3 quotes every renewal. Most operators overpay by 15-20% because they auto-renew",
      "Consider auditing utilities — LED lighting, programmable thermostats, and fixing the walk-in door seal can cut 10-15%",
      "Consider reviewing loan terms — refinancing at even 1% lower rate saves thousands per year on a $200K note",
    ],
  },

  occupancy_pct: {
    title: "Occupancy % (Rent)",
    whatItMeans:
      "Rent ÷ Total Revenue × 100. What percentage of every dollar you make goes to your landlord. Target: ≤6% of revenue. At 8% on $40,000/month revenue, you're paying $3,200 for a space that should cost $2,400 at your sales volume — or you need to grow revenue to $53,333/month to bring occupancy down to 6%.",
    whenRedPlaybook: [
      "Consider calculating your break-even occupancy: current rent ÷ 0.06 = the monthly revenue you need to hit 6%",
      "If the gap is more than 15% above current sales, consider renegotiating rent before trying to grow into it",
      "Consider renegotiating at lease renewal — come with your P&L showing the occupancy burden. Landlords prefer a stable tenant at lower rent over vacancy",
      "Consider if your space is right-sized — paying for square footage you don't use is dead money",
      "Factor in CAM charges, property tax pass-throughs, and percentage rent clauses — your 'real' occupancy cost may be higher than base rent",
    ],
  },

  net_profit: {
    title: "Net Profit",
    whatItMeans:
      "What's actually left after every single expense is paid — food, labor, disposables, rent, insurance, utilities, loans, marketing, everything. This is your real take-home before taxes and owner distributions. Most independent pizzerias operate at 5-12% net profit. Below 5% and you're one bad month from trouble.",
    whenRedPlaybook: [
      "Consider identifying the biggest gap: is it GP (variable costs) or fixed costs dragging you down?",
      "If GP is healthy but net is low, your fixed cost structure is the problem — consider focusing on the occupancy, insurance, and utilities playbooks",
      "If GP is also weak, many operators find it helpful to address variable costs first — they respond faster. Food cost and labor improvements show up in days, not months",
      "Consider calculating your monthly break-even: total fixed costs ÷ GP margin % = minimum monthly revenue needed",
      "Consider building a 90-day improvement plan: target 1 point improvement in GP per month while holding fixed costs flat",
    ],
  },

  revenue: {
    title: "Total Revenue",
    whatItMeans:
      "Total money collected from all sales channels — dine-in, pickup, delivery, and third-party platforms. This is the top line before any costs are subtracted. Track daily and compare week-over-week to spot trends early.",
    whenRedPlaybook: [
      "Consider reviewing whether a specific daypart (lunch vs dinner) is underperforming",
      "Consider checking if recent menu price changes affected transaction count",
      "Consider comparing dine-in vs delivery mix — a shift toward delivery may lower average ticket",
      "Consider reviewing whether local events or weather affected foot traffic",
      "Consider evaluating marketing campaigns — are they driving measurable revenue?",
    ],
  },

  disposables_pct: {
    title: "Disposables & Packaging %",
    whatItMeans:
      "Total disposable supplies (boxes, bags, cups, napkins, gloves, foil) as a percentage of sales. Target: 3–5%. Often overlooked but adds up — on $5,000/day, every extra point costs $50/day or $1,500/month.",
    whenRedPlaybook: [
      "Consider auditing box usage — are staff using 16-inch boxes for 12-inch pizzas?",
      "Consider checking if delivery mix increased — more delivery means more packaging per order",
      "Consider comparing supplier prices on your top 5 disposable items",
      "Consider whether portion cups and bags are being over-used or doubled up",
      "Consider renegotiating bulk pricing with your disposables vendor",
    ],
  },

  avg_daily_sales: {
    title: "Average Daily Sales",
    whatItMeans:
      "Total sales for the period divided by number of operating days. Smooths out high and low days to show your true daily run rate. Use this to set daily targets and spot when you're trending above or below your baseline.",
    whenRedPlaybook: [
      "Consider comparing this period to the same period last year for seasonality",
      "Consider reviewing whether any closures or short days dragged down the average",
      "Consider checking if a specific day of the week is consistently underperforming",
      "Consider whether marketing or promotions are needed to boost slow days",
      "Consider evaluating hours of operation — are you open during your highest-demand windows?",
    ],
  },

  insurance_pct: {
    title: "Insurance %",
    whatItMeans:
      "Total insurance premiums as a percentage of revenue. Target: 1.5–2.5% of revenue. Includes general liability, workers comp, property, and auto if applicable. Many operators overpay by 15–20% because they auto-renew without shopping.",
    whenRedPlaybook: [
      "Consider getting 3 competitive quotes at your next renewal — don't auto-renew",
      "Consider bundling policies (GL + property + auto) for multi-policy discounts",
      "Consider reviewing your workers comp classification — incorrect codes can cost thousands",
      "Consider raising deductibles if your claims history is clean — lower premiums immediately",
      "Consider working with an independent broker who shops multiple carriers",
    ],
  },

  utilities_pct: {
    title: "Utilities %",
    whatItMeans:
      "Total utility costs (electric, gas, water, trash, internet, phone) as a percentage of revenue. Target: 3–5% of revenue. The walk-in cooler and ovens are your biggest draws — maintenance directly impacts this number.",
    whenRedPlaybook: [
      "Consider checking walk-in cooler door seals — a bad seal can add $200+/month to electric",
      "Consider switching to LED lighting throughout — pays for itself in 3–6 months",
      "Consider installing a programmable thermostat for HVAC — reduce overnight heating/cooling",
      "Consider reviewing trash pickup frequency — you may be paying for pickups you don't need",
      "Consider auditing your phone/internet plan — many operators are on legacy plans that cost more than current options",
    ],
  },

  total_employees: {
    title: "Total Employees",
    whatItMeans:
      "Headcount across all locations and roles. Drives labor cost, scheduling, and turnover metrics. Track active vs termed and compare to sales to see if you're right-sized for volume.",
    whenRedPlaybook: [
      "Consider comparing headcount to same period last year — are you carrying more people for the same sales?",
      "Consider reviewing role mix — too many managers or leads can push labor % up",
      "Consider correlating with churn — high turnover often means understaffing key shifts or poor fit",
      "Consider evaluating whether part-time vs full-time mix matches your demand curve",
      "Consider checking that every role has clear responsibilities and isn't duplicated across locations",
    ],
  },
};
