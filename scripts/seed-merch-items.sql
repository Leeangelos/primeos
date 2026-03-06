-- Team Merch: create merch_items table and seed for LeeAngelo's and Lindsey's.
-- Run in Supabase SQL Editor. Checkout uses Stripe with dynamic price_data (no stored Stripe IDs).

CREATE TABLE IF NOT EXISTS merch_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL,
  brand text NOT NULL,
  description text,
  price numeric(10,2) NOT NULL,
  sizes jsonb NOT NULL DEFAULT '["One Size"]',
  sort_order int NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE merch_items DISABLE ROW LEVEL SECURITY;

-- Seed only when table is empty (idempotent)
INSERT INTO merch_items (name, category, brand, description, price, sizes, sort_order, active)
SELECT v.name, v.category, v.brand, v.description, v.price, v.sizes::jsonb, v.sort_order, v.active
FROM (VALUES
  -- LeeAngelo's — Packages
  ('Starter Pack', 'package', 'leeangelos', 'MOST POPULAR · INCLUDES: Staff T-Shirt + Hat · You save $5 · ($35 value)', 28.00, '["S","M","L","XL"]', 10, true),
  ('Full Kit', 'package', 'leeangelos', 'BEST VALUE · INCLUDES: Staff T-Shirt + Hat + Apron · You save $12 · ($52 value)', 40.00, '["S","M","L","XL"]', 11, true),
  -- LeeAngelo's — Apparel
  ('Staff T-Shirt', 'apparel', 'leeangelos', 'Official LeeAngelo''s crew tee. 100% cotton.', 15.00, '["S","M","L","XL"]', 20, true),
  ('Team Hat', 'apparel', 'leeangelos', 'Embroidered cap with LeeAngelo''s logo.', 12.00, '["One Size"]', 21, true),
  ('Staff Apron', 'apparel', 'leeangelos', 'Heavy-duty kitchen apron with logo.', 18.00, '["One Size"]', 22, true),
  -- LeeAngelo's — Gear
  ('Apron (Gear)', 'gear', 'leeangelos', 'Extra apron for back-of-house. Wipe-clean.', 18.00, '["One Size"]', 30, true),
  ('Logo Hat (Gear)', 'gear', 'leeangelos', 'Extra cap for replacements.', 12.00, '["One Size"]', 31, true),

  -- Lindsey's — Packages
  ('Starter Pack', 'package', 'lindseys', 'MOST POPULAR · INCLUDES: Staff T-Shirt + Hat · You save $5 · ($35 value)', 28.00, '["S","M","L","XL"]', 10, true),
  ('Full Kit', 'package', 'lindseys', 'BEST VALUE · INCLUDES: Staff T-Shirt + Hat + Apron · You save $12 · ($52 value)', 40.00, '["S","M","L","XL"]', 11, true),
  -- Lindsey's — Apparel
  ('Staff T-Shirt', 'apparel', 'lindseys', 'Official Lindsey''s crew tee. 100% cotton.', 15.00, '["S","M","L","XL"]', 20, true),
  ('Team Hat', 'apparel', 'lindseys', 'Embroidered cap with Lindsey''s logo.', 12.00, '["One Size"]', 21, true),
  ('Staff Apron', 'apparel', 'lindseys', 'Heavy-duty kitchen apron with logo.', 18.00, '["One Size"]', 22, true),
  -- Lindsey's — Gear
  ('Apron (Gear)', 'gear', 'lindseys', 'Extra apron for back-of-house. Wipe-clean.', 18.00, '["One Size"]', 30, true),
  ('Logo Hat (Gear)', 'gear', 'lindseys', 'Extra cap for replacements.', 12.00, '["One Size"]', 31, true)
) AS v(name, category, brand, description, price, sizes, sort_order, active)
WHERE NOT EXISTS (SELECT 1 FROM merch_items LIMIT 1);
