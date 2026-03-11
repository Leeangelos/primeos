create table if not exists gl_transactions (
  id uuid primary key default gen_random_uuid(),
  store_id uuid references stores(id),
  date date,
  type text,
  vendor_name text,
  memo text,
  gl_category text,
  debit numeric,
  credit numeric,
  balance numeric,
  source_month text
);

alter table gl_transactions disable row level security;

