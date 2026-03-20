// @ts-nocheck
import { adminClient, corsHeaders, getAuthenticatedContext, jsonResponse } from "../_shared/supabase.ts";
import { syncUserAccessByEmail } from "../_shared/access.ts";

Deno.serve(async (req) => {
  try {
    if (req.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders });
    }

    const { appUser } = await getAuthenticatedContext(req);
    const payload = await req.json();

    if (!payload?.name?.trim()) {
      return jsonResponse({ error: "Company name is required" }, 400);
    }

    const { data: company, error: companyError } = await adminClient
      .from("companies")
      .insert({
        name: payload.name.trim(),
        company_type: payload.company_type || "general_contractor",
        vat_number: payload.vat_number || null,
        address: payload.address || null,
        phone: payload.phone || null,
        email: payload.email || null,
        description: payload.description || null,
      })
      .select("*")
      .single();

    if (companyError) throw companyError;

    const { data: member, error: memberError } = await adminClient
      .from("company_members")
      .insert({
        company_id: company.id,
        user_id: appUser.id,
        user_email: appUser.email,
        role: "admin",
        profession: "owner_admin",
        company_member_role: "owner_admin",
        status: "active",
      })
      .select("*")
      .single();

    if (memberError) throw memberError;

    const { error: subscriptionError } = await adminClient
      .from("company_subscriptions")
      .upsert({
        company_id: company.id,
        plan_code: "free",
        billing_status: "free",
        currency: "EUR",
      }, { onConflict: "company_id" });

    if (subscriptionError) throw subscriptionError;

    const { data: channel, error: channelError } = await adminClient
      .from("channels")
      .insert({
        project_id: null,
        company_id: company.id,
        name: "General",
        type: "company",
        description: "Canale generale per comunicazioni all'interno della società",
        created_by_email: appUser.email,
      })
      .select("*")
      .single();

    if (channelError) throw channelError;

    const { error: channelMemberError } = await adminClient
      .from("channel_members")
      .insert({
        channel_id: channel.id,
        project_id: null,
        participant_id: member.id,
        user_email: appUser.email,
        company_id: company.id,
        last_read_at: new Date().toISOString(),
      });

    if (channelMemberError) throw channelMemberError;

    await syncUserAccessByEmail(appUser.email);

    return jsonResponse({ success: true, company });
  } catch (error) {
    console.error("createCompanyWithInitialization error:", error);
    return jsonResponse({ error: error instanceof Error ? error.message : String(error) }, 500);
  }
});