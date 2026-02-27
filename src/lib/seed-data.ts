/**
 * Realistic demo seed data for Angelo's 3 locations.
 * All numbers are internally consistent: daily → weekly, P&L math, ROAS, etc.
 * Use when no Supabase data is available (demo / offline mode).
 */

// ============ STORES ============
export const SEED_STORES = [
  { id: "kent", name: "LeeAngelo's Kent", slug: "kent", avgDailySales: 5200 },
  { id: "aurora", name: "LeeAngelo's Aurora", slug: "aurora", avgDailySales: 3800 },
  { id: "lindseys", name: "Lindsey's", slug: "lindseys", avgDailySales: 2600 },
] as const;

/** Per-store KPI targets (Food Cost %, Labor %, PRIME % max). Used for grading and alerts. */
export type StoreBenchmarks = {
  foodCostTargetPct: number;
  laborTargetPct: number;
  primeTargetPct: number;
};

export const STORE_BENCHMARKS: Record<string, StoreBenchmarks> = {
  kent: { foodCostTargetPct: 33, laborTargetPct: 28, primeTargetPct: 55 },
  aurora: { foodCostTargetPct: 33, laborTargetPct: 28, primeTargetPct: 55 },
  lindseys: { foodCostTargetPct: 35, laborTargetPct: 30, primeTargetPct: 58 },
};

// ============ HELPERS ============
function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function dayOfWeek(dateStr: string): number {
  return new Date(dateStr + "T12:00:00Z").getUTCDay(); // 0 Sun, 1 Mon, ...
}

// ============ DAILY KPIs (last 30 days — Kent) ============
export type SeedDailyKpi = {
  date: string;
  store_id: string;
  sales: number;
  transactions: number;
  food_cost_pct: number;
  labor_pct: number;
  prime_pct: number;
  slph: number;
  ticket_avg: number;
  food_dollars: number;
  labor_dollars: number;
};

function buildDailyKpis(): SeedDailyKpi[] {
  const rows: SeedDailyKpi[] = [];
  // Story: food spiked around day 18 (mid-month, cheese price), corrected after day 22 (portioning audit)
  for (let i = 29; i >= 0; i--) {
    const date = daysAgo(i);
    const dow = dayOfWeek(date);
    const isWeekend = dow === 5 || dow === 6; // Fri, Sat
    const isMonday = dow === 1;
    let sales: number;
    if (isMonday) sales = 4200 + Math.round(Math.random() * 400);
    else if (isWeekend) sales = 5800 + Math.round(Math.random() * 1000);
    else sales = 4800 + Math.round(Math.random() * 800);
    const transactions = Math.round(180 + (sales - 4200) / 25 + (Math.random() * 40 - 20));
    const ticket_avg = Math.round((sales / transactions) * 100) / 100;

    const dayIndex = 29 - i;
    let food_cost_pct: number;
    if (dayIndex >= 12 && dayIndex <= 18) food_cost_pct = 33 + Math.random() * 2.2; // spike
    else if (dayIndex >= 22) food_cost_pct = 28.5 + Math.random() * 2; // corrected
    else food_cost_pct = 28.1 + Math.random() * 4;
    food_cost_pct = Math.round(food_cost_pct * 10) / 10;

    let labor_pct: number;
    if (isWeekend) labor_pct = 21 + Math.random() * 2.5;
    else if (isMonday) labor_pct = 24 + Math.random() * 2.1;
    else labor_pct = 20.8 + Math.random() * 3;
    labor_pct = Math.round(labor_pct * 10) / 10;

    const food_dollars = Math.round((sales * food_cost_pct) / 100 * 100) / 100;
    const labor_dollars = Math.round((sales * labor_pct) / 100 * 100) / 100;
    const disposables_pct = 3.5;
    const disposables_dollars = Math.round(sales * (disposables_pct / 100) * 100) / 100;
    const prime_dollars = food_dollars + labor_dollars + disposables_dollars;
    const prime_pct = Math.round((prime_dollars / sales) * 1000) / 10;

    const labor_hours = Math.round((labor_dollars / 14.5) * 10) / 10; // ~$14.50 avg rate
    const slph = labor_hours > 0 ? Math.round((sales / labor_hours) * 10) / 10 : 0;

    rows.push({
      date,
      store_id: "kent",
      sales,
      transactions,
      food_cost_pct,
      labor_pct,
      prime_pct,
      slph,
      ticket_avg,
      food_dollars,
      labor_dollars,
    });
  }
  // Patch yesterday to match morning brief exactly (internal consistency)
  const yesterday = daysAgo(1);
  const idx = rows.findIndex((r) => r.date === yesterday);
  if (idx >= 0) {
    const sales = 5420;
    const transactions = 287;
    const food_cost_pct = 30.8;
    const labor_pct = 23.1;
    const food_dollars = Math.round(sales * (food_cost_pct / 100) * 100) / 100;
    const labor_dollars = Math.round(sales * (labor_pct / 100) * 100) / 100;
    const ticket_avg = Math.round((sales / transactions) * 100) / 100;
    const disposables = Math.round(sales * 0.035 * 100) / 100;
    const prime_pct = Math.round(((food_dollars + labor_dollars + disposables) / sales) * 1000) / 10;
    const labor_hours = Math.round((labor_dollars / 14.5) * 10) / 10;
    const slph = labor_hours > 0 ? Math.round((sales / labor_hours) * 10) / 10 : 0;
    rows[idx] = {
      date: yesterday,
      store_id: "kent",
      sales,
      transactions,
      food_cost_pct,
      labor_pct,
      prime_pct,
      slph,
      ticket_avg,
      food_dollars,
      labor_dollars,
    };
  }
  return rows;
}

export const SEED_DAILY_KPIS = buildDailyKpis();

// Sales by order type (for Sales report breakdown) — percentages that sum to 100
export const SEED_SALES_CHANNEL_PCT: Record<string, number> = {
  dine_in: 38,
  pickup: 32,
  delivery: 18,
  doordash: 12,
};

// ============ WEEKLY SNAPSHOT (last 8 weeks — Kent, improvement arc) ============
export type SeedWeeklyCockpit = {
  week_start: string;
  store_id: string;
  sales: number;
  labor_pct: number;
  food_disp_pct: number;
  prime_pct: number;
  slph: number;
  transactions: number;
  wow_sales_pct: number | null;
};

function getMondayBefore(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00Z");
  const day = d.getUTCDay();
  const diff = day === 0 ? 6 : day - 1;
  d.setUTCDate(d.getUTCDate() - diff);
  return d.toISOString().slice(0, 10);
}

function buildWeeklyCockpit(): SeedWeeklyCockpit[] {
  const daily = SEED_DAILY_KPIS;
  const byWeek = new Map<string, SeedDailyKpi[]>();
  daily.forEach((row) => {
    const mon = getMondayBefore(row.date);
    if (!byWeek.has(mon)) byWeek.set(mon, []);
    byWeek.get(mon)!.push(row);
  });
  const weekStarts = Array.from(byWeek.keys()).sort();
  const weeks: SeedWeeklyCockpit[] = [];
  weekStarts.forEach((week_start) => {
    const weekDays = byWeek.get(week_start)!;
    const sales = weekDays.reduce((s, r) => s + r.sales, 0);
    const food_dollars = weekDays.reduce((s, r) => s + r.food_dollars, 0);
    const labor_dollars = weekDays.reduce((s, r) => s + r.labor_dollars, 0);
    const transactions = weekDays.reduce((s, r) => s + r.transactions, 0);
    const labor_hours = weekDays.reduce((s, r) => s + r.labor_dollars / 14.5, 0);
    const disposables = sales * 0.035;
    const food_disp_pct = Math.round(((food_dollars + disposables) / sales) * 1000) / 10;
    const labor_pct = Math.round((labor_dollars / sales) * 1000) / 10;
    const prime_pct = Math.round(((food_dollars + labor_dollars + disposables) / sales) * 1000) / 10;
    const slph = labor_hours > 0 ? Math.round((sales / labor_hours) * 10) / 10 : 0;
    const prevWeek = weeks[weeks.length - 1];
    const wow_sales_pct = prevWeek ? Math.round(((sales - prevWeek.sales) / prevWeek.sales) * 1000) / 10 : null;
    weeks.push({
      week_start,
      store_id: "kent",
      sales,
      labor_pct,
      food_disp_pct,
      prime_pct,
      slph,
      transactions,
      wow_sales_pct,
    });
  });
  // Prepend 4 synthetic older weeks for 8-week "improvement arc" (week 1 rough → week 8 dialed in)
  const firstFromData = weeks[0];
  const synthetic: SeedWeeklyCockpit[] = [];
  let prevSales = firstFromData?.sales ?? 36000;
  for (let w = 4; w >= 1; w--) {
    const sales = Math.round(prevSales * (0.94 + Math.random() * 0.04));
    prevSales = sales;
    const prime_pct = Math.round((58 + (4 - w) * 0.8) * 10) / 10;
    const labor_pct = Math.round((23.5 - (4 - w) * 0.3) * 10) / 10;
    const food_disp_pct = Math.round((34 - (4 - w) * 0.4) * 10) / 10;
    const slph = Math.round((68 + (4 - w) * 1.5) * 10) / 10;
    const transactions = Math.round(sales / 18.5);
    const prev = synthetic[synthetic.length - 1] ?? firstFromData;
    const wow_sales_pct = prev ? Math.round(((sales - prev.sales) / prev.sales) * 1000) / 10 : null;
    const firstMon = firstFromData ? new Date(firstFromData.week_start + "T12:00:00Z") : new Date();
    const mon = new Date(firstMon);
    mon.setUTCDate(mon.getUTCDate() - 7 * w);
    synthetic.push({
      week_start: mon.toISOString().slice(0, 10),
      store_id: "kent",
      sales,
      labor_pct,
      food_disp_pct,
      prime_pct,
      slph,
      transactions,
      wow_sales_pct,
    });
  }
  return [...synthetic, ...weeks];
}

export const SEED_WEEKLY_COCKPIT = buildWeeklyCockpit();

// ============ EMPLOYEES (12) ============
export type SeedEmployee = {
  id: string;
  name: string;
  role: "manager" | "driver" | "cook" | "cashier";
  store_id: string;
  hire_date: string;
  exit_date: string | null;
  pay_rate: number;
  hours_per_week: number;
  status: "active" | "terminated";
  cac: number;
  tenure_months: number;
};

export const SEED_EMPLOYEES: SeedEmployee[] = [
  { id: "e1", name: "Marcus Johnson", role: "manager", store_id: "kent", hire_date: "2022-03-15", exit_date: null, pay_rate: 18, hours_per_week: 45, status: "active", cac: 3200, tenure_months: 35 },
  { id: "e2", name: "Sarah Chen", role: "manager", store_id: "kent", hire_date: "2023-01-10", exit_date: null, pay_rate: 17, hours_per_week: 40, status: "active", cac: 3500, tenure_months: 25 },
  { id: "e3", name: "David Park", role: "manager", store_id: "aurora", hire_date: "2022-08-01", exit_date: null, pay_rate: 17.5, hours_per_week: 42, status: "active", cac: 3100, tenure_months: 30 },
  { id: "e4", name: "Jake Williams", role: "driver", store_id: "kent", hire_date: "2021-11-20", exit_date: null, pay_rate: 14, hours_per_week: 35, status: "active", cac: 2800, tenure_months: 39 },
  { id: "e5", name: "Emily Rodriguez", role: "driver", store_id: "kent", hire_date: "2024-09-01", exit_date: null, pay_rate: 13, hours_per_week: 28, status: "active", cac: 2900, tenure_months: 1 },
  { id: "e6", name: "Mike Thompson", role: "driver", store_id: "kent", hire_date: "2023-05-12", exit_date: null, pay_rate: 13.5, hours_per_week: 32, status: "active", cac: 3100, tenure_months: 21 },
  { id: "e7", name: "Ashley Brown", role: "driver", store_id: "aurora", hire_date: "2024-10-01", exit_date: null, pay_rate: 12.5, hours_per_week: 25, status: "active", cac: 3000, tenure_months: 0 },
  { id: "e8", name: "Chris Davis", role: "driver", store_id: "lindseys", hire_date: "2022-06-01", exit_date: daysAgo(7), pay_rate: 13, hours_per_week: 30, status: "terminated", cac: 2900, tenure_months: 28 },
  { id: "e9", name: "Tony Martinez", role: "cook", store_id: "kent", hire_date: "2021-09-15", exit_date: null, pay_rate: 15, hours_per_week: 38, status: "active", cac: 2700, tenure_months: 41 },
  { id: "e10", name: "Jordan Lee", role: "cook", store_id: "kent", hire_date: "2023-03-01", exit_date: null, pay_rate: 14, hours_per_week: 36, status: "active", cac: 3100, tenure_months: 23 },
  { id: "e11", name: "Sam Wilson", role: "cook", store_id: "aurora", hire_date: "2022-11-01", exit_date: null, pay_rate: 14.5, hours_per_week: 35, status: "active", cac: 2950, tenure_months: 27 },
  { id: "e12", name: "Alex Turner", role: "cashier", store_id: "kent", hire_date: "2023-07-15", exit_date: null, pay_rate: 12.5, hours_per_week: 28, status: "active", cac: 2850, tenure_months: 19 },
  { id: "e13", name: "Morgan Reed", role: "cook", store_id: "kent", hire_date: "2024-04-01", exit_date: null, pay_rate: 14, hours_per_week: 32, status: "active", cac: 2900, tenure_months: 10 },
];

// ============ RECIPES (15) ============
export type SeedRecipeIngredient = { name: string; qty: number; unit: string; cost_per_unit: number };
export type SeedRecipe = {
  id: string;
  name: string;
  category: string;
  size: string | null;
  ingredients: SeedRecipeIngredient[];
  theoretical_cost: number;
  menu_price: number;
  food_cost_pct: number;
};

// Helper: ingredient line cost = qty * cost_per_unit. Recipe theoretical_cost must equal sum(ingredient costs).
export const SEED_RECIPES: SeedRecipe[] = [
  // 16" Cheese: dough $0.85, sauce $0.60, mozzarella $2.40, box $0.35 = $4.20, sells $14.99, 28.0% GREEN
  { id: "r1", name: "16\" Cheese Pizza", category: "pizza", size: "16\"", ingredients: [{ name: "Dough 16\"", qty: 1, unit: "ea", cost_per_unit: 0.85 }, { name: "Sauce", qty: 6, unit: "oz", cost_per_unit: 0.10 }, { name: "Mozzarella", qty: 8, unit: "oz", cost_per_unit: 0.30 }, { name: "Box 16\"", qty: 1, unit: "ea", cost_per_unit: 0.35 }], theoretical_cost: 4.20, menu_price: 14.99, food_cost_pct: 28.0 },
  { id: "r2", name: "16\" Pepperoni Pizza", category: "pizza", size: "16\"", ingredients: [{ name: "Dough 16\"", qty: 1, unit: "ea", cost_per_unit: 0.85 }, { name: "Sauce", qty: 6, unit: "oz", cost_per_unit: 0.10 }, { name: "Mozzarella", qty: 8, unit: "oz", cost_per_unit: 0.30 }, { name: "Pepperoni", qty: 3, unit: "oz", cost_per_unit: 0.42 }, { name: "Box 16\"", qty: 1, unit: "ea", cost_per_unit: 0.35 }], theoretical_cost: 5.46, menu_price: 17.99, food_cost_pct: 30.4 },
  { id: "r3", name: "16\" Supreme Pizza", category: "pizza", size: "16\"", ingredients: [{ name: "Dough 16\"", qty: 1, unit: "ea", cost_per_unit: 0.85 }, { name: "Sauce", qty: 6, unit: "oz", cost_per_unit: 0.10 }, { name: "Mozzarella", qty: 9, unit: "oz", cost_per_unit: 0.30 }, { name: "Pepperoni", qty: 2, unit: "oz", cost_per_unit: 0.42 }, { name: "Sausage", qty: 2, unit: "oz", cost_per_unit: 0.38 }, { name: "Green Peppers", qty: 1.5, unit: "oz", cost_per_unit: 0.08 }, { name: "Onions", qty: 1, unit: "oz", cost_per_unit: 0.05 }, { name: "Mushrooms", qty: 1, unit: "oz", cost_per_unit: 0.18 }, { name: "Box 16\"", qty: 1, unit: "ea", cost_per_unit: 0.35 }], theoretical_cost: 6.05, menu_price: 21.99, food_cost_pct: 27.5 },
  { id: "r4", name: "12\" Cheese Pizza", category: "pizza", size: "12\"", ingredients: [{ name: "Dough 12\"", qty: 1, unit: "ea", cost_per_unit: 0.65 }, { name: "Sauce", qty: 4, unit: "oz", cost_per_unit: 0.10 }, { name: "Mozzarella", qty: 5, unit: "oz", cost_per_unit: 0.30 }, { name: "Box 12\"", qty: 1, unit: "ea", cost_per_unit: 0.28 }], theoretical_cost: 2.83, menu_price: 10.99, food_cost_pct: 25.8 },
  { id: "r5", name: "12\" Pepperoni Pizza", category: "pizza", size: "12\"", ingredients: [{ name: "Dough 12\"", qty: 1, unit: "ea", cost_per_unit: 0.55 }, { name: "Sauce", qty: 4, unit: "oz", cost_per_unit: 0.10 }, { name: "Mozzarella", qty: 5, unit: "oz", cost_per_unit: 0.30 }, { name: "Pepperoni", qty: 2, unit: "oz", cost_per_unit: 0.42 }, { name: "Box 12\"", qty: 1, unit: "ea", cost_per_unit: 0.28 }], theoretical_cost: 3.57, menu_price: 12.99, food_cost_pct: 27.5 },
  { id: "r6", name: "Garlic Knots", category: "appetizer", size: null, ingredients: [{ name: "Dough 12\"", qty: 0.5, unit: "ea", cost_per_unit: 1.00 }, { name: "Garlic Butter", qty: 2, unit: "oz", cost_per_unit: 0.15 }, { name: "Parmesan", qty: 0.54, unit: "oz", cost_per_unit: 0.35 }], theoretical_cost: 0.99, menu_price: 5.99, food_cost_pct: 16.5 },
  { id: "r7", name: "Wings 12pc", category: "appetizer", size: "12pc", ingredients: [{ name: "Chicken Wings", qty: 12, unit: "oz", cost_per_unit: 0.22 }, { name: "Wing Sauce", qty: 2, unit: "oz", cost_per_unit: 0.08 }, { name: "Ranch", qty: 2, unit: "oz", cost_per_unit: 0.06 }], theoretical_cost: 2.96, menu_price: 12.99, food_cost_pct: 22.8 },
  { id: "r8", name: "Calzone", category: "pizza", size: null, ingredients: [{ name: "Dough 16\"", qty: 1, unit: "ea", cost_per_unit: 0.85 }, { name: "Mozzarella", qty: 6, unit: "oz", cost_per_unit: 0.30 }, { name: "Sauce", qty: 4, unit: "oz", cost_per_unit: 0.10 }, { name: "Ricotta", qty: 3, unit: "oz", cost_per_unit: 0.35 }], theoretical_cost: 4.10, menu_price: 13.99, food_cost_pct: 29.3 },
  { id: "r9", name: "Stromboli", category: "pizza", size: null, ingredients: [{ name: "Dough 16\"", qty: 1, unit: "ea", cost_per_unit: 0.85 }, { name: "Mozzarella", qty: 5, unit: "oz", cost_per_unit: 0.30 }, { name: "Pepperoni", qty: 2, unit: "oz", cost_per_unit: 0.42 }, { name: "Sauce", qty: 2, unit: "oz", cost_per_unit: 0.20 }], theoretical_cost: 3.79, menu_price: 12.99, food_cost_pct: 29.2 },
  { id: "r10", name: "House Salad", category: "salad", size: null, ingredients: [{ name: "Lettuce", qty: 4, unit: "oz", cost_per_unit: 0.06 }, { name: "Tomatoes", qty: 2, unit: "oz", cost_per_unit: 0.08 }, { name: "Onions", qty: 0.5, unit: "oz", cost_per_unit: 0.05 }, { name: "Dressing", qty: 1.5, unit: "oz", cost_per_unit: 0.12 }], theoretical_cost: 0.68, menu_price: 4.99, food_cost_pct: 13.6 },
  { id: "r11", name: "Breadsticks", category: "appetizer", size: null, ingredients: [{ name: "Dough 12\"", qty: 0.4, unit: "ea", cost_per_unit: 0.55 }, { name: "Garlic Butter", qty: 1, unit: "oz", cost_per_unit: 0.15 }], theoretical_cost: 0.37, menu_price: 4.49, food_cost_pct: 8.2 },
  { id: "r12", name: "2-Liter Soda", category: "drink", size: "2L", ingredients: [{ name: "Soda Syrup / 2L", qty: 1, unit: "ea", cost_per_unit: 0.85 }], theoretical_cost: 0.85, menu_price: 3.49, food_cost_pct: 24.4 },
  { id: "r13", name: "Italian Sub", category: "sub", size: null, ingredients: [{ name: "Bread Roll", qty: 1, unit: "ea", cost_per_unit: 0.45 }, { name: "Salami", qty: 2, unit: "oz", cost_per_unit: 0.35 }, { name: "Ham", qty: 2, unit: "oz", cost_per_unit: 0.32 }, { name: "Mozzarella", qty: 1.5, unit: "oz", cost_per_unit: 0.21 }, { name: "Lettuce", qty: 0.5, unit: "oz", cost_per_unit: 0.06 }, { name: "Sauce", qty: 0.5, unit: "oz", cost_per_unit: 0.10 }], theoretical_cost: 2.18, menu_price: 8.99, food_cost_pct: 24.2 },
  { id: "r14", name: "Chicken Parm Sub", category: "sub", size: null, ingredients: [{ name: "Bread Roll", qty: 1, unit: "ea", cost_per_unit: 0.45 }, { name: "Chicken", qty: 4, unit: "oz", cost_per_unit: 0.28 }, { name: "Sauce", qty: 2, unit: "oz", cost_per_unit: 0.10 }, { name: "Mozzarella", qty: 2, unit: "oz", cost_per_unit: 0.30 }], theoretical_cost: 2.37, menu_price: 9.99, food_cost_pct: 23.7 },
  { id: "r15", name: "Meatball Sub", category: "sub", size: null, ingredients: [{ name: "Bread Roll", qty: 1, unit: "ea", cost_per_unit: 0.45 }, { name: "Meatballs", qty: 4, unit: "oz", cost_per_unit: 0.245 }, { name: "Sauce", qty: 2, unit: "oz", cost_per_unit: 0.10 }, { name: "Mozzarella", qty: 1.5, unit: "oz", cost_per_unit: 0.30 }], theoretical_cost: 2.08, menu_price: 8.99, food_cost_pct: 23.1 },
];

// ============ INVENTORY (20 items) ============
export type SeedInventoryItem = {
  id: string;
  name: string;
  category: string;
  par_level: number;
  current_count: number;
  unit: string;
  unit_cost: number;
  last_order_date: string;
  last_counted: string;
  vendor: string;
};

export const SEED_INVENTORY: SeedInventoryItem[] = [
  { id: "i1", name: "Mozzarella", category: "cheese", par_level: 40, current_count: 32, unit: "lb", unit_cost: 3.85, last_order_date: daysAgo(2), last_counted: daysAgo(0), vendor: "Hillcrest Food Services" },
  { id: "i2", name: "Pepperoni", category: "meats", par_level: 25, current_count: 18, unit: "lb", unit_cost: 4.25, last_order_date: daysAgo(1), last_counted: daysAgo(0), vendor: "Hillcrest Food Services" },
  { id: "i3", name: "Sausage", category: "meats", par_level: 20, current_count: 22, unit: "lb", unit_cost: 3.20, last_order_date: daysAgo(3), last_counted: daysAgo(1), vendor: "Hillcrest Food Services" },
  { id: "i4", name: "Dough Flour", category: "dough_dry", par_level: 50, current_count: 38, unit: "lb", unit_cost: 0.42, last_order_date: daysAgo(5), last_counted: daysAgo(1), vendor: "Hillcrest Food Services" },
  { id: "i5", name: "Sauce (Canned)", category: "sauces", par_level: 24, current_count: 16, unit: "can", unit_cost: 8.50, last_order_date: daysAgo(4), last_counted: daysAgo(2), vendor: "Hillcrest Food Services" },
  { id: "i6", name: "Green Peppers", category: "produce", par_level: 15, current_count: 3, unit: "lb", unit_cost: 1.20, last_order_date: daysAgo(1), last_counted: daysAgo(0), vendor: "Hillcrest Food Services" },
  { id: "i7", name: "Onions", category: "produce", par_level: 20, current_count: 14, unit: "lb", unit_cost: 0.65, last_order_date: daysAgo(1), last_counted: daysAgo(0), vendor: "Hillcrest Food Services" },
  { id: "i8", name: "Mushrooms", category: "produce", par_level: 12, current_count: 2, unit: "lb", unit_cost: 2.40, last_order_date: daysAgo(2), last_counted: daysAgo(1), vendor: "Hillcrest Food Services" },
  { id: "i9", name: "Olives", category: "produce", par_level: 10, current_count: 0, unit: "lb", unit_cost: 1.85, last_order_date: daysAgo(3), last_counted: daysAgo(0), vendor: "Hillcrest Food Services" },
  { id: "i10", name: "Chicken", category: "meats", par_level: 30, current_count: 24, unit: "lb", unit_cost: 2.85, last_order_date: daysAgo(2), last_counted: daysAgo(1), vendor: "Hillcrest Food Services" },
  { id: "i11", name: "Wing Sauce", category: "sauces", par_level: 6, current_count: 4, unit: "bottle", unit_cost: 5.20, last_order_date: daysAgo(5), last_counted: daysAgo(3), vendor: "Hillcrest Food Services" },
  { id: "i12", name: "Pizza Boxes 16\"", category: "paper", par_level: 200, current_count: 145, unit: "ea", unit_cost: 0.38, last_order_date: daysAgo(4), last_counted: daysAgo(2), vendor: "Imperial Packaging" },
  { id: "i13", name: "Pizza Boxes 12\"", category: "paper", par_level: 150, current_count: 98, unit: "ea", unit_cost: 0.28, last_order_date: daysAgo(4), last_counted: daysAgo(2), vendor: "Imperial Packaging" },
  { id: "i14", name: "Napkins", category: "paper", par_level: 20, current_count: 14, unit: "sleeve", unit_cost: 12.00, last_order_date: daysAgo(7), last_counted: daysAgo(5), vendor: "Paper & Disposables" },
  { id: "i15", name: "Gloves", category: "paper", par_level: 15, current_count: 11, unit: "box", unit_cost: 18.00, last_order_date: daysAgo(5), last_counted: daysAgo(3), vendor: "Paper & Disposables" },
  { id: "i16", name: "Fryer Oil", category: "dough_dry", par_level: 6, current_count: 3, unit: "gal", unit_cost: 28.00, last_order_date: daysAgo(3), last_counted: daysAgo(1), vendor: "US Foods" },
  { id: "i17", name: "Lettuce", category: "produce", par_level: 12, current_count: 8, unit: "head", unit_cost: 1.40, last_order_date: daysAgo(1), last_counted: daysAgo(0), vendor: "Hillcrest Food Services" },
  { id: "i18", name: "Bread Rolls", category: "dough_dry", par_level: 60, current_count: 42, unit: "ea", unit_cost: 0.35, last_order_date: daysAgo(2), last_counted: daysAgo(1), vendor: "Hillcrest Food Services" },
  { id: "i19", name: "Garlic Butter", category: "sauces", par_level: 8, current_count: 5, unit: "lb", unit_cost: 2.15, last_order_date: daysAgo(3), last_counted: daysAgo(2), vendor: "Hillcrest Food Services" },
  { id: "i20", name: "Parmesan", category: "cheese", par_level: 8, current_count: 6, unit: "lb", unit_cost: 4.80, last_order_date: daysAgo(2), last_counted: daysAgo(0), vendor: "Hillcrest Food Services" },
];

// ============ MARKETING CAMPAIGNS (4) ============
export type SeedMarketingCampaign = {
  id: string;
  name: string;
  platform: string;
  spend: number;
  impressions: number;
  clicks: number;
  orders: number;
  revenue: number;
  roas: number;
  offer: string;
};

export const SEED_MARKETING_CAMPAIGNS: SeedMarketingCampaign[] = [
  { id: "m1", name: "Game Day Special", platform: "facebook", spend: 320, impressions: 85000, clicks: 1200, orders: 48, revenue: 1840, roas: 5.75, offer: "Game Day Special — Large 1-Topping Pizza $10.99. Targeted to 44240, 44260 zip codes. Image: pizza on game day table with team colors." },
  { id: "m2", name: "Google Local Ads", platform: "google", spend: 280, impressions: 42000, clicks: 980, orders: 62, revenue: 1980, roas: 7.07, offer: "Search ads for 'pizza near me' and 'pizza delivery Kent OH'. Rotating headlines: Best Pizza in Kent, Fresh Made Daily, Order Online Now." },
  { id: "m3", name: "DoorDash Promotion", platform: "doordash", spend: 150, impressions: 0, clicks: 0, orders: 85, revenue: 2120, roas: 14.13, offer: "DoorDash-funded promotion: Free delivery on orders $25+. Co-funded 50/50 with DoorDash for 2 weeks." },
  { id: "m4", name: "Referral Program", platform: "referral", spend: 200, impressions: 0, clicks: 0, orders: 32, revenue: 960, roas: 4.8, offer: "Refer a friend, both get $5 off next order. Tracked via unique referral codes. Promoted on receipts and in-store signage." },
];

// ============ PARTY ORDERS (6) ============
export type SeedPartyOrder = {
  id: string;
  customer_name: string;
  party_date: string;
  party_time: string | null;
  guest_count: number;
  items: { name: string; qty: number; price: number }[];
  subtotal: number;
  tax: number;
  total: number;
  deposit_paid: number;
  status: string;
  store_id: string;
};

export const SEED_PARTY_ORDERS: SeedPartyOrder[] = [
  { id: "p1", customer_name: "Ohio State Alumni Club", party_date: daysAgo(-5), party_time: "18:00", guest_count: 45, items: [{ name: "16\" Cheese", qty: 12, price: 14.99 }, { name: "16\" Pepperoni", qty: 8, price: 17.99 }, { name: "Wings 12pc", qty: 10, price: 12.99 }, { name: "2-Liter Soda", qty: 15, price: 3.49 }], subtotal: 498.29, tax: 39.86, total: 538.15, deposit_paid: 200, status: "approved", store_id: "kent" },
  { id: "p2", customer_name: "Kent Rotary", party_date: daysAgo(-8), party_time: "12:00", guest_count: 28, items: [{ name: "16\" Supreme", qty: 6, price: 21.99 }, { name: "House Salad", qty: 12, price: 4.99 }, { name: "Breadsticks", qty: 8, price: 4.49 }], subtotal: 218.34, tax: 17.47, total: 235.81, deposit_paid: 235.81, status: "approved", store_id: "kent" },
  { id: "p3", customer_name: "Aurora Youth Soccer", party_date: daysAgo(-12), party_time: "17:30", guest_count: 22, items: [{ name: "12\" Cheese", qty: 10, price: 10.99 }, { name: "12\" Pepperoni", qty: 6, price: 12.99 }, { name: "Garlic Knots", qty: 6, price: 5.99 }], subtotal: 198.52, tax: 15.88, total: 214.40, deposit_paid: 0, status: "pending", store_id: "aurora" },
  { id: "p4", customer_name: "Ravenna Chamber", party_date: daysAgo(3), party_time: "11:30", guest_count: 35, items: [{ name: "16\" Cheese", qty: 8, price: 14.99 }, { name: "16\" Pepperoni", qty: 6, price: 17.99 }, { name: "Calzone", qty: 10, price: 13.99 }, { name: "House Salad", qty: 15, price: 4.99 }], subtotal: 392.27, tax: 31.38, total: 423.65, deposit_paid: 423.65, status: "completed", store_id: "lindseys" },
  { id: "p5", customer_name: "Family Reunion - Miller", party_date: daysAgo(10), party_time: "14:00", guest_count: 55, items: [{ name: "16\" Cheese", qty: 15, price: 14.99 }, { name: "16\" Pepperoni", qty: 12, price: 17.99 }, { name: "16\" Supreme", qty: 6, price: 21.99 }, { name: "Wings 12pc", qty: 15, price: 12.99 }, { name: "2-Liter Soda", qty: 20, price: 3.49 }], subtotal: 892.14, tax: 71.37, total: 963.51, deposit_paid: 500, status: "completed", store_id: "kent" },
  { id: "p6", customer_name: "Corporate Catering - Acme Corp", party_date: daysAgo(20), party_time: "12:00", guest_count: 80, items: [{ name: "16\" Cheese", qty: 20, price: 14.99 }, { name: "16\" Pepperoni", qty: 15, price: 17.99 }, { name: "16\" Supreme", qty: 10, price: 21.99 }, { name: "Wings 12pc", qty: 20, price: 12.99 }, { name: "House Salad", qty: 25, price: 4.99 }, { name: "2-Liter Soda", qty: 25, price: 3.49 }], subtotal: 1198.80, tax: 95.90, total: 1294.70, deposit_paid: 1294.70, status: "completed", store_id: "kent" },
];

// ============ MORNING BRIEF (by store) ============
export const SEED_MORNING_BRIEF =
  "Good morning. Yesterday Kent did $5,420 on 287 transactions. Food cost came in at 30.8% — green. Labor was 23.1% — green. Your cheese portioning audit last week is working: food cost is down 2.1 points from the spike on the 12th. PRIME came in at 53.9% — well under the 55% benchmark. Average ticket $18.89, up from $18.20 last week — your upsell training is paying off. One flag: Aurora's food cost has been yellow for 3 straight days at 32.8%. Might be time to consider checking their portioning on 16-inch pies.";

/** Per-store seed briefs for demo. Keys: kent, aurora, lindseys. Use "all" → kent. */
export const SEED_MORNING_BRIEF_BY_STORE: Record<string, string> = {
  kent:
    "Good morning. Yesterday Kent did $5,420 on 287 transactions. Food cost came in at 30.8% — green. Labor was 23.1% — green. Your cheese portioning audit last week is working: food cost is down 2.1 points from the spike on the 12th. PRIME came in at 53.9% — well under the 55% benchmark. Average ticket $18.89, up from $18.20 last week — your upsell training is paying off. One flag: Aurora's food cost has been yellow for 3 straight days at 32.8%. Might be time to consider checking their portioning on 16-inch pies.",
  aurora:
    "Good morning. Yesterday LeeAngelo's Aurora did $3,640 on 198 transactions. Food cost came in at 32.8% — yellow, third day in a row above 32%. Labor was 22.4% — green. This food cost trend needs attention before it goes red. Common approaches include running a portioning check on 16-inch cheese pies this shift — that's where Kent found their overage last week. Average ticket was $18.38, up slightly from last week. Schedule looks good for the weekend — no changes needed.",
  lindseys:
    "Good morning. Yesterday Lindsey's did $2,580 on 142 transactions. Food cost came in at 29.4% — green. Labor was 21.8% — green. PRIME at 55.2% — just inside the typical range. Solid day. Delivery mix was 38% of orders, highest this week — consider whether a dedicated driver shift makes sense on Thursdays going forward. No red flags. Consider keeping it steady.",
};

// ============ TRUSTED CONTACTS (8) ============
export type SeedContact = {
  id: string;
  name: string;
  category: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
};

export const SEED_TRUSTED_CONTACTS: SeedContact[] = [
  { id: "c1", name: "Hillcrest Food Services", category: "vendor", phone: "(216) 555-0180", email: "orders@hillcrestfoods.com", notes: "Primary Distributor. Main distributor — 99% of product. Cleveland-based. Hundreds of pizzeria customers." },
  { id: "c2", name: "Jennifer Walsh", category: "vendor", phone: "(330) 555-0198", email: "jwalsh@usfoods.com", notes: "US Foods — Lindsey's" },
  { id: "c3", name: "Dave's HVAC", category: "service_contract", phone: "(330) 555-0444", email: null, notes: "Walk-in and HVAC — 24/7" },
  { id: "c4", name: "Portage County Health", category: "professional", phone: "(330) 555-0300", email: "inspections@portagecounty.org", notes: "Health inspections — all locations" },
  { id: "c5", name: "Angela Foster, CPA", category: "professional", phone: "(330) 555-0777", email: "afoster@fostercpa.com", notes: "Books and taxes" },
  { id: "c6", name: "State Farm - Lisa Park", category: "professional", phone: "(330) 555-0888", email: "lpark@statefarm.com", notes: "General liability & workers comp" },
  { id: "c7", name: "POS Support", category: "vendor", phone: "1-800-555-3632", email: "support@pos.example.com", notes: "POS and back office" },
  { id: "c8", name: "Imperial Packaging", category: "vendor", phone: "(330) 555-0333", email: "orders@imperialpkg.com", notes: "Boxes and napkins" },
];

// ============ INVOICES (5 seed — vendor, date, total, status, 5–10 line items each) ============
export type SeedInvoiceLineItem = {
  product: string;
  qty: number;
  unit: string;
  unit_price: number;
  extended_price: number;
};

export type SeedInvoice = {
  id: string;
  vendor_name: string;
  invoice_number: string | null;
  invoice_date: string | null;
  total: number;
  line_items: SeedInvoiceLineItem[];
  status: "Processed" | "Pending" | "failed";
  created_at: string;
};

export const SEED_INVOICES: SeedInvoice[] = [
  {
    id: "inv1",
    vendor_name: "Hillcrest Food Services",
    invoice_number: "HFS-28491",
    invoice_date: daysAgo(1),
    total: 3840,
    status: "Processed",
    created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    line_items: [
      { product: "Mozzarella", qty: 400, unit: "lb", unit_price: 2.38, extended_price: 952.00 },
      { product: "Pepperoni", qty: 120, unit: "lb", unit_price: 3.45, extended_price: 414.00 },
      { product: "Pizza Flour", qty: 500, unit: "lb", unit_price: 0.42, extended_price: 210.00 },
      { product: "Crushed Tomatoes", qty: 48, unit: "can", unit_price: 3.20, extended_price: 153.60 },
      { product: "Sausage", qty: 80, unit: "lb", unit_price: 2.95, extended_price: 236.00 },
      { product: "Green Peppers", qty: 40, unit: "lb", unit_price: 1.65, extended_price: 66.00 },
      { product: "Onions", qty: 50, unit: "lb", unit_price: 0.95, extended_price: 47.50 },
      { product: "Mushrooms", qty: 30, unit: "lb", unit_price: 2.80, extended_price: 84.00 },
      { product: "Pizza Boxes 16\"", qty: 200, unit: "ea", unit_price: 0.52, extended_price: 104.00 },
      { product: "Pizza Boxes 12\"", qty: 150, unit: "ea", unit_price: 0.44, extended_price: 66.00 },
      { product: "Chicken", qty: 100, unit: "lb", unit_price: 2.85, extended_price: 285.00 },
      { product: "Sauce (Canned)", qty: 24, unit: "can", unit_price: 8.50, extended_price: 204.00 },
      { product: "Dough Flour", qty: 200, unit: "lb", unit_price: 0.42, extended_price: 84.00 },
      { product: "Wing Sauce", qty: 20, unit: "bottle", unit_price: 5.20, extended_price: 104.00 },
      { product: "Garlic Butter", qty: 30, unit: "lb", unit_price: 2.15, extended_price: 64.50 },
      { product: "Parmesan", qty: 40, unit: "lb", unit_price: 4.80, extended_price: 192.00 },
      { product: "Bread Rolls", qty: 200, unit: "ea", unit_price: 0.35, extended_price: 70.00 },
      { product: "Lettuce", qty: 50, unit: "head", unit_price: 1.40, extended_price: 70.00 },
      { product: "Napkins", qty: 15, unit: "sleeve", unit_price: 12.00, extended_price: 180.00 },
      { product: "Gloves", qty: 10, unit: "box", unit_price: 18.00, extended_price: 180.00 },
      { product: "Misc supplies", qty: 1, unit: "ea", unit_price: 83.40, extended_price: 83.40 },
    ],
  },
  {
    id: "inv2",
    vendor_name: "Hillcrest Food Services",
    invoice_number: "HFS-28402",
    invoice_date: daysAgo(4),
    total: 1892,
    status: "Processed",
    created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
    line_items: [
      { product: "Mozzarella", qty: 200, unit: "lb", unit_price: 2.38, extended_price: 476.00 },
      { product: "Pepperoni", qty: 60, unit: "lb", unit_price: 3.45, extended_price: 207.00 },
      { product: "Sausage", qty: 80, unit: "lb", unit_price: 2.95, extended_price: 236.00 },
      { product: "Pizza Flour", qty: 400, unit: "lb", unit_price: 0.42, extended_price: 168.00 },
      { product: "Crushed Tomatoes", qty: 36, unit: "can", unit_price: 3.20, extended_price: 115.20 },
      { product: "Green Peppers", qty: 25, unit: "lb", unit_price: 1.65, extended_price: 41.25 },
      { product: "Onions", qty: 40, unit: "lb", unit_price: 0.95, extended_price: 38.00 },
      { product: "Mushrooms", qty: 20, unit: "lb", unit_price: 2.80, extended_price: 56.00 },
      { product: "Chicken", qty: 50, unit: "lb", unit_price: 2.85, extended_price: 142.50 },
      { product: "Garlic Butter", qty: 24, unit: "lb", unit_price: 2.15, extended_price: 51.60 },
      { product: "Parmesan", qty: 20, unit: "lb", unit_price: 4.80, extended_price: 96.00 },
      { product: "Olives", qty: 15, unit: "lb", unit_price: 1.85, extended_price: 27.75 },
      { product: "Lettuce", qty: 24, unit: "head", unit_price: 1.40, extended_price: 33.60 },
      { product: "Bread Rolls", qty: 120, unit: "ea", unit_price: 0.35, extended_price: 42.00 },
      { product: "Wing Sauce", qty: 8, unit: "bottle", unit_price: 5.20, extended_price: 41.60 },
      { product: "Sauce (Canned)", qty: 12, unit: "can", unit_price: 8.50, extended_price: 102.00 },
      { product: "Misc dry goods", qty: 1, unit: "ea", unit_price: 59.00, extended_price: 59.00 },
    ],
  },
  {
    id: "inv3",
    vendor_name: "Hillcrest Food Services",
    invoice_number: "HFS-28388",
    invoice_date: daysAgo(6),
    total: 754,
    status: "Processed",
    created_at: new Date(Date.now() - 6 * 86400000).toISOString(),
    line_items: [
      { product: "Mozzarella", qty: 80, unit: "lb", unit_price: 2.38, extended_price: 190.40 },
      { product: "Pepperoni", qty: 40, unit: "lb", unit_price: 3.45, extended_price: 138.00 },
      { product: "Pizza Flour", qty: 200, unit: "lb", unit_price: 0.42, extended_price: 84.00 },
      { product: "Crushed Tomatoes", qty: 24, unit: "can", unit_price: 3.20, extended_price: 76.80 },
      { product: "Sausage", qty: 30, unit: "lb", unit_price: 2.95, extended_price: 88.50 },
      { product: "Green Peppers", qty: 15, unit: "lb", unit_price: 1.65, extended_price: 24.75 },
      { product: "Onions", qty: 20, unit: "lb", unit_price: 0.95, extended_price: 19.00 },
      { product: "Garlic Butter", qty: 12, unit: "lb", unit_price: 2.15, extended_price: 25.80 },
      { product: "Parmesan", qty: 10, unit: "lb", unit_price: 4.80, extended_price: 48.00 },
      { product: "Bread Rolls", qty: 60, unit: "ea", unit_price: 0.35, extended_price: 21.00 },
      { product: "Olives", qty: 8, unit: "lb", unit_price: 1.85, extended_price: 14.80 },
      { product: "Mushrooms", qty: 5, unit: "lb", unit_price: 2.80, extended_price: 14.00 },
    ],
  },
  {
    id: "inv4",
    vendor_name: "Coca-Cola Distributor",
    invoice_number: "CC-99234",
    invoice_date: daysAgo(2),
    total: 440,
    status: "Pending",
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    line_items: [
      { product: "Coke syrup 5 gal", qty: 3, unit: "ea", unit_price: 48.00, extended_price: 144.00 },
      { product: "Diet Coke syrup 5 gal", qty: 2, unit: "ea", unit_price: 48.00, extended_price: 96.00 },
      { product: "Sprite syrup 5 gal", qty: 2, unit: "ea", unit_price: 46.00, extended_price: 92.00 },
      { product: "CO2 50 lb", qty: 2, unit: "tank", unit_price: 28.00, extended_price: 56.00 },
      { product: "Cups 16 oz", qty: 2, unit: "case", unit_price: 26.00, extended_price: 52.00 },
    ],
  },
  {
    id: "inv5",
    vendor_name: "Paper & Disposables",
    invoice_number: "PD-6671",
    invoice_date: daysAgo(7),
    total: 320,
    status: "Processed",
    created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
    line_items: [
      { product: "Pizza box 16\"", qty: 500, unit: "ea", unit_price: 0.38, extended_price: 190.00 },
      { product: "Pizza box 12\"", qty: 300, unit: "ea", unit_price: 0.28, extended_price: 84.00 },
      { product: "Napkins 2-ply", qty: 20, unit: "sleeve", unit_price: 1.80, extended_price: 36.00 },
      { product: "Gloves M", qty: 4, unit: "box", unit_price: 1.50, extended_price: 6.00 },
      { product: "Deli sheets", qty: 2, unit: "case", unit_price: 2.00, extended_price: 4.00 },
    ],
  },
  {
    id: "inv6",
    vendor_name: "Unknown",
    invoice_number: null,
    invoice_date: daysAgo(2),
    total: 0,
    status: "failed",
    created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    line_items: [],
  },
];
export type SeedShift = {
  id: string;
  employee_id: string;
  date: string;
  start_time: string;
  end_time: string;
  role: string;
  cost: number;
};

function buildThisWeekDates(): string[] {
  const out: string[] = [];
  const today = new Date();
  const dayOfWeek = today.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + mondayOffset + i);
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

export function getSeedSchedule(): SeedShift[] {
  const weekDates = buildThisWeekDates();
  const shifts: SeedShift[] = [];
  let id = 1;
  const empIds = SEED_EMPLOYEES.filter((e) => e.status === "active").map((e) => e.id);
  const roles: Record<string, string> = {};
  SEED_EMPLOYEES.forEach((e) => { roles[e.id] = e.role; });
  const rate: Record<string, number> = {};
  SEED_EMPLOYEES.forEach((e) => { rate[e.id] = e.pay_rate; });

  weekDates.forEach((date) => {
    const dow = dayOfWeek(date);
    const isWeekend = dow === 0 || dow === 5 || dow === 6;
    empIds.forEach((empId) => {
      const r = roles[empId];
      const hr = rate[empId];
      if (r === "manager") {
        shifts.push({ id: `sh${id++}`, employee_id: empId, date, start_time: "10:00", end_time: "18:00", role: r, cost: 8 * hr });
      } else if (r === "driver" && (dow === 5 || dow === 6)) {
        shifts.push({ id: `sh${id++}`, employee_id: empId, date, start_time: "16:00", end_time: "22:00", role: r, cost: 6 * hr });
      } else if (r === "cook" || r === "cashier") {
        const hours = isWeekend ? 8 : 6;
        shifts.push({ id: `sh${id++}`, employee_id: empId, date, start_time: "11:00", end_time: isWeekend ? "19:00" : "17:00", role: r, cost: hours * hr });
      }
    });
  });
  return shifts;
}

export const SEED_SCHEDULE = getSeedSchedule();

// ============ DOORDASH (last 30 days) ============
export type SeedDoordashDay = {
  date: string;
  store_id: string;
  orders: number;
  gross_sales: number;
  commission_dollars: number;
  effective_commission_pct: number;
  net_revenue: number;
};

function buildDoordashData(): SeedDoordashDay[] {
  const rows: SeedDoordashDay[] = [];
  for (let i = 29; i >= 0; i--) {
    const date = daysAgo(i);
    const dow = dayOfWeek(date);
    const isWeekend = dow === 5 || dow === 6;
    const orders = isWeekend ? 45 + Math.floor(Math.random() * 25) : 28 + Math.floor(Math.random() * 20);
    const avgOrder = 22 + Math.random() * 4;
    const gross_sales = Math.round(orders * avgOrder * 100) / 100;
    const commission_pct = 18 + Math.random() * 4;
    const commission_dollars = Math.round((gross_sales * commission_pct) / 100 * 100) / 100;
    const effective_commission_pct = Math.round((commission_dollars / gross_sales) * 1000) / 10;
    const net_revenue = Math.round((gross_sales - commission_dollars) * 100) / 100;
    rows.push({
      date,
      store_id: "kent",
      orders,
      gross_sales,
      commission_dollars,
      effective_commission_pct,
      net_revenue,
    });
  }
  return rows;
}

export const SEED_DOORDASH = buildDoordashData();

// ============ MERCH (demo — T-shirts, Hoodies, Hats, Aprons) ============
export type SeedMerchItem = {
  id: string;
  name: string;
  category: string;
  brand: string;
  description: string | null;
  price: number;
  sizes: string[];
  sort_order: number;
};

export const SEED_MERCH: SeedMerchItem[] = [
  { id: "seed-tshirt", name: "T-Shirt", category: "apparel", brand: "leeangelos", description: "Classic logo tee. Soft cotton blend.", price: 25, sizes: ["S", "M", "L", "XL", "2XL"], sort_order: 1 },
  { id: "seed-hoodie", name: "Hoodie", category: "apparel", brand: "leeangelos", description: "Zip hoodie with logo.", price: 45, sizes: ["S", "M", "L", "XL", "2XL"], sort_order: 2 },
  { id: "seed-hat", name: "Hat", category: "apparel", brand: "leeangelos", description: "Snapback with embroidered logo.", price: 20, sizes: ["One Size"], sort_order: 3 },
  { id: "seed-apron", name: "Apron", category: "gear", brand: "leeangelos", description: "Heavy-duty apron with logo.", price: 30, sizes: ["One Size"], sort_order: 4 },
  { id: "seed-tshirt-l", name: "T-Shirt", category: "apparel", brand: "lindseys", description: "Classic logo tee. Soft cotton blend.", price: 25, sizes: ["S", "M", "L", "XL", "2XL"], sort_order: 10 },
  { id: "seed-hoodie-l", name: "Hoodie", category: "apparel", brand: "lindseys", description: "Zip hoodie with logo.", price: 45, sizes: ["S", "M", "L", "XL", "2XL"], sort_order: 11 },
  { id: "seed-hat-l", name: "Hat", category: "apparel", brand: "lindseys", description: "Snapback with embroidered logo.", price: 20, sizes: ["One Size"], sort_order: 12 },
  { id: "seed-apron-l", name: "Apron", category: "gear", brand: "lindseys", description: "Heavy-duty apron with logo.", price: 30, sizes: ["One Size"], sort_order: 13 },
];

// ============ TASKS (8 seed — for demo when API empty) ============
export type SeedTask = {
  id: string;
  store_id: string | null;
  title: string;
  category: string;
  assigned_role: string;
  due_date: string;
  due_time: string | null;
  status: string;
  priority: string;
  completed_by: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  is_recurring: boolean;
  recurrence: string | null;
  notes: string | null;
  created_by: string | null;
};

const seedNow = () => new Date().toISOString();

export const SEED_TASKS: SeedTask[] = [
  { id: "seed-t1", store_id: "kent", title: "Cheese portioning audit", category: "prep", assigned_role: "manager", due_date: daysAgo(0), due_time: null, status: "pending", priority: "high", completed_by: null, completed_at: null, created_at: seedNow(), updated_at: seedNow(), is_recurring: false, recurrence: null, notes: null, created_by: null },
  { id: "seed-t2", store_id: "kent", title: "Consider calling POS support re: API", category: "custom", assigned_role: "manager", due_date: daysAgo(1), due_time: null, status: "pending", priority: "medium", completed_by: null, completed_at: null, created_at: seedNow(), updated_at: seedNow(), is_recurring: false, recurrence: null, notes: null, created_by: null },
  { id: "seed-t3", store_id: "kent", title: "Consider updating weekend schedule", category: "opening", assigned_role: "manager", due_date: daysAgo(0), due_time: "17:00", status: "pending", priority: "high", completed_by: null, completed_at: null, created_at: seedNow(), updated_at: seedNow(), is_recurring: false, recurrence: null, notes: null, created_by: null },
  { id: "seed-t4", store_id: "aurora", title: "Consider reviewing Aurora food cost", category: "custom", assigned_role: "manager", due_date: daysAgo(2), due_time: null, status: "pending", priority: "high", completed_by: null, completed_at: null, created_at: seedNow(), updated_at: seedNow(), is_recurring: false, recurrence: null, notes: null, created_by: null },
  { id: "seed-t5", store_id: "kent", title: "Consider ordering new pizza boxes", category: "prep", assigned_role: "cook", due_date: daysAgo(3), due_time: null, status: "pending", priority: "medium", completed_by: null, completed_at: null, created_at: seedNow(), updated_at: seedNow(), is_recurring: false, recurrence: null, notes: null, created_by: null },
  { id: "seed-t6", store_id: "kent", title: "Consider training Marcus on close", category: "closing", assigned_role: "shift_lead", due_date: daysAgo(1), due_time: null, status: "pending", priority: "medium", completed_by: null, completed_at: null, created_at: seedNow(), updated_at: seedNow(), is_recurring: false, recurrence: null, notes: null, created_by: null },
  { id: "seed-t7", store_id: "kent", title: "Consider reviewing walk-in thermostat", category: "custom", assigned_role: "manager", due_date: daysAgo(0), due_time: null, status: "pending", priority: "high", completed_by: null, completed_at: null, created_at: seedNow(), updated_at: seedNow(), is_recurring: false, recurrence: null, notes: null, created_by: null },
  { id: "seed-t8", store_id: "kent", title: "Consider posting job listing for driver", category: "custom", assigned_role: "manager", due_date: daysAgo(5), due_time: null, status: "pending", priority: "low", completed_by: null, completed_at: null, created_at: seedNow(), updated_at: seedNow(), is_recurring: false, recurrence: null, notes: null, created_by: null },
];

// ============ CHAT (10 seed messages — Angelo, Greg, Rosario) ============
export type SeedChatMessage = {
  id: string;
  store_id: string | null;
  channel: string;
  sender_name: string;
  sender_role: string | null;
  message: string;
  is_pinned: boolean;
  is_announcement: boolean;
  created_at: string;
};

function seedChatTime(dayOffset: number, hour: number, min: number): string {
  const d = new Date();
  d.setDate(d.getDate() - dayOffset);
  d.setHours(hour, min, 0, 0);
  return d.toISOString();
}

// Chronological order: oldest first (yesterday 9am, then today 6:45 → 12:45)
export const SEED_CHAT_MESSAGES: SeedChatMessage[] = [
  { id: "msg8", store_id: "kent", channel: "general", sender_name: "LeeAnn", sender_role: "admin", message: "Payroll is done for this week. Direct deposits go out Thursday. Let me know if anyone had overtime issues.", is_pinned: false, is_announcement: false, created_at: seedChatTime(1, 9, 0) },
  { id: "msg9", store_id: "kent", channel: "general", sender_name: "Angelo", sender_role: "owner", message: "Thanks LeeAnn. Greg — did Marcus end up going over 40 hours this week?", is_pinned: false, is_announcement: false, created_at: seedChatTime(1, 9, 15) },
  { id: "msg10", store_id: "kent", channel: "general", sender_name: "Greg", sender_role: "manager", message: "He hit 41.5. I adjusted the schedule for next week so he stays under.", is_pinned: false, is_announcement: false, created_at: seedChatTime(1, 9, 30) },
  { id: "msg11", store_id: "kent", channel: "general", sender_name: "Angelo", sender_role: "owner", message: "Perfect. Rosario — Aurora food cost came in at 32.8 again yesterday. Can you run a portioning check on the 16-inch pies today?", is_pinned: false, is_announcement: false, created_at: seedChatTime(0, 6, 45) },
  { id: "msg1", store_id: "kent", channel: "general", sender_name: "Greg", sender_role: "manager", message: "Walk-in temp was reading 42 this morning. Called the repair guy.", is_pinned: false, is_announcement: false, created_at: seedChatTime(0, 7, 15) },
  { id: "msg2", store_id: "kent", channel: "general", sender_name: "Angelo", sender_role: "owner", message: "Good catch. What did they say?", is_pinned: false, is_announcement: false, created_at: seedChatTime(0, 7, 22) },
  { id: "msg3", store_id: "kent", channel: "general", sender_name: "Greg", sender_role: "manager", message: "Coming Thursday between 2-4. Said it might just be the door seal.", is_pinned: false, is_announcement: false, created_at: seedChatTime(0, 7, 35) },
  { id: "msg4", store_id: "kent", channel: "general", sender_name: "Angelo", sender_role: "owner", message: "Keep an eye on it tonight. If it goes above 44 move the cheese to the small reach-in.", is_pinned: false, is_announcement: false, created_at: seedChatTime(0, 7, 42) },
  { id: "msg12", store_id: "kent", channel: "general", sender_name: "Rosario", sender_role: "manager", message: "On it. I think it might be the new guy overloading cheese. I'll weigh 10 pies this shift and report back.", is_pinned: false, is_announcement: false, created_at: seedChatTime(0, 8, 10) },
  { id: "msg5", store_id: "kent", channel: "general", sender_name: "Rosario", sender_role: "manager", message: "Kent just got slammed. 28 orders in the last 45 min. Called Marcus in early.", is_pinned: false, is_announcement: false, created_at: seedChatTime(0, 12, 30) },
  { id: "msg6", store_id: "kent", channel: "general", sender_name: "Angelo", sender_role: "owner", message: "Nice. How's the make line holding up?", is_pinned: false, is_announcement: false, created_at: seedChatTime(0, 12, 38) },
  { id: "msg7", store_id: "kent", channel: "general", sender_name: "Rosario", sender_role: "manager", message: "Solid. Miguel is keeping up. Might need extra cheese prepped for tomorrow if this keeps up.", is_pinned: false, is_announcement: false, created_at: seedChatTime(0, 12, 45) },
];
