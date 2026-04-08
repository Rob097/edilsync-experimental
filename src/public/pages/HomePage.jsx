import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, ArrowRight, CalendarDays, Camera, Check, ChevronRight, ClipboardList, Clock3, FileQuestion, FileText, ListChecks, MessageCircle, MessageSquare, Phone, Shield, Users, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import usePublicSeo from '@/public/hooks/usePublicSeo';
import usePublicGsap from '@/public/hooks/usePublicGsap';
import StructuredData from '@/public/seo/StructuredData';
import { PUBLIC_CLASSES } from '@/public/designSystem';

export default function HomePage({ locale = 'it' }) {
  const rootRef = useRef(null);
  const { t } = useTranslation();
  const canonicalPath = locale === 'en' ? '/en' : '/';
  const basePrefix = locale === 'en' ? '/en' : '';

  const problemItems = [
    { icon: MessageSquare, title: t('publicHome.problem.c1t'), description: t('publicHome.problem.c1d') },
    { icon: Phone, title: t('publicHome.problem.c2t'), description: t('publicHome.problem.c2d') },
    { icon: FileQuestion, title: t('publicHome.problem.c3t'), description: t('publicHome.problem.c3d') },
    { icon: Clock3, title: t('publicHome.problem.c4t'), description: t('publicHome.problem.c4d') },
    { icon: AlertTriangle, title: t('publicHome.problem.c5t'), description: t('publicHome.problem.c5d') },
    { icon: Users, title: t('publicHome.problem.c6t'), description: t('publicHome.problem.c6d') },
  ];

  const solutionItems = [
    { number: '01', title: t('publicHome.solution.s1t'), description: t('publicHome.solution.s1d') },
    { number: '02', title: t('publicHome.solution.s2t'), description: t('publicHome.solution.s2d') },
    { number: '03', title: t('publicHome.solution.s3t'), description: t('publicHome.solution.s3d') },
  ];

  const featureItems = [
    { icon: ListChecks, title: t('publicHome.features.f1t'), description: t('publicHome.features.f1d') },
    { icon: Camera, title: t('publicHome.features.f2t'), description: t('publicHome.features.f2d') },
    { icon: FileText, title: t('publicHome.features.f3t'), description: t('publicHome.features.f3d') },
    { icon: MessageCircle, title: t('publicHome.features.f4t'), description: t('publicHome.features.f4d') },
    { icon: CalendarDays, title: t('publicHome.features.f5t'), description: t('publicHome.features.f5d') },
    { icon: Shield, title: t('publicHome.features.f6t'), description: t('publicHome.features.f6d') },
    { icon: Wallet, title: t('publicHome.features.f7t'), description: t('publicHome.features.f7d') },
    { icon: Clock3, title: t('publicHome.features.f8t'), description: t('publicHome.features.f8d') },
  ];

  const whyItems = [
    { icon: Shield, title: t('publicHome.why.w1t'), description: t('publicHome.why.w1d') },
    { icon: MessageSquare, title: t('publicHome.why.w2t'), description: t('publicHome.why.w2d') },
    { icon: ClipboardList, title: t('publicHome.why.w3t'), description: t('publicHome.why.w3d') },
    { icon: ArrowRight, title: t('publicHome.why.w4t'), description: t('publicHome.why.w4d') },
  ];

  const audienceCards = [
    {
      name: 'Michele',
      image: '/images/michele.png',
      role: t('publicHome.audience.micheleRole'),
      quote: t('publicHome.audience.micheleQuote'),
      bullets: [t('publicHome.audience.m1'), t('publicHome.audience.m2'), t('publicHome.audience.m3'), t('publicHome.audience.m4')],
    },
    {
      name: 'Matteo',
      image: '/images/matteo.png',
      role: t('publicHome.audience.matteoRole'),
      quote: t('publicHome.audience.matteoQuote'),
      bullets: [t('publicHome.audience.t1'), t('publicHome.audience.t2'), t('publicHome.audience.t3'), t('publicHome.audience.t4')],
    },
    {
      name: 'Marco',
      image: '/images/marco.png',
      role: t('publicHome.audience.marcoRole'),
      quote: t('publicHome.audience.marcoQuote'),
      bullets: [t('publicHome.audience.r1'), t('publicHome.audience.r2'), t('publicHome.audience.r3'), t('publicHome.audience.r4')],
    },
  ];

  const pricingBullets = Array.from({ length: 12 }, (_, index) => t(`publicHome.pricing.p${index + 1}`));
  const heroHighlights = [
    { label: t('publicHome.hero.highlights.alignmentLabel'), text: t('publicHome.hero.highlights.alignmentText') },
    { label: t('publicHome.hero.highlights.traceabilityLabel'), text: t('publicHome.hero.highlights.traceabilityText') },
    { label: t('publicHome.hero.highlights.controlLabel'), text: t('publicHome.hero.highlights.controlText') },
  ];
  const featuredProblemItems = problemItems.slice(0, 4);
  const featuredFeatureItems = featureItems.slice(0, 4);
  const pricingHighlights = pricingBullets.slice(0, 5);
  const pricingAccessItems = [
    t('publicHome.pricing.access.i1'),
    t('publicHome.pricing.access.i2'),
    t('publicHome.pricing.access.i3'),
  ];
  const resultBullets = [
    t('publicHome.solution.result.b1'),
    t('publicHome.solution.result.b2'),
    t('publicHome.solution.result.b3'),
  ];

  const handleLearnMoreClick = (event) => {
    const target = document.getElementById('problema');
    if (!target) return;

    event.preventDefault();
    const headerOffset = 96;
    const targetY = target.getBoundingClientRect().top + window.pageYOffset - headerOffset;
    window.scrollTo({ top: targetY, behavior: 'smooth' });
  };

  usePublicGsap(rootRef);

  usePublicSeo({
    title: t('publicHome.seo.title'),
    description: t('publicHome.seo.description'),
    canonicalPath,
    locale,
    alternateItPath: '/',
    alternateEnPath: '/en',
  });

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'EdilSync',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    description: t('publicHome.seo.softwareDescription'),
  };

  return (
    <>
      <StructuredData id="home-software-app" data={structuredData} />
      <div ref={rootRef} className={PUBLIC_CLASSES.page}>
        <section className="public-section-shell relative overflow-hidden px-6 pb-16 pt-14 sm:pt-16 md:pb-24 md:pt-20 xl:pb-28 xl:pt-28">
          <div data-parallax="slow" className="pointer-events-none absolute left-[8%] top-20 h-72 w-72 rounded-full bg-[rgba(239,97,68,0.12)] blur-3xl" aria-hidden />
          <div data-parallax="medium" className="pointer-events-none absolute bottom-10 right-[12%] h-64 w-64 rounded-full bg-[rgba(196,158,108,0.12)] blur-3xl" aria-hidden />
          <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[minmax(0,1.08fr)_minmax(320px,0.92fr)] lg:items-start xl:gap-14 xl:items-center">
            <div className="max-w-2xl">
              <span data-reveal className="public-eyebrow">
                {t('publicHome.hero.badge')}
              </span>
              <h1 data-reveal className="mt-4 max-w-[17ch] text-[clamp(2.45rem,4.2vw,4.85rem)] font-bold tracking-[-0.05em] leading-[0.92] text-[var(--public-ink)] xl:mt-5 xl:max-w-[13ch] xl:text-[clamp(3.1rem,6vw,5.9rem)]">
                {t('publicHome.hero.titleA')} <span className="text-[var(--public-accent)]">{t('publicHome.hero.titleHighlight')}</span> {t('publicHome.hero.titleB')}
              </h1>
              <p data-reveal className={`${PUBLIC_CLASSES.bodyLead} mt-5 max-w-[60ch]`}>
                {t('publicHome.hero.subtitle')}
              </p>
              <div data-reveal className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button asChild className={`${PUBLIC_CLASSES.primaryCta} h-12 px-7 text-base`}>
                  <Link to="/app">
                    {t('publicHome.hero.ctaPrimary')}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" className="public-outline-button h-12 rounded-full px-7 text-base">
                  <a href="#problema" onClick={handleLearnMoreClick}>
                    {t('publicHome.hero.ctaSecondary')}
                  </a>
                </Button>
              </div>
              <p data-reveal className="mt-4 max-w-[46ch] text-sm leading-[1.7] text-[var(--public-muted)]/85">
                {t('publicHome.hero.note')}
              </p>
              <div data-reveal className="mt-8 grid gap-3 sm:grid-cols-3">
                {heroHighlights.map((item) => (
                  <div key={item.label} className="public-grid-card p-4">
                    <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[var(--public-accent-dark)]">{item.label}</p>
                    <p className="mt-2 text-sm leading-[1.6] text-[var(--public-muted)]">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>

            <div data-reveal className="lg:justify-self-end lg:pt-1 xl:pt-4">
              <div className="public-device-frame max-w-[560px] xl:max-w-none">
                <img src="/images/hero-image.png" alt={t('publicHome.hero.preview.alt')} className="block w-full border border-white/10 object-cover" />
                <div className="mt-4 grid gap-3 sm:grid-cols-[1.2fr_0.8fr]">
                  <div className="public-kpi-card rounded-[24px] p-5">
                    <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#f7b7a8]">{t('publicHome.hero.preview.feedLabel')}</p>
                    <p className="mt-3 text-lg font-semibold tracking-[-0.03em] text-[#f8f3ef]">{t('publicHome.hero.preview.feedTitle')}</p>
                    <p className="mt-3 text-sm leading-[1.65] text-[#ded7d1]/76">{t('publicHome.hero.preview.feedText')}</p>
                  </div>
                  <div className="public-grid-card flex flex-col justify-between p-5">
                    <div>
                      <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[var(--public-accent-dark)]">{t('publicHome.hero.preview.fieldReadyLabel')}</p>
                      <p className="mt-3 text-3xl font-bold tracking-[-0.05em] text-[var(--public-ink)]">{t('publicHome.hero.preview.fieldReadyValue')}</p>
                    </div>
                    <p className="text-sm leading-[1.6] text-[var(--public-muted)]">{t('publicHome.hero.preview.fieldReadyText')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#15171c] px-6 py-8 text-[#f8f3ef] md:py-10">
          <div className="mx-auto grid max-w-7xl gap-6 sm:grid-cols-2 xl:grid-cols-4 xl:gap-0">
            {[
              { value: t('publicHome.stats.aValue'), label: t('publicHome.stats.aLabel') },
              { value: t('publicHome.stats.bValue'), label: t('publicHome.stats.bLabel') },
              { value: t('publicHome.stats.cValue'), label: t('publicHome.stats.cLabel') },
              { value: t('publicHome.stats.dValue'), label: t('publicHome.stats.dLabel') },
            ].map((item, index) => (
              <div key={item.label} data-reveal className={`flex flex-col gap-3 ${index > 0 ? 'public-stat-divider xl:pl-8' : ''}`}>
                <p className="text-[2.5rem] font-bold leading-none tracking-[-0.05em] text-[var(--public-accent)]">{item.value}</p>
                <p className="max-w-[24ch] text-sm leading-[1.55] text-[#ded7d1]/76">{item.label}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="problema" className="public-section-shell px-6 py-24 md:py-30">
          <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.88fr_1.12fr] lg:items-start">
            <div className="max-w-xl lg:sticky lg:top-28">
              <span data-reveal className="public-eyebrow">{t('publicHome.problem.chip')}</span>
              <h2 data-reveal className={`${PUBLIC_CLASSES.displayH2} mt-5 max-w-[11ch]`}>
                {t('publicHome.problem.title')}
              </h2>
              <p data-reveal className={`${PUBLIC_CLASSES.bodyLead} mt-5`}>
                {t('publicHome.problem.subtitle')}
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {featuredProblemItems.map((item, index) => {
                const Icon = item.icon;
                return (
                  <article
                    key={item.title}
                    data-reveal
                    className="public-grid-card p-6"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className={PUBLIC_CLASSES.iconWrap}>
                        <Icon className={PUBLIC_CLASSES.icon} />
                      </div>
                      <span className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[var(--public-accent-dark)]">{t('publicHome.problem.issueLabel', { number: index + 1 })}</span>
                    </div>
                    <h3 className={`${PUBLIC_CLASSES.sectionH3} mt-5 max-w-[18ch]`}>{item.title}</h3>
                    <p className={`${PUBLIC_CLASSES.bodySm} mt-3`}>{item.description}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section id="come-funziona" className="bg-[rgba(255,250,246,0.8)] px-6 py-24 md:py-32">
          <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
            <div>
              <span data-reveal className="public-eyebrow">{t('publicHome.solution.chip')}</span>
              <h2 data-reveal className={`${PUBLIC_CLASSES.displayH2} mt-5 max-w-[13ch]`}>
                {t('publicHome.solution.title')}
              </h2>
              <p data-reveal className={`${PUBLIC_CLASSES.bodyLead} mt-5 max-w-[58ch]`}>
                {t('publicHome.solution.subtitle')}
              </p>
              <div className="mt-10 space-y-4">
                {solutionItems.map((item) => (
                  <article key={item.number} data-reveal className="public-grid-card grid gap-4 p-5 md:grid-cols-[72px_1fr] md:items-start">
                    <p className="text-5xl font-bold leading-none tracking-[-0.05em] text-[rgba(239,97,68,0.2)]">{item.number}</p>
                    <div>
                      <h3 className={PUBLIC_CLASSES.sectionH3}>{item.title}</h3>
                      <p className={`${PUBLIC_CLASSES.bodyBase} mt-2`}>{item.description}</p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
            <div className="space-y-4" data-reveal>
              <div className="public-kpi-card rounded-[32px] p-7 md:p-9">
                <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#f7b7a8]">{t('publicHome.solution.result.label')}</p>
                <h3 className="mt-4 text-[clamp(1.9rem,3vw,3.1rem)] font-bold tracking-[-0.05em] leading-[1.02] text-[#f8f3ef]">
                  {t('publicHome.solution.result.title')}
                </h3>
                <ul className="public-check-list mt-8 space-y-3 text-sm leading-[1.7] text-[#ded7d1]">
                  {resultBullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {whyItems.slice(0, 2).map((item) => {
                  const Icon = item.icon;

                  return (
                    <article key={item.title} className="public-grid-card p-5">
                      <div className="flex items-center gap-3">
                        <div className={PUBLIC_CLASSES.iconWrap}>
                          <Icon className={PUBLIC_CLASSES.icon} />
                        </div>
                        <h3 className={PUBLIC_CLASSES.sectionH3}>{item.title}</h3>
                      </div>
                      <p className={`${PUBLIC_CLASSES.bodySm} mt-3`}>{item.description}</p>
                    </article>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="public-section-shell px-6 py-24 md:py-32">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-3xl">
              <span data-reveal className="public-eyebrow">{t('publicHome.features.chip')}</span>
              <h2 data-reveal className={`${PUBLIC_CLASSES.displayH2} mt-5 max-w-[12ch]`}>
                {t('publicHome.features.title')}
              </h2>
              <p data-reveal className={`${PUBLIC_CLASSES.bodyLead} mt-5 max-w-[60ch]`}>
                {t('publicHome.features.subtitle')}
              </p>
            </div>
            <div className="mt-14 grid gap-4 md:grid-cols-2 xl:grid-cols-12">
              {featuredFeatureItems.map((item, index) => {
                const Icon = item.icon;
                const spanClass = index === 0 ? 'xl:col-span-5' : index === 1 ? 'xl:col-span-3' : index === 2 ? 'xl:col-span-4' : 'xl:col-span-6';

                return (
                  <article key={item.title} data-reveal className={`public-grid-card p-6 ${spanClass}`}>
                    <div className="flex items-center gap-3">
                      <div className={PUBLIC_CLASSES.iconWrap}>
                        <Icon className={PUBLIC_CLASSES.icon} />
                      </div>
                      <span className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[var(--public-accent-dark)]">{t('publicHome.features.moduleLabel')}</span>
                    </div>
                    <h3 className={`${PUBLIC_CLASSES.sectionH3} mt-5`}>{item.title}</h3>
                    <p className={`${PUBLIC_CLASSES.bodyBase} mt-3`}>{item.description}</p>
                  </article>
                );
              })}
            </div>
            <div data-reveal className="mt-8 flex justify-start">
              <Button asChild variant="outline" className="public-outline-button rounded-full px-6">
                <Link to={`${basePrefix}/funzionalita`}>
                  {t('publicHome.features.seeAll')}
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        <section id="perchi" className="public-section-shell px-6 py-24 md:py-32">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-3xl">
              <span data-reveal className="public-eyebrow">{t('publicHome.audience.chip')}</span>
              <h2 data-reveal className={`${PUBLIC_CLASSES.displayH2} mt-5 max-w-[13ch]`}>
                {t('publicHome.audience.title')}
              </h2>
              <p data-reveal className={`${PUBLIC_CLASSES.bodyLead} mt-5 max-w-[58ch]`}>
                {t('publicHome.audience.subtitle')}
              </p>
            </div>
            <div className="mt-14 grid gap-5 lg:grid-cols-3">
              {audienceCards.map((card, index) => (
                <article key={card.name} data-reveal className="public-grid-card flex h-full flex-col p-6">
                  <div className="flex items-center gap-4">
                    <img src={card.image} alt={card.name} className="h-16 w-16 rounded-full border border-[rgba(239,97,68,0.22)] object-cover" />
                    <div>
                      <p className="text-lg font-semibold tracking-[-0.03em] text-[var(--public-ink)]">{card.name}</p>
                      <p className="mt-1 text-[11px] font-extrabold uppercase tracking-[0.14em] text-[var(--public-accent-dark)]">{card.role}</p>
                    </div>
                  </div>
                  <blockquote className="mt-5 border-l-2 border-[rgba(239,97,68,0.22)] pl-4 text-[15px] italic leading-[1.7] text-[var(--public-muted)] line-clamp-3">
                    {card.quote}
                  </blockquote>
                  <p className="mt-6 text-[11px] font-extrabold uppercase tracking-[0.14em] text-[var(--public-accent-dark)]">{t('publicHome.audience.helpLabel')}</p>
                  <ul className="public-check-list mt-4 space-y-3 text-sm leading-[1.7] text-[var(--public-ink)]">
                    {card.bullets.slice(0, 3).map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="prezzi" className="bg-[rgba(255,250,246,0.86)] px-6 py-24 md:py-32">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-3xl">
              <span data-reveal className="public-eyebrow">{t('publicHome.pricing.chip')}</span>
              <h2 data-reveal className={`${PUBLIC_CLASSES.displayH2} mt-5 max-w-[11ch]`}>
                {t('publicHome.pricing.title')}
              </h2>
              <p data-reveal className={`${PUBLIC_CLASSES.bodyLead} mt-5 max-w-[60ch]`}>
                {t('publicHome.pricing.subtitle')}
              </p>
            </div>

            <div className="mt-14 grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_440px] xl:items-start">
              <div className="space-y-4 xl:self-start">
                <article data-reveal className="public-grid-card p-7">
                  <div className="grid gap-5 md:grid-cols-[0.9fr_1.1fr] md:items-start">
                    <div>
                      <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[var(--public-accent-dark)]">
                        {t('publicHome.pricing.access.label')}
                      </p>
                      <h3 className="mt-4 text-[clamp(1.5rem,2.5vw,2.3rem)] font-bold tracking-[-0.05em] text-[var(--public-ink)]">
                        {t('publicHome.pricing.access.title')}
                      </h3>
                    </div>
                    <div className="space-y-3">
                      {pricingAccessItems.map((item) => (
                        <div key={item} className="flex items-start gap-3 rounded-[20px] border border-[var(--public-line)] bg-[rgba(255,248,244,0.72)] p-4">
                          <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-[var(--public-accent)]" />
                          <p className="text-sm leading-[1.65] text-[var(--public-muted)]">{item}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </article>

                <div className="grid gap-4 md:grid-cols-3">
                  <article data-reveal className="public-grid-card p-5">
                    <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[var(--public-accent-dark)]">{t('publicHome.pricing.explainer.freeBadge')}</p>
                    <h3 className={`${PUBLIC_CLASSES.sectionH3} mt-4`}>{t('publicHome.pricing.explainer.freeTitle')}</h3>
                    <p className={`${PUBLIC_CLASSES.bodySm} mt-3`}>{t('publicHome.pricing.explainer.freeText')}</p>
                  </article>
                  <article data-reveal className="public-grid-card p-5">
                    <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[var(--public-accent-dark)]">{t('publicHome.pricing.explainer.companyBadge')}</p>
                    <h3 className={`${PUBLIC_CLASSES.sectionH3} mt-4`}>{t('publicHome.pricing.explainer.companyTitle')}</h3>
                    <p className={`${PUBLIC_CLASSES.bodySm} mt-3`}>{t('publicHome.pricing.explainer.companyText')}</p>
                  </article>
                  <article data-reveal className="public-grid-card p-5">
                    <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[var(--public-accent-dark)]">{t('publicHome.pricing.explainer.projectBadge')}</p>
                    <h3 className={`${PUBLIC_CLASSES.sectionH3} mt-4`}>{t('publicHome.pricing.explainer.projectTitle')}</h3>
                    <p className={`${PUBLIC_CLASSES.bodySm} mt-3`}>{t('publicHome.pricing.explainer.projectText')}</p>
                  </article>
                </div>
              </div>

              <div data-reveal data-price-card className="public-grid-card relative overflow-hidden self-start border-[rgba(239,97,68,0.34)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(255,243,237,0.98))] p-8 shadow-[0_26px_64px_rgba(223,88,59,0.12)]">
                <span className="absolute right-0 top-0 rounded-bl-[22px] bg-[var(--public-accent)] px-4 py-2 text-[11px] font-extrabold uppercase tracking-[0.14em] text-white">{t('publicHome.pricing.badge')}</span>
                <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[var(--public-accent-dark)]">{t('publicHome.pricing.plan')}</p>
                <div className="mt-5 flex items-end gap-2">
                  <p className="text-[clamp(3rem,6vw,4.4rem)] font-bold leading-none tracking-[-0.06em] text-[var(--public-ink)]">{t('publicHome.pricing.price')}</p>
                </div>
                <p className="mt-4 max-w-[30ch] text-sm leading-[1.7] text-[var(--public-muted)]">{t('publicHome.pricing.priceNote')}</p>
                <div className="mt-6">
                  <Button asChild className={`${PUBLIC_CLASSES.primaryCta} h-12 w-full text-base`}>
                    <Link to="/app">{t('publicHome.pricing.cta')}</Link>
                  </Button>
                </div>
                <p className="mt-3 text-center text-xs leading-[1.6] text-[var(--public-muted)]/85">{t('publicHome.pricing.noCard')}</p>
                <div className="mt-7 border-t border-[rgba(84,63,54,0.1)] pt-7">
                  <p className="text-sm font-semibold text-[var(--public-ink)]">{t('publicHome.pricing.teamsNeedLabel')}</p>
                  <ul className="public-check-list mt-4 space-y-3 text-sm leading-[1.68] text-[var(--public-ink)]">
                    {pricingHighlights.map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <Link to={`${basePrefix}/prezzi`} className="public-anchor-link text-sm font-semibold">
                      {t('publicHome.pricing.seeFull')}
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden bg-[#15171c] px-6 py-24 text-white md:py-32">
          <div data-parallax="slow" className="pointer-events-none absolute left-[18%] top-0 h-80 w-80 rounded-full bg-[rgba(239,97,68,0.18)] blur-3xl" aria-hidden />
          <div data-parallax="medium" className="pointer-events-none absolute bottom-0 right-[14%] h-72 w-72 rounded-full bg-[rgba(196,158,108,0.14)] blur-3xl" aria-hidden />
          <div className="relative mx-auto max-w-4xl text-center">
            <h2 data-reveal className={`${PUBLIC_CLASSES.darkDisplayH2} mx-auto max-w-[13ch]`}>
              {t('publicHome.final.title')}
            </h2>
            <p data-reveal className={`${PUBLIC_CLASSES.darkBodyLead} mt-6 max-w-3xl`}>
              {t('publicHome.final.text')}
            </p>
            <div data-reveal className="mt-10 flex justify-center">
              <Button asChild className={PUBLIC_CLASSES.darkPrimaryCta}>
                <Link to="/app">{t('publicHome.final.ctaPrimary')}</Link>
              </Button>
            </div>
            <p data-reveal className={`${PUBLIC_CLASSES.darkNote} mt-5`}>{t('publicHome.hero.note')}</p>
          </div>
        </section>
      </div>
    </>
  );
}
