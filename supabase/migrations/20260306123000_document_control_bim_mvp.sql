-- Document Control + BIM MVP foundation
-- Adds revision metadata, project-design classification, and event/approval timelines.

alter table public.project_documents
  add column if not exists file_path text,
  add column if not exists parent_document_id text,
  add column if not exists root_document_id text,
  add column if not exists revision_number integer,
  add column if not exists is_current_revision boolean,
  add column if not exists document_status text,
  add column if not exists discipline text,
  add column if not exists work_area text,
  add column if not exists project_phase text,
  add column if not exists document_tags text[] default '{}'::text[],
  add column if not exists model_format text;

alter table public.project_documents
  add constraint project_documents_parent_document_fk
  foreign key (parent_document_id) references public.project_documents(id) on delete set null;

alter table public.project_documents
  add constraint project_documents_root_document_fk
  foreign key (root_document_id) references public.project_documents(id) on delete set null;

update public.project_documents
set
  file_path = coalesce(file_path, nullif(regexp_replace(file_url, '^.*?/project-files/', ''), file_url)),
  revision_number = coalesce(revision_number, 1),
  is_current_revision = coalesce(is_current_revision, true),
  document_status = coalesce(document_status, 'draft'),
  root_document_id = coalesce(root_document_id, id),
  document_tags = coalesce(document_tags, '{}'::text[]);

alter table public.project_documents
  alter column revision_number set default 1,
  alter column revision_number set not null,
  alter column is_current_revision set default true,
  alter column is_current_revision set not null,
  alter column document_status set default 'draft',
  alter column document_status set not null,
  alter column root_document_id set not null,
  alter column document_tags set default '{}'::text[],
  alter column document_tags set not null;

alter table public.project_documents
  add constraint project_documents_document_status_check
  check (document_status in ('draft', 'in_review', 'approved', 'rejected', 'superseded', 'archived'));

alter table public.project_documents
  add constraint project_documents_discipline_check
  check (discipline is null or discipline in ('architecture', 'structure', 'mep', 'interior', 'landscape', 'geotechnical', 'other'));

alter table public.project_documents
  add constraint project_documents_work_area_check
  check (work_area is null or work_area in ('room', 'detail', 'interior', 'exterior', 'garden', 'foundation', 'section', 'static_calculation', 'other'));

alter table public.project_documents
  add constraint project_documents_project_phase_check
  check (project_phase is null or project_phase in ('concept', 'definitive', 'executive', 'as_built', 'calculation', 'other'));

alter table public.project_documents
  add constraint project_documents_model_format_check
  check (model_format is null or model_format in ('ifc', 'glb', 'gltf', 'other'));

create index if not exists project_documents_root_idx on public.project_documents(root_document_id);
create index if not exists project_documents_parent_idx on public.project_documents(parent_document_id);
create index if not exists project_documents_status_idx on public.project_documents(document_status);
create index if not exists project_documents_file_path_idx on public.project_documents(file_path);
create unique index if not exists project_documents_current_revision_unique_idx
  on public.project_documents(root_document_id)
  where is_current_revision;

create table if not exists public.document_revision_events (
  id text primary key default gen_random_uuid()::text,
  document_id text not null references public.project_documents(id) on delete cascade,
  event_type text not null,
  note text,
  payload jsonb,
  created_date timestamptz not null default now(),
  created_by text
);

create table if not exists public.document_approvals (
  id text primary key default gen_random_uuid()::text,
  document_id text not null references public.project_documents(id) on delete cascade,
  status text not null default 'pending',
  requested_by_email text,
  reviewed_by_email text,
  review_note text,
  reviewed_date timestamptz,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by text
);

alter table public.document_approvals
  add constraint document_approvals_status_check
  check (status in ('pending', 'approved', 'rejected'));

create index if not exists document_revision_events_document_idx on public.document_revision_events(document_id, created_date desc);
create index if not exists document_approvals_document_idx on public.document_approvals(document_id, created_date desc);

create or replace function public.set_project_document_revision_defaults()
returns trigger
language plpgsql
as $$
declare
  parent_record public.project_documents%rowtype;
begin
  if new.parent_document_id is not null then
    select * into parent_record from public.project_documents where id = new.parent_document_id;
    if found then
      new.root_document_id := coalesce(new.root_document_id, parent_record.root_document_id, parent_record.id);
      new.revision_number := coalesce(new.revision_number, parent_record.revision_number + 1);
    end if;
  end if;

  new.root_document_id := coalesce(new.root_document_id, new.id);
  new.revision_number := coalesce(new.revision_number, 1);
  new.is_current_revision := coalesce(new.is_current_revision, true);
  new.document_status := coalesce(new.document_status, 'draft');
  new.document_tags := coalesce(new.document_tags, '{}'::text[]);

  return new;
end;
$$;

create or replace function public.log_project_document_event()
returns trigger
language plpgsql
as $$
declare
  event_name text;
begin
  if tg_op = 'INSERT' then
    event_name := case
      when new.parent_document_id is not null then 'revision_created'
      else 'document_created'
    end;

    insert into public.document_revision_events(document_id, event_type, created_by, payload)
    values (
      new.id,
      event_name,
      new.created_by,
      jsonb_build_object(
        'revision_number', new.revision_number,
        'document_status', new.document_status,
        'is_current_revision', new.is_current_revision
      )
    );
    return new;
  end if;

  event_name := case
    when coalesce(new.file_path, '') <> coalesce(old.file_path, '')
      or coalesce(new.file_url, '') <> coalesce(old.file_url, '')
      then 'file_replaced'
    when coalesce(new.document_status, '') <> coalesce(old.document_status, '')
      then 'status_changed'
    else 'metadata_updated'
  end;

  insert into public.document_revision_events(document_id, event_type, created_by, payload)
  values (
    new.id,
    event_name,
    new.created_by,
    jsonb_build_object(
      'before', jsonb_build_object(
        'document_status', old.document_status,
        'is_current_revision', old.is_current_revision
      ),
      'after', jsonb_build_object(
        'document_status', new.document_status,
        'is_current_revision', new.is_current_revision
      )
    )
  );

  return new;
end;
$$;

drop trigger if exists set_project_document_revision_defaults_trigger on public.project_documents;
create trigger set_project_document_revision_defaults_trigger
before insert on public.project_documents
for each row
execute function public.set_project_document_revision_defaults();

drop trigger if exists log_project_document_event_trigger on public.project_documents;
create trigger log_project_document_event_trigger
after insert or update on public.project_documents
for each row
execute function public.log_project_document_event();

alter table public.document_revision_events enable row level security;
alter table public.document_approvals enable row level security;

create policy document_revision_events_read on public.document_revision_events
for select to authenticated using (
  exists (
    select 1
    from public.project_documents d
    where d.id = document_revision_events.document_id
      and (
        (d.project_id is not null and d.project_id = any(public.current_project_ids()))
        or (d.company_id is not null and d.company_id = any(public.current_company_ids()))
      )
  )
);

create policy document_revision_events_create on public.document_revision_events
for insert to authenticated with check (
  exists (
    select 1
    from public.project_documents d
    where d.id = document_revision_events.document_id
      and (
        (d.project_id is not null and d.project_id = any(public.current_project_ids()))
        or (d.company_id is not null and d.company_id = any(public.current_company_ids()))
      )
  )
);

create policy document_approvals_read on public.document_approvals
for select to authenticated using (
  exists (
    select 1
    from public.project_documents d
    where d.id = document_approvals.document_id
      and (
        (d.project_id is not null and d.project_id = any(public.current_project_ids()))
        or (d.company_id is not null and d.company_id = any(public.current_company_ids()))
      )
  )
);

create policy document_approvals_create on public.document_approvals
for insert to authenticated with check (
  exists (
    select 1
    from public.project_documents d
    where d.id = document_approvals.document_id
      and (
        (d.project_id is not null and d.project_id = any(public.current_project_ids()))
        or (d.company_id is not null and d.company_id = any(public.current_company_ids()))
      )
  )
);

create policy document_approvals_update on public.document_approvals
for update to authenticated using (
  exists (
    select 1
    from public.project_documents d
    where d.id = document_approvals.document_id
      and (
        (d.project_id is not null and d.project_id = any(public.current_project_ids()))
        or (d.company_id is not null and d.company_id = any(public.current_company_ids()))
      )
  )
)
with check (
  exists (
    select 1
    from public.project_documents d
    where d.id = document_approvals.document_id
      and (
        (d.project_id is not null and d.project_id = any(public.current_project_ids()))
        or (d.company_id is not null and d.company_id = any(public.current_company_ids()))
      )
  )
);

create policy document_approvals_delete on public.document_approvals
for delete to authenticated using (
  exists (
    select 1
    from public.project_documents d
    where d.id = document_approvals.document_id
      and (
        (d.project_id is not null and d.project_id = any(public.current_project_ids()))
        or (d.company_id is not null and d.company_id = any(public.current_company_ids()))
      )
  )
);
