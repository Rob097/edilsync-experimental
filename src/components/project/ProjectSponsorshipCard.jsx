import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { enUS, it } from 'date-fns/locale';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Info, ShieldCheck, Sparkles } from 'lucide-react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton.jsx';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from '@/components/ui/use-toast';
import { isPaidCompanySubscription, normalizeCompanySubscription } from '@/lib/subscriptions';

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

  const sponsorCompany = companies.find((company) => company.id === activeSponsorship?.sponsor_company_id) || sponsorCompanyRecord || null;
  const canEndCurrentSponsorship = Boolean(activeSponsorship?.sponsor_company_id && adminCompanyIds.includes(activeSponsorship.sponsor_company_id));
  const preferredUpgradeCompany = freeSponsorCandidates.find((company) => company.id === user?.active_company_id) || freeSponsorCandidates[0] || null;

  const invalidateProjectAccess = async (sponsorCompanyId = null) => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['projectSponsorship', projectId] }),
      queryClient.invalidateQueries({ queryKey: ['featureAccess', 'project', projectId] }),
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
      toast({
        title: tr('Sponsorship attivata', 'Sponsorship activated'),
        description: tr(
          'Il progetto ora sblocca le feature premium progettuali per tutti i partecipanti.',
          'The project now unlocks premium project features for all participants.',
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
    mutationFn: async () => appClient.entities.ProjectSponsorship.update(activeSponsorship.id, {
      status: 'ended',
      ended_at: new Date().toISOString(),
    }),
    onSuccess: async () => {
      await invalidateProjectAccess(activeSponsorship?.sponsor_company_id || null);
      setEndDialogOpen(false);
      toast({
        title: tr('Sponsorship terminata', 'Sponsorship ended'),
        description: tr(
          'Le feature premium di progetto tornano immediatamente bloccate finche non arriva una nuova sponsorship.',
          'Premium project features are immediately locked again until a new sponsorship is activated.',
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

  const startedAtLabel = activeSponsorship?.started_at
    ? format(new Date(activeSponsorship.started_at), 'd MMM yyyy', { locale: dateLocale })
    : null;

  if (sponsorshipLoading) {
    return <Skeleton className="h-40 w-full" />;
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">{tr('Stato sponsorship progetto', 'Project sponsorship status')}</CardTitle>
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
            <p className="mt-1 text-sm text-gray-500">
              {activeSponsorship
                ? tr(
                  'Il progetto e sbloccato a livello premium per tutti i partecipanti.',
                  'The project is premium-unlocked for all participants.',
                )
                : tr(
                  'Il progetto sta usando il set di feature free finche una societa paid partecipante non lo sponsorizza.',
                  'The project is using the free feature set until a paid participant company sponsors it.',
                )}
            </p>
          </div>
          <Badge className={activeSponsorship ? 'bg-[#ef6144] text-white' : 'bg-slate-100 text-slate-700'}>
            {activeSponsorship ? tr('Progetto sponsorizzato', 'Sponsored project') : tr('Progetto non sponsorizzato', 'Unsponsored project')}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          {activeSponsorship ? (
            <div className="rounded-xl border bg-[#ef6144]/5 p-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm">
                  <ShieldCheck className="h-5 w-5 text-[#ef6144]" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">
                    {tr('Sponsorizzato da', 'Sponsored by')} {sponsorCompany?.name || activeSponsorship.sponsor_company_id}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {tr('Attivo dal', 'Active since')} {startedAtLabel}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed p-4 text-sm text-slate-600">
              {tr(
                'Finche resta non sponsorizzato, milestone, economia, chat avanzata e documenti avanzati restano bloccati ma visibili come premium.',
                'While it stays unsponsored, milestones, finance, advanced chat and advanced documents stay locked but visible as premium.',
              )}
            </div>
          )}

          {!activeSponsorship && paidSponsorCandidates.length > 0 ? (
            <div className="space-y-3 rounded-xl border bg-slate-50 p-4">
              <p className="text-sm text-slate-700">
                {tr(
                  'Puoi sponsorizzare questo progetto con una delle tue societa paid gia presenti nel progetto.',
                  'You can sponsor this project with one of your paid companies already participating in the project.',
                )}
              </p>
              <div className="flex flex-wrap gap-2">
                {paidSponsorCandidates.map((company) => (
                  <Badge key={company.id} variant="outline">{company.name}</Badge>
                ))}
              </div>
              <Button className="bg-[#ef6144] hover:bg-[#d9553a]" onClick={() => setSponsorDialogOpen(true)}>
                <Sparkles className="h-4 w-4" />
                {tr('Sponsorizza progetto', 'Sponsor project')}
              </Button>
            </div>
          ) : null}

          {!activeSponsorship && paidSponsorCandidates.length === 0 && preferredUpgradeCompany ? (
            <div className="space-y-3 rounded-xl border bg-slate-50 p-4">
              <p className="text-sm text-slate-700">
                {tr(
                  'Sei admin di una societa partecipante ma ancora free. Passando al piano paid potrai sponsorizzare questo progetto.',
                  'You are admin of a participant company but it is still free. Upgrading to the paid plan will let you sponsor this project.',
                )}
              </p>
              <Button variant="outline" onClick={openUpgradeTarget}>
                {tr('Apri fatturazione di {company}', 'Open billing for {company}').replace('{company}', preferredUpgradeCompany.name)}
              </Button>
            </div>
          ) : null}

          {activeSponsorship && canEndCurrentSponsorship ? (
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" onClick={() => setEndDialogOpen(true)}>
                {tr('Termina sponsorship', 'End sponsorship')}
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Dialog open={infoOpen} onOpenChange={setInfoOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{tr('Cosa significa la sponsorship', 'What project sponsorship means')}</DialogTitle>
            <DialogDescription>
              {tr(
                'La sponsorship non cambia il piano globale delle altre societa coinvolte: sblocca solo le feature premium progettuali dentro questo progetto.',
                'Sponsorship does not change the global plan of the other involved companies: it only unlocks premium project features inside this project.',
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm text-slate-600">
            <p>
              {tr(
                'Se il progetto e sponsorizzato, milestone, economia, chat avanzata e documenti avanzati diventano disponibili per tutti i partecipanti del progetto.',
                'If the project is sponsored, milestones, finance, advanced chat and advanced documents become available to all project participants.',
              )}
            </p>
            <p>
              {tr(
                'Se la societa sponsor perde il piano paid o esce dal progetto, la sponsorship cade subito e i dati premium restano conservati ma non accessibili.',
                'If the sponsor company loses the paid plan or leaves the project, sponsorship drops immediately and premium data stays preserved but inaccessible.',
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
            <DialogTitle>{tr('Sponsorizza progetto', 'Sponsor project')}</DialogTitle>
            <DialogDescription>
              {tr(
                'Scegli la societa paid che deve sbloccare le feature premium di questo progetto.',
                'Choose the paid company that should unlock this project premium features.',
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
                'La sponsorship e immediata e vale finche la societa sponsor resta paid e partecipante attiva del progetto.',
                'Sponsorship is immediate and stays active while the sponsor company remains paid and an active project participant.',
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
                'Il progetto perdera subito le feature premium progettuali. I dati premium resteranno nel database ma torneranno visibili solo con una nuova sponsorship.',
                'The project will immediately lose premium project features. Premium data will stay in the database and become visible again only after a new sponsorship.',
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