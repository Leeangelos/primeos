-- menu_item_costs: make per-store
-- 1. Drop existing unique constraint on (item_name, size, category)
ALTER TABLE menu_item_costs DROP CONSTRAINT IF EXISTS menu_item_costs_item_name_size_category_key;

-- 2. Add store_id column (nullable first for backfill)
ALTER TABLE menu_item_costs ADD COLUMN IF NOT EXISTS store_id uuid REFERENCES stores(id);

-- 3. Backfill existing rows: set store_id to Kent store UUID
UPDATE menu_item_costs SET store_id = '7cd4cb61-7e90-44f5-8739-5f19074262b8' WHERE store_id IS NULL;

-- 4. Make store_id NOT NULL
ALTER TABLE menu_item_costs ALTER COLUMN store_id SET NOT NULL;

-- 5. New unique constraint on (store_id, item_name, size, category)
ALTER TABLE menu_item_costs ADD CONSTRAINT menu_item_costs_store_id_item_name_size_category_key UNIQUE (store_id, item_name, size, category);
