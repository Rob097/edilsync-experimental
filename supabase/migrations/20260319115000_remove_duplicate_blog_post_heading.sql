begin;

update public.blog_posts
set
  content_markdown_it = regexp_replace(
    content_markdown_it,
    '^\s*# Perche la documentazione sparsa non previene dispute nei progetti residenziali\n\n',
    ''
  ),
  content_markdown_en = regexp_replace(
    content_markdown_en,
    '^\s*# Why scattered documentation does not prevent disputes in residential projects\n\n',
    ''
  ),
  updated_date = now()
where slug = 'perche-documentazione-sparsa-non-previene-dispute-progetti-residenziali';

commit;