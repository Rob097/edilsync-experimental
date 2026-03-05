begin;

create table if not exists public.dispute_cases (
  id text primary key default gen_random_uuid()::text,
  project_id text not null,
  task_id text,
  change_request_id text,
  opened_by_participant_id text,
  against_participant_id text,
  category text not null default 'other',
  status text not null default 'open',
  title text not null,
  summary text not null,
  amount_impact numeric,
  time_impact_days numeric,
  resolution_note text,
  resolved_at timestamptz,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by text
);

create table if not exists public.dispute_events (
  id text primary key default gen_random_uuid()::text,
  dispute_case_id text not null,
  project_id text not null,
  actor_participant_id text,
  event_type text not null,
  note text,
  payload jsonb,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by text
);

create table if not exists public.dispute_evidence_items (
  id text primary key default gen_random_uuid()::text,
  dispute_case_id text not null,
  project_id text not null,
  source_type text not null,
  source_id text,
  snapshot jsonb,
  note text,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by text
);

create index if not exists idx_dispute_cases_project_id on public.dispute_cases(project_id);
create index if not exists idx_dispute_cases_status on public.dispute_cases(status);
create index if not exists idx_dispute_cases_task_id on public.dispute_cases(task_id);
create index if not exists idx_dispute_events_case_id on public.dispute_events(dispute_case_id);
create index if not exists idx_dispute_events_project_id on public.dispute_events(project_id);
create index if not exists idx_dispute_evidence_case_id on public.dispute_evidence_items(dispute_case_id);

alter table public.dispute_cases enable row level security;
alter table public.dispute_events enable row level security;
alter table public.dispute_evidence_items enable row level security;

create policy dispute_cases_create on public.dispute_cases for insert to authenticated with check (
  project_id = any(public.current_project_ids()) or public.is_admin()
);
create policy dispute_cases_read on public.dispute_cases for select to authenticated using (
  project_id = any(public.current_project_ids()) or public.is_admin()
);
create policy dispute_cases_update on public.dispute_cases for update to authenticated using (
  project_id = any(public.current_project_ids()) or created_by = public.current_user_email() or public.is_admin()
) with check (
  project_id = any(public.current_project_ids()) or created_by = public.current_user_email() or public.is_admin()
);
create policy dispute_cases_delete on public.dispute_cases for delete to authenticated using (
  created_by = public.current_user_email() or public.is_admin()
);

create policy dispute_events_create on public.dispute_events for insert to authenticated with check (
  project_id = any(public.current_project_ids()) or public.is_admin()
);
create policy dispute_events_read on public.dispute_events for select to authenticated using (
  project_id = any(public.current_project_ids()) or public.is_admin()
);
create policy dispute_events_update on public.dispute_events for update to authenticated using (
  created_by = public.current_user_email() or public.is_admin()
) with check (
  created_by = public.current_user_email() or public.is_admin()
);
create policy dispute_events_delete on public.dispute_events for delete to authenticated using (
  created_by = public.current_user_email() or public.is_admin()
);

create policy dispute_evidence_create on public.dispute_evidence_items for insert to authenticated with check (
  project_id = any(public.current_project_ids()) or public.is_admin()
);
create policy dispute_evidence_read on public.dispute_evidence_items for select to authenticated using (
  project_id = any(public.current_project_ids()) or public.is_admin()
);
create policy dispute_evidence_update on public.dispute_evidence_items for update to authenticated using (
  created_by = public.current_user_email() or public.is_admin()
) with check (
  created_by = public.current_user_email() or public.is_admin()
);
create policy dispute_evidence_delete on public.dispute_evidence_items for delete to authenticated using (
  created_by = public.current_user_email() or public.is_admin()
);

create trigger trg_dispute_cases_audit
before insert or update on public.dispute_cases
for each row execute function public.set_audit_fields();

create trigger trg_dispute_events_audit
before insert or update on public.dispute_events
for each row execute function public.set_audit_fields();

create trigger trg_dispute_evidence_audit
before insert or update on public.dispute_evidence_items
for each row execute function public.set_audit_fields();

commit;
