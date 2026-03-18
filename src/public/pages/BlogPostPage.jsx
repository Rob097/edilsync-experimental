import React, { useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import ReactMarkdown from 'react-markdown';
import { Button } from '@/components/ui/button';
import { contentClient } from '@/public/api/contentClient';
import usePublicSeo from '@/public/hooks/usePublicSeo';
import StructuredData from '@/public/seo/StructuredData';
import usePublicGsap from '@/public/hooks/usePublicGsap';

function pickLocalized(post, locale, field) {
  const preferred = post?.[`${field}_${locale}`];
  if (preferred && preferred.trim()) return preferred;
  return post?.[`${field}_it`] || post?.[`${field}_en`] || '';
}

export default function BlogPostPage({ locale = 'it', basePath = '' }) {
  const rootRef = useRef(null);
  const { slug } = useParams();

  const { data: post, isLoading, error } = useQuery({
    queryKey: ['public-blog-post', slug],
    queryFn: () => contentClient.getPublishedPostBySlug(slug),
    enabled: !!slug,
  });

  if (isLoading) {
    return <section className="max-w-4xl mx-auto px-4 sm:px-6 py-16 text-[#526071]">Loading...</section>;
  }

  if (error || !post) {
    return (
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
        <h1 className="text-3xl font-semibold text-[#141821]">{locale === 'en' ? 'Article not found' : 'Articolo non trovato'}</h1>
        <Link className="text-[#ef6144] hover:underline mt-4 inline-block" to={`${basePath}/blog`}>
          {locale === 'en' ? 'Back to blog' : 'Torna al blog'}
        </Link>
      </section>
    );
  }

  const title = pickLocalized(post, locale, 'title');
  const excerpt = pickLocalized(post, locale, 'excerpt');
  const content = pickLocalized(post, locale, 'content_markdown');
  const canonicalPath = `${basePath}/blog/${post.slug}`;

  usePublicSeo({
    title,
    description: excerpt,
    canonicalPath,
    locale,
    alternateItPath: `/blog/${post.slug}`,
    alternateEnPath: `/en/blog/${post.slug}`,
  });

  usePublicGsap(rootRef);

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
    <div ref={rootRef} className="bg-[#f2f4f6]">
      <StructuredData id={`blog-post-jsonld-${post.id}`} data={blogStructuredData} />

      <section className="relative overflow-hidden public-gradient border-b border-[#e5e7eb]">
        <div className="absolute top-8 left-6 h-[52px] w-[52px] rounded-full bg-[#ef6144]/10 blur-[16px]" aria-hidden />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-16 sm:pt-20 pb-12 sm:pb-14">
          <Link data-reveal className="text-[13px] font-semibold text-[#ef6144] hover:text-[#d9553a]" to={`${basePath}/blog`}>
            {locale === 'en' ? 'Back to blog' : 'Torna al blog'}
          </Link>
          <h1 data-reveal className="mt-4 text-[40px] sm:text-[56px] font-[780] leading-[1.06] tracking-[-0.02em] text-[#141821]">{title}</h1>
          {excerpt ? <p data-reveal className="mt-5 text-[16px] sm:text-[18px] leading-[1.72] text-[#5b6470]">{excerpt}</p> : null}
        </div>
      </section>

      <article className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div data-reveal className="public-panel bg-white p-6 sm:p-9">
          <div className="prose prose-slate max-w-none prose-headings:text-[#0f172a] prose-p:text-[#526071] prose-li:text-[#526071]">
            <ReactMarkdown>{content || ''}</ReactMarkdown>
          </div>
        </div>
      </article>

      <section className="border-y border-[#e8edf3] bg-[#0b1220] text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(239,97,68,0.25),transparent_50%)]" aria-hidden />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20 text-center">
          <h2 data-reveal className="text-[34px] sm:text-[48px] font-[780] leading-[1.1] tracking-[-0.018em] max-w-4xl mx-auto">
            {locale === 'en' ? 'Need this in your daily operation, not just in articles?' : 'Vuoi portare tutto questo nell operativita quotidiana?'}
          </h2>
          <p data-reveal className="mt-5 text-[16px] sm:text-[18px] leading-[1.72] text-[#d8e1eb] max-w-3xl mx-auto">
            {locale === 'en'
              ? 'Book a guided demo and map EdilSync on your real project workflow.'
              : 'Prenota una demo guidata e mappa EdilSync sul tuo flusso reale di cantiere.'}
          </p>
          <div data-reveal className="mt-8 flex justify-center">
            <Button asChild className="bg-[#ef6144] hover:bg-[#d9553a] text-white rounded-full h-10 px-6 text-[13px] font-semibold shadow-[0_10px_28px_rgba(239,97,68,0.28)]">
              <Link to={`${basePath}/contatti`}>{locale === 'en' ? 'Request Demo' : 'Richiedi demo'}</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
