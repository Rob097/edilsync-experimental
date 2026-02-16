import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Loader2 } from "lucide-react";

export default function NewCompany() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    name: '',
    vat_number: '',
    address: '',
    phone: '',
    email: '',
    description: '',
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const createCompanyMutation = useMutation({
    mutationFn: async (data) => {
      // Create company
      const company = await base44.entities.Company.create(data);

      // Add current user as admin
      const companyMember = await base44.entities.CompanyMember.create({
        company_id: company.id,
        user_id: user?.id,
        user_email: user?.email,
        role: 'admin',
        profession: 'general',
        status: 'active',
      });

      // Create General channel for company
      const channel = await base44.entities.Channel.create({
        project_id: null,
        company_id: company.id,
        name: 'General',
        type: 'company',
        description: 'Canale generale per comunicazioni all\'interno della società',
        created_by_email: user?.email,
      });

      // Add current user as channel member
      await base44.entities.ChannelMember.create({
        channel_id: channel.id,
        project_id: null,
        participant_id: companyMember.id,
        user_email: user?.email,
        company_id: company.id,
        last_read_at: new Date().toISOString(),
      });

      // Immediately update user access arrays (so RLS works without waiting for automation)
      const currentCompanyIds = user?.company_ids || [];
      const currentAdminIds = user?.admin_company_ids || [];
      await base44.auth.updateMe({
        company_ids: [...new Set([...currentCompanyIds, company.id])],
        admin_company_ids: [...new Set([...currentAdminIds, company.id])],
      });

      return company;
    },
    onSuccess: (company) => {
      queryClient.invalidateQueries(['companies']);
      queryClient.invalidateQueries(['userCompanies']);
      navigate(createPageUrl('CompanyDetail') + `?id=${company.id}`);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createCompanyMutation.mutate(formData);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Button
        variant="ghost"
        onClick={() => navigate(-1)}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Indietro
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Nuova Società</CardTitle>
          <CardDescription>
            Crea una nuova società. Sarai automaticamente aggiunto come amministratore.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Nome società *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Es. Edil Roma S.r.l."
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="vat_number">Partita IVA</Label>
              <Input
                id="vat_number"
                value={formData.vat_number}
                onChange={(e) => handleChange('vat_number', e.target.value)}
                placeholder="Es. IT12345678901"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Indirizzo sede</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                placeholder="Es. Via Milano 25, 00100 Roma"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Telefono</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="Es. +39 06 1234567"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="Es. info@edilroma.it"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrizione</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Descrivi brevemente l'attività della società..."
                rows={3}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(-1)}
                className="flex-1"
              >
                Annulla
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-[#ef6144] hover:bg-[#d9553a]"
                disabled={createCompanyMutation.isPending}
              >
                {createCompanyMutation.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Crea Società
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}