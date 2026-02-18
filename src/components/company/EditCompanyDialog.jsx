import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '@/components/i18n/useLanguage';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

export default function EditCompanyDialog({ open, onOpenChange, company }) {
  const { t, currentLanguage } = useLanguage();
  const tr = (itText, enText) => currentLanguage === 'it' ? itText : enText;
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    name: '',
    vat_number: '',
    address: '',
    phone: '',
    email: '',
    description: '',
  });

  useEffect(() => {
    if (company) {
      setFormData({
        name: company.name || '',
        vat_number: company.vat_number || '',
        address: company.address || '',
        phone: company.phone || '',
        email: company.email || '',
        description: company.description || '',
      });
    }
  }, [company]);

  const updateCompanyMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.entities.Company.update(company.id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['company']);
      queryClient.invalidateQueries(['companies']);
      onOpenChange(false);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    updateCompanyMutation.mutate(formData);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('editCompanyDialog.title')}</DialogTitle>
          <DialogDescription>
            {t('editCompanyDialog.description')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="name">{t('editCompanyDialog.companyName')} *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="vat_number">{t('editCompanyDialog.vatNumber')}</Label>
            <Input
              id="vat_number"
              value={formData.vat_number}
              onChange={(e) => handleChange('vat_number', e.target.value)}
              placeholder="12345678901"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">{t('editCompanyDialog.address')}</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              placeholder={tr('Via Roma 15, 20121 Milano', '15 Rome Street, 20121 Milan')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">{t('editCompanyDialog.phone')}</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="+39 02 1234567"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">{t('editCompanyDialog.email')}</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder={tr('info@azienda.it', 'info@company.com')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t('editCompanyDialog.description')}</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder={tr('Breve descrizione della società...', 'Short company description...')}
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              {t('editCompanyDialog.cancel')}
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-[#ef6144] hover:bg-[#d9553a]"
              disabled={updateCompanyMutation.isPending}
            >
              {updateCompanyMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {t('editCompanyDialog.save')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}