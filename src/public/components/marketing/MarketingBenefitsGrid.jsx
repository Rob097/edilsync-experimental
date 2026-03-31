import React from 'react';
import { PUBLIC_CLASSES } from '@/public/designSystem';
import EntitlementHint from '@/public/components/marketing/EntitlementHint';

export default function MarketingBenefitsGrid({ title, items, sectionClassName = 'py-20 bg-[#eef2f6] px-6' }) {
  return (
    <section className={sectionClassName}>
      <div className="max-w-7xl mx-auto">
        <h2 className={`${PUBLIC_CLASSES.sectionH2} text-center mb-12`}>{title}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.title} data-reveal className={`relative p-6 ${PUBLIC_CLASSES.card} hover:border-[#ef6144]/20 hover:shadow-lg transition-all`}>
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
