create table if not exists foodtec_toppings (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references stores(id),
  business_day date not null,
  item_name text not null,
  topping_name text not null,
  quantity_used numeric not null,
  unit text not null,
  synced_at timestamptz not null default now()
);

create unique index if not exists foodtec_toppings_store_day_item_topping_idx
  on foodtec_toppings (store_id, business_day, item_name, topping_name);

