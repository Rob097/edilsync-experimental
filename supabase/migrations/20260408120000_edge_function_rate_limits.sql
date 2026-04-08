begin;

create table if not exists public.edge_rate_limits (
  id text primary key default gen_random_uuid()::text,
  scope text not null,
  identifier text not null,
  window_seconds integer not null check (window_seconds > 0 and window_seconds <= 604800),
  bucket_start timestamptz not null,
  request_count integer not null default 0 check (request_count >= 0),
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by text
);

create unique index if not exists edge_rate_limits_scope_identifier_window_bucket_idx
  on public.edge_rate_limits(scope, identifier, window_seconds, bucket_start);

create index if not exists edge_rate_limits_bucket_start_idx
  on public.edge_rate_limits(bucket_start desc);

alter table public.edge_rate_limits enable row level security;

revoke all on public.edge_rate_limits from anon, authenticated;

comment on table public.edge_rate_limits is 'Bucketed counters used by Edge Functions to enforce per-endpoint request throttling';
comment on column public.edge_rate_limits.scope is 'Logical endpoint/scope key, e.g. submit_demo_request:ip';
comment on column public.edge_rate_limits.identifier is 'Rate-limit subject key such as hashed IP, user id, company id, or normalized email';

drop function if exists public.consume_rate_limit(text, text, integer, integer);

create or replace function public.consume_rate_limit(
  p_scope text,
  p_identifier text,
  p_window_seconds integer,
  p_max_requests integer
)
returns table(
  allowed boolean,
  current_count integer,
  remaining_requests integer,
  retry_after_seconds integer,
  reset_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := now();
  v_scope text := trim(coalesce(p_scope, ''));
  v_identifier text := trim(coalesce(p_identifier, ''));
  v_bucket_epoch bigint;
  v_bucket_start timestamptz;
  v_reset_at timestamptz;
  v_count integer;
begin
  if v_scope = '' then
    raise exception 'p_scope is required';
  end if;

  if v_identifier = '' then
    raise exception 'p_identifier is required';
  end if;

  if p_window_seconds is null or p_window_seconds < 1 or p_window_seconds > 604800 then
    raise exception 'p_window_seconds must be between 1 and 604800';
  end if;

  if p_max_requests is null or p_max_requests < 1 then
    raise exception 'p_max_requests must be positive';
  end if;

  v_bucket_epoch := floor(extract(epoch from v_now) / p_window_seconds) * p_window_seconds;
  v_bucket_start := to_timestamp(v_bucket_epoch);

  insert into public.edge_rate_limits (
    scope,
    identifier,
    window_seconds,
    bucket_start,
    request_count,
    created_by
  )
  values (
    v_scope,
    v_identifier,
    p_window_seconds,
    v_bucket_start,
    1,
    'consume_rate_limit'
  )
  on conflict (scope, identifier, window_seconds, bucket_start)
  do update set
    request_count = public.edge_rate_limits.request_count + 1,
    updated_date = now()
  returning public.edge_rate_limits.request_count into v_count;

  v_reset_at := v_bucket_start + make_interval(secs => p_window_seconds);

  return query
  select
    v_count <= p_max_requests,
    v_count,
    greatest(p_max_requests - v_count, 0),
    greatest(ceil(extract(epoch from v_reset_at - v_now))::integer, 0),
    v_reset_at;
end;
$$;

revoke all on function public.consume_rate_limit(text, text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_rate_limit(text, text, integer, integer) to service_role;

commit;