/** @vitest-environment jsdom */

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const contentState = vi.hoisted(() => ({
  listPublishedPosts: vi.fn(),
}));

vi.mock('@/public/api/contentClient', () => ({
  contentClient: {
    listPublishedPosts: contentState.listPublishedPosts,
  },
}));

vi.mock('@/public/hooks/usePublicSeo', () => ({ default: () => {} }));
vi.mock('@/public/hooks/usePublicGsap', () => ({ default: () => {} }));

import BlogIndexPage from './BlogIndexPage';

function renderBlogIndex(locale = 'it') {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  return render(
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>
        <BlogIndexPage locale={locale} basePath="" />
      </QueryClientProvider>
    </MemoryRouter>,
  );
}

describe('BlogIndexPage', () => {
  beforeEach(() => {
    contentState.listPublishedPosts.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders the empty state when there are no published posts', async () => {
    contentState.listPublishedPosts.mockResolvedValue([]);

    renderBlogIndex();

    await waitFor(() => {
      expect(screen.getByText(/nessun/i)).toBeTruthy();
    });
  });

  it('renders published blog posts with localized title and excerpt', async () => {
    contentState.listPublishedPosts.mockResolvedValue([
      {
        id: 'post-1',
        slug: 'cantiere-digitale',
        title_it: 'Cantiere digitale',
        excerpt_it: 'Come coordinare persone e impresa senza perdere informazioni.',
        published_at: '2026-04-14T10:00:00.000Z',
        category: { name_it: 'Blog' },
        author: null,
      },
    ]);

    renderBlogIndex();

    await waitFor(() => {
      expect(screen.getByText('Cantiere digitale')).toBeTruthy();
    });
    expect(screen.getByText('Come coordinare persone e impresa senza perdere informazioni.')).toBeTruthy();
  });

  it('renders published blog posts with german localized title and excerpt when available', async () => {
    contentState.listPublishedPosts.mockResolvedValue([
      {
        id: 'post-1',
        slug: 'digitale-baustelle',
        title_it: 'Cantiere digitale',
        title_en: 'Digital worksite',
        title_de: 'Digitale Baustelle',
        excerpt_it: 'Come coordinare persone e impresa senza perdere informazioni.',
        excerpt_en: 'How to coordinate people and company without losing information.',
        excerpt_de: 'Wie man Menschen und Unternehmen koordiniert, ohne Informationen zu verlieren.',
        published_at: '2026-04-14T10:00:00.000Z',
        category: { name_it: 'Blog', name_en: 'Blog', name_de: 'Blog' },
        author: null,
      },
    ]);

    renderBlogIndex('de');

    await waitFor(() => {
      expect(screen.getByText('Digitale Baustelle')).toBeTruthy();
    });
    expect(screen.getByText('Wie man Menschen und Unternehmen koordiniert, ohne Informationen zu verlieren.')).toBeTruthy();
  });

  it('falls back from german to english before italian when german content is missing', async () => {
    contentState.listPublishedPosts.mockResolvedValue([
      {
        id: 'post-1',
        slug: 'digitale-baustelle',
        title_it: 'Cantiere digitale',
        title_en: 'Digital worksite',
        excerpt_it: 'Come coordinare persone e impresa senza perdere informazioni.',
        excerpt_en: 'How to coordinate people and company without losing information.',
        published_at: '2026-04-14T10:00:00.000Z',
        category: { name_it: 'Blog', name_en: 'Blog' },
        author: null,
      },
    ]);

    renderBlogIndex('de');

    await waitFor(() => {
      expect(screen.getByText('Digital worksite')).toBeTruthy();
    });
    expect(screen.getByText('How to coordinate people and company without losing information.')).toBeTruthy();
  });
});