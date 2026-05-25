import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { contentClient } from '@/public/api/contentClient';
import { getBlogMetaItems } from '@/public/blogMeta';
import { PUBLIC_CLASSES } from '@/public/designSystem';
import usePublicSeo from '@/public/hooks/usePublicSeo';
import usePublicGsap from '@/public/hooks/usePublicGsap';
import { getPublicPageSeoData, localizePublicPath } from '@/public/lib/localePath';
import { pickLocalizedField } from '@/public/lib/pickLocalizedField';
import { readPublicPrerenderData } from '@/public/prerenderData';
import { getPublicCopy } from '@/public/lib/publicTranslations';

export default function BlogIndexPage({ locale = 'it', basePath = '', initialPosts }) {
  const rootRef = useRef(null);
  const seededPosts = Array.isArray(initialPosts)
    ? initialPosts
    : Array.isArray(readPublicPrerenderData('blogPosts'))
      ? readPublicPrerenderData('blogPosts')
      : undefined;
  const { data: posts = [], isLoading, error } = useQuery({
    queryKey: ['public-blog-posts'],
    queryFn: () => contentClient.listPublishedPosts(),
    initialData: seededPosts,
  });

  const copy = getPublicCopy(locale, 'blogIndex');
  const title = copy.seoTitle;
  const subtitle = copy.subtitle;
  const { canonicalPath, alternatePathsByLocale } = getPublicPageSeoData(locale, '/blog');
  const contactPath = localizePublicPath('/contatti', locale);

  usePublicSeo({
    title,
    description: subtitle,
    canonicalPath,
    locale,
    alternatePathsByLocale,
  });

  usePublicGsap(rootRef);

  const hasPosts = posts.length > 0;

  return (
    <div ref={rootRef} className={PUBLIC_CLASSES.page}>
      <section className="relative overflow-hidden border-b border-[var(--public-line)] bg-[linear-gradient(180deg,rgba(255,250,246,0.96),rgba(247,241,235,0.82))]">
        <div className="absolute top-8 left-6 h-[52px] w-[52px] rounded-full bg-[#ef6144]/10 blur-[16px]" aria-hidden />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 sm:pt-20 pb-12 sm:pb-16 text-center relative">
          <p data-reveal className="public-eyebrow">{copy.chip}</p>
          <h1 data-reveal className={`mt-5 ${PUBLIC_CLASSES.displayH1}`}>{title}</h1>
          <p data-reveal className={`mx-auto mt-5 max-w-3xl ${PUBLIC_CLASSES.bodyLead}`}>{subtitle}</p>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
        {isLoading ? <p className="text-[#526071]">{copy.loading}</p> : null}
        {error && !hasPosts ? <p className="text-red-600">{copy.loadError}</p> : null}

        {!isLoading && !error && !hasPosts ? (
          <div data-reveal className="public-grid-card p-6 text-[var(--public-muted)]">
            {copy.empty}
          </div>
        ) : null}

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <article key={post.id} data-reveal className="public-grid-card flex min-h-[250px] flex-col p-6">
              <p className="text-[11px] uppercase tracking-[0.12em] text-[#ef6144] font-semibold">
                {pickLocalizedField(post.category, locale, 'name') || 'Blog'}
              </p>
              <h2 className="mt-3 text-[22px] font-[700] leading-[1.28] text-[var(--public-ink)]">
                <Link to={localizePublicPath(`/blog/${post.slug}`, locale)} className="hover:text-[#ef6144] transition-colors">
                  {pickLocalizedField(post, locale, 'title')}
                </Link>
              </h2>
              {getBlogMetaItems(post, locale).length > 0 ? (
                <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] font-medium text-[#6b7280]">
                  {getBlogMetaItems(post, locale).map((item) => (
                    <span key={item} className="inline-flex items-center">
                      {item}
                    </span>
                  ))}
                </div>
              ) : null}
              <p className="mt-3 flex-1 text-[14px] leading-[1.72] text-[var(--public-muted)]">{pickLocalizedField(post, locale, 'excerpt')}</p>
              <Link to={localizePublicPath(`/blog/${post.slug}`, locale)} className="mt-4 text-[13px] font-semibold text-[#ef6144] hover:text-[#d9553a]">
                {copy.readArticle}
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-[#e8edf3] bg-[#0b1220] text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(239,97,68,0.25),transparent_50%)]" aria-hidden />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20 text-center">
          <h2 data-reveal className="text-[38px] sm:text-[52px] font-[780] leading-[1.08] tracking-[-0.018em] max-w-4xl mx-auto">
            {copy.ctaTitle}
          </h2>
          <p data-reveal className="mt-5 text-[16px] sm:text-[18px] leading-[1.72] text-[#d8e1eb] max-w-3xl mx-auto">
            {copy.ctaText}
          </p>
          <div data-reveal className="mt-8 flex justify-center">
            <Button asChild className="bg-[#ef6144] hover:bg-[#d9553a] text-white rounded-full h-10 px-6 text-[13px] font-semibold shadow-[0_10px_28px_rgba(239,97,68,0.28)]">
              <Link to={contactPath}>{copy.ctaButton}</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
