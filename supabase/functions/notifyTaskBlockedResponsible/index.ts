// @ts-nocheck
import { assertNoUnexpectedKeys, getErrorStatus, optionalText, parseJsonBody, requiredEmail, requiredEnum, requiredText, requiredUuid } from "../_shared/input.ts";
import { assertProjectAccess, getProjectNotificationContext, resolveTaskBlockedRecipients } from "../_shared/notification-routing.ts";
import { corsHeaders, getAuthenticatedContext, invokeInternalFunction, jsonResponse } from "../_shared/supabase.ts";

const BLOCKED_BY_TYPES = ["personal", "company", "other"];

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
    assertNoUnexpectedKeys(payload, ["project_id", "blocked_by_type", "blocked_by_user_email", "blocked_by_company_id", "title", "message", "email_subject", "email_body"]);

    const projectId = requiredUuid(payload.project_id, "project_id");
    const blockedByType = requiredEnum(payload.blocked_by_type, "blocked_by_type", BLOCKED_BY_TYPES);
    const blockedByUserEmail = blockedByType === "personal"
      ? requiredEmail(payload.blocked_by_user_email, "blocked_by_user_email")
      : optionalText(payload.blocked_by_user_email, { field: "blocked_by_user_email", maxLength: 254, collapseWhitespace: true });
    const blockedByCompanyId = blockedByType === "company"
      ? requiredUuid(payload.blocked_by_company_id, "blocked_by_company_id")
      : optionalText(payload.blocked_by_company_id, { field: "blocked_by_company_id", maxLength: 80, collapseWhitespace: true });
    const title = requiredText(payload.title, { field: "title", minLength: 1, maxLength: 160, collapseWhitespace: true });
    const message = requiredText(payload.message, { field: "message", minLength: 1, maxLength: 2000, multiline: true, collapseWhitespace: true });
    const emailSubject = requiredText(payload.email_subject, { field: "email_subject", minLength: 1, maxLength: 200, collapseWhitespace: true });
    const emailBody = requiredText(payload.email_body, { field: "email_body", minLength: 1, maxLength: 6000, multiline: true, collapseWhitespace: true });

    const context = await getProjectNotificationContext(projectId, appUser.email);
    assertProjectAccess(context);

    const recipients = await resolveTaskBlockedRecipients(context, blockedByType, blockedByUserEmail || null, blockedByCompanyId || null);

    const results = await Promise.allSettled(
      recipients.map((recipient) => invokeInternalFunction("sendNotificationOrEmail", {
        action_type: "task_status_changed",
        recipient_email: recipient.email,
        context_type: recipient.context_type,
        context_company_id: recipient.context_company_id,
        notification_data: {
          type: "task_status_changed",
          title,
          message,
          related_event_id: projectId,
        },
        email_data: {
          subject: emailSubject,
          body: emailBody,
        },
      })),
    );

    const deliveredCount = results.filter((result) => result.status === "fulfilled").length;
    return jsonResponse({ success: true, recipient_count: recipients.length, delivered_count: deliveredCount });
  } catch (error) {
    console.error("notifyTaskBlockedResponsible error:", error);
    return jsonResponse({ error: error instanceof Error ? error.message : String(error) }, getErrorStatus(error, 500));
  }
});