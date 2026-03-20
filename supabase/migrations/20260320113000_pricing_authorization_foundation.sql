begin;

create or replace function public.resolve_company_plan_code(target_company_id text)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select case
    when exists (
      select 1
      from public.company_subscriptions cs
      where cs.company_id = target_company_id
        and cs.plan_code <> 'free'
        and cs.billing_status = 'active'
    ) then (
      select cs.plan_code
      from public.company_subscriptions cs
      where cs.company_id = target_company_id
        and cs.plan_code <> 'free'
        and cs.billing_status = 'active'
      order by cs.updated_date desc
      limit 1
    )
    else 'free'
  end;
$$;

create or replace function public.is_company_paid(target_company_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.resolve_company_plan_code(target_company_id) <> 'free';
$$;

create or replace function public.resolve_active_project_sponsor_company_id(target_project_id text)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select ps.sponsor_company_id
  from public.project_sponsorships ps
  where ps.project_id = target_project_id
    and ps.status = 'active'
    and ps.ended_at is null
  order by ps.started_at desc, ps.created_date desc
  limit 1;
$$;

create or replace function public.is_project_sponsored(target_project_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.resolve_active_project_sponsor_company_id(target_project_id) is not null;
$$;

create or replace function public.resolve_project_effective_plan_code(target_project_id text)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select case
    when public.is_project_sponsored(target_project_id)
      then public.resolve_company_plan_code(public.resolve_active_project_sponsor_company_id(target_project_id))
    else 'free'
  end;
$$;

create or replace function public.resolve_company_feature_access(target_company_id text, target_feature_key text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with resolved_plan as (
    select public.resolve_company_plan_code(target_company_id) as plan_code
  ), rule_data as (
    select
      afr.feature_key,
      afr.scope_type,
      pfr.plan_code,
      pfr.access_level,
      pfr.config_json
    from public.app_features afr
    join public.plan_feature_rules pfr
      on pfr.feature_key = afr.feature_key
    join resolved_plan rp
      on rp.plan_code = pfr.plan_code
    where afr.feature_key = target_feature_key
  )
  select coalesce(
    (
      select jsonb_build_object(
        'feature_key', rd.feature_key,
        'scope_type', rd.scope_type,
        'plan_code', rd.plan_code,
        'access_level', rd.access_level,
        'config', rd.config_json
      )
      from rule_data rd
      limit 1
    ),
    jsonb_build_object(
      'feature_key', target_feature_key,
      'scope_type', null,
      'plan_code', public.resolve_company_plan_code(target_company_id),
      'access_level', 'disabled',
      'config', '{}'::jsonb
    )
  );
$$;

create or replace function public.resolve_project_feature_access(target_project_id text, target_feature_key text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with resolved_plan as (
    select public.resolve_project_effective_plan_code(target_project_id) as plan_code
  ), rule_data as (
    select
      afr.feature_key,
      afr.scope_type,
      pfr.plan_code,
      pfr.access_level,
      pfr.config_json
    from public.app_features afr
    join public.plan_feature_rules pfr
      on pfr.feature_key = afr.feature_key
    join resolved_plan rp
      on rp.plan_code = pfr.plan_code
    where afr.feature_key = target_feature_key
  )
  select coalesce(
    (
      select jsonb_build_object(
        'feature_key', rd.feature_key,
        'scope_type', rd.scope_type,
        'plan_code', rd.plan_code,
        'access_level', rd.access_level,
        'config', rd.config_json,
        'is_sponsored', public.is_project_sponsored(target_project_id),
        'sponsor_company_id', public.resolve_active_project_sponsor_company_id(target_project_id)
      )
      from rule_data rd
      limit 1
    ),
    jsonb_build_object(
      'feature_key', target_feature_key,
      'scope_type', null,
      'plan_code', public.resolve_project_effective_plan_code(target_project_id),
      'access_level', 'disabled',
      'config', '{}'::jsonb,
      'is_sponsored', public.is_project_sponsored(target_project_id),
      'sponsor_company_id', public.resolve_active_project_sponsor_company_id(target_project_id)
    )
  );
$$;

create or replace function public.is_company_feature_enabled(target_company_id text, target_feature_key text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (public.resolve_company_feature_access(target_company_id, target_feature_key) ->> 'access_level') in ('enabled', 'limited'),
    false
  );
$$;

create or replace function public.is_project_feature_enabled(target_project_id text, target_feature_key text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (public.resolve_project_feature_access(target_project_id, target_feature_key) ->> 'access_level') in ('enabled', 'limited'),
    false
  );
$$;

create or replace function public.is_active_project_participant(target_project_id text)
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
      and (
        (pp.participant_type = 'personal' and pp.user_email = public.current_user_email())
        or (pp.participant_type = 'company' and pp.company_id = any(public.current_company_ids()))
      )
  ) or public.is_admin();
$$;

create or replace function public.can_current_user_read_project_milestones(target_project_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select (
    public.is_project_feature_enabled(target_project_id, 'project_milestones')
    and public.is_active_project_participant(target_project_id)
  ) or public.is_admin();
$$;

create or replace function public.can_current_user_manage_project_milestones(target_project_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select (
    public.is_project_feature_enabled(target_project_id, 'project_milestones')
    and public.is_active_project_participant(target_project_id)
  ) or public.is_admin();
$$;

create or replace function public.can_manage_company_billing(target_company_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select target_company_id = any(public.current_admin_company_ids()) or public.is_admin();
$$;

create or replace function public.can_company_sponsor_project(target_company_id text, target_project_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select (
    public.can_manage_company_billing(target_company_id)
    and public.is_company_paid(target_company_id)
    and exists (
      select 1
      from public.project_participants pp
      where pp.project_id = target_project_id
        and pp.status = 'active'
        and pp.participant_type = 'company'
        and pp.company_id = target_company_id
    )
  ) or public.is_admin();
$$;

create or replace function public.can_read_project_finance(target_project_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select (
    public.is_project_feature_enabled(target_project_id, 'project_finance')
    and exists (
      select 1
      from public.project_participants pp
      where pp.project_id = target_project_id
        and pp.status = 'active'
        and pp.project_role in ('homeowner', 'contractor')
        and (
          (pp.participant_type = 'personal' and pp.user_email = public.current_user_email())
          or (pp.participant_type = 'company' and pp.company_id = any(public.current_company_ids()))
        )
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
  select (
    public.is_project_feature_enabled(target_project_id, 'project_finance')
    and exists (
      select 1
      from public.project_participants pp
      where pp.project_id = target_project_id
        and pp.status = 'active'
        and pp.project_role = 'contractor'
        and (
          (pp.participant_type = 'personal' and pp.user_email = public.current_user_email())
          or (pp.participant_type = 'company' and pp.company_id = any(public.current_admin_company_ids()))
        )
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
  select (
    public.is_project_feature_enabled(target_project_id, 'project_finance')
    and exists (
      select 1
      from public.project_participants pp
      where pp.project_id = target_project_id
        and pp.status = 'active'
        and pp.project_role = 'contractor'
        and (
          (pp.participant_type = 'personal' and pp.user_email = public.current_user_email())
          or (pp.participant_type = 'company' and pp.company_id = any(public.current_company_ids()))
        )
    )
  ) or public.is_admin();
$$;

drop policy if exists milestones_create on public.milestones;
drop policy if exists milestones_read on public.milestones;
drop policy if exists milestones_update on public.milestones;
drop policy if exists milestones_delete on public.milestones;

create policy milestones_create on public.milestones
for insert to authenticated
with check (public.can_current_user_manage_project_milestones(project_id));

create policy milestones_read on public.milestones
for select to authenticated
using (public.can_current_user_read_project_milestones(project_id));

create policy milestones_update on public.milestones
for update to authenticated
using (public.can_current_user_manage_project_milestones(project_id))
with check (public.can_current_user_manage_project_milestones(project_id));

create policy milestones_delete on public.milestones
for delete to authenticated
using (
  public.can_current_user_manage_project_milestones(project_id)
  and (created_by = public.current_user_email() or public.is_admin())
);

drop policy if exists company_subscriptions_create on public.company_subscriptions;
drop policy if exists company_subscriptions_update on public.company_subscriptions;
drop policy if exists company_subscriptions_delete on public.company_subscriptions;

create policy company_subscriptions_create on public.company_subscriptions
for insert to authenticated
with check (public.can_manage_company_billing(company_id));

create policy company_subscriptions_update on public.company_subscriptions
for update to authenticated
using (public.can_manage_company_billing(company_id))
with check (public.can_manage_company_billing(company_id));

create policy company_subscriptions_delete on public.company_subscriptions
for delete to authenticated
using (public.can_manage_company_billing(company_id));

drop policy if exists project_sponsorships_create on public.project_sponsorships;
drop policy if exists project_sponsorships_update on public.project_sponsorships;
drop policy if exists project_sponsorships_delete on public.project_sponsorships;

create policy project_sponsorships_create on public.project_sponsorships
for insert to authenticated
with check (public.can_company_sponsor_project(sponsor_company_id, project_id));

create policy project_sponsorships_update on public.project_sponsorships
for update to authenticated
using (public.can_company_sponsor_project(sponsor_company_id, project_id))
with check (public.can_company_sponsor_project(sponsor_company_id, project_id));

create policy project_sponsorships_delete on public.project_sponsorships
for delete to authenticated
using (public.can_company_sponsor_project(sponsor_company_id, project_id));

commit;