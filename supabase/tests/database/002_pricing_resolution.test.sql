begin;

-- Scenario IDs: pricing.company-plan.active-is-entitled, pricing.company-plan.past-due-is-not-entitled, pricing.project.resolve-effective-plan-from-sponsor, pricing.project.resolve-sponsor-invalid-when-unpaid, pricing.sponsor-loss.transitions-to-blocked-state, pricing.feature-access.enabled-limited-disabled

create extension if not exists pgtap with schema extensions;

select set_config('request.jwt.claim.role', 'service_role', true);
select set_config('request.jwt.claims', '{"role":"service_role"}', true);

select plan(19);

select is(public.resolve_company_plan_code('qa-company-alpha'), 'free', 'free company resolves to free plan');
select is(public.resolve_company_plan_code('qa-company-beta'), 'paid', 'paid company resolves to paid plan');
select ok(not public.is_company_paid('qa-company-alpha'), 'free company is not paid');
select ok(public.is_company_paid('qa-company-beta'), 'paid active company is paid');

select is(public.resolve_active_project_sponsor_company_id('qa-project-renovation'), 'qa-company-beta', 'active sponsor is resolved for sponsored project');
select ok(public.is_project_sponsored('qa-project-renovation'), 'seeded renovation project is sponsored');
select is(public.resolve_project_effective_plan_code('qa-project-renovation'), 'paid', 'sponsored project inherits paid plan');

select is(public.resolve_company_feature_access('qa-company-alpha', 'company_chat') ->> 'access_level', 'limited', 'free company chat is limited');
select is(public.resolve_company_feature_access('qa-company-alpha', 'company_time_tracking') ->> 'access_level', 'disabled', 'free company time tracking is disabled');
select is(public.resolve_company_feature_access('qa-company-beta', 'company_time_tracking') ->> 'access_level', 'enabled', 'paid company time tracking is enabled');
select is(public.resolve_project_feature_access('qa-project-renovation', 'project_finance') ->> 'access_level', 'enabled', 'sponsored project finance is enabled');

select is(public.resolve_project_pricing_status('qa-project-renovation') ->> 'status', 'sponsored', 'seeded renovation project pricing status is sponsored');
select is(public.resolve_project_pricing_status('qa-project-renovation') ->> 'is_sponsored', 'true', 'seeded renovation project exposes sponsored flag');

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
  'qa-project-unsponsored-sibling',
  'QA Unsponsored Sibling',
  'Via QA Secondaria 22, Milano',
  'Temporary pgtap fixture for sponsor-loss resolution.',
  'planning',
  'company',
  'qa-company-alpha',
  'qa-pgtap'
);

update public.company_subscriptions
set billing_status = 'past_due'
where id = 'qa-company-subscription-beta';

select is(public.resolve_company_plan_code('qa-company-beta'), 'free', 'past_due company loses paid entitlement');
select ok(not public.is_company_paid('qa-company-beta'), 'past_due company is not considered paid');
select ok(public.resolve_active_project_sponsor_company_id('qa-project-renovation') is null, 'inactive sponsor is no longer resolved after downgrade');
select is(public.resolve_project_pricing_status('qa-project-renovation') ->> 'status', 'blocked_for_sponsor_loss', 'project becomes blocked after sponsor loss plus sibling unsponsored project');
select is(public.resolve_project_pricing_status('qa-project-renovation') ->> 'can_only_invite_companies', 'true', 'blocked project allows only company invitations');
select is(public.resolve_project_feature_access('qa-project-renovation', 'project_finance') ->> 'access_level', 'disabled', 'project finance falls back to disabled after sponsor loss');

select * from finish();
rollback;