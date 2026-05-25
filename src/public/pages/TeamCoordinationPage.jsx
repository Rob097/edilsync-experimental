import React, { useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Bell, CalendarDays, ListChecks, MessageCircle, Navigation, Quote, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PUBLIC_SIGNUP_PATH } from '@/lib/authRouting';
import usePublicSeo from '@/public/hooks/usePublicSeo';
import usePublicGsap from '@/public/hooks/usePublicGsap';
import { PUBLIC_CLASSES } from '@/public/designSystem';
import { getPublicLocaleVariant, getPublicPageSeoData } from '@/public/lib/localePath';
import { getPublicCopy } from '@/public/lib/publicTranslations';


export default function TeamCoordinationPage({ locale = 'it' }) {
  const rootRef = useRef(null);
  const copy = useMemo(() => getPublicCopy(locale, 'teamCoordinationPage'), [locale]);
  const { canonicalPath, alternatePathsByLocale } = getPublicPageSeoData(locale, '/team-coordination');
  const failurePointsLabel = getPublicLocaleVariant(locale, { it: 'Punti di rottura', en: 'Common failure points' });
  const alignmentEngineLabel = getPublicLocaleVariant(locale, { it: 'Motore di allineamento', en: 'Alignment engine' });

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
      <section className="public-section-shell pt-32 pb-[4.5rem] md:pb-[5.5rem] text-center">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <span className="public-eyebrow" data-reveal>
            {copy.badge}
          </span>
          <h1 className={`mt-5 ${PUBLIC_CLASSES.displayH1}`} data-reveal>
            {copy.title} <span className="text-[var(--public-accent)]">{copy.titleHighlight}</span>
          </h1>
          <p className={`mx-auto mt-5 max-w-2xl ${PUBLIC_CLASSES.bodyLead}`} data-reveal>
            {copy.subtitle}
          </p>
          <div className="mt-8" data-reveal>
            <Button asChild className="h-11 rounded-full bg-[linear-gradient(135deg,#ef6144,#d9553a)] px-8 text-white shadow-[0_20px_44px_rgba(223,88,59,0.28)] hover:bg-[linear-gradient(135deg,#e55a3d,#c94d35)]">
              <Link to={PUBLIC_SIGNUP_PATH}>
                {copy.cta}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="public-section-shell py-[4.5rem] md:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <h2 className={`mb-8 text-center ${PUBLIC_CLASSES.sectionH2}`} data-reveal>
            {copy.stakeholdersTitle}
          </h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {copy.stakeholders.map((item) => (
              <div key={item.role} className="public-grid-card p-5 text-center" data-reveal>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mb-3 ${item.roleClass}`}>{item.role}</span>
                <p className="text-xs leading-relaxed text-[var(--public-muted)]">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="public-section-shell py-[4.5rem] md:py-[5.5rem]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-12 text-center" data-reveal>
            <span className="public-eyebrow">{failurePointsLabel}</span>
            <h2 className={`mt-5 ${PUBLIC_CLASSES.sectionH2}`}>{copy.problemsTitle}</h2>
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {copy.problems.map((problem) => (
              <div key={problem.title} className="rounded-[24px] border border-[rgba(196,77,53,0.15)] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(255,247,245,0.92))] p-6 shadow-[0_14px_34px_rgba(42,28,23,0.05)]" data-reveal>
                <h3 className="mb-2 text-lg font-semibold text-[var(--public-ink)]">{problem.title}</h3>
                <p className="text-sm leading-relaxed text-[var(--public-muted)]">{problem.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="public-section-shell py-[4.5rem] md:py-[5.5rem]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-12 text-center" data-reveal>
            <span className="public-eyebrow">{alignmentEngineLabel}</span>
            <h2 className={`mt-5 ${PUBLIC_CLASSES.sectionH2}`}>{copy.alignmentTitle}</h2>
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-12">
            {copy.alignment.map((item, index) => (
              <div key={item.title} className={`p-6 ${PUBLIC_CLASSES.card} ${PUBLIC_CLASSES.cardHover} ${index === 0 ? 'xl:col-span-5' : index === 1 ? 'xl:col-span-3' : index === 2 ? 'xl:col-span-4' : index === 3 ? 'xl:col-span-4' : index === 4 ? 'xl:col-span-3' : 'xl:col-span-5'}`} data-reveal>
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-[rgba(239,97,68,0.12)]">
                  <item.icon className="h-5 w-5 text-[var(--public-accent)]" />
                </div>
                <h3 className={PUBLIC_CLASSES.sectionH3}>{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--public-muted)]">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="public-section-shell py-[4.5rem] md:py-20">
        <div className="public-grid-card mx-auto max-w-3xl px-4 sm:px-6 p-8 text-center" data-reveal>
          <Quote className="mx-auto mb-6 h-10 w-10 text-[var(--public-accent)]/20" />
          <p className="text-xl font-medium leading-relaxed text-[var(--public-ink)]">"{copy.citation}"</p>
          <p className="mt-4 text-sm text-[var(--public-muted)]">{copy.citationSource}</p>
        </div>
      </section>

      <section className="py-24 md:py-32 bg-[#0b1220] relative overflow-hidden">
        <div data-parallax="slow" className="absolute top-0 left-1/3 w-96 h-96 bg-[#ef6144]/20 rounded-full blur-3xl pointer-events-none" />
        <div data-parallax="medium" className="absolute bottom-0 right-1/4 w-80 h-80 bg-[#ef6144]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10" data-reveal>
          <h2 className={PUBLIC_CLASSES.darkDisplayH2}>{copy.finalTitle}</h2>
          <p className={`mt-6 ${PUBLIC_CLASSES.darkBodyLead}`}>{copy.finalText}</p>
          <div className="mt-10 flex justify-center">
            <Button asChild className="bg-[#ef6144] hover:bg-[#d9553a] text-white h-10 rounded-full px-10 text-base gap-2 shadow-lg shadow-[rgba(239,97,68,0.4)]">
              <Link to={PUBLIC_SIGNUP_PATH}>
                {copy.finalCta}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
          <p className="mt-4 text-sm text-white/40">{copy.finalNote}</p>
        </div>
      </section>
    </div>
  );
}
