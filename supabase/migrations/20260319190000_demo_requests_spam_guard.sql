begin;

alter table public.demo_requests
  add column if not exists ip_hash text,
  add column if not exists user_agent text;

create index if not exists demo_requests_ip_hash_created_idx
  on public.demo_requests(ip_hash, created_date desc)
  where ip_hash is not null;

create index if not exists demo_requests_email_created_idx
  on public.demo_requests(email, created_date desc);

comment on column public.demo_requests.ip_hash is 'SHA-256 hash of client IP for anti-spam throttling';
comment on column public.demo_requests.user_agent is 'Captured user-agent for lead auditing and anti-spam analysis';

commit;
