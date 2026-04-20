begin;

-- Scenario IDs: pricing.company-plan.active-is-entitled, pricing.project.resolve-effective-plan-from-sponsor

create extension if not exists pgtap with schema extensions;

select plan(10);

select has_table('public', 'company_subscriptions', 'company_subscriptions table exists');
select has_column('public', 'company_subscriptions', 'billing_status', 'company_subscriptions exposes billing_status');
select has_column('public', 'company_subscriptions', 'stripe_subscription_id', 'company_subscriptions stores stripe subscription ids');
select has_table('public', 'project_sponsorships', 'project_sponsorships table exists');
select has_column('public', 'project_sponsorships', 'sponsor_company_id', 'project_sponsorships links sponsor company');
select has_table('public', 'app_features', 'app_features table exists');
select has_table('public', 'plan_feature_rules', 'plan_feature_rules table exists');
select has_table('public', 'stripe_events', 'stripe_events table exists');
select has_table('public', 'work_sessions', 'work_sessions table exists');
select has_table('public', 'edge_rate_limits', 'edge_rate_limits table exists');

select * from finish();
rollback;