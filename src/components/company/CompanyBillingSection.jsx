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
  const { t, currentLanguage } = useLanguage();
const tx = (key, options) => t(`completeScoped.components_company_CompanyBillingSection.${key}`, options);
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
    ? tx('k1')
    : tx('k2');
  const isProPlan = subscriptionRecord.plan_code === 'paid';

  const billingStatusLabel = {
    free: tx('k3'),
    active: tx('k4'),
    incomplete: tx('k5'),
    past_due: tx('k6'),
    canceled: tx('k7'),
    unpaid: tx('k8'),
  }[subscriptionRecord.billing_status] || subscriptionRecord.billing_status;

  const formatDateLabel = (value) => {
    if (!value) return null;
    return format(new Date(value), 'd MMM yyyy', { locale: dateLocale });
  };

  const periodEndLabel = formatDateLabel(subscriptionRecord.current_period_end);
  const cycleLabel = subscriptionRecord.billing_cycle
    ? undefined
    : null;
  const isYearlyBilling = selectedBillingCycle === 'yearly';
  const upgradePriceLabel = isYearlyBilling ? tx('k9') : tx('k10');

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
        title: tx('k11'),
        description: tx('k74'),
      });
    },
    onError: (error, variables) => {
      if (variables?.silent) {
        return;
      }

      toast({
        title: tx('k12'),
        description: error?.message || tx('k13'),
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
        title: tx('k14'),
        description: tx('k75'),
      });
      stripeSyncMutation.mutate({ silent: true });
      queryClient.invalidateQueries({ queryKey: ['companySubscription', companyId] });
      queryClient.invalidateQueries({ queryKey: ['featureAccess', 'company', companyId] });
    }

    if (checkoutState === 'canceled') {
      toast({
        title: tx('k15'),
        description: tx('k76'),
      });
    }

    if (portalState === 'return') {
      toast({
        title: tx('k16'),
        description: tx('k77'),
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
        title: tx('k17'),
        description: tx('k78'),
      });
    },
    onError: (error) => {
      toast({
        title: tx('k18'),
        description: error?.message || tx('k19'),
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
        title: tx('k20'),
        description: tx('k79'),
      });
    },
    onError: (error) => {
      toast({
        title: tx('k21'),
        description: error?.message || tx('k22'),
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
                  <CardTitle className="text-lg">{tx('k23')}</CardTitle>
                  <p className="mt-1 text-sm text-gray-500">
                    {isProPlan
                      ? tx('k24')
                      : tx('k25')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={isProPlan ? 'bg-[#ef6144] text-white' : 'bg-slate-100 text-slate-700'}>
                  {planLabel}
                </Badge>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label={tx('k26')}>
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
                      ? tx('k27')
                      : tx('k28')}
                  </p>
                  <p className="text-sm text-slate-500">
                    {isProPlan
                      ? [billingStatusLabel, cycleLabel, periodEndLabel].filter(Boolean).join(' • ')
                      : tx('k29')}
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
                      {stripeSyncMutation.isPending ? tx('k30') : tx('k31')}
                    </Button>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" className="justify-start px-0 text-[#b5432e] hover:bg-transparent hover:text-[#ef6144] sm:justify-end">
                        {billingOpen ? tx('k32') : tx('k33')}
                      </Button>
                    </CollapsibleTrigger>
                  </div>
              </div>
            </div>

            <CollapsibleContent className="space-y-5 pt-5 data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-xl border bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-500">{tx('k34')}</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">{planLabel}</p>
                </div>
                <div className="rounded-xl border bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-500">{tx('k35')}</p>
                  <div className="mt-2">
                    <Badge className={billingStatusClasses[subscriptionRecord.billing_status] || 'bg-slate-100 text-slate-700'}>
                      {billingStatusLabel}
                    </Badge>
                  </div>
                </div>
                {cycleLabel ? (
                  <div className="rounded-xl border bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-500">{tx('k36')}</p>
                    <p className="mt-2 text-lg font-semibold text-slate-900">{cycleLabel}</p>
                  </div>
                ) : null}
                {periodEndLabel ? (
                  <div className="rounded-xl border bg-slate-50 p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-500">{tx('k37')}</p>
                    <p className="mt-2 text-lg font-semibold text-slate-900">{periodEndLabel}</p>
                  </div>
                ) : null}
              </div>

              {isProPlan ? (
                <Alert className="border-[#ef6144]/20 bg-[#ef6144]/5">
                  <Rocket className="h-4 w-4 text-[#ef6144]" />
                  <AlertTitle>{tx('k38')}</AlertTitle>
                  <AlertDescription>
                    {tx('k80')}
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="rounded-2xl border border-[#ef6144]/20 bg-[linear-gradient(135deg,rgba(239,97,68,0.08),rgba(255,244,235,0.95))] p-5">
                  <div className="space-y-5">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-2">
                        <p className="text-sm font-semibold text-[#b5432e]">{tx('k39')}</p>
                        <p className="text-2xl font-semibold text-slate-900">{upgradePriceLabel}</p>
                        <p className="text-sm text-slate-600">
                          {isYearlyBilling
                            ? tx('k40')
                            : tx('k41')}
                        </p>
                      </div>
                      <Tabs value={selectedBillingCycle} onValueChange={setSelectedBillingCycle}>
                        <TabsList className="grid h-auto w-full grid-cols-2 rounded-2xl bg-white/80 p-1 shadow-sm lg:w-[320px]">
                          <TabsTrigger value="monthly" className="h-auto rounded-xl px-4 py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                            <span className="flex flex-col items-start text-left">
                              <span className="text-sm font-semibold">{tx('k42')}</span>
                              <span className="text-xs text-slate-500">{tx('k43')}</span>
                            </span>
                          </TabsTrigger>
                          <TabsTrigger value="yearly" className="relative h-auto rounded-xl px-4 py-3 data-[state=active]:bg-[#fff7f1] data-[state=active]:text-[#9a3412] data-[state=active]:shadow-sm">
                            <span className="absolute -top-2 right-3 rounded-full bg-[#ef6144] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white shadow-sm">
                              {tx('k44')}
                            </span>
                            <span className="flex flex-col items-start text-left">
                              <span className="text-sm font-semibold">{tx('k45')}</span>
                              <span className="text-xs text-slate-500">{tx('k46')}</span>
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
                              {tx('k47')}
                            </span>
                            {isYearlyBilling ? (
                              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                                {tx('k48')}
                              </span>
                            ) : null}
                          </div>
                          <p className="text-xl font-semibold text-slate-900">
                            {isYearlyBilling
                              ? tx('k49')
                              : tx('k50')}
                          </p>
                          <p className="text-sm text-slate-600">
                            {isYearlyBilling
                              ? tx('k51')
                              : tx('k52')}
                          </p>
                        </div>
                        <div className="rounded-2xl bg-slate-950 px-5 py-4 text-white shadow-lg">
                          <p className="text-xs uppercase tracking-[0.2em] text-white/60">{tx('k53')}</p>
                          <p className="mt-2 text-3xl font-semibold">{isYearlyBilling ? '190€' : '19€'}</p>
                          <p className="mt-1 text-sm text-white/70">
                            {isYearlyBilling ? tx('k54') : tx('k55')}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                      <div className="rounded-xl border bg-white/80 p-4">
                        <p className="text-sm font-semibold text-slate-900">{tx('k56')}</p>
                        <p className="mt-1 text-sm text-slate-600">{tx('k57')}</p>
                      </div>
                      <div className="rounded-xl border bg-white/80 p-4">
                        <p className="text-sm font-semibold text-slate-900">{tx('k58')}</p>
                        <p className="mt-1 text-sm text-slate-600">{tx('k59')}</p>
                      </div>
                      <div className="rounded-xl border bg-white/80 p-4">
                        <p className="text-sm font-semibold text-slate-900">{tx('k60')}</p>
                        <p className="mt-1 text-sm text-slate-600">{tx('k61')}</p>
                      </div>
                      <div className="rounded-xl border bg-white/80 p-4">
                        <p className="text-sm font-semibold text-slate-900">{tx('k62')}</p>
                        <p className="mt-1 text-sm text-slate-600">{tx('k63')}</p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                      <p className="text-sm text-slate-600">
                        {tx('k81')}
                      </p>
                      {canUpgrade ? (
                        <Button className="h-11 w-full bg-[#ef6144] text-base font-semibold shadow-[0_20px_36px_-18px_rgba(239,97,68,0.95)] hover:bg-[#d9553a] lg:w-auto lg:px-8" onClick={() => checkoutMutation.mutate()} disabled={checkoutMutation.isPending}>
                          <Sparkles className="h-4 w-4" />
                          {checkoutMutation.isPending ? tx('k64') : tx('k65')}
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
                    {portalMutation.isPending ? tx('k66') : tx('k67')}
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
            <CardTitle className="text-lg">{tx('k68')}</CardTitle>
            <p className="mt-1 text-sm text-gray-500">
              {tx('k82')}
            </p>
          </div>
          <Badge variant="outline">
            {tx('k69').replace('{count}', String(sponsorships.length))}
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
                        {tx('k70')} {formatDateLabel(sponsorship.started_at)}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(createPageUrl('ProjectDetail') + `?id=${sponsorship.project_id}`)}
                    >
                      <ExternalLink className="h-4 w-4" />
                      {tx('k71')}
                    </Button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed p-5 text-sm text-slate-600">
              {canSponsorProjects
                ? tx('k83')
                : tx('k84')}
            </div>
          )}

          <div className="rounded-xl border bg-slate-50 p-4 text-sm text-slate-600">
            <p className="font-medium text-slate-900">{companyName}</p>
            <p className="mt-1">
              {canSponsorProjects
                ? tx('k85')
                : tx('k86')}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}