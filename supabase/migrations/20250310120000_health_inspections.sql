-- Health Inspection Radar tables

create table if not exists own_inspections (
  id uuid primary key default gen_random_uuid(),
  store_id uuid references stores(id),
  inspection_date date not null,
  inspector_name text,
  score numeric,
  grade text,
  violations_count integer default 0,
  critical_violations integer default 0,
  non_critical_violations integer default 0,
  result text,
  notes text,
  created_at timestamptz default now()
);

create table if not exists nearby_inspections (
  id uuid primary key default gen_random_uuid(),
  county text not null,
  establishment_name text not null,
  address text,
  inspection_date date not null,
  violations_count integer default 0,
  critical_violations integer default 0,
  result text,
  distance_miles numeric,
  near_store_id uuid references stores(id),
  raw_data jsonb,
  created_at timestamptz default now(),
  unique (county, establishment_name, inspection_date)
);

-- Disable RLS (data is only accessed via backend and does not store PII)
alter table own_inspections disable row level security;
alter table nearby_inspections disable row level security;

-- Indexes for common access patterns
create index if not exists idx_own_inspections_store_date
  on own_inspections (store_id, inspection_date);

create index if not exists idx_nearby_inspections_store_date
  on nearby_inspections (near_store_id, inspection_date);

