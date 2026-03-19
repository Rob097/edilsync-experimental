begin;

update public.blog_posts
set
  published_at = now() - interval '1 minute',
  updated_date = now()
where slug = 'perche-documentazione-sparsa-non-previene-dispute-progetti-residenziali'
  and status = 'published'
  and published_at > now();

commit;