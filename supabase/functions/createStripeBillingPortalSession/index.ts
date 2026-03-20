// @ts-nocheck
import { adminClient, corsHeaders, getAuthenticatedContext, jsonResponse } from "../_shared/supabase.ts";
import { isCompanyAdmin } from "../_shared/access.ts";
import { buildReturnUrl, ensureStripeConfigured, stripe } from "../_shared/stripe.ts";

Deno.serve(async (req) => {
  try {
    if (req.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders });
    }

    ensureStripeConfigured();

    const { appUser } = await getAuthenticatedContext(req);
    const payload = await req.json();

    const companyId = payload?.company_id;
    const returnUrl = payload?.return_url;

    if (!companyId) {
      return jsonResponse({ error: "company_id is required" }, 400);
    }

    if (!returnUrl?.startsWith("http")) {
      return jsonResponse({ error: "Valid return_url is required" }, 400);
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
    return jsonResponse({ error: error instanceof Error ? error.message : String(error) }, 500);
  }
});