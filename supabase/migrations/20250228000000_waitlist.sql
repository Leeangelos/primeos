-- Waitlist table for signup page "No Invite Code" flow
create table if not exists waitlist (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  business_name text not null,
  business_type text not null,
  city_state text,
  message text,
  status text not null default 'new' check (status in ('new', 'contacted', 'converted', 'passed')),
  created_at timestamptz not null default now()
);

create index if not exists waitlist_created_at_idx on waitlist (created_at desc);
