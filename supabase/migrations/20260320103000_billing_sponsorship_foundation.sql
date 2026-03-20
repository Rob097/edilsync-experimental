begin;

create table if not exists public.company_subscriptions (
  id text primary key default gen_random_uuid()::text,
  company_id text not null,
  plan_code text not null,
  billing_status text not null default 'free' check (billing_status in ('free', 'active', 'incomplete', 'past_due', 'canceled', 'unpaid')),
  billing_cycle text check (billing_cycle in ('monthly', 'yearly')),
  currency text not null default 'EUR',
  stripe_customer_id text,
  stripe_subscription_id text,
  stripe_product_id text,
  stripe_price_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  canceled_at timestamptz,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by text,
  unique(company_id),
  unique(stripe_customer_id),
  unique(stripe_subscription_id)
);

create table if not exists public.project_sponsorships (
  id text primary key default gen_random_uuid()::text,
  project_id text not null,
  sponsor_company_id text not null,
  status text not null default 'active' check (status in ('active', 'ended')),
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  activation_source text not null default 'manual' check (activation_source in ('manual', 'project_creation', 'system')),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by text
);

create table if not exists public.app_features (
  id text primary key default gen_random_uuid()::text,
  feature_key text not null unique,
  scope_type text not null check (scope_type in ('company', 'project')),
  name text not null,
  description text,
  sort_order integer not null default 0,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by text
);

create table if not exists public.plan_feature_rules (
  id text primary key default gen_random_uuid()::text,
  plan_code text not null,
  feature_key text not null,
  access_level text not null check (access_level in ('enabled', 'disabled', 'limited')),
  config_json jsonb not null default '{}'::jsonb,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by text,
  unique(plan_code, feature_key)
);

create table if not exists public.stripe_events (
  id text primary key default gen_random_uuid()::text,
  event_id text not null unique,
  event_type text not null,
  livemode boolean not null default false,
  payload jsonb not null,
  processed boolean not null default false,
  processed_at timestamptz,
  error_message text,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by text
);

create index if not exists idx_company_subscriptions_plan_code on public.company_subscriptions(plan_code);
create index if not exists idx_company_subscriptions_billing_status on public.company_subscriptions(billing_status);
create index if not exists idx_project_sponsorships_project on public.project_sponsorships(project_id);
create index if not exists idx_project_sponsorships_sponsor_company on public.project_sponsorships(sponsor_company_id);
create unique index if not exists idx_project_sponsorships_one_active_per_project
on public.project_sponsorships(project_id)
where status = 'active' and ended_at is null;
create index if not exists idx_app_features_scope_sort on public.app_features(scope_type, sort_order, feature_key);
create index if not exists idx_plan_feature_rules_plan on public.plan_feature_rules(plan_code);
create index if not exists idx_stripe_events_processed on public.stripe_events(processed, created_date desc);

alter table public.company_subscriptions enable row level security;
alter table public.project_sponsorships enable row level security;
alter table public.app_features enable row level security;
alter table public.plan_feature_rules enable row level security;
alter table public.stripe_events enable row level security;

drop trigger if exists trg_company_subscriptions_audit on public.company_subscriptions;
create trigger trg_company_subscriptions_audit
before insert or update on public.company_subscriptions
for each row execute function public.set_audit_fields();

drop trigger if exists trg_project_sponsorships_audit on public.project_sponsorships;
create trigger trg_project_sponsorships_audit
before insert or update on public.project_sponsorships
for each row execute function public.set_audit_fields();

drop trigger if exists trg_app_features_audit on public.app_features;
create trigger trg_app_features_audit
before insert or update on public.app_features
for each row execute function public.set_audit_fields();

drop trigger if exists trg_plan_feature_rules_audit on public.plan_feature_rules;
create trigger trg_plan_feature_rules_audit
before insert or update on public.plan_feature_rules
for each row execute function public.set_audit_fields();

drop trigger if exists trg_stripe_events_audit on public.stripe_events;
create trigger trg_stripe_events_audit
before insert or update on public.stripe_events
for each row execute function public.set_audit_fields();

drop policy if exists company_subscriptions_create on public.company_subscriptions;
drop policy if exists company_subscriptions_read on public.company_subscriptions;
drop policy if exists company_subscriptions_update on public.company_subscriptions;
drop policy if exists company_subscriptions_delete on public.company_subscriptions;

create policy company_subscriptions_create on public.company_subscriptions
for insert to authenticated
with check (
  company_id = any(public.current_admin_company_ids())
  or public.is_admin()
);

create policy company_subscriptions_read on public.company_subscriptions
for select to authenticated
using (
  company_id = any(public.current_admin_company_ids())
  or public.is_admin()
);

create policy company_subscriptions_update on public.company_subscriptions
for update to authenticated
using (
  company_id = any(public.current_admin_company_ids())
  or public.is_admin()
)
with check (
  company_id = any(public.current_admin_company_ids())
  or public.is_admin()
);

create policy company_subscriptions_delete on public.company_subscriptions
for delete to authenticated
using (
  company_id = any(public.current_admin_company_ids())
  or public.is_admin()
);

drop policy if exists project_sponsorships_create on public.project_sponsorships;
drop policy if exists project_sponsorships_read on public.project_sponsorships;
drop policy if exists project_sponsorships_update on public.project_sponsorships;
drop policy if exists project_sponsorships_delete on public.project_sponsorships;

create policy project_sponsorships_create on public.project_sponsorships
for insert to authenticated
with check (
  sponsor_company_id = any(public.current_admin_company_ids())
  or public.is_admin()
);

create policy project_sponsorships_read on public.project_sponsorships
for select to authenticated
using (
  project_id = any(public.current_project_ids())
  or sponsor_company_id = any(public.current_admin_company_ids())
  or public.is_admin()
);

create policy project_sponsorships_update on public.project_sponsorships
for update to authenticated
using (
  sponsor_company_id = any(public.current_admin_company_ids())
  or public.is_admin()
)
with check (
  sponsor_company_id = any(public.current_admin_company_ids())
  or public.is_admin()
);

create policy project_sponsorships_delete on public.project_sponsorships
for delete to authenticated
using (
  sponsor_company_id = any(public.current_admin_company_ids())
  or public.is_admin()
);

drop policy if exists app_features_create on public.app_features;
drop policy if exists app_features_read on public.app_features;
drop policy if exists app_features_update on public.app_features;
drop policy if exists app_features_delete on public.app_features;

create policy app_features_create on public.app_features
for insert to authenticated
with check (public.is_admin());

create policy app_features_read on public.app_features
for select to authenticated
using (true);

create policy app_features_update on public.app_features
for update to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy app_features_delete on public.app_features
for delete to authenticated
using (public.is_admin());

drop policy if exists plan_feature_rules_create on public.plan_feature_rules;
drop policy if exists plan_feature_rules_read on public.plan_feature_rules;
drop policy if exists plan_feature_rules_update on public.plan_feature_rules;
drop policy if exists plan_feature_rules_delete on public.plan_feature_rules;

create policy plan_feature_rules_create on public.plan_feature_rules
for insert to authenticated
with check (public.is_admin());

create policy plan_feature_rules_read on public.plan_feature_rules
for select to authenticated
using (true);

create policy plan_feature_rules_update on public.plan_feature_rules
for update to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy plan_feature_rules_delete on public.plan_feature_rules
for delete to authenticated
using (public.is_admin());

drop policy if exists stripe_events_create on public.stripe_events;
drop policy if exists stripe_events_read on public.stripe_events;
drop policy if exists stripe_events_update on public.stripe_events;
drop policy if exists stripe_events_delete on public.stripe_events;

create policy stripe_events_create on public.stripe_events
for insert to authenticated
with check (public.is_admin());

create policy stripe_events_read on public.stripe_events
for select to authenticated
using (public.is_admin());

create policy stripe_events_update on public.stripe_events
for update to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy stripe_events_delete on public.stripe_events
for delete to authenticated
using (public.is_admin());

insert into public.company_subscriptions (company_id, plan_code, billing_status, currency)
select c.id, 'free', 'free', 'EUR'
from public.companies c
where not exists (
  select 1
  from public.company_subscriptions cs
  where cs.company_id = c.id
);

insert into public.app_features (feature_key, scope_type, name, description, sort_order)
values
  ('company_management', 'company', 'Gestione societa', 'Dati generali e anagrafica della societa.', 10),
  ('company_members', 'company', 'Membri societa', 'Gestione membri e ruoli della societa.', 20),
  ('company_chat', 'company', 'Chat interna societa', 'Messaggistica interna della societa.', 30),
  ('company_documents', 'company', 'Documenti societa', 'Repository documentale della societa.', 40),
  ('company_time_tracking', 'company', 'Timbrature', 'Timbrature e presenze della societa.', 50),
  ('company_operational_workspace', 'company', 'Workspace operativo societa', 'Vista operativa della societa.', 60),
  ('company_billing', 'company', 'Fatturazione e abbonamento', 'Gestione piano, checkout e billing.', 70),
  ('project_creation', 'project', 'Creazione progetto', 'Possibilita di creare progetti propri.', 110),
  ('project_sponsorship', 'project', 'Sponsorizzazione progetto', 'Possibilita di sponsorizzare un progetto.', 120),
  ('project_participants', 'project', 'Partecipanti progetto', 'Gestione partecipanti e inviti di progetto.', 130),
  ('project_overview', 'project', 'Panoramica e feed progetto', 'Panoramica e attivita del progetto.', 140),
  ('project_tasks', 'project', 'Attivita', 'Task e attivita di progetto.', 150),
  ('project_milestones', 'project', 'Milestone', 'Pianificazione milestone di progetto.', 160),
  ('project_change_requests', 'project', 'Varianti', 'Change requests senza economia premium.', 170),
  ('project_disputes', 'project', 'Contestazioni', 'Gestione dispute e contestazioni.', 180),
  ('project_calendar', 'project', 'Calendario ed eventi', 'Eventi e calendario di progetto.', 190),
  ('project_chat', 'project', 'Chat di progetto', 'Messaggistica di progetto.', 200),
  ('project_documents', 'project', 'Documenti di progetto', 'Repository documentale di progetto.', 210),
  ('project_finance', 'project', 'Economia di progetto', 'Budget, costi e finanza di progetto.', 220),
  ('project_operational_workspace', 'project', 'Workspace operativo progetto', 'Vista operativa del progetto.', 230)
on conflict (feature_key) do update
set scope_type = excluded.scope_type,
    name = excluded.name,
    description = excluded.description,
    sort_order = excluded.sort_order,
    updated_date = now();

insert into public.plan_feature_rules (plan_code, feature_key, access_level, config_json)
values
  ('free', 'company_management', 'enabled', '{}'::jsonb),
  ('free', 'company_members', 'enabled', '{}'::jsonb),
  ('free', 'company_chat', 'limited', '{"allowed_channels":["general"]}'::jsonb),
  ('free', 'company_documents', 'limited', '{"mode":"basic"}'::jsonb),
  ('free', 'company_time_tracking', 'disabled', '{}'::jsonb),
  ('free', 'company_operational_workspace', 'limited', '{"mode":"basic"}'::jsonb),
  ('free', 'company_billing', 'limited', '{"can_upgrade":true,"can_manage_subscription":false}'::jsonb),
  ('free', 'project_creation', 'limited', '{"max_owned_non_sponsored_projects":1}'::jsonb),
  ('free', 'project_sponsorship', 'disabled', '{}'::jsonb),
  ('free', 'project_participants', 'limited', '{"owned_non_sponsored_allowed_invites":["homeowner"]}'::jsonb),
  ('free', 'project_overview', 'enabled', '{}'::jsonb),
  ('free', 'project_tasks', 'enabled', '{}'::jsonb),
  ('free', 'project_milestones', 'disabled', '{}'::jsonb),
  ('free', 'project_change_requests', 'limited', '{"economy_linked":false}'::jsonb),
  ('free', 'project_disputes', 'enabled', '{}'::jsonb),
  ('free', 'project_calendar', 'enabled', '{}'::jsonb),
  ('free', 'project_chat', 'limited', '{"allowed_channels":["general"]}'::jsonb),
  ('free', 'project_documents', 'limited', '{"mode":"basic_chronological"}'::jsonb),
  ('free', 'project_finance', 'disabled', '{}'::jsonb),
  ('free', 'project_operational_workspace', 'limited', '{"mode":"basic"}'::jsonb),
  ('paid', 'company_management', 'enabled', '{}'::jsonb),
  ('paid', 'company_members', 'enabled', '{}'::jsonb),
  ('paid', 'company_chat', 'enabled', '{"allowed_channels":"all"}'::jsonb),
  ('paid', 'company_documents', 'enabled', '{"mode":"full"}'::jsonb),
  ('paid', 'company_time_tracking', 'enabled', '{}'::jsonb),
  ('paid', 'company_operational_workspace', 'enabled', '{"mode":"full"}'::jsonb),
  ('paid', 'company_billing', 'enabled', '{"can_upgrade":false,"can_manage_subscription":true}'::jsonb),
  ('paid', 'project_creation', 'enabled', '{"max_owned_non_sponsored_projects":1,"auto_sponsor_on_create":true}'::jsonb),
  ('paid', 'project_sponsorship', 'enabled', '{}'::jsonb),
  ('paid', 'project_participants', 'enabled', '{}'::jsonb),
  ('paid', 'project_overview', 'enabled', '{}'::jsonb),
  ('paid', 'project_tasks', 'enabled', '{}'::jsonb),
  ('paid', 'project_milestones', 'enabled', '{}'::jsonb),
  ('paid', 'project_change_requests', 'enabled', '{"economy_linked":true}'::jsonb),
  ('paid', 'project_disputes', 'enabled', '{}'::jsonb),
  ('paid', 'project_calendar', 'enabled', '{}'::jsonb),
  ('paid', 'project_chat', 'enabled', '{"allowed_channels":"all"}'::jsonb),
  ('paid', 'project_documents', 'enabled', '{"mode":"full"}'::jsonb),
  ('paid', 'project_finance', 'enabled', '{}'::jsonb),
  ('paid', 'project_operational_workspace', 'enabled', '{"mode":"full"}'::jsonb)
on conflict (plan_code, feature_key) do update
set access_level = excluded.access_level,
    config_json = excluded.config_json,
    updated_date = now();

commit;