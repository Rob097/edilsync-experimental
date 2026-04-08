// @ts-nocheck
import { adminClient, corsHeaders, getAuthenticatedContext, jsonResponse } from "../_shared/supabase.ts";
import { assertNoUnexpectedKeys, getErrorStatus, parseJsonBody, requiredEnum, requiredUrl, requiredUuid } from "../_shared/input.ts";
import { isCompanyAdmin } from "../_shared/access.ts";
import { enforceRateLimit } from "../_shared/rate-limit.ts";
import {
  buildReturnUrl,
  ensureStripeConfigured,
  ensureStripeCustomerForCompany,
  resolveStripePriceId,
  resolveStripeProductId,
  stripe,
} from "../_shared/stripe.ts";

Deno.serve(async (req) => {
  try {
    if (req.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders });
    }

    if (req.method !== "POST") {
      return jsonResponse({ error: "Method not allowed" }, 405);
    }

    ensureStripeConfigured();

    const { appUser } = await getAuthenticatedContext(req);
    const payload = await parseJsonBody(req, { maxBytes: 4 * 1024 });
    assertNoUnexpectedKeys(payload, ["company_id", "billing_cycle", "return_url"]);

    const companyId = requiredUuid(payload.company_id, "company_id");
    const billingCycle = requiredEnum(payload.billing_cycle, "billing_cycle", ["monthly", "yearly"]);
    const returnUrl = requiredUrl(payload.return_url, "return_url", 1024);

    const userRateLimitResponse = await enforceRateLimit({
      scope: "stripe_checkout_session:user",
      identifier: appUser.id,
      windowSeconds: 10 * 60,
      maxRequests: 6,
      message: "Too many billing session requests. Please retry in a few minutes.",
      corsHeaders,
    });

    if (userRateLimitResponse) {
      return userRateLimitResponse;
    }

    const companyRateLimitResponse = await enforceRateLimit({
      scope: "stripe_checkout_session:company",
      identifier: companyId,
      windowSeconds: 10 * 60,
      maxRequests: 10,
      message: "Too many billing session requests for this company. Please retry in a few minutes.",
      corsHeaders,
    });

    if (companyRateLimitResponse) {
      return companyRateLimitResponse;
    }

    const isAdmin = await isCompanyAdmin(companyId, appUser.email);
    if (!isAdmin) {
      return jsonResponse({ error: "Only company admins can manage billing" }, 403);
    }

    const { data: company, error: companyError } = await adminClient
      .from("companies")
      .select("id,name,email")
      .eq("id", companyId)
      .single();

    if (companyError || !company) {
      return jsonResponse({ error: "Company not found" }, 404);
    }

    const { data: existingSubscription, error: subscriptionError } = await adminClient
      .from("company_subscriptions")
      .select("*")
      .eq("company_id", companyId)
      .maybeSingle();

    if (subscriptionError) throw subscriptionError;

    if (existingSubscription?.plan_code === "paid" && existingSubscription?.billing_status === "active") {
      return jsonResponse({ error: "Company already has an active paid subscription" }, 409);
    }

    const customerId = await ensureStripeCustomerForCompany({
      company,
      subscription: existingSubscription,
      fallbackEmail: appUser.email,
    });

    const priceId = resolveStripePriceId(billingCycle);
    const successUrl = buildReturnUrl(returnUrl, {
      stripe_checkout: "success",
      session_id: "{CHECKOUT_SESSION_ID}",
    });
    const cancelUrl = buildReturnUrl(returnUrl, {
      stripe_checkout: "canceled",
    });

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      client_reference_id: companyId,
      success_url: successUrl,
      cancel_url: cancelUrl,
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: {
        company_id: companyId,
        billing_cycle: billingCycle,
        flow: "company_billing_upgrade",
      },
      subscription_data: {
        metadata: {
          company_id: companyId,
          billing_cycle: billingCycle,
          flow: "company_billing_upgrade",
        },
      },
      allow_promotion_codes: true,
    });

    await adminClient
      .from("company_subscriptions")
      .upsert({
        company_id: companyId,
        plan_code: existingSubscription?.plan_code || "free",
        billing_status: existingSubscription?.billing_status || "free",
        billing_cycle: billingCycle,
        currency: existingSubscription?.currency || "EUR",
        stripe_customer_id: customerId,
        stripe_product_id: resolveStripeProductId(),
        stripe_price_id: priceId,
        created_by: "stripe_checkout",
      }, { onConflict: "company_id" });

    return jsonResponse({
      success: true,
      url: session.url,
      session_id: session.id,
    });
  } catch (error) {
    console.error("createStripeCheckoutSession error:", error);
    return jsonResponse({ error: error instanceof Error ? error.message : String(error) }, getErrorStatus(error, 500));
  }
});