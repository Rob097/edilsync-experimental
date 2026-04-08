// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { assertNoUnexpectedKeys, escapeHtml, getErrorStatus, optionalIdentifier, optionalText, parseJsonBody, requiredEmail, requiredText } from "../_shared/input.ts";
import { enforceRateLimit, getClientIp, sha256Hex } from "../_shared/rate-limit.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const resendApiKey = Deno.env.get("RESEND_API_KEY") || "";
const resendFromEmail = Deno.env.get("RESEND_FROM_EMAIL") || "";
const leadRecipientEmail = Deno.env.get("LEAD_NOTIFICATION_EMAIL") || "info@rdlabs.digital";

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

async function sendLeadEmail(payload: {
  full_name: string;
  email: string;
  company_name: string;
  role_label: string;
  message: string;
  locale: string;
  source_path: string;
  user_agent: string;
}) {
  if (!resendApiKey || !resendFromEmail) {
    return { sent: false, reason: "missing_resend_configuration" };
  }

  const subject = `[EdilSync] Nuova richiesta demo da ${payload.full_name}`;
  const body = `Nuova richiesta demo ricevuta\n\nNome: ${payload.full_name}\nEmail: ${payload.email}\nAzienda: ${payload.company_name || "-"}\nRuolo: ${payload.role_label || "-"}\nLingua: ${payload.locale}\nSource path: ${payload.source_path || "-"}\nUser-Agent: ${payload.user_agent || "-"}\n\nMessaggio:\n${payload.message || "-"}`;

  const htmlBody = `<div style="font-family:Arial,sans-serif;line-height:1.5;white-space:pre-wrap;">${escapeHtml(body)}</div>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${resendApiKey}`,
    },
    body: JSON.stringify({
      from: `EdilSync <${resendFromEmail}>`,
      to: [leadRecipientEmail],
      subject,
      html: htmlBody,
      reply_to: payload.email,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    return { sent: false, reason: `resend_error_${res.status}`, details: text };
  }

  return { sent: true };
}

Deno.serve(async (req) => {
  try {
    if (req.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders });
    }

    if (req.method !== "POST") {
      return jsonResponse({ error: "Method not allowed" }, 405);
    }

    const raw = await parseJsonBody(req, { maxBytes: 8 * 1024 });
    assertNoUnexpectedKeys(raw, ["full_name", "email", "company_name", "role_label", "message", "locale", "source_path", "website"]);

    const full_name = requiredText(raw?.full_name, { field: "full_name", minLength: 2, maxLength: 200, collapseWhitespace: true });
    const email = requiredEmail(raw?.email, "email");
    const company_name = optionalText(raw?.company_name, { field: "company_name", maxLength: 200, collapseWhitespace: true }) || "";
    const role_label = optionalText(raw?.role_label, { field: "role_label", maxLength: 120, collapseWhitespace: true }) || "";
    const message = requiredText(raw?.message, { field: "message", minLength: 10, maxLength: 4000, multiline: true, collapseWhitespace: true });
    const locale = optionalIdentifier(raw?.locale, "locale", 16) || "it";
    const source_path = optionalText(raw?.source_path, { field: "source_path", maxLength: 512, collapseWhitespace: true }) || "";
    const honeypot = optionalText(raw?.website, { field: "website", maxLength: 200, collapseWhitespace: true }) || "";
    const user_agent = optionalText(req.headers.get("user-agent"), { field: "user-agent", maxLength: 512, collapseWhitespace: true }) || "";

    if (honeypot) {
      // Bot trap: silently accept to avoid spam tuning by attackers.
      return jsonResponse({ success: true, accepted: false, reason: "bot_detected" }, 200);
    }

    const clientIp = getClientIp(req);
    const ipHash = clientIp ? await sha256Hex(clientIp) : null;

    if (ipHash) {
      const ipRateLimitResponse = await enforceRateLimit({
        scope: "submit_demo_request:ip",
        identifier: ipHash,
        windowSeconds: 10 * 60,
        maxRequests: 5,
        message: "Too many requests. Please retry later.",
        corsHeaders,
      });

      if (ipRateLimitResponse) {
        return ipRateLimitResponse;
      }
    }

    const emailRateLimitResponse = await enforceRateLimit({
      scope: "submit_demo_request:email",
      identifier: email,
      windowSeconds: 24 * 60 * 60,
      maxRequests: 3,
      message: "Too many requests from this email. Please retry later.",
      corsHeaders,
    });

    if (emailRateLimitResponse) {
      return emailRateLimitResponse;
    }

    const { error: insertError } = await supabase.from("demo_requests").insert({
      full_name,
      email,
      company_name: company_name || null,
      role_label: role_label || null,
      message,
      locale: locale === "en" ? "en" : "it",
      source_path: source_path || null,
      ip_hash: ipHash,
      user_agent: user_agent || null,
    });

    if (insertError) throw insertError;

    const emailResult = await sendLeadEmail({
      full_name,
      email,
      company_name,
      role_label,
      message,
      locale,
      source_path,
      user_agent,
    });

    return jsonResponse({ success: true, accepted: true, emailSent: !!emailResult.sent, emailInfo: emailResult }, 200);
  } catch (error) {
    console.error("submitDemoRequest error:", error);
    return jsonResponse({ error: error instanceof Error ? error.message : String(error) }, getErrorStatus(error, 400));
  }
});
