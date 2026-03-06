begin;

create table if not exists public.work_sessions (
  id text primary key default gen_random_uuid()::text,
  company_id text not null,
  user_email text not null,
  project_id text,
  started_at timestamptz not null,
  ended_at timestamptz,
  note text,
  entry_type text not null default 'live' check (entry_type in ('live', 'manual_admin')),
  manual_reason text,
  source_mode text check (source_mode in ('normal', 'essential', 'operational', 'api')),
  clock_in_latitude double precision,
  clock_in_longitude double precision,
  clock_out_latitude double precision,
  clock_out_longitude double precision,
  clock_in_accuracy_m double precision,
  clock_out_accuracy_m double precision,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by text
);

create index if not exists idx_work_sessions_company_started on public.work_sessions(company_id, started_at desc);
create index if not exists idx_work_sessions_user_started on public.work_sessions(user_email, started_at desc);
create index if not exists idx_work_sessions_project on public.work_sessions(project_id) where project_id is not null;

create unique index if not exists idx_work_sessions_open_unique
on public.work_sessions(company_id, user_email)
where ended_at is null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'work_sessions_end_after_start'
  ) then
    alter table public.work_sessions
      add constraint work_sessions_end_after_start
      check (ended_at is null or ended_at >= started_at);
  end if;
end;
$$;

drop trigger if exists trg_work_sessions_audit on public.work_sessions;
create trigger trg_work_sessions_audit
before insert or update on public.work_sessions
for each row execute function public.set_audit_fields();

alter table public.work_sessions enable row level security;

create policy work_sessions_create on public.work_sessions
for insert to authenticated
with check (
  (
    entry_type = 'live'
    and user_email = public.current_user_email()
    and company_id = any(public.current_company_ids())
  )
  or (
    entry_type = 'manual_admin'
    and company_id = any(public.current_admin_company_ids())
    and exists (
      select 1
      from public.company_members cm
      where cm.company_id = work_sessions.company_id
        and cm.user_email = work_sessions.user_email
        and cm.status = 'active'
    )
  )
);

create policy work_sessions_read on public.work_sessions
for select to authenticated
using (
  company_id = any(public.current_company_ids())
  or user_email = public.current_user_email()
  or public.is_admin()
);

create policy work_sessions_update on public.work_sessions
for update to authenticated
using (
  (
    company_id = any(public.current_company_ids())
    and user_email = public.current_user_email()
  )
  or company_id = any(public.current_admin_company_ids())
  or public.is_admin()
)
with check (
  (
    company_id = any(public.current_company_ids())
    and user_email = public.current_user_email()
  )
  or company_id = any(public.current_admin_company_ids())
  or public.is_admin()
);

create policy work_sessions_delete on public.work_sessions
for delete to authenticated
using (
  company_id = any(public.current_admin_company_ids())
  or public.is_admin()
);

commit;
