// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const DEFAULT_PREFERENCES = {
  project_invite: { notification: true, email: true },
  company_invite: { notification: true, email: true },
  task_assigned: { notification: true, email: false },
  task_status_changed: { notification: true, email: false },
  change_request_assigned: { notification: true, email: true },
  change_request_status_changed: { notification: true, email: false },
  milestone_status_changed: { notification: true, email: false },
  event_invite: { notification: true, email: true },
  event_updated: { notification: true, email: true },
  event_cancelled: { notification: true, email: true },
  message_mention: { notification: true, email: false },
  document_comment: { notification: true, email: false },
  dispute_opened: { notification: true, email: true },
  dispute_status_changed: { notification: true, email: true },
  dispute_commented: { notification: true, email: false },
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const emailWebhookUrl = Deno.env.get("EMAIL_WEBHOOK_URL") || "";
const resendApiKey = Deno.env.get("RESEND_API_KEY") || "";
const resendFromEmail = Deno.env.get("RESEND_FROM_EMAIL") || "";

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const jsonResponse = (payload: unknown, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders,
    },
  });

async function sendEmail(payload: { to: string; subject: string; body: string; from_name?: string }) {
  if (resendApiKey && resendFromEmail) {
    const htmlBody = `<div style="font-family:Arial,sans-serif;line-height:1.5;white-space:pre-wrap;">${payload.body}</div>`;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: `${payload.from_name || "EdilSync"} <${resendFromEmail}>`,
        to: [payload.to],
        subject: payload.subject,
        html: htmlBody,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Resend failed: ${res.status} ${text}`);
    }

    return { sent: true, provider: "resend" };
  }

  if (!emailWebhookUrl) {
    throw new Error("No email provider configured: set EMAIL_WEBHOOK_URL or RESEND_API_KEY + RESEND_FROM_EMAIL");
  }

  const res = await fetch(emailWebhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Email webhook failed: ${res.status} ${text}`);
  }

  return { sent: true, provider: "webhook" };
}

Deno.serve(async (req) => {
  try {
    if (req.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders });
    }

    const payload = await req.json();
    const {
      action_type,
      recipient_email,
      context_type,
      context_company_id,
      notification_data,
      email_data,
      skip_preferences_check,
    } = payload;

    if (!action_type || !recipient_email) {
      return jsonResponse({ error: "Missing required fields: action_type, recipient_email" }, 400);
    }

    if (!notification_data && !email_data) {
      return jsonResponse({ error: "At least one of notification_data or email_data must be provided" }, 400);
    }

    let actionPrefs = { notification: true, email: true };

    if (!skip_preferences_check) {
      const { data: prefsRow, error: prefsError } = await supabase
        .from("notification_preferences")
        .select("id, preferences")
        .eq("user_email", recipient_email)
        .maybeSingle();

      if (prefsError) throw prefsError;

      let preferences = prefsRow?.preferences;

      if (!preferences) {
        const { error: createPrefError } = await supabase
          .from("notification_preferences")
          .insert({
            user_email: recipient_email,
            preferences: DEFAULT_PREFERENCES,
          });

        if (createPrefError) throw createPrefError;
        preferences = DEFAULT_PREFERENCES;
      }

      actionPrefs = preferences[action_type] || DEFAULT_PREFERENCES[action_type] || { notification: false, email: false };
    }

    const result = {
      success: true,
      notification_sent: false,
      email_sent: false,
      email_provider: null as string | null,
      email_skipped_reason: null as string | null,
    };

    if (notification_data && actionPrefs.notification) {
      const { error: notificationError } = await supabase
        .from("notifications")
        .insert({
          user_email: recipient_email,
          context_type: context_type || "personal",
          context_company_id: context_company_id || null,
          type: notification_data.type,
          title: notification_data.title,
          message: notification_data.message,
          related_event_id: notification_data.related_event_id || null,
          is_read: false,
        });

      if (notificationError) throw notificationError;
      result.notification_sent = true;
    }

    if (email_data && actionPrefs.email) {
      const emailResult = await sendEmail({
        to: recipient_email,
        subject: email_data.subject,
        body: email_data.body,
        from_name: email_data.from_name || "EdilSync",
      });

      result.email_sent = !!emailResult.sent;
      result.email_provider = (emailResult as { provider?: string }).provider || null;
      if (!emailResult.sent) {
        result.email_skipped_reason = (emailResult as { reason?: string }).reason || null;
      }
    }

    return jsonResponse(result);
  } catch (error) {
    console.error("sendNotificationOrEmail error:", error);
    return jsonResponse({ error: error instanceof Error ? error.message : String(error) }, 500);
  }
});
