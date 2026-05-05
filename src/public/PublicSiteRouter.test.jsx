/** @vitest-environment jsdom */

import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('@/public/components/PublicLayout', () => ({
  default: ({ locale, children }) => <div data-testid={`layout-${locale}`}>{children}</div>,
}));

function pageMock(label) {
  return { default: ({ locale }) => <div>{`${label}:${locale || 'none'}`}</div> };
}

vi.mock('@/public/pages/HomePage', () => pageMock('home'));
vi.mock('@/public/pages/FeaturesPage', () => pageMock('features'));
vi.mock('@/public/pages/HowItWorksPage', () => pageMock('how-it-works'));
vi.mock('@/public/pages/ContractorsPage', () => pageMock('contractors'));
vi.mock('@/public/pages/DisputeProtectionPage', () => pageMock('dispute-protection'));
vi.mock('@/public/pages/TransparencyPage', () => pageMock('transparency'));
vi.mock('@/public/pages/TeamCoordinationPage', () => pageMock('team-coordination'));
vi.mock('@/public/pages/HomeownersPage', () => pageMock('homeowners'));
vi.mock('@/public/pages/ProfessionalsPage', () => pageMock('professionals'));
vi.mock('@/public/pages/SubcontractorsPage', () => pageMock('subcontractors'));
vi.mock('@/public/pages/PricingPage', () => pageMock('pricing'));
vi.mock('@/public/pages/FaqPage', () => pageMock('faq'));
vi.mock('@/public/pages/BlogIndexPage', () => ({ default: ({ locale, basePath }) => <div>{`blog-index:${locale}:${basePath}`}</div> }));
vi.mock('@/public/pages/BlogPostPage', () => ({ default: ({ locale, basePath }) => <div>{`blog-post:${locale}:${basePath}`}</div> }));
vi.mock('@/public/pages/ContactPage', () => pageMock('contact'));
vi.mock('@/pages/PrivacyPolicy', () => ({ default: () => <div>privacy-page</div> }));
vi.mock('@/pages/TermsOfService', () => ({ default: () => <div>terms-page</div> }));
vi.mock('@/pages/CookiePolicy', () => ({ default: () => <div>cookie-page</div> }));

import PublicSiteRouter from './PublicSiteRouter';

const renderRouter = (entry) => render(
  <MemoryRouter initialEntries={[entry]}>
    <PublicSiteRouter />
  </MemoryRouter>,
);

describe('PublicSiteRouter', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders the italian home page for the public root route', () => {
    renderRouter('/');

    expect(screen.getByText('home:it')).toBeTruthy();
  });

  it('resolves english localized pages under /en', () => {
    renderRouter('/en/prezzi');

    return screen.findByText('pricing:en').then((element) => {
      expect(element).toBeTruthy();
    });
  });

  it('redirects legacy legal paths to the localized public legal pages', async () => {
    renderRouter('/PrivacyPolicy');

    await waitFor(() => {
      expect(screen.getByText('privacy-page')).toBeTruthy();
    });
  });

  it('redirects role aliases like /per-imprese to the contractors page', async () => {
    renderRouter('/per-imprese');

    await waitFor(() => {
      expect(screen.getByText('contractors:it')).toBeTruthy();
    });
  });

  it('falls back to the locale home page for unknown routes', async () => {
    renderRouter('/en/unknown-path');

    await waitFor(() => {
      expect(screen.getByText('home:en')).toBeTruthy();
    });
  });
});