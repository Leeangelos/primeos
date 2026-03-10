-- Inspection Radar: own inspections (new schema) and store competitor profiles

create table if not exists own_inspections (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id),
  inspection_date date not null,
  inspection_type text not null,
  result text,
  critical_violations jsonb default '[]',
  noncritical_violations jsonb default '[]',
  inspector_notes text,
  source text default 'manual',
  created_at timestamptz default now()
);

create table if not exists store_competitor_profiles (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id),
  is_own_store boolean default false,
  google_place_id text not null,
  name text not null,
  address text,
  distance_miles numeric(4,2),
  google_rating numeric(2,1),
  google_review_count int,
  price_level text,
  categories text[],
  google_maps_url text,
  phone text,
  latitude numeric(10,7),
  longitude numeric(10,7),
  last_synced_at timestamptz default now(),
  created_at timestamptz default now()
);

alter table own_inspections disable row level security;
alter table store_competitor_profiles disable row level security;
alter table store_competitor_profiles add constraint store_competitor_profiles_store_id_google_place_id_key unique (store_id, google_place_id);
create index if not exists own_inspections_store_date on own_inspections(store_id, inspection_date desc);
create index if not exists store_competitor_profiles_store on store_competitor_profiles(store_id, is_own_store);
