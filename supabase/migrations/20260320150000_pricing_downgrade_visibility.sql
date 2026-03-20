begin;

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
    and public.is_company_paid(ps.sponsor_company_id)
    and exists (
      select 1
      from public.project_participants pp
      where pp.project_id = ps.project_id
        and pp.status = 'active'
        and pp.participant_type = 'company'
        and pp.company_id = ps.sponsor_company_id
    )
  order by ps.started_at desc, ps.created_date desc
  limit 1;
$$;

create or replace function public.resolve_project_pricing_status(target_project_id text)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with project_data as (
    select
      p.id,
      p.owner_type,
      p.owner_company_id,
      p.owner_user_id
    from public.projects p
    where p.id = target_project_id
    limit 1
  ), sponsorship_history as (
    select exists (
      select 1
      from public.project_sponsorships ps
      where ps.project_id = target_project_id
    ) as has_sponsorship_history
  ), effective_sponsor as (
    select public.resolve_active_project_sponsor_company_id(target_project_id) as sponsor_company_id
  ), other_unsponsored_owned_projects as (
    select exists (
      select 1
      from public.projects p2
      join project_data pd on true
      where p2.id <> target_project_id
        and p2.owner_type = pd.owner_type
        and (
          (pd.owner_type = 'company' and p2.owner_company_id = pd.owner_company_id)
          or (pd.owner_type = 'personal' and p2.owner_user_id = pd.owner_user_id)
        )
        and public.resolve_active_project_sponsor_company_id(p2.id) is null
    ) as has_other_unsponsored_owned_project
  ), resolved as (
    select
      pd.id as project_id,
      es.sponsor_company_id,
      sh.has_sponsorship_history,
      ouop.has_other_unsponsored_owned_project,
      case
        when es.sponsor_company_id is not null then 'sponsored'
        when sh.has_sponsorship_history and ouop.has_other_unsponsored_owned_project then 'blocked_for_sponsor_loss'
        else 'unsponsored'
      end as status
    from project_data pd
    cross join sponsorship_history sh
    cross join effective_sponsor es
    cross join other_unsponsored_owned_projects ouop
  )
  select coalesce(
    (
      select jsonb_build_object(
        'project_id', r.project_id,
        'status', r.status,
        'is_sponsored', r.status = 'sponsored',
        'sponsor_company_id', r.sponsor_company_id,
        'has_sponsorship_history', r.has_sponsorship_history,
        'has_other_unsponsored_owned_project', r.has_other_unsponsored_owned_project,
        'premium_visibility_mode', case when r.status = 'blocked_for_sponsor_loss' then 'hidden' else 'visible_locked' end,
        'can_only_invite_companies', r.status = 'blocked_for_sponsor_loss',
        'reason_code', case when r.status = 'blocked_for_sponsor_loss' then 'sponsor_lost_while_owner_has_other_unsponsored_project' else null end
      )
      from resolved r
      limit 1
    ),
    jsonb_build_object(
      'project_id', target_project_id,
      'status', 'unsponsored',
      'is_sponsored', false,
      'sponsor_company_id', null,
      'has_sponsorship_history', false,
      'has_other_unsponsored_owned_project', false,
      'premium_visibility_mode', 'visible_locked',
      'can_only_invite_companies', false,
      'reason_code', null
    )
  );
$$;

create or replace function public.is_project_blocked_for_sponsor_loss(target_project_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (public.resolve_project_pricing_status(target_project_id) ->> 'status') = 'blocked_for_sponsor_loss',
    false
  );
$$;

commit;