// @ts-nocheck
import { adminClient, corsHeaders, getAuthenticatedContext, jsonResponse } from "../_shared/supabase.ts";
import { assertNoUnexpectedKeys, getErrorStatus, parseJsonBody, requiredUrl, requiredUuid } from "../_shared/input.ts";
import { isCompanyAdmin } from "../_shared/access.ts";
import { enforceRateLimit } from "../_shared/rate-limit.ts";
import { buildReturnUrl, ensureStripeConfigured, stripe } from "../_shared/stripe.ts";

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
    assertNoUnexpectedKeys(payload, ["company_id", "return_url"]);

    const companyId = requiredUuid(payload.company_id, "company_id");
    const returnUrl = requiredUrl(payload.return_url, "return_url", 1024);

    const userRateLimitResponse = await enforceRateLimit({
      scope: "stripe_billing_portal:user",
      identifier: appUser.id,
      windowSeconds: 10 * 60,
      maxRequests: 10,
      message: "Too many billing portal requests. Please retry in a few minutes.",
      corsHeaders,
    });

    if (userRateLimitResponse) {
      return userRateLimitResponse;
    }

    const companyRateLimitResponse = await enforceRateLimit({
      scope: "stripe_billing_portal:company",
      identifier: companyId,
      windowSeconds: 10 * 60,
      maxRequests: 20,
      message: "Too many billing portal requests for this company. Please retry in a few minutes.",
      corsHeaders,
    });

    if (companyRateLimitResponse) {
      return companyRateLimitResponse;
    }

    const isAdmin = await isCompanyAdmin(companyId, appUser.email);
    if (!isAdmin) {
      return jsonResponse({ error: "Only company admins can manage billing" }, 403);
    }

    const { data: subscription, error } = await adminClient
      .from("company_subscriptions")
      .select("stripe_customer_id")
      .eq("company_id", companyId)
      .maybeSingle();

    if (error) throw error;

    if (!subscription?.stripe_customer_id) {
      return jsonResponse({ error: "No Stripe customer is linked to this company yet" }, 409);
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: buildReturnUrl(returnUrl, { stripe_portal: "return" }),
    });

    return jsonResponse({ success: true, url: portalSession.url });
  } catch (error) {
    console.error("createStripeBillingPortalSession error:", error);
    return jsonResponse({ error: error instanceof Error ? error.message : String(error) }, getErrorStatus(error, 500));
  }
});