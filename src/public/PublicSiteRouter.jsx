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
const BlogIndexPage = lazy(() => import('@/public/pages/BlogIndexPage'));
const BlogPostPage = lazy(() => import('@/public/pages/BlogPostPage'));
const ContactPage = lazy(() => import('@/public/pages/ContactPage'));
const PrivacyPolicy = lazy(() => import('@/pages/PrivacyPolicy'));
const TermsOfService = lazy(() => import('@/pages/TermsOfService'));
const CookiePolicy = lazy(() => import('@/pages/CookiePolicy'));

const RouteFallback = () => null;

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
          <Route path="per-imprese" element={<Navigate to={locale === 'en' ? '/en/contractors' : '/contractors'} replace />} />
          <Route path="per-committenti" element={<HomeownersPage locale={locale} />} />
          <Route path="per-subappaltatori" element={<SubcontractorsPage locale={locale} />} />
          <Route path="per-tecnici" element={<ProfessionalsPage locale={locale} />} />
          <Route path="come-funziona" element={<HowItWorksPage locale={locale} />} />
          <Route path="prezzi" element={<PricingPage locale={locale} />} />
          <Route path="faq" element={<FaqPage locale={locale} />} />
          <Route path="contatti" element={<ContactPage locale={locale} />} />
          <Route path="blog" element={<BlogIndexPage locale={locale} basePath={basePath} />} />
          <Route path="blog/:slug" element={<BlogPostPage locale={locale} basePath={basePath} />} />
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
      <Route path="/PrivacyPolicy" element={<Navigate to="/privacy" replace />} />
      <Route path="/TermsOfService" element={<Navigate to="/termini" replace />} />
      <Route path="/CookiePolicy" element={<Navigate to="/cookie" replace />} />
      <Route path="/en/PrivacyPolicy" element={<Navigate to="/en/privacy" replace />} />
      <Route path="/en/TermsOfService" element={<Navigate to="/en/termini" replace />} />
      <Route path="/en/CookiePolicy" element={<Navigate to="/en/cookie" replace />} />
      <Route path="/en/*" element={<PublicLocaleRoutes locale="en" basePath="/en" />} />
      <Route path="/*" element={<PublicLocaleRoutes locale="it" basePath="" />} />
    </Routes>
  );
}
