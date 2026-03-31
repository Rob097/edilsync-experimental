import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { enUS, it } from 'date-fns/locale';
import { ChevronDown, CreditCard, ExternalLink, Rocket, Sparkles } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createPageUrl } from '@/utils';
import { appClient } from '@/api/appClient';
import { useLanguage } from '@/components/i18n/useLanguage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton.jsx';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  const [billingOpen, setBillingOpen] = useState(false);
  const [billingOpenInitialized, setBillingOpenInitialized] = useState(false);
  const [hasSyncedFromStripe, setHasSyncedFromStripe] = useState(false);
  const [shouldRefreshAfterReturn, setShouldRefreshAfterReturn] = useState(() => {
    const url = new URL(window.location.href);
    return url.searchParams.get('stripe_checkout') === 'success' || url.searchParams.get('stripe_portal') === 'return';
  });

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
    refetchInterval: shouldRefreshAfterReturn ? 3000 : false,
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
  const planLabel = subscriptionRecord.plan_code === 'paid'
    ? tr('Pro', 'Pro')
    : tr('Base', 'Base');
  const isProPlan = subscriptionRecord.plan_code === 'paid';

  const billingStatusLabel = {
    free: tr('Base', 'Base'),
    active: tr('Attivo', 'Active'),
    incomplete: tr('Da completare', 'Needs completion'),
    past_due: tr('Pagamento da aggiornare', 'Payment issue'),
    canceled: tr('Cancellato', 'Canceled'),
    unpaid: tr('Pagamento non riuscito', 'Payment failed'),
  }[subscriptionRecord.billing_status] || subscriptionRecord.billing_status;

  const formatDateLabel = (value) => {
    if (!value) return null;
    return format(new Date(value), 'd MMM yyyy', { locale: dateLocale });
  };

  const periodEndLabel = formatDateLabel(subscriptionRecord.current_period_end);
  const cycleLabel = subscriptionRecord.billing_cycle
    ? tr(
      subscriptionRecord.billing_cycle === 'monthly' ? 'Mensile' : 'Annuale',
      subscriptionRecord.billing_cycle === 'monthly' ? 'Monthly' : 'Yearly',
    )
    : null;
  const isYearlyBilling = selectedBillingCycle === 'yearly';
  const upgradePriceLabel = isYearlyBilling ? tr('190€ / anno', '€190 / year') : tr('19€ / mese', '€19 / month');

  const sponsoredProjectsById = useMemo(
    () => Object.fromEntries(sponsoredProjects.map((project) => [project.id, project])),
    [sponsoredProjects],
  );

  const stripeSyncMutation = useMutation({
    mutationFn: async () => appClient.functions.invoke('syncStripeCompanySubscription', {
      company_id: companyId,
    }),
    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['companySubscription', companyId] }),
        queryClient.invalidateQueries({ queryKey: ['featureAccess', 'company', companyId] }),
        queryClient.invalidateQueries({ queryKey: ['companySponsoredProjects', companyId] }),
      ]);

      if (variables?.silent) {
        return;
      }

      toast({
        title: tr('Fatturazione aggiornata', 'Billing refreshed'),
        description: tr(
          'Ho riallineato lo stato del piano con il profilo di pagamento.',
          'I synced the plan status with the payment profile.',
        ),
      });
    },
    onError: (error, variables) => {
      if (variables?.silent) {
        return;
      }

      toast({
        title: tr('Impossibile aggiornare la fatturazione', 'Unable to refresh billing'),
        description: error?.message || tr('Riprova tra qualche secondo.', 'Please try again in a few seconds.'),
      });
    },
  });

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
          'Pagamento completato. Stiamo aggiornando il piano della societa.',
          'Payment completed. We are updating the company plan.',
        ),
      });
      stripeSyncMutation.mutate({ silent: true });
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
        title: tr('Piano aggiornato', 'Plan updated'),
        description: tr(
          'Sto aggiornando i dati di fatturazione della societa.',
          'Refreshing the company billing details.',
        ),
      });
      stripeSyncMutation.mutate({ silent: true });
      queryClient.invalidateQueries({ queryKey: ['companySubscription', companyId] });
      queryClient.invalidateQueries({ queryKey: ['featureAccess', 'company', companyId] });
    }

    url.searchParams.delete('stripe_checkout');
    url.searchParams.delete('session_id');
    url.searchParams.delete('stripe_portal');
    window.history.replaceState({}, '', url.toString());
  }, [companyId, queryClient, stripeSyncMutation, currentLanguage]);

  useEffect(() => {
    if (billingOpenInitialized) {
      return;
    }

    setBillingOpen(!isProPlan);
    setBillingOpenInitialized(true);
  }, [billingOpenInitialized, isProPlan]);

  useEffect(() => {
    if (!shouldRefreshAfterReturn) {
      return;
    }

    if (isProPlan) {
      setShouldRefreshAfterReturn(false);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setShouldRefreshAfterReturn(false);
    }, 20000);

    return () => window.clearTimeout(timeoutId);
  }, [isProPlan, shouldRefreshAfterReturn]);

  useEffect(() => {
    if (!companyId || !isAdmin || hasSyncedFromStripe || stripeSyncMutation.isPending) {
      return;
    }

    if (!subscription?.stripe_subscription_id && !subscription?.stripe_customer_id) {
      setHasSyncedFromStripe(true);
      return;
    }

    setHasSyncedFromStripe(true);
    stripeSyncMutation.mutate({ silent: true });
  }, [companyId, hasSyncedFromStripe, isAdmin, stripeSyncMutation, subscription?.stripe_customer_id, subscription?.stripe_subscription_id]);

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
        title: tr('Pagina pagamento non disponibile', 'Payment page unavailable'),
        description: tr(
          'Non sono riuscito ad aprire la pagina di pagamento.',
          'I could not open the payment page.',
        ),
      });
    },
    onError: (error) => {
      toast({
        title: tr('Impossibile aprire la pagina di pagamento', 'Unable to open the payment page'),
        description: error?.message || tr('Riprova tra qualche secondo.', 'Please try again in a few seconds.'),
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
        title: tr('Gestione piano non disponibile', 'Plan management unavailable'),
        description: tr(
          'Non sono riuscito ad aprire la pagina di gestione del piano.',
          'I could not open the plan management page.',
        ),
      });
    },
    onError: (error) => {
      toast({
        title: tr('Impossibile modificare il piano', 'Unable to manage the plan'),
        description: error?.message || tr('Riprova tra qualche secondo.', 'Please try again in a few seconds.'),
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

  return (
    <div className="space-y-6">
      <Collapsible open={billingOpen} onOpenChange={setBillingOpen}>
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#ef6144]/10">
                  <CreditCard className="h-5 w-5 text-[#ef6144]" />
                </div>
                <div>
                  <CardTitle className="text-lg">{tr('Fatturazione e piano', 'Billing and plan')}</CardTitle>
                  <p className="mt-1 text-sm text-gray-500">
                    {isProPlan
                      ? tr('Piano Pro attivo', 'Pro plan active')
                      : tr('Piano Base attivo', 'Base plan active')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={isProPlan ? 'bg-[#ef6144] text-white' : 'bg-slate-100 text-slate-700'}>
                  {planLabel}
                </Badge>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label={tr('Espandi fatturazione', 'Expand billing')}>
                    <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform ${billingOpen ? 'rotate-180' : ''}`} />
                  </Button>
                </CollapsibleTrigger>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="min-h-[88px] rounded-xl border bg-slate-50 p-4">
              <div className="flex h-full flex-col justify-between gap-2 sm:flex-row sm:items-center">
                <div>
                  <p className="text-lg font-semibold text-slate-900">
                    {isProPlan
                      ? tr('Gestisci il piano della societa', 'Manage the company plan')
                      : tr('Passa a Pro per sbloccare di piu', 'Upgrade to Pro to unlock more')}
                  </p>
                  <p className="text-sm text-slate-500">
                    {isProPlan
                      ? [billingStatusLabel, cycleLabel, periodEndLabel].filter(Boolean).join(' • ')
                      : tr('Sponsorship progetto, strumenti avanzati e gestione semplice del piano.', 'Project sponsorship, advanced tools, and simple plan management.')}
                  </p>
                </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                      onClick={() => stripeSyncMutation.mutate({ silent: false })}
                      disabled={stripeSyncMutation.isPending}
                    >
                      {stripeSyncMutation.isPending ? tr('Aggiornamento...', 'Refreshing...') : tr('Aggiorna da Stripe', 'Refresh from Stripe')}
                    </Button>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" className="justify-start px-0 text-[#b5432e] hover:bg-transparent hover:text-[#ef6144] sm:justify-end">
                        {billingOpen ? tr('Nascondi dettagli', 'Hide details') : tr('Mostra dettagli', 'Show details')}
                      </Button>
                    </CollapsibleTrigger>
                  </div>
              </div>
            </div>

            <CollapsibleContent className="space-y-5 pt-5 data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-xl border bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-500">{tr('Piano', 'Plan')}</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">{planLabel}</p>
                </div>
                <div className="rounded-xl border bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-500">{tr('Stato fatturazione', 'Billing status')}</p>
                  <div className="mt-2">
                    <Badge className={billingStatusClasses[subscriptionRecord.billing_status] || 'bg-slate-100 text-slate-700'}>
                      {billingStatusLabel}
                    </Badge>
                  </div>
                </div>
                {cycleLabel ? (
                  <div className="rounded-xl border bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-500">{tr('Ciclo', 'Cycle')}</p>
                    <p className="mt-2 text-lg font-semibold text-slate-900">{cycleLabel}</p>
                  </div>
                ) : null}
                {periodEndLabel ? (
                  <div className="rounded-xl border bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-500">{tr('Rinnovo', 'Renewal')}</p>
                    <p className="mt-2 text-lg font-semibold text-slate-900">{periodEndLabel}</p>
                  </div>
                ) : null}
              </div>

              {isProPlan ? (
                <Alert className="border-[#ef6144]/20 bg-[#ef6144]/5">
                  <Rocket className="h-4 w-4 text-[#ef6144]" />
                  <AlertTitle>{tr('Piano Pro attivo', 'Pro plan active')}</AlertTitle>
                  <AlertDescription>
                    {tr(
                      'Puoi aggiornare il piano o controllare la fatturazione in modo sicuro.',
                      'You can update the plan or review billing securely.',
                    )}
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="rounded-2xl border border-[#ef6144]/20 bg-[linear-gradient(135deg,rgba(239,97,68,0.08),rgba(255,244,235,0.95))] p-5">
                  <div className="space-y-5">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-2">
                        <p className="text-sm font-semibold text-[#b5432e]">{tr('Piano Pro', 'Pro plan')}</p>
                        <p className="text-2xl font-semibold text-slate-900">{upgradePriceLabel}</p>
                        <p className="text-sm text-slate-600">
                          {isYearlyBilling
                            ? tr('Con l annuale hai 2 mensilita gratuite.', 'Yearly gives you 2 months free.')
                            : tr('Flessibile, mese per mese.', 'Flexible, month by month.')}
                        </p>
                      </div>
                      <Tabs value={selectedBillingCycle} onValueChange={setSelectedBillingCycle}>
                        <TabsList className="grid h-auto w-full grid-cols-2 rounded-2xl bg-white/80 p-1 shadow-sm lg:w-[320px]">
                          <TabsTrigger value="monthly" className="h-auto rounded-xl px-4 py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                            <span className="flex flex-col items-start text-left">
                              <span className="text-sm font-semibold">{tr('Mensile', 'Monthly')}</span>
                              <span className="text-xs text-slate-500">{tr('19€ al mese', '€19 per month')}</span>
                            </span>
                          </TabsTrigger>
                          <TabsTrigger value="yearly" className="relative h-auto rounded-xl px-4 py-3 data-[state=active]:bg-[#fff7f1] data-[state=active]:text-[#9a3412] data-[state=active]:shadow-sm">
                            <span className="absolute -top-2 right-3 rounded-full bg-[#ef6144] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white shadow-sm">
                              {tr('2 mesi gratis', '2 months free')}
                            </span>
                            <span className="flex flex-col items-start text-left">
                              <span className="text-sm font-semibold">{tr('Annuale', 'Yearly')}</span>
                              <span className="text-xs text-slate-500">{tr('190€ all anno', '€190 per year')}</span>
                            </span>
                          </TabsTrigger>
                        </TabsList>
                      </Tabs>
                    </div>

                    <div className={`overflow-hidden rounded-2xl border transition-all ${isYearlyBilling ? 'border-[#ef6144]/30 bg-[radial-gradient(circle_at_top_left,rgba(239,97,68,0.18),transparent_45%),linear-gradient(135deg,#fff7f1,#ffffff)] shadow-[0_18px_50px_-24px_rgba(239,97,68,0.65)]' : 'border-slate-200 bg-white/70'}`}>
                      <div className="flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between lg:p-5">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-[#ef6144] px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
                              {tr('Offerta migliore', 'Best value')}
                            </span>
                            {isYearlyBilling ? (
                              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                                {tr('Risparmi 38€ l anno', 'Save €38 per year')}
                              </span>
                            ) : null}
                          </div>
                          <p className="text-xl font-semibold text-slate-900">
                            {isYearlyBilling
                              ? tr('Con l annuale lavori 12 mesi ma ne paghi 10.', 'With yearly billing you get 12 months and pay for 10.')
                              : tr('Puoi iniziare subito e passare all annuale quando vuoi.', 'You can start now and switch to yearly anytime.')}
                          </p>
                          <p className="text-sm text-slate-600">
                            {isYearlyBilling
                              ? tr('La scelta annuale e quella piu conveniente per chi usa EdilSync tutto l anno.', 'Yearly billing is the best option if you use EdilSync all year.')
                              : tr('Se preferisci piu flessibilita, il mensile resta disponibile.', 'If you prefer more flexibility, monthly remains available.')}
                          </p>
                        </div>
                        <div className="rounded-2xl bg-slate-950 px-5 py-4 text-white shadow-lg">
                          <p className="text-xs uppercase tracking-[0.2em] text-white/60">{tr('Totale', 'Total')}</p>
                          <p className="mt-2 text-3xl font-semibold">{isYearlyBilling ? '190€' : '19€'}</p>
                          <p className="mt-1 text-sm text-white/70">
                            {isYearlyBilling ? tr('12 mesi di accesso Pro', '12 months of Pro access') : tr('1 mese di accesso Pro', '1 month of Pro access')}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                      <div className="rounded-xl border bg-white/80 p-4">
                        <p className="text-sm font-semibold text-slate-900">{tr('Sponsorship progetto', 'Project sponsorship')}</p>
                        <p className="mt-1 text-sm text-slate-600">{tr('Sblocchi i progetti a cui partecipa la societa.', 'Unlock projects your company participates in.')}</p>
                      </div>
                      <div className="rounded-xl border bg-white/80 p-4">
                        <p className="text-sm font-semibold text-slate-900">{tr('Strumenti avanzati', 'Advanced tools')}</p>
                        <p className="mt-1 text-sm text-slate-600">{tr('Più funzioni per organizzare il lavoro della societa.', 'More tools to run your company work.')}</p>
                      </div>
                      <div className="rounded-xl border bg-white/80 p-4">
                        <p className="text-sm font-semibold text-slate-900">{tr('Gestione semplice', 'Simple management')}</p>
                        <p className="mt-1 text-sm text-slate-600">{tr('Modifichi o aggiorni il piano in pochi passaggi, in modo sicuro.', 'Change or update the plan securely in a few steps.')}</p>
                      </div>
                      <div className="rounded-xl border bg-white/80 p-4">
                        <p className="text-sm font-semibold text-slate-900">{tr('Attivazione immediata', 'Instant activation')}</p>
                        <p className="mt-1 text-sm text-slate-600">{tr('Dopo il pagamento il piano si aggiorna automaticamente.', 'After payment the plan updates automatically.')}</p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                      <p className="text-sm text-slate-600">
                        {tr(
                          'Dopo il clic si apre una pagina di pagamento sicura. Il primo caricamento puo richiedere qualche secondo.',
                          'After you click, a secure payment page opens. The first load can take a few seconds.',
                        )}
                      </p>
                      {canUpgrade ? (
                        <Button className="h-11 w-full bg-[#ef6144] text-base font-semibold shadow-[0_20px_36px_-18px_rgba(239,97,68,0.95)] hover:bg-[#d9553a] lg:w-auto lg:px-8" onClick={() => checkoutMutation.mutate()} disabled={checkoutMutation.isPending}>
                          <Sparkles className="h-4 w-4" />
                          {checkoutMutation.isPending ? tr('Sto aprendo la pagina sicura...', 'Opening secure page...') : tr('Passa a Pro', 'Upgrade to Pro')}
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </div>
              )}

              {canManageSubscription ? (
                <div className="flex flex-wrap gap-3">
                  <Button variant="outline" onClick={() => portalMutation.mutate()} disabled={portalMutation.isPending}>
                    <ExternalLink className="h-4 w-4" />
                    {portalMutation.isPending ? tr('Sto aprendo la pagina sicura...', 'Opening secure page...') : tr('Modifica piano', 'Manage plan')}
                  </Button>
                </div>
              ) : null}
            </CollapsibleContent>
          </CardContent>
        </Card>
      </Collapsible>

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
                  'Con il piano Pro potrai sponsorizzare i progetti a cui la societa partecipa.',
                  'With the Pro plan, you will be able to sponsor the projects your company joins.',
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
                  'Per sponsorizzare un progetto serve un piano Pro attivo.',
                  'Sponsoring a project requires an active Pro plan.',
                )}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}