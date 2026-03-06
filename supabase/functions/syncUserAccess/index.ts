// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type MembershipRow = {
  company_id: string | null;
  user_email: string | null;
  role: string | null;
  status: string | null;
};

type ParticipantRow = {
  participant_type: string | null;
  company_id: string | null;
  user_email: string | null;
  project_id: string | null;
  status: string | null;
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

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

const ACTIVE_STATUSES = new Set(["active", "invited"]);

async function syncUser(userEmail: string) {
  if (!userEmail) {
    return { skipped: true, reason: "missing_user_email" };
  }

  const { data: memberships, error: membershipsError } = await supabase
    .from("company_members")
    .select("company_id, user_email, role, status")
    .eq("user_email", userEmail);

  if (membershipsError) throw membershipsError;

  const activeMemberships = (memberships ?? []).filter((m: MembershipRow) =>
    ACTIVE_STATUSES.has(m.status ?? ""),
  );

  const companyIds = Array.from(
    new Set(activeMemberships.map((m) => m.company_id).filter(Boolean)),
  ) as string[];

  const adminCompanyIds = Array.from(
    new Set(
      activeMemberships
        .filter((m) => m.role === "admin" && m.status === "active")
        .map((m) => m.company_id)
        .filter(Boolean),
    ),
  ) as string[];

  const { data: participants, error: participantsError } = await supabase
    .from("project_participants")
    .select("participant_type, company_id, user_email, project_id, status");

  if (participantsError) throw participantsError;

  const relevantParticipants = (participants ?? []).filter((p: ParticipantRow) =>
    ACTIVE_STATUSES.has(p.status ?? "")
  );

  const personalProjectIds = relevantParticipants
    .filter((p) => p.participant_type === "personal" && p.user_email === userEmail)
    .map((p) => p.project_id)
    .filter(Boolean) as string[];

  const companyProjectIds = relevantParticipants
    .filter((p) => p.participant_type === "company" && p.company_id && companyIds.includes(p.company_id))
    .map((p) => p.project_id)
    .filter(Boolean) as string[];

  const projectIds = Array.from(new Set([...personalProjectIds, ...companyProjectIds]));

  const { data: existingUser, error: existingUserError } = await supabase
    .from("users")
    .select("id,email")
    .eq("email", userEmail)
    .maybeSingle();

  if (existingUserError) throw existingUserError;

  if (existingUser?.id) {
    const { error: updateError } = await supabase
      .from("users")
      .update({
        company_ids: companyIds,
        admin_company_ids: adminCompanyIds,
        project_ids: projectIds,
      })
      .eq("id", existingUser.id);

    if (updateError) throw updateError;
  } else {
    const { error: insertError } = await supabase
      .from("users")
      .insert({
        email: userEmail,
        company_ids: companyIds,
        admin_company_ids: adminCompanyIds,
        project_ids: projectIds,
      });

    if (insertError) throw insertError;
  }

  return {
    updated: true,
    company_ids: companyIds,
    admin_company_ids: adminCompanyIds,
    project_ids: projectIds,
  };
}

Deno.serve(async (req) => {
  try {
    if (req.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders });
    }

    const payload = await req.json().catch(() => ({}));
    const emailsToSync = new Set<string>();

    if (payload?.event) {
      const { event, data, old_data } = payload;

      if (event?.entity_name === "CompanyMember") {
        if (data?.user_email) emailsToSync.add(data.user_email);
        if (old_data?.user_email && old_data.user_email !== data?.user_email) {
          emailsToSync.add(old_data.user_email);
        }
      }

      if (event?.entity_name === "ProjectParticipant") {
        const participantType = data?.participant_type ?? old_data?.participant_type;

        if (participantType === "personal") {
          if (data?.user_email) emailsToSync.add(data.user_email);
          if (old_data?.user_email && old_data.user_email !== data?.user_email) {
            emailsToSync.add(old_data.user_email);
          }
        }

        if (participantType === "company") {
          const companyId = data?.company_id ?? old_data?.company_id;
          if (companyId) {
            const { data: members, error: membersError } = await supabase
              .from("company_members")
              .select("user_email, status")
              .eq("company_id", companyId);

            if (membersError) throw membersError;

            for (const member of members ?? []) {
              if (member.user_email && ACTIVE_STATUSES.has(member.status ?? "")) {
                emailsToSync.add(member.user_email);
              }
            }
          }
        }
      }
    }

    if (payload?.user_email) emailsToSync.add(payload.user_email);

    if (payload?.company_id) {
      const { data: members, error: membersError } = await supabase
        .from("company_members")
        .select("user_email, status")
        .eq("company_id", payload.company_id);

      if (membersError) throw membersError;

      for (const member of members ?? []) {
        if (member.user_email && ACTIVE_STATUSES.has(member.status ?? "")) {
          emailsToSync.add(member.user_email);
        }
      }
    }

    if (payload?.sync_all === true) {
      return jsonResponse({ error: "sync_all is disabled" }, 403);
    }

    if (emailsToSync.size === 0) {
      return jsonResponse({ success: true, synced: [], message: "No users to sync" });
    }

    const results = [];
    for (const email of emailsToSync) {
      const result = await syncUser(email);
      results.push({ email, ...result });
    }

    return jsonResponse({ success: true, synced: results });
  } catch (error) {
    console.error("syncUserAccess error:", error);
    return jsonResponse({ error: error instanceof Error ? error.message : String(error) }, 500);
  }
});
