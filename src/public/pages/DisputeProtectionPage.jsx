import React, { useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ArrowRight, Camera, Clock3, FileText, Quote, Scale, Stamp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PUBLIC_SIGNUP_PATH } from '@/lib/authRouting';
import usePublicSeo from '@/public/hooks/usePublicSeo';
import usePublicGsap from '@/public/hooks/usePublicGsap';
import { PUBLIC_CLASSES } from '@/public/designSystem';
import { getPublicCopy } from '@/public/lib/publicTranslations';


export default function DisputeProtectionPage({ locale = 'it' }) {
  const rootRef = useRef(null);
  const copy = useMemo(() => getPublicCopy(locale, 'disputeProtectionPage'), [locale]);
  const basePath = locale === 'en' ? '/en' : '';
  const canonicalPath = locale === 'en' ? '/en/dispute-protection' : '/dispute-protection';

  usePublicGsap(rootRef);

  usePublicSeo({
    title: copy.seoTitle,
    description: copy.seoDescription,
    canonicalPath,
    locale,
    alternateItPath: '/dispute-protection',
    alternateEnPath: '/en/dispute-protection',
  });

  return (
    <div ref={rootRef} className={PUBLIC_CLASSES.page}>
      <section className="public-section-shell pt-32 pb-[4.5rem] md:pb-24">
        <div className="mx-auto grid max-w-6xl px-4 sm:px-6 gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)] lg:items-center">
          <div className="relative overflow-hidden rounded-[32px] border border-[var(--public-line)] bg-[linear-gradient(135deg,rgba(255,255,255,0.95),rgba(255,246,240,0.88))] p-8 shadow-[0_30px_80px_rgba(37,25,20,0.08)] md:p-10" data-reveal>
            <div className="absolute -left-14 top-10 h-36 w-36 rounded-full bg-[rgba(239,97,68,0.14)] blur-3xl" aria-hidden />
            <span className="public-eyebrow">{copy.badge}</span>
            <h1 className={`mt-5 ${PUBLIC_CLASSES.displayH1}`}>
              {copy.title}{' '}
              <span className="text-[var(--public-accent)]">{copy.titleHighlight}</span>
            </h1>
            <p className={`mt-6 max-w-2xl ${PUBLIC_CLASSES.bodyLead}`}>{copy.subtitle}</p>
            <div className="mt-6 flex items-center gap-4">
              <Button asChild className="h-11 rounded-full bg-[linear-gradient(135deg,#ef6144,#d9553a)] px-8 text-white shadow-[0_20px_44px_rgba(223,88,59,0.28)] hover:bg-[linear-gradient(135deg,#e55a3d,#c94d35)]">
                <Link to={PUBLIC_SIGNUP_PATH}>
                  {copy.cta}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
            <p className="mt-4 rounded-full border border-[rgba(239,97,68,0.18)] bg-[rgba(255,240,232,0.82)] px-4 py-2 text-sm font-semibold text-[var(--public-accent-dark)]">{copy.note}</p>
          </div>

          <div className="public-device-frame self-start p-5 md:p-6" data-reveal>
            <div className="rounded-[28px] border border-white/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(255,247,242,0.92))] p-7 shadow-[0_18px_50px_rgba(52,35,29,0.1)]">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[rgba(196,77,53,0.1)]">
                <AlertTriangle className="h-6 w-6 text-[#c34e36]" />
              </div>
              <p className="mb-4 text-sm font-medium uppercase tracking-[0.12em] text-[var(--public-muted)]">{copy.scenarioLabel}</p>
              <Quote className="mb-2 h-6 w-6 text-[var(--public-accent)]/30" />
              <p className="font-medium leading-8 text-[var(--public-ink)]">{copy.scenarioQuote}</p>
              <div className="mt-6 flex items-center gap-3 border-t border-[var(--public-line)] pt-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[rgba(239,97,68,0.1)] text-sm font-bold text-[var(--public-accent)]">G</div>
                <div>
                  <p className="text-sm font-semibold text-[var(--public-ink)]">{copy.scenarioAuthor}</p>
                  <p className="text-xs text-[var(--public-muted)]">{copy.scenarioRole}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="public-section-shell py-[4.5rem] md:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-12 text-center" data-reveal>
            <h2 className={PUBLIC_CLASSES.sectionH2}>{copy.issuesTitle}</h2>
            <p className={`mx-auto mt-4 max-w-2xl ${PUBLIC_CLASSES.bodyBase}`}>{copy.issuesSubtitle}</p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {copy.issues.map((item) => (
              <div key={item.title} className="rounded-[24px] border border-[var(--public-line)] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(255,250,246,0.92))] p-6 shadow-[0_14px_34px_rgba(42,28,23,0.05)]" data-reveal>
                <p className="mb-4 text-sm font-medium italic text-[#c34e36]">{item.title}</p>
                <div className="flex gap-3">
                  <div className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-[rgba(239,97,68,0.12)]">
                    <item.icon className="h-4 w-4 text-[var(--public-accent)]" />
                  </div>
                  <p className="text-sm leading-relaxed text-[var(--public-muted)]">{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="public-section-shell py-[4.5rem] md:py-[5.5rem]">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="mb-12 text-center" data-reveal>
            <span className="public-eyebrow">{locale === 'en' ? 'Protection flow' : 'Flusso di tutela'}</span>
            <h2 className={`mt-5 ${PUBLIC_CLASSES.sectionH2}`}>{copy.flowTitle}</h2>
            <p className={`mx-auto mt-4 max-w-2xl ${PUBLIC_CLASSES.bodyBase}`}>{copy.flowSubtitle}</p>
          </div>
          <div className="space-y-5">
            {copy.flowSteps.map((step, index) => (
              <div key={step.title} className={`flex gap-6 p-6 ${PUBLIC_CLASSES.card}`} data-reveal>
                <span className={PUBLIC_CLASSES.cardStepNumber}>{String(index + 1).padStart(2, '0')}</span>
                <div>
                  <h3 className="text-lg font-bold text-[var(--public-ink)]">{step.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-[var(--public-muted)]">{step.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="public-section-shell py-[4.5rem] md:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 text-center" data-reveal>
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[rgba(239,97,68,0.12)]">
            <Stamp className="h-7 w-7 text-[var(--public-accent)]" />
          </div>
          <h2 className={PUBLIC_CLASSES.sectionH2}>{copy.roiTitle}</h2>
          <p className={`mx-auto mt-4 max-w-2xl ${PUBLIC_CLASSES.bodyBase}`}>{copy.roiText}</p>
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {copy.roiCards.map((item, index) => (
              <div key={item.value} className="public-grid-card p-5">
                <p className="text-2xl font-bold text-[var(--public-accent)]">{item.value}</p>
                <p className="mt-1 text-sm text-[var(--public-muted)]">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 md:py-32 bg-[#0b1220] relative overflow-hidden">
        <div data-parallax="slow" className="absolute top-0 left-1/3 w-96 h-96 bg-[#ef6144]/20 rounded-full blur-3xl pointer-events-none" />
        <div data-parallax="medium" className="absolute bottom-0 right-1/4 w-80 h-80 bg-[#ef6144]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10" data-reveal>
          <h2 className={`${PUBLIC_CLASSES.darkDisplayH2}`}>{copy.finalTitle}</h2>
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
