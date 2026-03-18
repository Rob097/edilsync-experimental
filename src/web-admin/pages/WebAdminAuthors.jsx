import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/api/appClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';

const initialForm = {
  id: null,
  slug: '',
  full_name: '',
  role_title_it: '',
  role_title_en: '',
  bio_it: '',
  bio_en: '',
  avatar_url: '',
  linkedin_url: '',
  is_active: true,
};

function slugify(value) {
  return (value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export default function WebAdminAuthors() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(initialForm);

  const { data: authors = [] } = useQuery({
    queryKey: ['web-admin-authors'],
    queryFn: async () => {
      const { data, error } = await supabase.from('blog_authors').select('*').order('full_name');
      if (error) throw error;
      return data || [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = { ...form, slug: form.slug || slugify(form.full_name) };

      if (payload.id) {
        const { id, ...updatePayload } = payload;
        const { error } = await supabase.from('blog_authors').update(updatePayload).eq('id', id);
        if (error) throw error;
      } else {
        const { id, ...insertPayload } = payload;
        const { error } = await supabase.from('blog_authors').insert(insertPayload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['web-admin-authors'] });
      setForm(initialForm);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('blog_authors').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['web-admin-authors'] });
      if (form.id) setForm(initialForm);
    },
  });

  const isSaving = saveMutation.isPending || deleteMutation.isPending;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 grid lg:grid-cols-5 gap-6">
      <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle>{form.id ? 'Edit author' : 'New author'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Full name</Label>
            <Input value={form.full_name} onChange={(e) => setForm((p) => ({ ...p, full_name: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Slug</Label>
            <Input value={form.slug || ''} onChange={(e) => setForm((p) => ({ ...p, slug: slugify(e.target.value) }))} />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Role title IT</Label>
              <Input value={form.role_title_it || ''} onChange={(e) => setForm((p) => ({ ...p, role_title_it: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Role title EN</Label>
              <Input value={form.role_title_en || ''} onChange={(e) => setForm((p) => ({ ...p, role_title_en: e.target.value }))} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Bio IT</Label>
            <Textarea value={form.bio_it || ''} onChange={(e) => setForm((p) => ({ ...p, bio_it: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Bio EN</Label>
            <Textarea value={form.bio_en || ''} onChange={(e) => setForm((p) => ({ ...p, bio_en: e.target.value }))} />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Avatar URL</Label>
              <Input value={form.avatar_url || ''} onChange={(e) => setForm((p) => ({ ...p, avatar_url: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>LinkedIn URL</Label>
              <Input value={form.linkedin_url || ''} onChange={(e) => setForm((p) => ({ ...p, linkedin_url: e.target.value }))} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={form.is_active} onCheckedChange={(value) => setForm((p) => ({ ...p, is_active: value }))} />
            <Label>Active</Label>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button disabled={isSaving} onClick={() => saveMutation.mutate()}>
              {form.id ? 'Update author' : 'Create author'}
            </Button>
            <Button variant="outline" disabled={isSaving} onClick={() => setForm(initialForm)}>
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
          <CardTitle>Authors</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {authors.map((author) => (
            <button
              key={author.id}
              type="button"
              onClick={() => setForm(author)}
              className="w-full text-left rounded-lg border border-stone-200 px-3 py-3 hover:border-[#ef6144]/60 transition-colors"
            >
              <p className="font-medium text-slate-900 truncate">{author.full_name}</p>
              <p className="text-xs text-slate-500 mt-1">
                {author.slug} | {author.is_active ? 'active' : 'inactive'}
              </p>
            </button>
          ))}
          {authors.length === 0 ? <p className="text-sm text-slate-500">No authors yet.</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}
