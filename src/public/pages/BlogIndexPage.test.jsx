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

function renderBlogIndex() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  return render(
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>
        <BlogIndexPage locale="it" basePath="" />
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
});