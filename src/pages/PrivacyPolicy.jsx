import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from '@/components/i18n/useLanguage';
import usePublicSeo from '@/public/hooks/usePublicSeo';
import { localizePublicPath } from '@/public/lib/localePath';
import { getPublicCopy } from '@/public/lib/publicTranslations';

export default function PrivacyPolicy() {
  const { currentLanguage } = useLanguage();
  const location = useLocation();
  const copy = getPublicCopy(currentLanguage, 'privacyPolicyPage');
  const title = copy.title;
  const description = copy.seoDescription;
  const cookiePolicyPath = localizePublicPath('/cookie', location.pathname);

  usePublicSeo({
    title,
    description,
    canonicalPath: currentLanguage === 'en' ? '/en/privacy' : '/privacy',
    locale: currentLanguage,
    alternateItPath: '/privacy',
    alternateEnPath: '/en/privacy',
  });

  return (
    <div className="bg-[#f2f4f6] min-h-screen">
      <section className="relative overflow-hidden public-gradient border-b border-[#e5e7eb]">
        <div className="absolute top-8 left-6 h-[52px] w-[52px] rounded-full bg-[#ef6144]/10 blur-[16px]" aria-hidden />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-14 sm:pt-[4.5rem] pb-10 text-center">
          <p className="section-chip">{copy.chipLabel}</p>
          <h1 className="mt-4 text-[38px] sm:text-[50px] font-[780] leading-[1.08] tracking-[-0.02em] text-[#141821]">{copy.title}</h1>
          <p className="mt-4 text-[14px] text-[#5b6470]">{copy.updatedAt}</p>
        </div>
      </section>
      <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6">
        <Card className="public-panel bg-white border-[#e2e8f0]">
          <CardContent className="prose prose-sm max-w-none p-6 sm:p-10 prose-headings:text-[#0f172a] prose-p:text-[#526071] prose-li:text-[#526071]">
            <p className="text-sm text-gray-500 mb-6">{copy.intro}</p>

            <h2 className="text-lg font-semibold mt-6 mb-2">{copy.k1}</h2>
            <p>{copy.k2} <strong>info@rdlabs.digital</strong>.</p>

            <h2 className="text-lg font-semibold mt-6 mb-2">{copy.k3}</h2>
            <p>{copy.k4}</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>{copy.k5}</strong> {copy.k6}</li>
              <li><strong>{copy.k7}</strong> {copy.k8}</li>
              <li><strong>{copy.k9}</strong> {copy.k10}</li>
              <li><strong>{copy.k11}</strong> {copy.k12}</li>
            </ul>

            <h2 className="text-lg font-semibold mt-6 mb-2">{copy.k13}</h2>
            <p>{copy.k14}</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>{copy.k15}</strong> (Art. 6.1.b GDPR): {copy.k16}</li>
              <li><strong>{copy.k17}</strong> (Art. 6.1.f GDPR): {copy.k18}</li>
              <li><strong>{copy.k19}</strong> (Art. 6.1.a GDPR): {copy.k20}</li>
              <li><strong>{copy.k21}</strong> (Art. 6.1.c GDPR): {copy.k22}</li>
            </ul>

            <h2 className="text-lg font-semibold mt-6 mb-2">{copy.k23}</h2>
            <p>{copy.k24}</p>

            <h2 className="text-lg font-semibold mt-6 mb-2">{copy.k25}</h2>
            <p>{copy.k26}</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>{copy.k27}</li>
              <li>{copy.k28}</li>
            </ul>
            <p>{copy.k29}</p>

            <h2 className="text-lg font-semibold mt-6 mb-2">{copy.k30}</h2>
            <p>{copy.k31}</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>{copy.k32}</li>
              <li>{copy.k33}</li>
              <li>{copy.k34}</li>
              <li>{copy.k35}</li>
              <li>{copy.k36}</li>
              <li>{copy.k37}</li>
              <li>{copy.k38}</li>
              <li>{copy.k39}</li>
            </ul>
            <p>{copy.k40} <strong>info@rdlabs.digital</strong></p>

            <h2 className="text-lg font-semibold mt-6 mb-2">{copy.k41}</h2>
            <p>{copy.k42} <Link to={cookiePolicyPath} className="text-[#ef6144] hover:underline">{copy.cookiePolicyLinkLabel}</Link>.</p>

            <h2 className="text-lg font-semibold mt-6 mb-2">{copy.k43}</h2>
            <p>{copy.k44}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}