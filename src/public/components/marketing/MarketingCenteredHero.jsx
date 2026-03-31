import React from 'react';
import { PUBLIC_CLASSES } from '@/public/designSystem';
import PublicPrimaryCta from '@/public/components/marketing/PublicPrimaryCta';

export default function MarketingCenteredHero({
  badge,
  title,
  subtitle,
  note,
  ctaLabel,
  ctaHref,
}) {
  return (
    <section className={PUBLIC_CLASSES.centeredHeroSection}>
      <div className={PUBLIC_CLASSES.centeredHeroContainer}>
        <span data-reveal className={`${PUBLIC_CLASSES.badge} mb-4`}>
          {badge}
        </span>
        <h1 data-reveal className={`${PUBLIC_CLASSES.displayH1} text-[#141821]`}>
          {title}
        </h1>
        <p data-reveal className={`mt-4 ${PUBLIC_CLASSES.bodyLead}`}>
          {subtitle}
        </p>
        {note ? <p data-reveal className="mt-3 text-sm text-[#ef6144] font-semibold">{note}</p> : null}
        {ctaLabel && ctaHref ? (
          <PublicPrimaryCta className="mt-8" to={ctaHref} label={ctaLabel} />
        ) : null}
      </div>
    </section>
  );
}
