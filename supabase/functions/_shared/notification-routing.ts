// @ts-nocheck
import { adminClient } from "./supabase.ts";
import { InputValidationError } from "./input.ts";

const ACTIVE_STATUS = "active";

function dedupeRecipients(recipients: Array<Record<string, unknown>>, preferPersonal = false) {
  const unique = new Map();

  for (const recipient of recipients) {
    if (!recipient?.email) continue;

    const key = preferPersonal
      ? String(recipient.email)
      : `${recipient.email}::${recipient.context_type || "personal"}::${recipient.context_company_id || ""}`;

    const existing = unique.get(key);
    if (!existing) {
      unique.set(key, recipient);
      continue;
    }

    if (preferPersonal && existing.context_type !== "personal" && recipient.context_type === "personal") {
      unique.set(key, recipient);
    }
  }

  return Array.from(unique.values());
}

async function getActiveCompanyAdmins(companyIds: string[]) {
  const filteredCompanyIds = Array.from(new Set(companyIds.filter(Boolean)));
  if (!filteredCompanyIds.length) {
    return new Map();
  }

  const { data, error } = await adminClient
    .from("company_members")
    .select("company_id,user_email")
    .in("company_id", filteredCompanyIds)
    .eq("status", ACTIVE_STATUS)
    .eq("role", "admin");

  if (error) throw error;

  const adminsByCompany = new Map();
  for (const row of data || []) {
    if (!row.company_id || !row.user_email) continue;
    const current = adminsByCompany.get(row.company_id) || [];
    current.push(row.user_email);
    adminsByCompany.set(row.company_id, current);
  }

  return adminsByCompany;
}

export async function getProjectNotificationContext(projectId: string, userEmail: string) {
  const [{ data: participants, error: participantsError }, { data: memberships, error: membershipsError }] = await Promise.all([
    adminClient
      .from("project_participants")
      .select("id,participant_type,company_id,user_email,status")
      .eq("project_id", projectId)
      .eq("status", ACTIVE_STATUS),
    adminClient
      .from("company_members")
      .select("company_id,role,status")
      .eq("user_email", userEmail)
      .eq("status", ACTIVE_STATUS),
  ]);

  if (participantsError) throw participantsError;
  if (membershipsError) throw membershipsError;

  const membershipCompanyIds = Array.from(new Set((memberships || []).map((membership) => membership.company_id).filter(Boolean)));
  const adminCompanyIds = Array.from(new Set((memberships || []).filter((membership) => membership.role === "admin").map((membership) => membership.company_id).filter(Boolean)));

  return {
    projectId,
    userEmail,
    participants: participants || [],
    membershipCompanyIds,
    adminCompanyIds,
  };
}

export function assertProjectAccess(context: Record<string, unknown>, { requireAdminParticipantCompany = false } = {}) {
  const participants = Array.isArray(context.participants) ? context.participants : [];
  const membershipCompanyIds = Array.isArray(context.membershipCompanyIds) ? context.membershipCompanyIds : [];
  const adminCompanyIds = Array.isArray(context.adminCompanyIds) ? context.adminCompanyIds : [];
  const userEmail = String(context.userEmail || "");

  const hasPersonalAccess = participants.some((participant) =>
    participant.participant_type === "personal" && participant.user_email === userEmail,
  );
  const hasCompanyAccess = participants.some((participant) =>
    participant.participant_type === "company" && participant.company_id && membershipCompanyIds.includes(participant.company_id),
  );

  if (!hasPersonalAccess && !hasCompanyAccess) {
    throw new InputValidationError("Forbidden", 403);
  }

  if (requireAdminParticipantCompany) {
    const hasAdminParticipantCompany = participants.some((participant) =>
      participant.participant_type === "company" && participant.company_id && adminCompanyIds.includes(participant.company_id),
    );

    if (!hasAdminParticipantCompany) {
      throw new InputValidationError("Forbidden", 403);
    }
  }
}

export async function resolveProjectRecipients(context: Record<string, unknown>, { excludeActor = false, preferPersonal = false } = {}) {
  const participants = Array.isArray(context.participants) ? context.participants : [];
  const membershipCompanyIds = Array.isArray(context.membershipCompanyIds) ? context.membershipCompanyIds : [];
  const userEmail = String(context.userEmail || "");

  const targetParticipants = excludeActor
    ? participants.filter((participant) => {
      if (participant.participant_type === "personal") {
        return participant.user_email !== userEmail;
      }

      if (participant.participant_type === "company") {
        return participant.company_id && !membershipCompanyIds.includes(participant.company_id);
      }

      return false;
    })
    : participants;

  const companyIds = Array.from(new Set(targetParticipants
    .filter((participant) => participant.participant_type === "company" && participant.company_id)
    .map((participant) => participant.company_id)));

  const companyAdminsByCompany = await getActiveCompanyAdmins(companyIds);
  const recipients = [];

  for (const participant of targetParticipants) {
    if (participant.participant_type === "personal" && participant.user_email) {
      recipients.push({
        email: participant.user_email,
        context_type: "personal",
        context_company_id: null,
      });
      continue;
    }

    if (participant.participant_type === "company" && participant.company_id) {
      const admins = companyAdminsByCompany.get(participant.company_id) || [];
      for (const adminEmail of admins) {
        recipients.push({
          email: adminEmail,
          context_type: "company",
          context_company_id: participant.company_id,
        });
      }
    }
  }

  return dedupeRecipients(recipients, preferPersonal);
}

export async function resolveTaskBlockedRecipients(
  context: Record<string, unknown>,
  blockedByType: string,
  blockedByUserEmail: string | null,
  blockedByCompanyId: string | null,
) {
  if (blockedByType === "other") {
    return [];
  }

  const participants = Array.isArray(context.participants) ? context.participants : [];

  if (blockedByType === "personal") {
    const matchingParticipant = participants.find((participant) =>
      participant.participant_type === "personal" && participant.user_email === blockedByUserEmail,
    );

    if (!matchingParticipant || !blockedByUserEmail) {
      return [];
    }

    return [{
      email: blockedByUserEmail,
      context_type: "personal",
      context_company_id: null,
    }];
  }

  if (blockedByType === "company") {
    const matchingParticipant = participants.find((participant) =>
      participant.participant_type === "company" && participant.company_id === blockedByCompanyId,
    );

    if (!matchingParticipant || !blockedByCompanyId) {
      return [];
    }

    const adminsByCompany = await getActiveCompanyAdmins([blockedByCompanyId]);
    const admins = adminsByCompany.get(blockedByCompanyId) || [];
    return admins.map((email) => ({
      email,
      context_type: "company",
      context_company_id: blockedByCompanyId,
    }));
  }

  throw new InputValidationError("Unsupported blocked_by_type", 400);
}