/** @vitest-environment jsdom */

import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

vi.mock('@/web-admin/components/WebAdminGuard', () => ({
  default: ({ children }) => <div>{children}</div>,
}));

vi.mock('@/web-admin/pages/WebAdminDashboard', () => ({ default: () => <div>web-admin-dashboard</div> }));
vi.mock('@/web-admin/pages/WebAdminPosts', () => ({ default: () => <div>web-admin-posts</div> }));
vi.mock('@/web-admin/pages/WebAdminCategories', () => ({ default: () => <div>web-admin-categories</div> }));
vi.mock('@/web-admin/pages/WebAdminAuthors', () => ({ default: () => <div>web-admin-authors</div> }));
vi.mock('@/web-admin/pages/WebAdminLeads', () => ({ default: () => <div>web-admin-leads</div> }));

import WebAdminRouter from './WebAdminRouter';

const renderRouter = (entry) => render(
  <MemoryRouter initialEntries={[entry]}>
    <Routes>
      <Route path="/web-admin/*" element={<WebAdminRouter />} />
    </Routes>
  </MemoryRouter>,
);

describe('WebAdminRouter', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders the admin dashboard on the index route', () => {
    renderRouter('/web-admin');

    expect(screen.getByText('web-admin-dashboard')).toBeTruthy();
  });

  it('renders the posts page on /web-admin/posts', () => {
    renderRouter('/web-admin/posts');

    expect(screen.getByText('web-admin-posts')).toBeTruthy();
  });

  it('renders the leads page on /web-admin/leads', () => {
    renderRouter('/web-admin/leads');

    expect(screen.getByText('web-admin-leads')).toBeTruthy();
  });

  it('redirects unknown routes back to /web-admin', async () => {
    renderRouter('/web-admin/unknown');

    await waitFor(() => {
      expect(screen.getByText('web-admin-dashboard')).toBeTruthy();
    });
  });
});