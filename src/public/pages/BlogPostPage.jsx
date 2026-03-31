import React, { useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import ReactMarkdown from 'react-markdown';
import { Button } from '@/components/ui/button';
import { getBlogMetaItems } from '@/public/blogMeta';
import { contentClient } from '@/public/api/contentClient';
import { PUBLIC_CLASSES } from '@/public/designSystem';
import usePublicSeo from '@/public/hooks/usePublicSeo';
import StructuredData from '@/public/seo/StructuredData';
import usePublicGsap from '@/public/hooks/usePublicGsap';
import blogPostIt from '@/public/i18n/blog-post.it.json';
import blogPostEn from '@/public/i18n/blog-post.en.json';

function pickLocalized(post, locale, field) {
  const preferred = post?.[`${field}_${locale}`];
  if (preferred && preferred.trim()) return preferred;
  return post?.[`${field}_it`] || post?.[`${field}_en`] || '';
}

export default function BlogPostPage({ locale = 'it', basePath = '' }) {
  const rootRef = useRef(null);
  const { slug } = useParams();
  const copy = locale === 'en' ? blogPostEn : blogPostIt;

  const { data: post, isLoading, error } = useQuery({
    queryKey: ['public-blog-post', slug],
    queryFn: () => contentClient.getPublishedPostBySlug(slug),
    enabled: !!slug,
  });

  const title = pickLocalized(post, locale, 'title');
  const excerpt = pickLocalized(post, locale, 'excerpt');
  const content = pickLocalized(post, locale, 'content_markdown');
  const canonicalPath = slug ? `${basePath}/blog/${slug}` : `${basePath}/blog`;

  usePublicSeo({
    title,
    description: excerpt,
    canonicalPath,
    locale,
    alternateItPath: slug ? `/blog/${slug}` : '/blog',
    alternateEnPath: slug ? `/en/blog/${slug}` : '/en/blog',
    robots: error || (!isLoading && !post) ? 'noindex,nofollow' : 'index,follow',
  });

  usePublicGsap(rootRef);

  if (isLoading) {
    return <section className="max-w-4xl mx-auto px-4 sm:px-6 py-16 text-[#526071]">{copy.loading}</section>;
  }

  if (error || !post) {
    return (
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
        <h1 className="text-3xl font-semibold text-[#141821]">{copy.notFound}</h1>
        <Link className="text-[#ef6144] hover:underline mt-4 inline-block" to={`${basePath}/blog`}>
          {copy.backToBlog}
        </Link>
      </section>
    );
  }

  const metaItems = getBlogMetaItems(post, locale);

  const blogStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: title,
    description: excerpt,
    datePublished: post.published_at || post.created_date,
    dateModified: post.updated_date || post.created_date,
    author: {
      '@type': 'Person',
      name: post.author?.full_name || 'EdilSync',
    },
    inLanguage: locale,
  };

  return (
    <div ref={rootRef} className={PUBLIC_CLASSES.page}>
      <StructuredData id={`blog-post-jsonld-${post.id}`} data={blogStructuredData} />

      <section className="relative overflow-hidden border-b border-[var(--public-line)] bg-[linear-gradient(180deg,rgba(255,250,246,0.96),rgba(247,241,235,0.82))]">
        <div className="absolute top-8 left-6 h-[52px] w-[52px] rounded-full bg-[#ef6144]/10 blur-[16px]" aria-hidden />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-16 sm:pt-20 pb-12 sm:pb-14">
          <Link data-reveal className="text-[13px] font-semibold text-[#ef6144] hover:text-[#d9553a]" to={`${basePath}/blog`}>
            {copy.backToBlog}
          </Link>
          <h1 data-reveal className={`mt-5 ${PUBLIC_CLASSES.displayH1}`}>{title}</h1>
          {metaItems.length > 0 ? (
            <div data-reveal className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] font-medium text-[#6b7280]">
              {metaItems.map((item) => (
                <span key={item} className="inline-flex items-center">
                  {item}
                </span>
              ))}
            </div>
          ) : null}
          {excerpt ? <p data-reveal className={`mt-5 ${PUBLIC_CLASSES.bodyLead}`}>{excerpt}</p> : null}
        </div>
      </section>

      <article className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div data-reveal className="public-grid-card p-6 sm:p-9">
          <div className="blog-markdown max-w-none">
            <ReactMarkdown>{content || ''}</ReactMarkdown>
          </div>
        </div>
      </article>

      <section className="border-y border-[#e8edf3] bg-[#0b1220] text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(239,97,68,0.25),transparent_50%)]" aria-hidden />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20 text-center">
          <h2 data-reveal className="text-[34px] sm:text-[48px] font-[780] leading-[1.1] tracking-[-0.018em] max-w-4xl mx-auto">
            {copy.ctaTitle}
          </h2>
          <p data-reveal className="mt-5 text-[16px] sm:text-[18px] leading-[1.72] text-[#d8e1eb] max-w-3xl mx-auto">
            {copy.ctaText}
          </p>
          <div data-reveal className="mt-8 flex justify-center">
            <Button asChild className="bg-[#ef6144] hover:bg-[#d9553a] text-white rounded-full h-10 px-6 text-[13px] font-semibold shadow-[0_10px_28px_rgba(239,97,68,0.28)]">
              <Link to={`${basePath}/contatti`}>{copy.ctaButton}</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
