import React from 'react';
import PublicPrimaryCta from '@/public/components/marketing/PublicPrimaryCta';
import { PUBLIC_CLASSES } from '@/public/designSystem';

export default function MarketingFinalCtaSection({ title, text, ctaLabel, ctaHref, note }) {
  return (
    <section className={PUBLIC_CLASSES.darkSection}>
      <div className="absolute top-0 left-[18%] h-80 w-80 rounded-full bg-[rgba(239,97,68,0.18)] blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-[14%] h-72 w-72 rounded-full bg-[rgba(196,158,108,0.14)] blur-3xl pointer-events-none" />
      <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
        <div data-reveal>
          <h2 className={`${PUBLIC_CLASSES.darkDisplayH2} max-w-[13ch] mx-auto`}>{title}</h2>
          <p className={`mt-6 ${PUBLIC_CLASSES.darkBodyLead}`}>{text}</p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <PublicPrimaryCta dark to={ctaHref} label={ctaLabel} />
          </div>
          <p className={`mt-5 ${PUBLIC_CLASSES.darkNote}`}>{note}</p>
        </div>
      </div>
    </section>
  );
}
