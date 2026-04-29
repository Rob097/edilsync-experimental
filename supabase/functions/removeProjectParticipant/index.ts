// @ts-nocheck
import { adminClient, corsHeaders, getAuthenticatedContext, jsonResponse } from "../_shared/supabase.ts";
import { syncCompanyUsers, syncUserAccessByEmail } from "../_shared/access.ts";
import { assertNoUnexpectedKeys, getErrorStatus, parseJsonBody, requiredUuid } from "../_shared/input.ts";

async function getCurrentUserParticipation(projectId: string, appUser: { email?: string | null; active_context?: string | null; active_company_id?: string | null }) {
  const currentContext = appUser.active_context || "personal";
  const activeCompanyId = appUser.active_company_id || null;

  const participationQuery = adminClient
    .from("project_participants")
    .select("*")
    .eq("project_id", projectId)
    .eq("status", "active");

  let { data: currentUserParticipation, error: participationError } = await (currentContext === "company" && activeCompanyId
    ? participationQuery.eq("participant_type", "company").eq("company_id", activeCompanyId).maybeSingle()
    : participationQuery.eq("participant_type", "personal").eq("user_email", appUser.email).maybeSingle());

  if (participationError) throw participationError;

  if (!currentUserParticipation?.id && activeCompanyId) {
    const fallback = await adminClient
      .from("project_participants")
      .select("*")
      .eq("project_id", projectId)
      .eq("status", "active")
      .eq("participant_type", "company")
      .eq("company_id", activeCompanyId)
      .maybeSingle();

    if (fallback.error) throw fallback.error;
    currentUserParticipation = fallback.data;
  }

  return currentUserParticipation || null;
}

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
    assertNoUnexpectedKeys(payload, ["participant_id"]);

    const participantId = requiredUuid(payload.participant_id, "participant_id");

    const { data: participant, error: participantError } = await adminClient
      .from("project_participants")
      .select("*")
      .eq("id", participantId)
      .maybeSingle();

    if (participantError) throw participantError;
    if (!participant?.id) {
      return jsonResponse({ error: "Project participant not found" }, 404);
    }

    const { data: project, error: projectError } = await adminClient
      .from("projects")
      .select("id, owner_user_id")
      .eq("id", participant.project_id)
      .single();

    if (projectError) throw projectError;

    const currentUserParticipation = await getCurrentUserParticipation(participant.project_id, appUser);
    if (!currentUserParticipation?.id) {
      return jsonResponse({ error: "You are not an active participant in this worksite" }, 403);
    }

    const canRemove = Boolean(
      currentUserParticipation.project_role === "homeowner"
      || currentUserParticipation.can_invite
      || project.owner_user_id === appUser.id,
    );

    if (!canRemove) {
      return jsonResponse({ error: "You do not have permission to remove participants in this worksite" }, 403);
    }

    if (participant.id === currentUserParticipation.id) {
      return jsonResponse({ error: "You cannot remove your own participation" }, 409);
    }

    if (participant.status === "removed") {
      return jsonResponse({ success: true, participant });
    }

    if (participant.status === "active" && participant.project_role === "homeowner") {
      return jsonResponse({ error: "The active homeowner cannot be removed from this worksite" }, 409);
    }

    const { error: channelMembersError } = await adminClient
      .from("channel_members")
      .delete()
      .eq("project_id", participant.project_id)
      .eq("participant_id", participantId);

    if (channelMembersError) throw channelMembersError;

    const { data: updatedParticipant, error: updateError } = await adminClient
      .from("project_participants")
      .update({ status: "removed" })
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
    console.error("removeProjectParticipant error:", error);
    return jsonResponse({ error: error instanceof Error ? error.message : String(error) }, getErrorStatus(error, 500));
  }
});