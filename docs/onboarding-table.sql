-- Run in Supabase SQL Editor to create onboarding_data table and RLS.

CREATE TABLE onboarding_data (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  store_name text,
  weekly_sales numeric,
  food_cost_pct numeric,
  labor_cost_pct numeric,
  employee_count integer,
  monthly_rent numeric,
  goals jsonb,
  completed_at timestamptz DEFAULT now()
);

ALTER TABLE onboarding_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access" ON onboarding_data
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users to read their own row (for GET /api/onboarding with anon key).
CREATE POLICY "Users read own onboarding_data" ON onboarding_data
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
