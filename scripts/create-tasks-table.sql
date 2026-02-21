-- PrimeOS Task Manager: tasks table
-- Run this in Supabase SQL Editor to create the table.

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  store_id uuid references public.stores(id) on delete cascade,
  title text not null,
  category text not null check (category in ('opening', 'closing', 'prep', 'cleaning', 'custom')),
  assigned_role text not null check (assigned_role in ('manager', 'shift_lead', 'cook', 'cashier', 'driver', 'team')),
  due_date date not null,
  due_time text,
  is_recurring boolean not null default false,
  recurrence text check (recurrence in ('daily', 'weekday', 'weekend')),
  status text not null default 'pending' check (status in ('pending', 'completed')),
  completed_by text,
  completed_at timestamptz,
  created_by text,
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_tasks_store_date on public.tasks(store_id, due_date);
create index if not exists idx_tasks_status on public.tasks(status);
create index if not exists idx_tasks_category on public.tasks(category);

comment on table public.tasks is 'Daily task list per store for opening, closing, prep, cleaning.';
