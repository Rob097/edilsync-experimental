begin;

drop index if exists public.embeddings_embedding_hnsw_idx;

drop function if exists public.match_context_embeddings(extensions.vector(1536), text, text, integer);
drop function if exists public.match_context_embeddings(extensions.vector(3072), text, text, integer);
drop function if exists public.match_context_embeddings(extensions.halfvec(3072), text, text, integer);
drop function if exists public.match_context_embeddings(double precision[], text, text, integer);

alter table public.embeddings
  alter column embedding type extensions.halfvec(3072)
  using null::extensions.halfvec(3072);

create index if not exists embeddings_embedding_hnsw_idx
  on public.embeddings using hnsw (embedding halfvec_cosine_ops);

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
  select
    e.id,
    e.source_type,
    e.source_id,
    e.title,
    e.content,
    e.metadata,
    1 - (e.embedding <=> query_embedding::extensions.halfvec(3072)) as similarity
  from public.embeddings e
  where e.context_type = p_context_type
    and e.context_id = p_context_id
    and e.embedding is not null
    and public.can_access_assistant_context(p_context_type, p_context_id)
  order by e.embedding <=> query_embedding::extensions.halfvec(3072) asc
  limit least(greatest(coalesce(p_match_count, 5), 1), 20);
$$;

commit;