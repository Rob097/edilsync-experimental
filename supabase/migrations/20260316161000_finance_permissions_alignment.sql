begin;

create or replace function public.can_read_project_finance(target_project_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.project_participants pp
    where pp.project_id = target_project_id
      and pp.status = 'active'
      and pp.project_role in ('homeowner', 'contractor')
      and (
        (pp.participant_type = 'personal' and pp.user_email = public.current_user_email())
        or (pp.participant_type = 'company' and pp.company_id = any(public.current_company_ids()))
      )
  ) or public.is_admin();
$$;

create or replace function public.can_manage_project_finance(target_project_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.project_participants pp
    where pp.project_id = target_project_id
      and pp.status = 'active'
      and pp.project_role = 'contractor'
      and (
        (pp.participant_type = 'personal' and pp.user_email = public.current_user_email())
        or (pp.participant_type = 'company' and pp.company_id = any(public.current_admin_company_ids()))
      )
  ) or public.is_admin();
$$;

create or replace function public.can_record_project_finance_cost(target_project_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.project_participants pp
    where pp.project_id = target_project_id
      and pp.status = 'active'
      and pp.project_role = 'contractor'
      and (
        (pp.participant_type = 'personal' and pp.user_email = public.current_user_email())
        or (pp.participant_type = 'company' and pp.company_id = any(public.current_company_ids()))
      )
  ) or public.is_admin();
$$;

create or replace function public.can_read_company_labor_rates(target_company_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select target_company_id = any(public.current_company_ids()) or public.is_admin();
$$;

create or replace function public.can_manage_company_labor_rates(target_company_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select target_company_id = any(public.current_admin_company_ids()) or public.is_admin();
$$;

drop policy if exists project_financial_settings_create on public.project_financial_settings;
drop policy if exists project_financial_settings_read on public.project_financial_settings;
drop policy if exists project_financial_settings_update on public.project_financial_settings;
drop policy if exists project_financial_settings_delete on public.project_financial_settings;

create policy project_financial_settings_create on public.project_financial_settings
for insert to authenticated
with check (public.can_manage_project_finance(project_id));

create policy project_financial_settings_read on public.project_financial_settings
for select to authenticated
using (public.can_read_project_finance(project_id));

create policy project_financial_settings_update on public.project_financial_settings
for update to authenticated
using (public.can_manage_project_finance(project_id))
with check (public.can_manage_project_finance(project_id));

create policy project_financial_settings_delete on public.project_financial_settings
for delete to authenticated
using (public.can_manage_project_finance(project_id));

drop policy if exists budget_lines_create on public.budget_lines;
drop policy if exists budget_lines_read on public.budget_lines;
drop policy if exists budget_lines_update on public.budget_lines;
drop policy if exists budget_lines_delete on public.budget_lines;

create policy budget_lines_create on public.budget_lines
for insert to authenticated
with check (public.can_manage_project_finance(project_id));

create policy budget_lines_read on public.budget_lines
for select to authenticated
using (public.can_read_project_finance(project_id));

create policy budget_lines_update on public.budget_lines
for update to authenticated
using (public.can_manage_project_finance(project_id))
with check (public.can_manage_project_finance(project_id));

create policy budget_lines_delete on public.budget_lines
for delete to authenticated
using (public.can_manage_project_finance(project_id));

drop policy if exists cost_entries_create on public.cost_entries;
drop policy if exists cost_entries_read on public.cost_entries;
drop policy if exists cost_entries_update on public.cost_entries;
drop policy if exists cost_entries_delete on public.cost_entries;

create policy cost_entries_create on public.cost_entries
for insert to authenticated
with check (public.can_record_project_finance_cost(project_id));

create policy cost_entries_read on public.cost_entries
for select to authenticated
using (public.can_read_project_finance(project_id));

create policy cost_entries_update on public.cost_entries
for update to authenticated
using (public.can_manage_project_finance(project_id))
with check (public.can_manage_project_finance(project_id));

create policy cost_entries_delete on public.cost_entries
for delete to authenticated
using (public.can_manage_project_finance(project_id));

drop policy if exists labor_rates_create on public.labor_rates;
drop policy if exists labor_rates_read on public.labor_rates;
drop policy if exists labor_rates_update on public.labor_rates;
drop policy if exists labor_rates_delete on public.labor_rates;

create policy labor_rates_create on public.labor_rates
for insert to authenticated
with check (public.can_manage_company_labor_rates(company_id));

create policy labor_rates_read on public.labor_rates
for select to authenticated
using (public.can_read_company_labor_rates(company_id));

create policy labor_rates_update on public.labor_rates
for update to authenticated
using (public.can_manage_company_labor_rates(company_id))
with check (public.can_manage_company_labor_rates(company_id));

create policy labor_rates_delete on public.labor_rates
for delete to authenticated
using (public.can_manage_company_labor_rates(company_id));

drop policy if exists project_company_commercials_create on public.project_company_commercials;
drop policy if exists project_company_commercials_read on public.project_company_commercials;
drop policy if exists project_company_commercials_update on public.project_company_commercials;
drop policy if exists project_company_commercials_delete on public.project_company_commercials;

create policy project_company_commercials_create on public.project_company_commercials
for insert to authenticated
with check (public.can_manage_project_finance(project_id));

create policy project_company_commercials_read on public.project_company_commercials
for select to authenticated
using (public.can_read_project_finance(project_id));

create policy project_company_commercials_update on public.project_company_commercials
for update to authenticated
using (public.can_manage_project_finance(project_id))
with check (public.can_manage_project_finance(project_id));

create policy project_company_commercials_delete on public.project_company_commercials
for delete to authenticated
using (public.can_manage_project_finance(project_id));

drop policy if exists progress_statements_create on public.progress_statements;
drop policy if exists progress_statements_read on public.progress_statements;
drop policy if exists progress_statements_update on public.progress_statements;
drop policy if exists progress_statements_delete on public.progress_statements;

create policy progress_statements_create on public.progress_statements
for insert to authenticated
with check (public.can_manage_project_finance(project_id));

create policy progress_statements_read on public.progress_statements
for select to authenticated
using (public.can_read_project_finance(project_id));

create policy progress_statements_update on public.progress_statements
for update to authenticated
using (public.can_manage_project_finance(project_id))
with check (public.can_manage_project_finance(project_id));

create policy progress_statements_delete on public.progress_statements
for delete to authenticated
using (public.can_manage_project_finance(project_id));

commit;