import React from 'react';
import { CircleCheck } from 'lucide-react';
import { PUBLIC_CLASSES } from '@/public/designSystem';

export default function MarketingValueListSection({ title, items, costLabel, costValue }) {
  return (
    <section className="py-20 px-6 bg-[#fcfcfc]">
      <div className="max-w-3xl mx-auto">
        <h2 className={`${PUBLIC_CLASSES.sectionH2} text-center mb-10`}>{title}</h2>
        <div className="space-y-4">
          {items.map((text) => (
            <div key={text} className={`flex items-start gap-3 p-4 rounded-xl ${PUBLIC_CLASSES.card}`}>
              <CircleCheck className="w-5 h-5 text-[#ef6144] mt-0.5 flex-shrink-0" />
              <p className={PUBLIC_CLASSES.bodySm}>{text}</p>
            </div>
          ))}
        </div>
        <p className={`mt-6 text-center ${PUBLIC_CLASSES.bodySm}`}>
          {costLabel} <span className="font-bold text-[#141821]">{costValue}</span>
        </p>
      </div>
    </section>
  );
}
