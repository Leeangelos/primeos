-- PrimeOS Team Chat: chat_messages table
-- Run this in Supabase SQL Editor to create the table.

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  store_id uuid references public.stores(id) on delete cascade,
  channel text not null check (channel in ('general', 'announcements', 'shift-swap', 'managers-only')),
  sender_name text not null,
  sender_role text,
  message text not null,
  is_pinned boolean not null default false,
  is_announcement boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_chat_store_channel on public.chat_messages(store_id, channel);
create index if not exists idx_chat_created_at on public.chat_messages(created_at desc);

comment on table public.chat_messages is 'Team chat messages per store and channel.';
