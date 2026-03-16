import React, { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { appClient } from '@/api/appClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/components/i18n/useLanguage';
import { CircleHelp, ChevronDown, Loader2 } from 'lucide-react';
import { computeLaborSyncCandidates, parseHours, pickRate, toDateOnly } from './financeUtils';
import { useTour } from '@/components/tour/TourProvider';
import { getFinanceCardTour } from '@/components/tour/tours/financeTour';
import { getUserDisplayNameByEmail } from '@/lib/userDisplay';

const COST_CATEGORIES = ['labor', 'materials', 'equipment', 'subcontract', 'indirect', 'extra', 'adjustment'];

export default function ProjectFinancialSection({
  projectId,
  permissions,
  user,
  participants = [],
}) {
  const { t, currentLanguage } = useLanguage();
  const { startTour } = useTour();
  const queryClient = useQueryClient();
  const financePermissions = permissions || {};
  const canViewBudget = Boolean(financePermissions.canViewBudget);
  const canViewCosts = Boolean(financePermissions.canViewCosts);
  const canViewRates = Boolean(financePermissions.canViewRates);
  const canViewProgress = Boolean(financePermissions.canViewProgress);
  const canViewSettings = Boolean(financePermissions.canViewSettings);
  const canManageBudget = Boolean(financePermissions.canManageBudget);
  const canRecordCosts = Boolean(financePermissions.canRecordCosts);
  const canManageRates = Boolean(financePermissions.canManageRates);
  const canSyncLabor = Boolean(financePermissions.canSyncLabor);
  const canManageProgress = Boolean(financePermissions.canManageProgress);
  const canManageSettings = Boolean(financePermissions.canManageSettings);
  const permissionScope = financePermissions.scope || 'viewer';
  const [openSections, setOpenSections] = useState({
    settings: false,
    budget: false,
    costs: false,
    rates: false,
    progress: false,
  });

  const [settingsForm, setSettingsForm] = useState({
    currency: 'EUR',
    budget_tracking_mode: 'simple',
    labor_cost_method: 'from_work_sessions',
    financial_visibility: 'project_full',
    enable_progress_statements: false,
  });

  const [budgetForm, setBudgetForm] = useState({
    code: '',
    title: '',
    category: 'labor',
    amount_planned: '',
    company_id: '__none__',
  });

  const [costForm, setCostForm] = useState({
    cost_type: 'labor',
    description: '',
    amount: '',
    company_id: '__none__',
    entry_date: toDateOnly(new Date().toISOString()) || '',
  });

  const [rateForm, setRateForm] = useState({
    company_id: '__none__',
    user_email: '__none__',
    hourly_cost: '',
    valid_from: toDateOnly(new Date().toISOString()) || '',
    valid_to: '',
  });

  const [progressForm, setProgressForm] = useState({
    statement_date: toDateOnly(new Date().toISOString()) || '',
    amount_matured: '',
    advances_paid: '',
    amount_to_pay: '',
    notes: '',
  });

  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: () => appClient.entities.Company.list(),
    staleTime: 2 * 60 * 1000,
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => appClient.entities.User.list(),
    staleTime: 2 * 60 * 1000,
  });

  const { data: projectSettings = [] } = useQuery({
    queryKey: ['projectFinancialSettings', projectId],
    queryFn: () => appClient.entities.ProjectFinancialSettings.filter({ project_id: projectId }),
    enabled: !!projectId,
    staleTime: 60 * 1000,
  });

  const settings = projectSettings[0] || null;

  useEffect(() => {
    if (!settings) return;
    setSettingsForm({
      currency: settings.currency || 'EUR',
      budget_tracking_mode: settings.budget_tracking_mode || 'simple',
      labor_cost_method: settings.labor_cost_method || 'from_work_sessions',
      financial_visibility: settings.financial_visibility || 'project_full',
      enable_progress_statements: Boolean(settings.enable_progress_statements),
    });
  }, [settings]);

  const { data: budgetLines = [] } = useQuery({
    queryKey: ['budgetLines', projectId],
    queryFn: () => appClient.entities.BudgetLine.filter({ project_id: projectId }, '-created_date'),
    enabled: !!projectId,
    staleTime: 30 * 1000,
  });

  const { data: costEntries = [] } = useQuery({
    queryKey: ['costEntries', projectId],
    queryFn: () => appClient.entities.CostEntry.filter({ project_id: projectId }, '-entry_date'),
    enabled: !!projectId,
    staleTime: 30 * 1000,
  });

  const { data: laborRates = [] } = useQuery({
    queryKey: ['laborRates'],
    queryFn: () => appClient.entities.LaborRate.list('-valid_from'),
    staleTime: 60 * 1000,
  });

  const { data: workSessions = [] } = useQuery({
    queryKey: ['financialWorkSessions', projectId],
    queryFn: () => appClient.entities.WorkSession.filter({ project_id: projectId }, '-started_at'),
    enabled: !!projectId,
    staleTime: 30 * 1000,
  });

  const { data: changeRequests = [] } = useQuery({
    queryKey: ['changeRequests', projectId],
    queryFn: () => appClient.entities.ChangeRequest.filter({ project_id: projectId }),
    enabled: !!projectId,
    staleTime: 30 * 1000,
  });

  const { data: disputes = [] } = useQuery({
    queryKey: ['disputes', projectId],
    queryFn: () => appClient.entities.DisputeCase.filter({ project_id: projectId }),
    enabled: !!projectId,
    staleTime: 30 * 1000,
  });

  const { data: progressStatements = [] } = useQuery({
    queryKey: ['progressStatements', projectId],
    queryFn: () => appClient.entities.ProgressStatement.filter({ project_id: projectId }, '-statement_date'),
    enabled: !!projectId,
    staleTime: 30 * 1000,
  });

  const companyById = useMemo(() => {
    const map = new Map();
    companies.forEach((company) => map.set(company.id, company));
    return map;
  }, [companies]);

  const projectCompanyParticipants = useMemo(() =>
    participants
      .filter((item) => item.participant_type === 'company' && !!item.company_id)
      .map((item) => item.company_id)
      .filter((value, index, arr) => arr.indexOf(value) === index),
  [participants]);

  const projectMemberEmails = useMemo(() =>
    participants
      .filter((item) => item.participant_type === 'personal' && !!item.user_email)
      .map((item) => item.user_email)
      .filter((value, index, arr) => arr.indexOf(value) === index),
  [participants]);

  const approvedChangeValue = changeRequests
    .filter((item) => item.status === 'approved')
    .reduce((sum, item) => sum + Number(item.cost_impact || 0), 0);

  const contestedDisputeValue = disputes
    .filter((item) => item.status !== 'resolved')
    .reduce((sum, item) => sum + Number(item.amount_impact || 0), 0);

  const effectiveSettings = {
    currency: settingsForm.currency || 'EUR',
    budget_tracking_mode: settingsForm.budget_tracking_mode || 'simple',
    labor_cost_method: settingsForm.labor_cost_method || 'from_work_sessions',
    financial_visibility: settingsForm.financial_visibility || 'project_full',
    enable_progress_statements: Boolean(settingsForm.enable_progress_statements),
  };

  const scopedCompanyId = effectiveSettings.financial_visibility === 'company_scoped'
    ? (user?.active_company_id || null)
    : null;

  const visibleBudgetLines = useMemo(() => {
    if (!scopedCompanyId) return budgetLines;
    return budgetLines.filter((line) => !line.company_id || line.company_id === scopedCompanyId);
  }, [budgetLines, scopedCompanyId]);

  const visibleCostEntries = useMemo(() => {
    if (!scopedCompanyId) return costEntries;
    return costEntries.filter((entry) => !entry.company_id || entry.company_id === scopedCompanyId);
  }, [costEntries, scopedCompanyId]);

  const visibleLaborRates = useMemo(() => {
    if (!scopedCompanyId) return laborRates;
    return laborRates.filter((rate) => rate.company_id === scopedCompanyId);
  }, [laborRates, scopedCompanyId]);

  const visibleWorkSessions = useMemo(() => {
    if (!scopedCompanyId) return workSessions;
    return workSessions.filter((session) => session.company_id === scopedCompanyId);
  }, [workSessions, scopedCompanyId]);

  const plannedBudgetTotal = visibleBudgetLines.reduce((sum, item) => sum + Number(item.amount_planned || 0), 0);
  const recordedCostsTotal = visibleCostEntries.reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const derivedLaborTotal = useMemo(() => {
    if (effectiveSettings.labor_cost_method !== 'from_work_sessions') {
      return visibleCostEntries
        .filter((entry) => entry.cost_type === 'labor')
        .reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
    }

    return visibleWorkSessions.reduce((sum, session) => {
      if (!session.ended_at || !session.company_id) return sum;
      const hours = parseHours(session);
      if (hours <= 0) return sum;
      const rate = pickRate(visibleLaborRates, session.started_at, session.company_id, session.user_email);
      if (!rate) return sum;
      return sum + hours * Number(rate.hourly_cost || 0);
    }, 0);
  }, [visibleWorkSessions, visibleLaborRates, visibleCostEntries, effectiveSettings.labor_cost_method]);

  const forecast = recordedCostsTotal + Math.max(plannedBudgetTotal - recordedCostsTotal, 0);

  const laborSessionSyncPreview = useMemo(() => {
    if (effectiveSettings.labor_cost_method !== 'from_work_sessions') {
      return { count: 0, amount: 0 };
    }

    const toCreate = computeLaborSyncCandidates({
      workSessions: visibleWorkSessions,
      costEntries: visibleCostEntries,
      laborRates: visibleLaborRates,
      projectId,
      description: t('finance.syncFromWorkSessions'),
    });

    return {
      count: toCreate.length,
      amount: toCreate.reduce((sum, row) => sum + Number(row.amount || 0), 0),
    };
  }, [visibleWorkSessions, visibleCostEntries, visibleLaborRates, effectiveSettings.labor_cost_method]);

  const nextProgressSequence = useMemo(() => {
    if (progressStatements.length === 0) return 1;
    return Math.max(...progressStatements.map((item) => Number(item.sequence_number || 0))) + 1;
  }, [progressStatements]);

  const salReport = useMemo(() => {
    const totalMatured = progressStatements.reduce((sum, item) => sum + Number(item.amount_matured || 0), 0);
    const totalAdvances = progressStatements.reduce((sum, item) => sum + Number(item.advances_paid || 0), 0);
    const totalToPay = progressStatements.reduce((sum, item) => sum + Number(item.amount_to_pay || 0), 0);
    const approvedCount = progressStatements.filter((item) => item.status === 'approved').length;

    return {
      count: progressStatements.length,
      totalMatured,
      totalAdvances,
      totalToPay,
      approvedCount,
    };
  }, [progressStatements]);

  const settingsMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        project_id: projectId,
        currency: settingsForm.currency,
        budget_tracking_mode: settingsForm.budget_tracking_mode,
        labor_cost_method: settingsForm.labor_cost_method,
        financial_visibility: settingsForm.financial_visibility,
        enable_progress_statements: settingsForm.enable_progress_statements,
      };

      if (settings?.id) {
        return appClient.entities.ProjectFinancialSettings.update(settings.id, payload);
      }
      return appClient.entities.ProjectFinancialSettings.create(payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['projectFinancialSettings', projectId] });
    },
  });

  const budgetMutation = useMutation({
    mutationFn: () => appClient.entities.BudgetLine.create({
      project_id: projectId,
      code: effectiveSettings.budget_tracking_mode === 'cost_code' ? (budgetForm.code || null) : null,
      title: budgetForm.title,
      category: budgetForm.category,
      amount_planned: Number(budgetForm.amount_planned || 0),
      company_id: budgetForm.company_id !== '__none__' ? budgetForm.company_id : null,
      status: 'active',
    }),
    onSuccess: async () => {
      setBudgetForm({ code: '', title: '', category: 'labor', amount_planned: '', company_id: '__none__' });
      await queryClient.invalidateQueries({ queryKey: ['budgetLines', projectId] });
    },
  });

  const costMutation = useMutation({
    mutationFn: () => appClient.entities.CostEntry.create({
      project_id: projectId,
      cost_type: costForm.cost_type,
      description: costForm.description,
      amount: Number(costForm.amount || 0),
      company_id: costForm.company_id !== '__none__' ? costForm.company_id : null,
      entry_date: costForm.entry_date || toDateOnly(new Date().toISOString()),
      source_type: 'manual',
      status: 'recorded',
    }),
    onSuccess: async () => {
      setCostForm({
        cost_type: 'labor',
        description: '',
        amount: '',
        company_id: '__none__',
        entry_date: toDateOnly(new Date().toISOString()) || '',
      });
      await queryClient.invalidateQueries({ queryKey: ['costEntries', projectId] });
    },
  });

  const syncLaborMutation = useMutation({
    mutationFn: async () => {
      const toCreate = computeLaborSyncCandidates({
        workSessions: visibleWorkSessions,
        costEntries: visibleCostEntries,
        laborRates: visibleLaborRates,
        projectId,
        description: t('finance.syncFromWorkSessions'),
      });

      if (toCreate.length === 0) return { created: 0 };

      await Promise.all(toCreate.map((payload) => appClient.entities.CostEntry.create(payload)));
      return { created: toCreate.length };
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['costEntries', projectId] });
    },
  });

  const progressStatementMutation = useMutation({
    mutationFn: () => appClient.entities.ProgressStatement.create({
      project_id: projectId,
      sequence_number: nextProgressSequence,
      statement_date: progressForm.statement_date || toDateOnly(new Date().toISOString()),
      amount_matured: Number(progressForm.amount_matured || 0),
      advances_paid: Number(progressForm.advances_paid || 0),
      amount_to_pay: Number(progressForm.amount_to_pay || 0),
      notes: progressForm.notes || null,
      status: 'draft',
    }),
    onSuccess: async () => {
      setProgressForm({
        statement_date: toDateOnly(new Date().toISOString()) || '',
        amount_matured: '',
        advances_paid: '',
        amount_to_pay: '',
        notes: '',
      });
      await queryClient.invalidateQueries({ queryKey: ['progressStatements', projectId] });
    },
  });

  const progressStatusMutation = useMutation({
    mutationFn: ({ id, status }) => appClient.entities.ProgressStatement.update(id, { status }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['progressStatements', projectId] });
    },
  });

  const rateMutation = useMutation({
    mutationFn: () => appClient.entities.LaborRate.create({
      company_id: rateForm.company_id,
      user_email: rateForm.user_email !== '__none__' ? rateForm.user_email : null,
      hourly_cost: Number(rateForm.hourly_cost || 0),
      valid_from: rateForm.valid_from,
      valid_to: rateForm.valid_to || null,
      project_id: projectId,
    }),
    onSuccess: async () => {
      setRateForm({
        company_id: '__none__',
        user_email: '__none__',
        hourly_cost: '',
        valid_from: toDateOnly(new Date().toISOString()) || '',
        valid_to: '',
      });
      await queryClient.invalidateQueries({ queryKey: ['laborRates'] });
    },
  });

  const categoryLabel = (value) => {
    const labels = {
      labor: t('finance.categories.labor'),
      materials: t('finance.categories.materials'),
      equipment: t('finance.categories.equipment'),
      subcontract: t('finance.categories.subcontract'),
      indirect: t('finance.categories.indirect'),
      extra: t('finance.categories.extra'),
      adjustment: t('finance.categories.adjustment'),
    };
    return labels[value] || value;
  };

  const statementStatusLabel = (status) => t(`finance.statuses.${status || 'draft'}`);

  const budgetModeLabel = (value) => t(`finance.budgetModes.${value || 'simple'}`);
  const visibilityLabel = (value) => t(`finance.visibilityModes.${value || 'project_full'}`);
  const laborMethodLabel = (value) => t(`finance.laborMethods.${value || 'from_work_sessions'}`);
  const salToggleLabel = (value) => t(`finance.salToggle.${value ? 'on' : 'off'}`);

  const memberLabelByEmail = useMemo(() => {
    const map = new Map();
    participants.forEach((participant) => {
      if (participant.user_email) {
        map.set(participant.user_email, participant.user_display_name || participant.display_name || participant.full_name || participant.user_email);
      }
    });

    projectMemberEmails.forEach((email) => {
      if (!map.has(email)) {
        map.set(email, getUserDisplayNameByEmail(email, allUsers));
      }
    });

    return map;
  }, [participants, projectMemberEmails, allUsers]);

  const formatAmount = (value) => {
    const rawCurrency = String(effectiveSettings.currency || 'EUR').trim().toUpperCase();
    const candidateCurrency = rawCurrency.length === 3 ? rawCurrency : 'EUR';

    let currency = 'EUR';
    try {
      // Validate that the currency code is supported by Intl before formatting.
      new Intl.NumberFormat('en-US', { style: 'currency', currency: candidateCurrency });
      currency = candidateCurrency;
    } catch {
      currency = 'EUR';
    }

    const formatter = new Intl.NumberFormat(currentLanguage === 'it' ? 'it-IT' : 'en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return formatter.format(Number(value || 0));
  };

  const toggleSection = (key) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const launchCardTour = (card) => {
    setOpenSections((prev) => ({ ...prev, [card]: true }));
    const tour = getFinanceCardTour(currentLanguage, card);
    startTour(tour.id, tour.steps, { force: true });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between" data-tour="finance-kpi-row">
        <p className="text-sm font-semibold text-gray-700">{t('finance.kpiTitle')}</p>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-gray-400 hover:text-gray-600"
          onClick={() => launchCardTour('kpi')}
          aria-label="help-kpi"
        >
          <CircleHelp className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">{t('finance.plannedBudget')}</p>
            <p className="text-2xl font-bold" data-tour="finance-kpi-budget">{formatAmount(plannedBudgetTotal)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">{t('finance.recordedActual')}</p>
            <p className="text-2xl font-bold" data-tour="finance-kpi-actual">{formatAmount(recordedCostsTotal)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">{t('finance.laborActual')}</p>
            <p className="text-2xl font-bold" data-tour="finance-kpi-labor">{formatAmount(derivedLaborTotal)}</p>
            <p className="text-xs text-gray-500 mt-1">
              {t('finance.toSync')}: {laborSessionSyncPreview.count} · {formatAmount(laborSessionSyncPreview.amount)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">{t('finance.finalForecast')}</p>
            <p className="text-2xl font-bold" data-tour="finance-kpi-forecast">{formatAmount(forecast)}</p>
            <p className="text-xs text-gray-500 mt-1">{t('finance.approvedVariations')}: {formatAmount(approvedChangeValue)} · {t('finance.contested')}: {formatAmount(contestedDisputeValue)}</p>
          </CardContent>
        </Card>
        <Card data-tour="finance-sal-report">
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">{t('finance.salReport.title')}</p>
            <p className="text-2xl font-bold">{salReport.count}</p>
            <p className="text-xs text-gray-500 mt-1">{t('finance.salReport.approved')}: {salReport.approvedCount}</p>
            <p className="text-xs text-gray-500">{t('finance.salReport.toPay')}: {formatAmount(salReport.totalToPay)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge variant="secondary">{t('finance.currency')}: {effectiveSettings.currency}</Badge>
        <Badge variant="secondary">{t('finance.visibility')}: {visibilityLabel(effectiveSettings.financial_visibility)}</Badge>
        <Badge variant="secondary">{t('finance.laborMethod')}: {laborMethodLabel(effectiveSettings.labor_cost_method)}</Badge>
      </div>

      {permissionScope === 'viewer' ? (
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
          {t('finance.access.viewerNotice')}
        </div>
      ) : null}

      {permissionScope === 'contributor' ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {t('finance.access.contributorNotice')}
        </div>
      ) : null}

      {canViewSettings ? <Card data-tour="finance-settings-card">
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CardTitle>{t('finance.financialSettings')}</CardTitle>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-gray-400 hover:text-gray-600"
                onClick={() => launchCardTour('settings')}
                aria-label="help-settings"
              >
                <CircleHelp className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-gray-500"
                onClick={() => toggleSection('settings')}
                aria-label="toggle-settings"
              >
                <ChevronDown className={`h-4 w-4 transition-transform ${openSections.settings ? 'rotate-180' : ''}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
        {openSections.settings ? <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('finance.currency')}</Label>
              <Input
                value={settingsForm.currency}
                onChange={(event) => setSettingsForm((prev) => ({ ...prev, currency: event.target.value.toUpperCase() || 'EUR' }))}
                placeholder="EUR"
                disabled={!canManageSettings}
              />
            </div>
            <div className="space-y-2" data-tour="finance-settings-budget-mode">
              <Label>{t('finance.budgetMode')}</Label>
              <Select
                value={settingsForm.budget_tracking_mode}
                onValueChange={(value) => setSettingsForm((prev) => ({ ...prev, budget_tracking_mode: value }))}
                disabled={!canManageSettings}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="simple">{budgetModeLabel('simple')}</SelectItem>
                  <SelectItem value="cost_code">{budgetModeLabel('cost_code')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2" data-tour="finance-settings-visibility">
              <Label>{t('finance.visibility')}</Label>
              <Select
                value={settingsForm.financial_visibility}
                onValueChange={(value) => setSettingsForm((prev) => ({ ...prev, financial_visibility: value }))}
                disabled={!canManageSettings}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="project_full">{visibilityLabel('project_full')}</SelectItem>
                  <SelectItem value="company_scoped">{visibilityLabel('company_scoped')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2" data-tour="finance-settings-labor-method">
              <Label>{t('finance.laborMethod')}</Label>
              <Select
                value={settingsForm.labor_cost_method}
                onValueChange={(value) => setSettingsForm((prev) => ({ ...prev, labor_cost_method: value }))}
                disabled={!canManageSettings}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">{laborMethodLabel('manual')}</SelectItem>
                  <SelectItem value="from_work_sessions">{laborMethodLabel('from_work_sessions')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2" data-tour="finance-settings-sal-toggle">
            <Label>SAL</Label>
            <Select
              value={settingsForm.enable_progress_statements ? 'true' : 'false'}
              onValueChange={(value) => setSettingsForm((prev) => ({ ...prev, enable_progress_statements: value === 'true' }))}
              disabled={!canManageSettings}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="false">{t('finance.salToggle.off')}</SelectItem>
                <SelectItem value="true">{t('finance.salToggle.on')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-3" data-tour="finance-settings-badges">
            <Badge variant="outline">{t('finance.budgetMode')}: {budgetModeLabel(effectiveSettings.budget_tracking_mode)}</Badge>
            <Badge variant="outline">{t('finance.visibility')}: {visibilityLabel(effectiveSettings.financial_visibility)}</Badge>
            <Badge variant="outline">{t('finance.laborMethod')}: {laborMethodLabel(effectiveSettings.labor_cost_method)}</Badge>
            <Badge variant="outline">SAL: {salToggleLabel(effectiveSettings.enable_progress_statements)}</Badge>
          </div>

          {canManageSettings ? (
            <Button onClick={() => settingsMutation.mutate()} disabled={settingsMutation.isPending} className="bg-[#ef6144] hover:bg-[#d9553a]">
              {settingsMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              {settings?.id ? t('finance.updateSettings') : t('finance.saveSettings')}
            </Button>
          ) : null}
        </CardContent> : null}
      </Card> : null}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {canViewBudget ? <Card data-tour="finance-budget-card">
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <CardTitle>{t('finance.budgetLines')}</CardTitle>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-gray-400 hover:text-gray-600"
                  onClick={() => launchCardTour('budget')}
                  aria-label="help-budget"
                >
                  <CircleHelp className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-500" onClick={() => toggleSection('budget')}>
                  <ChevronDown className={`h-4 w-4 transition-transform ${openSections.budget ? 'rotate-180' : ''}`} />
                </Button>
              </div>
            </div>
          </CardHeader>
          {openSections.budget ? <CardContent className="space-y-4">
            {canManageBudget ? (
              <div className="space-y-3 border rounded-lg p-3" data-tour="finance-budget-form">
                {effectiveSettings.budget_tracking_mode === 'cost_code' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <Input placeholder={t('finance.lineCodeOptional')} value={budgetForm.code} onChange={(event) => setBudgetForm((prev) => ({ ...prev, code: event.target.value }))} />
                    <Input placeholder={t('finance.lineTitle')} value={budgetForm.title} onChange={(event) => setBudgetForm((prev) => ({ ...prev, title: event.target.value }))} />
                  </div>
                ) : (
                  <Input placeholder={t('finance.lineTitle')} value={budgetForm.title} onChange={(event) => setBudgetForm((prev) => ({ ...prev, title: event.target.value }))} />
                )}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <Select value={budgetForm.category} onValueChange={(value) => setBudgetForm((prev) => ({ ...prev, category: value }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {COST_CATEGORIES.filter((item) => item !== 'adjustment').map((category) => (
                        <SelectItem key={category} value={category}>{categoryLabel(category)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input type="number" placeholder={t('finance.plannedAmount')} value={budgetForm.amount_planned} onChange={(event) => setBudgetForm((prev) => ({ ...prev, amount_planned: event.target.value }))} />
                  <Select value={budgetForm.company_id} onValueChange={(value) => setBudgetForm((prev) => ({ ...prev, company_id: value }))}>
                    <SelectTrigger><SelectValue placeholder={t('finance.responsibleCompany')} /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">{t('finance.noCompany')}</SelectItem>
                      {projectCompanyParticipants.map((companyId) => (
                        <SelectItem key={companyId} value={companyId}>{companyById.get(companyId)?.name || companyId}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={() => budgetMutation.mutate()}
                  disabled={budgetMutation.isPending || !budgetForm.title.trim()}
                  className="bg-[#ef6144] hover:bg-[#d9553a]"
                >
                  {budgetMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  {t('finance.addBudgetLine')}
                </Button>
              </div>
            ) : null}

            <div className="space-y-2" data-tour="finance-budget-list">
              {visibleBudgetLines.length === 0 ? (
                <p className="text-sm text-gray-500">{t('finance.noBudgetLines')}</p>
              ) : visibleBudgetLines.slice(0, 8).map((line) => (
                <div key={line.id} className="border rounded-lg p-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{effectiveSettings.budget_tracking_mode === 'cost_code' && line.code ? `${line.code} - ` : ''}{line.title}</p>
                    <p className="text-xs text-gray-500">{categoryLabel(line.category)}{line.company_id ? ` · ${companyById.get(line.company_id)?.name || line.company_id}` : ''}</p>
                  </div>
                  <Badge variant="outline">{formatAmount(line.amount_planned)}</Badge>
                </div>
              ))}
            </div>
          </CardContent> : null}
        </Card> : null}

        {canViewCosts ? <Card data-tour="finance-costs-card">
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <CardTitle>{t('finance.costEntries')}</CardTitle>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-gray-400 hover:text-gray-600"
                  onClick={() => launchCardTour('costs')}
                  aria-label="help-costs"
                >
                  <CircleHelp className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-500" onClick={() => toggleSection('costs')}>
                  <ChevronDown className={`h-4 w-4 transition-transform ${openSections.costs ? 'rotate-180' : ''}`} />
                </Button>
              </div>
            </div>
          </CardHeader>
          {openSections.costs ? <CardContent className="space-y-4">
            {canRecordCosts ? (
              <div className="space-y-3 border rounded-lg p-3" data-tour="finance-costs-form">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <Select value={costForm.cost_type} onValueChange={(value) => setCostForm((prev) => ({ ...prev, cost_type: value }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {COST_CATEGORIES.map((category) => (
                        <SelectItem key={category} value={category}>{categoryLabel(category)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input type="date" value={costForm.entry_date} onChange={(event) => setCostForm((prev) => ({ ...prev, entry_date: event.target.value }))} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <Input placeholder={t('finance.costDescription')} value={costForm.description} onChange={(event) => setCostForm((prev) => ({ ...prev, description: event.target.value }))} />
                  <Input type="number" placeholder={t('finance.amount')} value={costForm.amount} onChange={(event) => setCostForm((prev) => ({ ...prev, amount: event.target.value }))} />
                </div>
                <Select value={costForm.company_id} onValueChange={(value) => setCostForm((prev) => ({ ...prev, company_id: value }))}>
                  <SelectTrigger><SelectValue placeholder={t('finance.companyOptional')} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">{t('finance.noCompany')}</SelectItem>
                    {projectCompanyParticipants.map((companyId) => (
                      <SelectItem key={companyId} value={companyId}>{companyById.get(companyId)?.name || companyId}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={() => costMutation.mutate()}
                  disabled={costMutation.isPending || !costForm.description.trim()}
                  className="bg-[#ef6144] hover:bg-[#d9553a]"
                >
                  {costMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  {t('finance.recordCost')}
                </Button>
              </div>
            ) : null}

            <div className="space-y-2" data-tour="finance-costs-list">
              {visibleCostEntries.length === 0 ? (
                <p className="text-sm text-gray-500">{t('finance.noCosts')}</p>
              ) : visibleCostEntries.slice(0, 8).map((entry) => (
                <div key={entry.id} className="border rounded-lg p-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{entry.description}</p>
                    <p className="text-xs text-gray-500">{categoryLabel(entry.cost_type)} · {entry.entry_date}{entry.company_id ? ` · ${companyById.get(entry.company_id)?.name || entry.company_id}` : ''}</p>
                  </div>
                  <Badge variant="outline">{formatAmount(entry.amount)}</Badge>
                </div>
              ))}
            </div>
          </CardContent> : null}
        </Card> : null}
      </div>

      {canViewRates ? <Card data-tour="finance-rates-card">
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CardTitle>{t('finance.laborRates')}</CardTitle>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-gray-400 hover:text-gray-600"
                onClick={() => launchCardTour('rates')}
                aria-label="help-rates"
              >
                <CircleHelp className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-500" onClick={() => toggleSection('rates')}>
                <ChevronDown className={`h-4 w-4 transition-transform ${openSections.rates ? 'rotate-180' : ''}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
        {openSections.rates ? <CardContent className="space-y-4">
          {canSyncLabor && effectiveSettings.labor_cost_method === 'from_work_sessions' ? (
            <div className="border rounded-lg p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3" data-tour="finance-rates-sync">
              <div>
                <p className="font-medium">{t('finance.syncFromWorkSessions')}</p>
                <p className="text-sm text-gray-500">
                  {t('finance.sessionsReady')}: {laborSessionSyncPreview.count} · {t('finance.estimatedAmount')}: {formatAmount(laborSessionSyncPreview.amount)}
                </p>
              </div>
              <Button
                onClick={() => syncLaborMutation.mutate()}
                disabled={syncLaborMutation.isPending || laborSessionSyncPreview.count === 0}
                className="bg-[#ef6144] hover:bg-[#d9553a]"
              >
                {syncLaborMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                {t('finance.syncLaborCosts')}
              </Button>
            </div>
          ) : null}

          {effectiveSettings.labor_cost_method !== 'from_work_sessions' ? (
            <p className="text-sm text-gray-500">{t('finance.laborMethod')}: {laborMethodLabel(effectiveSettings.labor_cost_method)}</p>
          ) : null}

          {canManageRates ? (
            <div className="space-y-3 border rounded-lg p-3" data-tour="finance-rates-form">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
                <Select value={rateForm.company_id} onValueChange={(value) => setRateForm((prev) => ({ ...prev, company_id: value }))}>
                  <SelectTrigger><SelectValue placeholder={t('finance.company')} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">{t('finance.selectCompany')}</SelectItem>
                    {projectCompanyParticipants.map((companyId) => (
                      <SelectItem key={companyId} value={companyId}>{companyById.get(companyId)?.name || companyId}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={rateForm.user_email} onValueChange={(value) => setRateForm((prev) => ({ ...prev, user_email: value }))}>
                  <SelectTrigger><SelectValue placeholder={t('finance.personOptional')} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">{t('finance.genericRate')}</SelectItem>
                    {projectMemberEmails.map((email) => (
                      <SelectItem key={email} value={email}>{memberLabelByEmail.get(email) || email}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input type="number" placeholder={t('finance.hourlyCost')} value={rateForm.hourly_cost} onChange={(event) => setRateForm((prev) => ({ ...prev, hourly_cost: event.target.value }))} />
                <Input type="date" value={rateForm.valid_from} onChange={(event) => setRateForm((prev) => ({ ...prev, valid_from: event.target.value }))} />
                <Input type="date" value={rateForm.valid_to} onChange={(event) => setRateForm((prev) => ({ ...prev, valid_to: event.target.value }))} />
              </div>
              <Button
                onClick={() => rateMutation.mutate()}
                disabled={rateMutation.isPending || rateForm.company_id === '__none__' || !rateForm.hourly_cost}
                className="bg-[#ef6144] hover:bg-[#d9553a]"
              >
                {rateMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                {t('finance.saveRate')}
              </Button>
            </div>
          ) : null}

          <div className="space-y-2" data-tour="finance-rates-list">
            {visibleLaborRates.filter((rate) => projectCompanyParticipants.includes(rate.company_id)).slice(0, 10).map((rate) => (
              <div key={rate.id} className="border rounded-lg p-3 flex items-center justify-between">
                <div>
                  <p className="font-medium">{companyById.get(rate.company_id)?.name || rate.company_id}{rate.user_email ? ` · ${memberLabelByEmail.get(rate.user_email) || rate.user_email}` : ''}</p>
                  <p className="text-xs text-gray-500">{rate.valid_from}{rate.valid_to ? ` - ${rate.valid_to}` : ''}</p>
                </div>
                <Badge variant="outline">{formatAmount(rate.hourly_cost)}/h</Badge>
              </div>
            ))}
            {visibleLaborRates.filter((rate) => projectCompanyParticipants.includes(rate.company_id)).length === 0 ? (
              <p className="text-sm text-gray-500">{t('finance.noRates')}</p>
            ) : null}
          </div>
        </CardContent> : null}
      </Card> : null}

      {canViewProgress ? <Card data-tour="finance-progress-card">
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <CardTitle>{t('finance.progressStatements.title')}</CardTitle>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-gray-400 hover:text-gray-600"
                onClick={() => launchCardTour('progress')}
                aria-label="help-progress"
              >
                <CircleHelp className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-500" onClick={() => toggleSection('progress')}>
                <ChevronDown className={`h-4 w-4 transition-transform ${openSections.progress ? 'rotate-180' : ''}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
        {openSections.progress ? <CardContent className="space-y-4">
          {!effectiveSettings.enable_progress_statements ? (
            <p className="text-sm text-gray-500">{t('finance.progressStatements.enableHint')}</p>
          ) : (
            <>

          {canManageProgress ? (
            <div className="space-y-3 border rounded-lg p-3" data-tour="finance-progress-form">
              <div className="rounded-md bg-orange-50 border border-orange-200 px-3 py-2" data-tour="finance-progress-sequence-auto">
                <p className="text-xs text-orange-800">
                  {t('finance.progressStatements.sequence')}: <strong>{nextProgressSequence}</strong> · {t('finance.progressStatements.sequenceHelp')}
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label>{t('finance.progressStatements.statementDate')}</Label>
                  <Input type="date" value={progressForm.statement_date} onChange={(event) => setProgressForm((prev) => ({ ...prev, statement_date: event.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label>{t('finance.progressStatements.maturedAmount')}</Label>
                  <Input type="number" value={progressForm.amount_matured} onChange={(event) => setProgressForm((prev) => ({ ...prev, amount_matured: event.target.value }))} placeholder={t('finance.progressStatements.maturedAmount')} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label>{t('finance.progressStatements.advancesPaid')}</Label>
                  <Input type="number" value={progressForm.advances_paid} onChange={(event) => setProgressForm((prev) => ({ ...prev, advances_paid: event.target.value }))} placeholder={t('finance.progressStatements.advancesPaid')} />
                </div>
                <div className="space-y-1">
                  <Label>{t('finance.progressStatements.amountToPay')}</Label>
                  <Input type="number" value={progressForm.amount_to_pay} onChange={(event) => setProgressForm((prev) => ({ ...prev, amount_to_pay: event.target.value }))} placeholder={t('finance.progressStatements.amountToPay')} />
                </div>
              </div>
              <div className="space-y-1">
                <Label>{t('finance.progressStatements.notes')}</Label>
                <Input value={progressForm.notes} onChange={(event) => setProgressForm((prev) => ({ ...prev, notes: event.target.value }))} placeholder={t('finance.progressStatements.notes')} />
              </div>
              <Button
                onClick={() => progressStatementMutation.mutate()}
                disabled={progressStatementMutation.isPending || !progressForm.statement_date}
                className="bg-[#ef6144] hover:bg-[#d9553a]"
              >
                {progressStatementMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                {t('finance.progressStatements.create')}
              </Button>
            </div>
          ) : null}

          <div className="space-y-2" data-tour="finance-progress-list">
            {progressStatements.length === 0 ? (
              <p className="text-sm text-gray-500">{t('finance.progressStatements.empty')}</p>
            ) : progressStatements.map((statement) => (
              <div key={statement.id} className="border rounded-lg p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <p className="font-medium">SAL #{statement.sequence_number} · {statement.statement_date}</p>
                  <p className="text-xs text-gray-500">{t('finance.progressStatements.maturedAmount')}: {formatAmount(statement.amount_matured)} · {t('finance.progressStatements.amountToPay')}: {formatAmount(statement.amount_to_pay)}</p>
                  {statement.notes ? <p className="text-xs text-gray-500 mt-1">{statement.notes}</p> : null}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{statementStatusLabel(statement.status)}</Badge>
                  {canManageProgress && statement.status === 'draft' ? (
                    <>
                      <Button size="sm" variant="outline" onClick={() => progressStatusMutation.mutate({ id: statement.id, status: 'approved' })} disabled={progressStatusMutation.isPending}>
                        {t('finance.progressStatements.approve')}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => progressStatusMutation.mutate({ id: statement.id, status: 'cancelled' })} disabled={progressStatusMutation.isPending}>
                        {t('finance.progressStatements.cancel')}
                      </Button>
                    </>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
            </>
          )}
        </CardContent> : null}
      </Card> : null}

      <p className="text-xs text-gray-500">
        {t('finance.derivedLaborNote')}
      </p>

      <p className="text-xs text-gray-500">
        {t('finance.operator')} {user?.display_name || user?.full_name || user?.email || '-'}
      </p>
    </div>
  );
}
