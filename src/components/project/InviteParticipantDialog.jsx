import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { listUserPublicProfilesSafe } from '@/api/userPublicProfiles';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Building2, User } from "lucide-react";

export default function InviteParticipantDialog({ 
  open, 
  onOpenChange, 
  projectId,
  currentUserParticipation 
}) {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  
  const projectRoles = [
    { value: 'contractor', label: t('inviteParticipantDialog.contractor'), description: t('inviteParticipantDialog.contractorDesc') },
    { value: 'subcontractor', label: t('inviteParticipantDialog.subcontractor'), description: t('inviteParticipantDialog.subcontractorDesc') },
    { value: 'architect', label: t('inviteParticipantDialog.architectRole'), description: t('inviteParticipantDialog.architectDesc') },
    { value: 'engineer', label: t('inviteParticipantDialog.engineer'), description: t('inviteParticipantDialog.engineerDesc') },
    { value: 'surveyor', label: t('inviteParticipantDialog.surveyor'), description: t('inviteParticipantDialog.surveyorDesc') },
    { value: 'designer', label: t('inviteParticipantDialog.designer'), description: t('inviteParticipantDialog.designerDesc') },
    { value: 'consultant', label: t('inviteParticipantDialog.consultant'), description: t('inviteParticipantDialog.consultantDesc') },
  ];
  
  const [participantType, setParticipantType] = useState('company');
  const [email, setEmail] = useState('');
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [projectRole, setProjectRole] = useState('');

  const { data: allCompanies = [] } = useQuery({
    queryKey: ['allCompanies'],
    queryFn: () => base44.entities.Company.list(),
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: companyMemberships = [] } = useQuery({
    queryKey: ['userCompanyMemberships', user?.email],
    queryFn: () => base44.entities.CompanyMember.filter({ user_email: user?.email, status: 'active' }),
    enabled: !!user?.email,
  });

  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const projects = await base44.entities.Project.filter({ id: projectId });
      return projects[0];
    },
    enabled: !!projectId,
  });

  const inviteMutation = useMutation({
    mutationFn: async () => {
      // Security check: If inviting as company, user must be admin of that company
      if (participantType === 'company' && selectedCompanyId) {
        const membership = companyMemberships.find(m => m.company_id === selectedCompanyId);
        if (!membership || membership.role !== 'admin') {
          throw new Error('Solo gli amministratori della società possono invitare partecipanti a nome della società');
        }
      }

      const participantData = {
        project_id: projectId,
        participant_type: participantType,
        project_role: projectRole,
        status: 'invited',
        can_invite: projectRole === 'contractor', // Contractors can invite subcontractors
      };

      if (participantType === 'company') {
        participantData.company_id = selectedCompanyId;
      } else {
        participantData.user_email = email;
        // Try to find user_id
        const users = await base44.entities.User.list();
        const foundUser = users.find(u => u.email === email);
        if (foundUser) {
          participantData.user_id = foundUser.id;
        }
      }

      // If current user is a contractor, mark this as a subcontractor invite
      if (currentUserParticipation?.project_role === 'contractor') {
        participantData.invited_by_company_id = currentUserParticipation.company_id;
      }

      const participant = await base44.entities.ProjectParticipant.create(participantData);

      // Find General channel for this project
      const channels = await base44.entities.Channel.filter({ 
        project_id: projectId, 
        type: 'general',
        name: 'General'
      });

      if (channels.length > 0) {
        const generalChannel = channels[0];
        // Add participant to General channel
        await base44.entities.ChannelMember.create({
          channel_id: generalChannel.id,
          project_id: projectId,
          participant_id: participant.id,
          user_email: participantType === 'personal' ? email : null,
          company_id: participantType === 'company' ? selectedCompanyId : null,
          last_read_at: new Date().toISOString(),
        });
      }

      // Send notification/email via backend function
      if (participantType === 'company') {
        const companyMembers = await base44.entities.CompanyMember.filter({ 
          company_id: selectedCompanyId, 
          status: 'active',
          role: 'admin'
        });
        
        const company = allCompanies.find(c => c.id === selectedCompanyId);
        
        // Send notifications to company admins only
        for (const member of companyMembers) {
          await base44.functions.invoke('sendNotificationOrEmail', {
            action_type: 'project_invite',
            recipient_email: member.user_email,
            context_type: 'company',
            context_company_id: selectedCompanyId,
            notification_data: {
              type: 'project_invite',
              title: 'Invito a nuovo progetto',
              message: `La tua società è stata invitata al progetto "${project?.name}" con ruolo ${projectRole}`,
              related_event_id: projectId,
            },
            email_data: null, // No email to individual members
          });
        }
        
        // Send email only to company email address if exists
        if (company?.email) {
          await base44.functions.invoke('sendNotificationOrEmail', {
            action_type: 'project_invite',
            recipient_email: company.email,
            context_type: 'company',
            context_company_id: selectedCompanyId,
            skip_preferences_check: true, // Skip preferences check for company email
            notification_data: null, // No notification to company email
            email_data: {
              subject: `Invito a nuovo progetto: ${project?.name}`,
              body: `Gentile ${company?.name},\n\nLa vostra società è stata invitata al progetto "${project?.name}" con ruolo ${projectRole}.\n\nI membri della società riceveranno una notifica nell'applicazione.\n\nCordiali saluti,\nIl team EdilSync`,
            },
          });
        }
      } else {
        await base44.functions.invoke('sendNotificationOrEmail', {
          action_type: 'project_invite',
          recipient_email: email,
          context_type: 'personal',
          notification_data: {
            type: 'project_invite',
            title: 'Invito a nuovo progetto',
            message: `Sei stato invitato al progetto "${project?.name}" con ruolo ${projectRole}`,
            related_event_id: projectId,
          },
          email_data: {
            subject: `Invito a nuovo progetto: ${project?.name}`,
            body: `Ciao,\n\nSei stato invitato al progetto "${project?.name}" con ruolo ${projectRole}.\n\nAccedi all'applicazione per visualizzare i dettagli del progetto.\n\nCordiali saluti,\nIl team EdilSync`,
          },
        });
      }

      return participant;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectParticipants', projectId] });
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['channelMembers', projectId] });
      }, 500);
      onOpenChange(false);
      resetForm();
    },
  });

  const resetForm = () => {
    setParticipantType('company');
    setEmail('');
    setSelectedCompanyId('');
    setProjectRole('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    inviteMutation.mutate();
  };

  const isValid = projectRole && (
    (participantType === 'company' && selectedCompanyId) ||
    (participantType === 'personal' && email)
  );

  // Filter available roles based on who is inviting
  const availableRoles = currentUserParticipation?.project_role === 'contractor'
    ? projectRoles.filter(r => r.value === 'subcontractor')
    : projectRoles;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('inviteParticipantDialog.title')}</DialogTitle>
          <DialogDescription>
            {t('inviteParticipantDialog.description')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Participant Type */}
          <div className="space-y-3">
            <Label>{t('inviteParticipantDialog.participantType')}</Label>
            <RadioGroup 
              value={participantType} 
              onValueChange={setParticipantType}
              className="grid grid-cols-2 gap-3"
            >
              <div>
                <RadioGroupItem value="company" id="company" className="peer sr-only" />
                <Label
                    htmlFor="company"
                    className="flex flex-col items-center justify-center rounded-lg border-2 border-gray-200 p-4 cursor-pointer hover:bg-gray-50 peer-data-[state=checked]:border-[#ef6144] peer-data-[state=checked]:bg-[#ef6144]/5"
                  >
                    <Building2 className="h-6 w-6 mb-2 text-gray-500" />
                    <span className="font-medium">{t('inviteParticipantDialog.company')}</span>
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="personal" id="personal" className="peer sr-only" />
                  <Label
                    htmlFor="personal"
                    className="flex flex-col items-center justify-center rounded-lg border-2 border-gray-200 p-4 cursor-pointer hover:bg-gray-50 peer-data-[state=checked]:border-[#ef6144] peer-data-[state=checked]:bg-[#ef6144]/5"
                  >
                    <User className="h-6 w-6 mb-2 text-gray-500" />
                    <span className="font-medium">{t('inviteParticipantDialog.person')}</span>
                  </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Company or Email */}
          {participantType === 'company' ? (
            <div className="space-y-2">
              <Label>{t('inviteParticipantDialog.selectCompany')}</Label>
              <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
                <SelectTrigger>
                  <SelectValue placeholder={t('inviteParticipantDialog.selectCompanyPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {allCompanies.map(company => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="email">{t('inviteParticipantDialog.email')}</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('inviteParticipantDialog.emailPlaceholder')}
              />
            </div>
          )}

          {/* Role */}
          <div className="space-y-2">
            <Label>{t('inviteParticipantDialog.projectRole')}</Label>
            <Select value={projectRole} onValueChange={setProjectRole}>
              <SelectTrigger>
                <SelectValue placeholder={t('inviteParticipantDialog.selectRolePlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {availableRoles.map(role => (
                  <SelectItem key={role.value} value={role.value}>
                    <div>
                      <p className="font-medium">{role.label}</p>
                      <p className="text-xs text-gray-500">{role.description}</p>
                    </div>
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
              {t('inviteParticipantDialog.cancel')}
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-[#ef6144] hover:bg-[#d9553a]"
              disabled={!isValid || inviteMutation.isPending}
            >
              {inviteMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {t('inviteParticipantDialog.invite')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}