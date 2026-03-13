-- Add FoodTec labor fields to employees (for sync-employees).
-- Safe to run if table already exists; columns added only if missing.
ALTER TABLE employees ADD COLUMN IF NOT EXISTS firstname text;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS lastname text;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS punchin text;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS punchout text;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS salaried text;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS full_name text;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS foodtec_id text;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS is_salaried boolean;
