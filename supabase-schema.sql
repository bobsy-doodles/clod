-- Run this in the Supabase SQL editor (Project → SQL Editor → New query)

create table if not exists membership_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  member_name text not null,
  membership_number text not null,
  membership_type text not null default 'Gold Star',
  expiration_date date not null,
  created_at timestamptz not null default now(),

  -- one card per user for this simple version
  unique (user_id)
);

alter table membership_cards enable row level security;

-- users can only ever see their own card
create policy "select own card"
  on membership_cards for select
  using (auth.uid() = user_id);

create policy "insert own card"
  on membership_cards for insert
  with check (auth.uid() = user_id);

create policy "update own card"
  on membership_cards for update
  using (auth.uid() = user_id);

create policy "delete own card"
  on membership_cards for delete
  using (auth.uid() = user_id);
