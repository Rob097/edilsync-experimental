import React, { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PUBLIC_SIGNUP_PATH } from '@/lib/authRouting';
import usePublicSeo from '@/public/hooks/usePublicSeo';
import usePublicGsap from '@/public/hooks/usePublicGsap';
import { PUBLIC_CLASSES } from '@/public/designSystem';
import { getPublicCopy } from '@/public/lib/publicTranslations';


export default function FaqPage({ locale = 'it' }) {
  const rootRef = useRef(null);
  const copy = useMemo(() => getPublicCopy(locale, 'faqPage'), [locale]);
  const basePath = locale === 'en' ? '/en' : '';
  const canonicalPath = locale === 'en' ? '/en/faq' : '/faq';
  const [openItem, setOpenItem] = useState('0-0');

  usePublicGsap(rootRef);

  usePublicSeo({
    title: copy.seoTitle,
    description: copy.seoDescription,
    canonicalPath,
    locale,
    alternateItPath: '/faq',
    alternateEnPath: '/en/faq',
  });

  return (
    <div ref={rootRef} className={PUBLIC_CLASSES.page}>
      <section className="public-section-shell pt-32 pb-16 text-center">
        <div className="mx-auto max-w-3xl">
          <span className="public-eyebrow" data-reveal>
            {copy.badge}
          </span>
          <h1 className={`mt-5 ${PUBLIC_CLASSES.displayH1}`} data-reveal>
            {copy.title}
          </h1>
          <p className={`mx-auto mt-5 max-w-2xl ${PUBLIC_CLASSES.bodyLead}`} data-reveal>
            {copy.subtitle}
          </p>
        </div>
      </section>

      <section className="public-section-shell pt-[4.5rem] pb-24 md:pt-20">
        <div className="mx-auto max-w-4xl space-y-12">
          {copy.groups.map((group, gIndex) => (
            <div key={group.title} data-reveal>
              <h2 className="mb-4 px-1 text-xl font-bold tracking-[-0.04em] text-[var(--public-ink)]">{group.title}</h2>
              <div className="overflow-hidden rounded-[28px] border border-[var(--public-line)] bg-[rgba(255,255,255,0.92)] px-6 shadow-[0_14px_42px_rgba(42,28,23,0.05)]">
                {group.items.map((item, iIndex) => {
                  const key = `${gIndex}-${iIndex}`;
                  const isOpen = openItem === key;
                  return (
                    <div key={item.q} className="border-b border-[var(--public-line)] last:border-0">
                      <button
                        type="button"
                        className="w-full flex items-center justify-between py-5 text-left gap-4"
                        onClick={() => setOpenItem((prev) => (prev === key ? '' : key))}
                      >
                        <span className="font-semibold text-[var(--public-ink)]">{item.q}</span>
                        <ChevronDown className={`h-5 w-5 flex-shrink-0 text-[var(--public-muted)] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                      </button>

                      <div
                        className={`grid transition-all duration-300 ease-out ${
                          isOpen ? 'grid-rows-[1fr] opacity-100 pb-5' : 'grid-rows-[0fr] opacity-0'
                        }`}
                      >
                        <div className="overflow-hidden">
                          <p className="text-sm leading-relaxed text-[var(--public-muted)]">{item.a}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="py-24 md:py-32 bg-[#0b1220] relative overflow-hidden">
        <div data-parallax="slow" className="absolute top-0 left-1/3 w-96 h-96 bg-[#ef6144]/20 rounded-full blur-3xl pointer-events-none" />
        <div data-parallax="medium" className="absolute bottom-0 right-1/4 w-80 h-80 bg-[#ef6144]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10" data-reveal>
          <h2 className={PUBLIC_CLASSES.darkDisplayH2}>{copy.finalTitle}</h2>
          <p className={`mt-6 ${PUBLIC_CLASSES.darkBodyLead}`}>{copy.finalText}</p>
          <div className="mt-10 flex justify-center">
            <Button asChild className="bg-[#ef6144] hover:bg-[#d9553a] text-white h-10 rounded-full px-10 text-base gap-2 shadow-lg shadow-[rgba(239,97,68,0.4)]">
              <Link to={PUBLIC_SIGNUP_PATH}>
                {copy.finalCta}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
          <p className="mt-4 text-sm text-white/40">{copy.finalNote}</p>
        </div>
      </section>
    </div>
  );
}
