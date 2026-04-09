import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { enUS, it } from 'date-fns/locale';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronDown, Info, ShieldCheck, Sparkles } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { appClient } from '@/api/appClient';
import { useLanguage } from '@/components/i18n/useLanguage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton.jsx';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from '@/components/ui/use-toast';
import { isPaidCompanySubscription, normalizeCompanySubscription } from '@/lib/subscriptions';
import { isProjectBlockedForSponsorLoss, useProjectPricingStatus } from '@/hooks/useFeatureAccess';
import { sendProjectSponsorshipNotifications } from '@/lib/projectSponsorshipNotifications';

export default function ProjectSponsorshipCard({
  projectId,
  user,
  participants = [],
  companies = [],
  companyMemberships = [],
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { currentLanguage } = useLanguage();
  const tr = (itText, enText) => (currentLanguage === 'it' ? itText : enText);
  const dateLocale = currentLanguage === 'it' ? it : enUS;

  const [infoOpen, setInfoOpen] = useState(false);
  const [sponsorDialogOpen, setSponsorDialogOpen] = useState(false);
  const [selectedSponsorCompanyId, setSelectedSponsorCompanyId] = useState('');
  const [endDialogOpen, setEndDialogOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const { projectPricingStatus } = useProjectPricingStatus(projectId, { enabled: !!projectId });

  const { data: activeSponsorship, isLoading: sponsorshipLoading } = useQuery({
    queryKey: ['projectSponsorship', projectId],
    queryFn: async () => {
      const records = await appClient.entities.ProjectSponsorship.filter({ project_id: projectId, status: 'active' });
      return records[0] || null;
    },
    enabled: !!projectId,
    staleTime: 60 * 1000,
  });

  const activeParticipantCompanyIds = useMemo(
    () => [...new Set(
      participants
        .filter((participant) => participant.status === 'active' && participant.participant_type === 'company' && participant.company_id)
        .map((participant) => participant.company_id),
    )],
    [participants],
  );

  const adminCompanyIds = useMemo(
    () => companyMemberships
      .filter((membership) => membership.status === 'active' && membership.role === 'admin')
      .map((membership) => membership.company_id),
    [companyMemberships],
  );

  const manageableParticipantCompanyIds = useMemo(
    () => activeParticipantCompanyIds.filter((companyId) => adminCompanyIds.includes(companyId)),
    [activeParticipantCompanyIds, adminCompanyIds],
  );

  const { data: manageableSubscriptions = [] } = useQuery({
    queryKey: ['manageableProjectSponsorSubscriptions', projectId, manageableParticipantCompanyIds],
    queryFn: () => appClient.entities.CompanySubscription.filter({ company_id: manageableParticipantCompanyIds }),
    enabled: manageableParticipantCompanyIds.length > 0,
    staleTime: 60 * 1000,
  });

  const { data: sponsorCompanyRecord } = useQuery({
    queryKey: ['projectSponsorCompany', activeSponsorship?.sponsor_company_id],
    queryFn: async () => {
      const records = await appClient.entities.Company.filter({ id: activeSponsorship?.sponsor_company_id });
      return records[0] || null;
    },
    enabled: !!activeSponsorship?.sponsor_company_id && !companies.some((company) => company.id === activeSponsorship?.sponsor_company_id),
    staleTime: 60 * 1000,
  });

  const subscriptionByCompanyId = useMemo(
    () => Object.fromEntries(
      manageableParticipantCompanyIds.map((companyId) => [
        companyId,
        normalizeCompanySubscription(
          manageableSubscriptions.find((subscription) => subscription.company_id === companyId),
          companyId,
        ),
      ]),
    ),
    [manageableParticipantCompanyIds, manageableSubscriptions],
  );

  const manageableCompanies = useMemo(
    () => manageableParticipantCompanyIds
      .map((companyId) => companies.find((company) => company.id === companyId) || null)
      .filter(Boolean),
    [companies, manageableParticipantCompanyIds],
  );

  const paidSponsorCandidates = useMemo(
    () => manageableCompanies.filter((company) => isPaidCompanySubscription(subscriptionByCompanyId[company.id])),
    [manageableCompanies, subscriptionByCompanyId],
  );

  const freeSponsorCandidates = useMemo(
    () => manageableCompanies.filter((company) => !isPaidCompanySubscription(subscriptionByCompanyId[company.id])),
    [manageableCompanies, subscriptionByCompanyId],
  );

  useEffect(() => {
    if (!paidSponsorCandidates.length) {
      setSelectedSponsorCompanyId('');
      return;
    }

    const preferredCompanyId = paidSponsorCandidates.some((company) => company.id === user?.active_company_id)
      ? user?.active_company_id
      : paidSponsorCandidates[0].id;

    setSelectedSponsorCompanyId((currentValue) => (
      paidSponsorCandidates.some((company) => company.id === currentValue)
        ? currentValue
        : preferredCompanyId
    ));
  }, [paidSponsorCandidates, user?.active_company_id]);

  const effectiveActiveSponsorship = projectPricingStatus?.status === 'sponsored' ? activeSponsorship : null;
  const isBlockedProject = isProjectBlockedForSponsorLoss(projectPricingStatus);
  const sponsorCompany = companies.find((company) => company.id === effectiveActiveSponsorship?.sponsor_company_id) || sponsorCompanyRecord || null;
  const canEndCurrentSponsorship = Boolean(effectiveActiveSponsorship?.sponsor_company_id && adminCompanyIds.includes(effectiveActiveSponsorship.sponsor_company_id));
  const preferredUpgradeCompany = freeSponsorCandidates.find((company) => company.id === user?.active_company_id) || freeSponsorCandidates[0] || null;

  const invalidateProjectAccess = async (sponsorCompanyId = null) => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['projectSponsorship', projectId] }),
      queryClient.invalidateQueries({ queryKey: ['featureAccess', 'project', projectId] }),
      queryClient.invalidateQueries({ queryKey: ['projectPricingStatus', projectId] }),
      sponsorCompanyId
        ? queryClient.invalidateQueries({ queryKey: ['companySponsoredProjects', sponsorCompanyId] })
        : Promise.resolve(),
    ]);
  };

  const sponsorMutation = useMutation({
    mutationFn: async (sponsorCompanyId) => appClient.entities.ProjectSponsorship.create({
      project_id: projectId,
      sponsor_company_id: sponsorCompanyId,
      status: 'active',
      activation_source: 'manual',
      started_at: new Date().toISOString(),
    }),
    onSuccess: async (_, sponsorCompanyId) => {
      await invalidateProjectAccess(sponsorCompanyId);
      setSponsorDialogOpen(false);

      const sponsorCompanyName = companies.find((company) => company.id === sponsorCompanyId)?.name || tr('la società sponsor', 'the sponsor company');

      await sendProjectSponsorshipNotifications({
        projectId,
        actionType: 'project_sponsorship_activated',
        notificationType: 'project_sponsorship_activated',
        title: tr('Sponsorship attivata', 'Sponsorship activated'),
        message: tr(
          `Il cantiere è ora sponsorizzato da ${sponsorCompanyName} e le funzioni avanzate sono disponibili.`,
          `The worksite is now sponsored by ${sponsorCompanyName} and advanced features are available.`,
        ),
        emailSubject: tr('Sponsorship cantiere attivata', 'Worksite sponsorship activated'),
        emailBody: tr(
          `Ciao,\n\nIl cantiere è ora sponsorizzato da ${sponsorCompanyName}. Le funzioni avanzate del cantiere sono disponibili per i partecipanti.\n\nCordiali saluti,\nIl team EdilSync`,
          `Hello,\n\nThe worksite is now sponsored by ${sponsorCompanyName}. Advanced worksite features are now available to participants.\n\nBest regards,\nThe EdilSync team`,
        ),
      });

      toast({
        title: tr('Sponsorship attivata', 'Sponsorship activated'),
        description: tr(
          'Il cantiere ora sblocca le feature premium per tutti i partecipanti.',
          'The worksite now unlocks premium features for all participants.',
        ),
      });
    },
    onError: (error) => {
      toast({
        title: tr('Impossibile sponsorizzare', 'Unable to sponsor'),
        description: error?.message || tr('Controlla piano, ruolo e partecipazione attiva della societa.', 'Check plan, role and active company participation.'),
      });
    },
  });

  const endSponsorshipMutation = useMutation({
    mutationFn: async () => appClient.entities.ProjectSponsorship.update(effectiveActiveSponsorship.id, {
      status: 'ended',
      ended_at: new Date().toISOString(),
    }),
    onSuccess: async () => {
      await invalidateProjectAccess(effectiveActiveSponsorship?.sponsor_company_id || null);
      setEndDialogOpen(false);

      const revokedCompanyName = sponsorCompany?.name || tr('la società sponsor', 'the sponsor company');

      await sendProjectSponsorshipNotifications({
        projectId,
        actionType: 'project_sponsorship_revoked',
        notificationType: 'project_sponsorship_revoked',
        title: tr('Sponsorship terminata', 'Sponsorship ended'),
        message: tr(
          `La sponsorship di ${revokedCompanyName} è terminata e alcune funzioni avanzate del cantiere non sono più disponibili.`,
          `The sponsorship from ${revokedCompanyName} has ended and some advanced worksite features are no longer available.`,
        ),
        emailSubject: tr('Sponsorship cantiere revocata', 'Worksite sponsorship revoked'),
        emailBody: tr(
          `Ciao,\n\nLa sponsorship di ${revokedCompanyName} è terminata. Alcune funzioni avanzate del cantiere potrebbero non essere più disponibili finché non viene attivata una nuova sponsorship.\n\nCordiali saluti,\nIl team EdilSync`,
          `Hello,\n\nThe sponsorship from ${revokedCompanyName} has ended. Some advanced worksite features may no longer be available until a new sponsorship is activated.\n\nBest regards,\nThe EdilSync team`,
        ),
      });

      toast({
        title: tr('Sponsorship terminata', 'Sponsorship ended'),
        description: tr(
          'Il cantiere torna al piano Base finche non viene sponsorizzato di nuovo.',
          'The worksite returns to the Base plan until it is sponsored again.',
        ),
      });
    },
    onError: (error) => {
      toast({
        title: tr('Impossibile terminare la sponsorship', 'Unable to end sponsorship'),
        description: error?.message || tr('Riprova tra poco.', 'Please try again shortly.'),
      });
    },
  });

  const openUpgradeTarget = () => {
    if (!preferredUpgradeCompany) {
      return;
    }
    navigate(createPageUrl('CompanyDetail') + `?id=${preferredUpgradeCompany.id}&tab=billing`);
  };

  const startedAtLabel = effectiveActiveSponsorship?.started_at
    ? format(new Date(effectiveActiveSponsorship.started_at), 'd MMM yyyy', { locale: dateLocale })
    : null;

  if (sponsorshipLoading) {
    return <Skeleton className="h-40 w-full" />;
  }

  return (
    <>
      <Collapsible open={detailsOpen} onOpenChange={setDetailsOpen}>
        <Card className="h-full">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${effectiveActiveSponsorship ? 'bg-[#ef6144]/10' : isBlockedProject ? 'bg-red-100' : 'bg-slate-100'}`}>
                  <ShieldCheck className={`h-5 w-5 ${effectiveActiveSponsorship ? 'text-[#ef6144]' : isBlockedProject ? 'text-red-600' : 'text-slate-500'}`} />
                </div>
                <div>
                  <CardTitle className="text-lg">{tr('Piano cantiere', 'Worksite plan')}</CardTitle>
                  <p className="mt-1 text-sm text-gray-500">
                    {effectiveActiveSponsorship
                      ? tr('Funzioni avanzate attive', 'Advanced features active')
                      : isBlockedProject
                        ? tr('Serve uno sponsor', 'A sponsor is needed')
                        : tr('Piano Base attivo', 'Base plan active')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={effectiveActiveSponsorship ? 'bg-[#ef6144] text-white' : (isBlockedProject ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700')}>
                  {effectiveActiveSponsorship
                    ? tr('Pro', 'Pro')
                    : isBlockedProject
                      ? tr('Sponsor mancante', 'Sponsor missing')
                      : tr('Base', 'Base')}
                </Badge>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={() => setInfoOpen(true)}>
                        <Info className="h-4 w-4 text-slate-500" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {tr('Cosa significa', 'What does this mean')}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="min-h-[88px] rounded-xl border bg-slate-50 p-4">
              <div className="flex h-full flex-col justify-between gap-2 sm:flex-row sm:items-center">
                <div>
                  <p className="text-lg font-semibold text-slate-900">
                    {effectiveActiveSponsorship
                      ? tr('Cantiere sponsorizzato', 'Sponsored worksite')
                      : isBlockedProject
                        ? tr('Riattiva una societa sponsor', 'Restore a sponsor company')
                        : tr('Puoi passare il cantiere a Pro', 'You can upgrade this worksite to Pro')}
                  </p>
                  <p className="text-sm text-slate-500">
                    {effectiveActiveSponsorship
                      ? tr('Le funzioni avanzate del cantiere sono attive per tutti i partecipanti.', 'Advanced worksite features are active for all participants.')
                      : isBlockedProject
                        ? tr('Per riattivare le funzioni avanzate serve una societa sponsor.', 'A sponsor company is required to reactivate advanced features.')
                        : tr('Serve una societa Pro gia presente nel cantiere.', 'A Pro company already in the worksite is required.')}
                  </p>
                </div>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="justify-start px-0 text-[#b5432e] hover:bg-transparent hover:text-[#ef6144] sm:justify-end">
                    {detailsOpen ? tr('Nascondi dettagli', 'Hide details') : tr('Mostra dettagli', 'Show details')}
                    <ChevronDown className={`h-4 w-4 transition-transform ${detailsOpen ? 'rotate-180' : ''}`} />
                  </Button>
                </CollapsibleTrigger>
              </div>
            </div>

            <CollapsibleContent className="space-y-4 pt-4 data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
          {effectiveActiveSponsorship ? (
            <div className="rounded-xl border bg-[#ef6144]/5 p-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm">
                  <ShieldCheck className="h-5 w-5 text-[#ef6144]" />
                </div>
                <div className="space-y-2">
                  <p className="font-semibold text-slate-900">
                    {tr('Sponsorizzato da', 'Sponsored by')} {sponsorCompany?.name || effectiveActiveSponsorship.sponsor_company_id}
                  </p>
                  {startedAtLabel ? (
                    <p className="text-sm text-slate-600">{tr('Attivo dal', 'Active since')} {startedAtLabel}</p>
                  ) : null}
                </div>
              </div>
            </div>
          ) : isBlockedProject ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
              <p className="font-medium">
                {tr(
                  'Questo cantiere ha bisogno di una societa sponsor per tornare completo.',
                  'This worksite needs a sponsor company to be fully active again.',
                )}
              </p>
              <p className="mt-2 text-red-800">
                {tr(
                  'Puoi invitare una societa e riattivare la sponsorship.',
                  'You can invite a company and restore sponsorship.',
                )}
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed p-4 text-sm text-slate-600">
              {tr(
                'Per attivare funzioni come milestone, documenti avanzati, chat avanzata e area economica serve una societa Pro gia presente nel cantiere.',
                'To unlock milestones, advanced documents, advanced chat, and finance, a participating Pro company must sponsor the worksite.',
              )}
            </div>
          )}

          {!effectiveActiveSponsorship && paidSponsorCandidates.length > 0 ? (
            <div className="space-y-3 rounded-xl border bg-slate-50 p-4">
              <p className="text-sm text-slate-700">
                {tr(
                  'Puoi attivare subito il piano Pro del cantiere con una delle tue societa Pro gia presenti.',
                  'You can activate the worksite Pro plan now with one of your participating Pro companies.',
                )}
              </p>
              <div className="flex flex-wrap gap-2">
                {paidSponsorCandidates.map((company) => (
                  <Badge key={company.id} variant="outline">{company.name}</Badge>
                ))}
              </div>
              <Button className="bg-[#ef6144] hover:bg-[#d9553a]" onClick={() => setSponsorDialogOpen(true)}>
                <Sparkles className="h-4 w-4" />
                {tr('Sponsorizza cantiere', 'Sponsor worksite')}
              </Button>
            </div>
          ) : null}

          {!effectiveActiveSponsorship && paidSponsorCandidates.length === 0 && preferredUpgradeCompany ? (
            <div className="space-y-3 rounded-xl border bg-slate-50 p-4">
              <p className="text-sm text-slate-700">
                {tr(
                  'Sei admin di una societa partecipante. Passando a Pro potrai attivare il piano Pro di questo cantiere.',
                  'You are an admin of a participating company. Upgrading to Pro will let you activate this worksite Pro plan.',
                )}
              </p>
              <Button variant="outline" onClick={openUpgradeTarget}>
                {tr('Vai al piano di {company}', 'Go to {company} plan').replace('{company}', preferredUpgradeCompany.name)}
              </Button>
            </div>
          ) : null}

          {effectiveActiveSponsorship && canEndCurrentSponsorship ? (
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" onClick={() => setEndDialogOpen(true)}>
                {tr('Termina sponsorship', 'End sponsorship')}
              </Button>
            </div>
          ) : null}
            </CollapsibleContent>
          </CardContent>
        </Card>
      </Collapsible>

      <Dialog open={infoOpen} onOpenChange={setInfoOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{tr('Cosa significa la sponsorship', 'What worksite sponsorship means')}</DialogTitle>
            <DialogDescription>
              {tr(
                'La sponsorship attiva il piano Pro solo dentro questo cantiere.',
                'Sponsorship activates the Pro plan only inside this worksite.',
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm text-slate-600">
            <p>
              {tr(
                'Quando una societa Pro sponsorizza il cantiere, tutti i partecipanti vedono le funzioni avanzate del cantiere.',
                'When a Pro company sponsors the worksite, all participants can use its advanced features.',
              )}
            </p>
            <p>
              {tr(
                'Se la sponsorship termina, i dati restano salvati ma le funzioni avanzate si fermano finche non arriva un nuovo sponsor.',
                'If sponsorship ends, data stays saved but advanced features pause until a new sponsor arrives.',
              )}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInfoOpen(false)}>{tr('Chiudi', 'Close')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={sponsorDialogOpen} onOpenChange={setSponsorDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{tr('Sponsorizza cantiere', 'Sponsor worksite')}</DialogTitle>
            <DialogDescription>
              {tr(
                'Scegli la societa Pro che deve attivare il piano Pro di questo cantiere.',
                'Choose the Pro company that should activate this worksite Pro plan.',
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Select value={selectedSponsorCompanyId} onValueChange={setSelectedSponsorCompanyId}>
              <SelectTrigger>
                <SelectValue placeholder={tr('Seleziona una societa', 'Select a company')} />
              </SelectTrigger>
              <SelectContent>
                {paidSponsorCandidates.map((company) => (
                  <SelectItem key={company.id} value={company.id}>{company.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-slate-600">
              {tr(
                'La sponsorship parte subito e resta attiva finche la societa sponsor mantiene il piano Pro e partecipa al cantiere.',
                'Sponsorship starts immediately and stays active while the sponsor company keeps its Pro plan and remains in the worksite.',
              )}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSponsorDialogOpen(false)}>
              {tr('Annulla', 'Cancel')}
            </Button>
            <Button
              className="bg-[#ef6144] hover:bg-[#d9553a]"
              disabled={!selectedSponsorCompanyId || sponsorMutation.isPending}
              onClick={() => sponsorMutation.mutate(selectedSponsorCompanyId)}
            >
              {tr('Conferma sponsorship', 'Confirm sponsorship')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={endDialogOpen} onOpenChange={setEndDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{tr('Terminare la sponsorship?', 'End sponsorship?')}</AlertDialogTitle>
            <AlertDialogDescription>
              {tr(
                'Il cantiere perdera subito le feature premium. Se l owner ha gia un altro cantiere non sponsorizzato, il cantiere entrera nello stato bloccato finche non arrivera una nuova sponsorship.',
                'The worksite will immediately lose premium features. If the owner already has another unsponsored worksite, the worksite will enter the blocked state until a new sponsorship arrives.',
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tr('Annulla', 'Cancel')}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-[#ef6144] hover:bg-[#d9553a]"
              disabled={endSponsorshipMutation.isPending}
              onClick={() => endSponsorshipMutation.mutate()}
            >
              {tr('Termina', 'End')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}