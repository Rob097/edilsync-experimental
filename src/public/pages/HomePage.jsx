import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, ArrowRight, CalendarDays, Camera, Check, ChevronRight, ClipboardList, Clock3, FileQuestion, FileText, ListChecks, MessageCircle, MessageSquare, Phone, Play, Shield, Users, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import usePublicSeo from '@/public/hooks/usePublicSeo';
import usePublicGsap from '@/public/hooks/usePublicGsap';
import StructuredData from '@/public/seo/StructuredData';
import { PUBLIC_CLASSES } from '@/public/designSystem';

export default function HomePage({ locale = 'it' }) {
  const rootRef = useRef(null);
  const { t } = useTranslation();
  const canonicalPath = locale === 'en' ? '/en' : '/';
  const basePrefix = locale === 'en' ? '/en' : '';

  usePublicGsap(rootRef);

  usePublicSeo({
    title: t('publicHome.seo.title'),
    description: t('publicHome.seo.description'),
    canonicalPath,
    locale,
    alternateItPath: '/',
    alternateEnPath: '/en',
  });

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'EdilSync',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    description: t('publicHome.seo.softwareDescription'),
  };

  return (
    <>
      <StructuredData id="home-software-app" data={structuredData} />
      <div ref={rootRef} className="bg-[#f2f4f6]">
        <section className="relative pt-32 pb-20 md:pt-40 md:pb-32 overflow-hidden bg-[#fcfcfc]">
          <div data-parallax="slow" className="absolute top-20 left-1/4 w-96 h-96 bg-[#ef6144]/10 rounded-full blur-3xl pointer-events-none" aria-hidden />
          <div data-parallax="medium" className="absolute bottom-0 right-1/4 w-80 h-80 bg-[#ef6144]/5 rounded-full blur-3xl pointer-events-none" aria-hidden />
          <div className="max-w-7xl mx-auto px-6 relative">
            <div className="text-center max-w-4xl mx-auto">
              <div data-reveal>
                <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#fff0eb] text-[#ef6144] text-sm font-inter font-medium mb-6">
                  <span className="w-2 h-2 rounded-full bg-[#ef6144] animate-pulse" />
                  {t('publicHome.hero.badge')}
                </span>
              </div>
              <h1 data-reveal className="font-inter font-bold text-4xl md:text-6xl lg:text-7xl leading-tight tracking-tight text-[#141821]">
              {t('publicHome.hero.titleA')}
              <br />
              <span className="text-[#ef6144]">{t('publicHome.hero.titleHighlight')}</span> {t('publicHome.hero.titleB')}
              </h1>
              <p data-reveal className="mt-6 text-lg md:text-xl text-[#5b6470] font-inter leading-relaxed max-w-2xl mx-auto">
                {t('publicHome.hero.subtitle')}
              </p>
              <div data-reveal className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button asChild className="bg-[#ef6144] text-white hover:bg-[#d9553a] h-10 font-inter rounded-full px-8 text-base gap-2 shadow-lg shadow-[rgba(239,97,68,0.25)] hover:shadow-xl hover:shadow-[rgba(239,97,68,0.3)] transition-all">
                  <Link to={`${basePrefix}/contatti`}>
                    {t('publicHome.hero.ctaPrimary')}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" className="border-[#d6dce4] bg-white hover:bg-[#fff0eb] text-[#141821] h-10 font-inter rounded-full px-8 text-base gap-2">
                  <Link to={`${basePrefix}/come-funziona`}>
                    <Play className="h-4 w-4 text-[#ef6144]" />
                    {t('publicHome.hero.ctaSecondary')}
                  </Link>
                </Button>
              </div>
              <p data-reveal className="mt-4 text-sm text-[#6b7280] font-inter">{t('publicHome.hero.note')}</p>
            </div>

            <div data-reveal className="mt-16 md:mt-20 relative">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-[#141821]/10 border border-[#e5e7eb]">
                <img src="/images/hero-image.png" alt="Interfaccia EdilSync per coordinare cantiere" className="w-full h-auto" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#f2f4f6]/20 to-transparent pointer-events-none" />
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#0f172a] text-white border-y border-[#111827]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-9 sm:py-10 grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 text-center">
            <div data-reveal>
              <p className="text-[34px] sm:text-[36px] leading-none font-extrabold text-[#ef6144]">{t('publicHome.stats.aValue')}</p>
              <p className="mt-2 text-[12px] sm:text-[13px] text-[#d3dbe6] leading-[1.45] max-w-[220px] mx-auto">{t('publicHome.stats.aLabel')}</p>
            </div>
            <div data-reveal>
              <p className="text-[34px] sm:text-[36px] leading-none font-extrabold text-[#ef6144]">{t('publicHome.stats.bValue')}</p>
              <p className="mt-2 text-[12px] sm:text-[13px] text-[#d3dbe6] leading-[1.45] max-w-[220px] mx-auto">{t('publicHome.stats.bLabel')}</p>
            </div>
            <div data-reveal>
              <p className="text-[34px] sm:text-[36px] leading-none font-extrabold text-[#ef6144]">{t('publicHome.stats.cValue')}</p>
              <p className="mt-2 text-[12px] sm:text-[13px] text-[#d3dbe6] leading-[1.45] max-w-[220px] mx-auto">{t('publicHome.stats.cLabel')}</p>
            </div>
            <div data-reveal>
              <p className="text-[34px] sm:text-[36px] leading-none font-extrabold text-[#ef6144]">{t('publicHome.stats.dValue')}</p>
              <p className="mt-2 text-[12px] sm:text-[13px] text-[#d3dbe6] leading-[1.45] max-w-[220px] mx-auto">{t('publicHome.stats.dLabel')}</p>
            </div>
          </div>
        </section>

        <section id="problema" className="py-24 md:py-32 bg-[#fcfcfc]">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center max-w-3xl mx-auto">
              <span data-reveal className="inline-block px-4 py-1.5 rounded-full bg-[#ef6144]/10 text-[#ef6144] text-sm font-inter font-medium mb-4">{t('publicHome.problem.chip')}</span>
              <h2 data-reveal className="font-inter font-bold text-3xl md:text-5xl text-[#141821] tracking-tight">{t('publicHome.problem.title')}</h2>
              <p data-reveal className="mt-4 text-lg text-[#5b6470] font-inter">{t('publicHome.problem.subtitle')}</p>
            </div>
            <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <article data-reveal className="group p-6 rounded-2xl border border-[#e5e7eb] bg-white hover:border-[#ef6144]/30 hover:shadow-lg hover:shadow-[#ef6144]/5 transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-[#ef6144]/10 flex items-center justify-center mb-4 group-hover:bg-[#ef6144]/15 transition-colors"><MessageSquare className="w-6 h-6 text-[#ef6144]" /></div>
                <h3 className="font-inter font-semibold text-lg text-[#141821]">{t('publicHome.problem.c1t')}</h3>
                <p className="mt-2 text-sm text-[#5b6470] font-inter leading-relaxed">{t('publicHome.problem.c1d')}</p>
              </article>
              <article data-reveal className="group p-6 rounded-2xl border border-[#e5e7eb] bg-white hover:border-[#ef6144]/30 hover:shadow-lg hover:shadow-[#ef6144]/5 transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-[#ef6144]/10 flex items-center justify-center mb-4 group-hover:bg-[#ef6144]/15 transition-colors"><Phone className="w-6 h-6 text-[#ef6144]" /></div>
                <h3 className="font-inter font-semibold text-lg text-[#141821]">{t('publicHome.problem.c2t')}</h3>
                <p className="mt-2 text-sm text-[#5b6470] font-inter leading-relaxed">{t('publicHome.problem.c2d')}</p>
              </article>
              <article data-reveal className="group p-6 rounded-2xl border border-[#e5e7eb] bg-white hover:border-[#ef6144]/30 hover:shadow-lg hover:shadow-[#ef6144]/5 transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-[#ef6144]/10 flex items-center justify-center mb-4 group-hover:bg-[#ef6144]/15 transition-colors"><FileQuestion className="w-6 h-6 text-[#ef6144]" /></div>
                <h3 className="font-inter font-semibold text-lg text-[#141821]">{t('publicHome.problem.c3t')}</h3>
                <p className="mt-2 text-sm text-[#5b6470] font-inter leading-relaxed">{t('publicHome.problem.c3d')}</p>
              </article>
              <article data-reveal className="group p-6 rounded-2xl border border-[#e5e7eb] bg-white hover:border-[#ef6144]/30 hover:shadow-lg hover:shadow-[#ef6144]/5 transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-[#ef6144]/10 flex items-center justify-center mb-4 group-hover:bg-[#ef6144]/15 transition-colors"><Clock3 className="w-6 h-6 text-[#ef6144]" /></div>
                <h3 className="font-inter font-semibold text-lg text-[#141821]">{t('publicHome.problem.c4t')}</h3>
                <p className="mt-2 text-sm text-[#5b6470] font-inter leading-relaxed">{t('publicHome.problem.c4d')}</p>
              </article>
              <article data-reveal className="group p-6 rounded-2xl border border-[#e5e7eb] bg-white hover:border-[#ef6144]/30 hover:shadow-lg hover:shadow-[#ef6144]/5 transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-[#ef6144]/10 flex items-center justify-center mb-4 group-hover:bg-[#ef6144]/15 transition-colors"><AlertTriangle className="w-6 h-6 text-[#ef6144]" /></div>
                <h3 className="font-inter font-semibold text-lg text-[#141821]">{t('publicHome.problem.c5t')}</h3>
                <p className="mt-2 text-sm text-[#5b6470] font-inter leading-relaxed">{t('publicHome.problem.c5d')}</p>
              </article>
              <article data-reveal className="group p-6 rounded-2xl border border-[#e5e7eb] bg-white hover:border-[#ef6144]/30 hover:shadow-lg hover:shadow-[#ef6144]/5 transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-[#ef6144]/10 flex items-center justify-center mb-4 group-hover:bg-[#ef6144]/15 transition-colors"><Users className="w-6 h-6 text-[#ef6144]" /></div>
                <h3 className="font-inter font-semibold text-lg text-[#141821]">{t('publicHome.problem.c6t')}</h3>
                <p className="mt-2 text-sm text-[#5b6470] font-inter leading-relaxed">{t('publicHome.problem.c6d')}</p>
              </article>
            </div>
          </div>
        </section>

        <section className="py-24 md:py-32 bg-[#f3f4f680]" id="come-funziona">
          <div className="max-w-7xl mx-auto px-6">
            <div className="max-w-4xl mx-auto text-center">
              <span data-reveal className="inline-block px-4 py-1.5 rounded-full bg-[#fff0eb] text-[#ef6144] text-sm font-inter font-medium mb-4">{t('publicHome.solution.chip')}</span>
              <h2 data-reveal className="font-inter font-bold text-3xl md:text-5xl text-[#141821] tracking-tight">{t('publicHome.solution.title')}</h2>
              <p data-reveal className="mt-6 text-lg text-[#5b6470] font-inter max-w-2xl mx-auto">{t('publicHome.solution.subtitle')}</p>
              <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8" data-reveal>
                <article className="relative text-left">
                  <span className="font-inter font-bold text-6xl text-[#ef6144]/20">01</span>
                  <h3 className="mt-2 font-inter font-semibold text-xl text-[#141821]">{t('publicHome.solution.s1t')}</h3>
                  <p className="mt-2 text-[#5b6470] font-inter text-sm leading-relaxed">{t('publicHome.solution.s1d')}</p>
                </article>
                <article className="relative text-left">
                  <span className="font-inter font-bold text-6xl text-[#ef6144]/20">02</span>
                  <h3 className="mt-2 font-inter font-semibold text-xl text-[#141821]">{t('publicHome.solution.s2t')}</h3>
                  <p className="mt-2 text-[#5b6470] font-inter text-sm leading-relaxed">{t('publicHome.solution.s2d')}</p>
                </article>
                <article className="relative text-left">
                  <span className="font-inter font-bold text-6xl text-[#ef6144]/20">03</span>
                  <h3 className="mt-2 font-inter font-semibold text-xl text-[#141821]">{t('publicHome.solution.s3t')}</h3>
                  <p className="mt-2 text-[#5b6470] font-inter text-sm leading-relaxed">{t('publicHome.solution.s3d')}</p>
                </article>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="py-24 md:py-32 bg-[#fcfcfc]">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center max-w-3xl mx-auto">
              <span data-reveal className="inline-block px-4 py-1.5 rounded-full bg-[#fff0eb] text-[#ef6144] text-sm font-inter font-medium mb-4">{t('publicHome.features.chip')}</span>
              <h2 data-reveal className="font-inter font-bold text-3xl md:text-5xl text-[#141821] tracking-tight">{t('publicHome.features.title')}</h2>
              <p data-reveal className="mt-4 text-lg text-[#5b6470] font-inter">{t('publicHome.features.subtitle')}</p>
            </div>
            <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <article data-reveal className="group p-6 rounded-2xl border border-[#e5e7eb] bg-white hover:border-[#ef6144]/20 hover:shadow-lg hover:shadow-[#ef6144]/5 transition-all duration-300 hover:-translate-y-1"><div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center mb-4"><ListChecks className="w-6 h-6" /></div><h3 className="font-inter font-semibold text-base text-[#141821]">{t('publicHome.features.f1t')}</h3><p className="mt-2 text-sm text-[#5b6470] font-inter leading-relaxed">{t('publicHome.features.f1d')}</p></article>
              <article data-reveal className="group p-6 rounded-2xl border border-[#e5e7eb] bg-white hover:border-[#ef6144]/20 hover:shadow-lg hover:shadow-[#ef6144]/5 transition-all duration-300 hover:-translate-y-1"><div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center mb-4"><Camera className="w-6 h-6" /></div><h3 className="font-inter font-semibold text-base text-[#141821]">{t('publicHome.features.f2t')}</h3><p className="mt-2 text-sm text-[#5b6470] font-inter leading-relaxed">{t('publicHome.features.f2d')}</p></article>
              <article data-reveal className="group p-6 rounded-2xl border border-[#e5e7eb] bg-white hover:border-[#ef6144]/20 hover:shadow-lg hover:shadow-[#ef6144]/5 transition-all duration-300 hover:-translate-y-1"><div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-4"><FileText className="w-6 h-6" /></div><h3 className="font-inter font-semibold text-base text-[#141821]">{t('publicHome.features.f3t')}</h3><p className="mt-2 text-sm text-[#5b6470] font-inter leading-relaxed">{t('publicHome.features.f3d')}</p></article>
              <article data-reveal className="group p-6 rounded-2xl border border-[#e5e7eb] bg-white hover:border-[#ef6144]/20 hover:shadow-lg hover:shadow-[#ef6144]/5 transition-all duration-300 hover:-translate-y-1"><div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center mb-4"><MessageCircle className="w-6 h-6" /></div><h3 className="font-inter font-semibold text-base text-[#141821]">{t('publicHome.features.f4t')}</h3><p className="mt-2 text-sm text-[#5b6470] font-inter leading-relaxed">{t('publicHome.features.f4d')}</p></article>
              <article data-reveal className="group p-6 rounded-2xl border border-[#e5e7eb] bg-white hover:border-[#ef6144]/20 hover:shadow-lg hover:shadow-[#ef6144]/5 transition-all duration-300 hover:-translate-y-1"><div className="w-12 h-12 rounded-xl bg-pink-500/10 text-pink-600 flex items-center justify-center mb-4"><CalendarDays className="w-6 h-6" /></div><h3 className="font-inter font-semibold text-base text-[#141821]">{t('publicHome.features.f5t')}</h3><p className="mt-2 text-sm text-[#5b6470] font-inter leading-relaxed">{t('publicHome.features.f5d')}</p></article>
              <article data-reveal className="group p-6 rounded-2xl border border-[#e5e7eb] bg-white hover:border-[#ef6144]/20 hover:shadow-lg hover:shadow-[#ef6144]/5 transition-all duration-300 hover:-translate-y-1"><div className="w-12 h-12 rounded-xl bg-red-500/10 text-red-600 flex items-center justify-center mb-4"><Shield className="w-6 h-6" /></div><h3 className="font-inter font-semibold text-base text-[#141821]">{t('publicHome.features.f6t')}</h3><p className="mt-2 text-sm text-[#5b6470] font-inter leading-relaxed">{t('publicHome.features.f6d')}</p></article>
              <article data-reveal className="group p-6 rounded-2xl border border-[#e5e7eb] bg-white hover:border-[#ef6144]/20 hover:shadow-lg hover:shadow-[#ef6144]/5 transition-all duration-300 hover:-translate-y-1"><div className="w-12 h-12 rounded-xl bg-teal-500/10 text-teal-600 flex items-center justify-center mb-4"><Wallet className="w-6 h-6" /></div><h3 className="font-inter font-semibold text-base text-[#141821]">{t('publicHome.features.f7t')}</h3><p className="mt-2 text-sm text-[#5b6470] font-inter leading-relaxed">{t('publicHome.features.f7d')}</p></article>
              <article data-reveal className="group p-6 rounded-2xl border border-[#e5e7eb] bg-white hover:border-[#ef6144]/20 hover:shadow-lg hover:shadow-[#ef6144]/5 transition-all duration-300 hover:-translate-y-1"><div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center mb-4"><Clock3 className="w-6 h-6" /></div><h3 className="font-inter font-semibold text-base text-[#141821]">{t('publicHome.features.f8t')}</h3><p className="mt-2 text-sm text-[#5b6470] font-inter leading-relaxed">{t('publicHome.features.f8d')}</p></article>
            </div>
          </div>
        </section>

        <section className="py-24 md:py-32 bg-[#f3f4f680]">
          <div className="max-w-7xl mx-auto px-6">
          <p data-reveal className="section-chip">{t('publicHome.why.chip')}</p>
          <h2 data-reveal className={`${PUBLIC_CLASSES.displayH2} text-center mt-3`}>{t('publicHome.why.title')}</h2>
          <div className="mt-10 grid md:grid-cols-2 gap-5">
            <article data-reveal className="flex gap-5 p-6 rounded-2xl bg-white border border-[#e5e7eb]"><div className="w-12 h-12 rounded-xl bg-[#ef6144]/10 flex-shrink-0 flex items-center justify-center"><Shield className="w-6 h-6 text-[#ef6144]" /></div><div><p className="mt-1 text-[20px] font-[700] text-[#0f172a]">{t('publicHome.why.w1t')}</p><p className="mt-2 text-[14px] leading-[1.68] text-[#526071]">{t('publicHome.why.w1d')}</p></div></article>
            <article data-reveal className="flex gap-5 p-6 rounded-2xl bg-white border border-[#e5e7eb]"><div className="w-12 h-12 rounded-xl bg-[#ef6144]/10 flex-shrink-0 flex items-center justify-center"><MessageSquare className="w-6 h-6 text-[#ef6144]" /></div><div><p className="mt-1 text-[20px] font-[700] text-[#0f172a]">{t('publicHome.why.w2t')}</p><p className="mt-2 text-[14px] leading-[1.68] text-[#526071]">{t('publicHome.why.w2d')}</p></div></article>
            <article data-reveal className="flex gap-5 p-6 rounded-2xl bg-white border border-[#e5e7eb]"><div className="w-12 h-12 rounded-xl bg-[#ef6144]/10 flex-shrink-0 flex items-center justify-center"><ClipboardList className="w-6 h-6 text-[#ef6144]" /></div><div><p className="mt-1 text-[20px] font-[700] text-[#0f172a]">{t('publicHome.why.w3t')}</p><p className="mt-2 text-[14px] leading-[1.68] text-[#526071]">{t('publicHome.why.w3d')}</p></div></article>
            <article data-reveal className="flex gap-5 p-6 rounded-2xl bg-white border border-[#e5e7eb]"><div className="w-12 h-12 rounded-xl bg-[#ef6144]/10 flex-shrink-0 flex items-center justify-center"><ArrowRight className="w-6 h-6 text-[#ef6144]" /></div><div><p className="mt-1 text-[20px] font-[700] text-[#0f172a]">{t('publicHome.why.w4t')}</p><p className="mt-2 text-[14px] leading-[1.68] text-[#526071]">{t('publicHome.why.w4d')}</p></div></article>
          </div>
          </div>
        </section>

        <section id="perchi" className="py-24 md:py-32 bg-[#f3f4f680]">
          <div className="max-w-7xl mx-auto px-6">
            <p data-reveal className="section-chip">{t('publicHome.audience.chip')}</p>
            <h2 data-reveal className={`${PUBLIC_CLASSES.displayH2} max-w-4xl mx-auto text-center mt-3`}>{t('publicHome.audience.title')}</h2>
            <p data-reveal className={`mt-4 max-w-3xl text-center mx-auto ${PUBLIC_CLASSES.bodyBase}`}>{t('publicHome.audience.subtitle')}</p>
            <div className="mt-10 grid md:grid-cols-3 gap-5 items-stretch">
              <article data-reveal className="public-panel p-7 bg-white h-full flex flex-col rounded-2xl border-[#e9edf3] shadow-sm">
                <div className="flex items-center gap-3">
                  <img src="/images/michele.png" alt="Michele" className="h-14 w-14 rounded-full border border-[#f8c8bd] object-cover" />
                  <div>
                    <p className="text-[17px] font-semibold text-[#0f172a]">Michele</p>
                    <p className="text-[12px] font-semibold uppercase tracking-[0.09em] text-[#ef6144]">{t('publicHome.audience.micheleRole')}</p>
                  </div>
                </div>
                <blockquote className="mt-4 border-l-2 border-[#ef6144] pl-3 text-[14px] italic leading-[1.64] text-[#6b7280] mb-4">{t('publicHome.audience.micheleQuote')}</blockquote>
                <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.13em] text-[#ef6144]">{t('publicHome.audience.helpLabel')}</p>
                <ul className="mt-3 space-y-2.5 text-[#111827] text-[13px] leading-[1.56] flex-1">
                  <li className="flex items-start gap-2"><ChevronRight className="h-[16px] w-[16px] mt-0.5 text-[#ef6144] shrink-0" /><span>{t('publicHome.audience.m1')}</span></li>
                  <li className="flex items-start gap-2"><ChevronRight className="h-[16px] w-[16px] mt-0.5 text-[#ef6144] shrink-0" /><span>{t('publicHome.audience.m2')}</span></li>
                  <li className="flex items-start gap-2"><ChevronRight className="h-[16px] w-[16px] mt-0.5 text-[#ef6144] shrink-0" /><span>{t('publicHome.audience.m3')}</span></li>
                  <li className="flex items-start gap-2"><ChevronRight className="h-[16px] w-[16px] mt-0.5 text-[#ef6144] shrink-0" /><span>{t('publicHome.audience.m4')}</span></li>
                </ul>
              </article>

              <article data-reveal className="public-panel p-7 bg-white h-full flex flex-col rounded-2xl border-[#e9edf3] shadow-sm">
                <div className="flex items-center gap-3">
                  <img src="/images/matteo.png" alt="Matteo" className="h-14 w-14 rounded-full border border-[#f8c8bd] object-cover" />
                  <div>
                    <p className="text-[17px] font-semibold text-[#0f172a]">Matteo</p>
                    <p className="text-[12px] font-semibold uppercase tracking-[0.09em] text-[#ef6144]">{t('publicHome.audience.matteoRole')}</p>
                  </div>
                </div>
                <blockquote className="mt-4 border-l-2 border-[#ef6144] pl-3 text-[14px] italic leading-[1.64] text-[#6b7280] mb-4">{t('publicHome.audience.matteoQuote')}</blockquote>
                <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.13em] text-[#ef6144]">{t('publicHome.audience.helpLabel')}</p>
                <ul className="mt-3 space-y-2.5 text-[#111827] text-[13px] leading-[1.56] flex-1">
                  <li className="flex items-start gap-2"><ChevronRight className="h-[16px] w-[16px] mt-0.5 text-[#ef6144] shrink-0" /><span>{t('publicHome.audience.t1')}</span></li>
                  <li className="flex items-start gap-2"><ChevronRight className="h-[16px] w-[16px] mt-0.5 text-[#ef6144] shrink-0" /><span>{t('publicHome.audience.t2')}</span></li>
                  <li className="flex items-start gap-2"><ChevronRight className="h-[16px] w-[16px] mt-0.5 text-[#ef6144] shrink-0" /><span>{t('publicHome.audience.t3')}</span></li>
                  <li className="flex items-start gap-2"><ChevronRight className="h-[16px] w-[16px] mt-0.5 text-[#ef6144] shrink-0" /><span>{t('publicHome.audience.t4')}</span></li>
                </ul>
              </article>

              <article data-reveal className="public-panel p-7 bg-white h-full flex flex-col rounded-2xl border-[#e9edf3] shadow-sm">
                <div className="flex items-center gap-3">
                  <img src="/images/marco.png" alt="Marco" className="h-14 w-14 rounded-full border border-[#f8c8bd] object-cover" />
                  <div>
                    <p className="text-[17px] font-semibold text-[#0f172a]">Marco</p>
                    <p className="text-[12px] font-semibold uppercase tracking-[0.09em] text-[#ef6144]">{t('publicHome.audience.marcoRole')}</p>
                  </div>
                </div>
                <blockquote className="mt-4 border-l-2 border-[#ef6144] pl-3 text-[14px] italic leading-[1.64] text-[#6b7280] mb-4">{t('publicHome.audience.marcoQuote')}</blockquote>
                <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.13em] text-[#ef6144]">{t('publicHome.audience.helpLabel')}</p>
                <ul className="mt-3 space-y-2.5 text-[#111827] text-[13px] leading-[1.56] flex-1">
                  <li className="flex items-start gap-2"><ChevronRight className="h-[16px] w-[16px] mt-0.5 text-[#ef6144] shrink-0" /><span>{t('publicHome.audience.r1')}</span></li>
                  <li className="flex items-start gap-2"><ChevronRight className="h-[16px] w-[16px] mt-0.5 text-[#ef6144] shrink-0" /><span>{t('publicHome.audience.r2')}</span></li>
                  <li className="flex items-start gap-2"><ChevronRight className="h-[16px] w-[16px] mt-0.5 text-[#ef6144] shrink-0" /><span>{t('publicHome.audience.r3')}</span></li>
                  <li className="flex items-start gap-2"><ChevronRight className="h-[16px] w-[16px] mt-0.5 text-[#ef6144] shrink-0" /><span>{t('publicHome.audience.r4')}</span></li>
                </ul>
              </article>
            </div>
          </div>
        </section>

        <section id="prezzi" className="py-24 md:py-32 bg-[#fcfcfc]">
          <div className="max-w-7xl mx-auto px-6">
          <p data-reveal className="section-chip">{t('publicHome.pricing.chip')}</p>
          <div className="text-center max-w-3xl mx-auto" data-reveal>
            <h2 className={`${PUBLIC_CLASSES.displayH2} mt-3`}>{t('publicHome.pricing.title')}</h2>
            <p className={`mt-4 ${PUBLIC_CLASSES.bodyLead}`}>{t('publicHome.pricing.subtitle')}</p>
          </div>
          <div data-reveal data-price-card className="mt-10 relative bg-white rounded-3xl border-2 border-[#ef6144] shadow-2xl shadow-[#ef6144]/10 overflow-hidden max-w-lg mx-auto">
            <span className="absolute top-0 right-0 bg-[#ef6144] text-white text-xs font-inter font-semibold px-4 py-1.5 rounded-bl-xl">{t('publicHome.pricing.badge')}</span>
            <div className="p-8 md:p-10">
            <p className="text-sm font-medium uppercase tracking-wider text-[#64748b]">{t('publicHome.pricing.plan')}</p>
            <div className="mt-4 flex items-end gap-1">
              <p className="text-6xl font-bold leading-none text-[#0f172a]">{t('publicHome.pricing.price')}</p>
            </div>
            <p className="mt-3 text-sm text-[#475569]">{t('publicHome.pricing.priceNote')}</p>
            <div className="mt-6">
              <Button asChild className="bg-[#ef6144] hover:bg-[#d9553a] text-white rounded-full h-12 px-6 text-base font-semibold shadow-[0_10px_28px_rgba(239,97,68,0.28)] w-full">
                <Link to={`${basePrefix}/contatti`}>{t('publicHome.pricing.cta')}</Link>
              </Button>
            </div>
            <p className="mt-3 text-xs text-center text-[#64748b]">{t('publicHome.pricing.noCard')}</p>
            <div className="mt-8 pt-8 border-t border-[#e5e7eb]">
            <p className="text-sm font-semibold text-[#1f2937]">{t('publicHome.pricing.included')}</p>
            <ul className="mt-4 space-y-2 text-left">
              <li className="flex gap-2 text-[#334155] text-sm"><Check className="h-4 w-4 mt-1 text-[#ef6144]" /><span>{t('publicHome.pricing.p1')}</span></li>
              <li className="flex gap-2 text-[#334155] text-sm"><Check className="h-4 w-4 mt-1 text-[#ef6144]" /><span>{t('publicHome.pricing.p2')}</span></li>
              <li className="flex gap-2 text-[#334155] text-sm"><Check className="h-4 w-4 mt-1 text-[#ef6144]" /><span>{t('publicHome.pricing.p3')}</span></li>
              <li className="flex gap-2 text-[#334155] text-sm"><Check className="h-4 w-4 mt-1 text-[#ef6144]" /><span>{t('publicHome.pricing.p4')}</span></li>
              <li className="flex gap-2 text-[#334155] text-sm"><Check className="h-4 w-4 mt-1 text-[#ef6144]" /><span>{t('publicHome.pricing.p5')}</span></li>
              <li className="flex gap-2 text-[#334155] text-sm"><Check className="h-4 w-4 mt-1 text-[#ef6144]" /><span>{t('publicHome.pricing.p6')}</span></li>
              <li className="flex gap-2 text-[#334155] text-sm"><Check className="h-4 w-4 mt-1 text-[#ef6144]" /><span>{t('publicHome.pricing.p7')}</span></li>
              <li className="flex gap-2 text-[#334155] text-sm"><Check className="h-4 w-4 mt-1 text-[#ef6144]" /><span>{t('publicHome.pricing.p8')}</span></li>
              <li className="flex gap-2 text-[#334155] text-sm"><Check className="h-4 w-4 mt-1 text-[#ef6144]" /><span>{t('publicHome.pricing.p9')}</span></li>
              <li className="flex gap-2 text-[#334155] text-sm"><Check className="h-4 w-4 mt-1 text-[#ef6144]" /><span>{t('publicHome.pricing.p10')}</span></li>
              <li className="flex gap-2 text-[#334155] text-sm"><Check className="h-4 w-4 mt-1 text-[#ef6144]" /><span>{t('publicHome.pricing.p11')}</span></li>
              <li className="flex gap-2 text-[#334155] text-sm"><Check className="h-4 w-4 mt-1 text-[#ef6144]" /><span>{t('publicHome.pricing.p12')}</span></li>
            </ul>
            </div>
          </div>
          </div>
          <p data-reveal className="mt-8 text-center text-sm text-[#475569] max-w-2xl mx-auto">
            <span className="font-semibold text-[#0f172a]">{t('publicHome.pricing.hintStrong')}</span>
             <span className="text-[#0f172a]">{t('publicHome.pricing.hint')}</span>
            <br />
            {t('publicHome.pricing.hintSub')}
          </p>
          </div>
        </section>

        <section className="py-24 md:py-32 bg-[#0b1220] text-white relative overflow-hidden">
          <div data-parallax="slow" className="absolute top-0 left-1/3 w-96 h-96 bg-[#ef6144]/20 rounded-full blur-3xl pointer-events-none" aria-hidden />
          <div data-parallax="medium" className="absolute bottom-0 right-1/4 w-80 h-80 bg-[#ef6144]/10 rounded-full blur-3xl pointer-events-none" aria-hidden />
          <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
            <h2 data-reveal className={`${PUBLIC_CLASSES.darkDisplayH2} max-w-4xl mx-auto`}>{t('publicHome.final.title')}</h2>
            <p data-reveal className={`mt-5 ${PUBLIC_CLASSES.darkBodyLead} max-w-3xl`}>{t('publicHome.final.text')}</p>
            <div data-reveal className="mt-10 flex justify-center">
              <Button asChild className="bg-[#ef6144] hover:bg-[#d9553a] text-white rounded-full h-10 px-10 text-base font-semibold shadow-lg shadow-[rgba(239,97,68,0.4)] gap-2">
                <Link to={`${basePrefix}/contatti`}>{t('publicHome.final.ctaPrimary')}</Link>
              </Button>
            </div>
            <p data-reveal className="mt-4 text-sm text-white/40 font-inter">{t('publicHome.hero.note')}</p>
          </div>
        </section>
      </div>
    </>
  );
}
