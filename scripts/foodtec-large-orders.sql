-- Large orders ($300+) from FoodTec for Catering & Large Orders page.
-- Sync populates this; GET /api/parties reads it.

CREATE TABLE IF NOT EXISTS foodtec_large_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id text NOT NULL,
  business_day date NOT NULL,
  order_id text NOT NULL,
  net_amount numeric(10,2) NOT NULL,
  flag_scheduling boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(store_id, business_day, order_id)
);

-- Optional: index for list by store and date
CREATE INDEX IF NOT EXISTS idx_foodtec_large_orders_store_day
  ON foodtec_large_orders (store_id, business_day DESC);

ALTER TABLE foodtec_large_orders DISABLE ROW LEVEL SECURITY;
