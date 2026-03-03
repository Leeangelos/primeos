-- Add qualifying fields to waitlist for application-style form
alter table waitlist add column if not exists locations text;
alter table waitlist add column if not exists weekly_sales text;
alter table waitlist add column if not exists years_in_business text;
alter table waitlist add column if not exists biggest_challenge text;
alter table waitlist add column if not exists referral_source text;
