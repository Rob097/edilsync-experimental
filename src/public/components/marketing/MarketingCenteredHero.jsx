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
    <section className="public-section-shell relative overflow-hidden px-6 pb-16 pt-28 md:pb-20 md:pt-36">
      <div className="pointer-events-none absolute left-[10%] top-16 h-56 w-56 rounded-full bg-[rgba(239,97,68,0.1)] blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute right-[12%] top-24 h-48 w-48 rounded-full bg-[rgba(196,158,108,0.1)] blur-3xl" aria-hidden />
      <div className={PUBLIC_CLASSES.centeredHeroContainer}>
        <span data-reveal className="public-eyebrow">
          {badge}
        </span>
        <h1 data-reveal className={`${PUBLIC_CLASSES.displayH1} mt-6 text-[var(--public-ink)]`}>
          {title}
        </h1>
        <p data-reveal className={`mt-5 ${PUBLIC_CLASSES.bodyLead}`}>
          {subtitle}
        </p>
        {note ? <p data-reveal className="mt-4 text-sm font-semibold leading-[1.7] text-[var(--public-accent-dark)]">{note}</p> : null}
        {ctaLabel && ctaHref ? (
          <PublicPrimaryCta className="mt-8" to={ctaHref} label={ctaLabel} />
        ) : null}
      </div>
    </section>
  );
}
