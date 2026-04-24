begin;

drop function if exists public.can_read_assistant_embedding_source(text, text, text, text);

create or replace function public.can_read_assistant_embedding_source(
  p_context_type text,
  p_context_id text,
  p_source_type text,
  p_source_id text
)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_context_type text := lower(trim(coalesce(p_context_type, '')));
  v_context_id text := trim(coalesce(p_context_id, ''));
  v_source_type text := lower(trim(coalesce(p_source_type, '')));
  v_source_id text := trim(coalesce(p_source_id, ''));
begin
  if not public.can_access_assistant_context(v_context_type, v_context_id) then
    return false;
  end if;

  if v_source_type = '' or v_source_id = '' then
    return false;
  end if;

  if public.is_admin() then
    return true;
  end if;

  if v_source_type = 'project_document' then
    return exists (
      select 1
      from public.project_documents d
      where d.id = v_source_id
        and (
          (v_context_type = 'project' and d.project_id = v_context_id)
          or (v_context_type = 'company' and d.company_id = v_context_id)
        )
        and (
          d.project_id = any(public.current_project_ids())
          or d.company_id = any(public.current_company_ids())
          or d.created_by = public.current_user_email()
        )
    );
  end if;

  if v_source_type = 'document_comment' then
    return exists (
      select 1
      from public.document_comments c
      where c.id = v_source_id
        and (
          (v_context_type = 'project' and c.project_id = v_context_id)
          or (v_context_type = 'company' and c.company_id = v_context_id)
        )
        and (
          c.project_id = any(public.current_project_ids())
          or c.company_id = any(public.current_company_ids())
          or c.created_by = public.current_user_email()
        )
    );
  end if;

  if v_source_type = 'progress_statement_note' then
    return v_context_type = 'project'
      and exists (
        select 1
        from public.progress_statements ps
        where ps.id = v_source_id
          and ps.project_id = v_context_id
          and public.can_read_project_finance(ps.project_id)
      );
  end if;

  if v_source_type = 'work_session_note' then
    return exists (
      select 1
      from public.work_sessions ws
      where ws.id = v_source_id
        and (
          (v_context_type = 'project' and ws.project_id = v_context_id)
          or (v_context_type = 'company' and ws.company_id = v_context_id)
        )
        and (
          ws.company_id = any(public.current_company_ids())
          or ws.user_email = public.current_user_email()
        )
    );
  end if;

  return false;
end;
$$;

drop policy if exists embeddings_read on public.embeddings;
create policy embeddings_read on public.embeddings
for select to authenticated
using (
  public.can_read_assistant_embedding_source(context_type, context_id, source_type, source_id)
);

create or replace function public.match_context_embeddings(
  query_embedding double precision[],
  p_context_type text,
  p_context_id text,
  p_match_count integer default 5
)
returns table(
  id text,
  source_type text,
  source_id text,
  title text,
  content text,
  metadata jsonb,
  similarity double precision
)
language sql
stable
security definer
set search_path = public, extensions
as $$
  with candidates as (
    select
      e.id,
      e.context_type,
      e.context_id,
      e.source_type,
      e.source_id,
      e.title,
      e.content,
      e.metadata,
      e.embedding <=> query_embedding::extensions.halfvec(3072) as distance
    from public.embeddings e
    where e.context_type = p_context_type
      and e.context_id = p_context_id
      and e.embedding is not null
      and public.can_access_assistant_context(p_context_type, p_context_id)
    order by e.embedding <=> query_embedding::extensions.halfvec(3072) asc
    limit least(greatest(coalesce(p_match_count, 5), 1), 20) * 8
  )
  select
    c.id,
    c.source_type,
    c.source_id,
    c.title,
    c.content,
    c.metadata,
    1 - c.distance as similarity
  from candidates c
  where public.can_read_assistant_embedding_source(c.context_type, c.context_id, c.source_type, c.source_id)
  order by c.distance asc
  limit least(greatest(coalesce(p_match_count, 5), 1), 20);
$$;

commit;