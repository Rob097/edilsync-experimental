begin;

alter table public.blog_categories
  add column if not exists name_de text,
  add column if not exists description_de text;

alter table public.blog_authors
  add column if not exists role_title_de text,
  add column if not exists bio_de text;

alter table public.blog_posts
  add column if not exists title_de text,
  add column if not exists excerpt_de text,
  add column if not exists content_markdown_de text,
  add column if not exists cover_alt_de text,
  add column if not exists seo_title_de text,
  add column if not exists seo_description_de text;

commit;