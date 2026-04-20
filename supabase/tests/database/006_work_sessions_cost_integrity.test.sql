begin;

-- Scenario IDs: work-sessions.unique-open-session, work-sessions.end-after-start, work-sessions.live-create-self, work-sessions.live-create-foreign-denied, cost-entries.unique-work-session-source

create extension if not exists pgtap with schema extensions;

create or replace function pg_temp.capture_error(sql_to_run text)
returns jsonb
language plpgsql
as $$
declare
  captured_sqlstate text;
  captured_message text;
begin
  execute sql_to_run;
  return jsonb_build_object('sqlstate', null, 'message', null);
exception when others then
  get stacked diagnostics
    captured_sqlstate = returned_sqlstate,
    captured_message = message_text;

  return jsonb_build_object(
    'sqlstate', captured_sqlstate,
    'message', captured_message
  );
end;
$$;

create or replace function pg_temp.matches_sqlstate(sql_to_run text, expected_sqlstate text)
returns boolean
language sql
as $$
  with attempt as (
    select pg_temp.capture_error(sql_to_run) as error
  )
  select (error ->> 'sqlstate') = expected_sqlstate
  from attempt;
$$;

select plan(7);

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
  created_by
) values
  (
    'qa-work-user-admin',
    '94111111-1111-4111-8111-111111111111',
    'qa-work-admin@example.com',
    'QA Work Admin',
    'normal',
    array['qa-work-company'],
    array['qa-work-company'],
    'qa-pgtap'
  ),
  (
    'qa-work-user-member',
    '94222222-2222-4222-8222-222222222222',
    'qa-work-member@example.com',
    'QA Work Member',
    'normal',
    array['qa-work-company'],
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
) values (
  'qa-work-company',
  'QA Work Company',
  'general_contractor',
  'ITQAWORK0001',
  'Via QA Work 7, Milano',
  'qa-work-admin@example.com',
  'Company fixture for work session integrity tests.',
  'qa-pgtap'
);

insert into public.company_members (
  id,
  company_id,
  user_id,
  user_email,
  role,
  profession,
  company_member_role,
  status,
  created_by
) values
  (
    'qa-work-company-member-admin',
    'qa-work-company',
    'qa-work-user-admin',
    'qa-work-admin@example.com',
    'admin',
    'owner_admin',
    'owner_admin',
    'active',
    'qa-pgtap'
  ),
  (
    'qa-work-company-member-worker',
    'qa-work-company',
    'qa-work-user-member',
    'qa-work-member@example.com',
    'member',
    'worker',
    'worker',
    'active',
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
  'qa-work-project',
  'QA Work Project',
  'Via QA Time 8, Bergamo',
  'Project fixture for work session and cost entry integrity tests.',
  'in_progress',
  'company',
  'qa-work-company',
  'qa-pgtap'
);

insert into public.work_sessions (
  id,
  company_id,
  user_email,
  project_id,
  started_at,
  ended_at,
  entry_type,
  source_mode,
  created_by
) values (
  'qa-work-session-base',
  'qa-work-company',
  'qa-work-member@example.com',
  'qa-work-project',
  now() - interval '3 hours',
  now() - interval '1 hour',
  'manual_admin',
  'operational',
  'qa-pgtap'
);

insert into public.cost_entries (
  id,
  project_id,
  company_id,
  cost_type,
  description,
  amount,
  quantity,
  unit_cost,
  entry_date,
  source_type,
  source_id,
  status,
  created_by
) values (
  'qa-work-cost-entry-base',
  'qa-work-project',
  'qa-work-company',
  'labor',
  'Initial work session sync cost',
  120,
  2,
  60,
  current_date,
  'work_session',
  'qa-work-session-base',
  'recorded',
  'qa-pgtap'
);

insert into public.work_sessions (
  id,
  company_id,
  user_email,
  project_id,
  started_at,
  entry_type,
  source_mode,
  created_by
) values (
  'qa-work-session-open-seed',
  'qa-work-company',
  'qa-work-member@example.com',
  'qa-work-project',
  now() - interval '20 minutes',
  'manual_admin',
  'operational',
  'qa-pgtap'
);

select ok(
  pg_temp.matches_sqlstate(
    $sql$
      insert into public.work_sessions (
        id, company_id, user_email, project_id, started_at, entry_type, source_mode, created_by
      ) values (
        'qa-work-session-open-a',
        'qa-work-company',
        'qa-work-member@example.com',
        'qa-work-project',
        now(),
        'manual_admin',
        'operational',
        'qa-pgtap'
      )
    $sql$,
    '23505'
  ),
  'only one open work session is allowed per company and user'
);

update public.work_sessions
set ended_at = now() - interval '5 minutes'
where id = 'qa-work-session-open-seed';

select ok(
  pg_temp.matches_sqlstate(
    $sql$
      insert into public.cost_entries (
        id, project_id, company_id, cost_type, description, amount, quantity, unit_cost, entry_date, source_type, source_id, status, created_by
      ) values (
        'qa-work-cost-entry-duplicate',
        'qa-work-project',
        'qa-work-company',
        'labor',
        'Duplicate synced work session cost',
        120,
        2,
        60,
        current_date,
        'work_session',
        'qa-work-session-base',
        'recorded',
        'qa-pgtap'
      )
    $sql$,
    '23505'
  ),
  'only one cost entry is allowed per work_session source'
);

select ok(
  pg_temp.matches_sqlstate(
    $sql$
      insert into public.work_sessions (
        id, company_id, user_email, project_id, started_at, ended_at, entry_type, source_mode, created_by
      ) values (
        'qa-work-session-invalid-range',
        'qa-work-company',
        'qa-work-member@example.com',
        'qa-work-project',
        now(),
        now() - interval '1 hour',
        'manual_admin',
        'operational',
        'qa-pgtap'
      )
    $sql$,
    '23514'
  ),
  'work session cannot end before it starts'
);

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config(
  'request.jwt.claims',
  '{"role":"authenticated","sub":"94222222-2222-4222-8222-222222222222","email":"qa-work-member@example.com"}',
  true
);

insert into public.work_sessions (
  id,
  company_id,
  user_email,
  project_id,
  started_at,
  entry_type,
  source_mode
) values (
  'qa-work-session-live-self',
  'qa-work-company',
  'qa-work-member@example.com',
  'qa-work-project',
  now() - interval '10 minutes',
  'live',
  'normal'
);

select ok(
  exists(
    select 1
    from public.work_sessions
    where id = 'qa-work-session-live-self'
      and user_email = 'qa-work-member@example.com'
      and ended_at is null
  ),
  'member can create a live work session only for themselves'
);

select ok(
  pg_temp.matches_sqlstate(
    $sql$
      insert into public.work_sessions (
        id, company_id, user_email, project_id, started_at, entry_type, source_mode
      ) values (
        'qa-work-session-live-foreign',
        'qa-work-company',
        'qa-work-admin@example.com',
        'qa-work-project',
        now(),
        'live',
        'normal'
      )
    $sql$,
    '42501'
  ),
  'member cannot create a live work session for another user'
);

reset role;
select set_config('request.jwt.claim.role', 'service_role', true);
select set_config('request.jwt.claims', '{"role":"service_role"}', true);

select is(
  (select count(*)::integer from public.work_sessions where id in ('qa-work-session-base', 'qa-work-session-live-self')),
  2,
  'valid work session fixtures remain persisted during the test'
);

select is(
  (select count(*)::integer from public.cost_entries where source_type = 'work_session' and source_id = 'qa-work-session-base'),
  1,
  'work-session cost entry uniqueness keeps only the original synced row'
);

select * from finish();
rollback;