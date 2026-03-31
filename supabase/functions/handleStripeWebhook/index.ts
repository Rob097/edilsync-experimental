// @ts-nocheck
import { adminClient, corsHeaders, jsonResponse } from "../_shared/supabase.ts";
import {
  ensureStripeConfigured,
  findCompanyIdForStripeReference,
  stripe,
  stripeCryptoProvider,
  syncCompanySubscriptionFromStripeSubscription,
} from "../_shared/stripe.ts";

async function getOrCreateStripeEventRow(event) {
  const { data: existing, error: existingError } = await adminClient
    .from("stripe_events")
    .select("id, processed")
    .eq("event_id", event.id)
    .maybeSingle();

  if (existingError) throw existingError;
  if (existing?.processed) {
    return { id: existing.id, alreadyProcessed: true };
  }

  if (existing?.id) {
    const { error: updateError } = await adminClient
      .from("stripe_events")
      .update({
        event_type: event.type,
        livemode: Boolean(event.livemode),
        payload: event,
        error_message: null,
      })
      .eq("id", existing.id);

    if (updateError) throw updateError;
    return { id: existing.id, alreadyProcessed: false };
  }

  const { data: inserted, error: insertError } = await adminClient
    .from("stripe_events")
    .insert({
      event_id: event.id,
      event_type: event.type,
      livemode: Boolean(event.livemode),
      payload: event,
      processed: false,
      created_by: "stripe_webhook",
    })
    .select("id")
    .single();

  if (insertError) throw insertError;
  return { id: inserted.id, alreadyProcessed: false };
}

async function markStripeEventProcessed(id) {
  await adminClient
    .from("stripe_events")
    .update({
      processed: true,
      processed_at: new Date().toISOString(),
      error_message: null,
    })
    .eq("id", id);
}

async function markStripeEventFailed(id, errorMessage) {
  await adminClient
    .from("stripe_events")
    .update({ error_message: errorMessage })
    .eq("id", id);
}

async function handleStripeEvent(event) {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      if (session.mode !== "subscription" || !session.subscription) {
        return;
      }

      const subscription = await stripe.subscriptions.retrieve(String(session.subscription), {
        expand: ["items.data.price"],
      });

      const explicitCompanyId = session.metadata?.company_id || session.client_reference_id || null;
      await syncCompanySubscriptionFromStripeSubscription(subscription, explicitCompanyId, undefined, event.type);
      return;
    }

    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const eventSubscription = event.data.object;
      const explicitCompanyId = eventSubscription.metadata?.company_id || null;

      if (event.type === "customer.subscription.deleted") {
        await syncCompanySubscriptionFromStripeSubscription(eventSubscription, explicitCompanyId, undefined, event.type);
        return;
      }

      const latestSubscription = await stripe.subscriptions.retrieve(String(eventSubscription.id), {
        expand: ["items.data.price"],
      });

      await syncCompanySubscriptionFromStripeSubscription(latestSubscription, explicitCompanyId, undefined, event.type);
      return;
    }

    case "invoice.paid":
    case "invoice.payment_failed": {
      const invoice = event.data.object;
      if (!invoice.subscription) {
        return;
      }

      const explicitCompanyId = await findCompanyIdForStripeReference({
        explicitCompanyId: null,
        subscriptionId: String(invoice.subscription),
        customerId: invoice.customer ? String(invoice.customer) : null,
      });

      const subscription = await stripe.subscriptions.retrieve(String(invoice.subscription), {
        expand: ["items.data.price"],
      });

      const firstLine = invoice.lines?.data?.[0] || null;
      const currentPeriodStart = firstLine?.period?.start ? new Date(firstLine.period.start * 1000).toISOString() : null;
      const currentPeriodEnd = firstLine?.period?.end ? new Date(firstLine.period.end * 1000).toISOString() : null;

      await syncCompanySubscriptionFromStripeSubscription(subscription, explicitCompanyId, {
        currentPeriodStart,
        currentPeriodEnd,
      }, event.type);
      return;
    }

    default:
      return;
  }
}

Deno.serve(async (req) => {
  let eventRowId = null;

  try {
    if (req.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders });
    }

    ensureStripeConfigured();

    const signature = req.headers.get("Stripe-Signature");
    if (!signature) {
      return jsonResponse({ error: "Missing Stripe-Signature header" }, 400);
    }

    const signingSecret = Deno.env.get("STRIPE_WEBHOOK_SIGNING_SECRET");
    if (!signingSecret) {
      return jsonResponse({ error: "Missing STRIPE_WEBHOOK_SIGNING_SECRET" }, 500);
    }

    const body = await req.text();
    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      signingSecret,
      undefined,
      stripeCryptoProvider,
    );

    const eventRow = await getOrCreateStripeEventRow(event);
    eventRowId = eventRow.id;

    if (eventRow.alreadyProcessed) {
      return jsonResponse({ received: true, duplicate: true });
    }

    await handleStripeEvent(event);
    await markStripeEventProcessed(eventRow.id);

    return jsonResponse({ received: true });
  } catch (error) {
    console.error("handleStripeWebhook error:", error);

    if (eventRowId) {
      await markStripeEventFailed(eventRowId, error instanceof Error ? error.message : String(error));
    }

    return jsonResponse({ error: error instanceof Error ? error.message : String(error) }, 400);
  }
});