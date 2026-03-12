-- Per-employee, per-day labor from FoodTec (for schedule grid actual vs scheduled).
create table if not exists foodtec_labor_punches (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id),
  business_day date not null,
  employee_name text not null,
  regular_hours numeric not null default 0,
  overtime_hours numeric not null default 0,
  clock_in_time time,
  clock_out_time time,
  synced_at timestamptz not null default now()
);

create unique index if not exists foodtec_labor_punches_store_day_employee_idx
  on foodtec_labor_punches (store_id, business_day, employee_name);
