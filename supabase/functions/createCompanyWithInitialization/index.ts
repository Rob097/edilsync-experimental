// @ts-nocheck
import { adminClient, corsHeaders, getAuthenticatedContext, jsonResponse } from "../_shared/supabase.ts";
import { assertNoUnexpectedKeys, getErrorStatus, optionalEmail, optionalIdentifier, optionalText, parseJsonBody, requiredText } from "../_shared/input.ts";
import { syncUserAccessByEmail } from "../_shared/access.ts";

Deno.serve(async (req) => {
  try {
    if (req.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders });
    }

    if (req.method !== "POST") {
      return jsonResponse({ error: "Method not allowed" }, 405);
    }

    const { appUser } = await getAuthenticatedContext(req);
    const payload = await parseJsonBody(req, { maxBytes: 8 * 1024 });
    assertNoUnexpectedKeys(payload, ["name", "company_type", "vat_number", "address", "phone", "email", "description"]);

    const name = requiredText(payload.name, { field: "name", minLength: 1, maxLength: 120, collapseWhitespace: true });
    const companyType = optionalIdentifier(payload.company_type, "company_type", 60) || "general_contractor";
    const vatNumber = optionalText(payload.vat_number, {
      field: "vat_number",
      maxLength: 32,
      collapseWhitespace: true,
      pattern: /^[A-Za-z0-9 .\/-]+$/,
      patternMessage: "vat_number is malformed",
    });
    const address = optionalText(payload.address, { field: "address", maxLength: 240, collapseWhitespace: true });
    const phone = optionalText(payload.phone, {
      field: "phone",
      maxLength: 32,
      collapseWhitespace: true,
      pattern: /^[0-9+()\-./ ]+$/,
      patternMessage: "phone is malformed",
    });
    const email = optionalEmail(payload.email, "email");
    const description = optionalText(payload.description, { field: "description", maxLength: 2000, multiline: true, collapseWhitespace: true });

    const { data: company, error: companyError } = await adminClient
      .from("companies")
      .insert({
        name,
        company_type: companyType,
        vat_number: vatNumber,
        address,
        phone,
        email,
        description,
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
    return jsonResponse({ error: error instanceof Error ? error.message : String(error) }, getErrorStatus(error, 500));
  }
});