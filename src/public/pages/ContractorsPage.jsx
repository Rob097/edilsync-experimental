import React, { useMemo, useRef } from 'react';
import { Camera, FileText, Shield, Smartphone, Users, Wallet } from 'lucide-react';
import usePublicSeo from '@/public/hooks/usePublicSeo';
import usePublicGsap from '@/public/hooks/usePublicGsap';
import { PUBLIC_CLASSES } from '@/public/designSystem';
import MarketingSplitHero from '@/public/components/marketing/MarketingSplitHero';
import MarketingBenefitsGrid from '@/public/components/marketing/MarketingBenefitsGrid';
import MarketingValueListSection from '@/public/components/marketing/MarketingValueListSection';
import MarketingFinalCtaSection from '@/public/components/marketing/MarketingFinalCtaSection';
import { getPublicLocaleVariant, getPublicPageSeoData } from '@/public/lib/localePath';
import { getPublicCopy } from '@/public/lib/publicTranslations';


export default function ContractorsPage({ locale = 'it' }) {
  const rootRef = useRef(null);
  const copy = useMemo(() => getPublicCopy(locale, 'contractorsPage'), [locale]);
  const { canonicalPath, alternatePathsByLocale } = getPublicPageSeoData(locale, '/contractors');
  const fieldNoteLabel = getPublicLocaleVariant(locale, { it: 'Nota dal campo', en: 'Field note' });
  const operationalValueLabel = getPublicLocaleVariant(locale, { it: 'Valore operativo', en: 'Operational value' });
  const operationalValueText = getPublicLocaleVariant(locale, {
    it: 'Ogni punto qui sotto traduce EdilSync in ritorno operativo concreto: meno dispersione, meno errori di coordinamento e più controllo sul cantiere.',
    en: 'Each point below translates EdilSync into measurable operational return: less waste, fewer coordination mistakes, and stronger worksite control.',
  });

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
        noteLabel={fieldNoteLabel}
      />

      <MarketingBenefitsGrid title={copy.advantagesTitle} items={copy.advantages} />

      <MarketingValueListSection
        title={copy.valueTitle}
        items={copy.valueItems}
        costLabel={copy.valueCostLabel}
        costValue={copy.valueCost}
        eyebrowLabel={operationalValueLabel}
        introText={operationalValueText}
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
