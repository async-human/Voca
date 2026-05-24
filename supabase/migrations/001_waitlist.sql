-- Run in Supabase SQL Editor (Dashboard → SQL → New query)

create table if not exists public.waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  use_case text check (use_case in ('email', 'reports', 'linkedin', 'slack', 'journal', 'other')),
  source text not null default 'landing',
  referrer text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  created_at timestamptz not null default now(),
  constraint waitlist_email_unique unique (email)
);

create index if not exists waitlist_created_at_idx on public.waitlist (created_at desc);
create index if not exists waitlist_use_case_idx on public.waitlist (use_case);

alter table public.waitlist enable row level security;

-- No public policies: the Railway API uses the service role key.
