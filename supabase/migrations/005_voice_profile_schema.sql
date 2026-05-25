-- Run in Supabase SQL Editor after 002_core_product.sql (and 003, 004 if used)
-- Migration 005: Deep voice profile schema
--
-- No new columns required — voice_profile is already jsonb on profiles.
-- This backfills existing rows with the new nested shape the API expects.

-- Document the expected schema on the column
comment on column public.profiles.voice_profile is
  'User voice memory: summary, sessions_count, traits (directness/conciseness/warmth/formality), pattern_counts, format_usage, clarity_history, avg_clarity_score, longitudinal_insights, last_weekly_insight_at, weak_patterns, updated_at';

-- Backfill existing profiles — preserve existing keys, add missing defaults
update public.profiles
set
  voice_profile = voice_profile
    || jsonb_build_object(
      'traits', coalesce(voice_profile->'traits', '{}'::jsonb),
      'pattern_counts', coalesce(voice_profile->'pattern_counts', '{}'::jsonb),
      'format_usage', coalesce(voice_profile->'format_usage', '{}'::jsonb),
      'clarity_history', coalesce(voice_profile->'clarity_history', '[]'::jsonb),
      'longitudinal_insights', coalesce(voice_profile->'longitudinal_insights', '[]'::jsonb),
      'weak_patterns', coalesce(voice_profile->'weak_patterns', '[]'::jsonb),
      'sessions_count', coalesce((voice_profile->>'sessions_count')::int, 0)
    ),
  updated_at = now()
where voice_profile is not null;

-- Optional: index for users with active sessions (weekly insights query)
create index if not exists profiles_voice_sessions_idx
  on public.profiles (((voice_profile->>'sessions_count')::int))
  where (voice_profile->>'sessions_count') is not null;
