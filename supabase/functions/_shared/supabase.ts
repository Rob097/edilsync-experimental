// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
export const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

export const adminClient = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export const jsonResponse = (payload: unknown, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders,
    },
  });

export async function getAuthenticatedContext(req: Request) {
  const authHeader = req.headers.get("Authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : authHeader;

  if (!token) {
    throw new Error("Missing authorization token");
  }

  const { data, error } = await adminClient.auth.getUser(token);
  if (error || !data?.user) {
    throw new Error("Unauthorized");
  }

  const authUser = data.user;

  const { data: existingUser, error: userError } = await adminClient
    .from("users")
    .select("*")
    .or(`auth_user_id.eq.${authUser.id},email.eq.${authUser.email}`)
    .limit(1)
    .maybeSingle();

  if (userError) throw userError;

  let appUser = existingUser;

  if (!appUser) {
    const { data: createdUser, error: insertError } = await adminClient
      .from("users")
      .insert({
        auth_user_id: authUser.id,
        email: authUser.email,
        full_name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || null,
      })
      .select("*")
      .single();

    if (insertError) throw insertError;
    appUser = createdUser;
  }

  if (!appUser.auth_user_id) {
    const { data: updatedUser, error: updateError } = await adminClient
      .from("users")
      .update({ auth_user_id: authUser.id })
      .eq("id", appUser.id)
      .select("*")
      .single();

    if (updateError) throw updateError;
    appUser = updatedUser;
  }

  return { authUser, appUser };
}

export async function invokeInternalFunction(name: string, payload: unknown) {
  const response = await fetch(`${supabaseUrl}/functions/v1/${name}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: serviceRoleKey,
      "x-internal-service-key": serviceRoleKey,
      "x-internal-source": name,
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.error || `Function ${name} failed with status ${response.status}`);
  }
  return data;
}