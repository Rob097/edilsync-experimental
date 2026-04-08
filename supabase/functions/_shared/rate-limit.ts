// @ts-nocheck
import { adminClient } from "./supabase.ts";

type RateLimitOptions = {
  scope: string;
  identifier: string | null | undefined;
  windowSeconds: number;
  maxRequests: number;
  message: string;
  corsHeaders: Record<string, string>;
};

type RateLimitDecision = {
  allowed: boolean;
  currentCount: number;
  remainingRequests: number;
  retryAfterSeconds: number;
  resetAt: string | null;
};

export async function sha256Hex(input: string) {
  const data = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((value) => value.toString(16).padStart(2, "0")).join("");
}

export function getClientIp(req: Request) {
  const headerValue = req.headers.get("cf-connecting-ip") || req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip");
  if (!headerValue) return "";
  return headerValue.split(",")[0]?.trim() || "";
}

export async function enforceRateLimit(options: RateLimitOptions) {
  const identifier = String(options.identifier || "").trim();
  if (!identifier) {
    return null;
  }

  const { data, error } = await adminClient.rpc("consume_rate_limit", {
    p_scope: options.scope,
    p_identifier: identifier,
    p_window_seconds: options.windowSeconds,
    p_max_requests: options.maxRequests,
  });

  if (error) throw error;

  const rawDecision = Array.isArray(data) ? data[0] : data;
  const decision: RateLimitDecision = {
    allowed: Boolean(rawDecision?.allowed),
    currentCount: Number(rawDecision?.current_count || 0),
    remainingRequests: Number(rawDecision?.remaining_requests || 0),
    retryAfterSeconds: Number(rawDecision?.retry_after_seconds || 0),
    resetAt: rawDecision?.reset_at || null,
  };

  if (decision.allowed) {
    return null;
  }

  return new Response(JSON.stringify({
    error: options.message,
    code: "rate_limit_exceeded",
    retry_after_seconds: decision.retryAfterSeconds,
    reset_at: decision.resetAt,
  }), {
    status: 429,
    headers: {
      "Content-Type": "application/json",
      ...options.corsHeaders,
      "Retry-After": String(Math.max(decision.retryAfterSeconds, 1)),
      "X-RateLimit-Limit": String(options.maxRequests),
      "X-RateLimit-Remaining": String(decision.remainingRequests),
      "X-RateLimit-Reset": decision.resetAt || "",
    },
  });
}