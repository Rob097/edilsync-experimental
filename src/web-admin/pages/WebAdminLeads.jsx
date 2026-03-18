import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/api/appClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const statusOptions = ['new', 'contacted', 'qualified', 'archived'];

export default function WebAdminLeads() {
  const queryClient = useQueryClient();

  const { data: leads = [], isLoading, error } = useQuery({
    queryKey: ['web-admin-leads'],
    queryFn: async () => {
      const { data, error: queryError } = await supabase
        .from('demo_requests')
        .select('*')
        .order('created_date', { ascending: false });
      if (queryError) throw queryError;
      return data || [];
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      const { error: updateError } = await supabase.from('demo_requests').update({ status }).eq('id', id);
      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['web-admin-leads'] });
    },
  });

  if (isLoading) {
    return <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">Loading...</div>;
  }

  if (error) {
    return <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 text-red-600">Unable to load lead requests.</div>;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-4">
      <h1 className="text-3xl font-semibold text-slate-900">Demo requests</h1>
      {leads.map((lead) => (
        <Card key={lead.id}>
          <CardHeader>
            <CardTitle className="text-lg">{lead.full_name} - {lead.email}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-700">
            <p><strong>Company:</strong> {lead.company_name || '-'}</p>
            <p><strong>Role:</strong> {lead.role_label || '-'}</p>
            <p><strong>Locale:</strong> {lead.locale}</p>
            <p><strong>Source:</strong> {lead.source_path || '-'}</p>
            <p><strong>Message:</strong> {lead.message || '-'}</p>
            <div className="max-w-52">
              <Select
                value={lead.status}
                onValueChange={(value) => updateMutation.mutate({ id: lead.id, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      ))}
      {leads.length === 0 ? <p className="text-sm text-slate-500">No requests yet.</p> : null}
    </div>
  );
}
