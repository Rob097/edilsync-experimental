begin;

-- Scenario IDs: users.auth-guards.insert-own-profile-allowed, users.auth-guards.insert-foreign-auth-user-id-blocked, users.auth-guards.insert-membership-fields-blocked, users.auth-guards.insert-admin-role-blocked, users.auth-guards.update-safe-profile-fields-allowed, users.auth-guards.update-auth-user-id-blocked, users.auth-guards.update-role-blocked, users.auth-guards.update-company-ids-blocked, users.auth-guards.update-admin-company-ids-blocked, users.auth-guards.update-project-ids-blocked, users.auth-guards.admin-bypass-allowed, users.auth-guards.service-role-bypass-allowed

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

create or replace function pg_temp.matches_error(sql_to_run text, expected_sqlstate text, expected_message text)
returns boolean
language sql
as $$
  with attempt as (
    select pg_temp.capture_error(sql_to_run) as error
  )
  select (error ->> 'sqlstate') = expected_sqlstate
    and (error ->> 'message') = expected_message
  from attempt;
$$;

select plan(14);

select set_config('request.jwt.claim.role', 'service_role', true);
select set_config('request.jwt.claims', '{"role":"service_role"}', true);

insert into public.users (
  id,
  auth_user_id,
  email,
  full_name,
  role,
  created_by
) values
  (
    'qa-user-guard-target',
    '11111111-1111-4111-8111-111111111111',
    'qa-guard-target@example.com',
    'QA Guard Target',
    'normal',
    'qa-pgtap'
  ),
  (
    'qa-user-guard-admin',
    '22222222-2222-4222-8222-222222222222',
    'qa-guard-admin@example.com',
    'QA Guard Admin',
    'admin',
    'qa-pgtap'
  );

select ok(
  exists(
    select 1
    from public.users
    where id = 'qa-user-guard-admin'
      and role = 'admin'
  ),
  'service_role can insert server-managed user profiles'
);

select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config(
  'request.jwt.claims',
  '{"role":"authenticated","sub":"33333333-3333-4333-8333-333333333333","email":"qa-guard-self@example.com"}',
  true
);

insert into public.users (
  id,
  auth_user_id,
  email,
  full_name,
  role
) values (
  'qa-user-guard-self',
  '33333333-3333-4333-8333-333333333333',
  'qa-guard-self@example.com',
  'QA Guard Self',
  'normal'
);

select ok(
  exists(
    select 1
    from public.users
    where id = 'qa-user-guard-self'
      and auth_user_id = '33333333-3333-4333-8333-333333333333'::uuid
  ),
  'authenticated user can insert their own profile with matching auth_user_id'
);

select ok(
  exists(
    select 1
    from public.users
    where id = 'qa-user-guard-self'
      and company_ids = '{}'::text[]
      and admin_company_ids = '{}'::text[]
      and project_ids = '{}'::text[]
  ),
  'own-profile insert keeps membership fields empty by default'
);

select set_config(
  'request.jwt.claims',
  '{"role":"authenticated","sub":"11111111-1111-4111-8111-111111111111","email":"qa-guard-target@example.com"}',
  true
);

update public.users
set full_name = 'QA Guard Target Updated'
where id = 'qa-user-guard-target';

select is(
  (select full_name from public.users where id = 'qa-user-guard-target'),
  'QA Guard Target Updated',
  'authenticated user can update non-protected profile fields'
);

select ok(
  pg_temp.matches_error(
    $sql$
      insert into public.users (id, auth_user_id, email, full_name, role)
      values (
        'qa-user-guard-foreign-auth',
        '99999999-9999-4999-8999-999999999999',
        'qa-guard-target@example.com',
        'QA Guard Foreign Auth',
        'normal'
      )
    $sql$,
    '42501',
    'auth_user_id is server-managed'
  ),
  'authenticated user cannot insert a different auth_user_id'
);

select ok(
  pg_temp.matches_error(
    $sql$
      insert into public.users (id, auth_user_id, email, full_name, role, company_ids)
      values (
        'qa-user-guard-membership-insert',
        '11111111-1111-4111-8111-111111111111',
        'qa-guard-target@example.com',
        'QA Guard Membership Insert',
        'normal',
        array['qa-company-alpha']
      )
    $sql$,
    '42501',
    'Membership fields are managed server-side'
  ),
  'authenticated user cannot insert server-managed membership fields'
);

select ok(
  pg_temp.matches_error(
    $sql$
      insert into public.users (id, auth_user_id, email, full_name, role)
      values (
        'qa-user-guard-admin-insert',
        '11111111-1111-4111-8111-111111111111',
        'qa-guard-target@example.com',
        'QA Guard Admin Insert',
        'admin'
      )
    $sql$,
    '42501',
    'role is server-managed'
  ),
  'authenticated user cannot self-assign the admin role during insert'
);

select ok(
  pg_temp.matches_error(
    $sql$
      update public.users
      set auth_user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'::uuid
      where id = 'qa-user-guard-target'
    $sql$,
    '42501',
    'auth_user_id is server-managed'
  ),
  'authenticated user cannot change auth_user_id'
);

select ok(
  pg_temp.matches_error(
    $sql$
      update public.users
      set role = 'admin'
      where id = 'qa-user-guard-target'
    $sql$,
    '42501',
    'role is server-managed'
  ),
  'authenticated user cannot change role'
);

select ok(
  pg_temp.matches_error(
    $sql$
      update public.users
      set company_ids = array['qa-company-alpha']
      where id = 'qa-user-guard-target'
    $sql$,
    '42501',
    'Membership fields are managed server-side'
  ),
  'authenticated user cannot change company_ids'
);

select ok(
  pg_temp.matches_error(
    $sql$
      update public.users
      set admin_company_ids = array['qa-company-alpha']
      where id = 'qa-user-guard-target'
    $sql$,
    '42501',
    'Membership fields are managed server-side'
  ),
  'authenticated user cannot change admin_company_ids'
);

select ok(
  pg_temp.matches_error(
    $sql$
      update public.users
      set project_ids = array['qa-project-renovation']
      where id = 'qa-user-guard-target'
    $sql$,
    '42501',
    'Membership fields are managed server-side'
  ),
  'authenticated user cannot change project_ids'
);

select set_config(
  'request.jwt.claims',
  '{"role":"authenticated","sub":"22222222-2222-4222-8222-222222222222","email":"qa-guard-admin@example.com"}',
  true
);

update public.users
set role = 'admin',
    company_ids = array['qa-company-alpha'],
    admin_company_ids = array['qa-company-alpha'],
    project_ids = array['qa-project-renovation']
where id = 'qa-user-guard-target';

select ok(
  exists(
    select 1
    from public.users
    where id = 'qa-user-guard-target'
      and role = 'admin'
      and company_ids = array['qa-company-alpha']
      and admin_company_ids = array['qa-company-alpha']
      and project_ids = array['qa-project-renovation']
  ),
  'admin user can update protected role and membership fields'
);

select set_config('request.jwt.claim.role', 'service_role', true);
select set_config('request.jwt.claims', '{"role":"service_role"}', true);

update public.users
set auth_user_id = '44444444-4444-4444-8444-444444444444'::uuid
where id = 'qa-user-guard-target';

select ok(
  exists(
    select 1
    from public.users
    where id = 'qa-user-guard-target'
      and auth_user_id = '44444444-4444-4444-8444-444444444444'::uuid
  ),
  'service_role can update protected auth_user_id'
);

select * from finish();
rollback;