// @ts-nocheck
import { adminClient, corsHeaders, getAuthenticatedContext, jsonResponse } from "../_shared/supabase.ts";
import { assertNoUnexpectedKeys, getErrorStatus, parseJsonBody, requiredEnum, requiredUuid } from "../_shared/input.ts";
import { syncCompanyUsers, syncUserAccessByEmail } from "../_shared/access.ts";

const INVITE_RESPONSE_STATUSES = ["active", "declined"];

Deno.serve(async (req) => {
  try {
    if (req.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders });
    }

    if (req.method !== "POST") {
      return jsonResponse({ error: "Method not allowed" }, 405);
    }

    const { appUser } = await getAuthenticatedContext(req);
    const payload = await parseJsonBody(req, { maxBytes: 4 * 1024 });
    assertNoUnexpectedKeys(payload, ["participant_id", "status"]);

    const participantId = requiredUuid(payload.participant_id, "participant_id");
    const nextStatus = requiredEnum(payload.status, "status", INVITE_RESPONSE_STATUSES);

    const { data: participant, error: participantError } = await adminClient
      .from("project_participants")
      .select("*")
      .eq("id", participantId)
      .maybeSingle();

    if (participantError) throw participantError;
    if (!participant?.id) {
      return jsonResponse({ error: "Project participant invite not found" }, 404);
    }

    if (participant.status === nextStatus) {
      return jsonResponse({ success: true, participant });
    }

    if (participant.status !== "invited") {
      return jsonResponse({ error: "Only invited participants can respond to this invitation" }, 409);
    }

    if (participant.participant_type === "personal") {
      if (!participant.user_email || participant.user_email !== appUser.email) {
        return jsonResponse({ error: "You are not allowed to respond to this personal invite" }, 403);
      }
    } else if (participant.participant_type === "company") {
      if (!participant.company_id) {
        return jsonResponse({ error: "Company invite is missing company_id" }, 400);
      }

      const { data: membership, error: membershipError } = await adminClient
        .from("company_members")
        .select("id")
        .eq("company_id", participant.company_id)
        .eq("user_email", appUser.email)
        .eq("status", "active")
        .maybeSingle();

      if (membershipError) throw membershipError;
      if (!membership?.id) {
        return jsonResponse({ error: "You are not allowed to respond to this company invite" }, 403);
      }
    } else {
      return jsonResponse({ error: "Unsupported participant type" }, 400);
    }

    const { data: updatedParticipant, error: updateError } = await adminClient
      .from("project_participants")
      .update({ status: nextStatus })
      .eq("id", participantId)
      .select("*")
      .single();

    if (updateError) throw updateError;

    if (updatedParticipant.participant_type === "company" && updatedParticipant.company_id) {
      await syncCompanyUsers(updatedParticipant.company_id);
    } else if (updatedParticipant.user_email) {
      await syncUserAccessByEmail(updatedParticipant.user_email);
    }

    return jsonResponse({ success: true, participant: updatedParticipant });
  } catch (error) {
    console.error("respondProjectParticipantInvite error:", error);
    return jsonResponse({ error: error instanceof Error ? error.message : String(error) }, getErrorStatus(error, 500));
  }
});