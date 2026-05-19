import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from '@/components/i18n/useLanguage';
import usePublicSeo from '@/public/hooks/usePublicSeo';
import { localizePublicPath } from '@/public/lib/localePath';
import { getPublicCopy } from '@/public/lib/publicTranslations';

export default function CookiePolicy() {
  const { currentLanguage } = useLanguage();
  const location = useLocation();
  const copy = getPublicCopy(currentLanguage, 'cookiePolicyPage');
  const title = copy.title;
  const description = copy.seoDescription;
  const privacyPolicyPath = localizePublicPath('/privacy', location.pathname);

  usePublicSeo({
    title,
    description,
    canonicalPath: currentLanguage === 'en' ? '/en/cookie' : '/cookie',
    locale: currentLanguage,
    alternateItPath: '/cookie',
    alternateEnPath: '/en/cookie',
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
            <p>{copy.k2}</p>

            <h2 className="text-lg font-semibold mt-6 mb-2">{copy.k3}</h2>

            <h3 className="text-base font-semibold mt-4 mb-1">{copy.k4}</h3>
            <p>{copy.k5}</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>{copy.k6}</strong> {copy.k7}</li>
              <li><strong>{copy.k8}</strong> {copy.k9}</li>
            </ul>
            <p><em>{copy.k10}</em> {copy.k11}</p>

            <h3 className="text-base font-semibold mt-4 mb-1">{copy.k12}</h3>
            <p>{copy.k13}</p>
            <p><em>{copy.k14}</em> {copy.k15}</p>

            <h2 className="text-lg font-semibold mt-6 mb-2">{copy.k16}</h2>
            <p>{copy.k17}</p>

            <h2 className="text-lg font-semibold mt-6 mb-2">{copy.k18}</h2>
            <p>{copy.k19}</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>{copy.k20}</li>
              <li>{copy.k21}</li>
            </ul>
            <p>{copy.k22}</p>

            <h2 className="text-lg font-semibold mt-6 mb-2">{copy.k23}</h2>
            <table className="w-full text-sm border-collapse mt-2">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 pr-4">{copy.k24}</th>
                  <th className="text-left py-2">{copy.k25}</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-2 pr-4">{copy.k26}</td>
                  <td className="py-2">{copy.k27}</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 pr-4">{copy.k28}</td>
                  <td className="py-2">{copy.k29}</td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 pr-4">{copy.k30}</td>
                  <td className="py-2">{copy.k31}</td>
                </tr>
              </tbody>
            </table>

            <h2 className="text-lg font-semibold mt-6 mb-2">{copy.k32}</h2>
            <p>{copy.k33} <Link to={privacyPolicyPath} className="text-[#ef6144] hover:underline">{copy.privacyPolicyLinkLabel}</Link>.</p>

            <h2 className="text-lg font-semibold mt-6 mb-2">{copy.k34}</h2>
            <p>{copy.k35} <strong>info@rdlabs.digital</strong></p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}