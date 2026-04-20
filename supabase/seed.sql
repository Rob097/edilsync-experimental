begin;

select set_config('request.jwt.claim.role', 'service_role', true);
select set_config('request.jwt.claims', '{"role":"service_role"}', true);

delete from public.channel_members where id in ('qa-channel-member-contractor-admin');
delete from public.channels where id in ('qa-channel-general');
delete from public.cost_entries where id in ('qa-cost-entry-labor');
delete from public.work_sessions where id in ('qa-work-session-1');
delete from public.labor_rates where id in ('qa-labor-rate-worker');
delete from public.budget_lines where id in ('qa-budget-line-labor');
delete from public.project_financial_settings where id in ('qa-financial-settings');
delete from public.progress_statements where id in ('qa-progress-statement-1');
delete from public.project_company_commercials where id in ('qa-commercial-alpha');
delete from public.tasks where id in ('qa-task-rough-in');
delete from public.project_sponsorships where id in ('qa-project-sponsorship');
delete from public.company_subscriptions where id in ('qa-company-subscription-alpha', 'qa-company-subscription-beta');
delete from public.project_participants where id in ('qa-project-participant-contractor', 'qa-project-participant-homeowner', 'qa-project-participant-sponsor');
delete from public.company_members where id in ('qa-company-member-contractor-admin', 'qa-company-member-worker', 'qa-company-member-sponsor-admin');
delete from public.projects where id in ('qa-project-renovation');
delete from public.companies where id in ('qa-company-alpha', 'qa-company-beta');
delete from public.users where id in (
  'qa-user-platform-admin',
  'qa-user-contractor-admin',
  'qa-user-worker',
  'qa-user-homeowner',
  'qa-user-sponsor-admin'
);

insert into public.users (
  id,
  email,
  full_name,
  role,
  active_context,
  active_company_id,
  created_by
) values
  ('qa-user-platform-admin', 'qa-platform-admin@edilsync.test', 'QA Platform Admin', 'normal', 'personal', null, 'qa-seed'),
  ('qa-user-contractor-admin', 'qa-contractor-admin@edilsync.test', 'QA Contractor Admin', 'normal', 'company', 'qa-company-alpha', 'qa-seed'),
  ('qa-user-worker', 'qa-worker@edilsync.test', 'QA Site Worker', 'normal', 'company', 'qa-company-alpha', 'qa-seed'),
  ('qa-user-homeowner', 'qa-homeowner@edilsync.test', 'QA Homeowner', 'normal', 'personal', null, 'qa-seed'),
  ('qa-user-sponsor-admin', 'qa-sponsor-admin@edilsync.test', 'QA Sponsor Admin', 'normal', 'company', 'qa-company-beta', 'qa-seed');

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
  ('qa-company-alpha', 'Alpha Costruzioni QA', 'general_contractor', 'ITQAALPHA001', 'Via Cantiere 1, Milano', 'qa-contractor-admin@edilsync.test', 'General contractor fixture for branch QA.', 'qa-seed'),
  ('qa-company-beta', 'Beta Impianti QA', 'plumbing_hvac', 'ITQABETA001', 'Via Sponsor 20, Bergamo', 'qa-sponsor-admin@edilsync.test', 'Paid sponsor fixture for branch QA.', 'qa-seed');

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
  ('qa-company-member-contractor-admin', 'qa-company-alpha', 'qa-user-contractor-admin', 'qa-contractor-admin@edilsync.test', 'admin', 'owner_admin', 'owner_admin', 'active', 'qa-seed'),
  ('qa-company-member-worker', 'qa-company-alpha', 'qa-user-worker', 'qa-worker@edilsync.test', 'member', 'worker', 'worker', 'active', 'qa-seed'),
  ('qa-company-member-sponsor-admin', 'qa-company-beta', 'qa-user-sponsor-admin', 'qa-sponsor-admin@edilsync.test', 'admin', 'project_manager', 'project_manager', 'active', 'qa-seed');

insert into public.projects (
  id,
  name,
  address,
  description,
  status,
  start_date,
  end_date,
  owner_type,
  owner_company_id,
  owner_user_id,
  created_by
) values
  ('qa-project-renovation', 'QA Renovation Project', 'Via Test 99, Milano', 'Branch-safe renovation fixture used by automated QA.', 'in_progress', current_date - interval '14 days', current_date + interval '90 days', 'company', 'qa-company-alpha', 'qa-user-contractor-admin', 'qa-seed');

insert into public.project_participants (
  id,
  project_id,
  participant_type,
  user_id,
  user_email,
  company_id,
  project_role,
  invited_by_company_id,
  status,
  can_invite,
  created_by
) values
  ('qa-project-participant-contractor', 'qa-project-renovation', 'company', null, 'qa-contractor-admin@edilsync.test', 'qa-company-alpha', 'contractor', null, 'active', true, 'qa-seed'),
  ('qa-project-participant-homeowner', 'qa-project-renovation', 'personal', 'qa-user-homeowner', 'qa-homeowner@edilsync.test', null, 'homeowner', 'qa-company-alpha', 'active', true, 'qa-seed'),
  ('qa-project-participant-sponsor', 'qa-project-renovation', 'company', null, 'qa-sponsor-admin@edilsync.test', 'qa-company-beta', 'subcontractor', 'qa-company-alpha', 'active', false, 'qa-seed');

insert into public.company_subscriptions (
  id,
  company_id,
  plan_code,
  billing_status,
  billing_cycle,
  currency,
  created_by
) values
  ('qa-company-subscription-alpha', 'qa-company-alpha', 'free', 'free', null, 'EUR', 'qa-seed'),
  ('qa-company-subscription-beta', 'qa-company-beta', 'paid', 'active', 'monthly', 'EUR', 'qa-seed');

insert into public.project_sponsorships (
  id,
  project_id,
  sponsor_company_id,
  status,
  started_at,
  activation_source,
  created_by
) values
  ('qa-project-sponsorship', 'qa-project-renovation', 'qa-company-beta', 'active', now() - interval '7 days', 'manual', 'qa-seed');

insert into public.channels (
  id,
  project_id,
  name,
  type,
  description,
  created_by_email,
  created_by
) values
  ('qa-channel-general', 'qa-project-renovation', 'General', 'general', 'General project channel fixture for QA branches.', 'qa-contractor-admin@edilsync.test', 'qa-seed');

insert into public.channel_members (
  id,
  channel_id,
  project_id,
  participant_id,
  user_email,
  company_id,
  last_read_at,
  created_by
) values
  ('qa-channel-member-contractor-admin', 'qa-channel-general', 'qa-project-renovation', 'qa-project-participant-contractor', 'qa-contractor-admin@edilsync.test', 'qa-company-alpha', now(), 'qa-seed');

insert into public.project_financial_settings (
  id,
  project_id,
  currency,
  budget_tracking_mode,
  labor_cost_method,
  financial_visibility,
  enable_progress_statements,
  created_by
) values
  ('qa-financial-settings', 'qa-project-renovation', 'EUR', 'simple', 'from_work_sessions', 'project_full', true, 'qa-seed');

insert into public.budget_lines (
  id,
  project_id,
  code,
  title,
  category,
  unit,
  quantity_planned,
  unit_cost_planned,
  amount_planned,
  company_id,
  status,
  notes,
  created_by
) values
  ('qa-budget-line-labor', 'qa-project-renovation', 'LAB-001', 'Labor - demolition and prep', 'labor', 'hours', 80, 32, 2560, 'qa-company-alpha', 'active', 'Seeded budget line for finance and labor tests.', 'qa-seed');

insert into public.labor_rates (
  id,
  company_id,
  project_id,
  user_email,
  company_member_role,
  hourly_cost,
  valid_from,
  notes,
  created_by
) values
  ('qa-labor-rate-worker', 'qa-company-alpha', 'qa-project-renovation', 'qa-worker@edilsync.test', 'worker', 32, current_date - interval '30 days', 'Seeded labor rate for work-session sync tests.', 'qa-seed');

insert into public.work_sessions (
  id,
  company_id,
  user_email,
  project_id,
  started_at,
  ended_at,
  note,
  entry_type,
  source_mode,
  created_by
) values
  ('qa-work-session-1', 'qa-company-alpha', 'qa-worker@edilsync.test', 'qa-project-renovation', now() - interval '2 days 4 hours', now() - interval '2 days 1 hour', 'Seeded completed work session.', 'manual_admin', 'operational', 'qa-seed');

insert into public.cost_entries (
  id,
  project_id,
  budget_line_id,
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
  notes,
  created_by
) values
  ('qa-cost-entry-labor', 'qa-project-renovation', 'qa-budget-line-labor', 'qa-company-alpha', 'labor', 'Seeded labor sync result', 96, 3, 32, current_date - 2, 'work_session', 'qa-work-session-1', 'recorded', 'Represents a synced labor cost entry for QA.', 'qa-seed');

insert into public.project_company_commercials (
  id,
  project_id,
  company_id,
  contract_type,
  contract_amount,
  approved_variations_amount,
  notes,
  created_by
) values
  ('qa-commercial-alpha', 'qa-project-renovation', 'qa-company-alpha', 'lump_sum', 125000, 5000, 'Seeded commercials for branch QA reporting.', 'qa-seed');

insert into public.progress_statements (
  id,
  project_id,
  sequence_number,
  statement_date,
  amount_matured,
  advances_paid,
  amount_to_pay,
  status,
  notes,
  created_by
) values
  ('qa-progress-statement-1', 'qa-project-renovation', 1, current_date - 1, 15000, 3000, 12000, 'draft', 'Seeded SAL fixture for QA.', 'qa-seed');

insert into public.tasks (
  id,
  project_id,
  title,
  description,
  status,
  assigned_participant_id,
  assigned_participant_type,
  assigned_user_email,
  assigned_user_name,
  assigned_company_id,
  assigned_company_name,
  due_date,
  created_by
) values
  ('qa-task-rough-in', 'qa-project-renovation', 'Complete rough-in works', 'Seeded task used by smoke and role-visibility tests.', 'in_progress', 'qa-project-participant-contractor', 'company', 'qa-contractor-admin@edilsync.test', 'QA Contractor Admin', 'qa-company-alpha', 'Alpha Costruzioni QA', current_date + 5, 'qa-seed');

select public.sync_user_access_for_email('qa-platform-admin@edilsync.test');
select public.sync_user_access_for_email('qa-contractor-admin@edilsync.test');
select public.sync_user_access_for_email('qa-worker@edilsync.test');
select public.sync_user_access_for_email('qa-homeowner@edilsync.test');
select public.sync_user_access_for_email('qa-sponsor-admin@edilsync.test');

commit;