// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

const clean = (value: unknown) => String(value || "").trim();

async function sha256Hex(input: string) {
  const data = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function getClientIp(req: Request) {
  const headerValue = req.headers.get("cf-connecting-ip") || req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip");
  if (!headerValue) return "";
  return headerValue.split(",")[0]?.trim() || "";
}

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

  const htmlBody = `<div style="font-family:Arial,sans-serif;line-height:1.5;white-space:pre-wrap;">${body}</div>`;

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

    const raw = await req.json();

    const full_name = clean(raw?.full_name);
    const email = clean(raw?.email).toLowerCase();
    const company_name = clean(raw?.company_name);
    const role_label = clean(raw?.role_label);
    const message = clean(raw?.message);
    const locale = clean(raw?.locale) || "it";
    const source_path = clean(raw?.source_path);
    const honeypot = clean(raw?.website);
    const user_agent = clean(req.headers.get("user-agent"));

    if (honeypot) {
      // Bot trap: silently accept to avoid spam tuning by attackers.
      return jsonResponse({ success: true, accepted: false, reason: "bot_detected" }, 200);
    }

    if (full_name.length < 2 || !/^.+@.+\..+$/.test(email) || message.length < 10) {
      return jsonResponse({ error: "Invalid input" }, 400);
    }

    if (message.length > 4000 || full_name.length > 200 || company_name.length > 200 || role_label.length > 120) {
      return jsonResponse({ error: "Input too long" }, 400);
    }

    const clientIp = getClientIp(req);
    const ipHash = clientIp ? await sha256Hex(clientIp) : null;

    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    if (ipHash) {
      const { count: recentFromIp, error: ipCountError } = await supabase
        .from("demo_requests")
        .select("id", { count: "exact", head: true })
        .eq("ip_hash", ipHash)
        .gte("created_date", tenMinutesAgo);

      if (ipCountError) throw ipCountError;
      if ((recentFromIp || 0) >= 5) {
        return jsonResponse({ error: "Too many requests. Please retry later." }, 429);
      }
    }

    const { count: recentFromEmail, error: emailCountError } = await supabase
      .from("demo_requests")
      .select("id", { count: "exact", head: true })
      .eq("email", email)
      .gte("created_date", oneDayAgo);

    if (emailCountError) throw emailCountError;
    if ((recentFromEmail || 0) >= 3) {
      return jsonResponse({ error: "Too many requests from this email. Please retry later." }, 429);
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
    return jsonResponse({ error: error instanceof Error ? error.message : String(error) }, 500);
  }
});
