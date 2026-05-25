import React, { useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CircleCheck, CircleHelp, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PUBLIC_SIGNUP_PATH } from '@/lib/authRouting';
import usePublicSeo from '@/public/hooks/usePublicSeo';
import usePublicGsap from '@/public/hooks/usePublicGsap';
import { PUBLIC_CLASSES } from '@/public/designSystem';
import MarketingFinalCtaSection from '@/public/components/marketing/MarketingFinalCtaSection';
import { getPublicLocaleVariant, getPublicPageSeoData, localizePublicPath } from '@/public/lib/localePath';
import { getPublicCopy } from '@/public/lib/publicTranslations';


export default function PricingPage({ locale = 'it' }) {
  const rootRef = useRef(null);
  const copy = useMemo(() => getPublicCopy(locale, 'pricingPage'), [locale]);
  const { canonicalPath, alternatePathsByLocale } = getPublicPageSeoData(locale, '/prezzi');
  const faqPath = localizePublicPath('/faq', locale);
  const contactPath = localizePublicPath('/contatti', locale);
  const pricingStructureLabel = getPublicLocaleVariant(locale, { it: 'Struttura del prezzo', en: 'Pricing structure' });
  const pricingStructureTitle = getPublicLocaleVariant(locale, { it: 'Semplice da spiegare gia dal primo giorno.', en: 'Simple to explain on day one.' });
  const pricingStructureText = getPublicLocaleVariant(locale, {
    it: 'EdilSync non fa pagare ogni persona del cantiere. La società passa a Pro quando le servono strumenti avanzati per l’impresa e la sponsorship del cantiere.',
    en: 'EdilSync does not charge every person on the worksite. The company upgrades when it needs premium company tools and worksite sponsorship.',
  });
  const companyPlanLabel = getPublicLocaleVariant(locale, { it: 'Piano società', en: 'Company plan' });
  const advancedAreasText = getPublicLocaleVariant(locale, {
    it: 'Le altre aree avanzate di cantiere si attivano non appena una società Pro sponsorizza il cantiere.',
    en: 'The rest of the advanced worksite capabilities unlock as soon as a Pro company sponsors the worksite.',
  });
  const upgradeLogicLabel = getPublicLocaleVariant(locale, { it: 'Quando passare a Pro', en: 'Upgrade logic' });
  const pricingFaqLabel = getPublicLocaleVariant(locale, { it: 'Domande sui prezzi', en: 'Pricing FAQ' });

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
      <section className="public-section-shell pt-32 pb-14 md:pb-[4.5rem]">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 text-center">
          <span className="public-eyebrow" data-reveal>
            {copy.badge}
          </span>
          <h1 className={`mt-5 ${PUBLIC_CLASSES.displayH1}`} data-reveal>
            {copy.title}
          </h1>
          <p className={`mx-auto mt-5 max-w-2xl ${PUBLIC_CLASSES.bodyLead}`} data-reveal>
            {copy.subtitle}
          </p>
        </div>
      </section>

      <section className="public-section-shell pt-[4.5rem] pb-[4.5rem] md:pt-20 md:pb-20">
        <div className="mx-auto grid max-w-6xl px-4 sm:px-6 gap-8 xl:grid-cols-[minmax(0,0.92fr)_minmax(390px,0.78fr)] xl:items-start">
          <div className="space-y-4 xl:self-start" data-reveal>
            <article className="public-grid-card p-7 md:p-8">
              <div className="grid gap-5 md:grid-cols-[0.9fr_1.1fr] md:items-start">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--public-accent-dark)]">
                    {pricingStructureLabel}
                  </p>
                  <h2 className="mt-4 text-[clamp(1.55rem,2.4vw,2.3rem)] font-bold leading-[1.02] tracking-[-0.045em] text-[var(--public-ink)]">
                    {pricingStructureTitle}
                  </h2>
                  <p className="mt-4 text-sm leading-relaxed text-[var(--public-muted)]">
                    {pricingStructureText}
                  </p>
                </div>
                <div className="space-y-3">
                  {copy.legendItems.map((item) => (
                    <article key={item.title} className="rounded-[22px] border border-[var(--public-line)] bg-[rgba(255,248,244,0.75)] p-4">
                      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--public-accent-dark)]">{item.badge}</p>
                      <h3 className="mt-3 text-base font-semibold tracking-[-0.03em] text-[var(--public-ink)]">{item.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-[var(--public-muted)]">{item.text}</p>
                    </article>
                  ))}
                </div>
              </div>
            </article>
          </div>

          <div className="relative self-start overflow-hidden rounded-[32px] border border-[rgba(239,97,68,0.26)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(255,246,240,0.96))] shadow-[0_26px_70px_rgba(53,36,30,0.12)]" data-reveal>
            <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,rgba(239,97,68,0.35),rgba(239,97,68,1),rgba(239,97,68,0.35))]" />
            <div className="p-8 md:p-10">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--public-accent-dark)]">{companyPlanLabel}</p>
                  <h2 className="mt-3 text-3xl font-bold tracking-[-0.05em] text-[var(--public-ink)]">{copy.planName}</h2>
                  <p className="mt-2 text-sm text-[var(--public-muted)]">{copy.planDesc}</p>
                </div>
                <span className="rounded-full border border-[rgba(239,97,68,0.16)] bg-[rgba(255,240,232,0.88)] px-3 py-1 text-xs font-semibold text-[var(--public-accent-dark)]">
                  {copy.trialBadge}
                </span>
              </div>

              <div className="mt-8 flex items-end gap-2">
                <span className="text-6xl font-bold leading-none tracking-[-0.06em] text-[var(--public-ink)]">{copy.price}</span>
                <span className="mb-2 text-[var(--public-muted)]">{copy.priceSuffix}</span>
              </div>
              <p className="mt-2 text-xs text-[var(--public-muted)]">{copy.priceNote}</p>

              <Button asChild className="mt-8 h-12 w-full gap-2 rounded-full bg-[linear-gradient(135deg,#ef6144,#d9553a)] px-8 text-base font-semibold text-white shadow-[0_20px_44px_rgba(223,88,59,0.28)] hover:bg-[linear-gradient(135deg,#e55a3d,#c94d35)]">
                <Link to={PUBLIC_SIGNUP_PATH}>
                  {copy.cta}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>

              <p className="mt-3 text-center text-xs text-[var(--public-muted)]">{copy.noCard}</p>

              <div className="mt-8 border-t border-[var(--public-line)] pt-8">
                <p className="mb-4 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--public-muted)]">{copy.includedLabel}</p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {copy.includedItems.slice(0, 6).map((item) => (
                    <div key={item} className="flex items-start gap-2">
                      <CircleCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-[var(--public-accent)]" />
                      <span className="text-sm text-[var(--public-muted)]">{item}</span>
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-xs leading-relaxed text-[var(--public-muted)]">{advancedAreasText}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="public-section-shell py-[4.5rem] md:py-20">
        <div className="mx-auto grid max-w-6xl px-4 sm:px-6 gap-8 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] xl:items-start" data-reveal>
          <div>
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[rgba(239,97,68,0.12)]">
              <Users className="h-6 w-6 text-[var(--public-accent)]" />
            </div>
            <h2 className={PUBLIC_CLASSES.sectionH2}>{copy.freeAccessTitle}</h2>
            <p className={`mt-4 max-w-xl ${PUBLIC_CLASSES.bodyBase}`}>{copy.freeAccessText}</p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {copy.roles.map((role, index) => (
              <div key={role.label} className="public-grid-card p-6">
                <p className="font-semibold text-[var(--public-ink)]">{role.label}</p>
                <p className="mt-2 text-xl font-bold text-[var(--public-accent)]">{role.value}</p>
                <p className="mt-2 text-xs leading-relaxed text-[var(--public-muted)]">{role.note}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="public-section-shell py-[4.5rem] md:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6" data-reveal>
          <div className="max-w-2xl">
            <span className="public-eyebrow">{upgradeLogicLabel}</span>
            <h2 className={`mt-5 ${PUBLIC_CLASSES.sectionH2}`}>{copy.worthTitle}</h2>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-12">
            {copy.worthItems.map((item, index) => (
              <div key={item} className={`public-grid-card p-5 ${index === 0 ? 'md:col-span-2 xl:col-span-7' : index === 1 ? 'xl:col-span-5' : index === 2 ? 'xl:col-span-5' : 'xl:col-span-7'}`}>
                <div className="flex items-start gap-3">
                  <CircleCheck className="mt-0.5 h-5 w-5 flex-shrink-0 text-[var(--public-accent)]" />
                  <p className="text-sm leading-relaxed text-[var(--public-muted)]">{item}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="public-section-shell py-[4.5rem] md:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <div className="mb-10 text-center" data-reveal>
            <span className="public-eyebrow">{pricingFaqLabel}</span>
            <h2 className={`mt-5 ${PUBLIC_CLASSES.sectionH2}`}>{copy.faqTitle}</h2>
          </div>

          <div className="overflow-hidden rounded-[28px] border border-[var(--public-line)] bg-[rgba(255,255,255,0.9)] divide-y divide-[var(--public-line)] shadow-[0_14px_42px_rgba(42,28,23,0.05)]">
            {copy.faqs.map((faq) => (
              <div key={faq.q} className="px-6 py-5 md:px-7" data-reveal>
                <div className="flex items-start gap-3">
                  <CircleHelp className="mt-0.5 h-4 w-4 flex-shrink-0 text-[var(--public-accent)]" />
                  <div>
                    <p className="text-sm font-semibold text-[var(--public-ink)]">{faq.q}</p>
                    <p className="mt-2 text-sm leading-relaxed text-[var(--public-muted)]">{faq.a}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <p className="mt-6 text-center text-sm text-[var(--public-muted)]" data-reveal>
            {copy.faqFooterStart}{' '}
            <Link className="text-[var(--public-accent)] hover:underline" to={faqPath}>
              {copy.faqFooterFaq}
            </Link>{' '}
            {copy.faqFooterAnd}{' '}
            <Link className="text-[var(--public-accent)] hover:underline" to={contactPath}>
              {copy.faqFooterContact}
            </Link>
            .
          </p>
        </div>
      </section>

      <MarketingFinalCtaSection
        title={copy.finalTitle}
        text={copy.finalText}
        ctaLabel={copy.finalCta}
        ctaHref={contactPath}
        note={copy.finalNote}
      />
    </div>
  );
}
