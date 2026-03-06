import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { appClient } from '@/api/appClient';
import { useEssentialData } from '@/essential/useEssentialData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { useLanguage } from '@/components/i18n/useLanguage';
import { getCompanyTypeOptions } from '@/lib/domainRoles';

export default function EssentialNewCompany() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { currentLanguage } = useLanguage();
  const tr = (itText, enText) => (currentLanguage === 'it' ? itText : enText);
  const { user } = useEssentialData();

  const [formData, setFormData] = useState({
    name: '',
    company_type: 'general_contractor',
    vat_number: '',
    address: '',
    phone: '',
    email: '',
    description: '',
  });

  const createCompanyMutation = useMutation({
    mutationFn: async (payload) => {
      const company = await appClient.entities.Company.create({
        name: payload.name,
        company_type: payload.company_type,
        vat_number: payload.vat_number || null,
        address: payload.address || null,
        phone: payload.phone || null,
        email: payload.email || null,
        description: payload.description || null,
      });

      const companyMember = await appClient.entities.CompanyMember.create({
        company_id: company.id,
        user_id: user?.id,
        user_email: user?.email,
        role: 'admin',
        profession: 'owner_admin',
        company_member_role: 'owner_admin',
        status: 'active',
      });

      const channel = await appClient.entities.Channel.create({
        project_id: null,
        company_id: company.id,
        name: 'General',
        type: 'company',
        description: tr('Canale generale per comunicazioni all\'interno della società', 'General channel for company communications'),
        created_by_email: user?.email,
      });

      await appClient.entities.ChannelMember.create({
        channel_id: channel.id,
        project_id: null,
        participant_id: companyMember.id,
        user_email: user?.email,
        company_id: company.id,
        last_read_at: new Date().toISOString(),
      });

      const currentCompanyIds = user?.company_ids || [];
      const currentAdminIds = user?.admin_company_ids || [];
      await appClient.auth.updateMe({
        company_ids: [...new Set([...currentCompanyIds, company.id])],
        admin_company_ids: [...new Set([...currentAdminIds, company.id])],
      });

      return company;
    },
    onSuccess: async (company) => {
      await queryClient.invalidateQueries({ queryKey: ['companies'] });
      await queryClient.invalidateQueries({ queryKey: ['userCompanies'] });
      navigate(`/essenziale/societa/${company.id}`);
    },
  });

  return (
    <div className="space-y-5">
      <Card className="border-[#ef6144]/20 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">{tr('Nuova società', 'New company')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>{tr('Tipologia società', 'Company type')}</Label>
            <Select
              value={formData.company_type}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, company_type: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {getCompanyTypeOptions(currentLanguage).map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">{tr('Nome società', 'Company name')}</Label>
            <Input id="name" value={formData.name} onChange={(event) => setFormData((prev) => ({ ...prev, name: event.target.value }))} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="vat">{tr('P.IVA (opzionale)', 'VAT (optional)')}</Label>
            <Input id="vat" value={formData.vat_number} onChange={(event) => setFormData((prev) => ({ ...prev, vat_number: event.target.value }))} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">{tr('Indirizzo', 'Address')}</Label>
            <Input id="address" value={formData.address} onChange={(event) => setFormData((prev) => ({ ...prev, address: event.target.value }))} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="phone">{tr('Telefono', 'Phone')}</Label>
              <Input id="phone" value={formData.phone} onChange={(event) => setFormData((prev) => ({ ...prev, phone: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={formData.email} onChange={(event) => setFormData((prev) => ({ ...prev, email: event.target.value }))} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{tr('Descrizione', 'Description')}</Label>
            <Textarea id="description" rows={3} value={formData.description} onChange={(event) => setFormData((prev) => ({ ...prev, description: event.target.value }))} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <Button variant="outline" onClick={() => navigate('/essenziale/societa')}>
              {tr('Annulla', 'Cancel')}
            </Button>
            <Button className="bg-[#ef6144] hover:bg-[#d9553a] text-white" onClick={() => createCompanyMutation.mutate(formData)} disabled={createCompanyMutation.isPending || !formData.name.trim()}>
              {createCompanyMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              {tr('Crea società', 'Create company')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
