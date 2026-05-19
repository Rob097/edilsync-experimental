import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from '@/components/i18n/useLanguage';
import usePublicSeo from '@/public/hooks/usePublicSeo';
import { getPublicCopy } from '@/public/lib/publicTranslations';

export default function TermsOfService() {
  const { currentLanguage } = useLanguage();
  const copy = getPublicCopy(currentLanguage, 'termsOfServicePage');
  const title = copy.title;
  const description = copy.seoDescription;

  usePublicSeo({
    title,
    description,
    canonicalPath: currentLanguage === 'en' ? '/en/termini' : '/termini',
    locale: currentLanguage,
    alternateItPath: '/termini',
    alternateEnPath: '/en/termini',
  });

  return (
    <div className="bg-[#f2f4f6] min-h-screen">
      <section className="relative overflow-hidden public-gradient border-b border-[#e5e7eb]">
        <div className="absolute top-8 left-6 h-[52px] w-[52px] rounded-full bg-[#ef6144]/10 blur-[16px]" aria-hidden />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-14 sm:pt-[4.5rem] pb-10 text-center">
          <p className="section-chip">{copy.chipLabel}</p>
          <h1 className="mt-4 text-[38px] sm:text-[50px] font-[780] leading-[1.08] tracking-[-0.02em] text-[#141821]">{copy.heroTitle}</h1>
          <p className="mt-4 text-[14px] text-[#5b6470]">{copy.updatedAt}</p>
        </div>
      </section>
      <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6">
        <Card className="public-panel bg-white border-[#e2e8f0]">
          <CardContent className="prose prose-sm max-w-none p-6 sm:p-10 prose-headings:text-[#0f172a] prose-p:text-[#526071] prose-li:text-[#526071]">
            <p className="text-sm text-gray-500 mb-6">{copy.intro}</p>

            <h2 className="text-lg font-semibold mt-6 mb-2">{copy.k1}</h2>
            <p>{copy.k2}</p>

            <h2 className="text-lg font-semibold mt-6 mb-2">{copy.k3}</h2>
            <p>{copy.k4}</p>

            <h2 className="text-lg font-semibold mt-6 mb-2">{copy.k5}</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>{copy.k6}</li>
              <li>{copy.k7}</li>
              <li>{copy.k8}</li>
              <li>{copy.k9}</li>
            </ul>

            <h2 className="text-lg font-semibold mt-6 mb-2">{copy.k10}</h2>
            <p>{copy.k11}</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>{copy.k12}</li>
              <li>{copy.k13}</li>
              <li>{copy.k14}</li>
              <li>{copy.k15}</li>
            </ul>

            <h2 className="text-lg font-semibold mt-6 mb-2">{copy.k16}</h2>
            <p>{copy.k17}</p>

            <h2 className="text-lg font-semibold mt-6 mb-2">{copy.k18}</h2>
            <p>{copy.k19}</p>

            <h2 className="text-lg font-semibold mt-6 mb-2">{copy.k20}</h2>
            <p>{copy.k21}</p>

            <h2 className="text-lg font-semibold mt-6 mb-2">{copy.k22}</h2>
            <p>{copy.k23}</p>

            <h2 className="text-lg font-semibold mt-6 mb-2">{copy.k24}</h2>
            <p>{copy.k25}</p>

            <h2 className="text-lg font-semibold mt-6 mb-2">{copy.k26}</h2>
            <p>{copy.k27}</p>

            <h2 className="text-lg font-semibold mt-6 mb-2">{copy.k28}</h2>
            <p>{copy.k29} <strong>info@rdlabs.digital</strong></p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}