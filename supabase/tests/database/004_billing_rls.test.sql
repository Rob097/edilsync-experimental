begin;

-- Scenario IDs: billing.rls.company-subscriptions.admin-read, billing.rls.company-subscriptions.admin-update, billing.rls.company-subscriptions.member-denied, billing.rls.company-subscriptions.outsider-denied, billing.rls.project-sponsorships.participant-read, billing.rls.project-sponsorships.participant-update-denied, billing.rls.project-sponsorships.sponsor-admin-read, billing.rls.project-sponsorships.sponsor-admin-update, billing.rls.project-sponsorships.outsider-denied

create extension if not exists pgtap with schema extensions;

create or replace function pg_temp.exec_row_count(sql_to_run text)
returns integer
language plpgsql
as $$
declare
  affected_rows integer;
begin
  execute sql_to_run;
  get diagnostics affected_rows = row_count;
  return affected_rows;
end;
$$;

select plan(12);

select set_config('request.jwt.claim.role', 'service_role', true);
select set_config('request.jwt.claims', '{"role":"service_role"}', true);

insert into public.users (
  id,
  auth_user_id,
  email,
  full_name,
  role,
  company_ids,
  admin_company_ids,
  project_ids,
  created_by
) values
  (
    'qa-rls-user-sponsor-admin',
    '55555555-5555-4555-8555-555555555555',
    'qa-rls-sponsor-admin@example.com',
    'QA RLS Sponsor Admin',
    'normal',
    array['qa-rls-company-sponsor'],
    array['qa-rls-company-sponsor'],
    '{}'::text[],
    'qa-pgtap'
  ),
  (
    'qa-rls-user-company-member',
    '66666666-6666-4666-8666-666666666666',
    'qa-rls-member@example.com',
    'QA RLS Company Member',
    'normal',
    array['qa-rls-company-sponsor'],
    '{}'::text[],
    '{}'::text[],
    'qa-pgtap'
  ),
  (
    'qa-rls-user-project-participant',
    '77777777-7777-4777-8777-777777777777',
    'qa-rls-participant@example.com',
    'QA RLS Project Participant',
    'normal',
    '{}'::text[],
    '{}'::text[],
    array['qa-rls-project'],
    'qa-pgtap'
  ),
  (
    'qa-rls-user-outsider',
    '88888888-8888-4888-8888-888888888888',
    'qa-rls-outsider@example.com',
    'QA RLS Outsider',
    'normal',
    '{}'::text[],
    '{}'::text[],
    '{}'::text[],
    'qa-pgtap'
  );

insert into public.companies (
  id,
  name,
  company_type,
  vat_number,
  address,
  email,
  description,
  created_by
) values
  (
    'qa-rls-company-owner',
    'QA RLS Owner Company',
    'general_contractor',
    'ITQARLSOWNER01',
    'Via QA Owner 1, Milano',
    'qa-owner@example.com',
    'Owner company fixture for billing RLS tests.',
    'qa-pgtap'
  ),
  (
    'qa-rls-company-sponsor',
    'QA RLS Sponsor Company',
    'plumbing_hvac',
    'ITQARLSSPONSOR01',
    'Via QA Sponsor 2, Bergamo',
    'qa-rls-sponsor-admin@example.com',
    'Sponsor company fixture for billing RLS tests.',
    'qa-pgtap'
  );

insert into public.projects (
  id,
  name,
  address,
  description,
  status,
  owner_type,
  owner_company_id,
  created_by
) values (
  'qa-rls-project',
  'QA RLS Project',
  'Via QA Project 3, Brescia',
  'Project fixture for sponsorship RLS tests.',
  'planning',
  'company',
  'qa-rls-company-owner',
  'qa-pgtap'
);

insert into public.project_participants (
  id,
  project_id,
  participant_type,
  user_id,
  user_email,
  company_id,
  project_role,
  status,
  can_invite,
  created_by
) values (
  'qa-rls-project-participant',
  'qa-rls-project',
  'personal',
  'qa-rls-user-project-participant',
  'qa-rls-participant@example.com',
  null,
  'homeowner',
  'active',
  false,
  'qa-pgtap'
);

insert into public.project_participants (
  id,
  project_id,
  participant_type,
  user_id,
  user_email,
  company_id,
  project_role,
  status,
  can_invite,
  created_by
) values (
  'qa-rls-project-sponsor-participant',
  'qa-rls-project',
  'company',
  null,
  'qa-rls-sponsor-admin@example.com',
  'qa-rls-company-sponsor',
  'subcontractor',
  'active',
  false,
  'qa-pgtap'
);

insert into public.company_subscriptions (
  id,
  company_id,
  plan_code,
  billing_status,
  billing_cycle,
  currency,
  created_by
) values (
  'qa-rls-company-subscription',
  'qa-rls-company-sponsor',
  'paid',
  'active',
  'monthly',
  'EUR',
  'qa-pgtap'
);

insert into public.project_sponsorships (
  id,
  project_id,
  sponsor_company_id,
  status,
  started_at,
  activation_source,
  created_by
) values (
  'qa-rls-project-sponsorship',
  'qa-rls-project',
  'qa-rls-company-sponsor',
  'active',
  now() - interval '2 days',
  'manual',
  'qa-pgtap'
);

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);

select set_config(
  'request.jwt.claims',
  '{"role":"authenticated","sub":"55555555-5555-4555-8555-555555555555","email":"qa-rls-sponsor-admin@example.com"}',
  true
);

select is(
  (select count(*)::integer from public.company_subscriptions where id = 'qa-rls-company-subscription'),
  1,
  'sponsor company admin can read their company subscription'
);

select is(
  pg_temp.exec_row_count(
    $sql$
      update public.company_subscriptions
      set cancel_at_period_end = true
      where id = 'qa-rls-company-subscription'
    $sql$
  ),
  1,
  'sponsor company admin can update their company subscription'
);

select is(
  (select cancel_at_period_end::text from public.company_subscriptions where id = 'qa-rls-company-subscription'),
  'true',
  'company subscription update is persisted for sponsor admin'
);

select set_config(
  'request.jwt.claims',
  '{"role":"authenticated","sub":"66666666-6666-4666-8666-666666666666","email":"qa-rls-member@example.com"}',
  true
);

select is(
  (select count(*)::integer from public.company_subscriptions where id = 'qa-rls-company-subscription'),
  0,
  'company member without admin rights cannot read company subscription'
);

select is(
  pg_temp.exec_row_count(
    $sql$
      update public.company_subscriptions
      set cancel_at_period_end = false
      where id = 'qa-rls-company-subscription'
    $sql$
  ),
  0,
  'company member without admin rights cannot update company subscription'
);

select set_config(
  'request.jwt.claims',
  '{"role":"authenticated","sub":"88888888-8888-4888-8888-888888888888","email":"qa-rls-outsider@example.com"}',
  true
);

select is(
  (select count(*)::integer from public.company_subscriptions where id = 'qa-rls-company-subscription'),
  0,
  'outsider cannot read company subscription'
);

select set_config(
  'request.jwt.claims',
  '{"role":"authenticated","sub":"77777777-7777-4777-8777-777777777777","email":"qa-rls-participant@example.com"}',
  true
);

select is(
  (select count(*)::integer from public.project_sponsorships where id = 'qa-rls-project-sponsorship'),
  1,
  'project participant can read project sponsorship'
);

select is(
  pg_temp.exec_row_count(
    $sql$
      update public.project_sponsorships
      set status = 'ended'
      where id = 'qa-rls-project-sponsorship'
    $sql$
  ),
  0,
  'project participant cannot update project sponsorship'
);

select set_config(
  'request.jwt.claims',
  '{"role":"authenticated","sub":"55555555-5555-4555-8555-555555555555","email":"qa-rls-sponsor-admin@example.com"}',
  true
);

select is(
  (select count(*)::integer from public.project_sponsorships where id = 'qa-rls-project-sponsorship'),
  1,
  'sponsor company admin can read project sponsorship'
);

select is(
  pg_temp.exec_row_count(
    $sql$
      update public.project_sponsorships
      set status = 'ended', ended_at = now()
      where id = 'qa-rls-project-sponsorship'
    $sql$
  ),
  1,
  'sponsor company admin can update project sponsorship'
);

select is(
  (select status from public.project_sponsorships where id = 'qa-rls-project-sponsorship'),
  'ended',
  'project sponsorship update is persisted for sponsor admin'
);

select set_config(
  'request.jwt.claims',
  '{"role":"authenticated","sub":"88888888-8888-4888-8888-888888888888","email":"qa-rls-outsider@example.com"}',
  true
);

select is(
  (select count(*)::integer from public.project_sponsorships where id = 'qa-rls-project-sponsorship'),
  0,
  'outsider cannot read project sponsorship'
);

select * from finish();
rollback;