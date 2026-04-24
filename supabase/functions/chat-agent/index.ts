// @ts-nocheck
import { buildAssistantReply, deriveAssistantChatScope, assertAssistantContextAccess, ASSISTANT_CONTEXT_TYPES, ASSISTANT_UI_MODES } from "../_shared/assistant.ts";
import { corsHeaders, getAuthenticatedContext, jsonResponse } from "../_shared/supabase.ts";
import { assertNoUnexpectedKeys, getErrorStatus, optionalBoolean, optionalEnum, optionalText, parseJsonBody, requiredText } from "../_shared/input.ts";
import { enforceRateLimit, sha256Hex } from "../_shared/rate-limit.ts";

const encoder = new TextEncoder();
const TEMPORARY_PROVIDER_ERROR_PATTERNS = [
  /this model is currently experiencing high demand/i,
  /high demand/i,
  /resource_exhausted/i,
  /quota/i,
  /rate limit/i,
  /too many requests/i,
  /temporarily unavailable/i,
  /try again later/i,
  /service unavailable/i,
  /overloaded/i,
];

Deno.serve(async (req) => {
  try {
    if (req.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders });
    }

    if (req.method !== "POST") {
      return jsonResponse({ error: "Method not allowed" }, 405);
    }

    const { appUser, userClient } = await getAuthenticatedContext(req);
    const payload = await parseJsonBody(req, { maxBytes: 24 * 1024 });
    assertNoUnexpectedKeys(payload, ["chat_id", "message", "context_type", "context_id", "ui_mode", "route_path", "route_search", "stream"]);

    const contextType = optionalEnum(payload.context_type, "context_type", ASSISTANT_CONTEXT_TYPES) || (appUser.active_context === "company" ? "company" : "personal");
    const contextId = requiredText(payload.context_id, { field: "context_id", minLength: 1, maxLength: 80, collapseWhitespace: true });
    const chatId = optionalText(payload.chat_id, { field: "chat_id", maxLength: 80, collapseWhitespace: true });
    const uiMode = optionalEnum(payload.ui_mode, "ui_mode", ASSISTANT_UI_MODES) || "normal";
    const routePath = optionalText(payload.route_path, { field: "route_path", maxLength: 260, collapseWhitespace: true }) || "";
    const routeSearch = optionalText(payload.route_search, { field: "route_search", maxLength: 260, collapseWhitespace: false }) || "";
    const userMessage = requiredText(payload.message, { field: "message", minLength: 1, maxLength: 4000, multiline: true, collapseWhitespace: true });
    const shouldStream = optionalBoolean(payload.stream, "stream") !== false;
    const assistantChatScope = deriveAssistantChatScope(appUser);

    await assertAssistantContextAccess(appUser, userClient, contextType, contextId);

    const rateLimitedResponse = await enforceRateLimit({
      scope: "chat-agent:user",
      identifier: await sha256Hex(`${appUser.id}:${assistantChatScope.type}:${assistantChatScope.id}`),
      windowSeconds: 300,
      maxRequests: 25,
      message: "Too many assistant requests. Please try again in a moment.",
      corsHeaders,
    });

    if (rateLimitedResponse) {
      return rateLimitedResponse;
    }

    if (!shouldStream) {
      const result = await runAssistantFlow({
        appUser,
        userClient,
        chatId,
        contextType,
        contextId,
        chatScopeType: assistantChatScope.type,
        chatScopeId: assistantChatScope.id,
        uiMode,
        routePath,
        routeSearch,
        userMessage,
      });
      return jsonResponse(result);
    }

    return createStreamingResponse(async (sendEvent) => {
      const result = await runAssistantFlow({
        appUser,
        userClient,
        chatId,
        contextType,
        contextId,
        chatScopeType: assistantChatScope.type,
        chatScopeId: assistantChatScope.id,
        uiMode,
        routePath,
        routeSearch,
        userMessage,
        sendEvent,
      });

      sendEvent("done", {
        chat_id: result.chat.id,
        user_message_id: result.userMessage.id,
        assistant_message_id: result.assistantMessage.id,
        content: result.assistantMessage.content,
        tool_calls: result.assistantMessage.tool_calls,
      });
    });
  } catch (error) {
    console.error("chat-agent error:", error);
    const publicError = getPublicAssistantError(error);
    return jsonResponse({ error: publicError.message, code: publicError.code }, publicError.status);
  }
});

async function runAssistantFlow({ appUser, userClient, chatId, contextType, contextId, chatScopeType, chatScopeId, uiMode, routePath = "", routeSearch = "", userMessage, sendEvent = null }) {
  const chat = await getOrCreateChat({ appUser, dbClient: userClient, chatId, contextType: chatScopeType, contextId: chatScopeId, userMessage });
  const historyMessages = await loadRecentHistory(userClient, chat.id);

  const { data: insertedUserMessage, error: userMessageError } = await userClient
    .from("ai_messages")
    .insert({
      chat_id: chat.id,
      user_id: appUser.id,
      context_type: chatScopeType,
      context_id: chatScopeId,
      role: "user",
      content: userMessage,
      status: "completed",
      metadata: {
        source: "chat-agent",
        assistant_focus_context_type: contextType,
        assistant_focus_context_id: contextId,
        ui_mode: uiMode,
        route_path: routePath,
        route_search: routeSearch,
      },
      created_by: appUser.email,
    })
    .select("*")
    .single();

  if (userMessageError) throw userMessageError;

  sendEvent?.("meta", {
    chat_id: chat.id,
    user_message_id: insertedUserMessage.id,
  });

  const reply = await buildAssistantReply({
    appUser,
    dbClient: userClient,
    contextType,
    contextId,
    uiMode,
    routePath,
    routeSearch,
    userMessage,
    historyMessages,
  });

  for (const toolCall of reply.toolCalls || []) {
    sendEvent?.("tool", toolCall);
  }

  for (const chunk of chunkText(reply.content, 120)) {
    sendEvent?.("delta", { content: chunk });
  }

  const { data: assistantMessage, error: assistantMessageError } = await userClient
    .from("ai_messages")
    .insert({
      chat_id: chat.id,
      user_id: appUser.id,
      context_type: chatScopeType,
      context_id: chatScopeId,
      role: "assistant",
      content: reply.content,
      status: "completed",
      tool_calls: reply.toolCalls || [],
      metadata: {
        rag_matches_count: Array.isArray(reply.ragMatches) ? reply.ragMatches.length : 0,
        assistant_focus_context_type: contextType,
        assistant_focus_context_id: contextId,
        ui_mode: uiMode,
        route_path: routePath,
        route_search: routeSearch,
      },
      created_by: appUser.email,
    })
    .select("*")
    .single();

  if (assistantMessageError) throw assistantMessageError;

  return {
    chat,
    userMessage: insertedUserMessage,
    assistantMessage,
  };
}

async function getOrCreateChat({ appUser, dbClient, chatId, contextType, contextId, userMessage }) {
  if (chatId) {
    const { data, error } = await dbClient
      .from("ai_chats")
      .select("*")
      .eq("id", chatId)
      .eq("user_id", appUser.id)
      .eq("context_type", contextType)
      .eq("context_id", contextId)
      .maybeSingle();

    if (error) throw error;
    if (data?.id) {
      return data;
    }
  }

  const title = userMessage.replace(/\s+/g, " ").trim().slice(0, 80);
  const { data, error } = await dbClient
    .from("ai_chats")
    .insert({
      user_id: appUser.id,
      context_type: contextType,
      context_id: contextId,
      title,
      created_by: appUser.email,
    })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

async function loadRecentHistory(dbClient, chatId) {
  const { data, error } = await dbClient
    .from("ai_messages")
    .select("role,content,tool_calls,created_date")
    .eq("chat_id", chatId)
    .order("created_date", { ascending: true })
    .limit(12);

  if (error) throw error;
  return data || [];
}

function createStreamingResponse(run) {
  return new Response(new ReadableStream({
    async start(controller) {
      const sendEvent = (eventName, payload) => {
        controller.enqueue(encoder.encode(`event: ${eventName}\ndata: ${JSON.stringify(payload)}\n\n`));
      };

      try {
        await run(sendEvent);
      } catch (error) {
        console.error("chat-agent stream error:", error);
        const publicError = getPublicAssistantError(error);
        sendEvent("error", {
          message: publicError.message,
          code: publicError.code,
          retryable: publicError.retryable,
        });
      } finally {
        controller.close();
      }
    },
  }), {
    headers: {
      ...corsHeaders,
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

function getPublicAssistantError(error) {
  const rawMessage = error instanceof Error ? error.message : String(error);
  const normalizedMessage = String(rawMessage || "").trim();
  const normalizedStatus = getErrorStatus(error, 500);

  if (isTemporaryProviderError(normalizedMessage, normalizedStatus)) {
    return {
      status: 503,
      code: "assistant_temporarily_unavailable",
      retryable: true,
      message: "L'assistente non e disponibile in questo momento. Riprova piu tardi.",
    };
  }

  return {
    status: normalizedStatus,
    code: null,
    retryable: normalizedStatus >= 500,
    message: normalizedMessage || "Si e verificato un errore imprevisto.",
  };
}

function isTemporaryProviderError(message, status) {
  const normalizedMessage = String(message || "").trim();
  if (!normalizedMessage) {
    return false;
  }

  if (TEMPORARY_PROVIDER_ERROR_PATTERNS.some((pattern) => pattern.test(normalizedMessage))) {
    return true;
  }

  return (/gemini|openai|model/i.test(normalizedMessage) && (status === 429 || status >= 500));
}

function chunkText(text, size = 120) {
  const normalizedText = String(text || "");
  if (!normalizedText) {
    return [];
  }

  const chunks = [];
  for (let index = 0; index < normalizedText.length; index += size) {
    chunks.push(normalizedText.slice(index, index + size));
  }
  return chunks;
}