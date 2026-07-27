-- Run this in the Supabase SQL Editor (Supabase MCP was unavailable to run it automatically)

create table if not exists donation_codes (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  discord_id text not null,
  tier text not null,
  amount_kr integer not null,
  frequency text not null,
  stripe_session_id text unique,
  status text not null default 'unused', -- 'unused' until every perk below is claimed, then 'claimed'
  created_at timestamptz not null default now(),
  claimed_at timestamptz
);

create table if not exists donation_code_perks (
  id uuid primary key default gen_random_uuid(),
  code text not null references donation_codes(code) on delete cascade,
  label text not null,
  claimed boolean not null default false,
  claimed_at timestamptz,
  claimed_by text
);

create index if not exists donation_code_perks_by_code on donation_code_perks (code);

-- Maps an active subscription back to the Discord user/tier, so monthly renewal
-- payments (which don't go through checkout.session.completed) can still be
-- traced back to who to refill perks for.
create table if not exists subscriptions (
  stripe_subscription_id text primary key,
  discord_id text not null,
  tier text not null,
  created_at timestamptz not null default now()
);

create table if not exists tickets (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  opener_discord_id text not null,
  channel_id text not null unique,
  donation_code text,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  closed_at timestamptz
);

create index if not exists tickets_open_lookup on tickets (opener_discord_id, category, status);
