import React from 'react';
import { PUBLIC_CLASSES } from '@/public/designSystem';
import EntitlementHint from '@/public/components/marketing/EntitlementHint';

export default function MarketingBenefitsGrid({ title, items, sectionClassName = 'bg-[rgba(243,236,229,0.76)] px-6 py-24 md:py-32' }) {
  return (
    <section className={sectionClassName}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <h2 className={`${PUBLIC_CLASSES.sectionH2} max-w-[14ch]`}>{title}</h2>
        <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-12">
          {items.map((item, index) => {
            const Icon = item.icon;
            const spanClass = index % 3 === 0 ? 'xl:col-span-5' : index % 3 === 1 ? 'xl:col-span-3' : 'xl:col-span-4';
            return (
              <article key={item.title} data-reveal className={`relative p-6 ${PUBLIC_CLASSES.card} ${PUBLIC_CLASSES.cardHover} ${spanClass}`}>
                <EntitlementHint label={item.badge} className="absolute right-4 top-4" />
                <div className={`${PUBLIC_CLASSES.iconWrap} mb-4`}>
                  <Icon className={PUBLIC_CLASSES.icon} />
                </div>
                <h3 className={PUBLIC_CLASSES.sectionH3}>{item.title}</h3>
                <p className={`mt-2 ${PUBLIC_CLASSES.bodySm}`}>{item.text}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
