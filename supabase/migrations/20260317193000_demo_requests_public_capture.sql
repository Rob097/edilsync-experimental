begin;

create table if not exists public.demo_requests (
  id text primary key default gen_random_uuid()::text,
  full_name text not null,
  email text not null,
  company_name text,
  role_label text,
  message text,
  locale text not null default 'it' check (locale in ('it', 'en')),
  source_path text,
  status text not null default 'new' check (status in ('new', 'contacted', 'qualified', 'archived')),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by text
);

create index if not exists demo_requests_created_date_idx on public.demo_requests(created_date desc);
create index if not exists demo_requests_status_idx on public.demo_requests(status);

alter table public.demo_requests enable row level security;

create trigger set_demo_requests_audit_fields
before insert or update on public.demo_requests
for each row execute function public.set_audit_fields();

create policy demo_requests_public_insert on public.demo_requests
for insert to anon, authenticated
with check (
  length(trim(full_name)) > 1
  and position('@' in email) > 1
);

create policy demo_requests_admin_read on public.demo_requests
for select to authenticated
using (public.is_admin());

create policy demo_requests_admin_update on public.demo_requests
for update to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy demo_requests_admin_delete on public.demo_requests
for delete to authenticated
using (public.is_admin());

comment on table public.demo_requests is 'Public contact and demo requests from marketing website';

commit;
