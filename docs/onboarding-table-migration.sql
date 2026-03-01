-- FLAG FOR ANGELO: Run in Supabase SQL Editor to add Google Business + location columns to onboarding_data.

ALTER TABLE onboarding_data ADD COLUMN IF NOT EXISTS google_business_name text;
ALTER TABLE onboarding_data ADD COLUMN IF NOT EXISTS street_address text;
ALTER TABLE onboarding_data ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE onboarding_data ADD COLUMN IF NOT EXISTS state text;
ALTER TABLE onboarding_data ADD COLUMN IF NOT EXISTS zip_code text;
ALTER TABLE onboarding_data ADD COLUMN IF NOT EXISTS county text;
