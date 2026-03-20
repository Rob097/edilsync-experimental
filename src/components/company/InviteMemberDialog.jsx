import React, { useState } from 'react';
import { appClient } from '@/api/appClient';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
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
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { getCompanyMemberRoleOptions } from '@/lib/domainRoles';

export default function InviteMemberDialog({ open, onOpenChange, companyId }) {
  const { t, currentLanguage } = useLanguage();
  const queryClient = useQueryClient();

  const memberRoles = getCompanyMemberRoleOptions(currentLanguage);
  
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [companyMemberRole, setCompanyMemberRole] = useState('worker');

  const { data: company } = useQuery({
    queryKey: ['company', companyId],
    queryFn: async () => {
      const companies = await appClient.entities.Company.filter({ id: companyId });
      return companies[0];
    },
    enabled: !!companyId,
  });

  const inviteMutation = useMutation({
    mutationFn: async () => {
      const result = await appClient.functions.invoke('inviteCompanyMemberWithValidation', {
        company_id: companyId,
        user_email: email,
        role,
        profession: companyMemberRole,
        company_member_role: companyMemberRole,
      });
      return result.member;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['companyMembers', companyId]);
      onOpenChange(false);
      resetForm();
    },
  });

  const resetForm = () => {
    setEmail('');
    setRole('member');
    setCompanyMemberRole('worker');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    inviteMutation.mutate();
  };

  const isValid = email && email.includes('@');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('inviteMemberDialog.title')}</DialogTitle>
          <DialogDescription>
            {t('inviteMemberDialog.description')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div className="space-y-2">
            <Label htmlFor="email">{t('inviteMemberDialog.email')} *</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('inviteMemberDialog.emailPlaceholder')}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>{t('inviteMemberDialog.role')}</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">{t('inviteMemberDialog.admin')}</SelectItem>
                <SelectItem value="member">{t('inviteMemberDialog.member')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t('inviteMemberDialog.profession')}</Label>
            <Select value={companyMemberRole} onValueChange={setCompanyMemberRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {memberRoles.map((memberRole) => (
                  <SelectItem key={memberRole.value} value={memberRole.value}>
                    {memberRole.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              {t('inviteMemberDialog.cancel')}
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-[#ef6144] hover:bg-[#d9553a]"
              disabled={!isValid || inviteMutation.isPending}
            >
              {inviteMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {t('inviteMemberDialog.invite')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}