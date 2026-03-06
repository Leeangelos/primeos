-- Seed Trusted Rolodex with vendor contacts for LeeAngelo's Kent, Aurora, and Lindsey's.
-- Run this in Supabase SQL Editor when trusted_contacts is empty.
-- Table is created if it does not exist.

CREATE TABLE IF NOT EXISTS trusted_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  name text NOT NULL,
  phone text,
  email text,
  account_number text,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Only insert if table is empty (avoid duplicates on re-run)
INSERT INTO trusted_contacts (category, name, phone, email, notes)
SELECT t.category, t.name, t.phone, t.email, t.notes
FROM (VALUES
  ('vendor', 'Hillcrest Food Services', '(330) 555-0100', 'orders@hillcrestfood.com', 'Primary food distributor – Kent, Aurora, Lindsey''s'),
  ('vendor', 'Pepsi Beverages', '(800) 433-2652', 'customer.service@pepsico.com', 'Beverage supplier'),
  ('vendor', 'Ohio Edison / FirstEnergy', '(800) 633-4766', NULL, 'Electric – Ohio Edison service area'),
  ('vendor', 'Dominion Energy Ohio', '(800) 362-7227', NULL, 'Gas – Dominion Energy Ohio'),
  ('vendor', 'City of Kent Water', '(330) 678-8106', 'water@kentohio.org', 'Water – Kent locations'),
  ('vendor', 'Spectrum Business', '(833) 267-6094', NULL, 'Internet & phone – business accounts'),
  ('vendor', 'Republic Services', '(800) 431-1506', NULL, 'Waste & recycling'),
  ('vendor', 'Erie Insurance', '(800) 458-0811', NULL, 'Commercial insurance'),
  ('vendor', 'Kent Plaza LLC', NULL, NULL, 'Landlord / property – Kent Plaza'),
  ('vendor', 'FoodTec Solutions', NULL, 'support@foodtec.com', 'POS & back-office – syncs daily sales/labor')
) AS t(category, name, phone, email, notes)
WHERE (SELECT count(*) FROM trusted_contacts) = 0;
