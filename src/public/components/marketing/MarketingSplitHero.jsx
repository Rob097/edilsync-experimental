import React from 'react';
import { Quote } from 'lucide-react';
import { PUBLIC_CLASSES } from '@/public/designSystem';
import PublicPrimaryCta from '@/public/components/marketing/PublicPrimaryCta';

export default function MarketingSplitHero({
  badge,
  title,
  titleHighlight,
  subtitle,
  note,
  ctaLabel,
  ctaHref,
  quote,
  quoteAuthor,
  quoteRole,
  quoteInitial = 'M',
}) {
  return (
    <section className="pt-32 pb-20 px-6 bg-[#fcfcfc]">
      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div data-reveal>
          <span className={`${PUBLIC_CLASSES.badge} mb-4`}>{badge}</span>
          <h1 className={`${PUBLIC_CLASSES.displayH1} text-[#141821]`}>
            {title}{' '}
            {titleHighlight ? <span className="text-[#ef6144]">{titleHighlight}</span> : null}
          </h1>
          <p className={`mt-5 ${PUBLIC_CLASSES.bodyLead}`}>{subtitle}</p>
          {note ? <p className="mt-3 text-sm text-[#ef6144] font-semibold">{note}</p> : null}
          <PublicPrimaryCta className="mt-6" to={ctaHref} label={ctaLabel} />
        </div>

        <div data-reveal>
          <div className={`${PUBLIC_CLASSES.card} p-8`}>
            <Quote className="w-8 h-8 text-[#ef6144]/30 mb-4" />
            <p className="text-[#141821] font-medium leading-relaxed">"{quote}"</p>
            <div className="mt-6 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#ef6144]/10 flex items-center justify-center font-bold text-[#ef6144]">{quoteInitial}</div>
              <div>
                <p className="font-semibold text-sm text-[#141821]">{quoteAuthor}</p>
                <p className={PUBLIC_CLASSES.bodyXsMuted}>{quoteRole}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
