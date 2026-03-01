-- Operator profile: progressive data collection for Smart Questions
-- Run this in Supabase SQL editor (or via migration) as Angelo.

CREATE TABLE IF NOT EXISTS operator_profile (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  target_food_cost numeric,
  target_labor_cost numeric,
  busiest_day text,
  avg_hourly_wage numeric,
  top_sellers text,
  menu_item_count integer,
  manager_count integer,
  avg_tenure_months integer,
  main_distributor text,
  delivery_platforms jsonb,
  review_response_goal text,
  daily_sales_goal numeric,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE operator_profile ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access" ON operator_profile
  FOR ALL TO service_role USING (true) WITH CHECK (true);
