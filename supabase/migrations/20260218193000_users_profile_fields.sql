begin;

alter table public.users
  add column if not exists display_name text,
  add column if not exists phone text;

commit;
