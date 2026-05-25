-- Run after 005_voice_profile_schema.sql
-- Delivery layer: OAuth connections + send receipts

alter table public.recordings
  add column if not exists delivery_destination jsonb;

comment on column public.recordings.delivery_destination is
  'Optional target chosen before/during session, e.g. {"connection_id":"uuid","platform":"gmail","to":"..."}';

create table if not exists public.platform_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  platform text not null check (platform in ('gmail', 'slack', 'notion', 'linkedin', 'zapier')),
  label text,
  credentials_encrypted text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  connected_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists platform_connections_user_id_idx
  on public.platform_connections (user_id);

create table if not exists public.delivery_attempts (
  id uuid primary key default gen_random_uuid(),
  recording_id uuid not null references public.recordings (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  connection_id uuid references public.platform_connections (id) on delete set null,
  platform text not null,
  status text not null default 'pending'
    check (status in ('pending', 'sent', 'failed')),
  external_id text,
  error_message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists delivery_attempts_recording_id_idx
  on public.delivery_attempts (recording_id desc);

create index if not exists delivery_attempts_user_id_idx
  on public.delivery_attempts (user_id, created_at desc);

alter table public.platform_connections enable row level security;
alter table public.delivery_attempts enable row level security;

create policy "Users read own connections"
  on public.platform_connections for select
  using (auth.uid() = user_id);

create policy "Users read own delivery attempts"
  on public.delivery_attempts for select
  using (auth.uid() = user_id);
