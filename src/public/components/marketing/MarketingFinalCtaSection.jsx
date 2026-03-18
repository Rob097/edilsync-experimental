import React from 'react';
import PublicPrimaryCta from '@/public/components/marketing/PublicPrimaryCta';
import { PUBLIC_CLASSES } from '@/public/designSystem';

export default function MarketingFinalCtaSection({ title, text, ctaLabel, ctaHref, note }) {
  return (
    <section className={PUBLIC_CLASSES.darkSection}>
      <div className="absolute top-0 left-1/3 w-96 h-96 bg-[#ef6144]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-[#ef6144]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
        <div data-reveal>
          <h2 className={PUBLIC_CLASSES.darkDisplayH2}>{title}</h2>
          <p className={`mt-6 ${PUBLIC_CLASSES.darkBodyLead}`}>{text}</p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <PublicPrimaryCta dark to={ctaHref} label={ctaLabel} />
          </div>
          <p className={`mt-4 ${PUBLIC_CLASSES.darkNote}`}>{note}</p>
        </div>
      </div>
    </section>
  );
}
