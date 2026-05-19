import React, { useMemo, useRef } from 'react';
import {
  CalendarDays,
  FileText,
  Globe,
  Layers,
  MessageCircle,
  Users,
} from 'lucide-react';
import usePublicSeo from '@/public/hooks/usePublicSeo';
import usePublicGsap from '@/public/hooks/usePublicGsap';
import { PUBLIC_CLASSES } from '@/public/designSystem';
import PublicPrimaryCta from '@/public/components/marketing/PublicPrimaryCta';
import MarketingFinalCtaSection from '@/public/components/marketing/MarketingFinalCtaSection';
import EntitlementHint from '@/public/components/marketing/EntitlementHint';
import { getPublicCopy } from '@/public/lib/publicTranslations';


export default function ProfessionalsPage({ locale = 'it' }) {
  const rootRef = useRef(null);
  const copy = useMemo(() => getPublicCopy(locale, 'professionalsPage'), [locale]);
  const basePath = locale === 'en' ? '/en' : '';
  const canonicalPath = locale === 'en' ? '/en/per-tecnici' : '/per-tecnici';

  usePublicGsap(rootRef);

  usePublicSeo({
    title: copy.seoTitle,
    description: copy.seoDescription,
    canonicalPath,
    locale,
    alternateItPath: '/per-tecnici',
    alternateEnPath: '/en/per-tecnici',
  });

  return (
    <div ref={rootRef} className={PUBLIC_CLASSES.page}>
      <section className="public-section-shell pt-32 pb-[4.5rem] md:pb-[5.5rem]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 text-center">
          <span data-reveal className="public-eyebrow">
            {copy.badge}
          </span>
          <h1 data-reveal className={`mt-5 ${PUBLIC_CLASSES.displayH1}`}>
            {copy.title}
          </h1>
          <p data-reveal className={`mx-auto mt-5 max-w-3xl ${PUBLIC_CLASSES.bodyLead}`}>
            {copy.subtitle}
          </p>
          <p data-reveal className="mx-auto mt-4 max-w-2xl rounded-full border border-[rgba(239,97,68,0.18)] bg-[rgba(255,240,232,0.82)] px-4 py-2 text-sm font-semibold text-[var(--public-accent-dark)]">
            {copy.note}
          </p>
          <PublicPrimaryCta className="mt-8" to="/app" label={copy.ctaTop} />
        </div>
      </section>

      <section className="public-section-shell py-[4.5rem] md:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-2xl" data-reveal>
            <span className="public-eyebrow">{locale === 'en' ? 'Professional contexts' : 'Contesti professionali'}</span>
            <h2 className={`mt-5 ${PUBLIC_CLASSES.sectionH2}`}>{copy.rolesTitle}</h2>
          </div>
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-12">
            {copy.roles.map((role, index) => (
              <article
                key={role.title}
                data-reveal
                className={`${PUBLIC_CLASSES.card} p-6 ${index === 0 ? 'xl:col-span-6' : index === 1 ? 'xl:col-span-3' : index === 2 ? 'xl:col-span-3' : index === 3 ? 'xl:col-span-4' : 'xl:col-span-4'}`}
              >
                <h3 className={`${PUBLIC_CLASSES.sectionH3} mb-2`}>{role.title}</h3>
                <p className={PUBLIC_CLASSES.bodySm}>{role.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="public-section-shell py-[4.5rem] md:py-[5.5rem]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="max-w-2xl" data-reveal>
            <span className="public-eyebrow">{locale === 'en' ? 'Technical workflow' : 'Flusso tecnico'}</span>
            <h2 className={`mt-5 ${PUBLIC_CLASSES.sectionH2}`}>{copy.featuresTitle}</h2>
          </div>
          <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-12">
            {copy.features.map((item, index) => {
              const Icon = item.icon;

              return (
                <article
                  key={item.title}
                  data-reveal
                  className={`relative p-6 ${PUBLIC_CLASSES.card} ${PUBLIC_CLASSES.cardHover} ${index === 0 ? 'xl:col-span-5' : index === 1 ? 'xl:col-span-4' : index === 2 ? 'xl:col-span-3' : index === 3 ? 'xl:col-span-4' : index === 4 ? 'xl:col-span-3' : 'xl:col-span-5'}`}
                >
                  <EntitlementHint label={item.badge} className="absolute right-4 top-4" />
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
