import React from 'react';
import { PUBLIC_CLASSES } from '@/public/designSystem';

export default function MarketingStepTimeline({ steps }) {
  return (
    <section className="px-6 pb-24 md:pb-32">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-4">
        {steps.map((step, index) => {
          const Icon = step.icon;

          return (
            <article
              key={step.number}
              data-reveal
              className={`grid gap-5 p-6 md:grid-cols-[92px_1fr] md:p-8 ${PUBLIC_CLASSES.card} ${PUBLIC_CLASSES.cardHover} ${index % 2 === 1 ? 'md:translate-x-8' : ''}`}
            >
              <div className="flex-shrink-0">
                <span className={PUBLIC_CLASSES.cardStepNumber}>{step.number}</span>
              </div>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className={PUBLIC_CLASSES.cardStepIconWrap}>
                    <Icon className={PUBLIC_CLASSES.cardStepIcon} />
                  </div>
                  <h3 className="font-bold text-xl text-[#141821]">{step.title}</h3>
                </div>
                <p className={PUBLIC_CLASSES.bodyBase}>{step.text}</p>
                <p className={PUBLIC_CLASSES.cardStepNote}>{step.note}</p>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
