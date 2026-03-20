// @ts-nocheck
import { adminClient } from "./supabase.ts";

const ACTIVE_STATUSES = new Set(["active", "invited"]);

export async function syncUserAccessByEmail(userEmail: string) {
  if (!userEmail) return null;

  const { data: memberships, error: membershipsError } = await adminClient
    .from("company_members")
    .select("company_id, user_email, role, status")
    .eq("user_email", userEmail);

  if (membershipsError) throw membershipsError;

  const activeMemberships = (memberships || []).filter((membership) =>
    ACTIVE_STATUSES.has(membership.status || ""),
  );

  const companyIds = Array.from(
    new Set(activeMemberships.map((membership) => membership.company_id).filter(Boolean)),
  );

  const adminCompanyIds = Array.from(
    new Set(
      activeMemberships
        .filter((membership) => membership.role === "admin" && membership.status === "active")
        .map((membership) => membership.company_id)
        .filter(Boolean),
    ),
  );

  const { data: participants, error: participantsError } = await adminClient
    .from("project_participants")
    .select("participant_type, company_id, user_email, project_id, status");

  if (participantsError) throw participantsError;

  const relevantParticipants = (participants || []).filter((participant) =>
    ACTIVE_STATUSES.has(participant.status || ""),
  );

  const personalProjectIds = relevantParticipants
    .filter((participant) => participant.participant_type === "personal" && participant.user_email === userEmail)
    .map((participant) => participant.project_id)
    .filter(Boolean);

  const companyProjectIds = relevantParticipants
    .filter((participant) => participant.participant_type === "company" && participant.company_id && companyIds.includes(participant.company_id))
    .map((participant) => participant.project_id)
    .filter(Boolean);

  const projectIds = Array.from(new Set([...personalProjectIds, ...companyProjectIds]));

  const { data: existingUser, error: existingUserError } = await adminClient
    .from("users")
    .select("id,email")
    .eq("email", userEmail)
    .maybeSingle();

  if (existingUserError) throw existingUserError;

  if (existingUser?.id) {
    const { error: updateError } = await adminClient
      .from("users")
      .update({
        company_ids: companyIds,
        admin_company_ids: adminCompanyIds,
        project_ids: projectIds,
      })
      .eq("id", existingUser.id);

    if (updateError) throw updateError;
  } else {
    const { error: insertError } = await adminClient
      .from("users")
      .insert({
        email: userEmail,
        company_ids: companyIds,
        admin_company_ids: adminCompanyIds,
        project_ids: projectIds,
      });

    if (insertError) throw insertError;
  }

  return { company_ids: companyIds, admin_company_ids: adminCompanyIds, project_ids: projectIds };
}

export async function syncCompanyUsers(companyId: string) {
  if (!companyId) return [];

  const { data: members, error } = await adminClient
    .from("company_members")
    .select("user_email, status")
    .eq("company_id", companyId);

  if (error) throw error;

  const emails = Array.from(
    new Set(
      (members || [])
        .filter((member) => member.user_email && ACTIVE_STATUSES.has(member.status || ""))
        .map((member) => member.user_email),
    ),
  );

  const results = [];
  for (const email of emails) {
    results.push(await syncUserAccessByEmail(email));
  }
  return results;
}

export async function isCompanyAdmin(companyId: string, userEmail: string) {
  const { data, error } = await adminClient
    .from("company_members")
    .select("id")
    .eq("company_id", companyId)
    .eq("user_email", userEmail)
    .eq("role", "admin")
    .eq("status", "active")
    .maybeSingle();

  if (error) throw error;
  return Boolean(data?.id);
}