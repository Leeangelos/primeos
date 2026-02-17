-- Excel Replacement v1: add notes and updated_by to daily_kpis.
-- Run after 20250216000000_add_daily_kpis_store_business_date_index.sql if that exists.

ALTER TABLE public.daily_kpis
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS updated_by TEXT;

COMMENT ON COLUMN public.daily_kpis.notes IS 'Optional free text for the day';
COMMENT ON COLUMN public.daily_kpis.updated_by IS 'User id from auth when available';
