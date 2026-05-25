import React, { useMemo, useRef } from 'react';
import {
  Building2,
  CircleCheck,
  FolderOpen,
  TrendingUp,
  UserPlus,
  Users,
} from 'lucide-react';
import usePublicSeo from '@/public/hooks/usePublicSeo';
import usePublicGsap from '@/public/hooks/usePublicGsap';
import { PUBLIC_CLASSES } from '@/public/designSystem';
import MarketingCenteredHero from '@/public/components/marketing/MarketingCenteredHero';
import MarketingFinalCtaSection from '@/public/components/marketing/MarketingFinalCtaSection';
import MarketingStepTimeline from '@/public/components/marketing/MarketingStepTimeline';
import { getPublicPageSeoData } from '@/public/lib/localePath';
import { getPublicCopy } from '@/public/lib/publicTranslations';


export default function HowItWorksPage({ locale = 'it' }) {
  const rootRef = useRef(null);
  const copy = useMemo(() => getPublicCopy(locale, 'howItWorksPage'), [locale]);
  const { canonicalPath, alternatePathsByLocale } = getPublicPageSeoData(locale, '/come-funziona');

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
      <MarketingCenteredHero
        badge={copy.badge}
        title={copy.title}
        subtitle={copy.subtitle}
        ctaLabel={copy.ctaTop}
        ctaHref="/app"
      />

      <MarketingStepTimeline steps={copy.steps} />

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
