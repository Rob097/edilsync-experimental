begin;

create table if not exists public.project_financial_settings (
  id text primary key default gen_random_uuid()::text,
  project_id text not null,
  currency text not null default 'EUR',
  budget_tracking_mode text not null default 'simple' check (budget_tracking_mode in ('simple', 'cost_code')),
  labor_cost_method text not null default 'from_work_sessions' check (labor_cost_method in ('manual', 'from_work_sessions')),
  financial_visibility text not null default 'project_full' check (financial_visibility in ('project_full', 'company_scoped')),
  enable_progress_statements boolean not null default false,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by text,
  unique(project_id)
);

create table if not exists public.budget_lines (
  id text primary key default gen_random_uuid()::text,
  project_id text not null,
  code text,
  title text not null,
  category text not null check (category in ('labor', 'materials', 'equipment', 'subcontract', 'indirect', 'extra')),
  unit text,
  quantity_planned numeric,
  unit_cost_planned numeric,
  amount_planned numeric,
  company_id text,
  task_id text,
  milestone_id text,
  status text not null default 'active' check (status in ('active', 'archived')),
  notes text,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by text
);

create table if not exists public.cost_entries (
  id text primary key default gen_random_uuid()::text,
  project_id text not null,
  budget_line_id text,
  company_id text,
  cost_type text not null check (cost_type in ('labor', 'materials', 'equipment', 'subcontract', 'indirect', 'extra', 'adjustment')),
  description text not null,
  amount numeric not null,
  quantity numeric,
  unit_cost numeric,
  entry_date date not null default current_date,
  task_id text,
  source_type text not null default 'manual' check (source_type in ('manual', 'work_session', 'change_request', 'dispute', 'system')),
  source_id text,
  status text not null default 'recorded' check (status in ('recorded', 'approved', 'contested')),
  notes text,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by text
);

create table if not exists public.labor_rates (
  id text primary key default gen_random_uuid()::text,
  company_id text not null,
  project_id text,
  user_email text,
  company_member_role text,
  hourly_cost numeric not null,
  valid_from date not null,
  valid_to date,
  notes text,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by text,
  check (valid_to is null or valid_to >= valid_from)
);

create table if not exists public.project_company_commercials (
  id text primary key default gen_random_uuid()::text,
  project_id text not null,
  company_id text not null,
  contract_type text check (contract_type in ('lump_sum', 'unit_price', 'time_and_material')),
  contract_amount numeric,
  approved_variations_amount numeric default 0,
  notes text,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by text,
  unique(project_id, company_id)
);

create table if not exists public.progress_statements (
  id text primary key default gen_random_uuid()::text,
  project_id text not null,
  sequence_number integer not null,
  statement_date date not null,
  amount_matured numeric default 0,
  advances_paid numeric default 0,
  amount_to_pay numeric default 0,
  status text not null default 'draft' check (status in ('draft', 'approved', 'cancelled')),
  notes text,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by text,
  unique(project_id, sequence_number)
);

create index if not exists idx_budget_lines_project on public.budget_lines(project_id);
create index if not exists idx_budget_lines_company on public.budget_lines(company_id) where company_id is not null;
create index if not exists idx_cost_entries_project_date on public.cost_entries(project_id, entry_date desc);
create index if not exists idx_cost_entries_company on public.cost_entries(company_id) where company_id is not null;
create unique index if not exists idx_cost_entries_work_session_unique
on public.cost_entries(source_type, source_id)
where source_type = 'work_session' and source_id is not null;
create index if not exists idx_labor_rates_company_dates on public.labor_rates(company_id, valid_from desc);
create index if not exists idx_project_company_commercials_project on public.project_company_commercials(project_id);
create index if not exists idx_progress_statements_project on public.progress_statements(project_id);

alter table public.project_financial_settings enable row level security;
alter table public.budget_lines enable row level security;
alter table public.cost_entries enable row level security;
alter table public.labor_rates enable row level security;
alter table public.project_company_commercials enable row level security;
alter table public.progress_statements enable row level security;

drop trigger if exists trg_project_financial_settings_audit on public.project_financial_settings;
create trigger trg_project_financial_settings_audit
before insert or update on public.project_financial_settings
for each row execute function public.set_audit_fields();

drop trigger if exists trg_budget_lines_audit on public.budget_lines;
create trigger trg_budget_lines_audit
before insert or update on public.budget_lines
for each row execute function public.set_audit_fields();

drop trigger if exists trg_cost_entries_audit on public.cost_entries;
create trigger trg_cost_entries_audit
before insert or update on public.cost_entries
for each row execute function public.set_audit_fields();

drop trigger if exists trg_labor_rates_audit on public.labor_rates;
create trigger trg_labor_rates_audit
before insert or update on public.labor_rates
for each row execute function public.set_audit_fields();

drop trigger if exists trg_project_company_commercials_audit on public.project_company_commercials;
create trigger trg_project_company_commercials_audit
before insert or update on public.project_company_commercials
for each row execute function public.set_audit_fields();

drop trigger if exists trg_progress_statements_audit on public.progress_statements;
create trigger trg_progress_statements_audit
before insert or update on public.progress_statements
for each row execute function public.set_audit_fields();

create policy project_financial_settings_create on public.project_financial_settings
for insert to authenticated
with check (
  project_id in (
    select pp.project_id
    from public.project_participants pp
    where pp.status = 'active'
      and (
        (pp.participant_type = 'personal' and pp.user_email = public.current_user_email())
        or (pp.participant_type = 'company' and pp.company_id = any(public.current_admin_company_ids()))
      )
  )
  or public.is_admin()
);

create policy project_financial_settings_read on public.project_financial_settings
for select to authenticated
using (
  project_id in (
    select pp.project_id
    from public.project_participants pp
    where pp.status = 'active'
      and (
        (pp.participant_type = 'personal' and pp.user_email = public.current_user_email())
        or (pp.participant_type = 'company' and pp.company_id = any(public.current_company_ids()))
      )
  )
  or public.is_admin()
);

create policy project_financial_settings_update on public.project_financial_settings
for update to authenticated
using (
  project_id in (
    select pp.project_id
    from public.project_participants pp
    where pp.status = 'active'
      and (
        (pp.participant_type = 'personal' and pp.user_email = public.current_user_email())
        or (pp.participant_type = 'company' and pp.company_id = any(public.current_admin_company_ids()))
      )
  )
  or public.is_admin()
)
with check (
  project_id in (
    select pp.project_id
    from public.project_participants pp
    where pp.status = 'active'
      and (
        (pp.participant_type = 'personal' and pp.user_email = public.current_user_email())
        or (pp.participant_type = 'company' and pp.company_id = any(public.current_admin_company_ids()))
      )
  )
  or public.is_admin()
);

create policy project_financial_settings_delete on public.project_financial_settings
for delete to authenticated
using (
  project_id in (
    select pp.project_id
    from public.project_participants pp
    where pp.status = 'active'
      and (
        (pp.participant_type = 'personal' and pp.user_email = public.current_user_email())
        or (pp.participant_type = 'company' and pp.company_id = any(public.current_admin_company_ids()))
      )
  )
  or public.is_admin()
);

create policy budget_lines_create on public.budget_lines
for insert to authenticated
with check (
  project_id in (
    select pp.project_id
    from public.project_participants pp
    where pp.status = 'active'
      and (
        (pp.participant_type = 'personal' and pp.user_email = public.current_user_email())
        or (pp.participant_type = 'company' and pp.company_id = any(public.current_admin_company_ids()))
      )
  )
  or public.is_admin()
);

create policy budget_lines_read on public.budget_lines
for select to authenticated
using (
  project_id in (
    select pp.project_id
    from public.project_participants pp
    where pp.status = 'active'
      and (
        (pp.participant_type = 'personal' and pp.user_email = public.current_user_email())
        or (pp.participant_type = 'company' and pp.company_id = any(public.current_company_ids()))
      )
  )
  or public.is_admin()
);

create policy budget_lines_update on public.budget_lines
for update to authenticated
using (
  project_id in (
    select pp.project_id
    from public.project_participants pp
    where pp.status = 'active'
      and (
        (pp.participant_type = 'personal' and pp.user_email = public.current_user_email())
        or (pp.participant_type = 'company' and pp.company_id = any(public.current_admin_company_ids()))
      )
  )
  or public.is_admin()
)
with check (
  project_id in (
    select pp.project_id
    from public.project_participants pp
    where pp.status = 'active'
      and (
        (pp.participant_type = 'personal' and pp.user_email = public.current_user_email())
        or (pp.participant_type = 'company' and pp.company_id = any(public.current_admin_company_ids()))
      )
  )
  or public.is_admin()
);

create policy budget_lines_delete on public.budget_lines
for delete to authenticated
using (
  project_id in (
    select pp.project_id
    from public.project_participants pp
    where pp.status = 'active'
      and (
        (pp.participant_type = 'personal' and pp.user_email = public.current_user_email())
        or (pp.participant_type = 'company' and pp.company_id = any(public.current_admin_company_ids()))
      )
  )
  or public.is_admin()
);

create policy cost_entries_create on public.cost_entries
for insert to authenticated
with check (
  project_id in (
    select pp.project_id
    from public.project_participants pp
    where pp.status = 'active'
      and (
        (pp.participant_type = 'personal' and pp.user_email = public.current_user_email())
        or (pp.participant_type = 'company' and pp.company_id = any(public.current_company_ids()))
      )
  )
  or public.is_admin()
);

create policy cost_entries_read on public.cost_entries
for select to authenticated
using (
  project_id in (
    select pp.project_id
    from public.project_participants pp
    where pp.status = 'active'
      and (
        (pp.participant_type = 'personal' and pp.user_email = public.current_user_email())
        or (pp.participant_type = 'company' and pp.company_id = any(public.current_company_ids()))
      )
  )
  or public.is_admin()
);

create policy cost_entries_update on public.cost_entries
for update to authenticated
using (
  project_id in (
    select pp.project_id
    from public.project_participants pp
    where pp.status = 'active'
      and (
        (pp.participant_type = 'personal' and pp.user_email = public.current_user_email())
        or (pp.participant_type = 'company' and pp.company_id = any(public.current_admin_company_ids()))
      )
  )
  or public.is_admin()
)
with check (
  project_id in (
    select pp.project_id
    from public.project_participants pp
    where pp.status = 'active'
      and (
        (pp.participant_type = 'personal' and pp.user_email = public.current_user_email())
        or (pp.participant_type = 'company' and pp.company_id = any(public.current_admin_company_ids()))
      )
  )
  or public.is_admin()
);

create policy cost_entries_delete on public.cost_entries
for delete to authenticated
using (
  project_id in (
    select pp.project_id
    from public.project_participants pp
    where pp.status = 'active'
      and (
        (pp.participant_type = 'personal' and pp.user_email = public.current_user_email())
        or (pp.participant_type = 'company' and pp.company_id = any(public.current_admin_company_ids()))
      )
  )
  or public.is_admin()
);

create policy labor_rates_create on public.labor_rates
for insert to authenticated
with check (
  company_id = any(public.current_admin_company_ids())
  or public.is_admin()
);

create policy labor_rates_read on public.labor_rates
for select to authenticated
using (
  company_id = any(public.current_company_ids())
  or public.is_admin()
);

create policy labor_rates_update on public.labor_rates
for update to authenticated
using (
  company_id = any(public.current_admin_company_ids())
  or public.is_admin()
)
with check (
  company_id = any(public.current_admin_company_ids())
  or public.is_admin()
);

create policy labor_rates_delete on public.labor_rates
for delete to authenticated
using (
  company_id = any(public.current_admin_company_ids())
  or public.is_admin()
);

create policy project_company_commercials_create on public.project_company_commercials
for insert to authenticated
with check (
  project_id in (
    select pp.project_id
    from public.project_participants pp
    where pp.status = 'active'
      and (
        (pp.participant_type = 'personal' and pp.user_email = public.current_user_email())
        or (pp.participant_type = 'company' and pp.company_id = any(public.current_admin_company_ids()))
      )
  )
  or public.is_admin()
);

create policy project_company_commercials_read on public.project_company_commercials
for select to authenticated
using (
  project_id in (
    select pp.project_id
    from public.project_participants pp
    where pp.status = 'active'
      and (
        (pp.participant_type = 'personal' and pp.user_email = public.current_user_email())
        or (pp.participant_type = 'company' and pp.company_id = any(public.current_company_ids()))
      )
  )
  or public.is_admin()
);

create policy project_company_commercials_update on public.project_company_commercials
for update to authenticated
using (
  project_id in (
    select pp.project_id
    from public.project_participants pp
    where pp.status = 'active'
      and (
        (pp.participant_type = 'personal' and pp.user_email = public.current_user_email())
        or (pp.participant_type = 'company' and pp.company_id = any(public.current_admin_company_ids()))
      )
  )
  or public.is_admin()
)
with check (
  project_id in (
    select pp.project_id
    from public.project_participants pp
    where pp.status = 'active'
      and (
        (pp.participant_type = 'personal' and pp.user_email = public.current_user_email())
        or (pp.participant_type = 'company' and pp.company_id = any(public.current_admin_company_ids()))
      )
  )
  or public.is_admin()
);

create policy project_company_commercials_delete on public.project_company_commercials
for delete to authenticated
using (
  project_id in (
    select pp.project_id
    from public.project_participants pp
    where pp.status = 'active'
      and (
        (pp.participant_type = 'personal' and pp.user_email = public.current_user_email())
        or (pp.participant_type = 'company' and pp.company_id = any(public.current_admin_company_ids()))
      )
  )
  or public.is_admin()
);

create policy progress_statements_create on public.progress_statements
for insert to authenticated
with check (
  project_id in (
    select pp.project_id
    from public.project_participants pp
    where pp.status = 'active'
      and (
        (pp.participant_type = 'personal' and pp.user_email = public.current_user_email())
        or (pp.participant_type = 'company' and pp.company_id = any(public.current_admin_company_ids()))
      )
  )
  or public.is_admin()
);

create policy progress_statements_read on public.progress_statements
for select to authenticated
using (
  project_id in (
    select pp.project_id
    from public.project_participants pp
    where pp.status = 'active'
      and (
        (pp.participant_type = 'personal' and pp.user_email = public.current_user_email())
        or (pp.participant_type = 'company' and pp.company_id = any(public.current_company_ids()))
      )
  )
  or public.is_admin()
);

create policy progress_statements_update on public.progress_statements
for update to authenticated
using (
  project_id in (
    select pp.project_id
    from public.project_participants pp
    where pp.status = 'active'
      and (
        (pp.participant_type = 'personal' and pp.user_email = public.current_user_email())
        or (pp.participant_type = 'company' and pp.company_id = any(public.current_admin_company_ids()))
      )
  )
  or public.is_admin()
)
with check (
  project_id in (
    select pp.project_id
    from public.project_participants pp
    where pp.status = 'active'
      and (
        (pp.participant_type = 'personal' and pp.user_email = public.current_user_email())
        or (pp.participant_type = 'company' and pp.company_id = any(public.current_admin_company_ids()))
      )
  )
  or public.is_admin()
);

create policy progress_statements_delete on public.progress_statements
for delete to authenticated
using (
  project_id in (
    select pp.project_id
    from public.project_participants pp
    where pp.status = 'active'
      and (
        (pp.participant_type = 'personal' and pp.user_email = public.current_user_email())
        or (pp.participant_type = 'company' and pp.company_id = any(public.current_admin_company_ids()))
      )
  )
  or public.is_admin()
);

commit;
