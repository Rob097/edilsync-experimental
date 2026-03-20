// @ts-nocheck
import Stripe from "https://esm.sh/stripe@14?target=denonext";
import { adminClient } from "./supabase.ts";

const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY") || "";

export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2024-11-20",
});

export const stripeCryptoProvider = Stripe.createSubtleCryptoProvider();

const DEFAULT_TEST_PRODUCT_ID = "prod_UB4HrBdtPMrVBt";
const DEFAULT_TEST_MONTHLY_PRICE_ID = "price_1TCi8XH3IgxY3mDBFnvLe67e";
const DEFAULT_TEST_YEARLY_PRICE_ID = "price_1TD6MlH3IgxY3mDBtO34Fsz3";

export function ensureStripeConfigured() {
  if (!stripeSecretKey) {
    throw new Error("Missing STRIPE_SECRET_KEY");
  }
}

export function resolveStripeProductId() {
  return Deno.env.get("STRIPE_PRODUCT_ID") || DEFAULT_TEST_PRODUCT_ID;
}

export function resolveStripePriceId(billingCycle: string) {
  if (billingCycle === "monthly") {
    return Deno.env.get("STRIPE_PRICE_MONTHLY") || DEFAULT_TEST_MONTHLY_PRICE_ID;
  }

  if (billingCycle === "yearly") {
    return Deno.env.get("STRIPE_PRICE_YEARLY") || DEFAULT_TEST_YEARLY_PRICE_ID;
  }

  throw new Error("Unsupported billing cycle");
}

export function buildReturnUrl(baseUrl: string, params: Record<string, string>) {
  const separator = baseUrl.includes("?") ? "&" : "?";
  const query = Object.entries(params)
    .map(([key, value]) => `${encodeURIComponent(key)}=${value}`)
    .join("&");

  return `${baseUrl}${separator}${query}`;
}

export function toIsoOrNull(value?: number | null) {
  if (!value) return null;
  return new Date(value * 1000).toISOString();
}

export function mapStripeSubscriptionStatus(status: string) {
  switch (status) {
    case "active":
    case "trialing":
      return { planCode: "paid", billingStatus: "active" };
    case "past_due":
      return { planCode: "paid", billingStatus: "past_due" };
    case "unpaid":
    case "paused":
      return { planCode: "paid", billingStatus: "unpaid" };
    case "incomplete":
      return { planCode: "paid", billingStatus: "incomplete" };
    case "canceled":
    case "incomplete_expired":
    default:
      return { planCode: "free", billingStatus: "canceled" };
  }
}

export function isStripeSubscriptionEntitled(status: string) {
  return status === "active" || status === "trialing";
}

export async function ensureStripeCustomerForCompany({ company, subscription, fallbackEmail }: {
  company: Record<string, unknown>;
  subscription?: Record<string, unknown> | null;
  fallbackEmail?: string | null;
}) {
  ensureStripeConfigured();

  const existingCustomerId = subscription?.stripe_customer_id;
  if (existingCustomerId) {
    try {
      const existingCustomer = await stripe.customers.retrieve(String(existingCustomerId));
      if (!(existingCustomer as any)?.deleted) {
        return String(existingCustomerId);
      }
    } catch {
      // Fall through and create a new customer.
    }
  }

  const customer = await stripe.customers.create({
    email: (company.email as string) || fallbackEmail || undefined,
    name: company.name as string,
    metadata: {
      company_id: String(company.id),
    },
  });

  await adminClient
    .from("company_subscriptions")
    .upsert({
      company_id: String(company.id),
      plan_code: subscription?.plan_code || "free",
      billing_status: subscription?.billing_status || "free",
      billing_cycle: subscription?.billing_cycle || null,
      currency: subscription?.currency || "EUR",
      stripe_customer_id: customer.id,
      created_by: "stripe_sync",
    }, { onConflict: "company_id" });

  return customer.id;
}

export async function findCompanyIdForStripeReference({
  explicitCompanyId,
  subscriptionId,
  customerId,
}: {
  explicitCompanyId?: string | null;
  subscriptionId?: string | null;
  customerId?: string | null;
}) {
  if (explicitCompanyId) {
    return explicitCompanyId;
  }

  if (subscriptionId) {
    const { data } = await adminClient
      .from("company_subscriptions")
      .select("company_id")
      .eq("stripe_subscription_id", subscriptionId)
      .maybeSingle();

    if (data?.company_id) {
      return data.company_id;
    }
  }

  if (customerId) {
    const { data } = await adminClient
      .from("company_subscriptions")
      .select("company_id")
      .eq("stripe_customer_id", customerId)
      .maybeSingle();

    if (data?.company_id) {
      return data.company_id;
    }
  }

  return null;
}

export async function endActiveSponsorshipsForCompany(companyId: string) {
  if (!companyId) return;

  await adminClient
    .from("project_sponsorships")
    .update({
      status: "ended",
      ended_at: new Date().toISOString(),
    })
    .eq("sponsor_company_id", companyId)
    .eq("status", "active")
    .is("ended_at", null);
}

export async function syncCompanySubscriptionFromStripeSubscription(subscription: Record<string, any>, explicitCompanyId?: string | null) {
  const companyId = await findCompanyIdForStripeReference({
    explicitCompanyId,
    subscriptionId: subscription?.id || null,
    customerId: subscription?.customer ? String(subscription.customer) : null,
  });

  if (!companyId) {
    throw new Error(`Unable to resolve company for Stripe subscription ${subscription?.id || "unknown"}`);
  }

  const firstItem = subscription?.items?.data?.[0];
  const price = firstItem?.price || null;
  const interval = price?.recurring?.interval || null;
  const { planCode, billingStatus } = mapStripeSubscriptionStatus(subscription.status);

  const payload = {
    company_id: companyId,
    plan_code: planCode,
    billing_status: billingStatus,
    billing_cycle: interval === "month" ? "monthly" : interval === "year" ? "yearly" : null,
    currency: (price?.currency || "eur").toUpperCase(),
    stripe_customer_id: subscription?.customer ? String(subscription.customer) : null,
    stripe_subscription_id: subscription?.id || null,
    stripe_product_id: price?.product ? String(price.product) : resolveStripeProductId(),
    stripe_price_id: price?.id || null,
    current_period_start: toIsoOrNull(subscription?.current_period_start || null),
    current_period_end: toIsoOrNull(subscription?.current_period_end || null),
    cancel_at_period_end: Boolean(subscription?.cancel_at_period_end),
    canceled_at: toIsoOrNull(subscription?.canceled_at || null),
    created_by: "stripe_webhook",
  };

  const { error } = await adminClient
    .from("company_subscriptions")
    .upsert(payload, { onConflict: "company_id" });

  if (error) throw error;

  if (!isStripeSubscriptionEntitled(subscription.status)) {
    await endActiveSponsorshipsForCompany(companyId);
  }

  return { companyId, payload };
}