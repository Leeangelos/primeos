-- Composite index for weekly cockpit and daily KPI lookups.
-- Supports: WHERE store_id IN (...) AND business_date >= ? AND business_date <= ?
-- and ORDER BY business_date.
-- See docs/WEEKLY-COCKPIT-AUDIT.md.

CREATE INDEX IF NOT EXISTS idx_daily_kpis_store_business_date
ON daily_kpis (store_id, business_date);
