import React from 'react';
import { Link, Navigate, Route, Routes } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import WebAdminGuard from '@/web-admin/components/WebAdminGuard';
import WebAdminDashboard from '@/web-admin/pages/WebAdminDashboard';
import WebAdminPosts from '@/web-admin/pages/WebAdminPosts';
import WebAdminCategories from '@/web-admin/pages/WebAdminCategories';
import WebAdminAuthors from '@/web-admin/pages/WebAdminAuthors';
import WebAdminLeads from '@/web-admin/pages/WebAdminLeads';

function Shell({ children }) {
  return (
    <div className="min-h-screen bg-stone-50">
      <header className="border-b border-stone-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-slate-900">EdilSync Web Admin</h1>
            <span className="text-xs uppercase tracking-wide text-slate-500">Hidden area</span>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link to="/web-admin">Overview</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/web-admin/posts">Posts</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/web-admin/categories">Categories</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/web-admin/authors">Authors</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/web-admin/leads">Leads</Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/app">Back to app</Link>
            </Button>
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}

export default function WebAdminRouter() {
  return (
    <WebAdminGuard>
      <Shell>
        <Routes>
          <Route index element={<WebAdminDashboard />} />
          <Route path="posts" element={<WebAdminPosts />} />
          <Route path="categories" element={<WebAdminCategories />} />
          <Route path="authors" element={<WebAdminAuthors />} />
          <Route path="leads" element={<WebAdminLeads />} />
          <Route path="*" element={<Navigate to="/web-admin" replace />} />
        </Routes>
      </Shell>
    </WebAdminGuard>
  );
}
