import React, { useMemo, useRef } from 'react';
import {
  ArrowRight,
  CalendarDays,
  Camera,
  ListChecks,
  MessageCircle,
  Navigation,
  Quote,
} from 'lucide-react';
import usePublicSeo from '@/public/hooks/usePublicSeo';
import usePublicGsap from '@/public/hooks/usePublicGsap';
import { PUBLIC_CLASSES } from '@/public/designSystem';
import PublicPrimaryCta from '@/public/components/marketing/PublicPrimaryCta';
import MarketingFinalCtaSection from '@/public/components/marketing/MarketingFinalCtaSection';
import { getPublicLocaleVariant, getPublicPageSeoData } from '@/public/lib/localePath';
import { getPublicCopy } from '@/public/lib/publicTranslations';


export default function SubcontractorsPage({ locale = 'it' }) {
  const rootRef = useRef(null);
  const copy = useMemo(() => getPublicCopy(locale, 'subcontractorsPage'), [locale]);
  const { canonicalPath, alternatePathsByLocale } = getPublicPageSeoData(locale, '/per-subappaltatori');
  const fieldStoryLabel = getPublicLocaleVariant(locale, { it: 'Storia dal campo', en: 'Field story' });
  const subcontractorFlowLabel = getPublicLocaleVariant(locale, { it: 'Flusso subappalto', en: 'Subcontractor flow' });

  usePublicGsap(rootRef);

  usePublicSeo({
    title: copy.seoTitle,
    description: copy.seoDescription,
    canonicalPath,
    locale,
    alternatePathsByLocale,
  });

  return (
    <div ref={rootRef} className={PUBLIC_CLASSES.page}>
      <section className="public-section-shell pt-32 pb-[4.5rem] md:pb-24">
        <div className="mx-auto grid max-w-6xl px-4 sm:px-6 gap-10 lg:grid-cols-[minmax(0,1.04fr)_minmax(320px,0.96fr)] lg:items-center">
          <div className="relative min-w-0 overflow-hidden rounded-[32px] border border-[var(--public-line)] bg-[linear-gradient(135deg,rgba(255,255,255,0.95),rgba(255,246,240,0.88))] p-8 shadow-[0_30px_80px_rgba(37,25,20,0.08)] md:p-10" data-reveal>
            <div className="absolute -left-12 top-8 h-36 w-36 rounded-full bg-[rgba(239,97,68,0.14)] blur-3xl" aria-hidden />
            <div className="relative">
              <span className="public-eyebrow">{copy.badge}</span>
              <h1 className="mt-5 max-w-[16ch] text-[clamp(2.25rem,4.6vw,4.8rem)] font-bold tracking-[-0.05em] leading-[0.98] text-balance md:leading-[0.95]">
                <span className="block">{copy.titleA}</span>
                <span className="block text-[var(--public-accent)]">{copy.titleB}</span>
                <span className="block">{copy.titleC}</span>
              </h1>
              <p className={`mt-6 max-w-2xl ${PUBLIC_CLASSES.bodyLead}`}>{copy.subtitle}</p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <PublicPrimaryCta to="/app" label={copy.ctaTop} />
                <p className="rounded-full border border-[rgba(239,97,68,0.18)] bg-[rgba(255,240,232,0.82)] px-4 py-2 text-sm font-semibold text-[var(--public-accent-dark)]">
                  {copy.note}
                </p>
              </div>
            </div>
          </div>

          <div className="public-device-frame self-start p-5 md:p-6" data-reveal>
            <div className="rounded-[28px] border border-white/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(255,247,242,0.92))] p-7 shadow-[0_18px_50px_rgba(52,35,29,0.1)]">
              <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--public-accent-dark)]">
                <span>{fieldStoryLabel}</span>
                <span>EdilSync</span>
              </div>
              <Quote className="mt-8 h-8 w-8 text-[var(--public-accent)]/30" />
              <p className="mt-4 text-[1.04rem] font-medium leading-8 text-[var(--public-ink)]">"{copy.quote}"</p>
              <div className="mt-8 flex items-center gap-3 border-t border-[var(--public-line)] pt-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[rgba(239,97,68,0.1)] font-bold text-[var(--public-accent)]">M</div>
                <div>
                  <p className="text-sm font-semibold text-[var(--public-ink)]">{copy.quoteAuthor}</p>
                  <p className={PUBLIC_CLASSES.bodyXsMuted}>{copy.quoteRole}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="public-section-shell py-[4.5rem] md:py-[5.5rem]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="max-w-2xl" data-reveal>
            <span className="public-eyebrow">{subcontractorFlowLabel}</span>
            <h2 className={`mt-5 ${PUBLIC_CLASSES.sectionH2}`}>{copy.benefitsTitle}</h2>
          </div>
          <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-12">
            {copy.benefits.map((item, index) => {
              const Icon = item.icon;

              return (
                <article
                  key={item.title}
                  data-reveal
                  className={`p-6 ${PUBLIC_CLASSES.card} ${PUBLIC_CLASSES.cardHover} ${index === 0 ? 'xl:col-span-5' : index === 1 ? 'xl:col-span-3' : index === 2 ? 'xl:col-span-4' : index === 3 ? 'xl:col-span-4' : index === 4 ? 'xl:col-span-5' : 'xl:col-span-3'}`}
                >
                  <div className={`${PUBLIC_CLASSES.iconWrap} mb-4`}>
                    <Icon className={PUBLIC_CLASSES.icon} />
                  </div>
                  <h3 className={PUBLIC_CLASSES.sectionH3}>{item.title}</h3>
                  <p className={`mt-2 ${PUBLIC_CLASSES.bodySm}`}>{item.text}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <MarketingFinalCtaSection
        title={copy.finalTitle}
        text={copy.finalText}
        ctaLabel={copy.finalCta}
        ctaHref="/app"
        note={copy.finalNote}
      />
    </div>
  );
}
