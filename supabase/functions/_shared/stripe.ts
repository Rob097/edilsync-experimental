// @ts-nocheck
import Stripe from "https://esm.sh/stripe@14?target=denonext";
import { adminClient, invokeInternalFunction } from "./supabase.ts";

const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY") || "";

export const stripe = new Stripe(stripeSecretKey, {
  // Use the account default API version to avoid runtime incompatibilities
  // between the deployed Stripe SDK and a pinned future API date.
});

export const stripeCryptoProvider = Stripe.createSubtleCryptoProvider();

export function ensureStripeConfigured() {
  if (!stripeSecretKey) {
    throw new Error("Missing STRIPE_SECRET_KEY");
  }
}

export function resolveStripeProductId() {
  const stripeProductId = Deno.env.get("STRIPE_PRODUCT_ID") || "";

  if (!stripeProductId) {
    throw new Error("Missing STRIPE_PRODUCT_ID");
  }

  return stripeProductId;
}

export function resolveStripePriceId(billingCycle: string) {
  if (billingCycle === "monthly") {
    const stripeMonthlyPriceId = Deno.env.get("STRIPE_PRICE_MONTHLY") || "";

    if (!stripeMonthlyPriceId) {
      throw new Error("Missing STRIPE_PRICE_MONTHLY");
    }

    return stripeMonthlyPriceId;
  }

  if (billingCycle === "yearly") {
    const stripeYearlyPriceId = Deno.env.get("STRIPE_PRICE_YEARLY") || "";

    if (!stripeYearlyPriceId) {
      throw new Error("Missing STRIPE_PRICE_YEARLY");
    }

    return stripeYearlyPriceId;
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

async function notifyCompanyAdminsAboutPlanChange({
  companyId,
  previousSubscription,
  nextPayload,
  sourceEventType,
}: {
  companyId: string;
  previousSubscription?: Record<string, any> | null;
  nextPayload: Record<string, any>;
  sourceEventType?: string | null;
}) {
  const previousStatus = previousSubscription?.billing_status || "free";
  const previousCycle = previousSubscription?.billing_cycle || null;
  const previousCancelAtPeriodEnd = Boolean(previousSubscription?.cancel_at_period_end);
  const nextStatus = nextPayload.billing_status;
  const nextCycle = nextPayload.billing_cycle;
  const nextCancelAtPeriodEnd = Boolean(nextPayload.cancel_at_period_end);

  let actionType = null;
  let title = null;
  let message = null;
  let emailSubject = null;
  let emailBody = null;

  const isCanonicalNotificationSource = [
    "customer.subscription.updated",
    "customer.subscription.deleted",
    "manual_stripe_sync",
  ].includes(sourceEventType || "");

  if (!isCanonicalNotificationSource) {
    return;
  }

  if (previousStatus !== "active" && nextStatus === "active") {
    actionType = "company_plan_activated";
    title = "Piano Pro attivato";
    message = `Il piano Pro della società è attivo con ciclo ${nextCycle === "yearly" ? "annuale" : "mensile"}.`;
    emailSubject = "Piano Pro società attivato";
    emailBody = `Ciao,\n\nIl piano Pro della società è ora attivo con ciclo ${nextCycle === "yearly" ? "annuale" : "mensile"}.\n\nCordiali saluti,\nIl team EdilSync`;
  } else if (!previousCancelAtPeriodEnd && nextCancelAtPeriodEnd) {
    actionType = "company_plan_canceled";
    title = "Abbonamento società disdetto";
    message = "Il piano Pro resterà attivo fino alla fine del periodo corrente, poi la società tornerà al piano Base.";
    emailSubject = "Abbonamento società disdetto";
    emailBody = "Ciao,\n\nIl piano Pro della società è stato disdetto. Resterà attivo fino alla fine del periodo corrente, poi la società tornerà al piano Base.\n\nCordiali saluti,\nIl team EdilSync";
  } else if (previousStatus === "active" && nextStatus === "active" && previousCycle && nextCycle && previousCycle !== nextCycle) {
    actionType = "company_plan_changed";
    title = "Piano società modificato";
    message = `Il piano Pro della società è stato aggiornato al ciclo ${nextCycle === "yearly" ? "annuale" : "mensile"}.`;
    emailSubject = "Piano società modificato";
    emailBody = `Ciao,\n\nIl piano Pro della società è stato aggiornato al ciclo ${nextCycle === "yearly" ? "annuale" : "mensile"}.\n\nCordiali saluti,\nIl team EdilSync`;
  } else if (previousStatus === "active" && nextStatus !== "active" && ["canceled", "unpaid"].includes(nextStatus)) {
    actionType = "company_plan_canceled";
    title = "Piano Pro non più attivo";
    message = "Il piano Pro della società non è più attivo. Alcune funzioni avanzate potrebbero non essere più disponibili.";
    emailSubject = "Piano Pro non più attivo";
    emailBody = "Ciao,\n\nIl piano Pro della società non è più attivo. Alcune funzioni avanzate potrebbero non essere più disponibili.\n\nCordiali saluti,\nIl team EdilSync";
  }

  if (!actionType) {
    return;
  }

  const { data: companyAdmins, error: adminsError } = await adminClient
    .from("company_members")
    .select("user_email")
    .eq("company_id", companyId)
    .eq("status", "active")
    .eq("role", "admin");

  if (adminsError) throw adminsError;

  for (const admin of companyAdmins || []) {
    if (!admin.user_email) continue;

    await invokeInternalFunction("sendNotificationOrEmail", {
      action_type: actionType,
      recipient_email: admin.user_email,
      context_type: "company",
      context_company_id: companyId,
      notification_data: {
        type: actionType,
        title,
        message,
        related_event_id: companyId,
      },
      email_data: {
        subject: emailSubject,
        body: emailBody,
      },
    });
  }
}

export async function syncCompanySubscriptionFromStripeSubscription(
  subscription: Record<string, any>,
  explicitCompanyId?: string | null,
  periodOverrides?: {
    currentPeriodStart?: string | null;
    currentPeriodEnd?: string | null;
  },
  sourceEventType?: string | null,
) {
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
  const { data: previousSubscription, error: previousSubscriptionError } = await adminClient
    .from("company_subscriptions")
    .select("plan_code, billing_status, billing_cycle, cancel_at_period_end")
    .eq("company_id", companyId)
    .maybeSingle();

  if (previousSubscriptionError) throw previousSubscriptionError;

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
    current_period_start: toIsoOrNull(subscription?.current_period_start || null) || periodOverrides?.currentPeriodStart || null,
    current_period_end: toIsoOrNull(subscription?.current_period_end || null) || periodOverrides?.currentPeriodEnd || null,
    cancel_at_period_end: Boolean(subscription?.cancel_at_period_end),
    canceled_at: toIsoOrNull(subscription?.canceled_at || null),
    created_by: "stripe_webhook",
  };

  const { error } = await adminClient
    .from("company_subscriptions")
    .upsert(payload, { onConflict: "company_id" });

  if (error) throw error;

  await notifyCompanyAdminsAboutPlanChange({
    companyId,
    previousSubscription,
    nextPayload: payload,
    sourceEventType,
  });

  if (!isStripeSubscriptionEntitled(subscription.status)) {
    await endActiveSponsorshipsForCompany(companyId);
  }

  return { companyId, payload };
}