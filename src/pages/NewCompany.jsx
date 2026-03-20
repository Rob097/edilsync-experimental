import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { appClient } from '@/api/appClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '@/components/i18n/useLanguage';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Loader2 } from "lucide-react";
import { getCompanyTypeOptions } from '@/lib/domainRoles';

export default function NewCompany() {
  const { t, currentLanguage } = useLanguage();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    name: '',
    company_type: 'general_contractor',
    vat_number: '',
    address: '',
    phone: '',
    email: '',
    description: '',
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => appClient.auth.me(),
  });

  const createCompanyMutation = useMutation({
    mutationFn: async (data) => {
      const result = await appClient.functions.invoke('createCompanyWithInitialization', data);
      return result.company;
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

  const companyTypeOptions = getCompanyTypeOptions(currentLanguage);

  return (
    <div className="max-w-2xl mx-auto">
      <Button
        variant="ghost"
        onClick={() => navigate(-1)}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        {t('common.back')}
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>{t('newCompany.title')}</CardTitle>
          <CardDescription>
            {t('newCompany.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">{t('newCompany.companyName')} *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder={t('newCompany.companyNamePlaceholder')}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>{t('newCompany.companyType')}</Label>
              <Select value={formData.company_type} onValueChange={(value) => handleChange('company_type', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {companyTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="vat_number">{t('newCompany.vatNumber')}</Label>
              <Input
                id="vat_number"
                value={formData.vat_number}
                onChange={(e) => handleChange('vat_number', e.target.value)}
                placeholder={t('newCompany.vatNumberPlaceholder')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">{t('newCompany.address')}</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                placeholder={t('newCompany.addressPlaceholder')}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">{t('newCompany.phone')}</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder={t('newCompany.phonePlaceholder')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">{t('newCompany.email')}</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder={t('newCompany.emailPlaceholder')}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{t('newCompany.description')}</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder={t('newCompany.descriptionPlaceholder')}
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
                {t('newCompany.cancel')}
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-[#ef6144] hover:bg-[#d9553a]"
                disabled={createCompanyMutation.isPending}
              >
                {createCompanyMutation.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                {t('newCompany.create')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}