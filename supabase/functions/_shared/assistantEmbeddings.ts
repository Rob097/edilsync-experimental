// @ts-nocheck
import { adminClient } from "./supabase.ts";

export const ASSISTANT_EMBEDDING_DIMENSIONS = 3072;

const SUPPORTED_CONTEXT_TYPES = new Set(["personal", "company", "project"]);
const MANAGED_SOURCE_TYPES = [
  "project_document",
  "document_comment",
  "progress_statement_note",
  "work_session_note",
];

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const OPENAI_BASE_URL = (Deno.env.get("OPENAI_BASE_URL") || "https://api.openai.com/v1").replace(/\/$/, "");
const OPENAI_EMBEDDING_MODEL = Deno.env.get("OPENAI_EMBEDDING_MODEL") || "text-embedding-3-large";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const GEMINI_BASE_URL = (Deno.env.get("GEMINI_BASE_URL") || "https://generativelanguage.googleapis.com/v1beta").replace(/\/$/, "");
const GEMINI_EMBEDDING_MODEL = Deno.env.get("GEMINI_EMBEDDING_MODEL") || "gemini-embedding-001";

const MODEL_PROVIDER = GEMINI_API_KEY
  ? "gemini"
  : OPENAI_API_KEY
    ? "openai"
    : "none";

export async function createAssistantEmbedding(text, { purpose = "query" } = {}) {
  const normalizedText = compactText([text]);
  if (!normalizedText) {
    return null;
  }

  if (MODEL_PROVIDER === "none") {
    return null;
  }

  if (MODEL_PROVIDER === "gemini") {
    return createGeminiEmbedding(normalizedText, purpose);
  }

  return createOpenAiEmbedding(normalizedText);
}

export async function syncAssistantContextEmbeddings({
  dbClient = null,
  contextType,
  contextId,
  createdBy = "assistant-sync",
  force = false,
  maxAgeMinutes = 10,
  pruneMissing = false,
} = {}) {
  const normalizedContextType = normalizeContextType(contextType);
  const normalizedContextId = normalizeContextId(contextId);
  const sourceClient = dbClient || adminClient;

  if (!normalizedContextType || !normalizedContextId) {
    return {
      success: false,
      skipped: true,
      reason: "missing_context",
    };
  }

  if (MODEL_PROVIDER === "none") {
    return {
      success: false,
      skipped: true,
      reason: "provider_unavailable",
    };
  }

  const effectiveMaxAgeMinutes = clampInteger(maxAgeMinutes, 10, 0, 1440);
  const existingState = await getSyncState(normalizedContextType, normalizedContextId);
  if (!dbClient && !force && isSyncStateFresh(existingState?.last_completed_at, effectiveMaxAgeMinutes)) {
    return {
      success: true,
      skipped: true,
      reason: "fresh",
      context_type: normalizedContextType,
      context_id: normalizedContextId,
      last_completed_at: existingState.last_completed_at,
      stats: existingState.last_run_stats || {},
    };
  }

  const startedAt = new Date().toISOString();
  await upsertSyncState({
    contextType: normalizedContextType,
    contextId: normalizedContextId,
    createdBy,
    lastStartedAt: startedAt,
    lastCompletedAt: existingState?.last_completed_at || null,
    lastError: null,
    lastRunStats: {
      status: "running",
      started_at: startedAt,
    },
  });

  try {
    const sourceEntries = await loadContextSourceEntries(sourceClient, normalizedContextType, normalizedContextId);
    const existingEmbeddings = await loadExistingEmbeddings(normalizedContextType, normalizedContextId);
    const existingByKey = new Map(existingEmbeddings.map((row) => [buildSourceKey(row.source_type, row.source_id), row]));
    const activeKeys = new Set();

    let processedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    for (const entry of sourceEntries) {
      const contentHash = await sha256Hex(entry.content);
      const sourceKey = buildSourceKey(entry.sourceType, entry.sourceId);
      activeKeys.add(sourceKey);
      processedCount += 1;

      const existingEntry = existingByKey.get(sourceKey);
      if (existingEntry?.content_hash && existingEntry.content_hash === contentHash) {
        skippedCount += 1;
        continue;
      }

      const embedding = await createAssistantEmbedding(entry.content, { purpose: "document" });
      if (!Array.isArray(embedding) || embedding.length === 0) {
        skippedCount += 1;
        continue;
      }

      const { error: upsertError } = await adminClient.rpc("upsert_assistant_embedding", {
        p_context_type: normalizedContextType,
        p_context_id: normalizedContextId,
        p_source_type: entry.sourceType,
        p_source_id: entry.sourceId,
        p_title: entry.title,
        p_content: entry.content,
        p_content_hash: contentHash,
        p_metadata: entry.metadata,
        p_embedding: embedding,
        p_created_by: createdBy,
      });

      if (upsertError) throw upsertError;
      updatedCount += 1;
    }

    let deletedCount = 0;
    // Shared context indexes cannot infer global absence from a user-scoped sync.
    // Missing rows are only pruned during explicit privileged maintenance runs.
    if (pruneMissing && sourceClient === adminClient) {
      for (const existingEntry of existingEmbeddings) {
        const sourceKey = buildSourceKey(existingEntry.source_type, existingEntry.source_id);
        if (activeKeys.has(sourceKey)) {
          continue;
        }

        const { error: deleteError } = await adminClient
          .from("embeddings")
          .delete()
          .eq("id", existingEntry.id);

        if (deleteError) throw deleteError;
        deletedCount += 1;
      }
    }

    const completedAt = new Date().toISOString();
    const lastRunStats = {
      status: "completed",
      started_at: startedAt,
      completed_at: completedAt,
      processed_count: processedCount,
      updated_count: updatedCount,
      skipped_count: skippedCount,
      deleted_count: deletedCount,
    };

    await upsertSyncState({
      contextType: normalizedContextType,
      contextId: normalizedContextId,
      createdBy,
      lastStartedAt: startedAt,
      lastCompletedAt: completedAt,
      lastError: null,
      lastRunStats,
    });

    return {
      success: true,
      context_type: normalizedContextType,
      context_id: normalizedContextId,
      skipped: false,
      stats: lastRunStats,
    };
  } catch (error) {
    const failedAt = new Date().toISOString();
    const errorMessage = error instanceof Error ? error.message : String(error);

    await upsertSyncState({
      contextType: normalizedContextType,
      contextId: normalizedContextId,
      createdBy,
      lastStartedAt: startedAt,
      lastCompletedAt: existingState?.last_completed_at || null,
      lastError: errorMessage,
      lastRunStats: {
        status: "failed",
        started_at: startedAt,
        failed_at: failedAt,
        error: errorMessage,
      },
    });

    throw error;
  }
}

export async function searchContextEmbeddings({
  dbClient,
  contextType,
  contextId,
  query,
  limit = 5,
  minSimilarity = 0.35,
} = {}) {
  const normalizedContextType = normalizeContextType(contextType);
  const normalizedContextId = normalizeContextId(contextId);
  const normalizedQuery = compactText([query]);

  if (!dbClient) {
    throw new Error("Authenticated assistant database client is required");
  }

  if (!normalizedContextType || !normalizedContextId || !normalizedQuery || MODEL_PROVIDER === "none") {
    return [];
  }

  const queryEmbedding = await createAssistantEmbedding(normalizedQuery, { purpose: "query" });
  if (!Array.isArray(queryEmbedding) || queryEmbedding.length === 0) {
    return [];
  }

  const matchLimit = clampInteger(limit, 5, 1, 10);
  const threshold = Math.min(Math.max(Number(minSimilarity) || 0, 0), 1);
  const { data, error } = await dbClient.rpc("match_context_embeddings", {
    query_embedding: queryEmbedding,
    p_context_type: normalizedContextType,
    p_context_id: normalizedContextId,
    p_match_count: matchLimit,
  });

  if (error) throw error;

  return (data || [])
    .map((row) => ({
      ...row,
      similarity: Number(row?.similarity || 0),
    }))
    .filter((row) => Number.isFinite(row.similarity) && row.similarity >= threshold)
    .slice(0, matchLimit);
}

async function createOpenAiEmbedding(text) {
  const response = await fetch(`${OPENAI_BASE_URL}/embeddings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_EMBEDDING_MODEL,
      input: text,
      ...(OPENAI_EMBEDDING_MODEL.startsWith("text-embedding-3") ? { dimensions: ASSISTANT_EMBEDDING_DIMENSIONS } : {}),
    }),
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(payload?.error?.message || payload?.message || "OpenAI embedding request failed");
  }

  return normalizeEmbedding(payload?.data?.[0]?.embedding || null, "OpenAI");
}

async function createGeminiEmbedding(text, purpose = "query") {
  const isEmbeddingV2 = GEMINI_EMBEDDING_MODEL.includes("embedding-2");
  const response = await fetch(
    `${GEMINI_BASE_URL}/models/${encodeURIComponent(GEMINI_EMBEDDING_MODEL)}:embedContent?key=${encodeURIComponent(GEMINI_API_KEY)}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content: {
          parts: [{ text }],
        },
        ...(isEmbeddingV2 ? {} : { taskType: purpose === "document" ? "RETRIEVAL_DOCUMENT" : "RETRIEVAL_QUERY" }),
        outputDimensionality: ASSISTANT_EMBEDDING_DIMENSIONS,
      }),
    },
  );

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(payload?.error?.message || payload?.message || "Gemini embedContent failed");
  }

  const values = payload?.embedding?.values || payload?.embeddings?.[0]?.values || null;
  return normalizeEmbedding(values, "Gemini");
}

async function loadContextSourceEntries(sourceClient, contextType, contextId) {
  switch (contextType) {
    case "project":
      return loadProjectContextSourceEntries(sourceClient, contextId);
    case "company":
      return loadCompanyContextSourceEntries(sourceClient, contextId);
    default:
      return [];
  }
}

async function loadProjectContextSourceEntries(sourceClient, projectId) {
  const [documentsResult, commentsResult, progressStatementsResult, workSessionsResult] = await Promise.all([
    sourceClient
      .from("project_documents")
      .select("id,project_id,company_id,name,description,category,document_status,discipline,work_area,project_phase,document_tags,revision_number,is_current_revision,updated_date,created_date")
      .eq("project_id", projectId),
    sourceClient
      .from("document_comments")
      .select("id,document_id,project_id,company_id,comment,author_name,updated_date,created_date")
      .eq("project_id", projectId),
    sourceClient
      .from("progress_statements")
      .select("id,project_id,sequence_number,statement_date,status,notes,updated_date,created_date")
      .eq("project_id", projectId)
      .not("notes", "is", null),
    sourceClient
      .from("work_sessions")
      .select("id,company_id,project_id,user_email,note,started_at,ended_at,updated_date,created_date")
      .eq("project_id", projectId)
      .not("note", "is", null),
  ]);

  if (documentsResult.error) throw documentsResult.error;
  if (commentsResult.error) throw commentsResult.error;
  if (progressStatementsResult.error) throw progressStatementsResult.error;
  if (workSessionsResult.error) throw workSessionsResult.error;

  const documents = documentsResult.data || [];
  const documentNameById = new Map(documents.map((document) => [document.id, document.name]));

  return [
    ...documents.map((document) => buildProjectDocumentEntry(document, projectId, "project")),
    ...(commentsResult.data || []).map((comment) => buildDocumentCommentEntry(comment, projectId, "project", documentNameById.get(comment.document_id))),
    ...(progressStatementsResult.data || []).map((statement) => buildProgressStatementEntry(statement, projectId)),
    ...(workSessionsResult.data || []).map((session) => buildWorkSessionEntry(session, projectId, "project")),
  ].filter(Boolean);
}

async function loadCompanyContextSourceEntries(sourceClient, companyId) {
  const [documentsResult, commentsResult, workSessionsResult] = await Promise.all([
    sourceClient
      .from("project_documents")
      .select("id,project_id,company_id,name,description,category,document_status,discipline,work_area,project_phase,document_tags,revision_number,is_current_revision,updated_date,created_date")
      .eq("company_id", companyId),
    sourceClient
      .from("document_comments")
      .select("id,document_id,project_id,company_id,comment,author_name,updated_date,created_date")
      .eq("company_id", companyId),
    sourceClient
      .from("work_sessions")
      .select("id,company_id,project_id,user_email,note,started_at,ended_at,updated_date,created_date")
      .eq("company_id", companyId)
      .not("note", "is", null),
  ]);

  if (documentsResult.error) throw documentsResult.error;
  if (commentsResult.error) throw commentsResult.error;
  if (workSessionsResult.error) throw workSessionsResult.error;

  const documents = documentsResult.data || [];
  const documentNameById = new Map(documents.map((document) => [document.id, document.name]));

  return [
    ...documents.map((document) => buildProjectDocumentEntry(document, companyId, "company")),
    ...(commentsResult.data || []).map((comment) => buildDocumentCommentEntry(comment, companyId, "company", documentNameById.get(comment.document_id))),
    ...(workSessionsResult.data || []).map((session) => buildWorkSessionEntry(session, companyId, "company")),
  ].filter(Boolean);
}

function buildProjectDocumentEntry(document, contextId, contextType) {
  const content = compactText([
    `Documento: ${document.name || "Senza nome"}`,
    document.description ? `Descrizione: ${document.description}` : null,
    document.category ? `Categoria: ${document.category}` : null,
    document.document_status ? `Stato documento: ${document.document_status}` : null,
    document.discipline ? `Disciplina: ${document.discipline}` : null,
    document.work_area ? `Area lavoro: ${document.work_area}` : null,
    document.project_phase ? `Fase progetto: ${document.project_phase}` : null,
    Number.isFinite(Number(document.revision_number)) ? `Revisione: ${document.revision_number}` : null,
    document.is_current_revision === true ? "Revisione corrente" : null,
    Array.isArray(document.document_tags) && document.document_tags.length > 0
      ? `Tag: ${document.document_tags.join(", ")}`
      : null,
  ]);

  return createSourceEntry({
    contextType,
    contextId,
    sourceType: "project_document",
    sourceId: document.id,
    title: document.name || "Documento",
    content,
    metadata: {
      category: document.category || null,
      document_status: document.document_status || null,
      project_id: document.project_id || null,
      company_id: document.company_id || null,
      source_updated_at: document.updated_date || document.created_date || null,
      path: contextType === "project"
        ? buildProjectDocumentsPath(contextId)
        : `${buildCompanyPath(contextId)}&tab=info&section=documents`,
    },
  });
}

function buildDocumentCommentEntry(comment, contextId, contextType, documentName) {
  const content = compactText([
    documentName ? `Documento: ${documentName}` : null,
    comment.author_name ? `Autore: ${comment.author_name}` : null,
    `Commento: ${comment.comment || ""}`,
  ]);

  return createSourceEntry({
    contextType,
    contextId,
    sourceType: "document_comment",
    sourceId: comment.id,
    title: documentName || "Commento documento",
    content,
    metadata: {
      document_id: comment.document_id || null,
      project_id: comment.project_id || null,
      company_id: comment.company_id || null,
      source_updated_at: comment.updated_date || comment.created_date || null,
      path: contextType === "project"
        ? buildProjectDocumentsPath(contextId)
        : `${buildCompanyPath(contextId)}&tab=info&section=documents`,
    },
  });
}

function buildProgressStatementEntry(statement, projectId) {
  const content = compactText([
    `SAL #${statement.sequence_number || "?"}`,
    statement.statement_date ? `Data: ${statement.statement_date}` : null,
    statement.status ? `Stato: ${statement.status}` : null,
    statement.notes ? `Note: ${statement.notes}` : null,
  ]);

  return createSourceEntry({
    contextType: "project",
    contextId: projectId,
    sourceType: "progress_statement_note",
    sourceId: statement.id,
    title: `SAL #${statement.sequence_number || "?"}`,
    content,
    metadata: {
      project_id: statement.project_id || null,
      statement_date: statement.statement_date || null,
      status: statement.status || null,
      source_updated_at: statement.updated_date || statement.created_date || null,
      path: `${buildProjectPath(projectId)}&tab=economia&section=progress`,
    },
  });
}

function buildWorkSessionEntry(session, contextId, contextType) {
  const content = compactText([
    session.user_email ? `Operatore: ${session.user_email}` : null,
    session.started_at ? `Inizio: ${session.started_at}` : null,
    session.ended_at ? `Fine: ${session.ended_at}` : null,
    session.note ? `Nota: ${session.note}` : null,
  ]);

  return createSourceEntry({
    contextType,
    contextId,
    sourceType: "work_session_note",
    sourceId: session.id,
    title: session.user_email || "Nota operativa",
    content,
    metadata: {
      company_id: session.company_id || null,
      project_id: session.project_id || null,
      started_at: session.started_at || null,
      ended_at: session.ended_at || null,
      source_updated_at: session.updated_date || session.created_date || null,
      path: contextType === "project"
        ? `${buildProjectPath(contextId)}&tab=operativita&section=time`
        : `${buildCompanyPath(contextId)}&tab=operativita&section=all`,
    },
  });
}

function createSourceEntry({ contextType, contextId, sourceType, sourceId, title, content, metadata }) {
  const normalizedContent = compactText([content]);
  if (!normalizedContent || !sourceId) {
    return null;
  }

  return {
    contextType,
    contextId,
    sourceType,
    sourceId: String(sourceId),
    title: title || sourceType,
    content: normalizedContent,
    metadata: metadata || {},
  };
}

async function loadExistingEmbeddings(contextType, contextId) {
  const { data, error } = await adminClient
    .from("embeddings")
    .select("id,source_type,source_id,content_hash")
    .eq("context_type", contextType)
    .eq("context_id", contextId)
    .in("source_type", MANAGED_SOURCE_TYPES);

  if (error) throw error;
  return data || [];
}

async function getSyncState(contextType, contextId) {
  const { data, error } = await adminClient
    .from("ai_embedding_sync_state")
    .select("last_completed_at,last_run_stats")
    .eq("context_type", contextType)
    .eq("context_id", contextId)
    .maybeSingle();

  if (error) throw error;
  return data || null;
}

async function upsertSyncState({
  contextType,
  contextId,
  createdBy,
  lastStartedAt,
  lastCompletedAt,
  lastError,
  lastRunStats,
}) {
  const { error } = await adminClient
    .from("ai_embedding_sync_state")
    .upsert({
      context_type: contextType,
      context_id: contextId,
      created_by: createdBy,
      last_started_at: lastStartedAt,
      last_completed_at: lastCompletedAt,
      last_error: lastError,
      last_run_stats: lastRunStats || {},
    }, {
      onConflict: "context_type,context_id",
    });

  if (error) throw error;
}

function normalizeContextType(contextType) {
  const normalized = String(contextType || "").trim().toLowerCase();
  return SUPPORTED_CONTEXT_TYPES.has(normalized) ? normalized : null;
}

function normalizeContextId(contextId) {
  const normalized = String(contextId || "").trim();
  return normalized || null;
}

function isSyncStateFresh(lastCompletedAt, maxAgeMinutes) {
  if (!lastCompletedAt || maxAgeMinutes <= 0) {
    return false;
  }

  const completedAtMs = new Date(lastCompletedAt).getTime();
  if (!Number.isFinite(completedAtMs)) {
    return false;
  }

  return (Date.now() - completedAtMs) < (maxAgeMinutes * 60 * 1000);
}

function buildSourceKey(sourceType, sourceId) {
  return `${sourceType}:${sourceId}`;
}

async function sha256Hex(input) {
  const data = new TextEncoder().encode(String(input || ""));
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
}

function compactText(parts) {
  return parts
    .map((part) => String(part || "").replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join("\n")
    .trim();
}

function clampInteger(value, fallback, min, max) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }

  return Math.min(Math.max(Math.trunc(numeric), min), max);
}

function normalizeEmbedding(values, providerName) {
  if (!Array.isArray(values) || values.length === 0) {
    return null;
  }

  if (values.length !== ASSISTANT_EMBEDDING_DIMENSIONS) {
    throw new Error(`${providerName} embedding dimensions mismatch: expected ${ASSISTANT_EMBEDDING_DIMENSIONS}, received ${values.length}`);
  }

  return normalizeVector(values);
}

function normalizeVector(values) {
  const numericValues = values.map((value) => Number(value));
  const magnitude = Math.sqrt(numericValues.reduce((sum, value) => sum + (value * value), 0));
  if (!Number.isFinite(magnitude) || magnitude <= 0) {
    return numericValues;
  }

  return numericValues.map((value) => value / magnitude);
}

function buildProjectPath(projectId) {
  return `/app/ProjectDetail?id=${encodeURIComponent(projectId)}`;
}

function buildProjectDocumentsPath(projectId) {
  return `/app/ProjectDetail?id=${encodeURIComponent(projectId)}&tab=info&section=documents`;
}

function buildCompanyPath(companyId) {
  return `/app/CompanyDetail?id=${encodeURIComponent(companyId)}`;
}