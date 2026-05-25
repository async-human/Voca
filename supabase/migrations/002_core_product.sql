-- Run in Supabase SQL Editor after 001_waitlist.sql
-- Enables: auth users, voice recordings, AI generations

-- ─── Profiles (linked to Supabase Auth) ───
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  voice_profile jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── Recordings ───
create table if not exists public.recordings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  storage_path text not null,
  mime_type text not null,
  duration_ms integer,
  format text not null check (format in ('email', 'slack', 'report', 'linkedin', 'journal')),
  status text not null default 'pending'
    check (status in ('pending', 'transcribing', 'polishing', 'complete', 'failed')),
  error_message text,
  raw_transcript text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists recordings_user_id_idx on public.recordings (user_id);
create index if not exists recordings_status_idx on public.recordings (status);
create index if not exists recordings_created_at_idx on public.recordings (created_at desc);

-- ─── Generations (output + explanations; supports format switch without re-recording) ───
create table if not exists public.generations (
  id uuid primary key default gen_random_uuid(),
  recording_id uuid not null references public.recordings (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  format text not null check (format in ('email', 'slack', 'report', 'linkedin', 'journal')),
  output_text text not null,
  output_meta jsonb not null default '{}'::jsonb,
  explanations jsonb not null default '[]'::jsonb,
  model_version text,
  created_at timestamptz not null default now()
);

create index if not exists generations_recording_id_idx on public.generations (recording_id);
create index if not exists generations_user_id_idx on public.generations (user_id);

-- ─── Row Level Security ───
alter table public.profiles enable row level security;
alter table public.recordings enable row level security;
alter table public.generations enable row level security;

create policy "Users read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users read own recordings"
  on public.recordings for select
  using (auth.uid() = user_id);

create policy "Users insert own recordings"
  on public.recordings for insert
  with check (auth.uid() = user_id);

create policy "Users read own generations"
  on public.generations for select
  using (auth.uid() = user_id);

-- ─── Storage bucket for audio ───
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'recordings',
  'recordings',
  false,
  10485760,
  array['audio/webm', 'audio/mp4', 'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/x-m4a']
)
on conflict (id) do nothing;

create policy "Users upload own recordings"
  on storage.objects for insert
  with check (
    bucket_id = 'recordings'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users read own recordings"
  on storage.objects for select
  using (
    bucket_id = 'recordings'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
