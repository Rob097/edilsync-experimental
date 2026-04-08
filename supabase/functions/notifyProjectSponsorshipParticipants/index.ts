// @ts-nocheck
import { assertNoUnexpectedKeys, getErrorStatus, optionalText, parseJsonBody, requiredEnum, requiredText, requiredUuid } from "../_shared/input.ts";
import { assertProjectAccess, getProjectNotificationContext, resolveProjectRecipients } from "../_shared/notification-routing.ts";
import { corsHeaders, getAuthenticatedContext, invokeInternalFunction, jsonResponse } from "../_shared/supabase.ts";

const ALLOWED_ACTIONS = ["project_sponsorship_activated", "project_sponsorship_revoked"];

Deno.serve(async (req) => {
  try {
    if (req.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders });
    }

    if (req.method !== "POST") {
      return jsonResponse({ error: "Method not allowed" }, 405);
    }

    const { appUser } = await getAuthenticatedContext(req);
    const payload = await parseJsonBody(req, { maxBytes: 16 * 1024 });
    assertNoUnexpectedKeys(payload, ["project_id", "action_type", "notification_type", "title", "message", "email_subject", "email_body"]);

    const projectId = requiredUuid(payload.project_id, "project_id");
    const actionType = requiredEnum(payload.action_type, "action_type", ALLOWED_ACTIONS);
    const notificationType = requiredEnum(payload.notification_type, "notification_type", ALLOWED_ACTIONS);
    const title = requiredText(payload.title, { field: "title", minLength: 1, maxLength: 160, collapseWhitespace: true });
    const message = requiredText(payload.message, { field: "message", minLength: 1, maxLength: 2000, multiline: true, collapseWhitespace: true });
    const emailSubject = optionalText(payload.email_subject, { field: "email_subject", maxLength: 200, collapseWhitespace: true });
    const emailBody = optionalText(payload.email_body, { field: "email_body", maxLength: 6000, multiline: true, collapseWhitespace: true });

    const context = await getProjectNotificationContext(projectId, appUser.email);
    assertProjectAccess(context, { requireAdminParticipantCompany: true });

    const recipients = await resolveProjectRecipients(context, { preferPersonal: true });

    const results = await Promise.allSettled(
      recipients.map((recipient) => invokeInternalFunction("sendNotificationOrEmail", {
        action_type: actionType,
        recipient_email: recipient.email,
        context_type: recipient.context_type,
        context_company_id: recipient.context_company_id,
        notification_data: {
          type: notificationType,
          title,
          message,
          related_event_id: projectId,
        },
        email_data: emailSubject && emailBody
          ? {
            subject: emailSubject,
            body: emailBody,
          }
          : null,
      })),
    );

    const deliveredCount = results.filter((result) => result.status === "fulfilled").length;
    return jsonResponse({ success: true, recipient_count: recipients.length, delivered_count: deliveredCount });
  } catch (error) {
    console.error("notifyProjectSponsorshipParticipants error:", error);
    return jsonResponse({ error: error instanceof Error ? error.message : String(error) }, getErrorStatus(error, 500));
  }
});