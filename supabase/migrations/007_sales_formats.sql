-- Allow the sales domain pack formats introduced by the agentic pipeline.

alter table public.recordings drop constraint if exists recordings_format_check;
alter table public.recordings
  add constraint recordings_format_check
  check (
    format in (
      'email',
      'slack',
      'report',
      'linkedin',
      'journal',
      'sales',
      'post_call_followup',
      'crm_note',
      'voicemail_script',
      'pipeline_update'
    )
  );

alter table public.generations drop constraint if exists generations_format_check;
alter table public.generations
  add constraint generations_format_check
  check (
    format in (
      'email',
      'slack',
      'report',
      'linkedin',
      'journal',
      'sales',
      'post_call_followup',
      'crm_note',
      'voicemail_script',
      'pipeline_update'
    )
  );
