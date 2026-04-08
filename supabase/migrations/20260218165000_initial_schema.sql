begin;

create extension if not exists pgcrypto;

create table if not exists public.users (
  id text primary key default gen_random_uuid()::text,
  auth_user_id uuid unique,
  email text not null unique,
  full_name text,
  role text not null default 'user',
  company_ids text[] not null default '{}',
  admin_company_ids text[] not null default '{}',
  project_ids text[] not null default '{}',
  active_context text not null default 'personal',
  active_company_id text,
  tour_state jsonb,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by text
);

create or replace function public.current_user_email()
returns text
language sql
stable
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
stable
security definer
set search_path = public
as $$
  select coalesce((select u.company_ids from public.users u where u.email = public.current_user_email() limit 1), '{}');
$$;

create or replace function public.current_admin_company_ids()
returns text[]
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select u.admin_company_ids from public.users u where u.email = public.current_user_email() limit 1), '{}');
$$;

create or replace function public.current_project_ids()
returns text[]
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select u.project_ids from public.users u where u.email = public.current_user_email() limit 1), '{}');
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
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

create or replace function public.set_audit_fields()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    new.created_date = coalesce(new.created_date, now());
    new.updated_date = coalesce(new.updated_date, now());
    new.created_by = coalesce(new.created_by, public.current_user_email());
  else
    new.updated_date = now();
  end if;
  return new;
end;
$$;

create table if not exists public.change_requests (
  id text primary key default gen_random_uuid()::text,
  project_id text not null,
  title text not null,
  description text not null,
  status text not null,
  assigned_participant_id text,
  assigned_participant_type text,
  assigned_user_email text,
  assigned_user_name text,
  assigned_company_id text,
  assigned_company_name text,
  cost_impact numeric,
  time_impact_days numeric,
  photo_urls text[] not null default '{}',
  requested_by_email text,
  requested_by_name text,
  response_note text,
  responded_at timestamptz,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by text
);

create table if not exists public.channels (
  id text primary key default gen_random_uuid()::text,
  project_id text,
  name text not null,
  type text not null,
  description text,
  company_id text,
  is_direct boolean,
  participant_ids text[] not null default '{}',
  created_by_email text,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by text
);

create table if not exists public.channel_members (
  id text primary key default gen_random_uuid()::text,
  channel_id text not null,
  project_id text,
  participant_id text not null,
  user_email text,
  company_id text,
  last_read_at timestamptz,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by text
);

create table if not exists public.companies (
  id text primary key default gen_random_uuid()::text,
  name text not null,
  vat_number text,
  address text,
  phone text,
  email text,
  description text,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by text
);

create table if not exists public.company_members (
  id text primary key default gen_random_uuid()::text,
  company_id text not null,
  user_id text,
  user_email text not null,
  role text not null,
  profession text,
  status text not null default 'active',
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by text
);

create table if not exists public.document_comments (
  id text primary key default gen_random_uuid()::text,
  document_id text not null,
  project_id text not null,
  comment text not null,
  author_email text not null,
  author_name text,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by text
);

create table if not exists public.events (
  id text primary key default gen_random_uuid()::text,
  title text not null,
  description text,
  location text,
  start_datetime timestamptz not null,
  end_datetime timestamptz not null,
  owner_type text not null,
  owner_user_id text,
  owner_company_id text,
  owner_project_id text,
  status text not null,
  creator_email text,
  creator_name text,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by text
);

create table if not exists public.event_participants (
  id text primary key default gen_random_uuid()::text,
  event_id text not null,
  participant_type text not null,
  user_id text,
  user_email text,
  company_id text,
  status text not null,
  has_conflict boolean,
  conflict_event_id text,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by text
);

create table if not exists public.messages (
  id text primary key default gen_random_uuid()::text,
  channel_id text not null,
  project_id text,
  company_id text,
  content text not null,
  sender_email text not null,
  sender_name text not null,
  sender_context_type text not null,
  sender_company_id text,
  sender_company_name text,
  mentioned_user_emails text[] not null default '{}',
  mentioned_task_ids text[] not null default '{}',
  mentioned_milestone_ids text[] not null default '{}',
  mentioned_change_request_ids text[] not null default '{}',
  mentioned_document_ids text[] not null default '{}',
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by text
);

create table if not exists public.milestones (
  id text primary key default gen_random_uuid()::text,
  project_id text not null,
  title text not null,
  description text,
  start_date date,
  target_date date,
  status text not null,
  completion_date date,
  order_index numeric,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by text
);

create table if not exists public.notifications (
  id text primary key default gen_random_uuid()::text,
  user_email text not null,
  context_type text not null,
  context_company_id text,
  type text not null,
  title text not null,
  message text not null,
  related_event_id text,
  is_read boolean not null default false,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by text
);

create table if not exists public.notification_preferences (
  id text primary key default gen_random_uuid()::text,
  user_email text not null unique,
  preferences jsonb not null,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by text
);

create table if not exists public.projects (
  id text primary key default gen_random_uuid()::text,
  name text not null,
  address text not null,
  description text,
  status text,
  start_date date,
  end_date date,
  owner_type text not null,
  owner_company_id text,
  owner_user_id text,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by text
);

create table if not exists public.project_documents (
  id text primary key default gen_random_uuid()::text,
  project_id text not null,
  name text not null,
  description text,
  file_url text not null,
  file_type text,
  file_size numeric,
  uploaded_by_email text,
  uploaded_by_name text,
  category text,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by text
);

create table if not exists public.project_participants (
  id text primary key default gen_random_uuid()::text,
  project_id text not null,
  participant_type text not null,
  user_id text,
  user_email text,
  company_id text,
  project_role text not null,
  invited_by_company_id text,
  status text not null default 'invited',
  can_invite boolean,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by text
);

create table if not exists public.tasks (
  id text primary key default gen_random_uuid()::text,
  project_id text not null,
  milestone_id text,
  title text not null,
  description text,
  status text not null,
  assigned_participant_id text not null,
  assigned_participant_type text not null,
  assigned_user_email text,
  assigned_user_name text,
  assigned_company_id text,
  assigned_company_name text,
  blocked_by_email text,
  blocked_by_name text,
  blocked_reason text,
  blocked_date timestamptz,
  room_area text,
  due_date date,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by text
);

create table if not exists public.project_messages (
  id text primary key default gen_random_uuid()::text,
  project_id text not null,
  sender_email text,
  sender_name text,
  message text not null,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by text
);

create table if not exists public.app_logs (
  id text primary key default gen_random_uuid()::text,
  user_email text,
  page_name text,
  created_date timestamptz not null default now()
);

create index if not exists idx_company_members_user_email on public.company_members (user_email);
create index if not exists idx_company_members_company_id on public.company_members (company_id);
create index if not exists idx_project_participants_user_email on public.project_participants (user_email);
create index if not exists idx_project_participants_company_id on public.project_participants (company_id);
create index if not exists idx_project_participants_project_id on public.project_participants (project_id);

create trigger trg_users_audit before insert or update on public.users for each row execute function public.set_audit_fields();
create trigger trg_change_requests_audit before insert or update on public.change_requests for each row execute function public.set_audit_fields();
create trigger trg_channels_audit before insert or update on public.channels for each row execute function public.set_audit_fields();
create trigger trg_channel_members_audit before insert or update on public.channel_members for each row execute function public.set_audit_fields();
create trigger trg_companies_audit before insert or update on public.companies for each row execute function public.set_audit_fields();
create trigger trg_company_members_audit before insert or update on public.company_members for each row execute function public.set_audit_fields();
create trigger trg_document_comments_audit before insert or update on public.document_comments for each row execute function public.set_audit_fields();
create trigger trg_events_audit before insert or update on public.events for each row execute function public.set_audit_fields();
create trigger trg_event_participants_audit before insert or update on public.event_participants for each row execute function public.set_audit_fields();
create trigger trg_messages_audit before insert or update on public.messages for each row execute function public.set_audit_fields();
create trigger trg_milestones_audit before insert or update on public.milestones for each row execute function public.set_audit_fields();
create trigger trg_notifications_audit before insert or update on public.notifications for each row execute function public.set_audit_fields();
create trigger trg_notification_preferences_audit before insert or update on public.notification_preferences for each row execute function public.set_audit_fields();
create trigger trg_projects_audit before insert or update on public.projects for each row execute function public.set_audit_fields();
create trigger trg_project_documents_audit before insert or update on public.project_documents for each row execute function public.set_audit_fields();
create trigger trg_project_participants_audit before insert or update on public.project_participants for each row execute function public.set_audit_fields();
create trigger trg_tasks_audit before insert or update on public.tasks for each row execute function public.set_audit_fields();
create trigger trg_project_messages_audit before insert or update on public.project_messages for each row execute function public.set_audit_fields();

alter table public.users enable row level security;
alter table public.change_requests enable row level security;
alter table public.channels enable row level security;
alter table public.channel_members enable row level security;
alter table public.companies enable row level security;
alter table public.company_members enable row level security;
alter table public.document_comments enable row level security;
alter table public.events enable row level security;
alter table public.event_participants enable row level security;
alter table public.messages enable row level security;
alter table public.milestones enable row level security;
alter table public.notifications enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.projects enable row level security;
alter table public.project_documents enable row level security;
alter table public.project_participants enable row level security;
alter table public.tasks enable row level security;
alter table public.project_messages enable row level security;
alter table public.app_logs enable row level security;

create policy users_select on public.users for select to authenticated using (
  email = public.current_user_email() or public.is_admin()
);
create policy users_insert on public.users for insert to authenticated with check (
  email = public.current_user_email() or public.is_admin()
);
create policy users_update on public.users for update to authenticated using (
  email = public.current_user_email() or public.is_admin()
) with check (
  email = public.current_user_email() or public.is_admin()
);

create policy companies_create on public.companies for insert to authenticated with check (true);
create policy companies_read on public.companies for select to authenticated using (true);
create policy companies_update on public.companies for update to authenticated using (
  id = any(public.current_admin_company_ids()) or created_by = public.current_user_email()
) with check (
  id = any(public.current_admin_company_ids()) or created_by = public.current_user_email()
);
create policy companies_delete on public.companies for delete to authenticated using (
  id = any(public.current_admin_company_ids()) or created_by = public.current_user_email()
);

create policy projects_create on public.projects for insert to authenticated with check (true);
create policy projects_read on public.projects for select to authenticated using (
  id = any(public.current_project_ids()) or created_by = public.current_user_email() or public.is_admin()
);
create policy projects_update on public.projects for update to authenticated using (
  id = any(public.current_project_ids()) or created_by = public.current_user_email()
) with check (
  id = any(public.current_project_ids()) or created_by = public.current_user_email()
);
create policy projects_delete on public.projects for delete to authenticated using (
  created_by = public.current_user_email()
);

create policy company_members_create on public.company_members for insert to authenticated with check (
  company_id = any(public.current_admin_company_ids()) or created_by = public.current_user_email()
);
create policy company_members_read on public.company_members for select to authenticated using (
  company_id = any(public.current_company_ids()) or user_email = public.current_user_email() or created_by = public.current_user_email() or public.is_admin()
);
create policy company_members_update on public.company_members for update to authenticated using (
  company_id = any(public.current_admin_company_ids()) or created_by = public.current_user_email()
) with check (
  company_id = any(public.current_admin_company_ids()) or created_by = public.current_user_email()
);
create policy company_members_delete on public.company_members for delete to authenticated using (
  company_id = any(public.current_admin_company_ids()) or created_by = public.current_user_email()
);

create policy project_participants_create on public.project_participants for insert to authenticated with check (
  project_id = any(public.current_project_ids()) or created_by = public.current_user_email()
);
create policy project_participants_read on public.project_participants for select to authenticated using (
  project_id = any(public.current_project_ids()) or user_email = public.current_user_email() or created_by = public.current_user_email() or public.is_admin()
);
create policy project_participants_update on public.project_participants for update to authenticated using (
  created_by = public.current_user_email() or user_email = public.current_user_email()
) with check (
  created_by = public.current_user_email() or user_email = public.current_user_email()
);
create policy project_participants_delete on public.project_participants for delete to authenticated using (
  created_by = public.current_user_email()
);

create policy channels_create on public.channels for insert to authenticated with check (
  project_id = any(public.current_project_ids()) or company_id = any(public.current_company_ids()) or created_by = public.current_user_email()
);
create policy channels_read on public.channels for select to authenticated using (
  project_id = any(public.current_project_ids()) or company_id = any(public.current_company_ids()) or created_by = public.current_user_email() or public.is_admin()
);
create policy channels_update on public.channels for update to authenticated using (
  created_by = public.current_user_email() or company_id = any(public.current_company_ids())
) with check (
  created_by = public.current_user_email() or company_id = any(public.current_company_ids())
);
create policy channels_delete on public.channels for delete to authenticated using (
  created_by = public.current_user_email() or company_id = any(public.current_company_ids())
);

create policy channel_members_create on public.channel_members for insert to authenticated with check (true);
create policy channel_members_read on public.channel_members for select to authenticated using (
  user_email = public.current_user_email() or company_id = any(public.current_company_ids()) or project_id = any(public.current_project_ids()) or created_by = public.current_user_email() or public.is_admin()
);
create policy channel_members_update on public.channel_members for update to authenticated using (
  user_email = public.current_user_email() or created_by = public.current_user_email()
) with check (
  user_email = public.current_user_email() or created_by = public.current_user_email()
);
create policy channel_members_delete on public.channel_members for delete to authenticated using (
  user_email = public.current_user_email() or created_by = public.current_user_email()
);

create policy tasks_create on public.tasks for insert to authenticated with check (
  project_id = any(public.current_project_ids()) or created_by = public.current_user_email()
);
create policy tasks_read on public.tasks for select to authenticated using (
  project_id = any(public.current_project_ids()) or created_by = public.current_user_email() or public.is_admin()
);
create policy tasks_update on public.tasks for update to authenticated using (
  created_by = public.current_user_email() or assigned_user_email = public.current_user_email() or assigned_company_id = any(public.current_admin_company_ids())
) with check (
  created_by = public.current_user_email() or assigned_user_email = public.current_user_email() or assigned_company_id = any(public.current_admin_company_ids())
);
create policy tasks_delete on public.tasks for delete to authenticated using (created_by = public.current_user_email());

create policy milestones_create on public.milestones for insert to authenticated with check (
  project_id = any(public.current_project_ids()) or created_by = public.current_user_email()
);
create policy milestones_read on public.milestones for select to authenticated using (
  project_id = any(public.current_project_ids()) or created_by = public.current_user_email() or public.is_admin()
);
create policy milestones_update on public.milestones for update to authenticated using (
  project_id = any(public.current_project_ids()) or created_by = public.current_user_email()
) with check (
  project_id = any(public.current_project_ids()) or created_by = public.current_user_email()
);
create policy milestones_delete on public.milestones for delete to authenticated using (created_by = public.current_user_email());

create policy change_requests_create on public.change_requests for insert to authenticated with check (
  project_id = any(public.current_project_ids()) or created_by = public.current_user_email()
);
create policy change_requests_read on public.change_requests for select to authenticated using (
  project_id = any(public.current_project_ids()) or created_by = public.current_user_email() or assigned_user_email = public.current_user_email() or assigned_company_id = any(public.current_company_ids()) or public.is_admin()
);
create policy change_requests_update on public.change_requests for update to authenticated using (
  created_by = public.current_user_email() or assigned_user_email = public.current_user_email() or assigned_company_id = any(public.current_admin_company_ids())
) with check (
  created_by = public.current_user_email() or assigned_user_email = public.current_user_email() or assigned_company_id = any(public.current_admin_company_ids())
);
create policy change_requests_delete on public.change_requests for delete to authenticated using (created_by = public.current_user_email());

create policy docs_create on public.project_documents for insert to authenticated with check (
  project_id = any(public.current_project_ids()) or created_by = public.current_user_email()
);
create policy docs_read on public.project_documents for select to authenticated using (
  project_id = any(public.current_project_ids()) or created_by = public.current_user_email() or public.is_admin()
);
create policy docs_update on public.project_documents for update to authenticated using (created_by = public.current_user_email()) with check (created_by = public.current_user_email());
create policy docs_delete on public.project_documents for delete to authenticated using (created_by = public.current_user_email());

create policy comments_create on public.document_comments for insert to authenticated with check (
  project_id = any(public.current_project_ids()) or created_by = public.current_user_email()
);
create policy comments_read on public.document_comments for select to authenticated using (
  project_id = any(public.current_project_ids()) or created_by = public.current_user_email() or public.is_admin()
);
create policy comments_update on public.document_comments for update to authenticated using (created_by = public.current_user_email()) with check (created_by = public.current_user_email());
create policy comments_delete on public.document_comments for delete to authenticated using (created_by = public.current_user_email());

create policy messages_create on public.messages for insert to authenticated with check (true);
create policy messages_read on public.messages for select to authenticated using (
  project_id = any(public.current_project_ids()) or company_id = any(public.current_company_ids()) or created_by = public.current_user_email() or sender_email = public.current_user_email() or public.is_admin()
);
create policy messages_update on public.messages for update to authenticated using (created_by = public.current_user_email()) with check (created_by = public.current_user_email());
create policy messages_delete on public.messages for delete to authenticated using (created_by = public.current_user_email());

create policy events_create on public.events for insert to authenticated with check (true);
create policy events_read on public.events for select to authenticated using (
  created_by = public.current_user_email() or creator_email = public.current_user_email() or owner_company_id = any(public.current_company_ids()) or owner_project_id = any(public.current_project_ids()) or public.is_admin()
);
create policy events_update on public.events for update to authenticated using (
  created_by = public.current_user_email() or owner_company_id = any(public.current_company_ids()) or owner_project_id = any(public.current_project_ids())
) with check (
  created_by = public.current_user_email() or owner_company_id = any(public.current_company_ids()) or owner_project_id = any(public.current_project_ids())
);
create policy events_delete on public.events for delete to authenticated using (
  created_by = public.current_user_email() or owner_company_id = any(public.current_company_ids()) or owner_project_id = any(public.current_project_ids())
);

create policy event_participants_create on public.event_participants for insert to authenticated with check (true);
create policy event_participants_read on public.event_participants for select to authenticated using (
  user_email = public.current_user_email() or company_id = any(public.current_company_ids()) or created_by = public.current_user_email() or public.is_admin()
);
create policy event_participants_update on public.event_participants for update to authenticated using (
  user_email = public.current_user_email() or created_by = public.current_user_email()
) with check (
  user_email = public.current_user_email() or created_by = public.current_user_email()
);
create policy event_participants_delete on public.event_participants for delete to authenticated using (created_by = public.current_user_email());

create policy notifications_create on public.notifications for insert to authenticated with check (true);
create policy notifications_read on public.notifications for select to authenticated using (
  user_email = public.current_user_email() or public.is_admin()
);
create policy notifications_update on public.notifications for update to authenticated using (
  user_email = public.current_user_email()
) with check (
  user_email = public.current_user_email()
);
create policy notifications_delete on public.notifications for delete to authenticated using (
  user_email = public.current_user_email()
);

create policy notification_preferences_create on public.notification_preferences for insert to authenticated with check (true);
create policy notification_preferences_read on public.notification_preferences for select to authenticated using (
  user_email = public.current_user_email() or public.is_admin()
);
create policy notification_preferences_update on public.notification_preferences for update to authenticated using (
  user_email = public.current_user_email()
) with check (
  user_email = public.current_user_email()
);
create policy notification_preferences_delete on public.notification_preferences for delete to authenticated using (
  user_email = public.current_user_email()
);

create policy project_messages_create on public.project_messages for insert to authenticated with check (
  project_id = any(public.current_project_ids()) or created_by = public.current_user_email()
);
create policy project_messages_read on public.project_messages for select to authenticated using (
  project_id = any(public.current_project_ids()) or created_by = public.current_user_email() or public.is_admin()
);
create policy project_messages_update on public.project_messages for update to authenticated using (created_by = public.current_user_email()) with check (created_by = public.current_user_email());
create policy project_messages_delete on public.project_messages for delete to authenticated using (created_by = public.current_user_email());

create policy app_logs_insert on public.app_logs for insert to authenticated with check (true);
create policy app_logs_read on public.app_logs for select to authenticated using (
  user_email = public.current_user_email() or public.is_admin()
);

insert into storage.buckets (id, name, public)
values ('project-files', 'project-files', true)
on conflict (id) do nothing;

create policy storage_project_files_select
on storage.objects for select
to authenticated
using (bucket_id = 'project-files');

create policy storage_project_files_insert
on storage.objects for insert
to authenticated
with check (bucket_id = 'project-files');

create policy storage_project_files_update
on storage.objects for update
to authenticated
using (bucket_id = 'project-files')
with check (bucket_id = 'project-files');

create policy storage_project_files_delete
on storage.objects for delete
to authenticated
using (bucket_id = 'project-files');

create or replace function public.sync_user_access_for_email(p_user_email text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company_ids text[] := '{}';
  v_admin_company_ids text[] := '{}';
  v_project_ids text[] := '{}';
begin
  if p_user_email is null then
    return;
  end if;

  select coalesce(array_agg(distinct cm.company_id), '{}')
    into v_company_ids
  from public.company_members cm
  where cm.user_email = p_user_email
    and cm.status in ('active', 'invited');

  select coalesce(array_agg(distinct cm.company_id), '{}')
    into v_admin_company_ids
  from public.company_members cm
  where cm.user_email = p_user_email
    and cm.role = 'admin'
    and cm.status = 'active';

  select coalesce(array_agg(distinct p.project_id), '{}')
    into v_project_ids
  from (
    select pp.project_id
    from public.project_participants pp
    where pp.participant_type = 'personal'
      and pp.user_email = p_user_email
      and pp.status in ('active', 'invited')

    union

    select pp.project_id
    from public.project_participants pp
    where pp.participant_type = 'company'
      and pp.company_id = any(v_company_ids)
      and pp.status in ('active', 'invited')
  ) p;

  insert into public.users (email, company_ids, admin_company_ids, project_ids)
  values (p_user_email, v_company_ids, v_admin_company_ids, v_project_ids)
  on conflict (email)
  do update set
    company_ids = excluded.company_ids,
    admin_company_ids = excluded.admin_company_ids,
    project_ids = excluded.project_ids,
    updated_date = now();
end;
$$;

create or replace function public.sync_user_access_trigger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  company_to_sync text;
  member_email text;
begin
  if tg_table_name = 'company_members' then
    perform public.sync_user_access_for_email(new.user_email);
    perform public.sync_user_access_for_email(old.user_email);

    company_to_sync := coalesce(new.company_id, old.company_id);
    if company_to_sync is not null then
      for member_email in
        select distinct cm.user_email
        from public.company_members cm
        where cm.company_id = company_to_sync
          and cm.status in ('active', 'invited')
      loop
        perform public.sync_user_access_for_email(member_email);
      end loop;
    end if;

    return coalesce(new, old);
  end if;

  if tg_table_name = 'project_participants' then
    if coalesce(new.participant_type, old.participant_type) = 'personal' then
      perform public.sync_user_access_for_email(new.user_email);
      perform public.sync_user_access_for_email(old.user_email);
    else
      company_to_sync := coalesce(new.company_id, old.company_id);
      if company_to_sync is not null then
        for member_email in
          select distinct cm.user_email
          from public.company_members cm
          where cm.company_id = company_to_sync
            and cm.status in ('active', 'invited')
        loop
          perform public.sync_user_access_for_email(member_email);
        end loop;
      end if;
    end if;

    return coalesce(new, old);
  end if;

  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_sync_company_members on public.company_members;
create trigger trg_sync_company_members
after insert or update or delete on public.company_members
for each row execute function public.sync_user_access_trigger();

drop trigger if exists trg_sync_project_participants on public.project_participants;
create trigger trg_sync_project_participants
after insert or update or delete on public.project_participants
for each row execute function public.sync_user_access_trigger();

commit;
