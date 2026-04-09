// @ts-nocheck
import { adminClient, corsHeaders, getAuthenticatedContext, jsonResponse } from "../_shared/supabase.ts";
import { assertNoUnexpectedKeys, getErrorStatus, optionalDate, optionalEmail, optionalIdentifier, optionalText, parseJsonBody, requiredEnum, requiredText } from "../_shared/input.ts";
import { isCompanyAdmin, syncUserAccessByEmail } from "../_shared/access.ts";

const CREATOR_PROJECT_ROLES = ["homeowner", "contractor"];

Deno.serve(async (req) => {
  try {
    if (req.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders });
    }

    if (req.method !== "POST") {
      return jsonResponse({ error: "Method not allowed" }, 405);
    }

    const { appUser } = await getAuthenticatedContext(req);
    const payload = await parseJsonBody(req, { maxBytes: 12 * 1024 });
    assertNoUnexpectedKeys(payload, ["name", "address", "description", "status", "start_date", "end_date", "my_role", "homeowner_email"]);

    const projectName = requiredText(payload.name, { field: "name", minLength: 1, maxLength: 120, collapseWhitespace: true });
    const projectAddress = requiredText(payload.address, { field: "address", minLength: 1, maxLength: 240, collapseWhitespace: true });
    const projectDescription = optionalText(payload.description, { field: "description", maxLength: 2000, multiline: true, collapseWhitespace: true });
    const projectStatus = optionalIdentifier(payload.status, "status", 40) || "planning";
    const startDate = optionalDate(payload.start_date, "start_date");
    const endDate = optionalDate(payload.end_date, "end_date");
    const creatorRole = optionalEnum(payload.my_role, "my_role", CREATOR_PROJECT_ROLES);
    const homeownerEmail = optionalEmail(payload.homeowner_email, "homeowner_email");

    const currentContext = appUser.active_context || "personal";
    const activeCompanyId = appUser.active_company_id || null;

    if (currentContext === "company") {
      if (!activeCompanyId) {
        return jsonResponse({ error: "Missing active company context" }, 400);
      }

      const admin = await isCompanyAdmin(activeCompanyId, appUser.email);
      if (!admin) {
        return jsonResponse({ error: "Only company admins can create worksites in company context" }, 403);
      }
    }

    const myRole = currentContext === "personal" ? "homeowner" : (creatorRole || "homeowner");

    if (currentContext === "company" && myRole === "contractor" && !homeownerEmail) {
      return jsonResponse({ error: "Homeowner email is required when company creates a worksite as contractor" }, 400);
    }

    const ownerType = currentContext;
    const ownerCompanyId = ownerType === "company" ? activeCompanyId : null;
    const autoSponsor = Boolean(
      ownerCompanyId
      && (await adminClient.rpc("is_company_paid", { target_company_id: ownerCompanyId })).data,
    );

    if (!autoSponsor) {
      const ownerFilter = ownerType === "company"
        ? `owner_company_id.eq.${ownerCompanyId}`
        : `owner_user_id.eq.${appUser.id}`;

      const { data: ownedProjects, error: ownedProjectsError } = await adminClient
        .from("projects")
        .select("id, owner_type")
        .eq("owner_type", ownerType)
        .or(ownerFilter);

      if (ownedProjectsError) throw ownedProjectsError;

      const projectIds = (ownedProjects || []).map((project) => project.id);
      let nonSponsoredCount = 0;

      if (projectIds.length > 0) {
        const { data: sponsorships, error: sponsorshipsError } = await adminClient
          .from("project_sponsorships")
          .select("project_id")
          .in("project_id", projectIds)
          .eq("status", "active")
          .is("ended_at", null);

        if (sponsorshipsError) throw sponsorshipsError;

        const sponsoredIds = new Set((sponsorships || []).map((item) => item.project_id));
        nonSponsoredCount = projectIds.filter((projectId) => !sponsoredIds.has(projectId)).length;
      }

      if (nonSponsoredCount >= 1) {
        return jsonResponse({ error: "Only one non-sponsored owned worksite is allowed" }, 403);
      }
    }

    const { data: project, error: projectError } = await adminClient
      .from("projects")
      .insert({
        name: projectName,
        address: projectAddress,
        description: projectDescription,
        status: projectStatus,
        start_date: startDate,
        end_date: endDate,
        owner_type: ownerType,
        owner_company_id: ownerCompanyId,
        owner_user_id: appUser.id,
      })
      .select("*")
      .single();

    if (projectError) throw projectError;

    const creatorParticipantType = ownerType === "company" ? "company" : "personal";
    const { data: creatorParticipant, error: creatorParticipantError } = await adminClient
      .from("project_participants")
      .insert({
        project_id: project.id,
        participant_type: creatorParticipantType,
        user_id: creatorParticipantType === "personal" ? appUser.id : null,
        user_email: appUser.email,
        company_id: creatorParticipantType === "company" ? ownerCompanyId : null,
        project_role: myRole,
        status: "active",
        can_invite: true,
      })
      .select("*")
      .single();

    if (creatorParticipantError) throw creatorParticipantError;

    const { data: channel, error: channelError } = await adminClient
      .from("channels")
      .insert({
        project_id: project.id,
        name: "General",
        type: "general",
        description: "Canale generale per comunicazioni all'interno del cantiere",
        created_by_email: appUser.email,
      })
      .select("*")
      .single();

    if (channelError) throw channelError;

    const { error: channelMemberError } = await adminClient
      .from("channel_members")
      .insert({
        channel_id: channel.id,
        project_id: project.id,
        participant_id: creatorParticipant.id,
        user_email: appUser.email,
        company_id: ownerCompanyId,
        last_read_at: new Date().toISOString(),
      });

    if (channelMemberError) throw channelMemberError;

    let invitedHomeowner = null;
    if (ownerType === "company" && myRole === "contractor" && homeownerEmail) {
      const { data: existingHomeowner, error: homeownerCheckError } = await adminClient
        .from("project_participants")
        .select("id")
        .eq("project_id", project.id)
        .eq("project_role", "homeowner")
        .in("status", ["active", "invited"])
        .maybeSingle();

      if (homeownerCheckError) throw homeownerCheckError;
      if (!existingHomeowner?.id) {
        const { data: invitedParticipant, error: inviteError } = await adminClient
          .from("project_participants")
          .insert({
            project_id: project.id,
            participant_type: "personal",
            user_email: homeownerEmail,
            project_role: "homeowner",
            status: "invited",
            can_invite: true,
          })
          .select("*")
          .single();

        if (inviteError) throw inviteError;
        invitedHomeowner = invitedParticipant;
        await syncUserAccessByEmail(homeownerEmail);
      }
    }

    if (autoSponsor && ownerCompanyId) {
      const { error: sponsorshipError } = await adminClient
        .from("project_sponsorships")
        .insert({
          project_id: project.id,
          sponsor_company_id: ownerCompanyId,
          status: "active",
          started_at: new Date().toISOString(),
          activation_source: "project_creation",
        });

      if (sponsorshipError) throw sponsorshipError;
    }

    await syncUserAccessByEmail(appUser.email);

    return jsonResponse({
      success: true,
      project,
      auto_sponsored: autoSponsor,
      invited_homeowner: invitedHomeowner,
    });
  } catch (error) {
    console.error("createProjectWithContext error:", error);
    return jsonResponse({ error: error instanceof Error ? error.message : String(error) }, getErrorStatus(error, 500));
  }
});