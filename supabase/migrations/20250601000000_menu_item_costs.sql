CREATE TABLE IF NOT EXISTS menu_item_costs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_name text NOT NULL,
  size text NOT NULL,
  category text NOT NULL,
  cost_to_make numeric,
  includes_disposables boolean DEFAULT false,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(item_name, size, category)
);

ALTER TABLE menu_item_costs DISABLE ROW LEVEL SECURITY;
