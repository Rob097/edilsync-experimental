import React, { useEffect, useMemo, useState } from 'react';
import { appClient } from '@/api/appClient';
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from 'sonner';
import {
  getProjectRoleLabel,
  getProjectRoleOptions,
  getCompatibleProjectRolesForCompanyType,
  isCompanyTypeCompatibleWithProjectRole,
} from '@/lib/domainRoles';
import { isPaidCompanySubscription, normalizeCompanySubscription } from '@/lib/subscriptions';
import { isProjectBlockedForSponsorLoss, useProjectPricingStatus } from '@/hooks/useFeatureAccess';

export default function InviteParticipantDialog({ 
  open, 
  onOpenChange, 
  projectId,
  currentUserParticipation,
  projectPricingStatus: projectPricingStatusProp,
}) {
  const { t, currentLanguage } = useLanguage();
  const tr = (itText, enText) => (currentLanguage === 'it' ? itText : enText);
  const queryClient = useQueryClient();
  
  const [participantType, setParticipantType] = useState('company');
  const [email, setEmail] = useState('');
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [projectRole, setProjectRole] = useState('');

  const { projectPricingStatus: fetchedProjectPricingStatus } = useProjectPricingStatus(projectId, {
    enabled: open && !!projectId,
  });
  const projectPricingStatus = projectPricingStatusProp || fetchedProjectPricingStatus;
  const projectIsBlockedForSponsorLoss = isProjectBlockedForSponsorLoss(projectPricingStatus);

  const roleDescriptions = {
    contractor: t('inviteParticipantDialog.contractorDesc'),
    subcontractor: t('inviteParticipantDialog.subcontractorDesc'),
    architect: t('inviteParticipantDialog.architectDesc'),
    engineer: t('inviteParticipantDialog.engineerDesc'),
    surveyor: t('inviteParticipantDialog.surveyorDesc'),
    designer: t('inviteParticipantDialog.designerDesc'),
    consultant: t('inviteParticipantDialog.consultantDesc'),
    supplier: t('inviteParticipantDialog.supplierDesc'),
  };

  const { data: allCompanies = [] } = useQuery({
    queryKey: ['allCompanies'],
    queryFn: () => appClient.entities.Company.list(),
  });

  const { data: activeProjectSponsorship } = useQuery({
    queryKey: ['projectSponsorship', projectId],
    queryFn: async () => {
      const records = await appClient.entities.ProjectSponsorship.filter({ project_id: projectId, status: 'active' });
      return records[0] || null;
    },
    enabled: !!projectId && !projectIsBlockedForSponsorLoss,
  });

  const { data: selectedCompanySubscription } = useQuery({
    queryKey: ['companySubscription', selectedCompanyId],
    queryFn: async () => {
      const records = await appClient.entities.CompanySubscription.filter({ company_id: selectedCompanyId });
      return normalizeCompanySubscription(records[0], selectedCompanyId);
    },
    enabled: participantType === 'company' && !!selectedCompanyId,
  });

  const inviteMutation = useMutation({
    mutationFn: async () => {
      const result = await appClient.functions.invoke('inviteProjectParticipantWithValidation', {
        project_id: projectId,
        participant_type: participantType,
        project_role: projectRole,
        company_id: participantType === 'company' ? selectedCompanyId : null,
        user_email: participantType === 'personal' ? email : null,
      });

      return result.participant;
    },
    onError: (error) => {
      toast.error(error?.message || tr('Impossibile inviare l\'invito', 'Unable to send the invite'));
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

  useEffect(() => {
    if (projectIsBlockedForSponsorLoss && participantType !== 'company') {
      setParticipantType('company');
    }
  }, [participantType, projectIsBlockedForSponsorLoss]);

  const handleSubmit = (e) => {
    e.preventDefault();
    inviteMutation.mutate();
  };

  const isValid = projectRole && (
    (participantType === 'company' && selectedCompanyId) ||
    (participantType === 'personal' && email)
  );

  const selectedCompany = allCompanies.find((company) => company.id === selectedCompanyId);
  const selectedCompanyType = selectedCompany?.company_type || null;

  // Contractors can only invite subcontractors for now.
  const invitableRoleValues = currentUserParticipation?.project_role === 'contractor'
    ? ['subcontractor']
    : getProjectRoleOptions(currentLanguage).map((option) => option.value);

  const availableRoles = useMemo(() => {
    if (participantType !== 'company') {
      return invitableRoleValues;
    }
    const compatibleRoles = getCompatibleProjectRolesForCompanyType(selectedCompanyType);
    return invitableRoleValues.filter((roleValue) => compatibleRoles.includes(roleValue));
  }, [invitableRoleValues, participantType, selectedCompanyType]);

  useEffect(() => {
    if (projectRole && !availableRoles.includes(projectRole)) {
      setProjectRole('');
    }
  }, [availableRoles, projectRole]);

  const hasCompatibilityIssue =
    participantType === 'company' &&
    !!selectedCompanyId &&
    !!projectRole &&
    !isCompanyTypeCompatibleWithProjectRole(selectedCompanyType, projectRole);

  const inviteContextNotice = useMemo(() => {
    if (projectIsBlockedForSponsorLoss) {
      return {
        title: tr('Cantiere bloccato per perdita sponsor', 'Worksite blocked after sponsor loss'),
        description: tr(
          'Questo cantiere puo invitare solo societa finche non rientra una sponsorship valida. Le superfici premium restano invisibili fino al recupero sponsor.',
          'This worksite can invite only companies until a valid sponsorship returns. Premium surfaces stay hidden until sponsor recovery.',
        ),
        className: 'border-red-200 bg-red-50 text-red-900',
      };
    }

    if (participantType !== 'company' || !selectedCompanyId) {
      return null;
    }

    const companyIsPaid = isPaidCompanySubscription(selectedCompanySubscription);
    const projectIsSponsored = projectPricingStatus?.status === 'sponsored' || Boolean(activeProjectSponsorship);

    if (projectIsSponsored && !companyIsPaid) {
      return {
        title: tr('Societa free, cantiere sponsorizzato', 'Free company, sponsored worksite'),
        description: tr(
          'Questa societa restera free a livello globale, ma dentro questo cantiere potra usare le feature premium grazie alla sponsorship attiva.',
          'This company will remain free globally, but inside this worksite it will be able to use premium features thanks to the active sponsorship.',
        ),
        className: 'border-green-200 bg-green-50 text-green-900',
      };
    }

    if (!projectIsSponsored && !companyIsPaid) {
      return {
        title: tr('Societa free, cantiere non sponsorizzato', 'Free company, unsponsored worksite'),
        description: tr(
          'Questa societa potra partecipare al cantiere solo con le feature gratuite finche nessuna societa paid partecipante non attivera una sponsorship.',
          'This company will join the worksite with free features only until a paid participant company activates a sponsorship.',
        ),
        className: 'border-slate-200 bg-slate-50 text-slate-900',
      };
    }

    if (!projectIsSponsored && companyIsPaid) {
      return {
        title: tr('Societa paid, cantiere non sponsorizzato', 'Paid company, unsponsored worksite'),
        description: tr(
          'Dopo l ingresso nel cantiere, questa societa potra sponsorizzarlo e sbloccare le feature premium per tutti i partecipanti.',
          'After joining the worksite, this company will be able to sponsor it and unlock premium features for all participants.',
        ),
        className: 'border-[#ef6144]/20 bg-[#ef6144]/5 text-slate-900',
      };
    }

    return null;
  }, [activeProjectSponsorship, currentLanguage, participantType, projectIsBlockedForSponsorLoss, projectPricingStatus?.status, selectedCompanyId, selectedCompanySubscription]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-x-hidden sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('inviteParticipantDialog.title')}</DialogTitle>
          <DialogDescription>
            {t('inviteParticipantDialog.description')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4 min-w-0 space-y-6">
          {/* Participant Type */}
          <div className="space-y-3">
            <Label>{t('inviteParticipantDialog.participantType')}</Label>
            <RadioGroup 
              value={participantType} 
              onValueChange={setParticipantType}
              className={`grid gap-3 ${projectIsBlockedForSponsorLoss ? 'grid-cols-1' : 'grid-cols-2'}`}
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
                {!projectIsBlockedForSponsorLoss ? (
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
                ) : null}
            </RadioGroup>
          </div>

          {/* Company or Email */}
          {participantType === 'company' ? (
            <div className="min-w-0 space-y-2">
              <Label>{t('inviteParticipantDialog.selectCompany')}</Label>
              <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
                <SelectTrigger className="min-w-0 max-w-full">
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
              {selectedCompanyId && !selectedCompanyType && (
                <p className="text-xs text-amber-700">
                  {t('inviteParticipantDialog.missingCompanyType')}
                </p>
              )}
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
                {availableRoles.map((roleValue) => (
                  <SelectItem key={roleValue} value={roleValue}>
                    <div>
                      <p className="font-medium">{getProjectRoleLabel(roleValue, currentLanguage)}</p>
                      <p className="text-xs text-gray-500">{roleDescriptions[roleValue] || roleValue}</p>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {hasCompatibilityIssue && (
            <Alert variant="destructive">
              <AlertDescription>
                {t('inviteParticipantDialog.compatibilityError')}
              </AlertDescription>
            </Alert>
          )}

          {inviteContextNotice && (
            <Alert className={inviteContextNotice.className}>
              <AlertTitle>{inviteContextNotice.title}</AlertTitle>
              <AlertDescription>{inviteContextNotice.description}</AlertDescription>
            </Alert>
          )}

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
              disabled={!isValid || inviteMutation.isPending || hasCompatibilityIssue}
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