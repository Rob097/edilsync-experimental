// @ts-nocheck
import { adminClient, corsHeaders, getAuthenticatedContext, invokeInternalFunction, jsonResponse } from "../_shared/supabase.ts";
import { isCompanyAdmin, syncUserAccessByEmail } from "../_shared/access.ts";

Deno.serve(async (req) => {
  try {
    if (req.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders });
    }

    const { appUser } = await getAuthenticatedContext(req);
    const payload = await req.json();

    const companyId = payload.company_id;
    const email = payload.user_email?.trim()?.toLowerCase();
    const role = payload.role || "member";
    const companyMemberRole = payload.company_member_role || payload.profession || "worker";

    if (!companyId || !email || !email.includes("@")) {
      return jsonResponse({ error: "company_id and valid user_email are required" }, 400);
    }

    const admin = await isCompanyAdmin(companyId, appUser.email);
    if (!admin) {
      return jsonResponse({ error: "Only company admins can invite members" }, 403);
    }

    const { data: existingMember, error: existingMemberError } = await adminClient
      .from("company_members")
      .select("id, status")
      .eq("company_id", companyId)
      .eq("user_email", email)
      .in("status", ["active", "invited"])
      .maybeSingle();

    if (existingMemberError) throw existingMemberError;
    if (existingMember?.id) {
      return jsonResponse({ error: "This user is already active or invited in the company" }, 409);
    }

    const { data: company, error: companyError } = await adminClient
      .from("companies")
      .select("id, name")
      .eq("id", companyId)
      .single();

    if (companyError) throw companyError;

    const { data: member, error: memberError } = await adminClient
      .from("company_members")
      .insert({
        company_id: companyId,
        user_email: email,
        role,
        profession: companyMemberRole,
        company_member_role: companyMemberRole,
        status: "invited",
      })
      .select("*")
      .single();

    if (memberError) throw memberError;

    const { data: generalChannel, error: channelError } = await adminClient
      .from("channels")
      .select("id")
      .eq("company_id", companyId)
      .eq("type", "company")
      .eq("name", "General")
      .maybeSingle();

    if (channelError) throw channelError;

    if (generalChannel?.id) {
      const { error: channelMemberError } = await adminClient
        .from("channel_members")
        .insert({
          channel_id: generalChannel.id,
          project_id: null,
          participant_id: member.id,
          user_email: email,
          company_id: companyId,
          last_read_at: new Date().toISOString(),
        });

      if (channelMemberError) throw channelMemberError;
    }

    await invokeInternalFunction("sendNotificationOrEmail", {
      action_type: "company_invite",
      recipient_email: email,
      context_type: "company",
      context_company_id: companyId,
      notification_data: {
        type: "company_invite",
        title: "Invito a nuova società",
        message: `Sei stato invitato a far parte della società \"${company.name}\" con ruolo ${role === "admin" ? "amministratore" : "membro"}`,
        related_event_id: companyId,
      },
      email_data: {
        subject: `Invito a nuova società: ${company.name}`,
        body: `Ciao,\n\nSei stato invitato a far parte della società \"${company.name}\" con ruolo ${role === "admin" ? "amministratore" : "membro"}.\n\nAccedi all'applicazione per accettare l'invito.\n\nCordiali saluti,\nIl team EdilSync`,
      },
    });

    await syncUserAccessByEmail(email);

    return jsonResponse({ success: true, member });
  } catch (error) {
    console.error("inviteCompanyMemberWithValidation error:", error);
    return jsonResponse({ error: error instanceof Error ? error.message : String(error) }, 500);
  }
});