// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { assertNoUnexpectedKeys, escapeHtml, getErrorStatus, optionalBoolean, optionalEnum, optionalText, optionalUuid, parseJsonBody, requireObject, requiredEmail, requiredIdentifier, requiredText } from "../_shared/input.ts";

const DEFAULT_PREFERENCES = {
  project_invite: { notification: true, email: true },
  company_invite: { notification: true, email: true },
  company_plan_activated: { notification: true, email: true },
  company_plan_changed: { notification: true, email: true },
  company_plan_canceled: { notification: true, email: true },
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
  project_sponsorship_activated: { notification: true, email: true },
  project_sponsorship_revoked: { notification: true, email: true },
  dispute_opened: { notification: true, email: true },
  dispute_status_changed: { notification: true, email: true },
  dispute_commented: { notification: true, email: false },
};

async function findRecentDuplicateNotification({
  recipientEmail,
  notificationData,
}: {
  recipientEmail: string;
  notificationData?: {
    type?: string;
    title?: string;
    message?: string;
    related_event_id?: string | null;
  } | null;
}) {
  if (!recipientEmail || !notificationData?.type || !notificationData?.title || !notificationData?.message) {
    return null;
  }

  const duplicateWindowStart = new Date(Date.now() - 5 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("notifications")
    .select("id, created_date")
    .eq("user_email", recipientEmail)
    .eq("type", notificationData.type)
    .eq("title", notificationData.title)
    .eq("message", notificationData.message)
    .eq("related_event_id", notificationData.related_event_id || null)
    .gte("created_date", duplicateWindowStart)
    .order("created_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data || null;
}

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
    const htmlBody = `<div style="font-family:Arial,sans-serif;line-height:1.5;white-space:pre-wrap;">${escapeHtml(payload.body)}</div>`;

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

    if (req.method !== "POST") {
      return jsonResponse({ error: "Method not allowed" }, 405);
    }

    const internalServiceKey = req.headers.get("x-internal-service-key") || "";
    const isInternalRequest = internalServiceKey && internalServiceKey === serviceRoleKey;

    if (!isInternalRequest) {
      return jsonResponse({ error: "Forbidden" }, 403);
    }

    const payload = await parseJsonBody(req, { maxBytes: 24 * 1024 });
    assertNoUnexpectedKeys(payload, [
      "action_type",
      "recipient_email",
      "context_type",
      "context_company_id",
      "notification_data",
      "email_data",
      "skip_preferences_check",
    ]);

    const action_type = requiredIdentifier(payload.action_type, "action_type", 80);
    const recipient_email = requiredEmail(payload.recipient_email, "recipient_email");
    const context_type = optionalEnum(payload.context_type, "context_type", ["personal", "company", "project"]) || "personal";
    const context_company_id = optionalText(payload.context_company_id, {
      field: "context_company_id",
      maxLength: 255,
      collapseWhitespace: true,
    });
    const skip_preferences_check = optionalBoolean(payload.skip_preferences_check, "skip_preferences_check") || false;

    const notification_data = payload.notification_data == null
      ? null
      : validateNotificationData(payload.notification_data);

    const email_data = payload.email_data == null
      ? null
      : validateEmailData(payload.email_data);

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
      duplicate_skipped: false,
    };

    const recentDuplicate = notification_data
      ? await findRecentDuplicateNotification({
        recipientEmail: recipient_email,
        notificationData: notification_data,
      })
      : null;

    if (recentDuplicate) {
      result.duplicate_skipped = true;
      result.email_skipped_reason = "duplicate_notification_recently_sent";
      return jsonResponse(result);
    }

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
    return jsonResponse({ error: error instanceof Error ? error.message : String(error) }, getErrorStatus(error, 500));
  }
});

function validateNotificationData(value: unknown) {
  const payload = requireObject(value, "notification_data");
  assertNoUnexpectedKeys(payload, ["type", "title", "message", "related_event_id"]);

  return {
    type: requiredIdentifier(payload.type, "notification_data.type", 80),
    title: requiredText(payload.title, { field: "notification_data.title", minLength: 1, maxLength: 160, collapseWhitespace: true }),
    message: requiredText(payload.message, { field: "notification_data.message", minLength: 1, maxLength: 2000, multiline: true, collapseWhitespace: true }),
    related_event_id: optionalUuid(payload.related_event_id, "notification_data.related_event_id"),
  };
}

function validateEmailData(value: unknown) {
  const payload = requireObject(value, "email_data");
  assertNoUnexpectedKeys(payload, ["subject", "body", "from_name"]);

  return {
    subject: requiredText(payload.subject, { field: "email_data.subject", minLength: 1, maxLength: 200, collapseWhitespace: true }),
    body: requiredText(payload.body, { field: "email_data.body", minLength: 1, maxLength: 6000, multiline: true, collapseWhitespace: true }),
    from_name: optionalText(payload.from_name, { field: "email_data.from_name", maxLength: 80, collapseWhitespace: true }) || "EdilSync",
  };
}
