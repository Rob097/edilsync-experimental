import React from 'react';
import { CircleCheck } from 'lucide-react';
import { PUBLIC_CLASSES } from '@/public/designSystem';

export default function MarketingValueListSection({ title, items, costLabel, costValue, eyebrowLabel = 'Valore operativo', introText = 'Ogni punto qui sotto traduce EdilSync in ritorno operativo: meno dispersione, meno errori di coordinamento, piu visibilita concreta.' }) {
  return (
    <section className="public-section-shell public-section-shell--value pt-[4.5rem] pb-24 md:pt-[5.5rem] md:pb-28">
      <div className="mx-auto grid max-w-6xl px-4 sm:px-6 gap-8 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] xl:items-start">
        <div className="space-y-5" data-reveal>
          <span className="public-eyebrow">{eyebrowLabel}</span>
          <h2 className={PUBLIC_CLASSES.sectionH2}>{title}</h2>
          <p className={PUBLIC_CLASSES.bodyBase}>{introText}</p>
          <div className="public-grid-card max-w-sm p-6">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--public-accent-dark)]">{costLabel}</p>
            <p className="mt-3 text-2xl font-bold tracking-[-0.04em] text-[var(--public-ink)]">{costValue}</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2" data-reveal>
          {items.map((text, index) => (
            <article
              key={text}
              className={`public-grid-card p-5 ${index === 0 ? 'md:col-span-2' : ''}`}
            >
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-2xl bg-[rgba(239,97,68,0.12)]">
                  <CircleCheck className="h-4 w-4 text-[var(--public-accent)]" />
                </div>
                <p className={PUBLIC_CLASSES.bodySm}>{text}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
