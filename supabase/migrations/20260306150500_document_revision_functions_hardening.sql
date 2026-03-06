begin;

create or replace function public.set_project_document_revision_defaults()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  parent_root_id text;
  parent_revision integer;
begin
  if new.parent_document_id is not null then
    select d.root_document_id, d.revision_number
      into parent_root_id, parent_revision
    from public.project_documents d
    where d.id = new.parent_document_id
    limit 1;

    new.root_document_id := coalesce(new.root_document_id, parent_root_id, new.parent_document_id);
    new.revision_number := coalesce(new.revision_number, coalesce(parent_revision, 0) + 1);
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
set search_path = public
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

commit;
