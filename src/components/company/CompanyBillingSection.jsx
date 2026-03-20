import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { enUS, it } from 'date-fns/locale';
import { CreditCard, ExternalLink, Rocket, Sparkles } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createPageUrl } from '@/utils';
import { appClient } from '@/api/appClient';
import { useLanguage } from '@/components/i18n/useLanguage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton.jsx';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCompanyFeatureAccess } from '@/hooks/useFeatureAccess';
import { normalizeCompanySubscription } from '@/lib/subscriptions';
import { toast } from '@/components/ui/use-toast';

const billingStatusClasses = {
  free: 'bg-slate-100 text-slate-700',
  active: 'bg-green-100 text-green-700',
  incomplete: 'bg-amber-100 text-amber-700',
  past_due: 'bg-amber-100 text-amber-700',
  canceled: 'bg-red-100 text-red-700',
  unpaid: 'bg-red-100 text-red-700',
};

export default function CompanyBillingSection({ companyId, companyName, isAdmin }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { currentLanguage } = useLanguage();
  const tr = (itText, enText) => (currentLanguage === 'it' ? itText : enText);
  const dateLocale = currentLanguage === 'it' ? it : enUS;
  const [selectedBillingCycle, setSelectedBillingCycle] = useState('monthly');

  const { featureMap, isLoading: featuresLoading } = useCompanyFeatureAccess(companyId, [
    'company_billing',
    'project_sponsorship',
  ], { enabled: !!companyId && isAdmin });

  const { data: subscription, isLoading: subscriptionLoading } = useQuery({
    queryKey: ['companySubscription', companyId],
    queryFn: async () => {
      const records = await appClient.entities.CompanySubscription.filter({ company_id: companyId });
      return normalizeCompanySubscription(records[0], companyId);
    },
    enabled: !!companyId && isAdmin,
    staleTime: 60 * 1000,
  });

  const { data: sponsorships = [], isLoading: sponsorshipsLoading } = useQuery({
    queryKey: ['companySponsoredProjects', companyId],
    queryFn: () => appClient.entities.ProjectSponsorship.filter({ sponsor_company_id: companyId, status: 'active' }),
    enabled: !!companyId && isAdmin,
    staleTime: 60 * 1000,
  });

  const sponsoredProjectIds = useMemo(
    () => [...new Set(sponsorships.map((sponsorship) => sponsorship.project_id).filter(Boolean))],
    [sponsorships],
  );

  const { data: sponsoredProjects = [], isLoading: sponsoredProjectsLoading } = useQuery({
    queryKey: ['companySponsoredProjectRecords', companyId, sponsoredProjectIds],
    queryFn: () => appClient.entities.Project.filter({ id: sponsoredProjectIds }),
    enabled: !!companyId && isAdmin && sponsoredProjectIds.length > 0,
    staleTime: 60 * 1000,
  });

  const subscriptionRecord = normalizeCompanySubscription(subscription, companyId);
  const billingFeatureAccess = featureMap.company_billing;
  const sponsorshipFeatureAccess = featureMap.project_sponsorship;
  const canUpgrade = Boolean(billingFeatureAccess?.config?.can_upgrade);
  const canManageSubscription = Boolean(billingFeatureAccess?.config?.can_manage_subscription);
  const canSponsorProjects = sponsorshipFeatureAccess?.access_level === 'enabled';

  const sponsoredProjectsById = useMemo(
    () => Object.fromEntries(sponsoredProjects.map((project) => [project.id, project])),
    [sponsoredProjects],
  );

  useEffect(() => {
    const url = new URL(window.location.href);
    const checkoutState = url.searchParams.get('stripe_checkout');
    const portalState = url.searchParams.get('stripe_portal');

    if (!checkoutState && !portalState) {
      return;
    }

    if (checkoutState === 'success') {
      toast({
        title: tr('Checkout completato', 'Checkout completed'),
        description: tr(
          'Stripe ha completato il checkout. La sottoscrizione verra riallineata via webhook e questa sezione si aggiornera automaticamente.',
          'Stripe completed the checkout. The subscription will be synchronized by webhook and this section will refresh automatically.',
        ),
      });
      queryClient.invalidateQueries({ queryKey: ['companySubscription', companyId] });
      queryClient.invalidateQueries({ queryKey: ['featureAccess', 'company', companyId] });
    }

    if (checkoutState === 'canceled') {
      toast({
        title: tr('Checkout annullato', 'Checkout canceled'),
        description: tr(
          'Nessuna modifica e stata applicata al piano della societa.',
          'No changes were applied to the company plan.',
        ),
      });
    }

    if (portalState === 'return') {
      toast({
        title: tr('Rientro dal customer portal', 'Returned from customer portal'),
        description: tr(
          'Ho richiesto un refresh dello stato billing della societa.',
          'I requested a refresh of the company billing state.',
        ),
      });
      queryClient.invalidateQueries({ queryKey: ['companySubscription', companyId] });
      queryClient.invalidateQueries({ queryKey: ['featureAccess', 'company', companyId] });
    }

    url.searchParams.delete('stripe_checkout');
    url.searchParams.delete('session_id');
    url.searchParams.delete('stripe_portal');
    window.history.replaceState({}, '', url.toString());
  }, [companyId, queryClient, currentLanguage]);

  const checkoutMutation = useMutation({
    mutationFn: async () => {
      const returnUrl = `${window.location.origin}${createPageUrl('CompanyDetail')}?id=${companyId}&tab=billing`;
      return appClient.functions.invoke('createStripeCheckoutSession', {
        company_id: companyId,
        billing_cycle: selectedBillingCycle,
        return_url: returnUrl,
      });
    },
    onSuccess: (result) => {
      if (result?.url) {
        window.location.assign(result.url);
        return;
      }

      toast({
        title: tr('Checkout non disponibile', 'Checkout unavailable'),
        description: tr(
          'Stripe non ha restituito un URL di checkout valido.',
          'Stripe did not return a valid checkout URL.',
        ),
      });
    },
    onError: (error) => {
      toast({
        title: tr('Impossibile avviare il checkout', 'Unable to start checkout'),
        description: error?.message || tr('Controlla la configurazione Stripe del progetto.', 'Check the project Stripe configuration.'),
      });
    },
  });

  const portalMutation = useMutation({
    mutationFn: async () => {
      const returnUrl = `${window.location.origin}${createPageUrl('CompanyDetail')}?id=${companyId}&tab=billing`;
      return appClient.functions.invoke('createStripeBillingPortalSession', {
        company_id: companyId,
        return_url: returnUrl,
      });
    },
    onSuccess: (result) => {
      if (result?.url) {
        window.location.assign(result.url);
        return;
      }

      toast({
        title: tr('Customer portal non disponibile', 'Customer portal unavailable'),
        description: tr(
          'Stripe non ha restituito un URL di portal valido.',
          'Stripe did not return a valid portal URL.',
        ),
      });
    },
    onError: (error) => {
      toast({
        title: tr('Impossibile aprire il customer portal', 'Unable to open the customer portal'),
        description: error?.message || tr('Controlla la configurazione Stripe del progetto.', 'Check the project Stripe configuration.'),
      });
    },
  });

  if (!isAdmin) {
    return null;
  }

  if (featuresLoading || subscriptionLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  const planLabel = subscriptionRecord.plan_code === 'paid'
    ? tr('Piano paid', 'Paid plan')
    : tr('Piano free', 'Free plan');

  const billingStatusLabel = {
    free: tr('Free', 'Free'),
    active: tr('Attivo', 'Active'),
    incomplete: tr('In sospeso', 'Incomplete'),
    past_due: tr('Scaduto', 'Past due'),
    canceled: tr('Cancellato', 'Canceled'),
    unpaid: tr('Non pagato', 'Unpaid'),
  }[subscriptionRecord.billing_status] || subscriptionRecord.billing_status;

  const formatDateLabel = (value) => {
    if (!value) return tr('Non disponibile', 'Not available');
    return format(new Date(value), 'd MMM yyyy', { locale: dateLocale });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CreditCard className="h-5 w-5 text-[#ef6144]" />
              {tr('Fatturazione e piano', 'Billing and plan')}
            </CardTitle>
            <p className="mt-1 text-sm text-gray-500">
              {tr(
                'Stato corrente dell abbonamento societario e prossimi passi commerciali.',
                'Current company subscription state and next commercial steps.',
              )}
            </p>
          </div>
          <Badge className={subscriptionRecord.plan_code === 'paid' ? 'bg-[#ef6144] text-white' : 'bg-slate-100 text-slate-700'}>
            {planLabel}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">{tr('Piano', 'Plan')}</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">{planLabel}</p>
            </div>
            <div className="rounded-xl border bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">{tr('Stato billing', 'Billing status')}</p>
              <div className="mt-2">
                <Badge className={billingStatusClasses[subscriptionRecord.billing_status] || 'bg-slate-100 text-slate-700'}>
                  {billingStatusLabel}
                </Badge>
              </div>
            </div>
            <div className="rounded-xl border bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">{tr('Ciclo', 'Cycle')}</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">
                {subscriptionRecord.billing_cycle
                  ? tr(
                    subscriptionRecord.billing_cycle === 'monthly' ? 'Mensile' : 'Annuale',
                    subscriptionRecord.billing_cycle === 'monthly' ? 'Monthly' : 'Yearly',
                  )
                  : tr('Non impostato', 'Not set')}
              </p>
            </div>
            <div className="rounded-xl border bg-slate-50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">{tr('Fine periodo', 'Period end')}</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">{formatDateLabel(subscriptionRecord.current_period_end)}</p>
            </div>
          </div>

          <Alert className="border-[#ef6144]/20 bg-[#ef6144]/5">
            <Rocket className="h-4 w-4 text-[#ef6144]" />
            <AlertTitle>{tr('Billing Stripe in sandbox', 'Stripe billing in sandbox')}</AlertTitle>
            <AlertDescription>
              {tr(
                'Checkout e customer portal ora passano da Stripe in modalita test. Il riallineamento del piano avviene tramite webhook sul backend Supabase.',
                'Checkout and customer portal now go through Stripe in test mode. Plan synchronization happens through a Supabase backend webhook.',
              )}
            </AlertDescription>
          </Alert>

          <div className="flex flex-wrap gap-3">
            {canUpgrade ? (
              <>
                <div className="min-w-[180px]">
                  <Select value={selectedBillingCycle} onValueChange={setSelectedBillingCycle}>
                    <SelectTrigger>
                      <SelectValue placeholder={tr('Seleziona ciclo', 'Select cycle')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">{tr('Mensile · 19€', 'Monthly · €19')}</SelectItem>
                      <SelectItem value="yearly">{tr('Annuale · 190€', 'Yearly · €190')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button className="bg-[#ef6144] hover:bg-[#d9553a]" onClick={() => checkoutMutation.mutate()} disabled={checkoutMutation.isPending}>
                  <Sparkles className="h-4 w-4" />
                  {checkoutMutation.isPending ? tr('Apro Stripe...', 'Opening Stripe...') : tr('Avvia upgrade', 'Start upgrade')}
                </Button>
              </>
            ) : null}
            {canManageSubscription ? (
              <Button variant="outline" onClick={() => portalMutation.mutate()} disabled={portalMutation.isPending}>
                <ExternalLink className="h-4 w-4" />
                {portalMutation.isPending ? tr('Apro portal...', 'Opening portal...') : tr('Apri customer portal', 'Open customer portal')}
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-lg">{tr('Sponsorship attive', 'Active sponsorships')}</CardTitle>
            <p className="mt-1 text-sm text-gray-500">
              {tr(
                'Progetti attualmente sbloccati da questa societa.',
                'Projects currently unlocked by this company.',
              )}
            </p>
          </div>
          <Badge variant="outline">
            {tr('{count} attive', '{count} active').replace('{count}', String(sponsorships.length))}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          {sponsorshipsLoading || sponsoredProjectsLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : sponsorships.length > 0 ? (
            <div className="space-y-3">
              {sponsorships.map((sponsorship) => {
                const project = sponsoredProjectsById[sponsorship.project_id];
                return (
                  <div key={sponsorship.id} className="flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">{project?.name || sponsorship.project_id}</p>
                      <p className="text-sm text-slate-500">
                        {tr('Attiva dal', 'Active since')} {formatDateLabel(sponsorship.started_at)}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(createPageUrl('ProjectDetail') + `?id=${sponsorship.project_id}`)}
                    >
                      <ExternalLink className="h-4 w-4" />
                      {tr('Apri progetto', 'Open project')}
                    </Button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed p-5 text-sm text-slate-600">
              {canSponsorProjects
                ? tr(
                  'Questa societa puo sponsorizzare i progetti a cui partecipa, ma al momento non ha sponsorship attive.',
                  'This company can sponsor the projects it participates in, but it currently has no active sponsorships.',
                )
                : tr(
                  'Le sponsorship di progetto si sbloccano con il piano paid. Finche la societa resta free, qui vedrai solo lo stato e l invito all upgrade.',
                  'Project sponsorships unlock on the paid plan. While the company stays on the free plan, this area only shows status and the upgrade prompt.',
                )}
            </div>
          )}

          <div className="rounded-xl border bg-slate-50 p-4 text-sm text-slate-600">
            <p className="font-medium text-slate-900">{companyName}</p>
            <p className="mt-1">
              {canSponsorProjects
                ? tr(
                  'Puo sponsorizzare un progetto solo se e gia partecipante attivo del progetto stesso.',
                  'It can sponsor a project only if it is already an active participant in that project.',
                )
                : tr(
                  'Per sponsorizzare un progetto serve un piano paid attivo con billing status attivo.',
                  'Sponsoring a project requires an active paid plan with active billing status.',
                )}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}