-- Gatepass database schema
-- Run this once in Supabase: SQL Editor -> New query -> paste -> Run

create extension if not exists pgcrypto;

create table if not exists users (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  email         text not null unique,
  password_hash text not null,
  created_at    timestamptz not null default now()
);

create table if not exists events (
  id           uuid primary key default gen_random_uuid(),
  organiser_id uuid not null references users(id) on delete cascade,
  title        text not null,
  description  text not null default '',
  venue        text not null,
  starts_at    timestamptz not null,
  capacity     integer not null check (capacity > 0),
  price        integer not null default 0 check (price >= 0),  -- in naira
  created_at   timestamptz not null default now()
);

create table if not exists tickets (
  id            uuid primary key default gen_random_uuid(),
  event_id      uuid not null references events(id) on delete cascade,
  user_id       uuid not null references users(id) on delete cascade,
  code          text not null unique,          -- the value inside the QR code
  status        text not null default 'valid' check (status in ('valid', 'checked_in')),
  checked_in_at timestamptz,
  payment_ref   text unique,                   -- Paystack reference for paid tickets
  created_at    timestamptz not null default now(),
  unique (event_id, user_id)                   -- one ticket per person per event
);

create index if not exists tickets_event_idx on tickets (event_id);
create index if not exists events_starts_idx on events (starts_at);

-- Supabase exposes tables through its public REST API by default.
-- Turning on Row Level Security with NO policies blocks that public access completely.
-- Our Express server connects as the database owner, which is not affected,
-- so all data goes through our API and its rules.
alter table users   enable row level security;
alter table events  enable row level security;
alter table tickets enable row level security;
