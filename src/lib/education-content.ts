/**
 * Education engine — Layer 2 (what it means) and Layer 3 (when red playbook) for every KPI.
 * Single source of truth for in-app education. No placeholders.
 */

export type EducationEntry = {
  title: string;
  whatItMeans: string;
  whenRedPlaybook: string[];
  whyItMatters?: string;
};

export const EDUCATION_CONTENT: Record<string, EducationEntry> = {
  food_cost: {
    title: "Food Cost %",
    whatItMeans:
      "Total Food Purchases ÷ Total Sales × 100. On $5,000/day in sales, every single point above the industry benchmark costs about $50 per day — $1,500 per month and $18,000 per year. Industry benchmark: 28–31%. Above 33% is red — worth watching.",
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
      "Total Labor Dollars ÷ Net Sales × 100. The biggest controllable cost. Industry benchmark: 19–21% for full-service, 18–20% for QSR. On $5K/day, every point over that range is about $50/day — $1,500/month. Labor creeps when slow days are overstaffed, sales drop without cutting hours, or too many managers are on the clock.",
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
      "Labor % + Food Cost % (sometimes includes disposables). The number that drives whether the store makes money. Industry benchmark: 55–58%. Above 60%, Gross Profit shrinks. Every point over 55% on a $50K week is about $500. Prime is the lever operators control — portioning, scheduling, waste, and purchasing.",
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
      "Net Sales ÷ Total Labor Hours. How much revenue each labor hour produces. Industry benchmark: $65–$85+ depending on concept. Below $60 often indicates overstaffing or under-selling. SLPH shows whether labor is productive — same hours with higher SLPH usually means better deployment or stronger sales, not more bodies.",
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
      "Every shift is a financial decision. Labor optimization means right-sizing staff to demand: match scheduled hours to projected sales so labor % stays within the typical range (e.g. ≤21%) and SLPH stays strong ($65–$85+). Build the schedule around day-part demand, reduce overlap (especially closer/driver), and use projected sales by day-of-week to see the impact before the week starts — not after.",
    whenRedPlaybook: [
      "Consider comparing scheduled hours to sales by day-part — adjust overlap where sales don't justify it",
      "Consider checking start times vs first ticket — if you're open at 11, labor at 9 may be waste",
      "Consider whether you need both a mid-shift and a closer. One 10–close might be cheaper",
      "Consider building SLPH benchmarks by day of week; Mon/Tue often need different staffing than Fri/Sat",
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
      "Consider auditing size mix — are you defaulting to medium? Large and family sizes carry Gross Margin",
      "Consider reviewing discounts and comps — every comp is a full ticket loss; tighten approval and track reasons",
      "Consider testing a limited-time offer or bundle — one strong LTO can lift ticket for the whole period",
    ],
  },

  transaction_count: {
    title: "Transaction Count",
    whatItMeans:
      "Number of customer transactions (checks or orders) in the period. Traffic. It's the top of the funnel — no transactions, no sales. Compare to same day last week and last year. Transaction count plus average ticket equals sales; if sales are flat, it helps to know whether traffic or ticket (or both) is off.",
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
      "Food + Labor + Disposables (PRIME Cost). In PrimeOS, COGS means the total cost of what you control daily: food, beverage, packaging (disposables), and labor. PRIME ÷ Sales = prime cost %. COGS goes up with higher prices from vendors, waste, over-portioning, or theft. Track it weekly — by the time the accountant tells you, the month is gone.",
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
      "Sales minus COGS (food + labor + disposables). What's left after the cost of the product. Gross Profit pays for rent and everything else. Gross Margin (Gross Profit ÷ sales) should be 65–70%+ in pizza. If Gross Profit drops, either sales dropped or COGS rose — or both. This is the first line of defense before fixed costs.",
    whenRedPlaybook: [
      "Consider separating the impact: did sales fall or COGS rise? Focus on the right lever",
      "If COGS rose, consider running the food cost and COGS playbooks — vendor prices, waste, portioning",
      "If sales fell, look at transaction count and ticket — traffic, mix, or pricing",
      "Consider comparing Gross Profit by store or day-part — one weak segment can drag the whole number",
      "Consider locking in food cost and then lifting ticket and traffic — Gross Profit grows from both sides",
    ],
  },

  daily_sales: {
    title: "Daily Sales",
    whatItMeans:
      "Total net sales for the day. The top line. Daily sales drive everything — labor and food cost benchmarks, and whether the store makes money. Compare to same day last week and last year. One bad day is a blip; a pattern of down days is a trend. Track the number, then break it into transactions and ticket to know why it moved.",
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
      "Percentage of employees who leave in a period (e.g. 90 days). Churn rate = (exits ÷ average headcount) × 100. Above 25% quarterly is red — worth watching. Every exit costs $2,800–$4,200 to replace. High churn means constant recruiting, constant training, and weaker operations. Many operators address churn before scaling hiring.",
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
      "Return on Ad Spend. Revenue attributed to ads ÷ Ad Spend. If you spend $500 on Meta and attribute $2,500 in revenue, ROAS = 5x. For pizza, 3x+ is strong; 1–3x is okay; below 1x the campaign is below break-even. ROAS shows which channels and campaigns earn their keep. Blended ROAS across all spend is overall marketing efficiency.",
    whenRedPlaybook: [
      "Consider pausing or reducing spend on campaigns or channels below 1x ROAS — they're costing money",
      "Consider breaking ROAS by campaign and creative — double down on what works, pause what doesn't",
      "Consider checking attribution — are you counting first-touch, last-touch, or blended? Be consistent",
      "Consider comparing ROAS to LTV/CAC — if CAC from ads is high, consider refining offer or targeting",
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
    title: "Catering & Large Order Margins & Upsell",
    whatItMeans:
      "Party and catering orders are prepaid, predictable, and bulk-prepped — typically 15–20% higher Gross Margin than walk-in. You prep efficiently, staff precisely, and avoid waste. A shop doing 4 parties per weekend at $400 avg = $6,400/month in premium revenue. Upsell strategy: always quote a package (e.g. pizza + wings + drinks) first; add-ons like salads, desserts, and premium toppings lift the ticket. Consider establishing a deposit (e.g. 25–50%) to lock the date; balance due on pickup or delivery. Track repeat party customers — they're your best referral source.",
    whenRedPlaybook: [
      "Consider checking: do customers know you do parties? Consider adding it to menu, bags, and social.",
      "Consider reviewing pricing vs other catering options; make ordering dead simple (one form, one call).",
      "Consider following up on every completed party for a review and referral.",
      "Consider tracking repeat party customers and Gross Margin by order size.",
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
      "Consider comparing effective rate to in-store Gross Margin — if you keep more in-store, push pickup and own delivery",
      "Consider tracking what you keep (after all fees, packaging, and ads) — that's the number that pays the bills",
    ],
  },

  gp_vs_net_profit: {
    title: "GP vs Net Profit",
    whatItMeans:
      "Your GP P&L shows what you control daily — food, labor, disposables. Your Actual P&L shows everything — rent, insurance, utilities, loans, marketing, miscellaneous. The gap between them is your fixed cost burden. Most operators track GP but don't see the full picture until tax season. By then options are more limited.",
    whenRedPlaybook: [
      "Consider listing fixed cost line items and their percentage of revenue — rent, insurance, utilities, loan payments, marketing, misc",
      "Consider comparing occupancy (rent ÷ revenue) to the 6% industry benchmark — if occupancy is at 8%, growing sales or renegotiating may help",
      "Consider shopping insurance annually — get 3 quotes every renewal. Most operators overpay by 15-20% because they auto-renew",
      "Consider auditing utilities — LED lighting, programmable thermostats, and fixing the walk-in door seal can cut 10-15%",
      "Consider reviewing loan terms — refinancing at even 1% lower rate saves thousands per year on a $200K note",
    ],
  },

  occupancy_pct: {
    title: "Occupancy % (Rent)",
    whatItMeans:
      "Rent ÷ Total Revenue × 100. What percentage of every dollar you make goes to your landlord. Industry benchmark: ≤6% of revenue. At 8% on $40,000/month revenue, that's $3,200 for a space that at 6% would be $2,400 at that volume — growing revenue to $53,333/month would bring occupancy down to 6%.",
    whenRedPlaybook: [
      "Consider calculating break-even occupancy: current rent ÷ 0.06 = the monthly revenue that would hit 6%",
      "If the gap is more than 15% above current sales, consider renegotiating rent before trying to grow into it",
      "Consider renegotiating at lease renewal — come with your P&L showing the occupancy burden. Landlords prefer a stable tenant at lower rent over vacancy",
      "Consider if your space is right-sized — paying for square footage you don't use is dead money",
      "Factor in CAM charges, property tax pass-throughs, and percentage rent clauses — your 'real' occupancy cost may be higher than base rent",
    ],
  },

  net_profit: {
    title: "Net Profit",
    whatItMeans:
      "What's actually left after every single expense is paid — food, labor, disposables, rent, insurance, utilities, loans, marketing, everything. This is your real take-home before taxes and owner distributions. Most independent pizzerias operate at 5-12% Net Profit. Below 5%, one bad month can create pressure.",
    whenRedPlaybook: [
      "Consider identifying the biggest gap: is it GP (variable costs) or fixed costs dragging you down?",
      "If GP is healthy but net is low, your fixed cost structure is the problem — consider focusing on the occupancy, insurance, and utilities playbooks",
      "If GP is also weak, many operators find it helpful to address variable costs first — they respond faster. Food cost and labor improvements show up in days, not months",
      "Consider calculating your monthly break-even: total fixed costs ÷ GP margin % = minimum monthly revenue needed",
      "Consider building a 90-day improvement plan: many operators aim for 1 point improvement in GP per month while holding fixed costs flat",
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
      "Total disposable supplies (boxes, bags, cups, napkins, gloves, foil) as a percentage of sales. Industry benchmark: 3–5%. Often overlooked but adds up — on $5,000/day, every extra point is about $50/day or $1,500/month.",
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
      "Total sales for the period divided by number of operating days. Smooths out high and low days to show your true daily run rate. Use this to compare to your baseline and spot when you're trending above or below it.",
    whenRedPlaybook: [
      "Consider comparing this period to the same period last year for seasonality",
      "Consider reviewing whether any closures or short days dragged down the average",
      "Consider checking if a specific day of the week is consistently underperforming",
      "Consider whether marketing or promotions could help slow days",
      "Consider evaluating hours of operation — are you open during your highest-demand windows?",
    ],
  },

  insurance_pct: {
    title: "Insurance %",
    whatItMeans:
      "Total insurance premiums as a percentage of revenue. Industry benchmark: 1.5–2.5% of revenue. Includes general liability, workers comp, property, and auto if applicable. Many operators overpay by 15–20% because they auto-renew without shopping.",
    whenRedPlaybook: [
      "Consider getting 3 competitive quotes at your next renewal; many operators save by shopping instead of auto-renewing",
      "Consider bundling policies (GL + property + auto) for multi-policy discounts",
      "Consider reviewing your workers comp classification — incorrect codes can cost thousands",
      "Consider raising deductibles if your claims history is clean — lower premiums immediately",
      "Consider working with an independent broker who shops multiple carriers",
    ],
  },

  utilities_pct: {
    title: "Utilities %",
    whatItMeans:
      "Total utility costs (electric, gas, water, trash, internet, phone) as a percentage of revenue. Industry benchmark: 3–5% of revenue. The walk-in cooler and ovens are the biggest draws — maintenance directly impacts this number.",
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
      "Headcount across all locations and roles. Drives labor cost, scheduling, and turnover metrics. Track active vs termed and compare to sales to see if headcount matches volume.",
    whenRedPlaybook: [
      "Consider comparing headcount to same period last year — are you carrying more people for the same sales?",
      "Consider reviewing role mix — too many managers or leads can push labor % up",
      "Consider correlating with churn — high turnover often means understaffing key shifts or poor fit",
      "Consider evaluating whether part-time vs full-time mix matches your demand curve",
      "Consider checking that every role has clear responsibilities and isn't duplicated across locations",
    ],
  },

  menu_price_comparison: {
    title: "Cross-Location Price Comparison",
    whatItMeans:
      "Compares prices for the same menu items across your locations. Different markets may support different price points, but gaps larger than 15% on identical items may indicate a pricing misalignment. PrimeOS flags these so you can evaluate whether the difference is intentional or if revenue is being left on the table.",
    whenRedPlaybook: [
      "Consider reviewing items with the largest price gaps first — these have the biggest revenue impact",
      "Consider whether market differences (college town vs suburban) justify the gap",
      "Consider testing a small price increase at the lower-priced location on your top 5 sellers",
      "Consider checking if competitors in each market have similar pricing differences",
      "Consider aligning prices gradually — sudden jumps can affect customer perception",
    ],
  },
  menu_gap_analysis: {
    title: "Menu Gap Analysis",
    whatItMeans:
      "Shows items that exist at one location but not others. Gaps may be intentional (kitchen equipment, local demand) or opportunities to expand your menu at underperforming locations. An item that sells well at one location could be a revenue opportunity at another.",
    whenRedPlaybook: [
      "Consider whether the unique item could work at your other locations based on kitchen capacity",
      "Consider running a 30-day test of the top-selling unique item at another location",
      "Consider checking if ingredient supply chains support adding the item at other locations",
      "Consider whether removing underperforming unique items would simplify operations",
      "Consider surveying customers at other locations about interest in the unique items",
    ],
  },
  menu_item_count: {
    title: "Total Menu Items",
    whatItMeans:
      "The number of distinct menu items at this location. A larger menu can attract more customers but increases complexity, waste, and prep time. Most successful independents find a sweet spot between 40-80 items. More items means more inventory, more training, and more room for error.",
    whenRedPlaybook: [
      "Consider reviewing your bottom 10 sellers — items that sell fewer than 5 per week may not justify the prep and inventory",
      "Consider whether consolidating similar items would simplify without losing revenue",
      "Consider seasonal rotation instead of permanent menu additions",
      "Consider the impact on food cost — more items often means more waste on slow-moving ingredients",
      "Consider whether your kitchen staff can consistently execute every item at quality during a rush",
    ],
  },
  menu_avg_price: {
    title: "Average Menu Price",
    whatItMeans:
      "The average price across all sizes and items on your menu. This gives you a rough benchmark for your price positioning in the market. A higher average may mean premium positioning; a lower average may mean value positioning. Neither is wrong — but it should be intentional.",
    whenRedPlaybook: [
      "Consider comparing your average price to competitors within a 3-mile radius",
      "Consider whether your average ticket aligns with your average menu price — if ticket is much lower, customers may be choosing only cheaper items",
      "Consider whether a modest price increase on your top 10 sellers would significantly affect volume",
      "Consider the food cost benchmark — menu prices need to support the Gross Margin that works for your concept",
      "Consider testing premium items or add-ons that naturally raise the average without changing base prices",
    ],
  },

  vendor_total_spend: {
    title: "Total Vendor Spend",
    whatItMeans:
      "The sum of all payments to all vendors in the selected period. This is the total outflow from your business to external suppliers and service providers. Tracking this monthly helps you spot when total costs are creeping up even if individual vendors look stable.",
    whenRedPlaybook: [
      "Consider comparing this month's total to the same month last year — seasonal patterns matter",
      "Consider identifying which vendor category drove the largest increase",
      "Consider whether revenue increased proportionally — costs rising faster than revenue is the danger sign",
      "Consider scheduling a quarterly vendor review to catch creeping costs early",
      "Consider whether any vendor costs could be consolidated or renegotiated",
    ],
  },
  vendor_price_change: {
    title: "Vendor Price Change",
    whatItMeans:
      "The percentage change in a vendor's cost from one period to the next. Small increases (1-3%) are normal inflation. Increases over 5% deserve attention. Increases over 10% are a red flag that are worth reviewing — either the vendor raised prices, you're ordering more, or both.",
    whenRedPlaybook: [
      "Consider requesting an itemized breakdown of the price increase from the vendor",
      "Consider comparing the increase to food inflation indexes (USDA reports monthly)",
      "Consider getting 2-3 competing quotes to benchmark the new price",
      "Consider whether your order volume changed — more units at the same price looks like a price increase",
      "Consider negotiating a price lock for 6-12 months in exchange for volume commitment",
    ],
  },
  cc_effective_rate: {
    title: "Credit Card Effective Rate",
    whatItMeans:
      "Your actual credit card processing cost as a percentage of total card sales. Most operators are quoted 2.6% but their effective rate is actually 3.2-3.8% after interchange fees, batch fees, PCI compliance fees, and statement fees. Industry benchmark for restaurants: 2.5-3.0%. Every 0.1% over benchmark costs $40/month on $40,000 in card sales — that's $480/year.",
    whenRedPlaybook: [
      "Consider requesting a full fee breakdown from your processor — not just the quoted rate",
      "Consider calculating: total fees ÷ total card sales = your real effective rate",
      "Consider getting 2-3 competing quotes from processors that specialize in restaurants",
      "Consider whether you're paying PCI compliance fees that could be eliminated by completing your PCI questionnaire",
      "Consider negotiating — operators who switch or threaten to switch typically save $2,000-5,000/year",
    ],
  },
  occupancy_cost: {
    title: "Occupancy Cost %",
    whatItMeans:
      "Monthly rent divided by monthly revenue. This tells you what percentage of every dollar goes to your landlord. Industry benchmark: 6-8% is healthy, 8-10% is manageable, over 10% is a red flag. Unlike food and labor which you control daily, rent is locked into a lease — so this number is really about whether your revenue justifies your space.",
    whenRedPlaybook: [
      "Consider that high occupancy cost is often a revenue story — many operators address it by growing sales rather than moving",
      "Consider extending hours, adding catering, or increasing marketing to drive revenue up",
      "Consider subleasing unused space or times (breakfast/lunch if you're dinner-only)",
      "Consider negotiating rent reduction at lease renewal using your revenue data as leverage",
      "Consider whether a smaller or less expensive location would maintain your revenue while reducing fixed costs",
    ],
  },
  revenue_per_sqft: {
    title: "Revenue per Square Foot",
    whatItMeans:
      "Monthly revenue divided by your total square footage. This measures how efficiently you're using your space. A higher number means you're generating more revenue per square foot of real estate you're paying for. Compare across your locations to see which store is using its space most efficiently.",
    whenRedPlaybook: [
      "Consider comparing this across your locations — the lowest performer may need layout or menu optimization",
      "Consider whether your seating capacity matches your peak demand — empty tables during rushes is lost revenue per square foot",
      "Consider adding revenue streams that don't require more space (catering, online ordering, merchandise)",
      "Consider whether kitchen layout changes could increase throughput during peak hours",
      "Consider whether any square footage is underutilized (storage rooms, unused dining areas)",
    ],
  },
  delivery_economics: {
    title: "Delivery Platform Economics",
    whatItMeans:
      "Not all delivery platforms are equal. A platform with high gross revenue but 30% commission may net you less than a platform with lower volume but 15% commission. PrimeOS compares your actual net revenue per order across every platform you use — so you know which platforms are actually making you money.",
    whenRedPlaybook: [
      "Consider calculating your total cost per delivery order: food cost + labor + packaging + platform commission",
      "Consider whether orders on high-commission platforms are profitable after all costs",
      "Consider raising delivery menu prices on high-commission platforms to protect Gross Margin",
      "Consider promoting direct ordering (your website) where commission is lowest",
      "Consider reducing menu items available on the most expensive platforms to limit exposure",
    ],
  },
  net_revenue_per_order: {
    title: "Net Revenue per Order",
    whatItMeans:
      "The money you actually keep per order after the platform takes their commission. This is the number that matters — not gross revenue. A platform sending you 300 orders at $13/net each is worth more than one sending 100 orders at $14/net each. But if your food cost per order is $8, the first platform only nets you $5 Gross Profit per order while the second nets $6.",
    whenRedPlaybook: [
      "Consider comparing net/order across platforms — the difference compounds over hundreds of orders per month",
      "Consider whether low net/order platforms are worth the volume they bring",
      "Consider negotiating commission rates with platforms where you have high volume — they want to keep you",
      "Consider running the math: if net/order minus food cost minus labor minus packaging is negative, that platform loses money on every order",
      "Consider testing a price increase on the lowest net/order platform — even $0.50 more per order across 300 orders is $150/month",
    ],
  },
  competitor_intelligence: {
    title: "Competitor Intelligence",
    whatItMeans:
      "Understanding your competitive landscape helps with pricing and spotting opportunities. Operators don't have to be the cheapest — knowing where you sit in your market helps. PrimeOS monitors your local competition so you can make informed pricing and marketing decisions instead of guessing.",
    whenRedPlaybook: [
      "Consider that a new competitor opening nearby is not a reason to panic or cut prices",
      "Consider doubling down on your strengths — speed, quality, customer relationships, community presence",
      "Consider that new competitors typically take 6-12 months to stabilize; during that period, focus on retention",
      "Consider running targeted ads to customers in the new competitor's delivery zone",
      "Consider monitoring their Google reviews for weaknesses you can capitalize on",
    ],
  },
  market_position: {
    title: "Market Price Position",
    whatItMeans:
      "Where your prices sit relative to local competitors. Being above market average is fine if your quality, speed, and reputation support it. Being below market average means you may be leaving revenue on the table. Intentional pricing means knowing where you are and why.",
    whenRedPlaybook: [
      "Consider testing a small price increase on your top 5 sellers — even $0.50 per item can add $500+/month",
      "Consider whether your food quality and customer experience justify a premium position",
      "Consider that customers who choose you over chains are less price-sensitive than you think",
      "Consider comparing your average ticket to competitors — you may be underpriced across the board",
      "Consider raising delivery prices (where price sensitivity is lower) before dine-in",
    ],
  },
  theoretical_food_cost: {
    title: "Theoretical vs Actual Food Cost",
    whatItMeans:
      "Theoretical food cost is what your food should have cost based on your recipes and what you sold. Actual food cost is what you really spent on food. The gap between them reveals waste, theft, overportioning, unrecorded comps, or inventory errors. A gap under 2% is excellent. 2-5% needs attention. Over 5% means money is leaking and requires immediate investigation.",
    whenRedPlaybook: [
      "Consider running a portioning audit on your top 5 sellers — watch 10 make-ups and weigh them against recipe specs",
      "Consider reviewing unrecorded employee meals, manager comps, and remakes — these add up fast",
      "Consider checking if vendor prices increased without updating your recipe costs in PrimeOS",
      "Consider auditing your walk-in and prep waste — expired items and over-prepping are common culprits",
      "Consider reviewing camera footage during closing shifts if variance exceeds 10% — theft is rare but it happens",
    ],
  },
  menu_pricing_gap: {
    title: "Menu Price vs Actual Sale Price",
    whatItMeans:
      "Compares your listed menu price to what customers are actually being charged. A gap means customers are paying less than your menu price — usually due to unapplied POS updates, staff discounts, coupon overuse, incorrect ringing, or combo pricing errors. Every dollar of gap across hundreds of orders adds up fast.",
    whenRedPlaybook: [
      "Consider checking your POS for items still at old prices — price updates sometimes don't sync across all terminals",
      "Consider auditing your coupon and discount usage — who has override access and how often is it used?",
      "Consider reviewing combo pricing logic — some POS systems apply combo discounts incorrectly",
      "Consider whether staff meals or manager comps are being recorded but lowering the average sale price",
      "Consider running a POS price audit monthly — compare every item in POS to your current menu",
    ],
  },
  gl_upload: {
    title: "General Ledger Upload",
    whatItMeans:
      "A General Ledger is the most detailed financial record your business produces. Every transaction is recorded and categorized by account number. Uploading your GL gives PrimeOS the cleanest, most accurate data possible — better than manual entry, better than P&L uploads. If your accountant can export a GL from QuickBooks, Xero, or FreshBooks, PrimeOS can read it.",
    whenRedPlaybook: [
      "Consider asking your accountant for a monthly GL export in CSV format — most software does this in 2 clicks",
      "Consider uploading the GL within the first week of each month for the previous month",
      "Consider that GL data is more accurate than manual entry because it captures every transaction automatically",
      "Consider using the GL to verify your manual P&L entries — discrepancies reveal classification errors",
      "Consider that consistent monthly GL uploads give PrimeOS the best possible data for trend analysis and forecasting",
    ],
  },
  google_rating: {
    title: "Google Rating",
    whatItMeans:
      "Your average star rating on Google, based on all customer reviews. Ranges from 1.0 to 5.0.",
    whyItMatters:
      "Google rating directly affects whether new customers choose you or the competitor down the street. A restaurant below 4.0 loses significant potential traffic. The difference between 4.2 and 4.5 can be 20% more clicks.",
    whenRedPlaybook: [
      "Consider responding to every review — positive and negative. Businesses that respond to reviews average higher ratings over time. Industry benchmark: 4.3+ for independents.",
    ],
  },
  reputation: {
    title: "Online Reputation",
    whatItMeans:
      "Your online reputation is how the world sees your business before they ever walk in the door. 93% of customers read reviews before choosing a restaurant. A 0.5-star difference on Google can mean 20-30% more or fewer customers finding you. PrimeOS monitors every platform so you see what your customers are saying — and what they're saying about your competitors.",
    whenRedPlaybook: [
      "Consider responding to every negative review within 24 hours — a professional response builds trust with everyone who reads it later",
      "Consider that 1-star reviews hurt less when diluted by hundreds of 5-star reviews — focus on volume",
      "Consider asking happy customers to review you — a receipt note, counter sign, or delivery follow-up text can double your review rate",
      "Consider monitoring competitor reviews for complaints you can address in your marketing — their weakness is your opportunity",
      "Consider that AI assistants like ChatGPT now recommend restaurants based on review data — more reviews and higher ratings mean more AI referrals",
    ],
  },
  wins: {
    title: "Win Notifications",
    whatItMeans:
      "PrimeOS doesn't just tell you when something's wrong — it celebrates when something's right. Win Notifications detect improvements in your numbers automatically: food cost dropping, sales records, tracking streaks, and milestones. Every operator needs wins to stay motivated. The numbers tell the story — and sometimes the story is good.",
    whenRedPlaybook: [
      "Consider checking your wins every morning — they're proof that your effort is working",
      "Consider sharing wins with your team — 'We hit a new sales record Saturday' builds morale",
      "Consider that streaks matter more than spikes — consistency beats one good day",
      "Consider using milestone wins as team celebration moments — pizza party at 90 days of tracking",
      "Consider that the best operators have more green days than red days — wins compound over time",
    ],
  },
  daily_edge: {
    title: "The Daily Edge",
    whatItMeans:
      "The Daily Edge is your personal data briefing. Every day, PrimeOS reads your actual store numbers — sales, food cost, labor hours, overtime, vendor spend, delivery economics, Google ratings — and surfaces what changed, what is trending, and what the math says. This is not generic content. These are your numbers, your trends, your locations. When FoodTec and Hillcrest data connect, every number becomes real-time. Until then, PrimeOS uses realistic baseline data so you can see exactly how it works. Live industry articles from PMQ Pizza Magazine, Pizza Marketplace, and Nation's Restaurant News are pulled every morning at 6am and shown at the top of your feed with a LIVE badge.",
    whyItMatters:
      "The operators who win are the ones who see what changed before it becomes a problem. A food cost spike caught on day one costs you $45. Caught on day thirty, it cost you $1,350. The Daily Edge puts the signal in front of you every morning so nothing hides. PrimeOS does not tell you what to do. It shows you the data and the math. You make the call.",
    whenRedPlaybook: [
      "The Daily Edge rotates different data scoops every day based on what your numbers are doing — food cost trends, labor hours, overtime, vendor spend, delivery mix, ticket averages, and cross-location comparisons",
      "Each scoop is pure math from your stores — no opinions, no advice, just facts and trends so you can make your own decisions",
      "Live industry articles from PMQ, Pizza Marketplace, and NRN appear at the top with an orange LIVE badge — these are real articles from the most trusted pizza publications, filtered for what matters to independent operators",
      "The data scoops change every day because your numbers change every day — open The Daily Edge every morning and you will never see the same feed twice",
      "Tap any card to expand the full breakdown with detailed math showing exactly how the numbers were calculated",
    ],
  },
  inspection_radar: {
    title: "Health Inspection Radar",
    whatItMeans:
      "Health inspectors in Ohio work in territories and follow routes. When multiple restaurants near you get inspected in a short period, the inspector is likely working through your area. PrimeOS tracks publicly posted inspection records from Portage County and Stark County and calculates whether activity near your location is above normal. Ohio uses a violations-based system — inspectors document critical and non-critical violations, not a point score. Critical violations are those more likely to contribute to foodborne illness if left uncorrected.",
    whenRedPlaybook: [
      "Consider running through the Pre-Inspection Checklist with your team before every shift when the threat level is elevated or higher",
      "Consider that the most common critical violations in pizza restaurants are temperature control, handwashing access, and date labeling — all preventable with daily habits",
      "Consider that inspection records are public — your customers, competitors, and local media can see them anytime",
      "Consider assigning one person per shift to do a quick walk-through of the checklist items — it takes 5 minutes and builds the habit",
      "Consider that correcting violations on site during an inspection shows responsiveness — inspectors note this positively",
    ],
  },

  operator_score: {
    title: "Operator Score",
    whatItMeans:
      "Your Operator Score is a composite of everything PrimeOS tracks — financial performance, online reputation, operational consistency, vendor health, and team systems. It's weighted to reflect what matters most to the long-term health of an independent pizzeria. A single number that tells you how the whole business is doing, not just one piece of it.",
    whenRedPlaybook: [
      "Consider focusing on the lowest-scoring category first — small improvements in a weak area move the needle more than perfecting a strong one",
      "Consider that consistency matters more than perfection — operators who track daily and stay aware tend to improve steadily over weeks",
      "Consider that reputation is 20% of your score because it directly affects whether new customers walk through the door",
      "Consider reviewing your vendor health quarterly — pricing drift is invisible until you look at the trend",
      "Consider that operators who track all five dimensions consistently tend to make faster, more confident decisions about their business — whether that's growing, optimizing, or planning their next chapter",
    ],
  },

  valuation: {
    title: "Business Valuation",
    whatItMeans:
      "This is an estimate of what your business could be worth based on restaurant industry standards published by BizBuySell, SCORE, and the U.S. Small Business Administration. It uses Seller's Discretionary Earnings (SDE) — what the business generates for its owner — multiplied by industry-standard factors. SDE multiples for independent restaurants typically range from 1.5× to 3.5× depending on operating history, locations, cost efficiency, and systems. The range reflects the variability that exists in any real-world valuation. This is informational only — not an appraisal.",
    whenRedPlaybook: [
      "Consider that knowing your valuation isn't just about selling — it shows you what you've actually built in concrete terms",
      "Consider that PRIME cost is the single biggest lever on your valuation — every point you reduce it increases your SDE directly",
      "Consider that multiple locations, strong systems, and operating history all increase buyer confidence and therefore your multiple — these are documented factors that BizBuySell and SCORE track",
      "Consider that reputation directly affects valuation — businesses with strong online ratings command higher multiples according to industry brokerages",
      "Consider that some operators use this number as a goal. Others use it as a starting point for a conversation. Either way — now you know",
    ],
  },

  todays_sales: {
    title: "Today's Sales",
    whatItMeans:
      "Total revenue collected today from all channels — dine-in, takeout, delivery, catering.",
    whyItMatters:
      "Daily sales drive everything. A $200 drop per day is $6,000 per month and $73,000 per year. Knowing your daily number lets you spot trends before they become problems.",
    whenRedPlaybook: [
      "Consider comparing today to the same day last week. Tuesdays should beat Tuesdays. If they don't, something changed.",
    ],
  },
  food_cost_pct: {
    title: "Food Cost %",
    whatItMeans:
      "How much of every dollar you collect goes to food and disposable supplies. If your Food Cost is 33%, you spend 33 cents on ingredients for every dollar of sales.",
    whyItMatters:
      "Every 1% over target on a $1M store costs $10,000 per year. Most operators don't know their real food cost until the end of the month — by then, the money is gone.",
    whenRedPlaybook: [
      "Consider tracking your top 5 ingredients by dollar spend weekly. That's where the leaks usually hide. Industry benchmark: 28-33%.",
    ],
  },
  labor_pct_home: {
    title: "Labor %",
    whatItMeans:
      "How much of every dollar goes to paying your team — wages, taxes, benefits. If Labor is 28%, you spend 28 cents per sales dollar on labor.",
    whyItMatters:
      "Labor is usually your second biggest expense after food. A 2% overage on a $1.5M store is $30,000 per year — enough to hire another part-timer.",
    whenRedPlaybook: [
      "Consider reviewing your schedule against your sales forecast. Overstaffing slow shifts is the most common labor leak. Industry benchmark: 25-30%.",
    ],
  },
  prime_pct: {
    title: "PRIME %",
    whatItMeans:
      "What's left after you subtract Food Cost and Labor from your sales. PRIME stands for Profit Remaining After Ingredients, Materials, and Employees. This is the money available to cover rent, utilities, and profit.",
    whyItMatters:
      "PRIME is the truest measure of how efficiently you run your store. Two stores can have the same sales but completely different PRIME numbers based on how tight they run.",
    whenRedPlaybook: [
      "Consider tracking PRIME weekly, not monthly. Monthly is too late to adjust. Industry benchmark: 55-65%.",
    ],
  },
  needs_attention: {
    title: "Needs Attention",
    whatItMeans:
      "A metric that has crossed into the red zone — it's significantly outside your target range and needs immediate review.",
    whyItMatters:
      "Red alerts mean real money is being lost right now. Each day a metric stays red compounds the cost.",
    whenRedPlaybook: [
      "Consider addressing red alerts the same day they appear. Check the playbook on the specific metric for action steps.",
    ],
  },
  keep_an_eye_on: {
    title: "Keep an Eye On",
    whatItMeans:
      "A metric that is drifting toward the danger zone — not red yet, but trending in the wrong direction.",
    whyItMatters:
      "Amber alerts are early warnings. Catching them now prevents them from becoming red alerts next week.",
    whenRedPlaybook: [
      "Consider checking amber metrics daily for the next 3-5 days. If the trend continues, dig deeper.",
    ],
  },
  all_good_today: {
    title: "All Good Today",
    whatItMeans:
      "A metric that is at or better than your target. Green means your operation is running well in this area.",
    whyItMatters:
      "Green doesn't mean ignore it — it means keep doing what you're doing. Consistency is what separates good operators from great ones.",
    whenRedPlaybook: [
      "Consider noting what's working when you see green. Those habits are worth protecting.",
    ],
  },
  net_sales: {
    title: "Net Sales",
    whatItMeans:
      "Total revenue after refunds, voids, and discounts. This is the real money that came in the door today.",
    whyItMatters:
      "Net Sales is the starting point for every other calculation. If this number is wrong, everything below it — Food Cost %, Labor %, PRIME — will be wrong too.",
    whenRedPlaybook: [
      "Consider comparing Net Sales to the same day last week and last year. Patterns tell you more than single numbers.",
    ],
  },
  customer_count: {
    title: "Customer Count",
    whatItMeans:
      "Total number of transactions (tickets) for the day. One family ordering together is one transaction.",
    whyItMatters:
      "Customer count tells you traffic trends. If sales are flat but customer count is dropping, your average ticket is going up — which could mean price increases are working but you're losing bodies.",
    whenRedPlaybook: [
      "Consider tracking customer count by daypart (lunch vs dinner). A slow lunch with a strong dinner tells a different story than even traffic all day.",
    ],
  },
  average_ticket: {
    title: "Average Ticket",
    whatItMeans:
      "Net Sales divided by Customer Count. How much the average customer spends per visit.",
    whyItMatters:
      "Raising average ticket by $1 across 100 daily customers is $36,500 per year in extra revenue with zero extra marketing cost.",
    whenRedPlaybook: [
      "Consider upsell training for your team. A simple \"Would you like to add...\" can move average ticket $0.50-$1.50 without changing your menu. Industry benchmark varies by concept.",
    ],
  },
  rplh: {
    title: "RPLH (Revenue Per Labor Hour)",
    whatItMeans:
      "Net Sales divided by total labor hours worked. How much revenue each labor hour generates. If RPLH is $45, every hour of labor on the schedule produced $45 in sales.",
    whyItMatters:
      "RPLH is the best single number for measuring labor efficiency. A store doing $45 RPLH is getting more out of every scheduled hour than a store doing $35.",
    whenRedPlaybook: [
      "Consider targeting $40-$50 RPLH depending on your concept. If RPLH drops below $35, you're likely overstaffed for the volume. Industry benchmark: $40-$55.",
    ],
  },
  morning_brief: {
    title: "Morning Brief",
    whatItMeans:
      "An AI-generated summary of yesterday's business performance. It highlights what went well, what needs attention, and what changed from the day before.",
    whyItMatters:
      "The Brief saves you from digging through numbers every morning. In 60 seconds you know where you stand and what to focus on today.",
    whenRedPlaybook: [
      "Consider reading the Brief before your first shift meeting. It gives you one or two talking points to share with your team.",
    ],
  },
  wow_pct_change: {
    title: "WoW % Change (Week-over-Week)",
    whatItMeans:
      "The percentage change in a metric compared to the same metric last week. If Food Cost was 32% last week and 34% this week, WoW change is +2%.",
    whyItMatters:
      "Weekly trends are more reliable than daily swings. One bad day can spike a number, but a bad week is a pattern that needs attention.",
    whenRedPlaybook: [
      "Consider using WoW trends to catch problems in their first week, not their first month. A metric moving the wrong direction for two weeks in a row is a signal.",
    ],
  },
  revenue_pl: {
    title: "Revenue",
    whatItMeans:
      "Total money collected from all sales channels before any expenses are subtracted. Also called Top Line.",
    whyItMatters:
      "Revenue is the starting point but it's not profit. A store doing $100K/month in revenue can still lose money if costs aren't controlled.",
    whenRedPlaybook: [
      "Consider tracking revenue by channel — dine-in, delivery, catering. Knowing where the money comes from helps you invest in the right areas.",
    ],
  },
  cogs_pl: {
    title: "COGS (Cost of Goods Sold)",
    whatItMeans:
      "The total cost of all food, beverages, and disposable supplies used to generate your sales. This is what it costs to make what you sell.",
    whyItMatters:
      "COGS is the biggest controllable expense in most restaurants. A 2% improvement on a $1M store saves $20,000 per year.",
    whenRedPlaybook: [
      "Consider doing weekly inventory counts on your top 10 items by cost. That's where most waste and variance hides. Industry benchmark: 28-33% of revenue.",
    ],
  },
  gross_profit_pl: {
    title: "Gross Profit",
    whatItMeans:
      "Revenue minus COGS. The money left after paying for the food and supplies that made the sales. This is not your take-home — rent, labor, and other expenses still come out.",
    whyItMatters:
      "Gross Profit tells you how much room you have to cover all your other expenses. If Gross Profit is thin, no amount of cost-cutting elsewhere will save you.",
    whenRedPlaybook: [
      "Consider tracking Gross Profit by week, not just by month. If Gross Profit drops mid-month, you have time to adjust before the month closes.",
    ],
  },
  gross_profit_margin_pct: {
    title: "Gross Profit Margin %",
    whatItMeans:
      "Gross Profit divided by Revenue, shown as a percentage. If you keep 67 cents from every dollar after paying for food, your Gross Profit Margin is 67%.",
    whyItMatters:
      "This tells you how efficiently you turn ingredients into revenue. Two stores with the same revenue can have very different Gross Profit Margins based on menu pricing and waste.",
    whenRedPlaybook: [
      "Consider comparing your margin across locations and over time. A declining margin with stable sales often means vendor prices crept up. Industry benchmark: 65-72%.",
    ],
  },
  net_profit_pl: {
    title: "Net Profit",
    whatItMeans:
      "What's left after ALL expenses — food, labor, rent, utilities, insurance, everything. This is the actual money the business earned (or lost).",
    whyItMatters:
      "Net Profit is the final scorecard. Everything above this line is a lever you can pull to improve it.",
    whenRedPlaybook: [
      "Consider targeting 8-12% Net Profit Margin. Below 5% means the business is fragile — one bad month could tip you into a loss.",
    ],
  },
  net_profit_margin_pct: {
    title: "Net Profit Margin %",
    whatItMeans:
      "Net Profit divided by Revenue, shown as a percentage. If you keep 10 cents of actual profit from every dollar of sales, your Net Profit Margin is 10%.",
    whyItMatters:
      "This is the number that determines whether the business is healthy, surviving, or bleeding. It accounts for everything.",
    whenRedPlaybook: [
      "Consider that most independent pizzerias operate between 5-15% Net Profit Margin. If you're below 5%, focus on the biggest expense categories first. Industry benchmark: 8-12%.",
    ],
  },
  the_gap: {
    title: "The Gap",
    whatItMeans:
      "The difference between your theoretical costs (what you should have spent based on sales) and your actual costs (what you really spent). The Gap represents waste, theft, portioning errors, or unrecorded discounts.",
    whyItMatters:
      "The Gap is hidden money. A 3% Gap on a $1M store is $30,000 per year walking out the door without showing up on any receipt.",
    whenRedPlaybook: [
      "Consider doing a weekly variance check on your top 5 items. If cheese has a 5% gap, that's portioning or waste — and it's fixable.",
    ],
  },
  seasonal_variation: {
    title: "Seasonal Variation",
    whatItMeans:
      "How your sales and costs change throughout the year based on predictable patterns — summer slumps, holiday spikes, school schedules, weather.",
    whyItMatters:
      "Knowing your seasonal pattern prevents panic. A 15% sales drop in January isn't a crisis if it happens every January. But a 15% drop in your peak month is a real problem.",
    whenRedPlaybook: [
      "Consider planning labor and inventory around your seasonal patterns, not your best month. Overstaffing for volume that isn't coming is one of the biggest controllable leaks.",
    ],
  },
  daily_sales_breakdown: {
    title: "Daily Sales Breakdown",
    whatItMeans:
      "A day-by-day view of your sales for the selected period. Shows how much revenue came in each day.",
    whyItMatters:
      "The breakdown reveals your strong days and weak days. Most operators overestimate how even their sales are — usually 2-3 days drive the majority of weekly revenue.",
    whenRedPlaybook: [
      "Consider scheduling your strongest team on your highest-volume days. Your best Friday crew should not be your Monday crew.",
    ],
  },
  effective_commission_pct: {
    title: "Effective Commission %",
    whatItMeans:
      "The actual percentage of each delivery order that goes to the delivery platform (DoorDash, UberEats, Slice, etc.) after all fees, commissions, and charges. This is the real cost, not just the advertised rate.",
    whyItMatters:
      "Most platforms advertise 15-30% commission, but the effective rate after all fees is often higher. A 30% effective commission means you keep only 70 cents of every delivery dollar.",
    whenRedPlaybook: [
      "Consider calculating your effective commission monthly. If the real rate is above 25%, compare whether direct delivery or a lower-cost platform would save money.",
    ],
  },
  net_after_fees: {
    title: "Net After Fees",
    whatItMeans:
      "The dollar amount you actually keep from delivery orders after the platform takes its cut. If a $30 order has 28% effective commission, your Net After Fees is $21.60.",
    whyItMatters:
      "This is the real revenue from delivery. Many operators look at gross delivery sales and think they're doing well, but Net After Fees tells the true story.",
    whenRedPlaybook: [
      "Consider comparing Net After Fees per platform. One platform might have higher gross sales but lower net — that matters.",
    ],
  },
  delivery_mix_pct: {
    title: "Delivery Mix %",
    whatItMeans:
      "What percentage of your total sales come from delivery platforms vs dine-in, takeout, and other channels.",
    whyItMatters:
      "A high delivery mix means a large portion of your revenue is subject to platform fees. If 40% of sales are delivery at 25% commission, 10% of your total revenue goes to platforms.",
    whenRedPlaybook: [
      "Consider whether marketing direct ordering could shift some delivery volume to a lower-cost channel. Even shifting 5% of delivery to direct saves thousands annually.",
    ],
  },
  price_movers: {
    title: "Price Movers",
    whatItMeans:
      "Items from your vendors that changed in price recently — up or down. These are ingredients or supplies where the cost shifted compared to your last order.",
    whyItMatters:
      "Vendor price increases are silent profit killers. A 3% increase on your top cheese that you don't catch costs hundreds per month without a single thing changing on your menu.",
    whenRedPlaybook: [
      "Consider reviewing Price Movers weekly. If a key item goes up, check if a comparable product is available at the old price. Industry benchmark: keep total vendor spend increases under 2% per quarter.",
    ],
  },
  annual_spend: {
    title: "Annual Spend",
    whatItMeans:
      "The total dollar amount spent with each vendor over the past 12 months. Shows which vendors get the biggest share of your money.",
    whyItMatters:
      "Knowing your annual spend per vendor gives you leverage. A vendor getting $80,000 per year from you has a reason to keep you happy and keep prices competitive.",
    whenRedPlaybook: [
      "Consider reviewing your top 3 vendors by annual spend quarterly. That is where small percentage savings have the biggest dollar impact.",
    ],
  },
  cc_processing_quoted_vs_actual: {
    title: "Quoted vs Actual Rate",
    whatItMeans:
      "Quoted Rate is what your credit card processor promised you. Actual Rate is what you are really paying — total fees divided by total volume. These are often different.",
    whyItMatters:
      "Credit card processing is a $3,000-$8,000 annual expense for most independents. A 0.3% gap between quoted and actual rate on $1M in card volume is $3,000 per year.",
    whenRedPlaybook: [
      "Consider pulling your monthly processing statement and dividing total fees by total volume. If actual is more than 0.2% above quoted, call your processor and ask why.",
    ],
  },
  actual_food_cost: {
    title: "Actual Food Cost",
    whatItMeans:
      "What you ACTUALLY spent on food and disposables, calculated from invoices and inventory counts. This is the real number — what left your bank account.",
    whyItMatters:
      "Actual food cost is truth. It includes every mistake, every wasted batch, every over-portioned pizza, every comp that was not recorded properly.",
    whenRedPlaybook: [
      "Consider doing beginning and ending inventory counts weekly (not monthly) for your top 10 items. Weekly counts catch problems in days, not weeks.",
    ],
  },
  variance_gap: {
    title: "Variance Gap",
    whatItMeans:
      "The difference between your Theoretical Food Cost and your Actual Food Cost. If theoretical is 30% and actual is 34%, your Variance Gap is 4%.",
    whyItMatters:
      "Every 1% of variance on a $1M store is $10,000 per year in preventable loss. A 3-4% gap is common but fixable. A 5%+ gap means something significant is wrong.",
    whenRedPlaybook: [
      "Consider investigating the gap by category. If cheese variance is 6% but sauce is 1%, the problem is cheese — not everything. Focus fixes on the biggest gaps first.",
    ],
  },
  cross_location_comparison: {
    title: "Cross-Location Comparison",
    whatItMeans:
      "Side-by-side view of the same metric across your different store locations. Shows how each store performs on the same measure.",
    whyItMatters:
      "Cross-location comparison reveals which store runs tightest and which has the most room to improve. If Kent runs 31% food cost and Aurora runs 35%, Aurora has a $40,000 annual opportunity.",
    whenRedPlaybook: [
      "Consider sharing best practices from your best-performing store with the others. Often the gap is a process difference, not a people difference.",
    ],
  },
  menu_item_margin: {
    title: "Menu Item Margin",
    whatItMeans:
      "The profit margin on a single menu item — the difference between what you charge and what the ingredients cost you, shown as a percentage.",
    whyItMatters:
      "Not all menu items are created equal. A $15 pizza with 60% margin makes you $9. A $12 sub with 40% margin makes you $4.80. Selling more of the high-margin items changes everything.",
    whenRedPlaybook: [
      "Consider highlighting your top 5 highest-margin items for your team. If they suggest those items first, your mix shifts toward more profit with the same number of customers.",
    ],
  },
  menu_gap_pct: {
    title: "Menu Gap %",
    whatItMeans:
      "The percentage difference between your menu price and the price needed to hit your target food cost on that item. A 15%+ gap means the item is significantly underpriced relative to its ingredient cost.",
    whyItMatters:
      "Menu items with large gaps are quietly draining your margins every time they sell. A popular item with a 20% gap is worse than an unpopular item with the same gap.",
    whenRedPlaybook: [
      "Consider adjusting prices on items with 15%+ gaps, starting with your highest-volume items. A $0.50 increase on an item you sell 40 times a day is $7,300 per year.",
    ],
  },
  menu_compare: {
    title: "Menu Compare",
    whatItMeans:
      "Side-by-side comparison of the same menu item across your locations. Shows if pricing, cost, or margin differs between stores.",
    whyItMatters:
      "If the same pizza is $14 at Kent and $12 at Aurora, one store is leaving money on the table. Menu consistency across locations protects your brand and your margins.",
    whenRedPlaybook: [
      "Consider standardizing menu prices across locations unless there is a specific market reason for the difference.",
    ],
  },
  review_count: {
    title: "Review Count",
    whatItMeans:
      "The total number of Google reviews your business has received. More reviews generally means more visibility in search results.",
    whyItMatters:
      "Review count is a trust signal. A store with 400 reviews at 4.3 stars appears more trustworthy than a store with 20 reviews at 4.8 stars. Volume matters.",
    whenRedPlaybook: [
      "Consider asking satisfied customers to leave a review. A simple table card or receipt message can increase review flow by 200-300%.",
    ],
  },
  competitor_price_comparison: {
    title: "Competitor Price Comparison",
    whatItMeans:
      "A comparison of your menu prices against nearby competitors for similar items. Shows where you are priced higher, lower, or in line with the market.",
    whyItMatters:
      "Pricing too low leaves money on the table. Pricing too high without justification loses customers. Knowing where you stand helps you price with confidence.",
    whenRedPlaybook: [
      "Consider that being the cheapest is not a strategy for independents. Competing on quality, speed, and experience lets you price 10-15% above chains.",
    ],
  },
  overtime_warning: {
    title: "Overtime Warning",
    whatItMeans:
      "A flag that appears when an employee is approaching or has exceeded 40 hours in a work week. Overtime means paying 1.5x their normal rate for every extra hour.",
    whyItMatters:
      "Unplanned overtime is one of the most expensive labor leaks. One employee working 5 hours of overtime per week at $15/hour costs an extra $1,950 per year — and most stores have multiple employees doing it.",
    whenRedPlaybook: [
      "Consider setting a 38-hour soft cap so managers can adjust before overtime hits. Two hours of buffer prevents expensive surprises.",
    ],
  },
  labor_hours: {
    title: "Labor Hours",
    whatItMeans:
      "The total number of hours worked by all employees in a given period. This drives your labor cost and your RPLH calculation.",
    whyItMatters:
      "Labor hours are the lever you control most directly. Unlike food cost, which depends partly on vendors, labor hours are 100% your scheduling decision.",
    whenRedPlaybook: [
      "Consider reviewing total labor hours against sales volume weekly. If sales dropped 10% but hours stayed the same, you overstaffed.",
    ],
  },
  completion_rate: {
    title: "Completion Rate",
    whatItMeans:
      "The percentage of assigned tasks that were completed on time. If 8 out of 10 tasks were done, completion rate is 80%.",
    whyItMatters:
      "Completion rate tells you how reliably your team follows through. A store running 60% completion rate has accountability gaps that affect food safety, cleanliness, and consistency.",
    whenRedPlaybook: [
      "Consider reviewing completion rate weekly with your managers. The goal is not 100% every day — it is a consistent upward trend. Industry benchmark: 85%+.",
    ],
  },
  employee_acquisition_cost: {
    title: "Employee Acquisition Cost",
    whatItMeans:
      "How much it costs to hire one new employee — job posting fees, interview time, training hours, uniforms, and onboarding materials, all added up.",
    whyItMatters:
      "In the restaurant industry, replacing one hourly employee can cost $1,500-$3,500. High turnover multiplies this cost quickly — a store replacing 10 people per year could spend $15,000-$35,000 just on hiring.",
    whenRedPlaybook: [
      "Consider that reducing turnover by even 2-3 employees per year saves more than most raises would cost. Retention is cheaper than recruitment.",
    ],
  },
  employee_tenure: {
    title: "Employee Tenure",
    whatItMeans:
      "How long each employee has been with you, measured from their hire date. Longer tenure generally means more experience and lower replacement costs.",
    whyItMatters:
      "Employees who stay longer make fewer mistakes, train new hires, and require less supervision. A team with average tenure over 12 months runs significantly smoother than one with 4-month average tenure.",
    whenRedPlaybook: [
      "Consider recognizing tenure milestones — 6 months, 1 year, 2 years. Small recognition keeps good people longer.",
    ],
  },
  employee_churn: {
    title: "Employee Churn",
    whatItMeans:
      "The rate at which employees leave your business over a given period. If you start the year with 20 employees and 8 leave, your annual churn is 40%.",
    whyItMatters:
      "Restaurant industry average churn is 75-100% annually. Every percentage point below that is money saved on hiring and training, and quality gained from experienced staff.",
    whenRedPlaybook: [
      "Consider tracking why people leave. If the top reason is scheduling, that is fixable. If it is pay, do a market comparison. Industry benchmark: aim for under 60% annual churn.",
    ],
  },
  pay_rate: {
    title: "Pay Rate",
    whatItMeans:
      "The hourly wage or salary paid to each employee. This is the base rate before overtime, tips, or benefits.",
    whyItMatters:
      "Pay rate directly affects your ability to attract and retain good employees. Being $1-2 below market rate can double your turnover — costing far more than the raise would have.",
    whenRedPlaybook: [
      "Consider checking local market rates for similar positions quarterly. What was competitive 6 months ago may not be today.",
    ],
  },
  sentiment_score: {
    title: "Sentiment Score",
    whatItMeans:
      "An overall score representing how customers feel about your business based on review text analysis. Positive, neutral, and negative sentiments are aggregated into one number.",
    whyItMatters:
      "Sentiment goes deeper than star ratings. A 4-star review with negative sentiment in the text (like complaints about wait time) tells a different story than a 4-star review praising the food.",
    whenRedPlaybook: [
      "Consider reading your most recent negative reviews for patterns. If three people mention the same issue, that is not a coincidence — it is a fixable problem.",
    ],
  },
  response_rate: {
    title: "Response Rate",
    whatItMeans:
      "The percentage of customer reviews you have responded to publicly. If you have 100 reviews and responded to 62, your response rate is 62%.",
    whyItMatters:
      "Responding to reviews shows potential customers you care. Google's algorithm also favors businesses that actively engage with reviews. A 80%+ response rate signals a well-managed business.",
    whenRedPlaybook: [
      "Consider responding to every review within 48 hours. Keep responses professional and brief. Thank positive reviewers, address concerns in negative reviews without being defensive. Industry benchmark: 80%+.",
    ],
  },
  ai_visibility_score: {
    title: "AI Visibility Score",
    whatItMeans:
      "A score representing how visible and accurately represented your business is in AI search results — tools like ChatGPT, Google AI Overview, and Perplexity that customers increasingly use to find restaurants.",
    whyItMatters:
      "AI search is growing fast. If an AI assistant recommends the pizza place down the street instead of you, you are losing customers you never knew existed. AI visibility is the new SEO.",
    whenRedPlaybook: [
      "Consider making sure your Google Business Profile is complete with current hours, photos, menu, and accurate categories. AI tools pull heavily from Google data.",
    ],
  },
  platform_breakdown: {
    title: "Platform Breakdown",
    whatItMeans:
      "A breakdown of your reviews and ratings by platform — Google, Yelp, Facebook, TripAdvisor. Shows where customers are talking about you and how ratings differ across platforms.",
    whyItMatters:
      "Your reputation is not just Google. Some customers check Yelp, others check Facebook. A 4.5 on Google with a 3.2 on Yelp sends mixed signals.",
    whenRedPlaybook: [
      "Consider claiming and updating your profile on all platforms, even ones you do not actively use. An abandoned profile with outdated info hurts more than no profile at all.",
    ],
  },
  market_comparison: {
    title: "Market Comparison",
    whatItMeans:
      "How your ratings and review metrics compare to other restaurants in your local market area. Shows where you rank against nearby competitors.",
    whyItMatters:
      "Context matters. A 4.2 rating in a market where the average is 3.8 means you are outperforming. A 4.2 in a market where competitors average 4.5 means you are behind.",
    whenRedPlaybook: [
      "Consider focusing less on your absolute score and more on the gap between you and your top local competitors. Closing that gap is what drives customer choice.",
    ],
  },
  gl_categories: {
    title: "GL Categories",
    whatItMeans:
      "General Ledger categories are the buckets your business expenses are sorted into — like Food and Beverage, Labor, Occupancy, Marketing, Utilities, Insurance, and more. Each category groups similar expenses together.",
    whyItMatters:
      "Categorizing expenses correctly is the foundation of understanding where your money goes. If expenses are in the wrong category, your percentages and benchmarks are meaningless.",
    whenRedPlaybook: [
      "Consider reviewing your GL categories quarterly to make sure new expenses are landing in the right bucket. A common mistake is lumping paper goods into food cost when they should be a separate category.",
    ],
  },
  vendor_matching: {
    title: "Vendor Matching",
    whatItMeans:
      "The process of matching each invoice to the correct vendor in your system. This ensures expenses are tracked to the right supplier and category.",
    whyItMatters:
      "Unmatched or mismatched invoices create blind spots in your vendor spend data. If invoices are not matched, your Vendor Tracker numbers will be incomplete.",
    whenRedPlaybook: [
      "Consider matching invoices the same day they arrive. A weekly backlog of unmatched invoices means a week of incomplete data.",
    ],
  },
  risk_score: {
    title: "Risk Score",
    whatItMeans:
      "A score estimating your likelihood of receiving a health inspection based on local inspection patterns, your last inspection date, and county activity levels.",
    whyItMatters:
      "Health inspections are not random — they follow patterns. Knowing when inspectors are active in your area lets you stay prepared instead of scrambling.",
    whenRedPlaybook: [
      "Consider running through the pre-inspection checklist monthly, not just when you think an inspection is coming. Consistent standards mean you are always ready.",
    ],
  },
  campaign_roi: {
    title: "Campaign ROI",
    whatItMeans:
      "Return on Investment for a marketing campaign. How much revenue a campaign generated compared to what it cost. If you spent $500 and generated $2,000 in attributed sales, your ROI is 4x or 300%.",
    whyItMatters:
      "Not all marketing is equal. A $200 Facebook ad that brings in $1,500 is a better investment than a $1,000 mailer that brings in $1,200. ROI tells you where to put your next dollar.",
    whenRedPlaybook: [
      "Consider tracking ROI per channel — social, print, email, local events. Double down on what works and cut what does not.",
    ],
  },
  marketing_cac: {
    title: "Marketing CAC",
    whatItMeans:
      "Customer Acquisition Cost for marketing — how much you spent in marketing to get one new customer. Total marketing spend divided by number of new customers acquired.",
    whyItMatters:
      "If your CAC is $8 and a new customer's first order is $22, you made money on the first visit. If CAC is $25 and the first order is $15, you need that customer to come back twice just to break even.",
    whenRedPlaybook: [
      "Consider that a healthy CAC for pizza is $5-$15 per new customer. Above that, the channel may not be efficient enough. Industry benchmark: $5-$15.",
    ],
  },
};
