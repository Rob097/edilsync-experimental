import React, { useMemo, useRef } from 'react';
import { BellRing, CheckCheck, Clock3, FileText, MessagesSquare, ShieldCheck } from 'lucide-react';
import usePublicSeo from '@/public/hooks/usePublicSeo';
import usePublicGsap from '@/public/hooks/usePublicGsap';
import { PUBLIC_CLASSES } from '@/public/designSystem';
import MarketingSplitHero from '@/public/components/marketing/MarketingSplitHero';
import MarketingBenefitsGrid from '@/public/components/marketing/MarketingBenefitsGrid';
import MarketingValueListSection from '@/public/components/marketing/MarketingValueListSection';
import MarketingFinalCtaSection from '@/public/components/marketing/MarketingFinalCtaSection';
import { getPublicLocaleVariant, getPublicPageSeoData, localizePublicPath } from '@/public/lib/localePath';
import { getPublicCopy } from '@/public/lib/publicTranslations';


export default function HomeownersPage({ locale = 'it' }) {
  const rootRef = useRef(null);
  const copy = useMemo(() => getPublicCopy(locale, 'homeownersPage'), [locale]);
  const { canonicalPath, alternatePathsByLocale } = getPublicPageSeoData(locale, '/per-committenti');
  const contactPath = localizePublicPath('/contatti', locale);
  const fieldNoteLabel = getPublicLocaleVariant(locale, { it: 'Nota dal campo', en: 'Field note' });
  const operationalValueLabel = getPublicLocaleVariant(locale, { it: 'Valore operativo', en: 'Operational value' });
  const operationalValueText = getPublicLocaleVariant(locale, {
    it: 'Questi punti mostrano cosa cambia davvero per il committente: meno zone d’ombra, meno incomprensioni e più serenità lungo tutto il cantiere.',
    en: 'These points show what EdilSync changes in practice for homeowners: fewer blind spots, fewer misunderstandings, and more confidence through the full worksite.',
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
        ctaHref={contactPath}
        quote={copy.quote}
        quoteAuthor={copy.quoteAuthor}
        quoteRole={copy.quoteRole}
        quoteInitial="L"
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
        ctaHref={contactPath}
        note={copy.finalNote}
      />
    </div>
  );
}
