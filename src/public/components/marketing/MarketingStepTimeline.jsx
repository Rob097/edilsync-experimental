import React from 'react';
import { PUBLIC_CLASSES } from '@/public/designSystem';

export default function MarketingStepTimeline({ steps }) {
  return (
    <section className="pb-24 px-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {steps.map((step) => {
          const Icon = step.icon;

          return (
            <article
              key={step.number}
              data-reveal
              className={`flex gap-6 p-6 md:p-8 ${PUBLIC_CLASSES.card} ${PUBLIC_CLASSES.cardHover}`}
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
