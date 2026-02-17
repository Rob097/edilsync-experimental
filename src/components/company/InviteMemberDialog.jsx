import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
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

export default function InviteMemberDialog({ open, onOpenChange, companyId }) {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  
  const professions = [
    { value: 'general', label: t('inviteMemberDialog.general') },
    { value: 'architect', label: t('inviteMemberDialog.architect') },
    { value: 'engineer', label: t('inviteMemberDialog.engineer') },
    { value: 'surveyor', label: t('inviteMemberDialog.surveyor') },
    { value: 'designer', label: t('inviteMemberDialog.designer') },
    { value: 'accountant', label: t('inviteMemberDialog.accountant') },
    { value: 'other', label: t('inviteMemberDialog.other') },
  ];
  
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [profession, setProfession] = useState('general');

  const { data: company } = useQuery({
    queryKey: ['company', companyId],
    queryFn: async () => {
      const companies = await base44.entities.Company.filter({ id: companyId });
      return companies[0];
    },
    enabled: !!companyId,
  });

  const inviteMutation = useMutation({
    mutationFn: async () => {
      const member = await base44.entities.CompanyMember.create({
        company_id: companyId,
        user_email: email,
        role: role,
        profession: profession,
        status: 'invited',
      });

      // Find General channel for this company
      const channels = await base44.entities.Channel.filter({ 
        company_id: companyId, 
        type: 'company',
        name: 'General'
      });

      if (channels.length > 0) {
        const generalChannel = channels[0];
        // Add member to General channel
        await base44.entities.ChannelMember.create({
          channel_id: generalChannel.id,
          project_id: null,
          participant_id: member.id,
          user_email: email,
          company_id: companyId,
          last_read_at: new Date().toISOString(),
        });
      }

      // Send notification/email via backend function
      await base44.functions.invoke('sendNotificationOrEmail', {
        action_type: 'company_invite',
        recipient_email: email,
        context_type: 'company',
        context_company_id: companyId,
        notification_data: {
          type: 'company_invite',
          title: 'Invito a nuova società',
          message: `Sei stato invitato a far parte della società "${company?.name}" con ruolo ${role === 'admin' ? 'amministratore' : 'membro'}`,
          related_event_id: companyId,
        },
        email_data: {
          subject: `Invito a nuova società: ${company?.name}`,
          body: `Ciao,\n\nSei stato invitato a far parte della società "${company?.name}" con ruolo ${role === 'admin' ? 'amministratore' : 'membro'}.\n\nAccedi all'applicazione per accettare l'invito.\n\nCordiali saluti,\nIl team EdilSync`,
        },
      });

      return member;
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
    setProfession('general');
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
            <Select value={profession} onValueChange={setProfession}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {professions.map(p => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
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