begin;

-- Restrict application role to admin|normal for consistency.
alter table public.users
  drop constraint if exists users_role_allowed;

alter table public.users
  add constraint users_role_allowed
  check (role in ('admin', 'normal'));

-- Keep company_type optional but, when present, enforce known values.
alter table public.companies
  drop constraint if exists companies_company_type_allowed;

alter table public.companies
  add constraint companies_company_type_allowed
  check (
    company_type is null
    or company_type in (
      'general_contractor',
      'excavation',
      'demolition',
      'foundations',
      'concrete_structures',
      'metal_carpentry',
      'masonry',
      'roofing_tinsmithing',
      'waterproofing_insulation',
      'electrical_systems',
      'plumbing_hvac',
      'drywall',
      'flooring_cladding',
      'painting',
      'fixtures_windows',
      'blacksmith',
      'restoration',
      'architecture_studio',
      'engineering_studio',
      'surveying_studio',
      'design_studio',
      'supplier',
      'other'
    )
  );

-- Enforce canonical company member role values.
alter table public.company_members
  drop constraint if exists company_members_company_member_role_allowed;

alter table public.company_members
  add constraint company_members_company_member_role_allowed
  check (
    company_member_role is null
    or company_member_role in (
      'owner_admin',
      'project_manager',
      'site_manager',
      'crew_leader',
      'technical_office',
      'safety_manager',
      'worker',
      'backoffice',
      'external_consultant'
    )
  );

-- Extend project roles with supplier while keeping existing roles valid.
alter table public.project_participants
  drop constraint if exists project_participants_project_role_allowed;

alter table public.project_participants
  add constraint project_participants_project_role_allowed
  check (
    project_role in (
      'homeowner',
      'contractor',
      'subcontractor',
      'architect',
      'engineer',
      'surveyor',
      'designer',
      'consultant',
      'supplier'
    )
  );

-- Access helper functions should be VOLATILE in auth-dependent contexts.
create or replace function public.current_user_email()
returns text
language sql
volatile
security definer
set search_path = public
as $$
  select coalesce(
    auth.jwt() ->> 'email',
    (select u.email from public.users u where u.auth_user_id = auth.uid() limit 1)
  );
$$;

create or replace function public.current_company_ids()
returns text[]
language sql
volatile
security definer
set search_path = public
as $$
  select coalesce((select u.company_ids from public.users u where u.email = public.current_user_email() limit 1), '{}');
$$;

create or replace function public.current_admin_company_ids()
returns text[]
language sql
volatile
security definer
set search_path = public
as $$
  select coalesce((select u.admin_company_ids from public.users u where u.email = public.current_user_email() limit 1), '{}');
$$;

create or replace function public.current_project_ids()
returns text[]
language sql
volatile
security definer
set search_path = public
as $$
  select coalesce((select u.project_ids from public.users u where u.email = public.current_user_email() limit 1), '{}');
$$;

create or replace function public.is_admin()
returns boolean
language sql
volatile
security definer
set search_path = public
as $$
  select exists(
    select 1
    from public.users u
    where u.email = public.current_user_email()
      and u.role = 'admin'
  );
$$;

-- Harden permissive insert policies while keeping current product behavior.
drop policy if exists companies_create on public.companies;
create policy companies_create on public.companies
for insert to authenticated
with check (created_by = public.current_user_email());

drop policy if exists projects_create on public.projects;
create policy projects_create on public.projects
for insert to authenticated
with check (created_by = public.current_user_email());

drop policy if exists channel_members_create on public.channel_members;
create policy channel_members_create on public.channel_members
for insert to authenticated
with check (
  user_email = public.current_user_email()
  or company_id = any(public.current_company_ids())
  or project_id = any(public.current_project_ids())
  or created_by = public.current_user_email()
);

drop policy if exists messages_create on public.messages;
create policy messages_create on public.messages
for insert to authenticated
with check (
  sender_email = public.current_user_email()
  and (
    project_id = any(public.current_project_ids())
    or company_id = any(public.current_company_ids())
    or created_by = public.current_user_email()
  )
);

drop policy if exists events_create on public.events;
create policy events_create on public.events
for insert to authenticated
with check (
  creator_email = public.current_user_email()
  and (
    owner_company_id = any(public.current_company_ids())
    or owner_project_id = any(public.current_project_ids())
    or created_by = public.current_user_email()
  )
);

drop policy if exists event_participants_create on public.event_participants;
create policy event_participants_create on public.event_participants
for insert to authenticated
with check (
  user_email = public.current_user_email()
  or company_id = any(public.current_company_ids())
  or created_by = public.current_user_email()
);

drop policy if exists notifications_create on public.notifications;
create policy notifications_create on public.notifications
for insert to authenticated
with check (
  user_email = public.current_user_email()
  or created_by = public.current_user_email()
  or public.is_admin()
);

drop policy if exists notification_preferences_create on public.notification_preferences;
create policy notification_preferences_create on public.notification_preferences
for insert to authenticated
with check (
  user_email = public.current_user_email()
  or public.is_admin()
);

drop policy if exists app_logs_insert on public.app_logs;
create policy app_logs_insert on public.app_logs
for insert to authenticated
with check (
  user_email = public.current_user_email()
  or public.is_admin()
);

commit;
