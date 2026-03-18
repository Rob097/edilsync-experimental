import React, { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/api/appClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const defaultForm = {
  id: null,
  slug: '',
  status: 'draft',
  title_it: '',
  title_en: '',
  excerpt_it: '',
  excerpt_en: '',
  content_markdown_it: '',
  content_markdown_en: '',
  category_id: '',
  author_id: '',
};

function slugify(value) {
  return (value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export default function WebAdminPosts() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(defaultForm);

  const { data: posts = [] } = useQuery({
    queryKey: ['web-admin-posts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('id,slug,status,title_it,title_en,published_at,category:blog_categories(name_it),author:blog_authors(full_name)')
        .order('updated_date', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['web-admin-categories'],
    queryFn: async () => {
      const { data, error } = await supabase.from('blog_categories').select('id,name_it').order('name_it');
      if (error) throw error;
      return data || [];
    },
  });

  const { data: authors = [] } = useQuery({
    queryKey: ['web-admin-authors'],
    queryFn: async () => {
      const { data, error } = await supabase.from('blog_authors').select('id,full_name').order('full_name');
      if (error) throw error;
      return data || [];
    },
  });

  const { data: selectedPost } = useQuery({
    queryKey: ['web-admin-post-detail', form.id],
    enabled: !!form.id,
    queryFn: async () => {
      const { data, error } = await supabase.from('blog_posts').select('*').eq('id', form.id).single();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (selectedPost) {
      setForm((prev) => ({ ...prev, ...selectedPost }));
    }
  }, [selectedPost]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['web-admin-posts'] });
    queryClient.invalidateQueries({ queryKey: ['public-blog-posts'] });
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        ...form,
        slug: form.slug || slugify(form.title_it || form.title_en),
        published_at: form.status === 'published' ? (form.published_at || new Date().toISOString()) : null,
      };

      if (payload.id) {
        const { id, ...updatePayload } = payload;
        const { error } = await supabase.from('blog_posts').update(updatePayload).eq('id', id);
        if (error) throw error;
        return;
      }

      const { id, ...insertPayload } = payload;
      const { error } = await supabase.from('blog_posts').insert(insertPayload);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      setForm(defaultForm);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('blog_posts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      if (form.id) {
        setForm(defaultForm);
      }
    },
  });

  const isSaving = saveMutation.isPending || deleteMutation.isPending;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 grid lg:grid-cols-5 gap-6">
      <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle>{form.id ? 'Edit post' : 'New post'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title_it">Title IT</Label>
            <Input id="title_it" value={form.title_it || ''} onChange={(e) => setForm((p) => ({ ...p, title_it: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="title_en">Title EN</Label>
            <Input id="title_en" value={form.title_en || ''} onChange={(e) => setForm((p) => ({ ...p, title_en: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug">Slug</Label>
            <Input id="slug" value={form.slug || ''} onChange={(e) => setForm((p) => ({ ...p, slug: slugify(e.target.value) }))} />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status || 'draft'} onValueChange={(value) => setForm((p) => ({ ...p, status: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="in_review">In review</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={form.category_id || ''} onValueChange={(value) => setForm((p) => ({ ...p, category_id: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name_it}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Author</Label>
            <Select value={form.author_id || ''} onValueChange={(value) => setForm((p) => ({ ...p, author_id: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select author" />
              </SelectTrigger>
              <SelectContent>
                {authors.map((author) => (
                  <SelectItem key={author.id} value={author.id}>
                    {author.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="excerpt_it">Excerpt IT</Label>
            <Textarea id="excerpt_it" value={form.excerpt_it || ''} onChange={(e) => setForm((p) => ({ ...p, excerpt_it: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="excerpt_en">Excerpt EN</Label>
            <Textarea id="excerpt_en" value={form.excerpt_en || ''} onChange={(e) => setForm((p) => ({ ...p, excerpt_en: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="content_markdown_it">Content IT (Markdown)</Label>
            <Textarea id="content_markdown_it" className="min-h-40" value={form.content_markdown_it || ''} onChange={(e) => setForm((p) => ({ ...p, content_markdown_it: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="content_markdown_en">Content EN (Markdown)</Label>
            <Textarea id="content_markdown_en" className="min-h-40" value={form.content_markdown_en || ''} onChange={(e) => setForm((p) => ({ ...p, content_markdown_en: e.target.value }))} />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button disabled={isSaving} onClick={() => saveMutation.mutate()}>
              {form.id ? 'Update post' : 'Create post'}
            </Button>
            <Button variant="outline" disabled={isSaving} onClick={() => setForm(defaultForm)}>
              Reset
            </Button>
            {form.id ? (
              <Button variant="destructive" disabled={isSaving} onClick={() => deleteMutation.mutate(form.id)}>
                Delete
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Posts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {posts.map((post) => (
            <button
              key={post.id}
              type="button"
              onClick={() => setForm((prev) => ({ ...prev, id: post.id }))}
              className="w-full text-left rounded-lg border border-stone-200 px-3 py-3 hover:border-[#ef6144]/60 transition-colors"
            >
              <p className="font-medium text-slate-900 truncate">{post.title_it || post.title_en || post.slug}</p>
              <p className="text-xs text-slate-500 mt-1">
                {post.status} | {post.category?.name_it || 'No category'} | {post.author?.full_name || 'No author'}
              </p>
            </button>
          ))}
          {posts.length === 0 ? <p className="text-sm text-slate-500">No posts yet.</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}
