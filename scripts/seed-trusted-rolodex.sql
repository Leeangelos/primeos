-- Add store_id to trusted_contacts so Rolodex is store-specific (kent, aurora, lindseys).
-- Run in Supabase SQL Editor once. Then use POST /api/trusted-contacts/seed to seed from vendor-data.

CREATE TABLE IF NOT EXISTS trusted_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id text,
  category text NOT NULL,
  name text NOT NULL,
  phone text,
  email text,
  account_number text,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Add store_id column if table already existed without it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'trusted_contacts' AND column_name = 'store_id'
  ) THEN
    ALTER TABLE trusted_contacts ADD COLUMN store_id text;
  END IF;
END $$;
