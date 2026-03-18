import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supabase } from '@/api/appClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

async function countTable(table) {
  const { count, error } = await supabase
    .from(table)
    .select('*', { count: 'exact', head: true });

  if (error) throw error;
  return count || 0;
}

export default function WebAdminDashboard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['web-admin-counts'],
    queryFn: async () => {
      const [posts, categories, authors] = await Promise.all([
        countTable('blog_posts'),
        countTable('blog_categories'),
        countTable('blog_authors'),
      ]);

      return { posts, categories, authors };
    },
  });

  if (isLoading) {
    return <div className="p-8">Loading...</div>;
  }

  if (error) {
    return <div className="p-8 text-red-600">Unable to load web admin data.</div>;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-3xl font-semibold text-slate-900">Web Admin</h1>
        <Button asChild>
          <Link to="/app">Back to app</Link>
        </Button>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Posts</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{data.posts}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{data.categories}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Authors</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{data.authors}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Editorial workflow</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-slate-700">
          <p>This endpoint is intentionally hidden and admin-gated at /web-admin.</p>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link to="/web-admin/posts">Manage posts</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/web-admin/categories">Manage categories</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/web-admin/authors">Manage authors</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/web-admin/leads">Manage leads</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
