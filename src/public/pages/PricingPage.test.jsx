/** @vitest-environment jsdom */

import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Scenario IDs: public.pricing-copy-matches-real-billing-model

const pricingState = vi.hoisted(() => ({
  seoCalls: [],
}));

vi.mock('@/public/hooks/usePublicGsap', () => ({
  default: () => {},
}));

vi.mock('@/public/hooks/usePublicSeo', () => ({
  default: (payload) => {
    pricingState.seoCalls.push(payload);
  },
}));

vi.mock('@/public/components/marketing/MarketingFinalCtaSection', () => ({
  default: ({ title, text, ctaLabel, ctaHref, note }) => (
    <div>
      <div>{title}</div>
      <div>{text}</div>
      <div>{ctaLabel}</div>
      <div>{ctaHref}</div>
      <div>{note}</div>
    </div>
  ),
}));

import PricingPage from './PricingPage';

function renderPricing(locale) {
  return render(
    <MemoryRouter>
      <PricingPage locale={locale} />
    </MemoryRouter>,
  );
}

describe('PricingPage', () => {
  beforeEach(() => {
    pricingState.seoCalls = [];
  });

  afterEach(() => {
    cleanup();
  });

  it('renders the italian billing model copy and local links coherently', () => {
    renderPricing('it');

    expect(screen.getByText('Prezzi chiari per società e cantieri.')).toBeTruthy();
    expect(screen.getByText('Il committente resta free. Anche subappaltatori e professionisti partecipano gratis ai cantieri in cui vengono invitati.')).toBeTruthy();
    expect(screen.getByText('EdilSync Pro per società')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Crea account società' }).getAttribute('href')).toBe('/app');
    expect(screen.getByRole('link', { name: 'Vai alla pagina FAQ completa' }).getAttribute('href')).toBe('/faq');
    expect(screen.getByRole('link', { name: 'contattaci' }).getAttribute('href')).toBe('/contatti');
    expect(screen.getByText('/contatti')).toBeTruthy();
    expect(pricingState.seoCalls.at(-1)).toMatchObject({
      title: 'Prezzi',
      canonicalPath: '/prezzi',
      locale: 'it',
    });
  });

  it('renders the english billing model copy and english links coherently', () => {
    renderPricing('en');

    expect(screen.getByText('Clear pricing for companies and worksites.')).toBeTruthy();
    expect(screen.getByText('Homeowners stay free. Subcontractors and professionals also join invited worksites for free.')).toBeTruthy();
    expect(screen.getByText('EdilSync Pro for companies')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Create company account' }).getAttribute('href')).toBe('/app');
    expect(screen.getByRole('link', { name: 'Go to full FAQ page' }).getAttribute('href')).toBe('/en/faq');
    expect(screen.getByRole('link', { name: 'contact us' }).getAttribute('href')).toBe('/en/contatti');
    expect(screen.getByText('/en/contatti')).toBeTruthy();
    expect(pricingState.seoCalls.at(-1)).toMatchObject({
      title: 'Pricing',
      canonicalPath: '/en/prezzi',
      locale: 'en',
    });
  });
});