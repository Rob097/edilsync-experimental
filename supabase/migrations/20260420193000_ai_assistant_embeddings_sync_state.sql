begin;

create table if not exists public.ai_embedding_sync_state (
  id text primary key default gen_random_uuid()::text,
  context_type text not null check (context_type in ('personal', 'company', 'project')),
  context_id text not null,
  last_started_at timestamptz,
  last_completed_at timestamptz,
  last_error text,
  last_run_stats jsonb not null default '{}'::jsonb,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by text
);

create unique index if not exists ai_embedding_sync_state_context_unique_idx
  on public.ai_embedding_sync_state(context_type, context_id);

comment on table public.ai_embedding_sync_state is 'Server-side checkpoints for assistant embedding refreshes by context';

drop trigger if exists trg_ai_embedding_sync_state_audit on public.ai_embedding_sync_state;
create trigger trg_ai_embedding_sync_state_audit
before insert or update on public.ai_embedding_sync_state
for each row execute function public.set_audit_fields();

alter table public.ai_embedding_sync_state enable row level security;

revoke all on public.ai_embedding_sync_state from anon;
revoke all on public.ai_embedding_sync_state from authenticated;

drop function if exists public.upsert_assistant_embedding(text, text, text, text, text, text, text, jsonb, double precision[], text);

create or replace function public.upsert_assistant_embedding(
  p_context_type text,
  p_context_id text,
  p_source_type text,
  p_source_id text,
  p_title text,
  p_content text,
  p_content_hash text,
  p_metadata jsonb,
  p_embedding double precision[],
  p_created_by text default null
)
returns void
language sql
security definer
set search_path = public, extensions
as $$
  insert into public.embeddings (
    context_type,
    context_id,
    source_type,
    source_id,
    title,
    content,
    content_hash,
    metadata,
    embedding,
    created_by
  )
  values (
    p_context_type,
    p_context_id,
    p_source_type,
    p_source_id,
    p_title,
    p_content,
    p_content_hash,
    coalesce(p_metadata, '{}'::jsonb),
    case
      when p_embedding is null then null
      else p_embedding::extensions.halfvec(3072)
    end,
    p_created_by
  )
  on conflict (context_type, context_id, source_type, source_id)
  do update set
    title = excluded.title,
    content = excluded.content,
    content_hash = excluded.content_hash,
    metadata = excluded.metadata,
    embedding = excluded.embedding,
    updated_date = now(),
    created_by = coalesce(excluded.created_by, public.embeddings.created_by);
$$;

revoke all on function public.upsert_assistant_embedding(text, text, text, text, text, text, text, jsonb, double precision[], text) from public, anon, authenticated;
grant execute on function public.upsert_assistant_embedding(text, text, text, text, text, text, text, jsonb, double precision[], text) to service_role;

commit;