begin;

create extension if not exists vector with schema extensions;

create or replace function public.current_app_user_id()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select u.id
  from public.users u
  where u.email = public.current_user_email()
  limit 1;
$$;

create or replace function public.current_active_context()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(u.active_context, 'personal')
  from public.users u
  where u.email = public.current_user_email()
  limit 1;
$$;

create or replace function public.current_active_company_id()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select u.active_company_id
  from public.users u
  where u.email = public.current_user_email()
  limit 1;
$$;

drop function if exists public.can_access_assistant_context(text, text);

create or replace function public.can_access_assistant_context(p_context_type text, p_context_id text)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_context_type text := lower(trim(coalesce(p_context_type, '')));
  v_context_id text := trim(coalesce(p_context_id, ''));
  v_current_context text := public.current_active_context();
  v_current_user_id text := public.current_app_user_id();
  v_active_company_id text := public.current_active_company_id();
begin
  if public.is_admin() then
    return true;
  end if;

  if v_context_type = '' or v_context_id = '' then
    return false;
  end if;

  if v_context_type = 'personal' then
    return v_current_context = 'personal'
      and v_current_user_id is not null
      and v_context_id = v_current_user_id;
  end if;

  if v_context_type = 'company' then
    return v_current_context = 'company'
      and v_active_company_id is not null
      and v_context_id = v_active_company_id
      and v_context_id = any(public.current_company_ids());
  end if;

  if v_context_type = 'project' then
    if v_current_context = 'company' then
      return v_active_company_id is not null
        and exists (
          select 1
          from public.project_participants pp
          where pp.project_id = v_context_id
            and pp.status = 'active'
            and pp.participant_type = 'company'
            and pp.company_id = v_active_company_id
        );
    end if;

    return exists (
      select 1
      from public.project_participants pp
      where pp.project_id = v_context_id
        and pp.status = 'active'
        and pp.participant_type = 'personal'
        and pp.user_email = public.current_user_email()
    );
  end if;

  return false;
end;
$$;

create table if not exists public.ai_chats (
  id text primary key default gen_random_uuid()::text,
  user_id text not null references public.users(id) on delete cascade,
  context_type text not null check (context_type in ('personal', 'company', 'project')),
  context_id text not null,
  title text not null default '',
  last_message_at timestamptz not null default now(),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by text
);

create table if not exists public.ai_messages (
  id text primary key default gen_random_uuid()::text,
  chat_id text not null references public.ai_chats(id) on delete cascade,
  user_id text not null references public.users(id) on delete cascade,
  context_type text not null check (context_type in ('personal', 'company', 'project')),
  context_id text not null,
  role text not null check (role in ('system', 'user', 'assistant', 'tool')),
  content text,
  status text not null default 'completed' check (status in ('pending', 'streaming', 'completed', 'failed')),
  tool_calls jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by text
);

create table if not exists public.embeddings (
  id text primary key default gen_random_uuid()::text,
  context_type text not null check (context_type in ('personal', 'company', 'project')),
  context_id text not null,
  source_type text not null,
  source_id text,
  title text,
  content text not null,
  content_hash text,
  metadata jsonb not null default '{}'::jsonb,
  embedding extensions.halfvec(3072),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by text
);

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

create index if not exists ai_chats_user_context_updated_idx
  on public.ai_chats(user_id, context_type, context_id, updated_date desc);

create index if not exists ai_messages_chat_created_idx
  on public.ai_messages(chat_id, created_date asc);

create index if not exists ai_messages_user_context_created_idx
  on public.ai_messages(user_id, context_type, context_id, created_date desc);

create unique index if not exists embeddings_context_source_unique_idx
  on public.embeddings(context_type, context_id, source_type, source_id);

create index if not exists embeddings_context_idx
  on public.embeddings(context_type, context_id, updated_date desc);

create index if not exists embeddings_source_idx
  on public.embeddings(source_type, source_id);

create unique index if not exists ai_embedding_sync_state_context_unique_idx
  on public.ai_embedding_sync_state(context_type, context_id);

create index if not exists embeddings_embedding_hnsw_idx
  on public.embeddings using hnsw (embedding halfvec_cosine_ops);

comment on table public.ai_chats is 'Server-side assistant conversations partitioned by EdilSync context';
comment on table public.ai_messages is 'Messages for AI assistant conversations, including executed tool metadata';
comment on table public.embeddings is 'Context-scoped semantic memory used by the assistant retrieval layer';
comment on table public.ai_embedding_sync_state is 'Server-side checkpoints for assistant embedding refreshes by context';

drop trigger if exists trg_ai_chats_audit on public.ai_chats;
create trigger trg_ai_chats_audit
before insert or update on public.ai_chats
for each row execute function public.set_audit_fields();

drop trigger if exists trg_ai_messages_audit on public.ai_messages;
create trigger trg_ai_messages_audit
before insert or update on public.ai_messages
for each row execute function public.set_audit_fields();

drop trigger if exists trg_embeddings_audit on public.embeddings;
create trigger trg_embeddings_audit
before insert or update on public.embeddings
for each row execute function public.set_audit_fields();

drop trigger if exists trg_ai_embedding_sync_state_audit on public.ai_embedding_sync_state;
create trigger trg_ai_embedding_sync_state_audit
before insert or update on public.ai_embedding_sync_state
for each row execute function public.set_audit_fields();

create or replace function public.touch_ai_chat_last_message_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  update public.ai_chats
  set last_message_at = coalesce(new.created_date, now()),
      updated_date = now()
  where id = new.chat_id;

  return new;
end;
$$;

drop trigger if exists trg_ai_messages_touch_chat on public.ai_messages;
create trigger trg_ai_messages_touch_chat
after insert on public.ai_messages
for each row execute function public.touch_ai_chat_last_message_at();

alter table public.ai_chats enable row level security;
alter table public.ai_messages enable row level security;
alter table public.embeddings enable row level security;
alter table public.ai_embedding_sync_state enable row level security;

revoke all on public.ai_chats from anon;
revoke all on public.ai_messages from anon;
revoke all on public.embeddings from anon;
revoke all on public.ai_embedding_sync_state from anon;
revoke all on public.ai_embedding_sync_state from authenticated;

grant select, insert, update, delete on public.ai_chats to authenticated;
grant select, insert, update, delete on public.ai_messages to authenticated;
grant select on public.embeddings to authenticated;

drop policy if exists ai_chats_read on public.ai_chats;
create policy ai_chats_read on public.ai_chats
for select to authenticated
using (
  user_id = public.current_app_user_id()
  and public.can_access_assistant_context(context_type, context_id)
);

drop policy if exists ai_chats_create on public.ai_chats;
create policy ai_chats_create on public.ai_chats
for insert to authenticated
with check (
  user_id = public.current_app_user_id()
  and public.can_access_assistant_context(context_type, context_id)
);

drop policy if exists ai_chats_update on public.ai_chats;
create policy ai_chats_update on public.ai_chats
for update to authenticated
using (
  user_id = public.current_app_user_id()
  and public.can_access_assistant_context(context_type, context_id)
)
with check (
  user_id = public.current_app_user_id()
  and public.can_access_assistant_context(context_type, context_id)
);

drop policy if exists ai_chats_delete on public.ai_chats;
create policy ai_chats_delete on public.ai_chats
for delete to authenticated
using (
  user_id = public.current_app_user_id()
  and public.can_access_assistant_context(context_type, context_id)
);

drop policy if exists ai_messages_read on public.ai_messages;
create policy ai_messages_read on public.ai_messages
for select to authenticated
using (
  user_id = public.current_app_user_id()
  and public.can_access_assistant_context(context_type, context_id)
);

drop policy if exists ai_messages_create on public.ai_messages;
create policy ai_messages_create on public.ai_messages
for insert to authenticated
with check (
  user_id = public.current_app_user_id()
  and public.can_access_assistant_context(context_type, context_id)
);

drop policy if exists ai_messages_update on public.ai_messages;
create policy ai_messages_update on public.ai_messages
for update to authenticated
using (
  user_id = public.current_app_user_id()
  and public.can_access_assistant_context(context_type, context_id)
)
with check (
  user_id = public.current_app_user_id()
  and public.can_access_assistant_context(context_type, context_id)
);

drop policy if exists ai_messages_delete on public.ai_messages;
create policy ai_messages_delete on public.ai_messages
for delete to authenticated
using (
  user_id = public.current_app_user_id()
  and public.can_access_assistant_context(context_type, context_id)
);

drop policy if exists embeddings_read on public.embeddings;
create policy embeddings_read on public.embeddings
for select to authenticated
using (public.can_access_assistant_context(context_type, context_id));

drop function if exists public.match_context_embeddings(extensions.vector(1536), text, text, integer);
drop function if exists public.match_context_embeddings(extensions.vector(3072), text, text, integer);
drop function if exists public.match_context_embeddings(extensions.halfvec(3072), text, text, integer);
drop function if exists public.match_context_embeddings(double precision[], text, text, integer);

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