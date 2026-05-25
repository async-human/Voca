-- Backfill profiles for users who signed up before the trigger existed
insert into public.profiles (id, email)
select id, email from auth.users
on conflict (id) do update set email = excluded.email;
