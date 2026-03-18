import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { contentClient } from '@/public/api/contentClient';
import usePublicSeo from '@/public/hooks/usePublicSeo';
import usePublicGsap from '@/public/hooks/usePublicGsap';

function pickLocalized(post, locale, field) {
  const preferred = post?.[`${field}_${locale}`];
  if (preferred && preferred.trim()) return preferred;
  return post?.[`${field}_it`] || post?.[`${field}_en`] || '';
}

export default function BlogIndexPage({ locale = 'it', basePath = '' }) {
  const rootRef = useRef(null);
  const { data: posts = [], isLoading, error } = useQuery({
    queryKey: ['public-blog-posts'],
    queryFn: () => contentClient.listPublishedPosts(),
  });

  const title = locale === 'en' ? 'EdilSync Blog' : 'Blog EdilSync';
  const subtitle =
    locale === 'en'
      ? 'Practical content about dispute prevention, project coordination, and operational clarity in construction.'
      : 'Contenuti pratici su prevenzione dispute, coordinamento di cantiere e chiarezza operativa.';

  usePublicSeo({
    title,
    description: subtitle,
    canonicalPath: `${basePath}/blog` || '/blog',
    locale,
    alternateItPath: '/blog',
    alternateEnPath: '/en/blog',
  });

  usePublicGsap(rootRef);

  return (
    <div ref={rootRef} className="bg-[#f2f4f6]">
      <section className="relative overflow-hidden public-gradient border-b border-[#e5e7eb]">
        <div className="absolute top-8 left-6 h-[52px] w-[52px] rounded-full bg-[#ef6144]/10 blur-[16px]" aria-hidden />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 sm:pt-20 pb-12 sm:pb-16 text-center relative">
          <p data-reveal className="section-chip">{locale === 'en' ? 'Resources' : 'Risorse'}</p>
          <h1 data-reveal className="mt-4 text-[42px] sm:text-[58px] font-[780] leading-[1.06] tracking-[-0.02em] text-[#141821]">{title}</h1>
          <p data-reveal className="mt-5 text-[16px] sm:text-[18px] leading-[1.72] text-[#5b6470] max-w-3xl mx-auto">{subtitle}</p>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
        {isLoading ? <p className="text-[#526071]">Loading...</p> : null}
        {error ? <p className="text-red-600">Unable to load blog posts.</p> : null}

        {!isLoading && !error && posts.length === 0 ? (
          <div data-reveal className="public-panel bg-white p-6 text-[#526071]">
            {locale === 'en'
              ? 'No published articles yet. Content will appear here soon.'
              : 'Nessun articolo pubblicato al momento. I contenuti appariranno qui a breve.'}
          </div>
        ) : null}

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <article key={post.id} data-reveal className="public-panel bg-white p-6 min-h-[220px] flex flex-col">
              <p className="text-[11px] uppercase tracking-[0.12em] text-[#ef6144] font-semibold">
                {post.category?.[`name_${locale}`] || post.category?.name_it || post.category?.name_en || 'Blog'}
              </p>
              <h2 className="mt-3 text-[22px] font-[700] leading-[1.28] text-[#0f172a]">
                <Link to={`${basePath}/blog/${post.slug}`} className="hover:text-[#ef6144] transition-colors">
                  {pickLocalized(post, locale, 'title')}
                </Link>
              </h2>
              <p className="mt-3 text-[14px] leading-[1.72] text-[#526071] flex-1">{pickLocalized(post, locale, 'excerpt')}</p>
              <Link to={`${basePath}/blog/${post.slug}`} className="mt-4 text-[13px] font-semibold text-[#ef6144] hover:text-[#d9553a]">
                {locale === 'en' ? 'Read article' : 'Leggi articolo'}
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-[#e8edf3] bg-[#0b1220] text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(239,97,68,0.25),transparent_50%)]" aria-hidden />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20 text-center">
          <h2 data-reveal className="text-[38px] sm:text-[52px] font-[780] leading-[1.08] tracking-[-0.018em] max-w-4xl mx-auto">
            {locale === 'en' ? 'Want content mapped to your exact project model?' : 'Vuoi contenuti applicati al tuo modello di cantiere?'}
          </h2>
          <p data-reveal className="mt-5 text-[16px] sm:text-[18px] leading-[1.72] text-[#d8e1eb] max-w-3xl mx-auto">
            {locale === 'en'
              ? 'Book a focused demo and see how EdilSync turns best practices into operational routines.'
              : 'Prenota una demo focalizzata e scopri come EdilSync trasforma le best practice in routine operative.'}
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
