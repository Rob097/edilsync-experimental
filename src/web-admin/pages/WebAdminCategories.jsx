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
  name_it: '',
  name_en: '',
  name_de: '',
  description_it: '',
  description_en: '',
  description_de: '',
  sort_order: 100,
  is_visible: true,
};

function slugify(value) {
  return (value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export default function WebAdminCategories() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(initialForm);

  const { data: categories = [] } = useQuery({
    queryKey: ['web-admin-categories'],
    queryFn: async () => {
      const { data, error } = await supabase.from('blog_categories').select('*').order('sort_order').order('name_it');
      if (error) throw error;
      return data || [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = { ...form, slug: form.slug || slugify(form.name_it || form.name_en || form.name_de) };

      if (payload.id) {
        const { id, ...updatePayload } = payload;
        const { error } = await supabase.from('blog_categories').update(updatePayload).eq('id', id);
        if (error) throw error;
      } else {
        const { id, ...insertPayload } = payload;
        const { error } = await supabase.from('blog_categories').insert(insertPayload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['web-admin-categories'] });
      setForm(initialForm);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('blog_categories').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['web-admin-categories'] });
      if (form.id) setForm(initialForm);
    },
  });

  const isSaving = saveMutation.isPending || deleteMutation.isPending;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 grid lg:grid-cols-5 gap-6">
      <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle>{form.id ? 'Edit category' : 'New category'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Name IT</Label>
            <Input value={form.name_it} onChange={(e) => setForm((p) => ({ ...p, name_it: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Name EN</Label>
            <Input value={form.name_en || ''} onChange={(e) => setForm((p) => ({ ...p, name_en: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Name DE</Label>
            <Input value={form.name_de || ''} onChange={(e) => setForm((p) => ({ ...p, name_de: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Slug</Label>
            <Input value={form.slug || ''} onChange={(e) => setForm((p) => ({ ...p, slug: slugify(e.target.value) }))} />
          </div>
          <div className="space-y-2">
            <Label>Description IT</Label>
            <Textarea value={form.description_it || ''} onChange={(e) => setForm((p) => ({ ...p, description_it: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Description EN</Label>
            <Textarea value={form.description_en || ''} onChange={(e) => setForm((p) => ({ ...p, description_en: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>Description DE</Label>
            <Textarea value={form.description_de || ''} onChange={(e) => setForm((p) => ({ ...p, description_de: e.target.value }))} />
          </div>
          <div className="grid sm:grid-cols-2 gap-4 items-center">
            <div className="space-y-2">
              <Label>Sort order</Label>
              <Input
                type="number"
                value={form.sort_order}
                onChange={(e) => setForm((p) => ({ ...p, sort_order: Number(e.target.value || 100) }))}
              />
            </div>
            <div className="flex items-center gap-2 pt-6">
              <Switch checked={form.is_visible} onCheckedChange={(value) => setForm((p) => ({ ...p, is_visible: value }))} />
              <Label>Visible</Label>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button disabled={isSaving} onClick={() => saveMutation.mutate()}>
              {form.id ? 'Update category' : 'Create category'}
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
          <CardTitle>Categories</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {categories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => setForm(category)}
              className="w-full text-left rounded-lg border border-stone-200 px-3 py-3 hover:border-[#ef6144]/60 transition-colors"
            >
              <p className="font-medium text-slate-900 truncate">{category.name_it || category.name_en || category.name_de}</p>
              <p className="text-xs text-slate-500 mt-1">
                {category.slug} | order {category.sort_order} | {category.is_visible ? 'visible' : 'hidden'}
              </p>
            </button>
          ))}
          {categories.length === 0 ? <p className="text-sm text-slate-500">No categories yet.</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}
