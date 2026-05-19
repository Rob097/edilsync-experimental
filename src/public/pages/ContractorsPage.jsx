import React, { useMemo, useRef } from 'react';
import { Camera, FileText, Shield, Smartphone, Users, Wallet } from 'lucide-react';
import usePublicSeo from '@/public/hooks/usePublicSeo';
import usePublicGsap from '@/public/hooks/usePublicGsap';
import { PUBLIC_CLASSES } from '@/public/designSystem';
import MarketingSplitHero from '@/public/components/marketing/MarketingSplitHero';
import MarketingBenefitsGrid from '@/public/components/marketing/MarketingBenefitsGrid';
import MarketingValueListSection from '@/public/components/marketing/MarketingValueListSection';
import MarketingFinalCtaSection from '@/public/components/marketing/MarketingFinalCtaSection';
import { getPublicCopy } from '@/public/lib/publicTranslations';


export default function ContractorsPage({ locale = 'it' }) {
  const rootRef = useRef(null);
  const copy = useMemo(() => getPublicCopy(locale, 'contractorsPage'), [locale]);
  const canonicalPath = locale === 'en' ? '/en/contractors' : '/contractors';

  usePublicGsap(rootRef);

  usePublicSeo({
    title: copy.seoTitle,
    description: copy.seoDescription,
    canonicalPath,
    locale,
    alternateItPath: '/contractors',
    alternateEnPath: '/en/contractors',
  });

  return (
    <div ref={rootRef} className={PUBLIC_CLASSES.page}>
      <MarketingSplitHero
        badge={copy.badge}
        title={copy.titleA}
        titleHighlight={copy.titleB}
        subtitle={copy.subtitle}
        note={copy.note}
        ctaLabel={copy.ctaTop}
        ctaHref="/app"
        quote={copy.quote}
        quoteAuthor={copy.quoteAuthor}
        quoteRole={copy.quoteRole}
        quoteInitial="M"
        noteLabel={locale === 'en' ? 'Field note' : 'Nota dal campo'}
      />

      <MarketingBenefitsGrid title={copy.advantagesTitle} items={copy.advantages} />

      <MarketingValueListSection
        title={copy.valueTitle}
        items={copy.valueItems}
        costLabel={copy.valueCostLabel}
        costValue={copy.valueCost}
        eyebrowLabel={locale === 'en' ? 'Operational value' : 'Valore operativo'}
        introText={locale === 'en' ? 'Each point below translates EdilSync into measurable operational return: less waste, fewer coordination mistakes, and stronger worksite control.' : 'Ogni punto qui sotto traduce EdilSync in ritorno operativo concreto: meno dispersione, meno errori di coordinamento e più controllo sul cantiere.'}
      />

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
