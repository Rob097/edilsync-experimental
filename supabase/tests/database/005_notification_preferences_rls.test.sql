begin;

-- Scenario IDs: notifications.prefs.owner-create, notifications.prefs.owner-read, notifications.prefs.owner-update, notifications.prefs.owner-delete, notifications.prefs.other-user-read-denied, notifications.prefs.other-user-update-denied, notifications.prefs.platform-admin-read, notifications.prefs.platform-admin-create-foreign

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

select plan(9);

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
    'qa-notif-user-owner',
    '91111111-1111-4111-8111-111111111111',
    'qa-notif-owner@example.com',
    'QA Notification Owner',
    'normal',
    'qa-pgtap'
  ),
  (
    'qa-notif-user-other',
    '92222222-2222-4222-8222-222222222222',
    'qa-notif-other@example.com',
    'QA Notification Other',
    'normal',
    'qa-pgtap'
  ),
  (
    'qa-notif-user-admin',
    '93333333-3333-4333-8333-333333333333',
    'qa-notif-admin@example.com',
    'QA Notification Admin',
    'admin',
    'qa-pgtap'
  );

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config(
  'request.jwt.claims',
  '{"role":"authenticated","sub":"91111111-1111-4111-8111-111111111111","email":"qa-notif-owner@example.com"}',
  true
);

insert into public.notification_preferences (
  id,
  user_email,
  preferences
) values (
  'qa-notif-pref-owner',
  'qa-notif-owner@example.com',
  '{"email":true,"push":false}'::jsonb
);

select ok(
  exists(
    select 1
    from public.notification_preferences
    where id = 'qa-notif-pref-owner'
      and user_email = 'qa-notif-owner@example.com'
  ),
  'owner can create their own notification preferences'
);

select is(
  (select count(*)::integer from public.notification_preferences where id = 'qa-notif-pref-owner'),
  1,
  'owner can read their own notification preferences'
);

select is(
  pg_temp.exec_row_count(
    $sql$
      update public.notification_preferences
      set preferences = '{"email":false,"push":true}'::jsonb
      where id = 'qa-notif-pref-owner'
    $sql$
  ),
  1,
  'owner can update their own notification preferences'
);

select is(
  (select preferences ->> 'push' from public.notification_preferences where id = 'qa-notif-pref-owner'),
  'true',
  'owner update persists on notification preferences'
);

select set_config(
  'request.jwt.claims',
  '{"role":"authenticated","sub":"92222222-2222-4222-8222-222222222222","email":"qa-notif-other@example.com"}',
  true
);

select is(
  (select count(*)::integer from public.notification_preferences where id = 'qa-notif-pref-owner'),
  0,
  'other authenticated user cannot read someone else preferences'
);

select is(
  pg_temp.exec_row_count(
    $sql$
      update public.notification_preferences
      set preferences = '{"email":true}'::jsonb
      where id = 'qa-notif-pref-owner'
    $sql$
  ),
  0,
  'other authenticated user cannot update someone else preferences'
);

select set_config(
  'request.jwt.claims',
  '{"role":"authenticated","sub":"93333333-3333-4333-8333-333333333333","email":"qa-notif-admin@example.com"}',
  true
);

select is(
  (select count(*)::integer from public.notification_preferences where id = 'qa-notif-pref-owner'),
  1,
  'platform admin can read user notification preferences'
);

insert into public.notification_preferences (
  id,
  user_email,
  preferences
) values (
  'qa-notif-pref-admin-created',
  'qa-notif-other@example.com',
  '{"email":true,"sms":true}'::jsonb
);

select ok(
  exists(
    select 1
    from public.notification_preferences
    where id = 'qa-notif-pref-admin-created'
      and user_email = 'qa-notif-other@example.com'
  ),
  'platform admin can create preferences for another user'
);

select is(
  pg_temp.exec_row_count(
    $sql$
      delete from public.notification_preferences
      where id = 'qa-notif-pref-owner'
    $sql$
  ),
  0,
  'platform admin cannot delete someone else preferences because delete is owner-only'
);

select * from finish();
rollback;