import React from 'react';
import { PUBLIC_CLASSES } from '@/public/designSystem';

export default function MarketingBenefitsGrid({ title, items, sectionClassName = 'py-20 bg-[#eef2f6] px-6' }) {
  return (
    <section className={sectionClassName}>
      <div className="max-w-7xl mx-auto">
        <h2 className={`${PUBLIC_CLASSES.sectionH2} text-center mb-12`}>{title}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.title} data-reveal className={`p-6 ${PUBLIC_CLASSES.card} hover:border-[#ef6144]/20 hover:shadow-lg transition-all`}>
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
