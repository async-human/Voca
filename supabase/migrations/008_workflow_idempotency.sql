-- Workflow execution safety: prevent duplicate successful delivery actions.

alter table public.delivery_attempts
  add column if not exists idempotency_key text;

create unique index if not exists delivery_attempts_sent_idempotency_key_idx
  on public.delivery_attempts (user_id, idempotency_key)
  where idempotency_key is not null and status = 'sent';
