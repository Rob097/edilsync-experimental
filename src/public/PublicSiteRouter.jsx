import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import PublicLayout from '@/public/components/PublicLayout';
import HomePage from '@/public/pages/HomePage';
import FeaturesPage from '@/public/pages/FeaturesPage';
import HowItWorksPage from '@/public/pages/HowItWorksPage';
import ContractorsPage from '@/public/pages/ContractorsPage';
import HomeownersPage from '@/public/pages/HomeownersPage';
import ProfessionalsPage from '@/public/pages/ProfessionalsPage';
import SubcontractorsPage from '@/public/pages/SubcontractorsPage';
import StaticMarketingPage from '@/public/pages/StaticMarketingPage';
import BlogIndexPage from '@/public/pages/BlogIndexPage';
import BlogPostPage from '@/public/pages/BlogPostPage';
import ContactPage from '@/public/pages/ContactPage';
import PrivacyPolicy from '@/pages/PrivacyPolicy';
import TermsOfService from '@/pages/TermsOfService';
import CookiePolicy from '@/pages/CookiePolicy';

function PublicLocaleRoutes({ locale, basePath }) {
  return (
    <PublicLayout locale={locale}>
      <Routes>
        <Route index element={<HomePage locale={locale} />} />
        <Route path="funzionalita" element={<FeaturesPage locale={locale} />} />
        <Route path="contractors" element={<ContractorsPage locale={locale} />} />
        <Route path="per-imprese" element={<Navigate to={locale === 'en' ? '/en/contractors' : '/contractors'} replace />} />
        <Route path="per-committenti" element={<HomeownersPage locale={locale} />} />
        <Route path="per-subappaltatori" element={<SubcontractorsPage locale={locale} />} />
        <Route path="per-tecnici" element={<ProfessionalsPage locale={locale} />} />
        <Route path="come-funziona" element={<HowItWorksPage locale={locale} />} />
        <Route path="prezzi" element={<StaticMarketingPage locale={locale} pageKey="prezzi" />} />
        <Route path="faq" element={<StaticMarketingPage locale={locale} pageKey="faq" />} />
        <Route path="contatti" element={<ContactPage locale={locale} />} />
        <Route path="blog" element={<BlogIndexPage locale={locale} basePath={basePath} />} />
        <Route path="blog/:slug" element={<BlogPostPage locale={locale} basePath={basePath} />} />
        <Route path="privacy" element={<PrivacyPolicy />} />
        <Route path="termini" element={<TermsOfService />} />
        <Route path="cookie" element={<CookiePolicy />} />
        <Route path="*" element={<Navigate to={basePath || '/'} replace />} />
      </Routes>
    </PublicLayout>
  );
}

export default function PublicSiteRouter() {
  return (
    <Routes>
      <Route path="/PrivacyPolicy" element={<Navigate to="/privacy" replace />} />
      <Route path="/TermsOfService" element={<Navigate to="/termini" replace />} />
      <Route path="/CookiePolicy" element={<Navigate to="/cookie" replace />} />
      <Route path="/en/*" element={<PublicLocaleRoutes locale="en" basePath="/en" />} />
      <Route path="/*" element={<PublicLocaleRoutes locale="it" basePath="" />} />
    </Routes>
  );
}
