import React, { useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import ReactMarkdown from 'react-markdown';
if (typeof document !== 'undefined') {
  void import('@/public/blog-post.css');
}
import { Button } from '@/components/ui/button';
import { getBlogMetaItems } from '@/public/blogMeta';
import { contentClient } from '@/public/api/contentClient';
import { PUBLIC_CLASSES } from '@/public/designSystem';
import usePublicSeo from '@/public/hooks/usePublicSeo';
import { getPublicPageSeoData, localizePublicPath } from '@/public/lib/localePath';
import { pickLocalizedField } from '@/public/lib/pickLocalizedField';
import { readPublicPrerenderData } from '@/public/prerenderData';
import StructuredData from '@/public/seo/StructuredData';
import usePublicGsap from '@/public/hooks/usePublicGsap';
import { getPublicCopy } from '@/public/lib/publicTranslations';

export default function BlogPostPage({ locale = 'it', basePath = '', initialPost }) {
  const rootRef = useRef(null);
  const { slug } = useParams();
  const copy = getPublicCopy(locale, 'blogPost');
  const prerenderedPost = readPublicPrerenderData('blogPost');
  const seededPost = initialPost?.slug === slug
    ? initialPost
    : prerenderedPost?.slug === slug
      ? prerenderedPost
      : undefined;

  const { data: post, isLoading, error } = useQuery({
    queryKey: ['public-blog-post', slug],
    queryFn: () => contentClient.getPublishedPostBySlug(slug),
    enabled: !!slug,
    initialData: seededPost,
  });

  const title = pickLocalizedField(post, locale, 'title');
  const excerpt = pickLocalizedField(post, locale, 'excerpt');
  const content = pickLocalizedField(post, locale, 'content_markdown');
  const seoPath = slug ? `/blog/${slug}` : '/blog';
  const { canonicalPath, alternatePathsByLocale } = getPublicPageSeoData(locale, seoPath);
  const blogIndexPath = localizePublicPath('/blog', locale);
  const contactPath = localizePublicPath('/contatti', locale);

  usePublicSeo({
    title,
    description: excerpt,
    canonicalPath,
    locale,
    alternatePathsByLocale,
    robots: !post && (error || !isLoading) ? 'noindex,nofollow' : 'index,follow',
  });

  usePublicGsap(rootRef);

  if (isLoading && !post) {
    return <section className="max-w-4xl mx-auto px-4 sm:px-6 py-16 text-[#526071]">{copy.loading}</section>;
  }

  if (!post) {
    return (
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
        <h1 className="text-3xl font-semibold text-[#141821]">{copy.notFound}</h1>
        <Link className="text-[#ef6144] hover:underline mt-4 inline-block" to={blogIndexPath}>
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
          <Link data-reveal className="text-[13px] font-semibold text-[#ef6144] hover:text-[#d9553a]" to={blogIndexPath}>
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
              <Link to={contactPath}>{copy.ctaButton}</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
