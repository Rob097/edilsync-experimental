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
  const { t, currentLanguage } = useLanguage();
const tx = (key, options) => t(`completeScoped.components_project_ProjectSponsorshipCard.${key}`, options);
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

      const sponsorCompanyName = companies.find((company) => company.id === sponsorCompanyId)?.name || tx('k1');

      await sendProjectSponsorshipNotifications({
        projectId,
        actionType: 'project_sponsorship_activated',
        notificationType: 'project_sponsorship_activated',
        title: tx('k2'),
        message: tx('k43', { value1: sponsorCompanyName }),
        emailSubject: tx('k3'),
        emailBody: tx('k44', { value1: sponsorCompanyName }),
      });

      toast({
        title: tx('k4'),
        description: tx('k45'),
      });
    },
    onError: (error) => {
      toast({
        title: tx('k5'),
        description: error?.message || tx('k6'),
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

      const revokedCompanyName = sponsorCompany?.name || tx('k7');

      await sendProjectSponsorshipNotifications({
        projectId,
        actionType: 'project_sponsorship_revoked',
        notificationType: 'project_sponsorship_revoked',
        title: tx('k8'),
        message: tx('k46', { value1: revokedCompanyName }),
        emailSubject: tx('k9'),
        emailBody: tx('k47', { value1: revokedCompanyName }),
      });

      toast({
        title: tx('k10'),
        description: tx('k48'),
      });
    },
    onError: (error) => {
      toast({
        title: tx('k11'),
        description: error?.message || tx('k12'),
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
                  <CardTitle className="text-lg">{tx('k13')}</CardTitle>
                  <p className="mt-1 text-sm text-gray-500">
                    {effectiveActiveSponsorship
                      ? tx('k14')
                      : isBlockedProject
                        ? tx('k15')
                        : tx('k16')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={effectiveActiveSponsorship ? 'bg-[#ef6144] text-white' : (isBlockedProject ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700')}>
                  {effectiveActiveSponsorship
                    ? tx('k17')
                    : isBlockedProject
                      ? tx('k18')
                      : tx('k19')}
                </Badge>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={() => setInfoOpen(true)}>
                        <Info className="h-4 w-4 text-slate-500" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {tx('k20')}
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
                      ? tx('k21')
                      : isBlockedProject
                        ? tx('k22')
                        : tx('k23')}
                  </p>
                  <p className="text-sm text-slate-500">
                    {effectiveActiveSponsorship
                      ? tx('k24')
                      : isBlockedProject
                        ? tx('k25')
                        : tx('k26')}
                  </p>
                </div>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="justify-start px-0 text-[#b5432e] hover:bg-transparent hover:text-[#ef6144] sm:justify-end">
                    {detailsOpen ? tx('k27') : tx('k28')}
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
                    {tx('k29')} {sponsorCompany?.name || effectiveActiveSponsorship.sponsor_company_id}
                  </p>
                  {startedAtLabel ? (
                    <p className="text-sm text-slate-600">{tx('k30')} {startedAtLabel}</p>
                  ) : null}
                </div>
              </div>
            </div>
          ) : isBlockedProject ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
              <p className="font-medium">
                {tx('k49')}
              </p>
              <p className="mt-2 text-red-800">
                {tx('k50')}
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed p-4 text-sm text-slate-600">
              {tx('k51')}
            </div>
          )}

          {!effectiveActiveSponsorship && paidSponsorCandidates.length > 0 ? (
            <div className="space-y-3 rounded-xl border bg-slate-50 p-4">
              <p className="text-sm text-slate-700">
                {tx('k52')}
              </p>
              <div className="flex flex-wrap gap-2">
                {paidSponsorCandidates.map((company) => (
                  <Badge key={company.id} variant="outline">{company.name}</Badge>
                ))}
              </div>
              <Button className="bg-[#ef6144] hover:bg-[#d9553a]" onClick={() => setSponsorDialogOpen(true)}>
                <Sparkles className="h-4 w-4" />
                {tx('k31')}
              </Button>
            </div>
          ) : null}

          {!effectiveActiveSponsorship && paidSponsorCandidates.length === 0 && preferredUpgradeCompany ? (
            <div className="space-y-3 rounded-xl border bg-slate-50 p-4">
              <p className="text-sm text-slate-700">
                {tx('k53')}
              </p>
              <Button variant="outline" onClick={openUpgradeTarget}>
                {tx('k32').replace('{company}', preferredUpgradeCompany.name)}
              </Button>
            </div>
          ) : null}

          {effectiveActiveSponsorship && canEndCurrentSponsorship ? (
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" onClick={() => setEndDialogOpen(true)}>
                {tx('k33')}
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
            <DialogTitle>{tx('k34')}</DialogTitle>
            <DialogDescription>
              {tx('k54')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm text-slate-600">
            <p>
              {tx('k55')}
            </p>
            <p>
              {tx('k56')}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInfoOpen(false)}>{tx('k35')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={sponsorDialogOpen} onOpenChange={setSponsorDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{tx('k36')}</DialogTitle>
            <DialogDescription>
              {tx('k57')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Select value={selectedSponsorCompanyId} onValueChange={setSelectedSponsorCompanyId}>
              <SelectTrigger>
                <SelectValue placeholder={tx('k37')} />
              </SelectTrigger>
              <SelectContent>
                {paidSponsorCandidates.map((company) => (
                  <SelectItem key={company.id} value={company.id}>{company.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-slate-600">
              {tx('k58')}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSponsorDialogOpen(false)}>
              {tx('k38')}
            </Button>
            <Button
              className="bg-[#ef6144] hover:bg-[#d9553a]"
              disabled={!selectedSponsorCompanyId || sponsorMutation.isPending}
              onClick={() => sponsorMutation.mutate(selectedSponsorCompanyId)}
            >
              {tx('k39')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={endDialogOpen} onOpenChange={setEndDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{tx('k40')}</AlertDialogTitle>
            <AlertDialogDescription>
              {tx('k59')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tx('k41')}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-[#ef6144] hover:bg-[#d9553a]"
              disabled={endSponsorshipMutation.isPending}
              onClick={() => endSponsorshipMutation.mutate()}
            >
              {tx('k42')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}