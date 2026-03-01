export interface SmartQuestion {
  id: string;
  page: string;
  question: string;
  type: "number" | "text" | "select" | "multi_select";
  options?: string[];
  placeholder?: string;
  field: string;
}

export const SMART_QUESTIONS: SmartQuestion[] = [
  { id: "target_food_cost", page: "home", question: "What food cost percentage are you targeting?", type: "number", placeholder: "30", field: "target_food_cost" },
  { id: "target_labor_cost", page: "home", question: "What labor cost percentage are you targeting?", type: "number", placeholder: "28", field: "target_labor_cost" },
  { id: "busiest_day", page: "schedule", question: "What is your busiest day of the week?", type: "select", options: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"], field: "busiest_day" },
  { id: "avg_hourly_wage", page: "schedule", question: "What is your average hourly wage?", type: "number", placeholder: "14", field: "avg_hourly_wage" },
  { id: "top_sellers", page: "menu", question: "What are your top 3 best-selling items?", type: "text", placeholder: "e.g., Large Pepperoni, Wings, Cheesesteak", field: "top_sellers" },
  { id: "menu_item_count", page: "menu", question: "How many items are on your menu?", type: "number", placeholder: "45", field: "menu_item_count" },
  { id: "manager_count", page: "people", question: "How many managers do you have?", type: "number", placeholder: "3", field: "manager_count" },
  { id: "avg_tenure_months", page: "people", question: "How long does your average employee stay (months)?", type: "number", placeholder: "8", field: "avg_tenure_months" },
  { id: "main_distributor", page: "vendor", question: "Who is your main food distributor?", type: "text", placeholder: "e.g., Sysco, US Foods, Hillcrest", field: "main_distributor" },
  { id: "delivery_platforms", page: "marketing", question: "Which delivery platforms are you on?", type: "multi_select", options: ["DoorDash", "UberEats", "Grubhub", "Slice", "Direct Only", "None"], field: "delivery_platforms" },
  { id: "review_response_goal", page: "reputation", question: "How quickly do you want to respond to reviews?", type: "select", options: ["Within 24 hours", "Within 48 hours", "Weekly", "I dont respond"], field: "review_response_goal" },
  { id: "daily_sales_goal", page: "daily", question: "What is your daily sales goal?", type: "number", placeholder: "2500", field: "daily_sales_goal" },
];

export function getQuestionsForPage(page: string): SmartQuestion[] {
  return SMART_QUESTIONS.filter((q) => q.page === page);
}

export function getCompletionPercentage(answeredIds: string[]): number {
  if (SMART_QUESTIONS.length === 0) return 100;
  return Math.round((answeredIds.length / SMART_QUESTIONS.length) * 100);
}
