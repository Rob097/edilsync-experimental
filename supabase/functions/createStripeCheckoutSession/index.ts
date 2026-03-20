// @ts-nocheck
import { adminClient, corsHeaders, getAuthenticatedContext, jsonResponse } from "../_shared/supabase.ts";
import { isCompanyAdmin } from "../_shared/access.ts";
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

    ensureStripeConfigured();

    const { appUser } = await getAuthenticatedContext(req);
    const payload = await req.json();

    const companyId = payload?.company_id;
    const billingCycle = payload?.billing_cycle;
    const returnUrl = payload?.return_url;

    if (!companyId || !["monthly", "yearly"].includes(billingCycle || "")) {
      return jsonResponse({ error: "company_id and valid billing_cycle are required" }, 400);
    }

    if (!returnUrl?.startsWith("http")) {
      return jsonResponse({ error: "Valid return_url is required" }, 400);
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
    return jsonResponse({ error: error instanceof Error ? error.message : String(error) }, 500);
  }
});