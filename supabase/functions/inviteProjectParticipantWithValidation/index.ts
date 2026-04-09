// @ts-nocheck
import { adminClient, corsHeaders, getAuthenticatedContext, invokeInternalFunction, jsonResponse } from "../_shared/supabase.ts";
import { assertNoUnexpectedKeys, getErrorStatus, optionalEmail, optionalEnum, optionalUuid, parseJsonBody, requiredEnum, requiredUuid } from "../_shared/input.ts";
import { syncCompanyUsers, syncUserAccessByEmail } from "../_shared/access.ts";

const COMPANY_TYPE_ROLE_COMPATIBILITY = {
  general_contractor: ["homeowner", "contractor", "subcontractor", "architect", "engineer", "surveyor", "designer", "consultant", "supplier"],
  excavation: ["subcontractor"],
  demolition: ["subcontractor"],
  foundations: ["subcontractor"],
  concrete_structures: ["subcontractor"],
  metal_carpentry: ["subcontractor"],
  masonry: ["subcontractor"],
  roofing_tinsmithing: ["subcontractor"],
  waterproofing_insulation: ["subcontractor"],
  electrical_systems: ["subcontractor"],
  plumbing_hvac: ["subcontractor"],
  drywall: ["subcontractor"],
  flooring_cladding: ["subcontractor"],
  painting: ["subcontractor"],
  fixtures_windows: ["subcontractor"],
  blacksmith: ["subcontractor"],
  restoration: ["subcontractor", "consultant"],
  architecture_studio: ["architect", "consultant"],
  engineering_studio: ["engineer", "consultant"],
  surveying_studio: ["surveyor", "consultant"],
  design_studio: ["designer", "consultant"],
  supplier: ["supplier"],
  other: ["homeowner", "contractor", "subcontractor", "architect", "engineer", "surveyor", "designer", "consultant", "supplier"],
};

const PARTICIPANT_TYPES = ["company", "personal"];
const PROJECT_ROLES = ["homeowner", "contractor", "subcontractor", "architect", "engineer", "surveyor", "designer", "consultant", "supplier"];

function isCompanyTypeCompatible(companyType: string | null, projectRole: string) {
  if (!companyType) return true;
  return (COMPANY_TYPE_ROLE_COMPATIBILITY[companyType] || COMPANY_TYPE_ROLE_COMPATIBILITY.other).includes(projectRole);
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
    const payload = await parseJsonBody(req, { maxBytes: 6 * 1024 });
    assertNoUnexpectedKeys(payload, ["project_id", "participant_type", "project_role", "company_id", "user_email"]);

    const projectId = requiredUuid(payload.project_id, "project_id");
    const participantType = requiredEnum(payload.participant_type, "participant_type", PARTICIPANT_TYPES);
    const projectRole = requiredEnum(payload.project_role, "project_role", PROJECT_ROLES);
    const invitedCompanyId = optionalUuid(payload.company_id, "company_id");
    const invitedEmail = optionalEmail(payload.user_email, "user_email");

    const { data: project, error: projectError } = await adminClient
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .single();

    if (projectError) throw projectError;

    const isBlockedForSponsorLoss = Boolean((await adminClient.rpc(
      "is_project_blocked_for_sponsor_loss",
      { target_project_id: projectId },
    )).data);

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

    if (!currentUserParticipation?.id) {
      return jsonResponse({ error: "You are not an active participant in this worksite" }, 403);
    }

    const canInvite = Boolean(currentUserParticipation.can_invite || currentUserParticipation.project_role === "homeowner");
    if (!canInvite) {
      return jsonResponse({ error: "You do not have permission to invite participants in this worksite" }, 403);
    }

    if (isBlockedForSponsorLoss && participantType !== "company") {
      return jsonResponse({ error: "A blocked worksite can invite only companies until sponsorship is restored" }, 403);
    }

    if (currentUserParticipation.project_role === "contractor" && projectRole !== "subcontractor") {
      return jsonResponse({ error: "Contractors can only invite subcontractors" }, 403);
    }

    if (participantType === "personal") {
      if (projectRole !== "homeowner") {
        return jsonResponse({ error: "Personal participants are currently allowed only as homeowner" }, 400);
      }
      if (!invitedEmail || !invitedEmail.includes("@")) {
        return jsonResponse({ error: "A valid homeowner email is required" }, 400);
      }
      if (project.owner_type === "personal") {
        return jsonResponse({ error: "This worksite already has a canonical homeowner" }, 409);
      }

      const { data: existingHomeowner, error: existingHomeownerError } = await adminClient
        .from("project_participants")
        .select("id")
        .eq("project_id", projectId)
        .eq("project_role", "homeowner")
        .in("status", ["active", "invited"])
        .maybeSingle();

      if (existingHomeownerError) throw existingHomeownerError;
      if (existingHomeowner?.id) {
        return jsonResponse({ error: "This worksite already has a canonical homeowner" }, 409);
      }
    }

    if (participantType === "company") {
      if (!invitedCompanyId) {
        return jsonResponse({ error: "company_id is required for company invites" }, 400);
      }

      const { data: company, error: companyError } = await adminClient
        .from("companies")
        .select("id, name, email, company_type")
        .eq("id", invitedCompanyId)
        .single();

      if (companyError) throw companyError;

      if (!isCompanyTypeCompatible(company.company_type, projectRole)) {
        return jsonResponse({ error: "The selected company type is not compatible with the requested worksite role" }, 400);
      }

      const isSponsored = Boolean((await adminClient.rpc("is_project_sponsored", { target_project_id: projectId })).data);
      const ownerIsFreeCompany = project.owner_type === "company"
        && project.owner_company_id
        && !(await adminClient.rpc("is_company_paid", { target_company_id: project.owner_company_id })).data;

      if (!isBlockedForSponsorLoss && !isSponsored && ownerIsFreeCompany && project.owner_company_id === currentUserParticipation.company_id) {
        return jsonResponse({ error: "A free company-owned non-sponsored worksite can invite only the homeowner" }, 403);
      }

      const { data: duplicateCompanyParticipant, error: duplicateCompanyParticipantError } = await adminClient
        .from("project_participants")
        .select("id")
        .eq("project_id", projectId)
        .eq("participant_type", "company")
        .eq("company_id", invitedCompanyId)
        .in("status", ["active", "invited"])
        .maybeSingle();

      if (duplicateCompanyParticipantError) throw duplicateCompanyParticipantError;
      if (duplicateCompanyParticipant?.id) {
        return jsonResponse({ error: "This company is already active or invited in the worksite" }, 409);
      }
    }

    if (participantType === "personal") {
      const { data: duplicatePersonalParticipant, error: duplicatePersonalParticipantError } = await adminClient
        .from("project_participants")
        .select("id")
        .eq("project_id", projectId)
        .eq("participant_type", "personal")
        .eq("user_email", invitedEmail)
        .in("status", ["active", "invited"])
        .maybeSingle();

      if (duplicatePersonalParticipantError) throw duplicatePersonalParticipantError;
      if (duplicatePersonalParticipant?.id) {
        return jsonResponse({ error: "This personal participant is already active or invited in the worksite" }, 409);
      }
    }

    let invitedUserId = null;
    if (participantType === "personal") {
      const { data: existingUser, error: userError } = await adminClient
        .from("users")
        .select("id")
        .eq("email", invitedEmail)
        .maybeSingle();
      if (userError) throw userError;
      invitedUserId = existingUser?.id || null;
    }

    const insertPayload: Record<string, unknown> = {
      project_id: projectId,
      participant_type: participantType,
      project_role: projectRole,
      status: "invited",
      can_invite: projectRole === "contractor",
    };

    if (participantType === "company") {
      insertPayload.company_id = invitedCompanyId;
    } else {
      insertPayload.user_email = invitedEmail;
      insertPayload.user_id = invitedUserId;
    }

    if (currentUserParticipation.project_role === "contractor" && currentUserParticipation.company_id) {
      insertPayload.invited_by_company_id = currentUserParticipation.company_id;
    }

    const { data: participant, error: participantError } = await adminClient
      .from("project_participants")
      .insert(insertPayload)
      .select("*")
      .single();

    if (participantError) throw participantError;

    const { data: generalChannel, error: generalChannelError } = await adminClient
      .from("channels")
      .select("id")
      .eq("project_id", projectId)
      .eq("type", "general")
      .eq("name", "General")
      .maybeSingle();

    if (generalChannelError) throw generalChannelError;

    if (generalChannel?.id) {
      const { error: channelMemberError } = await adminClient
        .from("channel_members")
        .insert({
          channel_id: generalChannel.id,
          project_id: projectId,
          participant_id: participant.id,
          user_email: participantType === "personal" ? invitedEmail : null,
          company_id: participantType === "company" ? invitedCompanyId : null,
          last_read_at: new Date().toISOString(),
        });

      if (channelMemberError) throw channelMemberError;
    }

    if (participantType === "company") {
      const { data: invitedCompany, error: invitedCompanyError } = await adminClient
        .from("companies")
        .select("id, name, email")
        .eq("id", invitedCompanyId)
        .single();
      if (invitedCompanyError) throw invitedCompanyError;

      const { data: companyAdmins, error: companyAdminsError } = await adminClient
        .from("company_members")
        .select("user_email")
        .eq("company_id", invitedCompanyId)
        .eq("status", "active")
        .eq("role", "admin");
      if (companyAdminsError) throw companyAdminsError;

      for (const member of companyAdmins || []) {
        await invokeInternalFunction("sendNotificationOrEmail", {
          action_type: "project_invite",
          recipient_email: member.user_email,
          context_type: "company",
          context_company_id: invitedCompanyId,
          notification_data: {
            type: "project_invite",
            title: "Invito a nuovo cantiere",
            message: `La tua società è stata invitata al cantiere \"${project.name}\" con ruolo ${projectRole}`,
            related_event_id: projectId,
          },
          email_data: null,
        });
      }

      if (invitedCompany.email) {
        await invokeInternalFunction("sendNotificationOrEmail", {
          action_type: "project_invite",
          recipient_email: invitedCompany.email,
          context_type: "company",
          context_company_id: invitedCompanyId,
          skip_preferences_check: true,
          notification_data: null,
          email_data: {
            subject: `Invito a nuovo cantiere: ${project.name}`,
            body: `Gentile ${invitedCompany.name},\n\nLa vostra società è stata invitata al cantiere \"${project.name}\" con ruolo ${projectRole}.\n\nI membri amministratori della società riceveranno una notifica nell'applicazione.\n\nCordiali saluti,\nIl team EdilSync`,
          },
        });
      }

      await syncCompanyUsers(invitedCompanyId);
    } else {
      await invokeInternalFunction("sendNotificationOrEmail", {
        action_type: "project_invite",
        recipient_email: invitedEmail,
        context_type: "personal",
        notification_data: {
          type: "project_invite",
          title: "Invito a nuovo cantiere",
          message: `Sei stato invitato al cantiere \"${project.name}\" con ruolo ${projectRole}`,
          related_event_id: projectId,
        },
        email_data: {
          subject: `Invito a nuovo cantiere: ${project.name}`,
          body: `Ciao,\n\nSei stato invitato al cantiere \"${project.name}\" con ruolo ${projectRole}.\n\nAccedi all'applicazione per visualizzare i dettagli del cantiere.\n\nCordiali saluti,\nIl team EdilSync`,
        },
      });

      await syncUserAccessByEmail(invitedEmail);
    }

    return jsonResponse({ success: true, participant });
  } catch (error) {
    console.error("inviteProjectParticipantWithValidation error:", error);
    return jsonResponse({ error: error instanceof Error ? error.message : String(error) }, getErrorStatus(error, 500));
  }
});