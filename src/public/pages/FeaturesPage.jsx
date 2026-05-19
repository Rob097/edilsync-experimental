import React, { useMemo, useRef } from 'react';
import {
  Bell,
  CalendarDays,
  Camera,
  ChartNoAxesColumn,
  Clock3,
  FileText,
  Globe,
  Layers,
  ListChecks,
  LockKeyhole,
  MessageCircle,
  Smartphone,
  Users,
  Wallet,
  Zap,
  ShieldCheck,
} from 'lucide-react';
import usePublicSeo from '@/public/hooks/usePublicSeo';
import usePublicGsap from '@/public/hooks/usePublicGsap';
import { PUBLIC_CLASSES } from '@/public/designSystem';
import MarketingCenteredHero from '@/public/components/marketing/MarketingCenteredHero';
import EntitlementHint from '@/public/components/marketing/EntitlementHint';
import { getPublicCopy } from '@/public/lib/publicTranslations';


export default function FeaturesPage({ locale = 'it' }) {
  const rootRef = useRef(null);
  const copy = useMemo(() => getPublicCopy(locale, 'featuresPage'), [locale]);
  const canonicalPath = locale === 'en' ? '/en/funzionalita' : '/funzionalita';

  usePublicGsap(rootRef);

  usePublicSeo({
    title: copy.seoTitle,
    description: copy.seoDescription,
    canonicalPath,
    locale,
    alternateItPath: '/funzionalita',
    alternateEnPath: '/en/funzionalita',
  });

  return (
    <div ref={rootRef} className={PUBLIC_CLASSES.page}>
      <MarketingCenteredHero badge={copy.badge} title={copy.title} subtitle={copy.subtitle} note={copy.note} />

      <section className="public-section-shell pt-[4.5rem] pb-24 md:pt-20 md:pb-32">
        <div className={`${PUBLIC_CLASSES.sectionContainer} space-y-20 md:space-y-24`}>
          {copy.sections.map((section) => {
            const SectionIcon = section.icon || Layers;

            return (
              <div key={section.title} className="grid gap-8 xl:grid-cols-[minmax(220px,0.32fr)_minmax(0,1fr)] xl:items-start">
                <div data-reveal className="xl:sticky xl:top-28">
                  <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-2xl ${section.colorClass}`}>
                    <SectionIcon className="h-5 w-5" />
                  </div>
                  <h2 className={PUBLIC_CLASSES.sectionTitle}>{section.title}</h2>
                  {section.note ? <p className="mt-3 max-w-sm text-sm leading-relaxed text-[var(--public-muted)]">{section.note}</p> : null}
                </div>

                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  {section.cards.map((card, index) => {
                    const CardIcon = card.icon || FileText;

                    return (
                      <article
                        key={card.title}
                        data-reveal
                        className={`relative p-6 ${PUBLIC_CLASSES.card} ${PUBLIC_CLASSES.cardHover} ${index === 0 ? 'md:col-span-2 xl:col-span-2' : ''}`}
                      >
                        <EntitlementHint label={card.badge} className="absolute right-4 top-4" />
                        <div className={`mb-5 flex h-11 w-11 items-center justify-center rounded-2xl ${section.colorClass}`}>
                          <CardIcon className="h-5 w-5" />
                        </div>
                        <h3 className={PUBLIC_CLASSES.sectionH3}>{card.title}</h3>
                        <p className="mt-3 text-sm leading-relaxed text-[var(--public-muted)]">{card.description}</p>
                      </article>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
