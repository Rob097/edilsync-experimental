import React, { Suspense, lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import PublicLayout from '@/public/components/PublicLayout';
import HomePage from '@/public/pages/HomePage';
const FeaturesPage = lazy(() => import('@/public/pages/FeaturesPage'));
const HowItWorksPage = lazy(() => import('@/public/pages/HowItWorksPage'));
const ContractorsPage = lazy(() => import('@/public/pages/ContractorsPage'));
const DisputeProtectionPage = lazy(() => import('@/public/pages/DisputeProtectionPage'));
const TransparencyPage = lazy(() => import('@/public/pages/TransparencyPage'));
const TeamCoordinationPage = lazy(() => import('@/public/pages/TeamCoordinationPage'));
const HomeownersPage = lazy(() => import('@/public/pages/HomeownersPage'));
const ProfessionalsPage = lazy(() => import('@/public/pages/ProfessionalsPage'));
const SubcontractorsPage = lazy(() => import('@/public/pages/SubcontractorsPage'));
const PricingPage = lazy(() => import('@/public/pages/PricingPage'));
const FaqPage = lazy(() => import('@/public/pages/FaqPage'));
const BlogIndexRoute = lazy(() => import('@/public/routes/BlogIndexRoute'));
const BlogPostRoute = lazy(() => import('@/public/routes/BlogPostRoute'));
const ContactRoute = lazy(() => import('@/public/routes/ContactRoute'));
const PrivacyPolicy = lazy(() => import('@/pages/PrivacyPolicy'));
const TermsOfService = lazy(() => import('@/pages/TermsOfService'));
const CookiePolicy = lazy(() => import('@/pages/CookiePolicy'));
import { DEFAULT_LOCALE, getAllLocaleConfigs } from '@/components/i18n/localeConfig';
import { getPublicBasePath, localizePublicPath } from '@/public/lib/localePath';

const RouteFallback = () => null;
const PUBLIC_LOCALE_CONFIGS = getAllLocaleConfigs();
const NON_DEFAULT_PUBLIC_LOCALES = PUBLIC_LOCALE_CONFIGS.filter(({ isDefaultPublicLocale }) => !isDefaultPublicLocale);
const LEGACY_PUBLIC_REDIRECTS = [
  ['/PrivacyPolicy', '/privacy'],
  ['/TermsOfService', '/termini'],
  ['/CookiePolicy', '/cookie'],
];

function PublicLocaleRoutes({ locale, basePath }) {
  return (
    <PublicLayout locale={locale}>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route index element={<HomePage locale={locale} />} />
          <Route path="funzionalita" element={<FeaturesPage locale={locale} />} />
          <Route path="dispute-protection" element={<DisputeProtectionPage locale={locale} />} />
          <Route path="transparency" element={<TransparencyPage locale={locale} />} />
          <Route path="team-coordination" element={<TeamCoordinationPage locale={locale} />} />
          <Route path="contractors" element={<ContractorsPage locale={locale} />} />
          <Route path="per-imprese" element={<Navigate to={localizePublicPath('/contractors', locale)} replace />} />
          <Route path="per-committenti" element={<HomeownersPage locale={locale} />} />
          <Route path="per-subappaltatori" element={<SubcontractorsPage locale={locale} />} />
          <Route path="per-tecnici" element={<ProfessionalsPage locale={locale} />} />
          <Route path="come-funziona" element={<HowItWorksPage locale={locale} />} />
          <Route path="prezzi" element={<PricingPage locale={locale} />} />
          <Route path="faq" element={<FaqPage locale={locale} />} />
          <Route path="contatti" element={<ContactRoute locale={locale} />} />
          <Route path="blog" element={<BlogIndexRoute locale={locale} basePath={basePath} />} />
          <Route path="blog/:slug" element={<BlogPostRoute locale={locale} basePath={basePath} />} />
          <Route path="privacy" element={<PrivacyPolicy />} />
          <Route path="termini" element={<TermsOfService />} />
          <Route path="cookie" element={<CookiePolicy />} />
          <Route path="*" element={<Navigate to={basePath || '/'} replace />} />
        </Routes>
      </Suspense>
    </PublicLayout>
  );
}

export default function PublicSiteRouter() {
  return (
    <Routes>
      {PUBLIC_LOCALE_CONFIGS.flatMap(({ code }) => LEGACY_PUBLIC_REDIRECTS.map(([legacyPath, canonicalPath]) => (
        <Route
          key={`${code}:${legacyPath}`}
          path={localizePublicPath(legacyPath, code)}
          element={<Navigate to={localizePublicPath(canonicalPath, code)} replace />}
        />
      )))}
      {NON_DEFAULT_PUBLIC_LOCALES.map(({ code }) => (
        <Route
          key={code}
          path={`${getPublicBasePath(code)}/*`}
          element={<PublicLocaleRoutes locale={code} basePath={getPublicBasePath(code)} />}
        />
      ))}
      <Route path="/*" element={<PublicLocaleRoutes locale={DEFAULT_LOCALE} basePath={getPublicBasePath(DEFAULT_LOCALE)} />} />
    </Routes>
  );
}
