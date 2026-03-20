export const createFallbackCompanySubscription = (companyId = null) => ({
  company_id: companyId,
  plan_code: 'free',
  billing_status: 'free',
  billing_cycle: null,
  currency: 'EUR',
  current_period_start: null,
  current_period_end: null,
  cancel_at_period_end: false,
  canceled_at: null,
});

export const normalizeCompanySubscription = (subscription, companyId = null) => (
  subscription || createFallbackCompanySubscription(companyId)
);

export const isPaidCompanySubscription = (subscription) => {
  const normalized = normalizeCompanySubscription(subscription);
  return normalized.plan_code === 'paid' && normalized.billing_status === 'active';
};