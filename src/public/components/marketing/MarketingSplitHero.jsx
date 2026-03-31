import React from 'react';
import { Quote } from 'lucide-react';
import { PUBLIC_CLASSES } from '@/public/designSystem';
import PublicPrimaryCta from '@/public/components/marketing/PublicPrimaryCta';

export default function MarketingSplitHero({
  badge,
  title,
  titleHighlight,
  titleAfter,
  subtitle,
  note,
  ctaLabel,
  ctaHref,
  quote,
  quoteAuthor,
  quoteRole,
  quoteInitial = 'M',
  noteLabel = 'Nota dal campo',
}) {
  return (
    <section className="public-section-shell pt-32 pb-[4.5rem] md:pb-24">
      <div className="mx-auto grid max-w-6xl px-4 sm:px-6 gap-10 lg:grid-cols-[minmax(0,1.08fr)_minmax(320px,0.92fr)] lg:items-center">
        <div className="relative overflow-hidden rounded-[32px] border border-[var(--public-line)] bg-[linear-gradient(135deg,rgba(255,255,255,0.94),rgba(255,246,240,0.86))] p-8 shadow-[0_30px_80px_rgba(37,25,20,0.08)] md:p-10" data-reveal>
          <div className="absolute -left-16 top-10 h-40 w-40 rounded-full bg-[rgba(239,97,68,0.14)] blur-3xl" aria-hidden />
          <div className="absolute -bottom-20 -right-16 h-56 w-56 rounded-full bg-[rgba(239,97,68,0.12)] blur-3xl" aria-hidden />
          <div className="relative">
            <span className="public-eyebrow">{badge}</span>
            <h1 className={`mt-5 ${PUBLIC_CLASSES.displayH1}`}>
              {title}{' '}
              {titleHighlight ? <span className="text-[var(--public-accent)]">{titleHighlight}</span> : null}
              {titleAfter ? <> {titleAfter}</> : null}
            </h1>
            <p className={`mt-6 max-w-2xl ${PUBLIC_CLASSES.bodyLead}`}>{subtitle}</p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <PublicPrimaryCta to={ctaHref} label={ctaLabel} />
              {note ? (
                <p className="max-w-sm rounded-full border border-[rgba(239,97,68,0.18)] bg-[rgba(255,240,232,0.82)] px-4 py-2 text-sm font-semibold text-[var(--public-accent-dark)]">
                  {note}
                </p>
              ) : null}
            </div>
          </div>
        </div>

        <div className="public-device-frame self-start p-5 md:p-6" data-reveal>
          <div className="rounded-[28px] border border-white/60 bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(255,247,242,0.92))] p-7 shadow-[0_18px_50px_rgba(52,35,29,0.1)]">
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--public-accent-dark)]">
              <span>{noteLabel}</span>
              <span>EdilSync</span>
            </div>
            <Quote className="mt-8 h-8 w-8 text-[var(--public-accent)]/30" />
            <p className="mt-4 text-[1.04rem] font-medium leading-8 text-[var(--public-ink)]">"{quote}"</p>
            <div className="mt-8 flex items-center gap-4 border-t border-[var(--public-line)] pt-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[rgba(239,97,68,0.12)] text-base font-bold text-[var(--public-accent)]">
                {quoteInitial}
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--public-ink)]">{quoteAuthor}</p>
                <p className={PUBLIC_CLASSES.bodyXsMuted}>{quoteRole}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
