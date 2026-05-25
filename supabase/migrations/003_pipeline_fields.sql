-- Run after 002_core_product.sql
-- Adds pipeline progress fields for multi-step processing

alter table public.recordings add column if not exists clean_transcript text;
alter table public.recordings add column if not exists intent jsonb;
alter table public.recordings add column if not exists clarity_score float;
alter table public.recordings add column if not exists pipeline_step text;

-- Simplify status: pending | processing | complete | failed
alter table public.recordings drop constraint if exists recordings_status_check;

update public.recordings
set status = case
  when status in ('transcribing', 'polishing') then 'processing'
  else status
end;

alter table public.recordings
  add constraint recordings_status_check
  check (status in ('pending', 'processing', 'complete', 'failed'));
