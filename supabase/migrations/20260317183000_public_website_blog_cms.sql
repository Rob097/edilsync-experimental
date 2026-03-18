begin;

create table if not exists public.blog_categories (
  id text primary key default gen_random_uuid()::text,
  slug text not null unique,
  name_it text not null,
  name_en text,
  description_it text,
  description_en text,
  sort_order int not null default 100,
  is_visible boolean not null default true,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by text
);

create table if not exists public.blog_authors (
  id text primary key default gen_random_uuid()::text,
  slug text not null unique,
  full_name text not null,
  role_title_it text,
  role_title_en text,
  bio_it text,
  bio_en text,
  avatar_url text,
  linkedin_url text,
  is_active boolean not null default true,
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by text
);

create table if not exists public.blog_posts (
  id text primary key default gen_random_uuid()::text,
  slug text not null unique,
  status text not null default 'draft' check (status in ('draft', 'in_review', 'published', 'archived')),
  title_it text not null,
  title_en text,
  excerpt_it text,
  excerpt_en text,
  content_markdown_it text,
  content_markdown_en text,
  cover_image_url text,
  cover_alt_it text,
  cover_alt_en text,
  seo_title_it text,
  seo_title_en text,
  seo_description_it text,
  seo_description_en text,
  category_id text references public.blog_categories(id) on delete set null,
  author_id text references public.blog_authors(id) on delete set null,
  featured boolean not null default false,
  published_at timestamptz,
  reading_time_minutes int,
  tags text[] not null default '{}',
  created_date timestamptz not null default now(),
  updated_date timestamptz not null default now(),
  created_by text
);

create index if not exists blog_posts_status_published_at_idx on public.blog_posts(status, published_at desc);
create index if not exists blog_posts_category_idx on public.blog_posts(category_id);
create index if not exists blog_posts_author_idx on public.blog_posts(author_id);

alter table public.blog_categories enable row level security;
alter table public.blog_authors enable row level security;
alter table public.blog_posts enable row level security;

create trigger set_blog_categories_audit_fields
before insert or update on public.blog_categories
for each row execute function public.set_audit_fields();

create trigger set_blog_authors_audit_fields
before insert or update on public.blog_authors
for each row execute function public.set_audit_fields();

create trigger set_blog_posts_audit_fields
before insert or update on public.blog_posts
for each row execute function public.set_audit_fields();

create policy blog_categories_public_read on public.blog_categories
for select to public
using (is_visible = true);

create policy blog_categories_admin_write on public.blog_categories
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy blog_authors_public_read on public.blog_authors
for select to public
using (is_active = true);

create policy blog_authors_admin_write on public.blog_authors
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy blog_posts_public_read on public.blog_posts
for select to public
using (
  status = 'published'
  and published_at is not null
  and published_at <= now()
);

create policy blog_posts_admin_write on public.blog_posts
for all to authenticated
using (public.is_admin())
with check (public.is_admin());

comment on table public.blog_categories is 'Public website blog categories';
comment on table public.blog_authors is 'Public website blog authors';
comment on table public.blog_posts is 'Public website blog articles';

commit;
