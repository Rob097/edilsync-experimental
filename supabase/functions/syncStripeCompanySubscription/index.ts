// @ts-nocheck
import { adminClient, corsHeaders, getAuthenticatedContext, jsonResponse } from "../_shared/supabase.ts";
import { isCompanyAdmin } from "../_shared/access.ts";
import {
  ensureStripeConfigured,
  stripe,
  syncCompanySubscriptionFromStripeSubscription,
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

    if (!companyId) {
      return jsonResponse({ error: "company_id is required" }, 400);
    }

    const canManageAsCompanyAdmin = await isCompanyAdmin(companyId, appUser.email);
    const canManageAsSystemAdmin = appUser.role === "admin";

    if (!canManageAsCompanyAdmin && !canManageAsSystemAdmin) {
      return jsonResponse({ error: "Only company admins or system admins can sync billing" }, 403);
    }

    const { data: subscriptionRow, error: subscriptionError } = await adminClient
      .from("company_subscriptions")
      .select("stripe_subscription_id, stripe_customer_id, plan_code, billing_status")
      .eq("company_id", companyId)
      .maybeSingle();

    if (subscriptionError) throw subscriptionError;

    const stripeSubscriptionId = subscriptionRow?.stripe_subscription_id || null;
    const stripeCustomerId = subscriptionRow?.stripe_customer_id || null;

    if (!stripeSubscriptionId && !stripeCustomerId) {
      return jsonResponse({
        success: true,
        synced: false,
        reason: "no_stripe_reference",
      });
    }

    let stripeSubscription = null;

    if (stripeSubscriptionId) {
      stripeSubscription = await stripe.subscriptions.retrieve(String(stripeSubscriptionId), {
        expand: ["items.data.price"],
      });
    } else if (stripeCustomerId) {
      const subscriptions = await stripe.subscriptions.list({
        customer: String(stripeCustomerId),
        status: "all",
        limit: 10,
        expand: ["data.items.data.price"],
      });

      stripeSubscription = subscriptions.data.find((item) => item.status !== "incomplete_expired") || subscriptions.data[0] || null;
    }

    if (!stripeSubscription) {
      const { error: freeStateError } = await adminClient
        .from("company_subscriptions")
        .upsert({
          company_id: companyId,
          plan_code: "free",
          billing_status: "free",
          billing_cycle: null,
          current_period_start: null,
          current_period_end: null,
          cancel_at_period_end: false,
          canceled_at: null,
          stripe_subscription_id: null,
          stripe_customer_id: stripeCustomerId,
          created_by: "manual_stripe_sync",
        }, { onConflict: "company_id" });

      if (freeStateError) throw freeStateError;

      return jsonResponse({
        success: true,
        synced: true,
        company_id: companyId,
        billing_status: "free",
        plan_code: "free",
      });
    }

    const { payload: syncedPayload } = await syncCompanySubscriptionFromStripeSubscription(
      stripeSubscription,
      companyId,
      undefined,
      "manual_stripe_sync",
    );

    return jsonResponse({
      success: true,
      synced: true,
      company_id: companyId,
      plan_code: syncedPayload.plan_code,
      billing_status: syncedPayload.billing_status,
      billing_cycle: syncedPayload.billing_cycle,
      cancel_at_period_end: syncedPayload.cancel_at_period_end,
      current_period_end: syncedPayload.current_period_end,
    });
  } catch (error) {
    console.error("syncStripeCompanySubscription error:", error);
    return jsonResponse({ error: error instanceof Error ? error.message : String(error) }, 500);
  }
});