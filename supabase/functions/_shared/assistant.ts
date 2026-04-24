// @ts-nocheck
import { InputValidationError } from "./input.ts";
import { searchContextEmbeddings, syncAssistantContextEmbeddings } from "./assistantEmbeddings.ts";
import { ASSISTANT_PROMPT_PROFILE_LINES } from "./assistantPromptProfile.ts";

export const ASSISTANT_CONTEXT_TYPES = ["personal", "company", "project"];
export const ASSISTANT_UI_MODES = ["normal", "operational"];

const PERSONAL_CONTEXT_CAPABILITIES = [
  {
    capability_key: "personal_workspace",
    name: "Workspace personale",
    description: "Dashboard personale, cantieri accessibili e riepilogo del contesto privato.",
    sort_order: 10,
  },
  {
    capability_key: "personal_notifications",
    name: "Notifiche personali",
    description: "Notifiche, follow-up e aggiornamenti personali accessibili all'utente.",
    sort_order: 20,
  },
  {
    capability_key: "personal_memberships",
    name: "Membership e inviti",
    description: "Societa, inviti e partecipazioni che l'utente puo leggere nel proprio contesto.",
    sort_order: 30,
  },
  {
    capability_key: "personal_calendar",
    name: "Calendario personale",
    description: "Eventi e scadenze accessibili nel contesto personale.",
    sort_order: 40,
  },
];

const FEATURE_ALIAS_RULES = [
  { featureKey: "project_finance", pattern: /finanz|budget|costo|costi|econom|sal|consuntiv|forecast/i },
  { featureKey: "project_milestones", pattern: /milestone|mileston|fasi|fase target|fase progetto/i },
  { featureKey: "project_chat", pattern: /chat|messagg|canal/i, contextTypes: ["project"] },
  { featureKey: "company_chat", pattern: /chat|messagg|canal/i, contextTypes: ["company"] },
  { featureKey: "project_documents", pattern: /document|elaborat|allegat|bim|ifc|revision/i, contextTypes: ["project"] },
  { featureKey: "company_documents", pattern: /document|allegat|archivi/i, contextTypes: ["company"] },
  { featureKey: "project_tasks", pattern: /task|attivit|todo|to-do|assegnat|blocked|blocc/i },
  { featureKey: "project_change_requests", pattern: /variant|change request|modific/i },
  { featureKey: "project_disputes", pattern: /disput|contestaz/i },
  { featureKey: "project_calendar", pattern: /calendar|agenda|event|riunion|appuntament/i },
  { featureKey: "project_participants", pattern: /partecip|invit|team|membri/i, contextTypes: ["project"] },
  { featureKey: "company_members", pattern: /membri|dipendent|organico|team/i, contextTypes: ["company"] },
  { featureKey: "company_time_tracking", pattern: /timbr|presenz|ore lavor|time tracking|clock/i },
  { featureKey: "company_billing", pattern: /billing|abbonament|fatturaz|checkout|portal/i },
  { featureKey: "project_operational_workspace", pattern: /operativ|workspace operativo/i, contextTypes: ["project"] },
  { featureKey: "company_operational_workspace", pattern: /operativ|workspace operativo/i, contextTypes: ["company"] },
  { featureKey: "project_sponsorship", pattern: /sponsor|sponsorizz/i },
  { featureKey: "project_creation", pattern: /crea(re)? cantiere|nuovo cantiere|creazione progetto/i },
  { featureKey: "company_management", pattern: /gestione societ|anagrafica societ|dati societ/i, contextTypes: ["company"] },
  { featureKey: "project_overview", pattern: /panoramic|overview|feed progetto|quadro progetto/i, contextTypes: ["project"] },
];

const FEATURE_NAVIGATION_HINTS = {
  company_management: { label: "Scheda societa", buildPath: (contextId) => buildCompanyPath(contextId) },
  company_members: { label: "Membri societa", buildPath: (contextId) => buildCompanyPath(contextId) },
  company_chat: { label: "Chat societa", buildPath: (contextId) => `${buildCompanyPath(contextId)}&tab=operativita&section=chat` },
  company_documents: { label: "Documenti societa", buildPath: (contextId) => buildCompanyDocumentsPath(contextId) },
  company_time_tracking: { label: "Timbrature societa", buildPath: (contextId) => `${buildCompanyPath(contextId)}&tab=operativita&section=all` },
  company_operational_workspace: { label: "Workspace operativo societa", buildPath: (contextId) => `${buildCompanyPath(contextId)}&tab=operativita` },
  company_billing: { label: "Billing societa", buildPath: (contextId) => `${buildCompanyPath(contextId)}&tab=billing` },
  project_creation: { label: "Creazione cantiere", buildPath: () => "/app/Dashboard" },
  project_sponsorship: { label: "Sponsorizzazione progetto", buildPath: (contextId) => buildProjectPath(contextId) },
  project_participants: { label: "Partecipanti progetto", buildPath: (contextId) => buildProjectPath(contextId) },
  project_overview: { label: "Panoramica progetto", buildPath: (contextId) => buildProjectPath(contextId) },
  project_tasks: { label: "Task progetto", buildPath: (contextId) => buildProjectTasksPath(contextId) },
  project_milestones: { label: "Milestone", buildPath: (contextId) => `${buildProjectPath(contextId)}&tab=lavori&section=milestones` },
  project_change_requests: { label: "Varianti", buildPath: (contextId) => `${buildProjectPath(contextId)}&tab=lavori&section=changes` },
  project_disputes: { label: "Dispute", buildPath: (contextId) => `${buildProjectPath(contextId)}&tab=lavori&section=disputes` },
  project_calendar: { label: "Calendario", buildPath: () => "/app/Calendar" },
  project_chat: { label: "Chat progetto", buildPath: (contextId) => `${buildProjectPath(contextId)}&tab=info&section=chat` },
  project_documents: { label: "Documenti progetto", buildPath: (contextId) => buildProjectDocumentsPath(contextId) },
  project_finance: { label: "Economia di commessa", buildPath: (contextId) => `${buildProjectPath(contextId)}&tab=economia` },
  project_operational_workspace: { label: "Workspace operativo progetto", buildPath: (contextId) => `/app/operativa/progetto/${encodeURIComponent(contextId)}` },
};

const NAVIGATION_HELP_TOPICS = [
  {
    topic_key: "dashboard",
    label: "Dashboard",
    description: "Panoramica iniziale con il quadro generale dei cantieri e del lavoro personale.",
    pattern: /dashboard|home|inizio|panoramica generale/i,
    buildPath: () => "/app/Dashboard",
  },
  {
    topic_key: "projects",
    label: "Elenco cantieri",
    description: "Lista dei cantieri accessibili dall'utente nel contesto corrente.",
    pattern: /cantier|progett|worksite/i,
    buildPath: () => "/app/Projects",
  },
  {
    topic_key: "companies",
    label: "Elenco societa",
    description: "Anagrafica societa e accesso alle relative schede operative.",
    pattern: /societ|impres|aziend|companies/i,
    buildPath: () => "/app/Companies",
  },
  {
    topic_key: "calendar",
    label: "Calendario",
    description: "Agenda eventi, riunioni e appuntamenti con i filtri di contesto.",
    pattern: /calendar|calend|agenda|event|riunion|appuntament/i,
    buildPath: () => "/app/Calendar",
  },
  {
    topic_key: "notifications",
    label: "Notifiche",
    description: "Storico notifiche, inviti e avvisi da leggere o filtrare.",
    pattern: /notific|alert|avvis/i,
    buildPath: () => "/app/Notifications",
  },
  {
    topic_key: "settings",
    label: "Impostazioni",
    description: "Profilo utente, preferenze e configurazioni dell'account.",
    pattern: /impostaz|profil|settings/i,
    buildPath: () => "/app/Settings",
  },
];

export const ASSISTANT_TOOL_DEFINITIONS = [
  {
    type: "function",
    function: {
      name: "get_current_context_state",
      description: "Explain the current assistant context, active role, current route and UI mode.",
      parameters: {
        type: "object",
        properties: {},
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_context_capabilities",
      description: "List the effective capabilities, enabled limits and blocked features for the current assistant context.",
      parameters: {
        type: "object",
        properties: {},
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "explain_feature_availability",
      description: "Explain why a feature is available, limited or blocked in the current assistant context.",
      parameters: {
        type: "object",
        properties: {
          feature_key: {
            type: "string",
          },
          feature_hint: {
            type: "string",
          },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_context_entities",
      description: "Search projects, tasks, documents, participants, memberships and events inside the current assistant context.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
          },
          limit: {
            type: "integer",
            minimum: 1,
            maximum: 15,
          },
          entity_types: {
            type: "array",
            items: {
              type: "string",
            },
          },
        },
        required: ["query"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_navigation_help",
      description: "Explain where the user should go in EdilSync to reach a page, feature or workflow from the current context.",
      parameters: {
        type: "object",
        properties: {
          topic: {
            type: "string",
          },
          feature_key: {
            type: "string",
          },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_pending_invites",
      description: "List open project, company or event invites still awaiting action in the current assistant context.",
      parameters: {
        type: "object",
        properties: {
          limit: {
            type: "integer",
            minimum: 1,
            maximum: 15,
          },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_my_memberships",
      description: "List the companies, project roles and memberships that belong to the current user.",
      parameters: {
        type: "object",
        properties: {},
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_pending_decisions",
      description: "List pending approvals, invite responses and operational decisions that need attention in the current assistant context.",
      parameters: {
        type: "object",
        properties: {
          limit: {
            type: "integer",
            minimum: 1,
            maximum: 15,
          },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_today_deadlines",
      description: "List the task deadlines and in-progress work relevant for today in the current assistant context.",
      parameters: {
        type: "object",
        properties: {
          limit: {
            type: "integer",
            minimum: 1,
            maximum: 10,
          },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_blocked_tasks",
      description: "List blocked tasks in the current assistant context with reason, blocker and immediate impact.",
      parameters: {
        type: "object",
        properties: {
          limit: {
            type: "integer",
            minimum: 1,
            maximum: 10,
          },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_task_detail",
      description: "Return the detailed state, assignment, block data and navigation for a specific accessible task.",
      parameters: {
        type: "object",
        properties: {
          task_id: {
            type: "string",
          },
          task_hint: {
            type: "string",
          },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_context_milestones",
      description: "List milestones relevant to the current assistant context with dates, status and linked task progress.",
      parameters: {
        type: "object",
        properties: {
          limit: {
            type: "integer",
            minimum: 1,
            maximum: 10,
          },
          status: {
            type: "string",
            enum: ["pending", "in_progress", "completed", "delayed"],
          },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_milestone_detail",
      description: "Return the detail of a specific accessible milestone, including dates, linked tasks and navigation.",
      parameters: {
        type: "object",
        properties: {
          milestone_id: {
            type: "string",
          },
          milestone_hint: {
            type: "string",
          },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_context_change_requests",
      description: "List change requests relevant to the current assistant context with status, impact and assignment.",
      parameters: {
        type: "object",
        properties: {
          limit: {
            type: "integer",
            minimum: 1,
            maximum: 10,
          },
          status: {
            type: "string",
            enum: ["pending", "approved", "rejected", "clarification_needed"],
          },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_change_request_detail",
      description: "Return the detail of a specific accessible change request, including assignment, impacts, response and navigation.",
      parameters: {
        type: "object",
        properties: {
          change_request_id: {
            type: "string",
          },
          change_request_hint: {
            type: "string",
          },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_context_disputes",
      description: "List disputes relevant to the current assistant context with status, category and claimed impact.",
      parameters: {
        type: "object",
        properties: {
          limit: {
            type: "integer",
            minimum: 1,
            maximum: 10,
          },
          status: {
            type: "string",
            enum: ["open", "awaiting_response", "in_review", "resolved", "closed_no_agreement", "escalated"],
          },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_dispute_detail",
      description: "Return the detail of a specific accessible dispute, including timeline, evidence, linked task or variation and navigation.",
      parameters: {
        type: "object",
        properties: {
          dispute_id: {
            type: "string",
          },
          dispute_hint: {
            type: "string",
          },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_event_detail",
      description: "Return the detail of a specific accessible event, including participants, conflicts, schedule and navigation.",
      parameters: {
        type: "object",
        properties: {
          event_id: {
            type: "string",
          },
          event_hint: {
            type: "string",
          },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_operational_day_brief",
      description: "Return a concise operational brief for today with deadlines, in-progress work, events and open disputes in the current context.",
      parameters: {
        type: "object",
        properties: {},
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_project_summary",
      description: "Summarize the current worksite when the active assistant context is a project.",
      parameters: {
        type: "object",
        properties: {},
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_accessible_projects",
      description: "List the worksites relevant to the current assistant context.",
      parameters: {
        type: "object",
        properties: {
          limit: {
            type: "integer",
            minimum: 1,
            maximum: 10,
          },
          include_completed: {
            type: "boolean",
          },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_context_tasks",
      description: "List the most relevant tasks for the current assistant context.",
      parameters: {
        type: "object",
        properties: {
          limit: {
            type: "integer",
            minimum: 1,
            maximum: 10,
          },
          status: {
            type: "string",
            enum: ["not_started", "in_progress", "completed", "blocked"],
          },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_context_schedule",
      description: "List upcoming events or agenda items relevant to the current assistant context.",
      parameters: {
        type: "object",
        properties: {
          limit: {
            type: "integer",
            minimum: 1,
            maximum: 10,
          },
          include_past: {
            type: "boolean",
          },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_context_participants",
        description: "List the participants or members relevant to the current assistant context, optionally narrowed to a referenced project.",
      parameters: {
        type: "object",
        properties: {
          limit: {
            type: "integer",
            minimum: 1,
            maximum: 20,
          },
            project_id: {
              type: "string",
            },
            project_hint: {
              type: "string",
            },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_context_notifications",
      description: "List the notifications most relevant to the current assistant context.",
      parameters: {
        type: "object",
        properties: {
          limit: {
            type: "integer",
            minimum: 1,
            maximum: 10,
          },
          unread_only: {
            type: "boolean",
          },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_context_channels",
      description: "List the channels visible in the current assistant context with unread state and last activity.",
      parameters: {
        type: "object",
        properties: {
          limit: {
            type: "integer",
            minimum: 1,
            maximum: 10,
          },
          unread_only: {
            type: "boolean",
          },
          channel_type: {
            type: "string",
            enum: ["general", "company", "direct", "custom"],
          },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_channel_detail",
      description: "Return the detail of a specific accessible channel, including membership, unread status, limits and last message.",
      parameters: {
        type: "object",
        properties: {
          channel_id: {
            type: "string",
          },
          channel_hint: {
            type: "string",
          },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_context_messages",
      description: "List the most relevant recent messages in the current assistant context, optionally filtered to unread or mentions.",
      parameters: {
        type: "object",
        properties: {
          limit: {
            type: "integer",
            minimum: 1,
            maximum: 10,
          },
          channel_id: {
            type: "string",
          },
          channel_hint: {
            type: "string",
          },
          unread_only: {
            type: "boolean",
          },
          mentioned_only: {
            type: "boolean",
          },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_message_detail",
      description: "Return the detail of a specific accessible message, including author, channel, mentions and linked artifacts.",
      parameters: {
        type: "object",
        properties: {
          message_id: {
            type: "string",
          },
          message_hint: {
            type: "string",
          },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_mentions_and_followups",
      description: "List mentions and unread follow-ups the current user should not miss in the current assistant context.",
      parameters: {
        type: "object",
        properties: {
          limit: {
            type: "integer",
            minimum: 1,
            maximum: 10,
          },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_notification_preferences",
      description: "Return the current notification and email delivery preferences configured for the current user.",
      parameters: {
        type: "object",
        properties: {},
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_context_documents",
      description: "List recent or relevant documents accessible in the current assistant context.",
      parameters: {
        type: "object",
        properties: {
          limit: {
            type: "integer",
            minimum: 1,
            maximum: 15,
          },
          status: {
            type: "string",
            enum: ["draft", "in_review", "approved", "rejected", "superseded", "archived"],
          },
          current_only: {
            type: "boolean",
          },
          include_archived: {
            type: "boolean",
          },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_context_documents",
      description: "Search accessible documents by name, tags, discipline, work area, phase or relevant text.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
          },
          limit: {
            type: "integer",
            minimum: 1,
            maximum: 10,
          },
        },
        required: ["query"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_document_detail",
      description: "Return document metadata, revision info, comments and workflow summary for a specific accessible document.",
      parameters: {
        type: "object",
        properties: {
          document_id: {
            type: "string",
          },
          document_hint: {
            type: "string",
          },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_document_revision_history",
      description: "Return the revision chain of an accessible document with current revision and superseded history.",
      parameters: {
        type: "object",
        properties: {
          document_id: {
            type: "string",
          },
          document_hint: {
            type: "string",
          },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_document_workflow_status",
      description: "Explain the current document status, approval ledger and workflow limitations for an accessible document.",
      parameters: {
        type: "object",
        properties: {
          document_id: {
            type: "string",
          },
          document_hint: {
            type: "string",
          },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_document_comments",
      description: "List comments with context for a specific accessible document.",
      parameters: {
        type: "object",
        properties: {
          document_id: {
            type: "string",
          },
          document_hint: {
            type: "string",
          },
          limit: {
            type: "integer",
            minimum: 1,
            maximum: 20,
          },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_document_approvals",
      description: "List open or historical approval records attached to a specific accessible document.",
      parameters: {
        type: "object",
        properties: {
          document_id: {
            type: "string",
          },
          document_hint: {
            type: "string",
          },
          limit: {
            type: "integer",
            minimum: 1,
            maximum: 20,
          },
          status: {
            type: "string",
            enum: ["pending", "approved", "rejected"],
          },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_document_revision_events",
      description: "List revision audit events for a specific accessible document.",
      parameters: {
        type: "object",
        properties: {
          document_id: {
            type: "string",
          },
          document_hint: {
            type: "string",
          },
          limit: {
            type: "integer",
            minimum: 1,
            maximum: 20,
          },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_recent_updates",
      description: "List the most recent updates inside the current assistant context.",
      parameters: {
        type: "object",
        properties: {
          limit: {
            type: "integer",
            minimum: 1,
            maximum: 10,
          },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_context_notes",
      description: "List context notes, annotations or work notes relevant to the current assistant context.",
      parameters: {
        type: "object",
        properties: {
          limit: {
            type: "integer",
            minimum: 1,
            maximum: 10,
          },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_context_finance_snapshot",
      description: "Return the financial snapshot for the current context, including planned budget, recorded costs, labor, forecast and SAL indicators.",
      parameters: {
        type: "object",
        properties: {
          project_id: {
            type: "string",
          },
          project_hint: {
            type: "string",
          },
          limit: {
            type: "integer",
            minimum: 1,
            maximum: 10,
          },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_budget_watchpoints",
      description: "List budget lines that look critical because they are over budget, at risk, or accumulating unplanned costs.",
      parameters: {
        type: "object",
        properties: {
          project_id: {
            type: "string",
          },
          project_hint: {
            type: "string",
          },
          limit: {
            type: "integer",
            minimum: 1,
            maximum: 12,
          },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_cost_entries",
      description: "List recent or filtered cost entries accessible in the current assistant context.",
      parameters: {
        type: "object",
        properties: {
          project_id: {
            type: "string",
          },
          project_hint: {
            type: "string",
          },
          cost_type: {
            type: "string",
            enum: ["labor", "materials", "equipment", "subcontract", "indirect", "extra", "adjustment"],
          },
          status: {
            type: "string",
            enum: ["recorded", "approved", "contested"],
          },
          limit: {
            type: "integer",
            minimum: 1,
            maximum: 20,
          },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_context_labor_rates",
      description: "List relevant labor rates for the current finance context, project or company scope.",
      parameters: {
        type: "object",
        properties: {
          project_id: {
            type: "string",
          },
          project_hint: {
            type: "string",
          },
          company_id: {
            type: "string",
          },
          company_hint: {
            type: "string",
          },
          limit: {
            type: "integer",
            minimum: 1,
            maximum: 20,
          },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_project_financial_settings",
      description: "Return currency, visibility, labor-cost method and SAL settings for a specific accessible project.",
      parameters: {
        type: "object",
        properties: {
          project_id: {
            type: "string",
          },
          project_hint: {
            type: "string",
          },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_progress_statements",
      description: "List accessible SAL or progress statements with status, date and payable amounts.",
      parameters: {
        type: "object",
        properties: {
          project_id: {
            type: "string",
          },
          project_hint: {
            type: "string",
          },
          status: {
            type: "string",
            enum: ["draft", "approved", "cancelled"],
          },
          limit: {
            type: "integer",
            minimum: 1,
            maximum: 20,
          },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_progress_statement_detail",
      description: "Return the detail of a specific accessible SAL, including numbering, amounts and notes.",
      parameters: {
        type: "object",
        properties: {
          project_id: {
            type: "string",
          },
          project_hint: {
            type: "string",
          },
          statement_id: {
            type: "string",
          },
          statement_hint: {
            type: "string",
          },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_progress_statement_notes",
      description: "List SAL notes across the current context, or for a specific accessible SAL when a reference is provided.",
      parameters: {
        type: "object",
        properties: {
          project_id: {
            type: "string",
          },
          project_hint: {
            type: "string",
          },
          statement_id: {
            type: "string",
          },
          statement_hint: {
            type: "string",
          },
          limit: {
            type: "integer",
            minimum: 1,
            maximum: 20,
          },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_project_company_commercials",
      description: "List commercial agreements between projects and participating companies for the current accessible context.",
      parameters: {
        type: "object",
        properties: {
          project_id: {
            type: "string",
          },
          project_hint: {
            type: "string",
          },
          company_id: {
            type: "string",
          },
          company_hint: {
            type: "string",
          },
          limit: {
            type: "integer",
            minimum: 1,
            maximum: 20,
          },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_context_work_sessions",
      description: "List work sessions or time-tracking entries relevant to the current assistant context.",
      parameters: {
        type: "object",
        properties: {
          project_id: {
            type: "string",
          },
          project_hint: {
            type: "string",
          },
          open_only: {
            type: "boolean",
          },
          limit: {
            type: "integer",
            minimum: 1,
            maximum: 20,
          },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_my_profile_summary",
      description: "Return a summary of the current user profile, active context, relevant roles and contact details.",
      parameters: {
        type: "object",
        properties: {},
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_personal_workspace_brief",
      description: "Return a personal workspace brief with unread notifications, pending invites, tasks and upcoming events.",
      parameters: {
        type: "object",
        properties: {
          limit: {
            type: "integer",
            minimum: 1,
            maximum: 10,
          },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_company_projects",
      description: "List the projects in the active company portfolio with their current operational status.",
      parameters: {
        type: "object",
        properties: {
          include_completed: {
            type: "boolean",
          },
          limit: {
            type: "integer",
            minimum: 1,
            maximum: 10,
          },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_company_members",
      description: "List members of the active company with roles and status.",
      parameters: {
        type: "object",
        properties: {
          limit: {
            type: "integer",
            minimum: 1,
            maximum: 20,
          },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_company_channels",
      description: "List the channels available in the active company context.",
      parameters: {
        type: "object",
        properties: {
          unread_only: {
            type: "boolean",
          },
          channel_type: {
            type: "string",
            enum: ["general", "company", "direct", "custom"],
          },
          limit: {
            type: "integer",
            minimum: 1,
            maximum: 10,
          },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_company_documents",
      description: "List accessible company documents in the active company context.",
      parameters: {
        type: "object",
        properties: {
          status: {
            type: "string",
            enum: ["draft", "in_review", "approved", "rejected", "superseded", "archived"],
          },
          current_only: {
            type: "boolean",
          },
          include_archived: {
            type: "boolean",
          },
          limit: {
            type: "integer",
            minimum: 1,
            maximum: 15,
          },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_company_subscription_status",
      description: "Return the active company plan, billing status, current period and active sponsorship summary.",
      parameters: {
        type: "object",
        properties: {},
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_project_sponsorship_status",
      description: "Return the sponsorship status of a company project, including current sponsor, pricing state and recent history.",
      parameters: {
        type: "object",
        properties: {
          project_id: {
            type: "string",
          },
          project_hint: {
            type: "string",
          },
        },
        additionalProperties: false,
      },
    },
  },
];

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const OPENAI_BASE_URL = (Deno.env.get("OPENAI_BASE_URL") || "https://api.openai.com/v1").replace(/\/$/, "");
const OPENAI_CHAT_MODEL = Deno.env.get("OPENAI_CHAT_MODEL") || "gpt-4o-mini";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const GEMINI_BASE_URL = (Deno.env.get("GEMINI_BASE_URL") || "https://generativelanguage.googleapis.com/v1beta").replace(/\/$/, "");
const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_MODEL = Deno.env.get("GEMINI_MODEL") || DEFAULT_GEMINI_MODEL;

const MODEL_PROVIDER = GEMINI_API_KEY
  ? "gemini"
  : OPENAI_API_KEY
    ? "openai"
    : "none";

const DIRECT_PROJECT_NOTIFICATION_TYPES = new Set([
  "project_invite",
  "dispute_opened",
  "dispute_status_changed",
  "dispute_commented",
  "task_status_changed",
  "project_sponsorship_activated",
  "project_sponsorship_revoked",
]);

const EVENT_BASED_NOTIFICATION_TYPES = new Set([
  "event_invite",
  "event_cancelled",
  "event_updated",
  "conflict_resolved",
]);

export async function assertAssistantContextAccess(appUser, dbClient, contextType, contextId) {
  const normalizedContextType = String(contextType || "").trim().toLowerCase();
  const normalizedContextId = String(contextId || "").trim();

  if (!ASSISTANT_CONTEXT_TYPES.includes(normalizedContextType)) {
    throw new InputValidationError("context_type is invalid", 400);
  }

  if (!normalizedContextId) {
    throw new InputValidationError("context_id is required", 400);
  }

  if (!dbClient) {
    throw new Error("Authenticated assistant database client is required");
  }

  const { data: hasAccess, error } = await dbClient.rpc("can_access_assistant_context", {
    p_context_type: normalizedContextType,
    p_context_id: normalizedContextId,
  });

  if (error) throw error;
  if (!hasAccess) {
    throw new InputValidationError(buildContextAccessErrorMessage(appUser, normalizedContextType), 403);
  }

  return {
    contextType: normalizedContextType,
    contextId: normalizedContextId,
    mode: deriveAssistantContextMode(appUser, normalizedContextType),
    activeCompanyId: appUser?.active_company_id || null,
  };
}

export async function buildAssistantReply({
  appUser,
  dbClient,
  contextType,
  contextId,
  uiMode = "normal",
  routePath = "",
  routeSearch = "",
  userMessage,
  historyMessages = [],
}) {
  const normalizedUiMode = normalizeAssistantUiMode(uiMode);
  const ragMatches = await getAssistantSemanticMatches({
    appUser,
    dbClient,
    contextType,
    contextId,
    userMessage,
  });
  const toolCalls = [];

  if (MODEL_PROVIDER === "none") {
    const fallbackTools = await runFallbackToolSelection({
      appUser,
      dbClient,
      contextType,
      contextId,
      uiMode: normalizedUiMode,
      routePath,
      routeSearch,
      userMessage,
    });
    toolCalls.push(...fallbackTools);

    return {
      content: normalizeAssistantContent(buildDeterministicReply({ contextType, userMessage, ragMatches, toolCalls })),
      toolCalls,
      ragMatches,
    };
  }

  if (MODEL_PROVIDER === "gemini") {
    const fallbackTools = await runFallbackToolSelection({
      appUser,
      dbClient,
      contextType,
      contextId,
      uiMode: normalizedUiMode,
      routePath,
      routeSearch,
      userMessage,
    });
    toolCalls.push(...fallbackTools);

    let content = "";
    try {
      content = await requestGeminiCompletion({
        appUser,
        contextType,
        contextId,
        uiMode: normalizedUiMode,
        routePath,
        routeSearch,
        userMessage,
        historyMessages,
        ragMatches,
        toolCalls,
      });
    } catch (error) {
      console.warn("assistant provider completion failed, falling back to deterministic reply:", error);
    }

    return {
      content: normalizeAssistantContent(content || buildDeterministicReply({ contextType, userMessage, ragMatches, toolCalls })),
      toolCalls,
      ragMatches,
    };
  }

  const modelMessages = [
    {
      role: "system",
      content: buildSystemPrompt({ appUser, contextType, contextId, uiMode: normalizedUiMode, routePath, routeSearch, ragMatches }),
    },
    ...historyMessages.slice(-12).map((message) => ({
      role: message.role === "assistant" ? "assistant" : "user",
      content: String(message.content || ""),
    })),
    {
      role: "user",
      content: userMessage,
    },
  ];

  let finalText = "";

  try {
    for (let step = 0; step < 3; step += 1) {
      const assistantMessage = await requestChatCompletion(modelMessages);
      const assistantText = normalizeAssistantContent(assistantMessage?.content);
      const requestedTools = Array.isArray(assistantMessage?.tool_calls) ? assistantMessage.tool_calls : [];

      if (requestedTools.length === 0) {
        finalText = assistantText.trim();
        break;
      }

      modelMessages.push({
        role: "assistant",
        content: assistantText || "",
        tool_calls: requestedTools,
      });

      for (const requestedTool of requestedTools) {
        const toolName = requestedTool?.function?.name || "unknown_tool";
        const rawArguments = requestedTool?.function?.arguments || "{}";
        const parsedArguments = safeJsonParse(rawArguments, {});

        try {
          const result = await executeAssistantTool({
            appUser,
            dbClient,
            toolName,
            args: parsedArguments,
            contextType,
            contextId,
            uiMode: normalizedUiMode,
            routePath,
            routeSearch,
            userMessage,
          });

          toolCalls.push({
            name: toolName,
            status: "completed",
            arguments_string: JSON.stringify(parsedArguments),
            results: JSON.stringify(result),
          });

          modelMessages.push({
            role: "tool",
            tool_call_id: requestedTool.id,
            content: JSON.stringify(result),
          });
        } catch (error) {
          const failedResult = {
            success: false,
            error: error instanceof Error ? error.message : String(error),
          };

          toolCalls.push({
            name: toolName,
            status: "failed",
            arguments_string: JSON.stringify(parsedArguments),
            results: JSON.stringify(failedResult),
          });

          modelMessages.push({
            role: "tool",
            tool_call_id: requestedTool.id,
            content: JSON.stringify(failedResult),
          });
        }
      }
    }
  } catch (error) {
    console.warn("assistant provider completion failed, falling back to deterministic reply:", error);
  }

  if (!finalText) {
    finalText = buildDeterministicReply({ contextType, userMessage, ragMatches, toolCalls });
  }

  return {
    content: normalizeAssistantContent(finalText),
    toolCalls,
    ragMatches,
  };
}

function deriveAssistantContextMode(appUser, contextType) {
  if (appUser?.role === "admin") {
    return "admin";
  }

  const currentContext = appUser?.active_context || "personal";

  if (contextType === "personal") {
    return "personal";
  }

  if (contextType === "company") {
    return "company";
  }

  if (currentContext === "company") {
    return "project-company";
  }

  return "project-personal";
}

export function deriveAssistantChatScope(appUser) {
  if (appUser?.active_context === "company" && appUser?.active_company_id) {
    return {
      type: "company",
      id: appUser.active_company_id,
    };
  }

  return {
    type: "personal",
    id: appUser?.id || null,
  };
}

function buildContextAccessErrorMessage(appUser, contextType) {
  if (contextType === "personal") {
    return "Personal assistant context is not active";
  }

  if (contextType === "company") {
    return "Company assistant context is not active";
  }

  return appUser?.active_context === "company"
    ? "The active company cannot access this worksite context"
    : "The active personal context cannot access this worksite";
}

async function getAssistantSemanticMatches({
  appUser,
  dbClient,
  contextType,
  contextId,
  userMessage,
}) {
  const normalizedMessage = String(userMessage || "").trim();
  if (!dbClient || !normalizedMessage || contextType === "personal") {
    return [];
  }

  try {
    await syncAssistantContextEmbeddings({
      dbClient,
      contextType,
      contextId,
      createdBy: appUser?.email || "assistant-runtime",
      pruneMissing: false,
    });

    return await searchContextEmbeddings({
      dbClient,
      contextType,
      contextId,
      query: normalizedMessage,
      limit: 4,
      minSimilarity: 0.35,
    });
  } catch (error) {
    console.warn("assistant semantic retrieval failed:", error);
    return [];
  }
}

async function runFallbackToolSelection({ appUser, dbClient, contextType, contextId, uiMode, routePath, routeSearch, userMessage }) {
  const normalizedMessage = String(userMessage || "").toLowerCase();
  const selectedTools = [];
  const selectedToolNames = new Set();

  const addFallbackTool = async (name, args, buildResult) => {
    if (selectedToolNames.has(name)) {
      return;
    }

    selectedToolNames.add(name);
    selectedTools.push(await buildToolCall(name, args, await buildResult()));
  };

  const wantsOverview = /riepilog|summary|overview|quadro|situazion/.test(normalizedMessage);
  const wantsProjects = /cantier|worksite|progett|project\b/.test(normalizedMessage);
  const wantsTasks = /task|attivit|todo|to-do|blocc|blocked|scadenz|assegnat/.test(normalizedMessage);
  const wantsSchedule = /calendar|calend|agenda|event|riunion|meeting|appuntament|oggi|domani|settiman/.test(normalizedMessage);
  const wantsParticipants = /partecip|membri|member|team|ruol|responsabil|contractor|subcontractor|homeowner/.test(normalizedMessage);
  const wantsNotifications = /notific|alert|avvis|inviti|invite/.test(normalizedMessage);
  const wantsChannels = /canal|channel|messaggistica|chat del progetto|chat della societa|canale general/i.test(normalizedMessage);
  const wantsChannelDetail = /((dettagli|dettaglio|scheda|info|informazioni).*(canal|channel))|((canal|channel).*(dettagli|dettaglio|membri|ultim|unread|non lett))/i.test(normalizedMessage);
  const wantsMessages = /messagg|conversation|conversaz|thread|chat/.test(normalizedMessage);
  const wantsMessageDetail = /((dettagli|dettaglio|scheda|info|informazioni).*(messagg|message))|((messagg|message).*(dettagli|dettaglio|autore|mention|canal|channel))/i.test(normalizedMessage);
  const wantsMentionsFollowups = /mention|menzion|follow\s?up|non perdere|messaggi da leggere|unread messages|risposte da vedere/i.test(normalizedMessage);
  const wantsNotificationPreferences = /preferenz.*notific|notific.*email|come sono impostate le notific|preferenze avvisi/i.test(normalizedMessage);
  const wantsDocuments = /document|elaborat|allegat|tavol|dwg|pdf|ifc|bim|revision/i.test(normalizedMessage);
  const wantsDocumentSearch = wantsDocuments && /trova|cerca|search|find|ultimo|latest|corrente|current|tag|disciplin|area|fase/i.test(normalizedMessage);
  const wantsDocumentDetail = /((dettagli|dettaglio|scheda|info|informazioni).*(document|elaborat|allegat|tavol))|((document|elaborat|allegat|tavol).*(dettagli|dettaglio|metadat|stato|revision|caricat|autore))/i.test(normalizedMessage);
  const wantsDocumentRevisionHistory = wantsDocuments && /catena revision|storico revision|revisione corrente|revision history|versioni|superseded/i.test(normalizedMessage);
  const wantsDocumentWorkflowStatus = wantsDocuments && /workflow|approv|in revis|stato documento|transizion|approved|rejected|archiviat/i.test(normalizedMessage);
  const wantsDocumentComments = wantsDocuments && /comment|annotaz|note documento|commenti apert/i.test(normalizedMessage);
  const wantsDocumentApprovals = wantsDocuments && /approvazioni|approval/i.test(normalizedMessage);
  const wantsDocumentRevisionEvents = wantsDocuments && /audit|eventi revision|storico eventi|file_replaced|status_changed|metadata_updated/i.test(normalizedMessage);
  const wantsFinance = /finanz|budget|costo|costi|econom|sal|consuntiv|forecast|scostament|manodopera|timbratur|rate orarie/i.test(normalizedMessage);
  const wantsFinanceSnapshot = wantsFinance && /snapshot|riepilog|quadro|situazion|kpi|andamento|overview|report/i.test(normalizedMessage);
  const wantsBudgetWatchpoints = wantsFinance && /watchpoint|criticit|linee critiche|scostament|sforament|over budget|fuori budget/i.test(normalizedMessage);
  const wantsCostEntries = wantsFinance && /moviment|registrazioni costi|costi recenti|spese registrate|cost entry|ultimi costi|consuntiv/i.test(normalizedMessage);
  const wantsLaborRates = wantsFinance && /tariff|rate|orari|hourly|costo orario|costo.*manodopera/i.test(normalizedMessage);
  const wantsProjectFinancialSettings = wantsFinance && /impostazioni|settings|valuta|visibilit|budget mode|labor method|metodo.*manodopera|sal.*attiv/i.test(normalizedMessage);
  const wantsProgressStatements = /\bsal\b|progress statement|stato avanzamento/i.test(normalizedMessage);
  const wantsProgressStatementDetail = /((dettagli|dettaglio|scheda|info|informazioni).*(\bsal\b|progress statement))|((\bsal\b|progress statement).*(dettagli|dettaglio|numero|import|maturat|pagare|note))/i.test(normalizedMessage);
  const wantsProgressStatementNotes = wantsProgressStatements && /note|annot|memo/i.test(normalizedMessage);
  const wantsCommercials = wantsFinance && /commercial|contratt|accordi economici|importo contratt|lump sum|unit price|time and material/i.test(normalizedMessage);
  const wantsWorkSessions = /timbrat|work session|turni|ore lavorate|clock in|clock out|sessioni aperte|presenze/i.test(normalizedMessage);
  const wantsMyProfileSummary = /profil|\bchi sono io\b|mio account|miei dati|recapiti|telefono|mia email|mio telefono|email personale/i.test(normalizedMessage);
  const wantsPersonalWorkspaceBrief = /workspace personale|brief personale|riepilogo personale|mio workspace|mia panoramica|mia giornata|cosa mi aspetta/i.test(normalizedMessage);
  const wantsCompanyProjects = /portfolio societ|cantieri della societ|progetti della societ|company projects|portfolio company/i.test(normalizedMessage);
  const wantsCompanyMembers = /membri societ|team societ|organico|staff societ|company members/i.test(normalizedMessage);
  const wantsCompanyChannels = /canali societ|chat societ|company channels/i.test(normalizedMessage);
  const wantsCompanyDocuments = /documenti societ|archivio societ|company documents/i.test(normalizedMessage);
  const wantsCompanySubscriptionStatus = /abbonament|piano societ|billing societ|fatturaz societ|company billing|company subscription|periodo corrente/i.test(normalizedMessage);
  const wantsProjectSponsorshipStatus = /sponsorship.*cantiere|stato sponsorship|chi sponsorizza|sponsor.*cantiere|worksite sponsorship/i.test(normalizedMessage);
  const wantsContextState = /contesto|route|pagina|schermata|modalit|sto lavorando come|dove mi trovi|dove stai rispondendo/.test(normalizedMessage);
  const wantsCapabilities = /cosa posso|funzion|capabilit|abilitat|disponibil|permess|limitat/.test(normalizedMessage);
  const wantsAvailabilityExplanation = /perch[eé]\s+non|come mai|bloccat|premium|sponsorizzat|non posso|non vedo/.test(normalizedMessage);
  const wantsEntitySearch = /trova|cerca|search|find|lookup/.test(normalizedMessage);
  const wantsNavigationHelp = /dove trovo|come arrivo|come apro|come raggiungo|in quale pagina|in quale sezione|dove si trova|vai in|vai al|vai alla|vai allo|apri la pagina|apri la sezione|aprimi|portami|porta(mi)?|fammi andare/.test(normalizedMessage);
  const wantsPendingInvites = /inviti|invite|invitat|da accettare|in attesa di risposta/.test(normalizedMessage);
  const wantsMemberships = /apparteng|mie societ|miei ruoli|membership|faccio parte|in quali societ/.test(normalizedMessage);
  const wantsPendingDecisions = /decision|approvaz|approval|pending|in attesa|da gestire|richiedono attenzione|da approvare|clarification|chiariment/.test(normalizedMessage);
  const wantsTodayDeadlines = /scadenz.*oggi|oggi.*scadenz|deadline.*oggi|cosa scade oggi|attivit[aà].*oggi|today.*deadline/.test(normalizedMessage);
  const wantsBlockedTasks = /task blocc|attivit[aà].*blocc|quali task sono blocc|cosa e blocc|blocked tasks/.test(normalizedMessage);
  const wantsTaskDetail = /((dettagli|dettaglio|scheda|info|informazioni).*(task|attivit[aà]))|((task|attivit[aà]).*(dettagli|dettaglio|scheda|info|informazioni|assegnat|scadenz|blocc))/i.test(normalizedMessage);
  const wantsMilestones = /milestone|mileston|fase|fasi|traguard/i.test(normalizedMessage);
  const wantsMilestoneDetail = /((dettagli|dettaglio|scheda|info|informazioni).*(milestone|fase))|((milestone|fase).*(dettagli|dettaglio|scheda|info|informazioni|target|date|task collegate))/i.test(normalizedMessage);
  const wantsChangeRequests = /variant|change request|richiest[ae] di modific|modifiche/i.test(normalizedMessage);
  const wantsChangeRequestDetail = /((dettagli|dettaglio|scheda|info|informazioni).*(variant|change request|richiest[ae] di modific))|((variant|change request|richiest[ae] di modific).*(dettagli|dettaglio|scheda|info|informazioni|impatto|risposta|assegnat))/i.test(normalizedMessage);
  const wantsDisputes = /disput|controvers|contenz|claim/i.test(normalizedMessage);
  const wantsDisputeDetail = /((dettagli|dettaglio|scheda|info|informazioni).*(disput|controvers|contenz))|((disput|controvers|contenz).*(dettagli|dettaglio|scheda|info|informazioni|timeline|evidenz|impatto))/i.test(normalizedMessage);
  const wantsEventDetail = /((dettagli|dettaglio|scheda|info|informazioni).*(event|riunion|meeting|appuntament))|((event|riunion|meeting|appuntament).*(dettagli|dettaglio|scheda|info|informazioni|partecipant|conflitt|luogo|orario))/i.test(normalizedMessage);
  const wantsOperationalDayBrief = /((brief|riepilog|riassunt|quadro).*(oggi|giornat|operativ))|((oggi|giornat).*(brief|riepilog|riassunt|quadro))|day brief/i.test(normalizedMessage);
  const shouldListProjectsDirectly = wantsProjects && !(wantsParticipants && !wantsOverview);
  const inferredFeatureKey = inferFeatureKeyFromText(userMessage, contextType);

  if (wantsContextState) {
    await addFallbackTool(
      "get_current_context_state",
      {},
      () => getCurrentContextState(dbClient, appUser, contextType, contextId, { uiMode, routePath, routeSearch }),
    );
  }

  if (wantsCapabilities) {
    await addFallbackTool(
      "get_context_capabilities",
      {},
      () => getContextCapabilities(dbClient, appUser, contextType, contextId),
    );
  }

  if ((wantsAvailabilityExplanation || (wantsCapabilities && inferredFeatureKey)) && inferredFeatureKey) {
    await addFallbackTool(
      "explain_feature_availability",
      { feature_key: inferredFeatureKey },
      () => explainFeatureAvailability(dbClient, appUser, contextType, contextId, { feature_key: inferredFeatureKey }, userMessage),
    );
  }

  if (wantsEntitySearch) {
    await addFallbackTool(
      "search_context_entities",
      { query: userMessage, limit: 8 },
      () => searchContextEntities(dbClient, appUser, contextType, contextId, { query: userMessage, limit: 8 }, userMessage),
    );
  }

  if (wantsNavigationHelp) {
    await addFallbackTool(
      "get_navigation_help",
      { topic: userMessage, ...(inferredFeatureKey ? { feature_key: inferredFeatureKey } : {}) },
      () => getNavigationHelp(dbClient, appUser, contextType, contextId, {
        topic: userMessage,
        ...(inferredFeatureKey ? { feature_key: inferredFeatureKey } : {}),
      }, userMessage),
    );
  }

  if (wantsPendingInvites) {
    await addFallbackTool(
      "list_pending_invites",
      { limit: 10 },
      () => listPendingInvites(dbClient, appUser, contextType, contextId, { limit: 10 }),
    );
  }

  if (wantsMemberships) {
    await addFallbackTool(
      "list_my_memberships",
      {},
      () => listMyMemberships(dbClient, appUser, contextType, contextId),
    );
  }

  if (wantsPendingDecisions) {
    await addFallbackTool(
      "list_pending_decisions",
      { limit: 10 },
      () => listPendingDecisions(dbClient, appUser, contextType, contextId, { limit: 10 }),
    );
  }

  if (wantsTodayDeadlines) {
    await addFallbackTool(
      "get_today_deadlines",
      { limit: 5 },
      () => getTodayDeadlines(dbClient, appUser, contextType, contextId, { limit: 5 }),
    );
  }

  if (wantsBlockedTasks) {
    await addFallbackTool(
      "list_blocked_tasks",
      { limit: 5 },
      () => listBlockedTasks(dbClient, appUser, contextType, contextId, { limit: 5 }),
    );
  }

  if (wantsTaskDetail) {
    await addFallbackTool(
      "get_task_detail",
      { task_hint: userMessage },
      () => getTaskDetail(dbClient, appUser, contextType, contextId, { task_hint: userMessage }),
    );
  }

  if (wantsMilestones) {
    const status = /complet/.test(normalizedMessage)
      ? "completed"
      : /ritard|delayed/.test(normalizedMessage)
        ? "delayed"
        : /corso|in progress/.test(normalizedMessage)
          ? "in_progress"
          : null;
    await addFallbackTool(
      "list_context_milestones",
      { limit: 5, ...(status ? { status } : {}) },
      () => listContextMilestones(dbClient, appUser, contextType, contextId, { limit: 5, ...(status ? { status } : {}) }),
    );
  }

  if (wantsMilestoneDetail) {
    await addFallbackTool(
      "get_milestone_detail",
      { milestone_hint: userMessage },
      () => getMilestoneDetail(dbClient, appUser, contextType, contextId, { milestone_hint: userMessage }),
    );
  }

  if (wantsChangeRequests) {
    const status = /approvat/.test(normalizedMessage)
      ? "approved"
      : /respint|rifiutat|rejected/.test(normalizedMessage)
        ? "rejected"
        : /clarification|chiariment/.test(normalizedMessage)
          ? "clarification_needed"
          : /pending|attesa/.test(normalizedMessage)
            ? "pending"
            : null;
    await addFallbackTool(
      "list_context_change_requests",
      { limit: 5, ...(status ? { status } : {}) },
      () => listContextChangeRequests(dbClient, appUser, contextType, contextId, { limit: 5, ...(status ? { status } : {}) }),
    );
  }

  if (wantsChangeRequestDetail) {
    await addFallbackTool(
      "get_change_request_detail",
      { change_request_hint: userMessage },
      () => getChangeRequestDetail(dbClient, appUser, contextType, contextId, { change_request_hint: userMessage }),
    );
  }

  if (wantsDisputes) {
    const status = /escalat/.test(normalizedMessage)
      ? "escalated"
      : /attesa|awaiting/.test(normalizedMessage)
        ? "awaiting_response"
        : /review|revis/.test(normalizedMessage)
          ? "in_review"
          : /risolt/.test(normalizedMessage)
            ? "resolved"
            : /chius|closed/.test(normalizedMessage)
              ? "closed_no_agreement"
              : /aperte|aperte|open/.test(normalizedMessage)
                ? "open"
                : null;
    await addFallbackTool(
      "list_context_disputes",
      { limit: 5, ...(status ? { status } : {}) },
      () => listContextDisputes(dbClient, appUser, contextType, contextId, { limit: 5, ...(status ? { status } : {}) }),
    );
  }

  if (wantsDisputeDetail) {
    await addFallbackTool(
      "get_dispute_detail",
      { dispute_hint: userMessage },
      () => getDisputeDetail(dbClient, appUser, contextType, contextId, { dispute_hint: userMessage }),
    );
  }

  if (contextType === "project") {
    await addFallbackTool("get_project_summary", {}, () => getProjectSummary(dbClient, contextId));
  }

  if (shouldListProjectsDirectly || (wantsOverview && contextType !== "project")) {
    const includeCompleted = /complet|chius|closed|archiv/.test(normalizedMessage);
    await addFallbackTool(
      "list_accessible_projects",
      { limit: 5, include_completed: includeCompleted },
      () => listAccessibleProjects(dbClient, appUser, contextType, contextId, { limit: 5, include_completed: includeCompleted }),
    );
  }

  if (wantsTasks) {
    const status = /blocc|blocked/.test(normalizedMessage)
      ? "blocked"
      : /complet|chius|done/.test(normalizedMessage)
        ? "completed"
        : null;

    await addFallbackTool(
      "list_context_tasks",
      { limit: 5, ...(status ? { status } : {}) },
      () => listContextTasks(dbClient, appUser, contextType, contextId, { limit: 5, ...(status ? { status } : {}) }),
    );
  }

  if (wantsSchedule) {
    const includePast = /ieri|passat|storico|past/.test(normalizedMessage);
    await addFallbackTool(
      "list_context_schedule",
      { limit: 5, include_past: includePast },
      () => listContextSchedule(dbClient, appUser, contextType, contextId, { limit: 5, include_past: includePast }),
    );
  }

  if (wantsEventDetail) {
    await addFallbackTool(
      "get_event_detail",
      { event_hint: userMessage },
      () => getEventDetail(dbClient, appUser, contextType, contextId, { event_hint: userMessage }),
    );
  }

  if (wantsOperationalDayBrief) {
    await addFallbackTool(
      "get_operational_day_brief",
      {},
      () => getOperationalDayBrief(dbClient, appUser, contextType, contextId, { uiMode }),
    );
  }

  if (wantsParticipants) {
    await addFallbackTool(
      "list_context_participants",
      { limit: 10, ...(contextType !== "project" && wantsProjects ? { project_hint: userMessage } : {}) },
      () => listContextParticipants(dbClient, appUser, contextType, contextId, { limit: 10, ...(contextType !== "project" && wantsProjects ? { project_hint: userMessage } : {}) }),
    );
  }

  if (wantsNotifications) {
    const unreadOnly = /non lette|da leggere|unread/.test(normalizedMessage);
    await addFallbackTool(
      "list_context_notifications",
      { limit: 5, unread_only: unreadOnly },
      () => listContextNotifications(dbClient, appUser, contextType, contextId, { limit: 5, unread_only: unreadOnly }),
    );
  }

  if (wantsChannels) {
    const unreadOnly = /non lett|da leggere|unread/.test(normalizedMessage);
    const channelType = /dirett|direct/.test(normalizedMessage)
      ? "direct"
      : /general/.test(normalizedMessage)
        ? contextType === "company" ? "company" : "general"
        : /custom|canali custom/.test(normalizedMessage)
          ? "custom"
          : null;
    await addFallbackTool(
      "list_context_channels",
      { limit: 5, unread_only: unreadOnly, ...(channelType ? { channel_type: channelType } : {}) },
      () => listContextChannels(dbClient, appUser, contextType, contextId, { limit: 5, unread_only: unreadOnly, ...(channelType ? { channel_type: channelType } : {}), uiMode }),
    );
  }

  if (wantsChannelDetail) {
    await addFallbackTool(
      "get_channel_detail",
      { channel_hint: userMessage },
      () => getChannelDetail(dbClient, appUser, contextType, contextId, { channel_hint: userMessage, uiMode }),
    );
  }

  if (wantsMessages) {
    const unreadOnly = /non lett|da leggere|unread/.test(normalizedMessage);
    const mentionedOnly = /mention|menzion/.test(normalizedMessage);
    await addFallbackTool(
      "list_context_messages",
      { limit: 5, unread_only: unreadOnly, mentioned_only: mentionedOnly },
      () => listContextMessages(dbClient, appUser, contextType, contextId, { limit: 5, unread_only: unreadOnly, mentioned_only: mentionedOnly, uiMode }),
    );
  }

  if (wantsMessageDetail) {
    await addFallbackTool(
      "get_message_detail",
      { message_hint: userMessage },
      () => getMessageDetail(dbClient, appUser, contextType, contextId, { message_hint: userMessage, uiMode }),
    );
  }

  if (wantsMentionsFollowups) {
    await addFallbackTool(
      "list_mentions_and_followups",
      { limit: 5 },
      () => listMentionsAndFollowups(dbClient, appUser, contextType, contextId, { limit: 5, uiMode }),
    );
  }

  if (wantsNotificationPreferences) {
    await addFallbackTool(
      "get_notification_preferences",
      {},
      () => getNotificationPreferences(dbClient, appUser, contextType, contextId),
    );
  }

  if (wantsDocumentSearch) {
    await addFallbackTool(
      "search_context_documents",
      { query: userMessage, limit: 6 },
      () => searchContextDocuments(dbClient, appUser, contextType, contextId, { query: userMessage, limit: 6 }),
    );
  } else if (wantsDocuments) {
    const status = /bozz/.test(normalizedMessage)
      ? "draft"
      : /review|revis/.test(normalizedMessage)
        ? "in_review"
        : /approvat/.test(normalizedMessage)
          ? "approved"
          : /respint|rejected/.test(normalizedMessage)
            ? "rejected"
            : /superat|superseded/.test(normalizedMessage)
              ? "superseded"
              : /archiv/.test(normalizedMessage)
                ? "archived"
                : null;
    const currentOnly = !/storic|tutte le revision|all revisions/.test(normalizedMessage);
    await addFallbackTool(
      "list_context_documents",
      { limit: 6, current_only: currentOnly, ...(status ? { status } : {}) },
      () => listContextDocuments(dbClient, appUser, contextType, contextId, { limit: 6, current_only: currentOnly, ...(status ? { status } : {}) }),
    );
  }

  if (wantsDocumentDetail) {
    await addFallbackTool(
      "get_document_detail",
      { document_hint: userMessage },
      () => getDocumentDetail(dbClient, appUser, contextType, contextId, { document_hint: userMessage }),
    );
  }

  if (wantsDocumentRevisionHistory) {
    await addFallbackTool(
      "get_document_revision_history",
      { document_hint: userMessage },
      () => getDocumentRevisionHistory(dbClient, appUser, contextType, contextId, { document_hint: userMessage }),
    );
  }

  if (wantsDocumentWorkflowStatus) {
    await addFallbackTool(
      "get_document_workflow_status",
      { document_hint: userMessage },
      () => getDocumentWorkflowStatus(dbClient, appUser, contextType, contextId, { document_hint: userMessage }),
    );
  }

  if (wantsDocumentComments) {
    await addFallbackTool(
      "list_document_comments",
      { document_hint: userMessage, limit: 6 },
      () => listDocumentComments(dbClient, appUser, contextType, contextId, { document_hint: userMessage, limit: 6 }),
    );
  }

  if (wantsDocumentApprovals) {
    await addFallbackTool(
      "list_document_approvals",
      { document_hint: userMessage, limit: 6 },
      () => listDocumentApprovals(dbClient, appUser, contextType, contextId, { document_hint: userMessage, limit: 6 }),
    );
  }

  if (wantsDocumentRevisionEvents) {
    await addFallbackTool(
      "list_document_revision_events",
      { document_hint: userMessage, limit: 6 },
      () => listDocumentRevisionEvents(dbClient, appUser, contextType, contextId, { document_hint: userMessage, limit: 6 }),
    );
  }

  if (wantsFinanceSnapshot || (wantsFinance && !wantsBudgetWatchpoints && !wantsCostEntries && !wantsLaborRates && !wantsProjectFinancialSettings && !wantsProgressStatements)) {
    await addFallbackTool(
      "get_context_finance_snapshot",
      { limit: 5 },
      () => getContextFinanceSnapshot(dbClient, appUser, contextType, contextId, { limit: 5 }),
    );
  }

  if (wantsBudgetWatchpoints) {
    await addFallbackTool(
      "list_budget_watchpoints",
      { limit: 6 },
      () => listBudgetWatchpoints(dbClient, appUser, contextType, contextId, { limit: 6 }),
    );
  }

  if (wantsCostEntries) {
    const costType = /manodopera|labor/.test(normalizedMessage)
      ? "labor"
      : /material/i.test(normalizedMessage)
        ? "materials"
        : /attrezz|equipment/i.test(normalizedMessage)
          ? "equipment"
          : /subapp|subcontract/i.test(normalizedMessage)
            ? "subcontract"
            : /indirett/i.test(normalizedMessage)
              ? "indirect"
              : /extra/i.test(normalizedMessage)
                ? "extra"
                : /rettific|adjustment/i.test(normalizedMessage)
                  ? "adjustment"
                  : null;
    const status = /approvat/i.test(normalizedMessage)
      ? "approved"
      : /contest|contested/i.test(normalizedMessage)
        ? "contested"
        : /recorded|registrat/i.test(normalizedMessage)
          ? "recorded"
          : null;
    await addFallbackTool(
      "list_cost_entries",
      { limit: 6, ...(costType ? { cost_type: costType } : {}), ...(status ? { status } : {}) },
      () => listCostEntries(dbClient, appUser, contextType, contextId, { limit: 6, ...(costType ? { cost_type: costType } : {}), ...(status ? { status } : {}) }),
    );
  }

  if (wantsLaborRates) {
    await addFallbackTool(
      "list_context_labor_rates",
      { limit: 6 },
      () => listContextLaborRates(dbClient, appUser, contextType, contextId, { limit: 6 }),
    );
  }

  if (wantsProjectFinancialSettings) {
    await addFallbackTool(
      "get_project_financial_settings",
      {},
      () => getProjectFinancialSettings(dbClient, appUser, contextType, contextId, {}),
    );
  }

  if (wantsProgressStatements) {
    const status = /approvat/i.test(normalizedMessage)
      ? "approved"
      : /annull|cancel/i.test(normalizedMessage)
        ? "cancelled"
        : /bozz|draft/i.test(normalizedMessage)
          ? "draft"
          : null;
    await addFallbackTool(
      "list_progress_statements",
      { limit: 6, ...(status ? { status } : {}) },
      () => listProgressStatements(dbClient, appUser, contextType, contextId, { limit: 6, ...(status ? { status } : {}) }),
    );
  }

  if (wantsProgressStatementDetail) {
    await addFallbackTool(
      "get_progress_statement_detail",
      { statement_hint: userMessage },
      () => getProgressStatementDetail(dbClient, appUser, contextType, contextId, { statement_hint: userMessage }),
    );
  }

  if (wantsProgressStatementNotes) {
    await addFallbackTool(
      "list_progress_statement_notes",
      { ...(wantsProgressStatementDetail ? { statement_hint: userMessage } : {}), limit: 6 },
      () => listProgressStatementNotes(dbClient, appUser, contextType, contextId, { ...(wantsProgressStatementDetail ? { statement_hint: userMessage } : {}), limit: 6 }),
    );
  }

  if (wantsCommercials) {
    await addFallbackTool(
      "list_project_company_commercials",
      { limit: 6 },
      () => listProjectCompanyCommercials(dbClient, appUser, contextType, contextId, { limit: 6 }),
    );
  }

  if (wantsWorkSessions) {
    const openOnly = /aperte|in corso|open/i.test(normalizedMessage);
    await addFallbackTool(
      "list_context_work_sessions",
      { limit: 6, open_only: openOnly },
      () => listContextWorkSessions(dbClient, appUser, contextType, contextId, { limit: 6, open_only: openOnly }),
    );
  }

  if (wantsMyProfileSummary) {
    await addFallbackTool(
      "get_my_profile_summary",
      {},
      () => getMyProfileSummary(dbClient, appUser, contextType, contextId),
    );
  }

  if (wantsPersonalWorkspaceBrief) {
    await addFallbackTool(
      "get_personal_workspace_brief",
      { limit: 5 },
      () => getPersonalWorkspaceBrief(dbClient, appUser, contextType, contextId, { limit: 5 }),
    );
  }

  if (wantsCompanyProjects) {
    await addFallbackTool(
      "list_company_projects",
      { limit: 6, include_completed: /complet|chius|archiv/i.test(normalizedMessage) },
      () => listCompanyProjects(dbClient, appUser, contextType, contextId, { limit: 6, include_completed: /complet|chius|archiv/i.test(normalizedMessage) }),
    );
  }

  if (wantsCompanyMembers) {
    await addFallbackTool(
      "list_company_members",
      { limit: 8 },
      () => listCompanyMembers(dbClient, appUser, contextType, contextId, { limit: 8 }),
    );
  }

  if (wantsCompanyChannels) {
    const unreadOnly = /non lett|da leggere|unread/.test(normalizedMessage);
    const channelType = /dirett|direct/.test(normalizedMessage)
      ? "direct"
      : /general/.test(normalizedMessage)
        ? "company"
        : /custom/.test(normalizedMessage)
          ? "custom"
          : null;
    await addFallbackTool(
      "list_company_channels",
      { limit: 6, unread_only: unreadOnly, ...(channelType ? { channel_type: channelType } : {}) },
      () => listCompanyChannels(dbClient, appUser, contextType, contextId, { limit: 6, unread_only: unreadOnly, ...(channelType ? { channel_type: channelType } : {}), uiMode }),
    );
  }

  if (wantsCompanyDocuments) {
    const status = /bozz/.test(normalizedMessage)
      ? "draft"
      : /review|revis/.test(normalizedMessage)
        ? "in_review"
        : /approvat/.test(normalizedMessage)
          ? "approved"
          : /respint|rejected/.test(normalizedMessage)
            ? "rejected"
            : /superat|superseded/.test(normalizedMessage)
              ? "superseded"
              : /archiv/.test(normalizedMessage)
                ? "archived"
                : null;
    await addFallbackTool(
      "list_company_documents",
      { limit: 6, current_only: !/storic|revisioni|all revisions/i.test(normalizedMessage), include_archived: /archiv/i.test(normalizedMessage), ...(status ? { status } : {}) },
      () => listCompanyDocuments(dbClient, appUser, contextType, contextId, { limit: 6, current_only: !/storic|revisioni|all revisions/i.test(normalizedMessage), include_archived: /archiv/i.test(normalizedMessage), ...(status ? { status } : {}) }),
    );
  }

  if (wantsCompanySubscriptionStatus) {
    await addFallbackTool(
      "get_company_subscription_status",
      {},
      () => getCompanySubscriptionStatus(dbClient, appUser, contextType, contextId),
    );
  }

  if (wantsProjectSponsorshipStatus) {
    await addFallbackTool(
      "get_project_sponsorship_status",
      { project_hint: userMessage },
      () => getProjectSponsorshipStatus(dbClient, appUser, contextType, contextId, { project_hint: userMessage }),
    );
  }

  if (wantsOverview || wantsOperationalDayBrief || wantsNotifications || wantsPendingDecisions || wantsPendingInvites || selectedTools.length === 0) {
    await addFallbackTool(
      "list_recent_updates",
      { limit: 5 },
      () => listRecentUpdates(dbClient, appUser, contextType, contextId, { limit: 5 }),
    );
  }

  if (/nota|note|comment|commento|progress|sal|annot/i.test(normalizedMessage) || (contextType !== "personal" && (wantsOverview || selectedTools.length === 0))) {
    await addFallbackTool(
      "get_context_notes",
      { limit: 5 },
      () => getContextNotes(dbClient, contextType, contextId, { limit: 5 }),
    );
  }

  return selectedTools;
}

async function buildToolCall(name, args, result) {
  return {
    name,
    status: "completed",
    arguments_string: JSON.stringify(args),
    results: JSON.stringify(result),
  };
}

async function executeAssistantTool({ appUser, dbClient, toolName, args, contextType, contextId, uiMode, routePath, routeSearch, userMessage }) {
  switch (toolName) {
    case "get_current_context_state":
      return getCurrentContextState(dbClient, appUser, contextType, contextId, { uiMode, routePath, routeSearch });
    case "get_context_capabilities":
      return getContextCapabilities(dbClient, appUser, contextType, contextId);
    case "explain_feature_availability":
      return explainFeatureAvailability(dbClient, appUser, contextType, contextId, args, userMessage);
    case "search_context_entities":
      return searchContextEntities(dbClient, appUser, contextType, contextId, args, userMessage);
    case "get_navigation_help":
      return getNavigationHelp(dbClient, appUser, contextType, contextId, args, userMessage);
    case "list_pending_invites":
      return listPendingInvites(dbClient, appUser, contextType, contextId, args);
    case "list_my_memberships":
      return listMyMemberships(dbClient, appUser, contextType, contextId);
    case "list_pending_decisions":
      return listPendingDecisions(dbClient, appUser, contextType, contextId, args);
    case "get_today_deadlines":
      return getTodayDeadlines(dbClient, appUser, contextType, contextId, args);
    case "list_blocked_tasks":
      return listBlockedTasks(dbClient, appUser, contextType, contextId, args);
    case "get_task_detail":
      return getTaskDetail(dbClient, appUser, contextType, contextId, args);
    case "list_context_milestones":
      return listContextMilestones(dbClient, appUser, contextType, contextId, args);
    case "get_milestone_detail":
      return getMilestoneDetail(dbClient, appUser, contextType, contextId, args);
    case "list_context_change_requests":
      return listContextChangeRequests(dbClient, appUser, contextType, contextId, args);
    case "get_change_request_detail":
      return getChangeRequestDetail(dbClient, appUser, contextType, contextId, args);
    case "list_context_disputes":
      return listContextDisputes(dbClient, appUser, contextType, contextId, args);
    case "get_dispute_detail":
      return getDisputeDetail(dbClient, appUser, contextType, contextId, args);
    case "get_event_detail":
      return getEventDetail(dbClient, appUser, contextType, contextId, args);
    case "get_operational_day_brief":
      return getOperationalDayBrief(dbClient, appUser, contextType, contextId, { ...args, uiMode });
    case "get_project_summary":
      return getProjectSummary(dbClient, contextId);
    case "list_accessible_projects":
      return listAccessibleProjects(dbClient, appUser, contextType, contextId, args);
    case "list_context_tasks":
      return listContextTasks(dbClient, appUser, contextType, contextId, args);
    case "list_context_schedule":
      return listContextSchedule(dbClient, appUser, contextType, contextId, args);
    case "list_context_participants":
      return listContextParticipants(dbClient, appUser, contextType, contextId, args);
    case "list_context_notifications":
      return listContextNotifications(dbClient, appUser, contextType, contextId, args);
    case "list_context_channels":
      return listContextChannels(dbClient, appUser, contextType, contextId, { ...args, uiMode });
    case "get_channel_detail":
      return getChannelDetail(dbClient, appUser, contextType, contextId, { ...args, uiMode });
    case "list_context_messages":
      return listContextMessages(dbClient, appUser, contextType, contextId, { ...args, uiMode });
    case "get_message_detail":
      return getMessageDetail(dbClient, appUser, contextType, contextId, { ...args, uiMode });
    case "list_mentions_and_followups":
      return listMentionsAndFollowups(dbClient, appUser, contextType, contextId, { ...args, uiMode });
    case "get_notification_preferences":
      return getNotificationPreferences(dbClient, appUser, contextType, contextId, args);
    case "list_context_documents":
      return listContextDocuments(dbClient, appUser, contextType, contextId, args);
    case "search_context_documents":
      return searchContextDocuments(dbClient, appUser, contextType, contextId, args);
    case "get_document_detail":
      return getDocumentDetail(dbClient, appUser, contextType, contextId, args);
    case "get_document_revision_history":
      return getDocumentRevisionHistory(dbClient, appUser, contextType, contextId, args);
    case "get_document_workflow_status":
      return getDocumentWorkflowStatus(dbClient, appUser, contextType, contextId, args);
    case "list_document_comments":
      return listDocumentComments(dbClient, appUser, contextType, contextId, args);
    case "list_document_approvals":
      return listDocumentApprovals(dbClient, appUser, contextType, contextId, args);
    case "list_document_revision_events":
      return listDocumentRevisionEvents(dbClient, appUser, contextType, contextId, args);
    case "get_context_finance_snapshot":
      return getContextFinanceSnapshot(dbClient, appUser, contextType, contextId, args);
    case "list_budget_watchpoints":
      return listBudgetWatchpoints(dbClient, appUser, contextType, contextId, args);
    case "list_cost_entries":
      return listCostEntries(dbClient, appUser, contextType, contextId, args);
    case "list_context_labor_rates":
      return listContextLaborRates(dbClient, appUser, contextType, contextId, args);
    case "get_project_financial_settings":
      return getProjectFinancialSettings(dbClient, appUser, contextType, contextId, args);
    case "list_progress_statements":
      return listProgressStatements(dbClient, appUser, contextType, contextId, args);
    case "get_progress_statement_detail":
      return getProgressStatementDetail(dbClient, appUser, contextType, contextId, args);
    case "list_progress_statement_notes":
      return listProgressStatementNotes(dbClient, appUser, contextType, contextId, args);
    case "list_project_company_commercials":
      return listProjectCompanyCommercials(dbClient, appUser, contextType, contextId, args);
    case "list_context_work_sessions":
      return listContextWorkSessions(dbClient, appUser, contextType, contextId, args);
    case "get_my_profile_summary":
      return getMyProfileSummary(dbClient, appUser, contextType, contextId);
    case "get_personal_workspace_brief":
      return getPersonalWorkspaceBrief(dbClient, appUser, contextType, contextId, args);
    case "list_company_projects":
      return listCompanyProjects(dbClient, appUser, contextType, contextId, args);
    case "list_company_members":
      return listCompanyMembers(dbClient, appUser, contextType, contextId, args);
    case "list_company_channels":
      return listCompanyChannels(dbClient, appUser, contextType, contextId, { ...args, uiMode });
    case "list_company_documents":
      return listCompanyDocuments(dbClient, appUser, contextType, contextId, args);
    case "get_company_subscription_status":
      return getCompanySubscriptionStatus(dbClient, appUser, contextType, contextId);
    case "get_project_sponsorship_status":
      return getProjectSponsorshipStatus(dbClient, appUser, contextType, contextId, args);
    case "list_recent_updates":
      return listRecentUpdates(dbClient, appUser, contextType, contextId, args);
    case "get_context_notes":
      return getContextNotes(dbClient, contextType, contextId, args);
    default:
      return {
        success: false,
        error: `Unsupported tool: ${toolName}`,
      };
  }
}

async function getCurrentContextState(dbClient, appUser, contextType, contextId, options = {}) {
  const assistantChatScope = deriveAssistantChatScope(appUser);
  const scopeType = assistantChatScope?.type || contextType;
  const scopeId = assistantChatScope?.id || contextId;
  const hasDistinctFocus = scopeType !== contextType || scopeId !== contextId;
  const routeInfo = describeAssistantRoute(options?.routePath, options?.routeSearch, contextType, contextId, options?.uiMode);

  const [contextInfo, focusContextInfo, actingRole, activeCompanyName, routeProjectNameById] = await Promise.all([
    loadAssistantContextInfo(dbClient, appUser, scopeType, scopeId),
    hasDistinctFocus ? loadAssistantContextInfo(dbClient, appUser, contextType, contextId) : Promise.resolve(null),
    loadAssistantActingRole(dbClient, appUser, contextType, contextId),
    appUser?.active_company_id ? loadCompanyNameById(dbClient, [appUser.active_company_id]) : Promise.resolve(new Map()),
    routeInfo.project_id ? loadProjectNameById(dbClient, [routeInfo.project_id]) : Promise.resolve(new Map()),
  ]);
  const activeCompanyId = appUser?.active_company_id || null;
  const route = {
    ...routeInfo,
    project_name: routeInfo.project_id ? routeProjectNameById.get(routeInfo.project_id) || null : null,
  };

  return {
    context_type: scopeType,
    context_id: scopeId,
    focus_context_type: contextType,
    focus_context_id: contextId,
    ui_mode: normalizeAssistantUiMode(options?.uiMode),
    active_context: appUser?.active_context || "personal",
    assistant_mode: deriveAssistantContextMode(appUser, contextType),
    route,
    context: contextInfo,
    focus_context: focusContextInfo,
    acting_as: {
      app_role: appUser?.role || "normal",
      active_company_id: activeCompanyId,
      active_company_name: activeCompanyId ? activeCompanyName.get(activeCompanyId) || activeCompanyId : null,
      participant_type: actingRole?.participant_type || null,
      role: actingRole?.role || null,
      membership_role: actingRole?.membership_role || null,
      status: actingRole?.status || null,
      company_id: actingRole?.company_id || null,
      company_name: actingRole?.company_name || null,
    },
  };
}

async function getContextCapabilities(dbClient, appUser, contextType, contextId) {
  if (contextType === "personal") {
    const projects = await getContextProjects(dbClient, appUser, contextType, contextId);
    const notificationsResult = appUser?.email
      ? await dbClient
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_email", appUser.email)
      : { count: 0, error: null };

    if (notificationsResult.error) throw notificationsResult.error;

    return {
      context_type: contextType,
      context_id: contextId,
      pricing: null,
      counts: {
        enabled: PERSONAL_CONTEXT_CAPABILITIES.length,
        limited: 0,
        disabled: 0,
      },
      capabilities: PERSONAL_CONTEXT_CAPABILITIES.map((capability) => ({
        ...capability,
        access_level: "enabled",
        available: true,
        limits: [],
        navigation: {
          label: "Dashboard",
          path: "/app/Dashboard",
        },
      })),
      summary: {
        accessible_projects_count: projects.length,
        notifications_count: notificationsResult.count || 0,
      },
    };
  }

  const featureCatalog = await loadAssistantFeatureCatalog(dbClient, contextType);
  const pricingStatus = contextType === "project"
    ? await resolveProjectPricingStatus(dbClient, contextId)
    : null;

  const capabilities = await Promise.all(featureCatalog.map(async (feature) => {
    const access = await resolveFeatureAccessForContext(dbClient, contextType, contextId, feature.feature_key);
    return buildCapabilityEntry(feature, access, contextType, contextId, pricingStatus);
  }));

  return {
    context_type: contextType,
    context_id: contextId,
    pricing: pricingStatus,
    counts: {
      enabled: capabilities.filter((capability) => capability.access_level === "enabled").length,
      limited: capabilities.filter((capability) => capability.access_level === "limited").length,
      disabled: capabilities.filter((capability) => capability.access_level === "disabled").length,
    },
    capabilities,
  };
}

async function explainFeatureAvailability(dbClient, appUser, contextType, contextId, args = {}, userMessage = "") {
  const featureKey = normalizeFeatureKey(args?.feature_key)
    || inferFeatureKeyFromText(args?.feature_hint || userMessage, contextType);

  if (!featureKey) {
    return {
      context_type: contextType,
      context_id: contextId,
      available: false,
      reason_code: "feature_not_resolved",
      message: "The assistant could not resolve which feature to explain from the current request.",
    };
  }

  const featureMeta = await loadFeatureMetadataByKey(dbClient, featureKey);
  const expectedScopeType = resolveExpectedFeatureScopeType(featureMeta, featureKey);
  const navigation = buildFeatureNavigationHint(featureKey, contextType, contextId, appUser?.active_company_id || null);

  if (expectedScopeType && expectedScopeType !== contextType) {
    return {
      context_type: contextType,
      context_id: contextId,
      feature_key: featureKey,
      feature_name: featureMeta?.name || humanizeFeatureKey(featureKey),
      feature_scope_type: expectedScopeType,
      access_level: "unavailable_in_current_context",
      available: false,
      reason_code: "wrong_context",
      message: buildWrongContextExplanation(featureMeta?.name || humanizeFeatureKey(featureKey), expectedScopeType),
      suggested_context_type: expectedScopeType,
      navigation,
    };
  }

  if (!expectedScopeType && contextType === "personal") {
    return {
      context_type: contextType,
      context_id: contextId,
      feature_key: featureKey,
      feature_name: humanizeFeatureKey(featureKey),
      access_level: "unknown",
      available: false,
      reason_code: "feature_unknown",
      message: "This feature is not part of the current assistant capability catalog.",
      navigation,
    };
  }

  const pricingStatus = contextType === "project"
    ? await resolveProjectPricingStatus(dbClient, contextId)
    : null;
  const featureAccess = expectedScopeType
    ? await resolveFeatureAccessForContext(dbClient, contextType, contextId, featureKey)
    : null;
  const explanation = buildFeatureAvailabilityExplanation({
    featureKey,
    featureName: featureMeta?.name || humanizeFeatureKey(featureKey),
    contextType,
    featureAccess,
    pricingStatus,
  });

  return {
    context_type: contextType,
    context_id: contextId,
    feature_key: featureKey,
    feature_name: featureMeta?.name || humanizeFeatureKey(featureKey),
    feature_scope_type: expectedScopeType,
    access_level: explanation.access_level,
    available: explanation.available,
    reason_code: explanation.reason_code,
    plan_code: featureAccess?.plan_code || null,
    config: featureAccess?.config || {},
    limits: summarizeFeatureConfig(featureAccess?.config),
    pricing: pricingStatus,
    message: explanation.message,
    navigation,
  };
}

async function searchContextEntities(dbClient, appUser, contextType, contextId, args = {}, userMessage = "") {
  const query = String(args?.query || userMessage || "").trim();
  const limit = clampLimit(args?.limit, 8, 15);
  const requestedTypes = normalizeAssistantEntityTypes(args?.entity_types);

  if (!query) {
    return {
      context_type: contextType,
      context_id: contextId,
      query,
      counts: {},
      results: [],
      message: "A search query is required to search the current context.",
    };
  }

  const includeType = (type) => requestedTypes.length === 0 || requestedTypes.includes(type);
  const results = [];
  const pushSearchResult = (entry, ...fields) => {
    const score = computeAssistantSearchScore(fields, query);
    if (score <= 0) {
      return;
    }

    results.push({
      ...entry,
      score,
    });
  };

  const [contextProjects, tasksSnapshot, scheduleSnapshot, participantsSnapshot, documents, memberships] = await Promise.all([
    getContextProjects(dbClient, appUser, contextType, contextId),
    includeType("task") ? listContextTasks(dbClient, appUser, contextType, contextId, { limit: 15 }) : Promise.resolve({ tasks: [] }),
    includeType("event") ? listContextSchedule(dbClient, appUser, contextType, contextId, { limit: 15, include_past: true }) : Promise.resolve({ schedule: [] }),
    includeType("participant") && contextType !== "personal"
      ? listContextParticipants(dbClient, appUser, contextType, contextId, { limit: 20 })
      : Promise.resolve({ participants: [] }),
    includeType("document") ? loadContextDocuments(dbClient, appUser, contextType, contextId, { limit: 20 }) : Promise.resolve([]),
    includeType("membership") ? listMyMemberships(dbClient, appUser, contextType, contextId) : Promise.resolve({ memberships: [] }),
  ]);

  if (includeType("project")) {
    contextProjects.forEach((project) => {
      pushSearchResult(
        {
          entity_type: "project",
          id: project.id,
          title: project.name || "Cantiere",
          summary: [project.status, project.address].filter(Boolean).join(" · ") || "Cantiere accessibile nel contesto corrente",
          path: buildProjectPath(project.id),
        },
        project.name,
        project.address,
        project.description,
        project.status,
      );
    });
  }

  (tasksSnapshot.tasks || []).forEach((task) => {
    pushSearchResult(
      {
        entity_type: "task",
        id: task.id,
        title: task.title || "Task",
        summary: [task.status, task.project_name, task.room_area, task.assignment].filter(Boolean).join(" · "),
        path: task.path,
      },
      task.title,
      task.project_name,
      task.room_area,
      task.assignment,
      task.blocked_reason,
    );
  });

  (documents || []).forEach((document) => {
    pushSearchResult(
      {
        entity_type: "document",
        id: document.id,
        title: document.name || "Documento",
        summary: [document.document_status, previewText(document.description, 140)].filter(Boolean).join(" · "),
        path: document.path,
      },
      document.name,
      document.description,
      document.document_status,
      document.project_name,
    );
  });

  (participantsSnapshot.participants || []).forEach((participant) => {
    pushSearchResult(
      {
        entity_type: "participant",
        id: participant.email || participant.company_id || participant.name,
        title: participant.name || participant.email || participant.company_id || "Partecipante",
        summary: [participant.role, participant.profession, participant.status].filter(Boolean).join(" · "),
        path: participant.path,
      },
      participant.name,
      participant.email,
      participant.company_id,
      participant.role,
      participant.profession,
      participant.status,
    );
  });

  (scheduleSnapshot.schedule || []).forEach((event) => {
    pushSearchResult(
      {
        entity_type: "event",
        id: event.id,
        title: event.title || "Evento",
        summary: [event.status, event.start_datetime, event.location, event.summary].filter(Boolean).join(" · "),
        path: event.path,
      },
      event.title,
      event.location,
      event.status,
      event.summary,
    );
  });

  (memberships.memberships || []).forEach((membership) => {
    pushSearchResult(
      {
        entity_type: "membership",
        id: membership.id || `${membership.membership_type}:${membership.context_id || membership.company_id || membership.project_id}`,
        title: membership.name || membership.context_name || membership.company_name || membership.project_name || "Membership",
        summary: [membership.membership_type, membership.role, membership.status].filter(Boolean).join(" · "),
        path: membership.path,
      },
      membership.name,
      membership.context_name,
      membership.company_name,
      membership.project_name,
      membership.role,
      membership.status,
    );
  });

  const sortedResults = results
    .sort((left, right) => {
      if ((right.score || 0) !== (left.score || 0)) {
        return (right.score || 0) - (left.score || 0);
      }
      return String(left.title || "").localeCompare(String(right.title || ""));
    })
    .slice(0, limit)
    .map(({ score, ...entry }) => entry);

  return {
    context_type: contextType,
    context_id: contextId,
    query,
    counts: countByField(sortedResults, "entity_type"),
    results: sortedResults,
  };
}

async function getNavigationHelp(dbClient, appUser, contextType, contextId, args = {}, userMessage = "") {
  const topic = String(args?.topic || userMessage || "").trim();
  const featureKey = normalizeFeatureKey(args?.feature_key)
    || inferFeatureKeyFromText(topic, contextType);

  if (featureKey) {
    const featureMeta = await loadFeatureMetadataByKey(dbClient, featureKey);
    const expectedScopeType = resolveExpectedFeatureScopeType(featureMeta, featureKey);

    if (expectedScopeType && expectedScopeType !== contextType) {
      const suggestedContextId = expectedScopeType === "company"
        ? appUser?.active_company_id || contextId
        : contextId;
      const navigation = buildFeatureNavigationHint(featureKey, expectedScopeType, suggestedContextId);

      return {
        context_type: contextType,
        context_id: contextId,
        topic,
        topic_key: featureKey,
        label: featureMeta?.name || humanizeFeatureKey(featureKey),
        navigation,
        explanation: buildWrongContextExplanation(featureMeta?.name || humanizeFeatureKey(featureKey), expectedScopeType),
        suggestions: buildDefaultNavigationSuggestions(expectedScopeType, suggestedContextId),
      };
    }

    const navigation = buildFeatureNavigationHint(featureKey, contextType, contextId);

    return {
      context_type: contextType,
      context_id: contextId,
      topic,
      topic_key: featureKey,
      label: featureMeta?.name || humanizeFeatureKey(featureKey),
      navigation,
      explanation: `Apri ${navigation.label} per raggiungere ${featureMeta?.name || humanizeFeatureKey(featureKey)} nel contesto corrente.`,
      suggestions: buildDefaultNavigationSuggestions(contextType, contextId),
    };
  }

  const matchedTopic = NAVIGATION_HELP_TOPICS.find((candidate) => candidate.pattern.test(topic));
  if (matchedTopic) {
    return {
      context_type: contextType,
      context_id: contextId,
      topic,
      topic_key: matchedTopic.topic_key,
      label: matchedTopic.label,
      navigation: {
        label: matchedTopic.label,
        path: matchedTopic.buildPath(contextId, appUser),
      },
      explanation: matchedTopic.description,
      suggestions: buildDefaultNavigationSuggestions(contextType, contextId),
    };
  }

  return {
    context_type: contextType,
    context_id: contextId,
    topic,
    label: contextType === "project" ? "Scheda cantiere" : contextType === "company" ? "Scheda societa" : "Dashboard",
    navigation: {
      label: contextType === "project" ? "Scheda cantiere" : contextType === "company" ? "Scheda societa" : "Dashboard",
      path: buildDefaultContextPath(contextType, contextId, "normal"),
    },
    explanation: "Apri il percorso principale del contesto corrente e da li entra nella sezione specifica che ti serve.",
    suggestions: buildDefaultNavigationSuggestions(contextType, contextId),
  };
}

async function listPendingInvites(dbClient, appUser, contextType, contextId, options = {}) {
  const limit = clampLimit(options?.limit, 8, 15);
  const invites = await loadPendingInvites(dbClient, appUser, contextType, contextId);

  return {
    context_type: contextType,
    context_id: contextId,
    counts: {
      total: invites.length,
      by_type: countByField(invites, "invite_type"),
    },
    invites: invites.slice(0, limit),
  };
}

async function listMyMemberships(dbClient, appUser, contextType, contextId) {
  if (!appUser?.email) {
    return {
      context_type: contextType,
      context_id: contextId,
      memberships: [],
    };
  }

  const [companyMembershipsResult, personalProjectMembershipsResult] = await Promise.all([
    dbClient
      .from("company_members")
      .select("id,company_id,user_email,role,profession,company_member_role,status")
      .eq("user_email", appUser.email)
      .in("status", ["active", "invited"]),
    dbClient
      .from("project_participants")
      .select("id,project_id,participant_type,user_email,project_role,status")
      .eq("participant_type", "personal")
      .eq("user_email", appUser.email)
      .in("status", ["active", "invited"]),
  ]);

  if (companyMembershipsResult.error) throw companyMembershipsResult.error;
  if (personalProjectMembershipsResult.error) throw personalProjectMembershipsResult.error;

  const companyMemberships = companyMembershipsResult.data || [];
  const personalProjectMemberships = personalProjectMembershipsResult.data || [];
  const companyIds = uniqueValues(companyMemberships.map((membership) => membership.company_id));

  const companyProjectMembershipsResult = companyIds.length > 0
    ? await dbClient
      .from("project_participants")
      .select("id,project_id,participant_type,company_id,project_role,status")
      .eq("participant_type", "company")
      .in("company_id", companyIds)
      .in("status", ["active", "invited"])
    : { data: [], error: null };

  if (companyProjectMembershipsResult.error) throw companyProjectMembershipsResult.error;

  const projectNameById = await loadProjectNameById(dbClient, [
    ...personalProjectMemberships.map((membership) => membership.project_id),
    ...(companyProjectMembershipsResult.data || []).map((membership) => membership.project_id),
  ]);
  const companyNameById = await loadCompanyNameById(dbClient, companyIds);

  const memberships = [
    ...companyMemberships.map((membership) => ({
      id: membership.id,
      membership_type: "company_membership",
      name: companyNameById.get(membership.company_id) || membership.company_id || "Societa",
      company_id: membership.company_id,
      company_name: companyNameById.get(membership.company_id) || membership.company_id || "Societa",
      role: [membership.role, membership.company_member_role || membership.profession].filter(Boolean).join(" · "),
      status: membership.status,
      path: buildCompanyPath(membership.company_id),
      is_current_context: contextType === "company" && membership.company_id === contextId,
    })),
    ...personalProjectMemberships.map((membership) => ({
      id: membership.id,
      membership_type: "project_membership_personal",
      name: projectNameById.get(membership.project_id) || membership.project_id || "Cantiere",
      project_id: membership.project_id,
      project_name: projectNameById.get(membership.project_id) || membership.project_id || "Cantiere",
      role: membership.project_role,
      status: membership.status,
      path: buildProjectPath(membership.project_id),
      is_current_context: contextType === "project" && membership.project_id === contextId,
    })),
    ...(companyProjectMembershipsResult.data || []).map((membership) => ({
      id: membership.id,
      membership_type: "project_membership_company",
      name: projectNameById.get(membership.project_id) || membership.project_id || "Cantiere",
      company_id: membership.company_id,
      company_name: companyNameById.get(membership.company_id) || membership.company_id || "Societa",
      project_id: membership.project_id,
      project_name: projectNameById.get(membership.project_id) || membership.project_id || "Cantiere",
      role: [membership.project_role, companyNameById.get(membership.company_id) || membership.company_id].filter(Boolean).join(" · "),
      status: membership.status,
      path: buildProjectPath(membership.project_id),
      is_current_context: contextType === "project" && membership.project_id === contextId,
    })),
  ]
    .sort(compareAssistantMemberships);

  return {
    context_type: contextType,
    context_id: contextId,
    counts: {
      total: memberships.length,
      by_type: countByField(memberships, "membership_type"),
      by_status: countByField(memberships, "status"),
    },
    memberships,
  };
}

async function listPendingDecisions(dbClient, appUser, contextType, contextId, options = {}) {
  const limit = clampLimit(options?.limit, 8, 15);
  const decisions = [];
  const pendingInvites = await loadPendingInvites(dbClient, appUser, contextType, contextId);

  pendingInvites.forEach((invite) => {
    decisions.push({
      decision_type: "invite_response",
      id: invite.id,
      title: invite.title,
      summary: invite.summary,
      status: invite.status,
      path: invite.path,
    });
  });

  if (contextType === "project" || contextType === "company") {
    const documents = await loadContextDocuments(dbClient, appUser, contextType, contextId, { limit: 25 });
    const documentIds = uniqueValues(documents.map((document) => document.id));
    if (documentIds.length > 0) {
      const approvalsResult = await dbClient
        .from("document_approvals")
        .select("id,document_id,status,requested_by_email,created_date")
        .in("document_id", documentIds)
        .eq("status", "pending")
        .limit(limit);

      if (approvalsResult.error) throw approvalsResult.error;

      const documentById = new Map(documents.map((document) => [document.id, document]));
      (approvalsResult.data || []).forEach((approval) => {
        const document = documentById.get(approval.document_id);
        decisions.push({
          decision_type: "document_approval",
          id: approval.id,
          title: document?.name || "Approvazione documento",
          summary: [approval.status, approval.requested_by_email, document?.project_name].filter(Boolean).join(" · "),
          status: approval.status,
          path: document?.path || (contextType === "project" ? buildProjectDocumentsPath(contextId) : buildCompanyDocumentsPath(contextId)),
        });
      });
    }
  }

  const pendingChangesQuery = dbClient
    .from("change_requests")
    .select("id,project_id,title,status,assigned_user_email,assigned_company_id,assigned_company_name")
    .in("status", ["pending", "clarification_needed"]);

  let filteredChangesQuery = pendingChangesQuery;
  if (contextType === "project") {
    filteredChangesQuery = filteredChangesQuery.eq("project_id", contextId);
  } else if (contextType === "company") {
    filteredChangesQuery = filteredChangesQuery.eq("assigned_company_id", contextId);
  } else if (appUser?.email) {
    filteredChangesQuery = filteredChangesQuery.eq("assigned_user_email", appUser.email);
  }

  const changesResult = await filteredChangesQuery.limit(limit);
  if (changesResult.error) throw changesResult.error;

  const changeProjectNameById = await loadProjectNameById(dbClient, (changesResult.data || []).map((change) => change.project_id));
  (changesResult.data || []).forEach((change) => {
    decisions.push({
      decision_type: "change_request",
      id: change.id,
      title: change.title || "Variante",
      summary: [change.status, changeProjectNameById.get(change.project_id), change.assigned_company_name, change.assigned_user_email].filter(Boolean).join(" · "),
      status: change.status,
      path: `${buildProjectPath(change.project_id)}&tab=lavori&section=changes`,
    });
  });

  if (contextType === "project") {
    const [disputesResult, eventsResult] = await Promise.all([
      dbClient
        .from("dispute_cases")
        .select("id,title,status,summary,project_id")
        .eq("project_id", contextId)
        .in("status", ["open", "awaiting_response", "in_review", "escalated"])
        .limit(limit),
      dbClient
        .from("events")
        .select("id,title,status,start_datetime,owner_project_id")
        .eq("owner_project_id", contextId)
        .eq("status", "pending_confirmation")
        .limit(limit),
    ]);

    if (disputesResult.error) throw disputesResult.error;
    if (eventsResult.error) throw eventsResult.error;

    (disputesResult.data || []).forEach((dispute) => {
      decisions.push({
        decision_type: "dispute_case",
        id: dispute.id,
        title: dispute.title || "Disputa",
        summary: [dispute.status, previewText(dispute.summary, 140)].filter(Boolean).join(" · "),
        status: dispute.status,
        path: `${buildProjectPath(contextId)}&tab=lavori&section=disputes`,
      });
    });

    (eventsResult.data || []).forEach((event) => {
      decisions.push({
        decision_type: "event_confirmation",
        id: event.id,
        title: event.title || "Evento da confermare",
        summary: [event.status, event.start_datetime].filter(Boolean).join(" · "),
        status: event.status,
        path: "/app/Calendar",
      });
    });
  } else if (contextType === "company") {
    const eventsResult = await dbClient
      .from("events")
      .select("id,title,status,start_datetime,owner_company_id")
      .eq("owner_company_id", contextId)
      .eq("status", "pending_confirmation")
      .limit(limit);

    if (eventsResult.error) throw eventsResult.error;

    (eventsResult.data || []).forEach((event) => {
      decisions.push({
        decision_type: "event_confirmation",
        id: event.id,
        title: event.title || "Evento da confermare",
        summary: [event.status, event.start_datetime].filter(Boolean).join(" · "),
        status: event.status,
        path: "/app/Calendar",
      });
    });
  } else if (appUser?.id) {
    const eventsResult = await dbClient
      .from("events")
      .select("id,title,status,start_datetime,owner_user_id")
      .eq("owner_type", "personal")
      .eq("owner_user_id", appUser.id)
      .eq("status", "pending_confirmation")
      .limit(limit);

    if (eventsResult.error) throw eventsResult.error;

    (eventsResult.data || []).forEach((event) => {
      decisions.push({
        decision_type: "event_confirmation",
        id: event.id,
        title: event.title || "Evento da confermare",
        summary: [event.status, event.start_datetime].filter(Boolean).join(" · "),
        status: event.status,
        path: "/app/Calendar",
      });
    });
  }

  const uniqueDecisions = dedupeAssistantItems(decisions, (decision) => `${decision.decision_type}:${decision.id}`)
    .sort(compareAssistantDecisions)
    .slice(0, limit);

  return {
    context_type: contextType,
    context_id: contextId,
    counts: {
      total: uniqueDecisions.length,
      by_type: countByField(uniqueDecisions, "decision_type"),
      by_status: countByField(uniqueDecisions, "status"),
    },
    decisions: uniqueDecisions,
  };
}

async function loadPendingInvites(dbClient, appUser, contextType, contextId) {
  const invites = [];

  const [personalCompanyMembershipsResult, personalProjectInvitesResult] = appUser?.email
    ? await Promise.all([
      dbClient
        .from("company_members")
        .select("id,company_id,user_email,role,profession,company_member_role,status")
        .eq("user_email", appUser.email)
        .eq("status", "invited"),
      dbClient
        .from("project_participants")
        .select("id,project_id,participant_type,user_email,company_id,project_role,status")
        .eq("participant_type", "personal")
        .eq("user_email", appUser.email)
        .eq("status", "invited"),
    ])
    : [{ data: [], error: null }, { data: [], error: null }];

  if (personalCompanyMembershipsResult.error) throw personalCompanyMembershipsResult.error;
  if (personalProjectInvitesResult.error) throw personalProjectInvitesResult.error;

  const activeCompanyMembershipsResult = appUser?.email
    ? await dbClient
      .from("company_members")
      .select("company_id,status")
      .eq("user_email", appUser.email)
      .eq("status", "active")
    : { data: [], error: null };

  if (activeCompanyMembershipsResult.error) throw activeCompanyMembershipsResult.error;

  const activeCompanyIds = uniqueValues([
    ...(contextType === "company" ? [contextId] : []),
    ...(activeCompanyMembershipsResult.data || []).map((membership) => membership.company_id),
  ]);

  let scopedProjectInvites = [];
  let scopedEventInvites = [];

  if (contextType === "project") {
    const [projectInvitesResult, projectEventsResult] = await Promise.all([
      dbClient
        .from("project_participants")
        .select("id,project_id,participant_type,user_email,company_id,project_role,status")
        .eq("project_id", contextId)
        .eq("status", "invited"),
      dbClient
        .from("events")
        .select("id")
        .eq("owner_project_id", contextId),
    ]);

    if (projectInvitesResult.error) throw projectInvitesResult.error;
    if (projectEventsResult.error) throw projectEventsResult.error;

    scopedProjectInvites = projectInvitesResult.data || [];
    const projectEventIds = uniqueValues((projectEventsResult.data || []).map((event) => event.id));

    if (projectEventIds.length > 0) {
      const eventInvitesResult = await dbClient
        .from("event_participants")
        .select("id,event_id,participant_type,user_email,company_id,status")
        .in("event_id", projectEventIds)
        .eq("status", "pending");

      if (eventInvitesResult.error) throw eventInvitesResult.error;
      scopedEventInvites = eventInvitesResult.data || [];
    }
  } else if (contextType === "company") {
    const [companyMemberInvitesResult, companyProjectInvitesResult, companyEventInvitesResult] = await Promise.all([
      dbClient
        .from("company_members")
        .select("id,company_id,user_email,role,profession,company_member_role,status")
        .eq("company_id", contextId)
        .eq("status", "invited"),
      dbClient
        .from("project_participants")
        .select("id,project_id,participant_type,user_email,company_id,project_role,status")
        .eq("participant_type", "company")
        .eq("company_id", contextId)
        .eq("status", "invited"),
      dbClient
        .from("event_participants")
        .select("id,event_id,participant_type,user_email,company_id,status")
        .eq("participant_type", "company")
        .eq("company_id", contextId)
        .eq("status", "pending"),
    ]);

    if (companyMemberInvitesResult.error) throw companyMemberInvitesResult.error;
    if (companyProjectInvitesResult.error) throw companyProjectInvitesResult.error;
    if (companyEventInvitesResult.error) throw companyEventInvitesResult.error;

    invites.push(...(companyMemberInvitesResult.data || []).map((membership) => ({
      invite_type: "company_membership",
      id: membership.id,
      company_id: membership.company_id,
      user_email: membership.user_email,
      role: [membership.role, membership.company_member_role || membership.profession].filter(Boolean).join(" · "),
      status: membership.status,
    })));
    scopedProjectInvites = companyProjectInvitesResult.data || [];
    scopedEventInvites = companyEventInvitesResult.data || [];
  } else {
    if (activeCompanyIds.length > 0) {
      const [companyProjectInvitesResult, companyEventInvitesResult] = await Promise.all([
        dbClient
          .from("project_participants")
          .select("id,project_id,participant_type,user_email,company_id,project_role,status")
          .eq("participant_type", "company")
          .in("company_id", activeCompanyIds)
          .eq("status", "invited"),
        dbClient
          .from("event_participants")
          .select("id,event_id,participant_type,user_email,company_id,status")
          .eq("participant_type", "company")
          .in("company_id", activeCompanyIds)
          .eq("status", "pending"),
      ]);

      if (companyProjectInvitesResult.error) throw companyProjectInvitesResult.error;
      if (companyEventInvitesResult.error) throw companyEventInvitesResult.error;

      scopedProjectInvites = companyProjectInvitesResult.data || [];
      scopedEventInvites = companyEventInvitesResult.data || [];
    }

    if (appUser?.email) {
      const eventInvitesResult = await dbClient
        .from("event_participants")
        .select("id,event_id,participant_type,user_email,company_id,status")
        .eq("participant_type", "user")
        .eq("user_email", appUser.email)
        .eq("status", "pending");

      if (eventInvitesResult.error) throw eventInvitesResult.error;
      scopedEventInvites.push(...(eventInvitesResult.data || []));
    }
  }

  invites.push(...(personalCompanyMembershipsResult.data || []).map((membership) => ({
    invite_type: "company_membership",
    id: membership.id,
    company_id: membership.company_id,
    user_email: membership.user_email,
    role: [membership.role, membership.company_member_role || membership.profession].filter(Boolean).join(" · "),
    status: membership.status,
  })));

  invites.push(...(personalProjectInvitesResult.data || []).map((invite) => ({
    invite_type: "project_invite",
    id: invite.id,
    project_id: invite.project_id,
    participant_type: invite.participant_type,
    user_email: invite.user_email,
    company_id: invite.company_id,
    role: invite.project_role,
    status: invite.status,
  })));

  invites.push(...scopedProjectInvites.map((invite) => ({
    invite_type: "project_invite",
    id: invite.id,
    project_id: invite.project_id,
    participant_type: invite.participant_type,
    user_email: invite.user_email,
    company_id: invite.company_id,
    role: invite.project_role,
    status: invite.status,
  })));

  invites.push(...scopedEventInvites.map((invite) => ({
    invite_type: "event_invite",
    id: invite.id,
    event_id: invite.event_id,
    participant_type: invite.participant_type,
    user_email: invite.user_email,
    company_id: invite.company_id,
    status: invite.status,
  })));

  const projectNameById = await loadProjectNameById(dbClient, invites.map((invite) => invite.project_id));
  const companyNameById = await loadCompanyNameById(dbClient, invites.map((invite) => invite.company_id));
  const userNameByEmail = await loadUserNameByEmail(dbClient, invites.map((invite) => invite.user_email));
  const eventById = await loadEventsById(dbClient, invites.map((invite) => invite.event_id));

  return dedupeAssistantItems(invites, (invite) => `${invite.invite_type}:${invite.id}`)
    .map((invite) => {
      if (invite.invite_type === "company_membership") {
        const companyName = companyNameById.get(invite.company_id) || invite.company_id || "Societa";
        return {
          invite_type: invite.invite_type,
          id: invite.id,
          title: `Invito societa · ${companyName}`,
          summary: [userNameByEmail.get(invite.user_email) || invite.user_email, invite.role].filter(Boolean).join(" · "),
          status: invite.status,
          path: buildCompanyPath(invite.company_id),
        };
      }

      if (invite.invite_type === "project_invite") {
        const projectName = projectNameById.get(invite.project_id) || invite.project_id || "Cantiere";
        const companyName = companyNameById.get(invite.company_id) || invite.company_id || null;
        const invitedName = userNameByEmail.get(invite.user_email) || invite.user_email || null;
        return {
          invite_type: invite.invite_type,
          id: invite.id,
          title: `Invito cantiere · ${projectName}`,
          summary: [invite.role, companyName, invitedName].filter(Boolean).join(" · "),
          status: invite.status,
          path: buildProjectPath(invite.project_id),
        };
      }

      const event = eventById.get(invite.event_id);
      return {
        invite_type: invite.invite_type,
        id: invite.id,
        title: `Invito evento · ${event?.title || invite.event_id || "Evento"}`,
        summary: [event?.start_datetime, event?.location, companyNameById.get(invite.company_id), userNameByEmail.get(invite.user_email) || invite.user_email].filter(Boolean).join(" · "),
        status: invite.status,
        path: event?.owner_project_id
          ? buildProjectPath(event.owner_project_id)
          : event?.owner_company_id
            ? buildCompanyPath(event.owner_company_id)
            : "/app/Calendar",
      };
    })
    .sort(compareAssistantInvites);
}

async function loadAssistantContextInfo(dbClient, appUser, contextType, contextId) {
  if (contextType === "project") {
    const { data, error } = await dbClient
      .from("projects")
      .select("id,name,address,status,owner_type,owner_company_id,owner_user_id")
      .eq("id", contextId)
      .maybeSingle();

    if (error) throw error;

    return {
      type: contextType,
      id: contextId,
      label: "Cantiere",
      name: data?.name || null,
      address: data?.address || null,
      status: data?.status || null,
      owner_type: data?.owner_type || null,
      path: buildProjectPath(contextId),
    };
  }

  if (contextType === "company") {
    const { data, error } = await dbClient
      .from("companies")
      .select("id,name,company_type")
      .eq("id", contextId)
      .maybeSingle();

    if (error) throw error;

    return {
      type: contextType,
      id: contextId,
      label: "Societa",
      name: data?.name || null,
      company_type: data?.company_type || null,
      path: buildCompanyPath(contextId),
    };
  }

  return {
    type: contextType,
    id: contextId,
    label: "Privato",
    name: appUser?.full_name || appUser?.email || null,
    path: "/app/Dashboard",
  };
}

async function loadAssistantActingRole(dbClient, appUser, contextType, contextId) {
  if (contextType === "company") {
    const [membershipResult, companyNameById] = await Promise.all([
      dbClient
        .from("company_members")
        .select("role,status,company_member_role,profession")
        .eq("company_id", contextId)
        .eq("user_email", appUser.email)
        .maybeSingle(),
      loadCompanyNameById(dbClient, [contextId]),
    ]);

    if (membershipResult.error) throw membershipResult.error;

    return {
      participant_type: "company_member",
      role: membershipResult.data?.company_member_role || membershipResult.data?.profession || null,
      membership_role: membershipResult.data?.role || null,
      status: membershipResult.data?.status || null,
      company_id: contextId,
      company_name: companyNameById.get(contextId) || null,
    };
  }

  if (contextType === "project") {
    const isCompanyLens = appUser?.active_context === "company" && appUser?.active_company_id;
    const [participantResult, companyNameById, companyMembershipResult] = await Promise.all([
      isCompanyLens
        ? dbClient
          .from("project_participants")
          .select("participant_type,project_role,status,company_id")
          .eq("project_id", contextId)
          .eq("participant_type", "company")
          .eq("company_id", appUser.active_company_id)
          .in("status", ["active", "invited"])
          .maybeSingle()
        : dbClient
          .from("project_participants")
          .select("participant_type,project_role,status,company_id")
          .eq("project_id", contextId)
          .eq("participant_type", "personal")
          .eq("user_email", appUser.email)
          .in("status", ["active", "invited"])
          .maybeSingle(),
      isCompanyLens ? loadCompanyNameById(dbClient, [appUser.active_company_id]) : Promise.resolve(new Map()),
      isCompanyLens
        ? dbClient
          .from("company_members")
          .select("role,status")
          .eq("company_id", appUser.active_company_id)
          .eq("user_email", appUser.email)
          .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
    ]);

    if (participantResult.error) throw participantResult.error;
    if (companyMembershipResult.error) throw companyMembershipResult.error;

    return {
      participant_type: participantResult.data?.participant_type || (isCompanyLens ? "company" : "personal"),
      role: participantResult.data?.project_role || null,
      membership_role: companyMembershipResult.data?.role || null,
      status: participantResult.data?.status || companyMembershipResult.data?.status || null,
      company_id: participantResult.data?.company_id || (isCompanyLens ? appUser.active_company_id : null),
      company_name: isCompanyLens ? companyNameById.get(appUser.active_company_id) || appUser.active_company_id : null,
    };
  }

  return {
    participant_type: "personal",
    role: appUser?.profession || null,
    membership_role: null,
    status: "active",
    company_id: null,
    company_name: null,
  };
}

async function loadAssistantFeatureCatalog(dbClient, scopeType) {
  const { data, error } = await dbClient
    .from("app_features")
    .select("feature_key,scope_type,name,description,sort_order")
    .eq("scope_type", scopeType)
    .order("sort_order", { ascending: true });

  if (error) throw error;
  return data || [];
}

async function loadFeatureMetadataByKey(dbClient, featureKey) {
  const { data, error } = await dbClient
    .from("app_features")
    .select("feature_key,scope_type,name,description,sort_order")
    .eq("feature_key", featureKey)
    .maybeSingle();

  if (error) throw error;
  return data || null;
}

async function resolveFeatureAccessForContext(dbClient, contextType, contextId, featureKey) {
  if (contextType === "company") {
    const { data, error } = await dbClient.rpc("resolve_company_feature_access", {
      target_company_id: contextId,
      target_feature_key: featureKey,
    });

    if (error) throw error;
    return data || null;
  }

  if (contextType === "project") {
    const { data, error } = await dbClient.rpc("resolve_project_feature_access", {
      target_project_id: contextId,
      target_feature_key: featureKey,
    });

    if (error) throw error;
    return data || null;
  }

  return null;
}

async function resolveProjectPricingStatus(dbClient, projectId) {
  const { data, error } = await dbClient.rpc("resolve_project_pricing_status", {
    target_project_id: projectId,
  });

  if (error) throw error;
  return data || null;
}

function buildCapabilityEntry(feature, featureAccess, contextType, contextId, pricingStatus = null) {
  const featureKey = feature?.feature_key || null;
  const navigation = buildFeatureNavigationHint(featureKey, contextType, contextId);

  return {
    feature_key: featureKey,
    name: feature?.name || humanizeFeatureKey(featureKey),
    description: feature?.description || null,
    access_level: featureAccess?.access_level || "disabled",
    available: ["enabled", "limited"].includes(featureAccess?.access_level),
    plan_code: featureAccess?.plan_code || null,
    config: featureAccess?.config || {},
    limits: summarizeFeatureConfig(featureAccess?.config),
    is_sponsored: featureAccess?.is_sponsored === true,
    sponsor_company_id: featureAccess?.sponsor_company_id || null,
    pricing_status: pricingStatus?.status || null,
    navigation,
  };
}

async function getProjectSummary(dbClient, projectId) {
  const [projectResult, participantsResult, tasksResult, milestonesResult, changesResult, documentsResult] = await Promise.all([
    dbClient.from("projects").select("id,name,address,status,description,start_date,end_date,owner_type,owner_company_id,owner_user_id").eq("id", projectId).maybeSingle(),
    dbClient.from("project_participants").select("participant_type,user_id,user_email,company_id,project_role,status").eq("project_id", projectId).eq("status", "active"),
    dbClient.from("tasks").select("id,status").eq("project_id", projectId),
    dbClient.from("milestones").select("id,title,status,target_date").eq("project_id", projectId),
    dbClient.from("change_requests").select("id,status").eq("project_id", projectId),
    dbClient.from("project_documents").select("id,name,updated_date").eq("project_id", projectId).order("updated_date", { ascending: false }).limit(3),
  ]);

  if (projectResult.error) throw projectResult.error;
  if (participantsResult.error) throw participantsResult.error;
  if (tasksResult.error) throw tasksResult.error;
  if (milestonesResult.error) throw milestonesResult.error;
  if (changesResult.error) throw changesResult.error;
  if (documentsResult.error) throw documentsResult.error;

  if (!projectResult.data?.id) {
    return {
      available: false,
      reason: "project_not_found",
    };
  }

  const tasks = tasksResult.data || [];
  const milestones = milestonesResult.data || [];
  const participants = participantsResult.data || [];
  const changeRequests = changesResult.data || [];
  const homeownerParticipant = participants.find((participant) => participant.project_role === "homeowner") || null;
  const ownerUserIds = uniqueValues([
    projectResult.data.owner_user_id,
    homeownerParticipant?.user_id,
  ]);
  const [companyNameById, userNameByEmail, userNameById] = await Promise.all([
    loadCompanyNameById(dbClient, [projectResult.data.owner_company_id, homeownerParticipant?.company_id]),
    loadUserNameByEmail(dbClient, homeownerParticipant?.user_email ? [homeownerParticipant.user_email] : []),
    loadUserNameById(dbClient, ownerUserIds),
  ]);

  const ownerLabel = resolveProjectOwnerLabel(projectResult.data, homeownerParticipant, userNameById, userNameByEmail, companyNameById);

  const openTaskStatuses = new Set(["not_started", "in_progress", "blocked"]);
  const openTasksCount = tasks.filter((task) => openTaskStatuses.has(task.status)).length;
  const completedTasksCount = tasks.filter((task) => task.status === "completed").length;
  const nextMilestone = milestones
    .filter((milestone) => milestone.status !== "completed")
    .sort((left, right) => String(left.target_date || "9999-12-31").localeCompare(String(right.target_date || "9999-12-31")))[0] || null;

  return {
    available: true,
    project: {
      id: projectResult.data.id,
      name: projectResult.data.name,
      address: projectResult.data.address,
      status: projectResult.data.status,
      description: previewText(projectResult.data.description, 280),
      path: buildProjectPath(projectResult.data.id),
    },
    owner: {
      type: projectResult.data.owner_type || (homeownerParticipant?.participant_type === "company" ? "company" : homeownerParticipant ? "personal" : null),
      company_id: projectResult.data.owner_company_id || homeownerParticipant?.company_id || null,
      user_id: projectResult.data.owner_user_id || homeownerParticipant?.user_id || null,
      user_email: homeownerParticipant?.user_email || null,
      role: homeownerParticipant?.project_role || null,
      label: ownerLabel,
    },
    counts: {
      participants: participants.length,
      tasks_total: tasks.length,
      tasks_open: openTasksCount,
      tasks_completed: completedTasksCount,
      milestones: milestones.length,
      change_requests: changeRequests.length,
    },
    next_milestone: nextMilestone
      ? {
          title: nextMilestone.title,
          status: nextMilestone.status,
          target_date: nextMilestone.target_date,
        }
      : null,
    recent_documents: (documentsResult.data || []).map((document) => ({
      id: document.id,
      name: document.name,
      updated_date: document.updated_date,
      path: buildProjectDocumentsPath(projectResult.data.id),
    })),
  };
}

function resolveProjectOwnerLabel(project, homeownerParticipant, userNameById, userNameByEmail, companyNameById) {
  if (project?.owner_type === "company") {
    return companyNameById.get(project.owner_company_id) || null;
  }

  if (project?.owner_type === "personal") {
    return userNameById.get(project.owner_user_id)
      || userNameByEmail.get(homeownerParticipant?.user_email)
      || null;
  }

  if (homeownerParticipant?.participant_type === "company") {
    return companyNameById.get(homeownerParticipant.company_id) || null;
  }

  if (homeownerParticipant?.participant_type === "personal") {
    return userNameById.get(homeownerParticipant.user_id)
      || userNameByEmail.get(homeownerParticipant.user_email)
      || null;
  }

  return null;
}

async function listAccessibleProjects(dbClient, appUser, contextType, contextId, options = {}) {
  const limit = clampLimit(options?.limit, 5, 10);
  const includeCompleted = options?.include_completed === true;
  const contextProjects = await getContextProjects(dbClient, appUser, contextType, contextId);
  const filteredProjects = (includeCompleted || contextType === "project")
    ? contextProjects
    : contextProjects.filter((project) => project.status !== "completed");
  const sortedProjects = [...filteredProjects].sort(compareAssistantProjects).slice(0, limit);

  return {
    context_type: contextType,
    context_id: contextId,
    counts: countByField(filteredProjects, "status"),
    projects: sortedProjects.map((project) => ({
      id: project.id,
      name: project.name,
      address: project.address,
      status: project.status,
      owner_type: project.owner_type,
      start_date: project.start_date,
      end_date: project.end_date,
      summary: previewText(project.description, 160),
      path: buildProjectPath(project.id),
    })),
  };
}

async function listContextTasks(dbClient, appUser, contextType, contextId, options = {}) {
  const limit = clampLimit(options?.limit, 5, 10);
  const normalizedStatus = normalizeTaskStatus(options?.status);
  const taskRows = await loadAccessibleTasks(dbClient, appUser, contextType, contextId, {
    limit,
    includeCompleted: normalizedStatus === "completed",
    status: normalizedStatus,
  });

  return {
    context_type: contextType,
    context_id: contextId,
    tasks: taskRows.map((task) => ({
      id: task.id,
      title: task.title,
      status: task.status,
      project_id: task.project_id,
      project_name: task.project_name || null,
      due_date: task.due_date,
      room_area: task.room_area,
      assignment: describeTaskAssignment(task),
      blocked_reason: previewText(task.blocked_reason, 120),
      path: buildProjectTasksPath(task.project_id),
    })),
  };
}

async function getTodayDeadlines(dbClient, appUser, contextType, contextId, options = {}) {
  const limit = clampLimit(options?.limit, 5, 10);
  const todayKey = new Date().toISOString().slice(0, 10);
  const taskRows = await loadAccessibleTasks(dbClient, appUser, contextType, contextId, {
    limit: 50,
    includeCompleted: false,
  });

  const deadlines = taskRows
    .filter((task) => isTaskRelevantToActiveUser(task, appUser))
    .filter((task) => task.due_date === todayKey || task.status === "in_progress")
    .sort(compareTodayDeadlineTasks)
    .slice(0, limit)
    .map((task) => ({
      id: task.id,
      title: task.title,
      status: task.status,
      project_id: task.project_id,
      project_name: task.project_name || null,
      due_date: task.due_date,
      room_area: task.room_area,
      assignment: describeTaskAssignment(task),
      deadline_type: task.due_date === todayKey ? "due_today" : "in_progress",
      blocked_reason: previewText(task.blocked_reason, 120),
      path: buildProjectTaskDetailPath(task.project_id, task.id),
    }));

  return {
    context_type: contextType,
    context_id: contextId,
    date: todayKey,
    counts: {
      total: deadlines.length,
      due_today: deadlines.filter((entry) => entry.deadline_type === "due_today").length,
      in_progress: deadlines.filter((entry) => entry.deadline_type === "in_progress").length,
    },
    deadlines,
  };
}

async function listBlockedTasks(dbClient, appUser, contextType, contextId, options = {}) {
  const limit = clampLimit(options?.limit, 5, 10);
  const todayKey = new Date().toISOString().slice(0, 10);
  const taskRows = await loadAccessibleTasks(dbClient, appUser, contextType, contextId, {
    limit: 50,
    status: "blocked",
  });

  const tasks = taskRows
    .sort(compareBlockedTasks)
    .slice(0, limit)
    .map((task) => ({
      id: task.id,
      title: task.title,
      project_id: task.project_id,
      project_name: task.project_name || null,
      due_date: task.due_date,
      room_area: task.room_area,
      assignment: describeTaskAssignment(task),
      blocked_date: task.blocked_date,
      blocked_reason: previewText(task.blocked_reason, 180),
      blocked_by: task.blocked_by_name || task.blocked_by_email || null,
      impact: buildTaskImpactSummary(task, todayKey),
      path: buildProjectTaskDetailPath(task.project_id, task.id),
    }));

  return {
    context_type: contextType,
    context_id: contextId,
    counts: {
      total: tasks.length,
      overdue: tasks.filter((task) => task.impact === "overdue").length,
    },
    tasks,
  };
}

async function getTaskDetail(dbClient, appUser, contextType, contextId, args = {}) {
  const resolution = await resolveAccessibleTask(dbClient, appUser, contextType, contextId, {
    taskId: args?.task_id,
    taskHint: args?.task_hint,
  });

  if (!resolution?.task) {
    return {
      context_type: contextType,
      context_id: contextId,
      found: false,
      message: "No accessible task in the current context matched the provided reference.",
    };
  }

  const task = resolution.task;
  const [milestoneResult, disputesResult] = await Promise.all([
    task.milestone_id
      ? dbClient
        .from("milestones")
        .select("id,title,status,target_date")
        .eq("id", task.milestone_id)
        .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    dbClient
      .from("dispute_cases")
      .select("id,title,status")
      .eq("task_id", task.id)
      .limit(5),
  ]);

  if (milestoneResult.error) throw milestoneResult.error;
  if (disputesResult.error) throw disputesResult.error;

  return {
    context_type: contextType,
    context_id: contextId,
    found: true,
    matched_by: resolution.matched_by,
    task: {
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      due_date: task.due_date,
      room_area: task.room_area,
      project_id: task.project_id,
      project_name: task.project_name || null,
      assignment: describeTaskAssignment(task),
      assigned_user_email: task.assigned_user_email,
      assigned_company_id: task.assigned_company_id,
      milestone: milestoneResult.data
        ? {
            id: milestoneResult.data.id,
            title: milestoneResult.data.title,
            status: milestoneResult.data.status,
            target_date: milestoneResult.data.target_date,
          }
        : null,
      block: {
        is_blocked: task.status === "blocked",
        reason: task.blocked_reason || null,
        blocked_date: task.blocked_date || null,
        blocked_by: task.blocked_by_name || task.blocked_by_email || null,
      },
      related_disputes: (disputesResult.data || []).map((dispute) => ({
        id: dispute.id,
        title: dispute.title,
        status: dispute.status,
      })),
      navigation: {
        label: "Task progetto",
        path: buildProjectTaskDetailPath(task.project_id, task.id),
      },
    },
  };
}

async function listContextMilestones(dbClient, appUser, contextType, contextId, options = {}) {
  const limit = clampLimit(options?.limit, 5, 10);
  const normalizedStatus = normalizeMilestoneStatus(options?.status);
  const todayKey = new Date().toISOString().slice(0, 10);
  const milestoneRows = await loadAccessibleMilestones(dbClient, appUser, contextType, contextId, {
    limit: 80,
    status: normalizedStatus,
  });
  const milestoneTaskStats = await loadMilestoneTaskStats(dbClient, milestoneRows.map((milestone) => milestone.id));

  const milestones = milestoneRows
    .sort(compareAssistantMilestones)
    .slice(0, limit)
    .map((milestone) => {
      const taskStats = milestoneTaskStats.get(milestone.id) || { total: 0, completed: 0 };
      return {
        id: milestone.id,
        title: milestone.title,
        description: previewText(milestone.description, 180),
        status: milestone.status,
        project_id: milestone.project_id,
        project_name: milestone.project_name || null,
        start_date: milestone.start_date,
        target_date: milestone.target_date,
        completion_date: milestone.completion_date,
        linked_tasks_count: taskStats.total,
        completed_tasks_count: taskStats.completed,
        is_overdue: milestone.status !== "completed" && milestone.target_date ? milestone.target_date < todayKey : false,
        path: buildProjectMilestoneDetailPath(milestone.project_id, milestone.id),
      };
    });

  return {
    context_type: contextType,
    context_id: contextId,
    counts: {
      total: milestoneRows.length,
      by_status: countByField(milestoneRows, "status"),
    },
    milestones,
  };
}

async function getMilestoneDetail(dbClient, appUser, contextType, contextId, args = {}) {
  const resolution = await resolveAccessibleMilestone(dbClient, appUser, contextType, contextId, {
    milestoneId: args?.milestone_id,
    milestoneHint: args?.milestone_hint,
  });

  if (!resolution?.milestone) {
    return {
      context_type: contextType,
      context_id: contextId,
      found: false,
      message: "No accessible milestone in the current context matched the provided reference.",
    };
  }

  const milestone = resolution.milestone;
  const linkedTasks = await loadAccessibleTasks(dbClient, appUser, "project", milestone.project_id, {
    limit: 80,
    includeCompleted: true,
  });
  const milestoneTasks = linkedTasks.filter((task) => task.milestone_id === milestone.id);

  return {
    context_type: contextType,
    context_id: contextId,
    found: true,
    matched_by: resolution.matched_by,
    milestone: {
      id: milestone.id,
      title: milestone.title,
      description: milestone.description,
      status: milestone.status,
      project_id: milestone.project_id,
      project_name: milestone.project_name || null,
      start_date: milestone.start_date,
      target_date: milestone.target_date,
      completion_date: milestone.completion_date,
      order_index: milestone.order_index,
      linked_tasks_count: milestoneTasks.length,
      completed_tasks_count: milestoneTasks.filter((task) => task.status === "completed").length,
      linked_tasks: milestoneTasks.slice(0, 8).map((task) => ({
        id: task.id,
        title: task.title,
        status: task.status,
        due_date: task.due_date,
        assignment: describeTaskAssignment(task),
        path: buildProjectTaskDetailPath(task.project_id, task.id),
      })),
      navigation: {
        label: "Milestone progetto",
        path: buildProjectMilestoneDetailPath(milestone.project_id, milestone.id),
      },
    },
  };
}

async function listContextChangeRequests(dbClient, appUser, contextType, contextId, options = {}) {
  const limit = clampLimit(options?.limit, 5, 10);
  const normalizedStatus = normalizeChangeRequestStatus(options?.status);
  const requestRows = await loadAccessibleChangeRequests(dbClient, appUser, contextType, contextId, {
    limit: 80,
    status: normalizedStatus,
  });

  return {
    context_type: contextType,
    context_id: contextId,
    counts: {
      total: requestRows.length,
      by_status: countByField(requestRows, "status"),
    },
    change_requests: requestRows
      .sort(compareAssistantChangeRequests)
      .slice(0, limit)
      .map((request) => ({
        id: request.id,
        title: request.title,
        description: previewText(request.description, 180),
        status: request.status,
        project_id: request.project_id,
        project_name: request.project_name || null,
        assignment: describeChangeRequestAssignment(request),
        cost_impact: request.cost_impact,
        time_impact_days: request.time_impact_days,
        requested_by_name: request.requested_by_name || request.requested_by_email || null,
        responded_at: request.responded_at,
        response_note: previewText(request.response_note, 160),
        path: buildProjectChangeRequestDetailPath(request.project_id, request.id),
      })),
  };
}

async function getChangeRequestDetail(dbClient, appUser, contextType, contextId, args = {}) {
  const resolution = await resolveAccessibleChangeRequest(dbClient, appUser, contextType, contextId, {
    changeRequestId: args?.change_request_id,
    changeRequestHint: args?.change_request_hint,
  });

  if (!resolution?.changeRequest) {
    return {
      context_type: contextType,
      context_id: contextId,
      found: false,
      message: "No accessible change request in the current context matched the provided reference.",
    };
  }

  const changeRequest = resolution.changeRequest;
  const disputesResult = await dbClient
    .from("dispute_cases")
    .select("id,title,status")
    .eq("change_request_id", changeRequest.id)
    .limit(5);

  if (disputesResult.error) throw disputesResult.error;

  return {
    context_type: contextType,
    context_id: contextId,
    found: true,
    matched_by: resolution.matched_by,
    change_request: {
      id: changeRequest.id,
      title: changeRequest.title,
      description: changeRequest.description,
      status: changeRequest.status,
      project_id: changeRequest.project_id,
      project_name: changeRequest.project_name || null,
      assignment: describeChangeRequestAssignment(changeRequest),
      cost_impact: changeRequest.cost_impact,
      time_impact_days: changeRequest.time_impact_days,
      requested_by_name: changeRequest.requested_by_name || changeRequest.requested_by_email || null,
      response_note: changeRequest.response_note || null,
      responded_at: changeRequest.responded_at || null,
      related_disputes: (disputesResult.data || []).map((dispute) => ({
        id: dispute.id,
        title: dispute.title,
        status: dispute.status,
      })),
      navigation: {
        label: "Variante progetto",
        path: buildProjectChangeRequestDetailPath(changeRequest.project_id, changeRequest.id),
      },
    },
  };
}

async function listContextDisputes(dbClient, appUser, contextType, contextId, options = {}) {
  const limit = clampLimit(options?.limit, 5, 10);
  const normalizedStatus = normalizeDisputeStatus(options?.status);
  const disputeRows = await loadAccessibleDisputes(dbClient, appUser, contextType, contextId, {
    limit: 80,
    status: normalizedStatus,
  });

  return {
    context_type: contextType,
    context_id: contextId,
    counts: {
      total: disputeRows.length,
      by_status: countByField(disputeRows, "status"),
    },
    disputes: disputeRows
      .sort(compareAssistantDisputes)
      .slice(0, limit)
      .map((dispute) => ({
        id: dispute.id,
        title: dispute.title,
        summary: previewText(dispute.summary, 180),
        category: dispute.category,
        status: dispute.status,
        project_id: dispute.project_id,
        project_name: dispute.project_name || null,
        task_id: dispute.task_id || null,
        change_request_id: dispute.change_request_id || null,
        amount_impact: dispute.amount_impact,
        time_impact_days: dispute.time_impact_days,
        created_date: dispute.created_date,
        updated_date: dispute.updated_date,
        path: buildProjectDisputeDetailPath(dispute.project_id, dispute.id),
      })),
  };
}

async function getDisputeDetail(dbClient, appUser, contextType, contextId, args = {}) {
  const resolution = await resolveAccessibleDispute(dbClient, appUser, contextType, contextId, {
    disputeId: args?.dispute_id,
    disputeHint: args?.dispute_hint,
  });

  if (!resolution?.dispute) {
    return {
      context_type: contextType,
      context_id: contextId,
      found: false,
      message: "No accessible dispute in the current context matched the provided reference.",
    };
  }

  const dispute = resolution.dispute;
  const [timelineResult, evidenceResult, taskResult, changeRequestResult] = await Promise.all([
    dbClient
      .from("dispute_events")
      .select("id,actor_participant_id,event_type,note,payload,created_date")
      .eq("dispute_case_id", dispute.id)
      .order("created_date", { ascending: true })
      .limit(50),
    dbClient
      .from("dispute_evidence_items")
      .select("id,source_type,source_id,snapshot,note,created_date")
      .eq("dispute_case_id", dispute.id)
      .order("created_date", { ascending: true })
      .limit(50),
    dispute.task_id
      ? dbClient
        .from("tasks")
        .select("id,title,status,due_date,blocked_reason,project_id")
        .eq("id", dispute.task_id)
        .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    dispute.change_request_id
      ? dbClient
        .from("change_requests")
        .select("id,title,status,cost_impact,time_impact_days,project_id")
        .eq("id", dispute.change_request_id)
        .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ]);

  if (timelineResult.error) throw timelineResult.error;
  if (evidenceResult.error) throw evidenceResult.error;
  if (taskResult.error) throw taskResult.error;
  if (changeRequestResult.error) throw changeRequestResult.error;

  const timeline = timelineResult.data || [];
  const evidenceItems = evidenceResult.data || [];
  const participantIds = uniqueValues([
    dispute.opened_by_participant_id,
    dispute.against_participant_id,
    ...timeline.map((event) => event.actor_participant_id),
  ]);
  const participantById = await loadProjectParticipantsById(dbClient, participantIds);
  const participantRows = Array.from(participantById.values());
  const [companyNameById, userNameByEmail, evidenceEventsById] = await Promise.all([
    loadCompanyNameById(dbClient, participantRows.map((participant) => participant.company_id)),
    loadUserNameByEmail(dbClient, participantRows.map((participant) => participant.user_email)),
    loadEventsById(dbClient, evidenceItems.filter((item) => item.source_type === "event").map((item) => item.source_id)),
  ]);

  return {
    context_type: contextType,
    context_id: contextId,
    found: true,
    matched_by: resolution.matched_by,
    dispute: {
      id: dispute.id,
      title: dispute.title,
      summary: dispute.summary,
      category: dispute.category,
      status: dispute.status,
      project_id: dispute.project_id,
      project_name: dispute.project_name || null,
      amount_impact: dispute.amount_impact,
      time_impact_days: dispute.time_impact_days,
      resolution_note: dispute.resolution_note || null,
      resolved_at: dispute.resolved_at || null,
      created_date: dispute.created_date,
      updated_date: dispute.updated_date,
      opened_by: describeProjectParticipantLabel(participantById.get(dispute.opened_by_participant_id), userNameByEmail, companyNameById),
      against_party: describeProjectParticipantLabel(participantById.get(dispute.against_participant_id), userNameByEmail, companyNameById),
      related_task: taskResult.data
        ? {
            id: taskResult.data.id,
            title: taskResult.data.title,
            status: taskResult.data.status,
            due_date: taskResult.data.due_date,
            blocked_reason: taskResult.data.blocked_reason,
            path: buildProjectTaskDetailPath(taskResult.data.project_id || dispute.project_id, taskResult.data.id),
          }
        : null,
      related_change_request: changeRequestResult.data
        ? {
            id: changeRequestResult.data.id,
            title: changeRequestResult.data.title,
            status: changeRequestResult.data.status,
            cost_impact: changeRequestResult.data.cost_impact,
            time_impact_days: changeRequestResult.data.time_impact_days,
            path: buildProjectChangeRequestDetailPath(changeRequestResult.data.project_id || dispute.project_id, changeRequestResult.data.id),
          }
        : null,
      timeline: timeline.map((event) => ({
        id: event.id,
        event_type: event.event_type,
        actor: describeProjectParticipantLabel(participantById.get(event.actor_participant_id), userNameByEmail, companyNameById),
        note: event.note || null,
        attachments: Array.isArray(event.payload?.attachments)
          ? event.payload.attachments.map((attachment) => ({
              id: attachment?.id || null,
              name: attachment?.name || attachment?.file_name || attachment?.file_url || "Allegato",
              file_url: attachment?.file_url || null,
            }))
          : [],
        created_date: event.created_date,
      })),
      evidence_items: evidenceItems.map((item) => ({
        id: item.id,
        source_type: item.source_type,
        source_id: item.source_id || null,
        summary: buildDisputeEvidenceSummary(item, evidenceEventsById),
        note: item.note || null,
        snapshot: item.snapshot || null,
        created_date: item.created_date || null,
        path: buildDisputeEvidencePath(dispute.project_id, item),
      })),
      navigation: {
        label: "Disputa progetto",
        path: buildProjectDisputeDetailPath(dispute.project_id, dispute.id),
      },
    },
  };
}

async function getEventDetail(dbClient, appUser, contextType, contextId, args = {}) {
  const resolution = await resolveAccessibleEvent(dbClient, appUser, contextType, contextId, {
    eventId: args?.event_id,
    eventHint: args?.event_hint,
  });

  if (!resolution?.event) {
    return {
      context_type: contextType,
      context_id: contextId,
      found: false,
      message: "No accessible event in the current context matched the provided reference.",
    };
  }

  const event = resolution.event;
  const participantsResult = await dbClient
    .from("event_participants")
    .select("id,event_id,participant_type,user_id,user_email,company_id,status,has_conflict,conflict_event_id")
    .eq("event_id", event.id)
    .limit(50);

  if (participantsResult.error) throw participantsResult.error;

  const participants = participantsResult.data || [];
  const conflictEventIds = participants.filter((participant) => participant.has_conflict && participant.conflict_event_id).map((participant) => participant.conflict_event_id);
  const [userNameByEmail, companyNameById, projectNameById, conflictEventsById] = await Promise.all([
    loadUserNameByEmail(dbClient, [...participants.map((participant) => participant.user_email), event.creator_email]),
    loadCompanyNameById(dbClient, [...participants.map((participant) => participant.company_id), event.owner_company_id]),
    loadProjectNameById(dbClient, [event.owner_project_id]),
    loadEventsById(dbClient, conflictEventIds),
  ]);

  return {
    context_type: contextType,
    context_id: contextId,
    found: true,
    matched_by: resolution.matched_by,
    event: {
      id: event.id,
      title: event.title,
      description: event.description || null,
      status: event.status,
      location: event.location || null,
      start_datetime: event.start_datetime,
      end_datetime: event.end_datetime,
      owner_type: event.owner_type,
      project_id: event.owner_project_id || null,
      project_name: event.owner_project_name || projectNameById.get(event.owner_project_id) || null,
      company_id: event.owner_company_id || null,
      company_name: event.owner_company_name || companyNameById.get(event.owner_company_id) || null,
      creator_name: userNameByEmail.get(event.creator_email) || event.creator_name || event.creator_email || null,
      counts: {
        participants: participants.length,
        by_status: countByField(participants, "status"),
        conflicts: participants.filter((participant) => participant.has_conflict).length,
      },
      participants: participants.map((participant) => {
        const conflictEvent = participant.conflict_event_id ? conflictEventsById.get(participant.conflict_event_id) : null;
        return {
          id: participant.id,
          participant_type: participant.participant_type,
          label: describeEventParticipantLabel(participant, userNameByEmail, companyNameById),
          status: participant.status,
          has_conflict: participant.has_conflict === true,
          conflict_event: conflictEvent
            ? {
                id: conflictEvent.id,
                title: conflictEvent.title,
                start_datetime: conflictEvent.start_datetime,
                end_datetime: conflictEvent.end_datetime,
                status: conflictEvent.status,
                path: buildEventNavigationPath(contextType, contextId, conflictEvent),
              }
            : null,
        };
      }),
      navigation: {
        label: contextType === "project" ? "Scheda cantiere" : "Calendario",
        path: buildEventNavigationPath(contextType, contextId, event),
      },
    },
  };
}

async function getOperationalDayBrief(dbClient, appUser, contextType, contextId, options = {}) {
  const todayKey = new Date().toISOString().slice(0, 10);
  const [taskRows, eventRows, disputeRows] = await Promise.all([
    loadAccessibleTasks(dbClient, appUser, contextType, contextId, {
      limit: 80,
      includeCompleted: false,
    }),
    loadAccessibleEvents(dbClient, appUser, contextType, contextId, {
      limit: 80,
      includePast: true,
    }),
    loadAccessibleDisputes(dbClient, appUser, contextType, contextId, {
      limit: 80,
    }),
  ]);

  const relevantTasks = contextType === "project"
    ? taskRows
    : taskRows.filter((task) => isTaskRelevantToActiveUser(task, appUser));

  const dueTodayTasks = relevantTasks
    .filter((task) => task.due_date === todayKey)
    .sort(compareTodayDeadlineTasks);
  const inProgressTasks = relevantTasks
    .filter((task) => task.status === "in_progress")
    .sort(compareTodayDeadlineTasks);
  const blockedTasks = relevantTasks
    .filter((task) => task.status === "blocked")
    .sort(compareBlockedTasks);
  const todayEvents = eventRows
    .filter((event) => isEventScheduledOnDate(event, todayKey))
    .sort((left, right) => String(left.start_datetime || "9999-12-31T00:00:00Z").localeCompare(String(right.start_datetime || "9999-12-31T00:00:00Z")));
  const openDisputes = disputeRows
    .filter((dispute) => isOpenDisputeStatus(dispute.status))
    .sort(compareAssistantDisputes);

  return {
    context_type: contextType,
    context_id: contextId,
    date: todayKey,
    summary: {
      tasks_due_today: dueTodayTasks.length,
      tasks_in_progress: inProgressTasks.length,
      blocked_tasks: blockedTasks.length,
      events_today: todayEvents.length,
      open_disputes: openDisputes.length,
    },
    tasks_due_today: dueTodayTasks.slice(0, 5).map((task) => ({
      id: task.id,
      title: task.title,
      project_id: task.project_id,
      project_name: task.project_name || null,
      due_date: task.due_date,
      assignment: describeTaskAssignment(task),
      path: buildProjectTaskDetailPath(task.project_id, task.id),
    })),
    in_progress_tasks: inProgressTasks.slice(0, 5).map((task) => ({
      id: task.id,
      title: task.title,
      project_id: task.project_id,
      project_name: task.project_name || null,
      due_date: task.due_date,
      assignment: describeTaskAssignment(task),
      path: buildProjectTaskDetailPath(task.project_id, task.id),
    })),
    blocked_tasks: blockedTasks.slice(0, 5).map((task) => ({
      id: task.id,
      title: task.title,
      project_id: task.project_id,
      project_name: task.project_name || null,
      blocked_reason: previewText(task.blocked_reason, 140),
      blocked_by: task.blocked_by_name || task.blocked_by_email || null,
      path: buildProjectTaskDetailPath(task.project_id, task.id),
    })),
    events_today: todayEvents.slice(0, 5).map((event) => ({
      id: event.id,
      title: event.title,
      status: event.status,
      start_datetime: event.start_datetime,
      end_datetime: event.end_datetime,
      location: event.location || null,
      path: buildEventNavigationPath(contextType, contextId, event),
    })),
    open_disputes: openDisputes.slice(0, 5).map((dispute) => ({
      id: dispute.id,
      title: dispute.title,
      status: dispute.status,
      project_id: dispute.project_id,
      project_name: dispute.project_name || null,
      path: buildProjectDisputeDetailPath(dispute.project_id, dispute.id),
    })),
    navigation: {
      label: normalizeAssistantUiMode(options?.uiMode) === "operational" ? "Riepilogo operativo" : contextType === "project" ? "Scheda cantiere" : contextType === "company" ? "Scheda societa" : "Dashboard",
      path: buildOperationalDayBriefPath(contextType, contextId, options?.uiMode),
    },
  };
}

async function listContextSchedule(dbClient, appUser, contextType, contextId, options = {}) {
  const limit = clampLimit(options?.limit, 5, 10);
  const includePast = options?.include_past === true;
  const schedule = (await loadAccessibleEvents(dbClient, appUser, contextType, contextId, {
    limit,
    includePast,
  }))
    .map((event) => ({
      id: event.id,
      title: event.title,
      status: event.status,
      location: event.location,
      start_datetime: event.start_datetime,
      end_datetime: event.end_datetime,
      summary: previewText(event.description, 140),
      project_id: event.owner_project_id || null,
      project_name: event.owner_project_name || null,
      path: buildEventNavigationPath(contextType, contextId, event),
    }));

  return {
    context_type: contextType,
    context_id: contextId,
    schedule,
  };
}

async function resolveAssistantProjectInContext(dbClient, appUser, contextType, contextId, options = {}) {
  const projectId = String(options?.project_id || options?.projectId || "").trim();
  const projectHint = String(options?.project_hint || options?.projectHint || "").trim();

  if (!projectId && !projectHint) {
    return null;
  }

  const contextProjects = await getContextProjects(dbClient, appUser, contextType, contextId);
  let scopedProjects = contextProjects;

  if (projectId) {
    scopedProjects = contextProjects.filter((project) => project.id === projectId);
  } else if (projectHint) {
    scopedProjects = contextProjects
      .map((project) => ({
        project,
        score: computeAssistantSearchScore([
          project.id,
          project.name,
          project.address,
          project.city,
          project.description,
          project.status,
        ], projectHint),
      }))
      .filter((entry) => entry.score > 0)
      .sort((left, right) => right.score - left.score || compareAssistantProjects(left.project, right.project))
      .map((entry) => entry.project);
  }

  if (scopedProjects.length === 0) {
    return null;
  }

  return {
    matched_by: projectId ? "project_id" : "project_hint",
    project: scopedProjects[0],
  };
}

async function listContextParticipants(dbClient, appUser, contextType, contextId, options = {}) {
  const limit = clampLimit(options?.limit, 10, 20);

  const projectResolution = contextType !== "project"
    ? await resolveAssistantProjectInContext(dbClient, appUser, contextType, contextId, options)
    : null;
  const projectTarget = contextType === "project"
    ? {
        id: contextId,
        name: null,
        address: null,
        path: buildProjectPath(contextId),
      }
    : projectResolution?.project
      ? {
          id: projectResolution.project.id,
          name: projectResolution.project.name || projectResolution.project.id,
          address: projectResolution.project.address || null,
          path: buildProjectPath(projectResolution.project.id),
        }
      : null;
  const targetProjectId = projectTarget?.id || null;

  if (targetProjectId) {
    const { data, error } = await dbClient
      .from("project_participants")
      .select("participant_type,user_email,company_id,project_role,status,can_invite")
      .eq("project_id", targetProjectId)
      .in("status", ["active", "invited"])
      .limit(limit);

    if (error) throw error;

    const companyNameById = await loadCompanyNameById(dbClient, (data || []).map((participant) => participant.company_id));
    const userNameByEmail = await loadUserNameByEmail(dbClient, (data || []).map((participant) => participant.user_email));

    return {
      context_type: contextType,
      context_id: contextId,
      scope: "project",
      matched_by: contextType === "project" ? "current_project" : projectResolution?.matched_by,
      target_project: projectTarget,
      participants: (data || [])
        .sort(compareAssistantParticipants)
        .map((participant) => ({
          type: participant.participant_type,
          name: participant.participant_type === "company"
            ? companyNameById.get(participant.company_id) || participant.company_id || "Societa"
            : userNameByEmail.get(participant.user_email) || participant.user_email || "Utente",
          email: participant.user_email,
          company_id: participant.company_id,
          role: participant.project_role,
          status: participant.status,
          can_invite: participant.can_invite === true,
          path: buildProjectPath(targetProjectId),
        })),
    };
  }

  if (options?.project_id || options?.project_hint) {
    return {
      context_type: contextType,
      context_id: contextId,
      scope: "project",
      found: false,
      message: "Nessun cantiere accessibile nel contesto corrente corrisponde al riferimento indicato.",
      participants: [],
    };
  }

  if (contextType === "company") {
    const { data, error } = await dbClient
      .from("company_members")
      .select("user_email,role,profession,company_member_role,status")
      .eq("company_id", contextId)
      .in("status", ["active", "invited"])
      .limit(limit);

    if (error) throw error;

    const userNameByEmail = await loadUserNameByEmail(dbClient, (data || []).map((member) => member.user_email));

    return {
      context_type: contextType,
      context_id: contextId,
      scope: "company",
      participants: (data || [])
        .sort(compareAssistantParticipants)
        .map((member) => ({
          type: "company_member",
          name: userNameByEmail.get(member.user_email) || member.user_email || "Utente",
          email: member.user_email,
          role: member.role,
          profession: member.company_member_role || member.profession || null,
          status: member.status,
          path: buildCompanyPath(contextId),
        })),
    };
  }

  return {
    context_type: contextType,
    context_id: contextId,
    scope: "personal",
    available: false,
    reason: "Personal assistant context does not have a shared participant list",
    participants: [],
  };
}

async function listContextChannels(dbClient, appUser, contextType, contextId, options = {}) {
  const limit = clampLimit(options?.limit, 5, 10);
  const unreadOnly = options?.unread_only === true;
  const normalizedChannelType = normalizeChannelType(options?.channel_type);
  const channels = await loadAccessibleChannels(dbClient, appUser, contextType, contextId, {
    limit: 80,
    channelType: normalizedChannelType,
    unreadOnly,
    uiMode: options?.uiMode,
  });

  return {
    context_type: contextType,
    context_id: contextId,
    access_mode: channels[0]?.access_mode || (await getChatAccessModeForContext(dbClient, contextType, contextId)),
    counts: {
      total: channels.length,
      unread_channels: channels.filter((channel) => Number(channel.unread_count || 0) > 0).length,
      by_type: countByField(channels, "type"),
    },
    channels: channels
      .sort(compareAssistantChannels)
      .slice(0, limit)
      .map((channel) => ({
        id: channel.id,
        name: channel.name,
        display_name: channel.display_name,
        type: channel.type,
        description: previewText(channel.description, 180),
        project_id: channel.project_id || null,
        project_name: channel.project_name || null,
        company_id: channel.company_id || null,
        company_name: channel.company_name || null,
        scope_label: channel.scope_label,
        access_mode: channel.access_mode,
        unread_count: channel.unread_count,
        member_count: channel.member_count,
        last_message: channel.last_message
          ? {
              id: channel.last_message.id,
              summary: previewText(channel.last_message.summary, 140),
              created_date: channel.last_message.created_date,
              sender_name: channel.last_message.sender_name || channel.last_message.sender_email || null,
            }
          : null,
        path: channel.path,
      })),
  };
}

async function getChannelDetail(dbClient, appUser, contextType, contextId, args = {}) {
  const resolution = await resolveAccessibleChannel(dbClient, appUser, contextType, contextId, {
    channelId: args?.channel_id,
    channelHint: args?.channel_hint,
    uiMode: args?.uiMode,
  });

  if (!resolution?.channel) {
    return {
      context_type: contextType,
      context_id: contextId,
      found: false,
      message: "No accessible channel in the current context matched the provided reference.",
    };
  }

  const channel = resolution.channel;
  return {
    context_type: contextType,
    context_id: contextId,
    found: true,
    matched_by: resolution.matched_by,
    channel: {
      id: channel.id,
      name: channel.name,
      display_name: channel.display_name,
      type: channel.type,
      description: channel.description || null,
      project_id: channel.project_id || null,
      project_name: channel.project_name || null,
      company_id: channel.company_id || null,
      company_name: channel.company_name || null,
      scope_label: channel.scope_label,
      access_mode: channel.access_mode,
      member_count: channel.member_count,
      unread_count: channel.unread_count,
      last_read_at: channel.current_membership?.last_read_at || null,
      last_message: channel.last_message
        ? {
            id: channel.last_message.id,
            summary: channel.last_message.summary,
            content: channel.last_message.content,
            created_date: channel.last_message.created_date,
            sender_name: channel.last_message.sender_name || channel.last_message.sender_email || null,
          }
        : null,
      memberships: (channel.memberships || []).map((membership) => ({
        id: membership.id,
        participant_type: membership.user_email ? "user" : membership.company_id ? "company" : "unknown",
        label: membership.display_label,
        user_email: membership.user_email || null,
        company_id: membership.company_id || null,
        role: membership.role || null,
        status: membership.status || null,
        is_current_user: membership.is_current_user === true,
        last_read_at: membership.last_read_at || null,
      })),
      navigation: {
        label: channel.project_id ? "Chat progetto" : "Chat societa",
        path: channel.path,
      },
    },
  };
}

async function listContextMessages(dbClient, appUser, contextType, contextId, options = {}) {
  const limit = clampLimit(options?.limit, 5, 10);
  let channelId = String(options?.channel_id || "").trim() || null;

  if (!channelId && options?.channel_hint) {
    const resolution = await resolveAccessibleChannel(dbClient, appUser, contextType, contextId, {
      channelHint: options.channel_hint,
      uiMode: options?.uiMode,
    });
    channelId = resolution?.channel?.id || null;
  }

  const messages = await loadAccessibleMessages(dbClient, appUser, contextType, contextId, {
    limit: channelId ? 120 : 180,
    channelId,
    unreadOnly: options?.unread_only === true,
    mentionedOnly: options?.mentioned_only === true,
    uiMode: options?.uiMode,
  });

  return {
    context_type: contextType,
    context_id: contextId,
    counts: {
      total: messages.length,
      unread: messages.filter((message) => message.is_unread).length,
      mentions: messages.filter((message) => message.is_mention).length,
    },
    messages: messages
      .sort(compareAssistantMessages)
      .slice(0, limit)
      .map((message) => ({
        id: message.id,
        summary: previewText(message.summary, 160),
        content_preview: previewText(message.summary, 220),
        created_date: message.created_date,
        sender_name: message.sender_name || message.sender_email || null,
        sender_email: message.sender_email || null,
        channel_id: message.channel_id,
        channel_name: message.channel_name,
        channel_type: message.channel_type,
        project_id: message.project_id || null,
        project_name: message.project_name || null,
        company_id: message.company_id || null,
        company_name: message.company_name || null,
        is_unread: message.is_unread === true,
        is_mention: message.is_mention === true,
        mentions_count: message.mentions_count,
        artifact_count: message.artifact_count,
        path: message.path,
      })),
  };
}

async function getMessageDetail(dbClient, appUser, contextType, contextId, args = {}) {
  const resolution = await resolveAccessibleMessage(dbClient, appUser, contextType, contextId, {
    messageId: args?.message_id,
    messageHint: args?.message_hint,
    uiMode: args?.uiMode,
  });

  if (!resolution?.message) {
    return {
      context_type: contextType,
      context_id: contextId,
      found: false,
      message: "No accessible message in the current context matched the provided reference.",
    };
  }

  const message = resolution.message;
  const mentionedUserEmails = uniqueValues(message.mentioned_user_emails || []);
  const mentionedTaskIds = uniqueValues(message.mentioned_task_ids || []);
  const mentionedMilestoneIds = uniqueValues(message.mentioned_milestone_ids || []);
  const mentionedChangeRequestIds = uniqueValues(message.mentioned_change_request_ids || []);
  const mentionedDocumentIds = uniqueValues(message.mentioned_document_ids || []);

  const [userNameByEmail, tasksResult, milestonesResult, changeRequestsResult, documentsResult] = await Promise.all([
    loadUserNameByEmail(dbClient, [message.sender_email, ...mentionedUserEmails]),
    mentionedTaskIds.length > 0
      ? dbClient.from("tasks").select("id,title,project_id,status").in("id", mentionedTaskIds)
      : Promise.resolve({ data: [], error: null }),
    mentionedMilestoneIds.length > 0
      ? dbClient.from("milestones").select("id,title,project_id,status").in("id", mentionedMilestoneIds)
      : Promise.resolve({ data: [], error: null }),
    mentionedChangeRequestIds.length > 0
      ? dbClient.from("change_requests").select("id,title,project_id,status").in("id", mentionedChangeRequestIds)
      : Promise.resolve({ data: [], error: null }),
    mentionedDocumentIds.length > 0
      ? dbClient.from("project_documents").select("id,name,project_id,company_id,document_status").in("id", mentionedDocumentIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (tasksResult.error) throw tasksResult.error;
  if (milestonesResult.error) throw milestonesResult.error;
  if (changeRequestsResult.error) throw changeRequestsResult.error;
  if (documentsResult.error) throw documentsResult.error;

  const mentions = [
    ...mentionedUserEmails.map((email) => ({
      type: "user",
      id: email,
      label: userNameByEmail.get(email) || email,
      path: null,
    })),
    ...(tasksResult.data || []).map((task) => ({
      type: "task",
      id: task.id,
      label: task.title,
      status: task.status,
      path: task.project_id ? buildProjectTaskDetailPath(task.project_id, task.id) : null,
    })),
    ...(milestonesResult.data || []).map((milestone) => ({
      type: "milestone",
      id: milestone.id,
      label: milestone.title,
      status: milestone.status,
      path: milestone.project_id ? buildProjectMilestoneDetailPath(milestone.project_id, milestone.id) : null,
    })),
    ...(changeRequestsResult.data || []).map((changeRequest) => ({
      type: "change_request",
      id: changeRequest.id,
      label: changeRequest.title,
      status: changeRequest.status,
      path: changeRequest.project_id ? buildProjectChangeRequestDetailPath(changeRequest.project_id, changeRequest.id) : null,
    })),
    ...(documentsResult.data || []).map((document) => ({
      type: "document",
      id: document.id,
      label: document.name,
      status: document.document_status || null,
      path: buildDocumentNavigationPath(document, contextType, contextId),
    })),
  ];

  return {
    context_type: contextType,
    context_id: contextId,
    found: true,
    matched_by: resolution.matched_by,
    message: {
      id: message.id,
      content: message.content,
      summary: message.summary,
      created_date: message.created_date,
      sender_name: userNameByEmail.get(message.sender_email) || message.sender_name || message.sender_email || null,
      sender_email: message.sender_email || null,
      sender_context_type: message.sender_context_type || null,
      sender_company_name: message.sender_company_name || null,
      channel_id: message.channel_id,
      channel_name: message.channel_name,
      channel_type: message.channel_type,
      project_id: message.project_id || null,
      project_name: message.project_name || null,
      company_id: message.company_id || null,
      company_name: message.company_name || null,
      is_unread: message.is_unread === true,
      is_mention: message.is_mention === true,
      mentions,
      navigation: {
        label: message.project_id ? "Chat progetto" : "Chat societa",
        path: message.path,
      },
    },
  };
}

async function listMentionsAndFollowups(dbClient, appUser, contextType, contextId, options = {}) {
  const limit = clampLimit(options?.limit, 5, 10);
  const [messages, channels] = await Promise.all([
    loadAccessibleMessages(dbClient, appUser, contextType, contextId, {
      limit: 180,
      uiMode: options?.uiMode,
    }),
    loadAccessibleChannels(dbClient, appUser, contextType, contextId, {
      limit: 120,
      uiMode: options?.uiMode,
    }),
  ]);

  const mentions = messages
    .filter((message) => message.is_mention === true && message.sender_email !== appUser?.email)
    .sort(compareAssistantMessages)
    .slice(0, limit)
    .map((message) => ({
      id: message.id,
      channel_id: message.channel_id,
      channel_name: message.channel_name,
      summary: previewText(message.summary, 160),
      created_date: message.created_date,
      sender_name: message.sender_name || message.sender_email || null,
      path: message.path,
    }));

  const followups = channels
    .filter((channel) => Number(channel.unread_count || 0) > 0)
    .sort(compareAssistantChannelFollowups)
    .slice(0, limit)
    .map((channel) => ({
      channel_id: channel.id,
      channel_name: channel.display_name || channel.name,
      unread_count: channel.unread_count,
      last_message_summary: channel.last_message?.summary || null,
      last_message_created_date: channel.last_message?.created_date || null,
      path: channel.path,
    }));

  return {
    context_type: contextType,
    context_id: contextId,
    counts: {
      mentions: mentions.length,
      followups: followups.length,
    },
    mentions,
    followups,
  };
}

async function getNotificationPreferences(dbClient, appUser, contextType, contextId) {
  if (!appUser?.email) {
    return {
      context_type: contextType,
      context_id: contextId,
      entries: [],
    };
  }

  const { data, error } = await dbClient
    .from("notification_preferences")
    .select("id,user_email,preferences")
    .eq("user_email", appUser.email)
    .maybeSingle();

  if (error) throw error;

  const preferences = mergeAssistantNotificationPreferences(data?.preferences);
  const entries = Object.entries(preferences).map(([actionKey, value]) => ({
    action_key: actionKey,
    label: describeAssistantNotificationPreference(actionKey),
    notification: value?.notification === true,
    email: value?.email === true,
    group: describeAssistantNotificationPreferenceGroup(actionKey),
  }));

  return {
    context_type: contextType,
    context_id: contextId,
    source: data ? "stored" : "defaults",
    summary: {
      total_actions: entries.length,
      notification_enabled_count: entries.filter((entry) => entry.notification).length,
      email_enabled_count: entries.filter((entry) => entry.email).length,
    },
    entries,
    navigation: {
      label: "Impostazioni notifiche",
      path: "/app/Settings",
    },
  };
}

async function listContextDocuments(dbClient, appUser, contextType, contextId, options = {}) {
  const limit = clampLimit(options?.limit, 6, 15);
  const documents = await loadAccessibleDocuments(dbClient, appUser, contextType, contextId, {
    limit: 120,
    currentOnly: options?.current_only !== false,
    includeArchived: options?.include_archived === true,
    status: options?.status,
  });

  return {
    context_type: contextType,
    context_id: contextId,
    counts: {
      total: documents.length,
      by_status: countByField(documents, "document_status"),
    },
    documents: documents
      .sort(compareAssistantDocuments)
      .slice(0, limit)
      .map((document) => ({
        id: document.id,
        name: document.name,
        description: previewText(document.description, 180),
        document_status: document.document_status,
        category: document.category || null,
        discipline: document.discipline || null,
        work_area: document.work_area || null,
        project_phase: document.project_phase || null,
        revision_number: document.revision_number || 1,
        is_current_revision: document.is_current_revision !== false,
        file_type: document.file_type || null,
        updated_date: document.updated_date || document.created_date || null,
        scope_label: document.scope_label,
        project_id: document.project_id || null,
        project_name: document.project_name || null,
        company_id: document.company_id || null,
        company_name: document.company_name || null,
        path: document.path,
      })),
  };
}

async function searchContextDocuments(dbClient, appUser, contextType, contextId, options = {}) {
  const query = String(options?.query || "").trim();
  const limit = clampLimit(options?.limit, 6, 10);

  if (!query) {
    return {
      context_type: contextType,
      context_id: contextId,
      query,
      documents: [],
    };
  }

  const documents = await loadAccessibleDocuments(dbClient, appUser, contextType, contextId, {
    limit: 180,
    currentOnly: !/storic|tutte le revision|all revisions/i.test(query),
    includeArchived: /archiv/i.test(query),
  });

  const rankedDocuments = documents
    .map((document) => ({
      document,
      score: computeAssistantSearchScore([
        document.name,
        document.description,
        document.category,
        document.discipline,
        document.work_area,
        document.project_phase,
        document.project_name,
        document.company_name,
        document.document_status,
        document.file_type,
        ...(Array.isArray(document.document_tags) ? document.document_tags : []),
      ], query),
    }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score || compareAssistantDocuments(left.document, right.document))
    .slice(0, limit);

  return {
    context_type: contextType,
    context_id: contextId,
    query,
    counts: {
      total: rankedDocuments.length,
    },
    documents: rankedDocuments.map(({ document }) => ({
      id: document.id,
      name: document.name,
      description: previewText(document.description, 180),
      document_status: document.document_status,
      category: document.category || null,
      discipline: document.discipline || null,
      work_area: document.work_area || null,
      project_phase: document.project_phase || null,
      revision_number: document.revision_number || 1,
      is_current_revision: document.is_current_revision !== false,
      scope_label: document.scope_label,
      match_reason: describeAssistantDocumentMatch(document, query),
      path: document.path,
    })),
  };
}

async function getDocumentDetail(dbClient, appUser, contextType, contextId, args = {}) {
  const resolution = await resolveAccessibleDocument(dbClient, appUser, contextType, contextId, {
    documentId: args?.document_id,
    documentHint: args?.document_hint,
    currentOnly: false,
  });

  if (!resolution?.document) {
    return {
      context_type: contextType,
      context_id: contextId,
      found: false,
      message: "No accessible document in the current context matched the provided reference.",
    };
  }

  const document = resolution.document;
  const revisions = await loadDocumentRevisionChain(dbClient, document, contextType, contextId);
  const revisionIds = revisions.map((revision) => revision.id);
  const [commentsResult, approvalsResult, eventsResult] = await Promise.all([
    dbClient
      .from("document_comments")
      .select("id,comment,author_email,author_name,created_date")
      .eq("document_id", document.id)
      .order("created_date", { ascending: true })
      .limit(80),
    revisionIds.length > 0
      ? dbClient
        .from("document_approvals")
        .select("id,document_id,status,requested_by_email,reviewed_by_email,review_note,reviewed_date,created_date,updated_date")
        .in("document_id", revisionIds)
        .order("created_date", { ascending: false })
        .limit(80)
      : Promise.resolve({ data: [], error: null }),
    revisionIds.length > 0
      ? dbClient
        .from("document_revision_events")
        .select("id,document_id,event_type,note,payload,created_date,created_by")
        .in("document_id", revisionIds)
        .order("created_date", { ascending: false })
        .limit(80)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (commentsResult.error) throw commentsResult.error;
  if (approvalsResult.error) throw approvalsResult.error;
  if (eventsResult.error) throw eventsResult.error;

  const currentRevision = revisions.find((revision) => revision.is_current_revision !== false) || revisions[0] || document;
  const latestApproval = (approvalsResult.data || [])[0] || null;
  const latestEvent = (eventsResult.data || [])[0] || null;

  return {
    context_type: contextType,
    context_id: contextId,
    found: true,
    matched_by: resolution.matched_by,
    document: {
      id: document.id,
      name: document.name,
      description: document.description || null,
      document_status: document.document_status,
      category: document.category || null,
      discipline: document.discipline || null,
      work_area: document.work_area || null,
      project_phase: document.project_phase || null,
      document_tags: document.document_tags || [],
      file_type: document.file_type || null,
      model_format: document.model_format || null,
      file_size: document.file_size || null,
      uploaded_by_name: document.uploaded_by_name || document.uploaded_by_email || null,
      uploaded_by_email: document.uploaded_by_email || null,
      created_date: document.created_date || null,
      updated_date: document.updated_date || null,
      revision_number: document.revision_number || 1,
      is_current_revision: document.is_current_revision !== false,
      current_revision_id: currentRevision?.id || null,
      current_revision_number: currentRevision?.revision_number || null,
      scope_label: document.scope_label,
      project_id: document.project_id || null,
      project_name: document.project_name || null,
      company_id: document.company_id || null,
      company_name: document.company_name || null,
      metadata_line: buildAssistantDocumentMetadataLine(document),
      counts: {
        revisions: revisions.length,
        comments: (commentsResult.data || []).length,
        approvals: (approvalsResult.data || []).length,
        revision_events: (eventsResult.data || []).length,
      },
      latest_comment: (commentsResult.data || []).length > 0
        ? {
            author_name: commentsResult.data.at(-1)?.author_name || commentsResult.data.at(-1)?.author_email || null,
            comment_preview: previewText(commentsResult.data.at(-1)?.comment, 140),
            created_date: commentsResult.data.at(-1)?.created_date || null,
          }
        : null,
      latest_approval: latestApproval,
      latest_revision_event: latestEvent
        ? {
            event_type: latestEvent.event_type,
            note: latestEvent.note || null,
            created_date: latestEvent.created_date,
          }
        : null,
      workflow_note: DOCUMENT_WORKFLOW_CURRENT_STATE_NOTE,
      navigation: {
        label: document.project_id ? "Documenti progetto" : "Documenti societa",
        path: document.path,
      },
    },
  };
}

async function getDocumentRevisionHistory(dbClient, appUser, contextType, contextId, args = {}) {
  const resolution = await resolveAccessibleDocument(dbClient, appUser, contextType, contextId, {
    documentId: args?.document_id,
    documentHint: args?.document_hint,
    currentOnly: false,
  });

  if (!resolution?.document) {
    return {
      context_type: contextType,
      context_id: contextId,
      found: false,
      message: "No accessible document in the current context matched the provided reference.",
    };
  }

  const document = resolution.document;
  const revisions = await loadDocumentRevisionChain(dbClient, document, contextType, contextId);
  const currentRevision = revisions.find((revision) => revision.is_current_revision !== false) || revisions[0] || null;

  return {
    context_type: contextType,
    context_id: contextId,
    found: true,
    matched_by: resolution.matched_by,
    counts: {
      revisions: revisions.length,
    },
    document: {
      id: document.id,
      name: document.name,
      root_document_id: document.root_document_id || document.id,
      path: document.path,
    },
    current_revision: currentRevision
      ? {
          id: currentRevision.id,
          name: currentRevision.name,
          revision_number: currentRevision.revision_number || 1,
          document_status: currentRevision.document_status,
          path: currentRevision.path,
        }
      : null,
    revisions: revisions.map((revision) => ({
      id: revision.id,
      name: revision.name,
      revision_number: revision.revision_number || 1,
      document_status: revision.document_status,
      is_current_revision: revision.is_current_revision !== false,
      parent_document_id: revision.parent_document_id || null,
      created_date: revision.created_date || null,
      updated_date: revision.updated_date || null,
      uploaded_by_name: revision.uploaded_by_name || revision.uploaded_by_email || null,
      path: revision.path,
    })),
  };
}

async function getDocumentWorkflowStatus(dbClient, appUser, contextType, contextId, args = {}) {
  const resolution = await resolveAccessibleDocument(dbClient, appUser, contextType, contextId, {
    documentId: args?.document_id,
    documentHint: args?.document_hint,
    currentOnly: false,
  });

  if (!resolution?.document) {
    return {
      context_type: contextType,
      context_id: contextId,
      found: false,
      message: "No accessible document in the current context matched the provided reference.",
    };
  }

  const document = resolution.document;
  const revisions = await loadDocumentRevisionChain(dbClient, document, contextType, contextId);
  const revisionIds = revisions.map((revision) => revision.id);
  const [approvalsResult, eventsResult] = await Promise.all([
    revisionIds.length > 0
      ? dbClient
        .from("document_approvals")
        .select("id,document_id,status,requested_by_email,reviewed_by_email,review_note,reviewed_date,created_date,updated_date")
        .in("document_id", revisionIds)
        .order("created_date", { ascending: false })
        .limit(80)
      : Promise.resolve({ data: [], error: null }),
    revisionIds.length > 0
      ? dbClient
        .from("document_revision_events")
        .select("id,document_id,event_type,note,payload,created_date,created_by")
        .in("document_id", revisionIds)
        .order("created_date", { ascending: false })
        .limit(80)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (approvalsResult.error) throw approvalsResult.error;
  if (eventsResult.error) throw eventsResult.error;

  const approvals = approvalsResult.data || [];
  const approvalSummary = {
    pending: approvals.filter((approval) => approval.status === "pending").length,
    approved: approvals.filter((approval) => approval.status === "approved").length,
    rejected: approvals.filter((approval) => approval.status === "rejected").length,
  };

  return {
    context_type: contextType,
    context_id: contextId,
    found: true,
    matched_by: resolution.matched_by,
    document: {
      id: document.id,
      name: document.name,
      path: document.path,
      document_status: document.document_status,
    },
    current_status: document.document_status,
    formal_workflow_available: false,
    workflow_note: DOCUMENT_WORKFLOW_CURRENT_STATE_NOTE,
    status_source: "document_status field",
    approval_summary: approvalSummary,
    latest_approval: approvals[0] || null,
    revision_event_count: (eventsResult.data || []).length,
    latest_revision_event: (eventsResult.data || [])[0] || null,
  };
}

async function listDocumentComments(dbClient, appUser, contextType, contextId, options = {}) {
  const limit = clampLimit(options?.limit, 6, 20);
  const resolution = await resolveAccessibleDocument(dbClient, appUser, contextType, contextId, {
    documentId: options?.document_id,
    documentHint: options?.document_hint,
    currentOnly: false,
  });

  if (!resolution?.document) {
    return {
      context_type: contextType,
      context_id: contextId,
      found: false,
      comments: [],
      message: "No accessible document in the current context matched the provided reference.",
    };
  }

  const document = resolution.document;
  const commentsResult = await dbClient
    .from("document_comments")
    .select("id,comment,author_email,author_name,created_date,updated_date")
    .eq("document_id", document.id)
    .order("created_date", { ascending: true })
    .limit(200);

  if (commentsResult.error) throw commentsResult.error;

  const comments = commentsResult.data || [];
  return {
    context_type: contextType,
    context_id: contextId,
    found: true,
    matched_by: resolution.matched_by,
    document: {
      id: document.id,
      name: document.name,
      path: document.path,
    },
    counts: {
      total: comments.length,
    },
    comments: comments.slice(-limit).map((comment) => ({
      id: comment.id,
      author_name: comment.author_name || comment.author_email || null,
      author_email: comment.author_email || null,
      comment: comment.comment,
      comment_preview: previewText(comment.comment, 180),
      created_date: comment.created_date || null,
      updated_date: comment.updated_date || null,
      path: document.path,
    })),
  };
}

async function listDocumentApprovals(dbClient, appUser, contextType, contextId, options = {}) {
  const limit = clampLimit(options?.limit, 6, 20);
  const resolution = await resolveAccessibleDocument(dbClient, appUser, contextType, contextId, {
    documentId: options?.document_id,
    documentHint: options?.document_hint,
    currentOnly: false,
  });

  if (!resolution?.document) {
    return {
      context_type: contextType,
      context_id: contextId,
      found: false,
      approvals: [],
      message: "No accessible document in the current context matched the provided reference.",
    };
  }

  const document = resolution.document;
  const revisions = await loadDocumentRevisionChain(dbClient, document, contextType, contextId);
  let approvalsQuery = dbClient
    .from("document_approvals")
    .select("id,document_id,status,requested_by_email,reviewed_by_email,review_note,reviewed_date,created_date,updated_date")
    .in("document_id", revisions.map((revision) => revision.id));

  const normalizedStatus = normalizeDocumentApprovalStatus(options?.status);
  if (normalizedStatus) {
    approvalsQuery = approvalsQuery.eq("status", normalizedStatus);
  }

  const approvalsResult = await approvalsQuery.order("created_date", { ascending: false }).limit(120);
  if (approvalsResult.error) throw approvalsResult.error;

  const revisionById = new Map(revisions.map((revision) => [revision.id, revision]));
  const approvals = approvalsResult.data || [];
  return {
    context_type: contextType,
    context_id: contextId,
    found: true,
    matched_by: resolution.matched_by,
    document: {
      id: document.id,
      name: document.name,
      path: document.path,
    },
    counts: {
      total: approvals.length,
      by_status: countByField(approvals, "status"),
    },
    approvals: approvals.slice(0, limit).map((approval) => ({
      id: approval.id,
      document_id: approval.document_id,
      revision_number: revisionById.get(approval.document_id)?.revision_number || null,
      status: approval.status,
      requested_by_email: approval.requested_by_email || null,
      reviewed_by_email: approval.reviewed_by_email || null,
      review_note: approval.review_note || null,
      reviewed_date: approval.reviewed_date || null,
      created_date: approval.created_date || null,
      updated_date: approval.updated_date || null,
      path: document.path,
    })),
  };
}

async function listDocumentRevisionEvents(dbClient, appUser, contextType, contextId, options = {}) {
  const limit = clampLimit(options?.limit, 6, 20);
  const resolution = await resolveAccessibleDocument(dbClient, appUser, contextType, contextId, {
    documentId: options?.document_id,
    documentHint: options?.document_hint,
    currentOnly: false,
  });

  if (!resolution?.document) {
    return {
      context_type: contextType,
      context_id: contextId,
      found: false,
      events: [],
      message: "No accessible document in the current context matched the provided reference.",
    };
  }

  const document = resolution.document;
  const revisions = await loadDocumentRevisionChain(dbClient, document, contextType, contextId);
  const eventsResult = await dbClient
    .from("document_revision_events")
    .select("id,document_id,event_type,note,payload,created_date,created_by")
    .in("document_id", revisions.map((revision) => revision.id))
    .order("created_date", { ascending: false })
    .limit(150);

  if (eventsResult.error) throw eventsResult.error;

  const revisionById = new Map(revisions.map((revision) => [revision.id, revision]));
  const events = eventsResult.data || [];
  return {
    context_type: contextType,
    context_id: contextId,
    found: true,
    matched_by: resolution.matched_by,
    document: {
      id: document.id,
      name: document.name,
      path: document.path,
    },
    counts: {
      total: events.length,
      by_type: countByField(events, "event_type"),
    },
    events: events.slice(0, limit).map((event) => ({
      id: event.id,
      document_id: event.document_id,
      revision_number: revisionById.get(event.document_id)?.revision_number || null,
      event_type: event.event_type,
      note: event.note || null,
      summary: summarizeAssistantRevisionEvent(event),
      created_by: event.created_by || null,
      created_date: event.created_date || null,
      path: document.path,
    })),
  };
}

async function getContextFinanceSnapshot(dbClient, appUser, contextType, contextId, options = {}) {
  const limit = clampLimit(options?.limit, 3, 10);
  const projects = await resolveAccessibleFinanceProjects(dbClient, appUser, contextType, contextId, {
    projectId: options?.project_id,
    projectHint: options?.project_hint,
  });

  if (projects.length === 0) {
    return {
      context_type: contextType,
      context_id: contextId,
      counts: { projects: 0 },
      projects: [],
      message: "No accessible project with finance data was found in the current assistant context.",
    };
  }

  const financeData = await loadAssistantFinanceScopeData(dbClient, projects);
  const snapshots = projects
    .map((project) => buildAssistantProjectFinanceSnapshot(project, financeData, appUser))
    .filter(Boolean)
    .sort(compareAssistantFinanceProjects);
  const currencies = Array.from(new Set(snapshots.map((snapshot) => snapshot.currency).filter(Boolean)));
  const currency = currencies.length === 1 ? currencies[0] : null;

  return {
    context_type: contextType,
    context_id: contextId,
    currency,
    mixed_currency: currencies.length > 1,
    counts: {
      projects: snapshots.length,
      budget_lines: snapshots.reduce((sum, snapshot) => sum + Number(snapshot.counts?.budget_lines || 0), 0),
      cost_entries: snapshots.reduce((sum, snapshot) => sum + Number(snapshot.counts?.cost_entries || 0), 0),
      work_sessions: snapshots.reduce((sum, snapshot) => sum + Number(snapshot.counts?.work_sessions || 0), 0),
      progress_statements: snapshots.reduce((sum, snapshot) => sum + Number(snapshot.counts?.progress_statements || 0), 0),
    },
    totals: {
      planned_budget: snapshots.reduce((sum, snapshot) => sum + Number(snapshot.planned_budget || 0), 0),
      recorded_costs: snapshots.reduce((sum, snapshot) => sum + Number(snapshot.recorded_costs || 0), 0),
      derived_labor: snapshots.reduce((sum, snapshot) => sum + Number(snapshot.derived_labor || 0), 0),
      forecast: snapshots.reduce((sum, snapshot) => sum + Number(snapshot.forecast || 0), 0),
      approved_variations: snapshots.reduce((sum, snapshot) => sum + Number(snapshot.approved_variations || 0), 0),
      open_disputes_amount: snapshots.reduce((sum, snapshot) => sum + Number(snapshot.open_disputes_amount || 0), 0),
      sal_to_pay: snapshots.reduce((sum, snapshot) => sum + Number(snapshot.sal?.total_to_pay || 0), 0),
    },
    projects: snapshots.slice(0, limit).map((snapshot) => ({
      project_id: snapshot.project_id,
      project_name: snapshot.project_name,
      currency: snapshot.currency,
      planned_budget: snapshot.planned_budget,
      recorded_costs: snapshot.recorded_costs,
      derived_labor: snapshot.derived_labor,
      forecast: snapshot.forecast,
      approved_variations: snapshot.approved_variations,
      open_disputes_amount: snapshot.open_disputes_amount,
      watchpoints_count: snapshot.watchpoints_count,
      labor_sync_preview: snapshot.labor_sync_preview,
      sal: snapshot.sal,
      settings: snapshot.settings,
      path: snapshot.path,
    })),
  };
}

async function listBudgetWatchpoints(dbClient, appUser, contextType, contextId, options = {}) {
  const limit = clampLimit(options?.limit, 6, 12);
  const projects = await resolveAccessibleFinanceProjects(dbClient, appUser, contextType, contextId, {
    projectId: options?.project_id,
    projectHint: options?.project_hint,
  });

  if (projects.length === 0) {
    return {
      context_type: contextType,
      context_id: contextId,
      counts: { total: 0 },
      watchpoints: [],
      message: "No accessible project with budget data was found in the current assistant context.",
    };
  }

  const financeData = await loadAssistantFinanceScopeData(dbClient, projects);
  const watchpoints = projects
    .flatMap((project) => buildAssistantProjectFinanceSnapshot(project, financeData, appUser)?.watchpoints || [])
    .sort(compareAssistantBudgetWatchpoints);

  return {
    context_type: contextType,
    context_id: contextId,
    counts: {
      total: watchpoints.length,
      projects: new Set(watchpoints.map((watchpoint) => watchpoint.project_id)).size,
      by_status: countByField(watchpoints, "watchpoint_status"),
    },
    watchpoints: watchpoints.slice(0, limit),
  };
}

async function listCostEntries(dbClient, appUser, contextType, contextId, options = {}) {
  const limit = clampLimit(options?.limit, 6, 20);
  const projects = await resolveAccessibleFinanceProjects(dbClient, appUser, contextType, contextId, {
    projectId: options?.project_id,
    projectHint: options?.project_hint,
  });

  if (projects.length === 0) {
    return {
      context_type: contextType,
      context_id: contextId,
      counts: { total: 0 },
      entries: [],
      message: "No accessible project with finance data was found in the current assistant context.",
    };
  }

  const financeData = await loadAssistantFinanceScopeData(dbClient, projects);
  const normalizedCostType = normalizeCostEntryType(options?.cost_type);
  const normalizedStatus = normalizeCostEntryStatus(options?.status);
  const entries = projects
    .flatMap((project) => buildAssistantProjectFinanceCostEntries(project, financeData, appUser))
    .filter((entry) => !normalizedCostType || entry.cost_type === normalizedCostType)
    .filter((entry) => !normalizedStatus || entry.status === normalizedStatus)
    .sort(compareAssistantCostEntries);

  return {
    context_type: contextType,
    context_id: contextId,
    counts: {
      total: entries.length,
      by_type: countByField(entries, "cost_type"),
      by_status: countByField(entries, "status"),
    },
    entries: entries.slice(0, limit),
  };
}

async function listContextLaborRates(dbClient, appUser, contextType, contextId, options = {}) {
  const limit = clampLimit(options?.limit, 6, 20);
  const projects = await resolveAccessibleFinanceProjects(dbClient, appUser, contextType, contextId, {
    projectId: options?.project_id,
    projectHint: options?.project_hint,
  });

  if (projects.length === 0) {
    return {
      context_type: contextType,
      context_id: contextId,
      counts: { total: 0 },
      rates: [],
      message: "No accessible project with relevant labor rates was found in the current assistant context.",
    };
  }

  const financeData = await loadAssistantFinanceScopeData(dbClient, projects);
  const companyId = String(options?.company_id || "").trim() || null;
  const companyHint = String(options?.company_hint || "").trim();
  const rateMap = new Map();

  projects.forEach((project) => {
    buildAssistantProjectLaborRateEntries(project, financeData, appUser)
      .filter((rate) => !companyId || rate.company_id === companyId)
      .filter((rate) => !companyHint || computeAssistantSearchScore([
        rate.company_name,
        rate.company_id,
        rate.user_email,
        ...(Array.isArray(rate.project_names) ? rate.project_names : []),
        rate.scope_label,
      ], companyHint) > 0)
      .forEach((rate) => {
        const existing = rateMap.get(rate.id);
        if (!existing) {
          rateMap.set(rate.id, {
            ...rate,
            project_names: Array.isArray(rate.project_names) ? rate.project_names : (rate.project_name ? [rate.project_name] : []),
          });
          return;
        }

        const projectNames = Array.from(new Set([
          ...(Array.isArray(existing.project_names) ? existing.project_names : []),
          ...(rate.project_name ? [rate.project_name] : []),
        ]));

        rateMap.set(rate.id, {
          ...existing,
          project_names: projectNames,
        });
      });
  });

  const rates = Array.from(rateMap.values())
    .map((rate) => ({
      ...rate,
      project_count: Array.isArray(rate.project_names) ? rate.project_names.length : 0,
      scope_label: buildAssistantLaborRateScopeLabel(rate),
    }))
    .sort(compareAssistantLaborRates);

  return {
    context_type: contextType,
    context_id: contextId,
    counts: {
      total: rates.length,
      unique_companies: new Set(rates.map((rate) => rate.company_id).filter(Boolean)).size,
    },
    rates: rates.slice(0, limit),
  };
}

async function getProjectFinancialSettings(dbClient, appUser, contextType, contextId, options = {}) {
  const resolution = await resolveAccessibleFinanceProject(dbClient, appUser, contextType, contextId, {
    projectId: options?.project_id,
    projectHint: options?.project_hint,
  });

  if (resolution?.ambiguous) {
    return {
      context_type: contextType,
      context_id: contextId,
      found: false,
      ambiguous: true,
      candidates: resolution.candidates,
      message: "More than one accessible project matches the finance request. Provide a project reference to narrow it down.",
    };
  }

  if (!resolution?.project) {
    return {
      context_type: contextType,
      context_id: contextId,
      found: false,
      message: "No accessible project matched the requested finance settings.",
    };
  }

  const project = resolution.project;
  const financeData = await loadAssistantFinanceScopeData(dbClient, [project]);
  const snapshot = buildAssistantProjectFinanceSnapshot(project, financeData, appUser);
  const scopedData = getAssistantProjectFinanceScope(project, financeData, appUser);
  const storedSettings = financeData.settingsByProjectId.get(project.id) || null;

  return {
    context_type: contextType,
    context_id: contextId,
    found: true,
    matched_by: resolution.matched_by,
    defaults_applied: !storedSettings,
    project: {
      id: project.id,
      name: project.name || project.id,
    },
    settings: {
      currency: snapshot.settings.currency,
      budget_tracking_mode: snapshot.settings.budget_tracking_mode,
      budget_tracking_mode_label: describeAssistantBudgetTrackingMode(snapshot.settings.budget_tracking_mode),
      financial_visibility: snapshot.settings.financial_visibility,
      financial_visibility_label: describeAssistantFinancialVisibility(snapshot.settings.financial_visibility),
      labor_cost_method: snapshot.settings.labor_cost_method,
      labor_cost_method_label: describeAssistantLaborCostMethod(snapshot.settings.labor_cost_method),
      enable_progress_statements: snapshot.settings.enable_progress_statements,
      enable_progress_statements_label: describeAssistantSalToggle(snapshot.settings.enable_progress_statements),
      scoped_company_id: scopedData.scopedCompanyId || null,
    },
    counts: {
      budget_lines: snapshot.counts.budget_lines,
      cost_entries: snapshot.counts.cost_entries,
      work_sessions: snapshot.counts.work_sessions,
      labor_rates: buildAssistantProjectLaborRateEntries(project, financeData, appUser).length,
      progress_statements: snapshot.counts.progress_statements,
      participating_companies: (financeData.projectCompanyIdsByProjectId.get(project.id) || []).length,
    },
    sal: snapshot.sal,
    labor_sync_preview: snapshot.labor_sync_preview,
    path: snapshot.path,
  };
}

async function listProgressStatements(dbClient, appUser, contextType, contextId, options = {}) {
  const limit = clampLimit(options?.limit, 6, 20);
  const projects = await resolveAccessibleFinanceProjects(dbClient, appUser, contextType, contextId, {
    projectId: options?.project_id,
    projectHint: options?.project_hint,
  });

  if (projects.length === 0) {
    return {
      context_type: contextType,
      context_id: contextId,
      counts: { total: 0 },
      statements: [],
      message: "No accessible project with SAL data was found in the current assistant context.",
    };
  }

  const financeData = await loadAssistantFinanceScopeData(dbClient, projects);
  const normalizedStatus = normalizeProgressStatementStatus(options?.status);
  const statements = projects
    .flatMap((project) => buildAssistantProjectProgressStatements(project, financeData, appUser))
    .filter((statement) => !normalizedStatus || statement.status === normalizedStatus)
    .sort(compareAssistantProgressStatements);

  return {
    context_type: contextType,
    context_id: contextId,
    counts: {
      total: statements.length,
      by_status: countByField(statements, "status"),
    },
    totals: {
      amount_matured: statements.reduce((sum, statement) => sum + Number(statement.amount_matured || 0), 0),
      amount_to_pay: statements.reduce((sum, statement) => sum + Number(statement.amount_to_pay || 0), 0),
    },
    statements: statements.slice(0, limit),
  };
}

async function getProgressStatementDetail(dbClient, appUser, contextType, contextId, options = {}) {
  const resolution = await resolveAccessibleProgressStatement(dbClient, appUser, contextType, contextId, {
    projectId: options?.project_id,
    projectHint: options?.project_hint,
    statementId: options?.statement_id,
    statementHint: options?.statement_hint,
  });

  if (resolution?.ambiguous) {
    return {
      context_type: contextType,
      context_id: contextId,
      found: false,
      ambiguous: true,
      candidates: resolution.candidates,
      message: "More than one accessible SAL matches the request. Add a clearer reference to the SAL or the project.",
    };
  }

  if (!resolution?.statement) {
    return {
      context_type: contextType,
      context_id: contextId,
      found: false,
      message: "No accessible SAL matched the provided reference.",
    };
  }

  return {
    context_type: contextType,
    context_id: contextId,
    found: true,
    matched_by: resolution.matched_by,
    statement: resolution.statement,
  };
}

async function listProgressStatementNotes(dbClient, appUser, contextType, contextId, options = {}) {
  const limit = clampLimit(options?.limit, 6, 20);
  const hasSpecificStatement = Boolean(options?.statement_id || options?.statement_hint);

  if (hasSpecificStatement) {
    const resolution = await resolveAccessibleProgressStatement(dbClient, appUser, contextType, contextId, {
      projectId: options?.project_id,
      projectHint: options?.project_hint,
      statementId: options?.statement_id,
      statementHint: options?.statement_hint,
    });

    if (resolution?.ambiguous) {
      return {
        context_type: contextType,
        context_id: contextId,
        found: false,
        ambiguous: true,
        candidates: resolution.candidates,
        notes: [],
        message: "More than one accessible SAL matches the note request. Add a clearer reference.",
      };
    }

    if (!resolution?.statement) {
      return {
        context_type: contextType,
        context_id: contextId,
        found: false,
        notes: [],
        message: "No accessible SAL matched the provided reference.",
      };
    }

    const notes = resolution.statement.notes ? [{
      statement_id: resolution.statement.id,
      sequence_number: resolution.statement.sequence_number,
      project_id: resolution.statement.project_id,
      project_name: resolution.statement.project_name,
      status: resolution.statement.status,
      status_label: resolution.statement.status_label,
      statement_date: resolution.statement.statement_date,
      note: resolution.statement.notes,
      note_preview: previewText(resolution.statement.notes, 180),
      path: resolution.statement.path,
    }] : [];

    return {
      context_type: contextType,
      context_id: contextId,
      found: true,
      matched_by: resolution.matched_by,
      counts: { total: notes.length },
      notes,
    };
  }

  const projects = await resolveAccessibleFinanceProjects(dbClient, appUser, contextType, contextId, {
    projectId: options?.project_id,
    projectHint: options?.project_hint,
  });

  if (projects.length === 0) {
    return {
      context_type: contextType,
      context_id: contextId,
      counts: { total: 0 },
      notes: [],
      message: "No accessible project with SAL notes was found in the current assistant context.",
    };
  }

  const financeData = await loadAssistantFinanceScopeData(dbClient, projects);
  const notes = projects
    .flatMap((project) => buildAssistantProjectProgressStatements(project, financeData, appUser))
    .filter((statement) => statement.notes)
    .sort(compareAssistantProgressStatements)
    .map((statement) => ({
      statement_id: statement.id,
      sequence_number: statement.sequence_number,
      project_id: statement.project_id,
      project_name: statement.project_name,
      status: statement.status,
      status_label: statement.status_label,
      statement_date: statement.statement_date,
      note: statement.notes,
      note_preview: previewText(statement.notes, 180),
      path: statement.path,
    }));

  return {
    context_type: contextType,
    context_id: contextId,
    counts: { total: notes.length },
    notes: notes.slice(0, limit),
  };
}

async function listProjectCompanyCommercials(dbClient, appUser, contextType, contextId, options = {}) {
  const limit = clampLimit(options?.limit, 6, 20);
  const projects = await resolveAccessibleFinanceProjects(dbClient, appUser, contextType, contextId, {
    projectId: options?.project_id,
    projectHint: options?.project_hint,
  });

  if (projects.length === 0) {
    return {
      context_type: contextType,
      context_id: contextId,
      counts: { total: 0 },
      commercials: [],
      message: "No accessible project with commercial agreements was found in the current assistant context.",
    };
  }

  let query = dbClient
    .from("project_company_commercials")
    .select("id,project_id,company_id,contract_type,contract_amount,approved_variations_amount,notes,updated_date")
    .in("project_id", projects.map((project) => project.id));

  const companyId = String(options?.company_id || "").trim();
  if (companyId) {
    query = query.eq("company_id", companyId);
  }

  const commercialsResult = await query.limit(200);
  if (commercialsResult.error) throw commercialsResult.error;

  const projectNameById = new Map(projects.map((project) => [project.id, project.name || project.id]));
  const companyNameById = await loadCompanyNameById(dbClient, (commercialsResult.data || []).map((item) => item.company_id));
  const companyHint = String(options?.company_hint || "").trim();
  const commercials = (commercialsResult.data || [])
    .map((item) => ({
      id: item.id,
      project_id: item.project_id,
      project_name: projectNameById.get(item.project_id) || item.project_id,
      company_id: item.company_id,
      company_name: companyNameById.get(item.company_id) || item.company_id || null,
      contract_type: item.contract_type || null,
      contract_type_label: describeAssistantContractType(item.contract_type),
      contract_amount: Number(item.contract_amount || 0),
      approved_variations_amount: Number(item.approved_variations_amount || 0),
      total_committed_amount: Number(item.contract_amount || 0) + Number(item.approved_variations_amount || 0),
      notes: item.notes || null,
      notes_preview: previewText(item.notes, 160),
      updated_date: item.updated_date || null,
      path: FEATURE_NAVIGATION_HINTS.project_finance.buildPath(item.project_id),
    }))
    .filter((item) => !companyHint || computeAssistantSearchScore([
      item.company_name,
      item.company_id,
      item.project_name,
      item.contract_type_label,
      item.notes,
    ], companyHint) > 0)
    .sort(compareAssistantCommercials);

  return {
    context_type: contextType,
    context_id: contextId,
    counts: {
      total: commercials.length,
      unique_projects: new Set(commercials.map((item) => item.project_id)).size,
      unique_companies: new Set(commercials.map((item) => item.company_id)).size,
    },
    totals: {
      contract_amount: commercials.reduce((sum, item) => sum + Number(item.contract_amount || 0), 0),
      approved_variations_amount: commercials.reduce((sum, item) => sum + Number(item.approved_variations_amount || 0), 0),
    },
    commercials: commercials.slice(0, limit),
  };
}

async function listContextWorkSessions(dbClient, appUser, contextType, contextId, options = {}) {
  const limit = clampLimit(options?.limit, 6, 20);
  const openOnly = options?.open_only === true;
  let query = dbClient
    .from("work_sessions")
    .select("id,company_id,user_email,project_id,started_at,ended_at,note,entry_type,manual_reason,source_mode,created_date");

  if (contextType === "project") {
    const projects = await resolveAccessibleFinanceProjects(dbClient, appUser, contextType, contextId, {
      projectId: options?.project_id,
      projectHint: options?.project_hint,
    });
    const projectIds = projects.map((project) => project.id);
    if (projectIds.length === 0) {
      return {
        context_type: contextType,
        context_id: contextId,
        counts: { total: 0 },
        sessions: [],
      };
    }
    query = query.in("project_id", projectIds);
  } else if (contextType === "company") {
    query = query.eq("company_id", contextId);
    if (options?.project_id || options?.project_hint) {
      const projects = await resolveAccessibleFinanceProjects(dbClient, appUser, contextType, contextId, {
        projectId: options?.project_id,
        projectHint: options?.project_hint,
      });
      const projectIds = projects.map((project) => project.id);
      if (projectIds.length === 0) {
        return {
          context_type: contextType,
          context_id: contextId,
          counts: { total: 0 },
          sessions: [],
        };
      }
      query = query.in("project_id", projectIds);
    }
  } else {
    if (!appUser?.email) {
      return {
        context_type: contextType,
        context_id: contextId,
        counts: { total: 0 },
        sessions: [],
      };
    }
    query = query.eq("user_email", appUser.email);
    if (options?.project_id || options?.project_hint) {
      const projects = await resolveAccessibleFinanceProjects(dbClient, appUser, contextType, contextId, {
        projectId: options?.project_id,
        projectHint: options?.project_hint,
      });
      const projectIds = projects.map((project) => project.id);
      if (projectIds.length === 0) {
        return {
          context_type: contextType,
          context_id: contextId,
          counts: { total: 0 },
          sessions: [],
        };
      }
      query = query.in("project_id", projectIds);
    }
  }

  if (openOnly) {
    query = query.is("ended_at", null);
  }

  const sessionsResult = await query.order("started_at", { ascending: false }).limit(200);
  if (sessionsResult.error) throw sessionsResult.error;

  const companyNameById = await loadCompanyNameById(dbClient, (sessionsResult.data || []).map((session) => session.company_id));
  const projectNameById = await loadProjectNameById(dbClient, (sessionsResult.data || []).map((session) => session.project_id));
  const sessions = (sessionsResult.data || [])
    .map((session) => ({
      id: session.id,
      company_id: session.company_id || null,
      company_name: companyNameById.get(session.company_id) || session.company_id || null,
      project_id: session.project_id || null,
      project_name: projectNameById.get(session.project_id) || session.project_id || null,
      user_email: session.user_email || null,
      started_at: session.started_at || null,
      ended_at: session.ended_at || null,
      note: session.note || null,
      note_preview: previewText(session.note, 160),
      entry_type: session.entry_type || null,
      manual_reason: session.manual_reason || null,
      source_mode: session.source_mode || null,
      status: session.ended_at ? "closed" : "open",
      duration_hours: session.ended_at ? Number(parseAssistantWorkSessionHours(session).toFixed(2)) : null,
      path: session.project_id
        ? FEATURE_NAVIGATION_HINTS.project_finance.buildPath(session.project_id)
        : session.company_id
          ? FEATURE_NAVIGATION_HINTS.company_time_tracking.buildPath(session.company_id)
          : null,
    }))
    .sort(compareAssistantWorkSessions);

  return {
    context_type: contextType,
    context_id: contextId,
    counts: {
      total: sessions.length,
      open: sessions.filter((session) => session.status === "open").length,
      closed: sessions.filter((session) => session.status === "closed").length,
    },
    sessions: sessions.slice(0, limit),
  };
}

async function getMyProfileSummary(dbClient, appUser, contextType, contextId) {
  if (!appUser?.email) {
    return {
      context_type: contextType,
      context_id: contextId,
      found: false,
      message: "No authenticated user profile is available for the current assistant session.",
    };
  }

  const [contextState, memberships, pendingInvites] = await Promise.all([
    getCurrentContextState(dbClient, appUser, contextType, contextId, {}),
    listMyMemberships(dbClient, appUser, contextType, contextId),
    listPendingInvites(dbClient, appUser, contextType, contextId, { limit: 10 }),
  ]);

  return {
    context_type: contextType,
    context_id: contextId,
    found: true,
    profile: {
      email: appUser.email,
      full_name: appUser.full_name || null,
      display_name: appUser.display_name || appUser.full_name || appUser.email,
      phone: appUser.phone || null,
      role: appUser.role || "normal",
      active_context: appUser.active_context || "personal",
      active_company_id: appUser.active_company_id || null,
      active_company_name: contextState?.acting_as?.active_company_name || null,
    },
    current_context: contextState,
    counts: {
      memberships: memberships?.counts?.total || 0,
      pending_invites: pendingInvites?.counts?.total || 0,
      active_company_memberships: (memberships?.memberships || []).filter((entry) => entry.membership_type === "company_membership" && entry.status === "active").length,
      active_project_memberships: (memberships?.memberships || []).filter((entry) => entry.membership_type !== "company_membership" && entry.status === "active").length,
    },
    memberships: (memberships?.memberships || []).slice(0, 8),
    navigation: {
      label: "Impostazioni",
      path: "/app/Settings",
    },
  };
}

async function getPersonalWorkspaceBrief(dbClient, appUser, contextType, contextId, options = {}) {
  const limit = clampLimit(options?.limit, 5, 10);
  if (!appUser?.email) {
    return {
      context_type: contextType,
      context_id: contextId,
      counts: {
        unread_notifications: 0,
        pending_invites: 0,
        open_tasks: 0,
        upcoming_events: 0,
      },
      notifications: [],
      invites: [],
      tasks: [],
      events: [],
    };
  }


async function resolveAssistantCompanyTarget(dbClient, appUser, contextType, contextId) {
  const accessibleCompanyIds = await loadAssistantAccessibleCompanyIds(dbClient, appUser, contextType, contextId);
  if (accessibleCompanyIds.length === 0) {
    return null;
  }

  const companyNameById = await loadCompanyNameById(dbClient, accessibleCompanyIds);
  if (contextType === "company" && contextId) {
    return {
      company_id: contextId,
      company_name: companyNameById.get(contextId) || contextId,
      matched_by: "current_company",
    };
  }

  const activeCompanyId = appUser?.active_company_id || null;
  if (activeCompanyId && accessibleCompanyIds.includes(activeCompanyId)) {
    return {
      company_id: activeCompanyId,
      company_name: companyNameById.get(activeCompanyId) || activeCompanyId,
      matched_by: "active_company",
    };
  }

  if (accessibleCompanyIds.length === 1) {
    return {
      company_id: accessibleCompanyIds[0],
      company_name: companyNameById.get(accessibleCompanyIds[0]) || accessibleCompanyIds[0],
      matched_by: "single_accessible_company",
    };
  }

  return {
    ambiguous: true,
    candidates: accessibleCompanyIds.slice(0, 6).map((companyId) => ({
      company_id: companyId,
      company_name: companyNameById.get(companyId) || companyId,
      path: buildCompanyPath(companyId),
    })),
  };
}

async function resolveAssistantCompanyProject(dbClient, appUser, companyId, options = {}) {
  const projectId = String(options?.projectId || "").trim();
  const projectHint = String(options?.projectHint || "").trim();
  const projects = await getContextProjects(dbClient, appUser, "company", companyId);

  let scopedProjects = projects;
  if (projectId) {
    scopedProjects = projects.filter((project) => project.id === projectId);
  } else if (projectHint) {
    scopedProjects = projects
      .map((project) => ({
        project,
        score: computeAssistantSearchScore([
          project.id,
          project.name,
          project.address,
          project.description,
          project.status,
        ], projectHint),
      }))
      .filter((entry) => entry.score > 0)
      .sort((left, right) => right.score - left.score || compareAssistantProjects(left.project, right.project))
      .map((entry) => entry.project);
  }

  if (scopedProjects.length === 0) {
    return null;
  }

  if (projectId) {
    return {
      matched_by: "project_id",
      project: scopedProjects[0],
    };
  }

  if (projectHint) {
    return {
      matched_by: "project_hint",
      project: scopedProjects[0],
    };
  }

  if (scopedProjects.length === 1) {
    return {
      matched_by: "single_company_project",
      project: scopedProjects[0],
    };
  }

  return {
    ambiguous: true,
    candidates: scopedProjects.slice(0, 6).map((project) => ({
      project_id: project.id,
      project_name: project.name || project.id,
      path: buildProjectPath(project.id),
    })),
  };
}

async function listCompanyProjects(dbClient, appUser, contextType, contextId, options = {}) {
  const companyTarget = await resolveAssistantCompanyTarget(dbClient, appUser, contextType, contextId);
  if (!companyTarget) {
    return {
      context_type: contextType,
      context_id: contextId,
      counts: { total: 0 },
      projects: [],
      message: "No accessible company was found for the current assistant context.",
    };
  }

  if (companyTarget.ambiguous) {
    return {
      context_type: contextType,
      context_id: contextId,
      ambiguous: true,
      candidates: companyTarget.candidates,
      projects: [],
      message: "Multiple accessible companies were found. Please specify which company portfolio to inspect.",
    };
  }

  const baseProjects = await listAccessibleProjects(dbClient, appUser, "company", companyTarget.company_id, options);
  const pricingEntries = await Promise.all((baseProjects.projects || []).map(async (project) => ({
    project_id: project.id,
    pricing: await resolveProjectPricingStatus(dbClient, project.id),
  })));
  const pricingByProjectId = new Map(pricingEntries.map((entry) => [entry.project_id, entry.pricing || null]));
  const sponsorCompanyIds = pricingEntries.map((entry) => entry.pricing?.sponsor_company_id).filter(Boolean);
  const sponsorCompanyNameById = await loadCompanyNameById(dbClient, sponsorCompanyIds);
  const projects = (baseProjects.projects || []).map((project) => {
    const pricing = pricingByProjectId.get(project.id) || null;
    return {
      ...project,
      pricing_status: pricing?.status || "unsponsored",
      sponsor_company_id: pricing?.sponsor_company_id || null,
      sponsor_company_name: pricing?.sponsor_company_id ? sponsorCompanyNameById.get(pricing.sponsor_company_id) || pricing.sponsor_company_id : null,
    };
  });

  return {
    context_type: contextType,
    context_id: contextId,
    company_context_id: companyTarget.company_id,
    target_company: companyTarget,
    counts: {
      ...baseProjects.counts,
      total: projects.length,
      by_pricing_status: countByField(projects, "pricing_status"),
    },
    projects,
  };
}

async function listCompanyMembers(dbClient, appUser, contextType, contextId, options = {}) {
  const companyTarget = await resolveAssistantCompanyTarget(dbClient, appUser, contextType, contextId);
  if (!companyTarget) {
    return {
      context_type: contextType,
      context_id: contextId,
      counts: { total: 0 },
      members: [],
      message: "No accessible company was found for the current assistant context.",
    };
  }

  if (companyTarget.ambiguous) {
    return {
      context_type: contextType,
      context_id: contextId,
      ambiguous: true,
      candidates: companyTarget.candidates,
      members: [],
      message: "Multiple accessible companies were found. Please specify which company team to inspect.",
    };
  }

  const result = await listContextParticipants(dbClient, appUser, "company", companyTarget.company_id, { limit: clampLimit(options?.limit, 8, 20) });
  const members = result.participants || [];

  return {
    context_type: contextType,
    context_id: contextId,
    company_context_id: companyTarget.company_id,
    target_company: companyTarget,
    counts: {
      total: members.length,
      by_status: countByField(members, "status"),
      by_role: countByField(members, "role"),
    },
    members,
  };
}

async function listCompanyChannels(dbClient, appUser, contextType, contextId, options = {}) {
  const companyTarget = await resolveAssistantCompanyTarget(dbClient, appUser, contextType, contextId);
  if (!companyTarget) {
    return {
      context_type: contextType,
      context_id: contextId,
      counts: { total: 0 },
      channels: [],
      message: "No accessible company was found for the current assistant context.",
    };
  }

  if (companyTarget.ambiguous) {
    return {
      context_type: contextType,
      context_id: contextId,
      ambiguous: true,
      candidates: companyTarget.candidates,
      channels: [],
      message: "Multiple accessible companies were found. Please specify which company channels to inspect.",
    };
  }

  const result = await listContextChannels(dbClient, appUser, "company", companyTarget.company_id, {
    limit: clampLimit(options?.limit, 6, 10),
    unread_only: options?.unread_only === true,
    channel_type: options?.channel_type,
    uiMode: options?.uiMode,
  });

  return {
    context_type: contextType,
    context_id: contextId,
    company_context_id: companyTarget.company_id,
    target_company: companyTarget,
    access_mode: result.access_mode,
    counts: result.counts,
    channels: result.channels || [],
  };
}

async function listCompanyDocuments(dbClient, appUser, contextType, contextId, options = {}) {
  const companyTarget = await resolveAssistantCompanyTarget(dbClient, appUser, contextType, contextId);
  if (!companyTarget) {
    return {
      context_type: contextType,
      context_id: contextId,
      counts: { total: 0 },
      documents: [],
      message: "No accessible company was found for the current assistant context.",
    };
  }

  if (companyTarget.ambiguous) {
    return {
      context_type: contextType,
      context_id: contextId,
      ambiguous: true,
      candidates: companyTarget.candidates,
      documents: [],
      message: "Multiple accessible companies were found. Please specify which company documents to inspect.",
    };
  }

  const result = await listContextDocuments(dbClient, appUser, "company", companyTarget.company_id, {
    limit: clampLimit(options?.limit, 6, 15),
    status: options?.status,
    current_only: options?.current_only !== false,
    include_archived: options?.include_archived === true,
  });

  return {
    context_type: contextType,
    context_id: contextId,
    company_context_id: companyTarget.company_id,
    target_company: companyTarget,
    counts: result.counts,
    documents: result.documents || [],
  };
}

async function getCompanySubscriptionStatus(dbClient, appUser, contextType, contextId) {
  const companyTarget = await resolveAssistantCompanyTarget(dbClient, appUser, contextType, contextId);
  if (!companyTarget) {
    return {
      context_type: contextType,
      context_id: contextId,
      found: false,
      message: "No accessible company was found for the current assistant context.",
    };
  }

  if (companyTarget.ambiguous) {
    return {
      context_type: contextType,
      context_id: contextId,
      found: false,
      ambiguous: true,
      candidates: companyTarget.candidates,
      message: "Multiple accessible companies were found. Please specify which company billing profile to inspect.",
    };
  }

  const [subscriptionResult, sponsorshipsResult, billingFeatureAccess, sponsorshipFeatureAccess] = await Promise.all([
    dbClient
      .from("company_subscriptions")
      .select("company_id,plan_code,billing_status,billing_cycle,currency,current_period_start,current_period_end,cancel_at_period_end,canceled_at,stripe_customer_id,stripe_subscription_id")
      .eq("company_id", companyTarget.company_id)
      .maybeSingle(),
    dbClient
      .from("project_sponsorships")
      .select("id,project_id,sponsor_company_id,status,started_at,ended_at,activation_source")
      .eq("sponsor_company_id", companyTarget.company_id)
      .eq("status", "active")
      .order("started_at", { ascending: false })
      .limit(12),
    resolveFeatureAccessForContext(dbClient, "company", companyTarget.company_id, "company_billing"),
    resolveFeatureAccessForContext(dbClient, "company", companyTarget.company_id, "project_sponsorship"),
  ]);

  if (subscriptionResult.error) throw subscriptionResult.error;
  if (sponsorshipsResult.error) throw sponsorshipsResult.error;

  const planCode = subscriptionResult.data?.plan_code || billingFeatureAccess?.plan_code || "free";
  const billingStatus = subscriptionResult.data?.billing_status || (planCode === "paid" ? "active" : "free");
  const subscription = {
    company_id: companyTarget.company_id,
    plan_code: planCode,
    billing_status: billingStatus,
    billing_cycle: subscriptionResult.data?.billing_cycle || null,
    currency: subscriptionResult.data?.currency || "EUR",
    current_period_start: subscriptionResult.data?.current_period_start || null,
    current_period_end: subscriptionResult.data?.current_period_end || null,
    cancel_at_period_end: subscriptionResult.data?.cancel_at_period_end === true,
    canceled_at: subscriptionResult.data?.canceled_at || null,
    stripe_customer_id: subscriptionResult.data?.stripe_customer_id || null,
    stripe_subscription_id: subscriptionResult.data?.stripe_subscription_id || null,
  };
  const projectNameById = await loadProjectNameById(dbClient, (sponsorshipsResult.data || []).map((entry) => entry.project_id));
  const activeSponsorships = (sponsorshipsResult.data || []).map((entry) => ({
    id: entry.id,
    project_id: entry.project_id,
    project_name: projectNameById.get(entry.project_id) || entry.project_id,
    status: entry.status || "active",
    started_at: entry.started_at || null,
    ended_at: entry.ended_at || null,
    activation_source: entry.activation_source || null,
    path: buildProjectPath(entry.project_id),
  }));

  return {
    context_type: contextType,
    context_id: contextId,
    found: true,
    company_context_id: companyTarget.company_id,
    target_company: companyTarget,
    subscription: {
      ...subscription,
      plan_label: planCode === "paid" ? "Pro" : "Base",
      billing_status_label: {
        free: "Base",
        active: "Attivo",
        incomplete: "Da completare",
        past_due: "Pagamento da aggiornare",
        canceled: "Cancellato",
        unpaid: "Pagamento non riuscito",
      }[billingStatus] || billingStatus,
      billing_cycle_label: subscription.billing_cycle === "monthly"
        ? "Mensile"
        : subscription.billing_cycle === "yearly"
          ? "Annuale"
          : null,
    },
    access: {
      billing_access_level: billingFeatureAccess?.access_level || "disabled",
      can_upgrade: Boolean(billingFeatureAccess?.config?.can_upgrade),
      can_manage_subscription: Boolean(billingFeatureAccess?.config?.can_manage_subscription),
      sponsorship_access_level: sponsorshipFeatureAccess?.access_level || "disabled",
      can_sponsor_projects: sponsorshipFeatureAccess?.access_level === "enabled",
    },
    counts: {
      active_sponsorships: activeSponsorships.length,
    },
    active_sponsorships: activeSponsorships,
    navigation: {
      label: "Billing societa",
      path: FEATURE_NAVIGATION_HINTS.company_billing.buildPath(companyTarget.company_id),
    },
  };
}

async function getProjectSponsorshipStatus(dbClient, appUser, contextType, contextId, options = {}) {
  const companyTarget = await resolveAssistantCompanyTarget(dbClient, appUser, contextType, contextId);
  if (!companyTarget) {
    return {
      context_type: contextType,
      context_id: contextId,
      found: false,
      message: "No accessible company was found for the current assistant context.",
    };
  }

  if (companyTarget.ambiguous) {
    return {
      context_type: contextType,
      context_id: contextId,
      found: false,
      ambiguous: true,
      candidates: companyTarget.candidates,
      message: "Multiple accessible companies were found. Please specify which company portfolio to inspect.",
    };
  }

  const projectResolution = await resolveAssistantCompanyProject(dbClient, appUser, companyTarget.company_id, {
    projectId: options?.project_id,
    projectHint: options?.project_hint,
  });

  if (!projectResolution?.project) {
    return {
      context_type: contextType,
      context_id: contextId,
      found: false,
      message: "No company project matched the provided sponsorship reference.",
    };
  }

  if (projectResolution.ambiguous) {
    return {
      context_type: contextType,
      context_id: contextId,
      found: false,
      ambiguous: true,
      candidates: projectResolution.candidates,
      message: "Multiple company projects matched the current request. Please specify which project sponsorship to inspect.",
    };
  }

  const project = projectResolution.project;
  const [pricingStatus, activeSponsorshipResult, sponsorshipHistoryResult, sponsorshipFeatureAccess] = await Promise.all([
    resolveProjectPricingStatus(dbClient, project.id),
    dbClient
      .from("project_sponsorships")
      .select("id,project_id,sponsor_company_id,status,started_at,ended_at,activation_source")
      .eq("project_id", project.id)
      .eq("status", "active")
      .maybeSingle(),
    dbClient
      .from("project_sponsorships")
      .select("id,project_id,sponsor_company_id,status,started_at,ended_at,activation_source")
      .eq("project_id", project.id)
      .order("started_at", { ascending: false })
      .limit(6),
    resolveFeatureAccessForContext(dbClient, "company", companyTarget.company_id, "project_sponsorship"),
  ]);

  if (activeSponsorshipResult.error) throw activeSponsorshipResult.error;
  if (sponsorshipHistoryResult.error) throw sponsorshipHistoryResult.error;

  const sponsorCompanyIds = uniqueValues([
    pricingStatus?.sponsor_company_id,
    activeSponsorshipResult.data?.sponsor_company_id,
    ...(sponsorshipHistoryResult.data || []).map((entry) => entry.sponsor_company_id),
  ]);
  const sponsorCompanyNameById = await loadCompanyNameById(dbClient, sponsorCompanyIds);
  const currentSponsorCompanyId = activeSponsorshipResult.data?.sponsor_company_id || pricingStatus?.sponsor_company_id || null;
  const currentSponsorship = pricingStatus?.status === "sponsored" || activeSponsorshipResult.data
    ? {
        id: activeSponsorshipResult.data?.id || null,
        sponsor_company_id: currentSponsorCompanyId,
        sponsor_company_name: currentSponsorCompanyId ? sponsorCompanyNameById.get(currentSponsorCompanyId) || currentSponsorCompanyId : null,
        status: activeSponsorshipResult.data?.status || "active",
        started_at: activeSponsorshipResult.data?.started_at || null,
        ended_at: activeSponsorshipResult.data?.ended_at || null,
        activation_source: activeSponsorshipResult.data?.activation_source || null,
      }
    : null;
  const history = (sponsorshipHistoryResult.data || []).map((entry) => ({
    id: entry.id,
    sponsor_company_id: entry.sponsor_company_id,
    sponsor_company_name: sponsorCompanyNameById.get(entry.sponsor_company_id) || entry.sponsor_company_id || null,
    status: entry.status || null,
    started_at: entry.started_at || null,
    ended_at: entry.ended_at || null,
    activation_source: entry.activation_source || null,
    is_current: currentSponsorship?.id ? entry.id === currentSponsorship.id : entry.sponsor_company_id === currentSponsorCompanyId && entry.status === "active",
  }));

  return {
    context_type: contextType,
    context_id: contextId,
    found: true,
    company_context_id: companyTarget.company_id,
    target_company: companyTarget,
    matched_by: projectResolution.matched_by,
    project: {
      id: project.id,
      name: project.name || project.id,
      status: project.status || null,
      path: buildProjectPath(project.id),
    },
    pricing: {
      ...(pricingStatus || {}),
      status_label: {
        sponsored: "Sponsorizzato",
        unsponsored: "Richiede sponsorship",
        blocked_for_sponsor_loss: "Bloccato per perdita sponsor",
      }[pricingStatus?.status || "unsponsored"] || (pricingStatus?.status || "unsponsored"),
      sponsor_company_name: currentSponsorCompanyId ? sponsorCompanyNameById.get(currentSponsorCompanyId) || currentSponsorCompanyId : null,
    },
    sponsorship_access: {
      access_level: sponsorshipFeatureAccess?.access_level || "disabled",
      can_sponsor_projects: sponsorshipFeatureAccess?.access_level === "enabled",
      current_company_is_sponsor: currentSponsorCompanyId === companyTarget.company_id,
    },
    current_sponsorship: currentSponsorship,
    counts: {
      history: history.length,
    },
    history,
    navigation: {
      label: "Sponsorizzazione progetto",
      path: FEATURE_NAVIGATION_HINTS.project_sponsorship.buildPath(project.id),
    },
  };
}
  const personalContextId = appUser.id || appUser.email || contextId;
  const [notifications, invites, tasksSnapshot, scheduleSnapshot, memberships] = await Promise.all([
    listContextNotifications(dbClient, appUser, "personal", personalContextId, { limit, unread_only: true }),
    listPendingInvites(dbClient, appUser, "personal", personalContextId, { limit }),
    listContextTasks(dbClient, appUser, "personal", personalContextId, { limit }),
    listContextSchedule(dbClient, appUser, "personal", personalContextId, { limit, include_past: false }),
    listMyMemberships(dbClient, appUser, "personal", personalContextId),
  ]);

  const tasks = (tasksSnapshot?.tasks || []).filter((task) => task.status !== "completed");
  const events = scheduleSnapshot?.schedule || [];

  return {
    context_type: contextType,
    context_id: contextId,
    personal_context_id: personalContextId,
    counts: {
      unread_notifications: notifications?.counts?.total || (notifications?.notifications || []).length,
      pending_invites: invites?.counts?.total || (invites?.invites || []).length,
      open_tasks: tasks.length,
      upcoming_events: events.length,
      memberships: memberships?.counts?.total || 0,
    },
    notifications: (notifications?.notifications || []).slice(0, limit),
    invites: (invites?.invites || []).slice(0, limit),
    tasks: tasks.slice(0, limit),
    events: events.slice(0, limit),
    memberships: (memberships?.memberships || []).slice(0, Math.min(limit, 5)),
    navigation: {
      dashboard: "/app/Dashboard",
      notifications: "/app/Notifications",
      calendar: "/app/Calendar",
      settings: "/app/Settings",
    },
  };
}

async function listContextNotifications(dbClient, appUser, contextType, contextId, options = {}) {
  const limit = clampLimit(options?.limit, 5, 10);
  const unreadOnly = options?.unread_only === true;

  if (!appUser?.email) {
    return {
      context_type: contextType,
      context_id: contextId,
      notifications: [],
    };
  }

  if (contextType === "personal" || contextType === "company") {
    let notificationsQuery = dbClient
      .from("notifications")
      .select("id,type,title,message,created_date,is_read,context_type,context_company_id,related_event_id")
      .eq("user_email", appUser.email)
      .eq("context_type", contextType);

    if (contextType === "company") {
      notificationsQuery = notificationsQuery.eq("context_company_id", contextId);
    }

    if (unreadOnly) {
      notificationsQuery = notificationsQuery.eq("is_read", false);
    }

    const { data, error } = await notificationsQuery.order("created_date", { ascending: false }).limit(limit);
    if (error) throw error;

    return formatAssistantNotifications({
      contextType,
      contextId,
      notifications: data || [],
    });
  }

  let notificationsQuery = dbClient
    .from("notifications")
    .select("id,type,title,message,created_date,is_read,context_type,context_company_id,related_event_id")
    .eq("user_email", appUser.email);

  if (unreadOnly) {
    notificationsQuery = notificationsQuery.eq("is_read", false);
  }

  const { data: recentNotifications, error: notificationsError } = await notificationsQuery
    .order("created_date", { ascending: false })
    .limit(40);

  if (notificationsError) throw notificationsError;

  const eventIds = uniqueValues((recentNotifications || [])
    .filter((notification) => EVENT_BASED_NOTIFICATION_TYPES.has(notification.type))
    .map((notification) => notification.related_event_id));
  const messageIds = uniqueValues((recentNotifications || [])
    .filter((notification) => notification.type === "message_mention")
    .map((notification) => notification.related_event_id));

  const [eventProjectById, messageProjectById] = await Promise.all([
    loadEventProjectIdByEventId(dbClient, eventIds),
    loadMessageProjectIdByMessageId(dbClient, messageIds),
  ]);

  const notifications = (recentNotifications || [])
    .filter((notification) => isNotificationRelevantToProject(notification, contextId, eventProjectById, messageProjectById))
    .slice(0, limit);

  return formatAssistantNotifications({
    contextType,
    contextId,
    notifications,
    eventProjectById,
    messageProjectById,
  });
}

async function getContextProjects(dbClient, appUser, contextType, contextId) {
  const projectSelect = "id,name,address,status,description,start_date,end_date,owner_type,owner_company_id,owner_user_id";
  const projectMap = new Map();

  const addProjects = (projects = []) => {
    projects.forEach((project) => {
      if (project?.id) {
        projectMap.set(project.id, project);
      }
    });
  };

  if (contextType === "project") {
    const { data, error } = await dbClient
      .from("projects")
      .select(projectSelect)
      .eq("id", contextId)
      .maybeSingle();

    if (error) throw error;
    addProjects(data ? [data] : []);
    return Array.from(projectMap.values());
  }

  if (contextType === "company") {
    const [ownedProjectsResult, participationsResult] = await Promise.all([
      dbClient
        .from("projects")
        .select(projectSelect)
        .eq("owner_company_id", contextId),
      dbClient
        .from("project_participants")
        .select("project_id,status")
        .eq("participant_type", "company")
        .eq("company_id", contextId)
        .in("status", ["active", "invited"]),
    ]);

    if (ownedProjectsResult.error) throw ownedProjectsResult.error;
    if (participationsResult.error) throw participationsResult.error;

    addProjects(ownedProjectsResult.data || []);

    const projectIds = uniqueValues((participationsResult.data || []).map((participation) => participation.project_id))
      .filter((projectId) => !projectMap.has(projectId));

    if (projectIds.length > 0) {
      const { data, error } = await dbClient
        .from("projects")
        .select(projectSelect)
        .in("id", projectIds);

      if (error) throw error;
      addProjects(data || []);
    }

    return Array.from(projectMap.values());
  }

  const [ownedProjectsResult, participationsResult] = await Promise.all([
    appUser?.id
      ? dbClient
        .from("projects")
        .select(projectSelect)
        .eq("owner_user_id", appUser.id)
      : Promise.resolve({ data: [], error: null }),
    appUser?.email
      ? dbClient
        .from("project_participants")
        .select("project_id,status")
        .eq("participant_type", "personal")
        .eq("user_email", appUser.email)
        .in("status", ["active", "invited"])
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (ownedProjectsResult.error) throw ownedProjectsResult.error;
  if (participationsResult.error) throw participationsResult.error;

  addProjects(ownedProjectsResult.data || []);

  const projectIds = uniqueValues((participationsResult.data || []).map((participation) => participation.project_id))
    .filter((projectId) => !projectMap.has(projectId));

  if (projectIds.length > 0) {
    const { data, error } = await dbClient
      .from("projects")
      .select(projectSelect)
      .in("id", projectIds);

    if (error) throw error;
    addProjects(data || []);
  }

  return Array.from(projectMap.values());
}

async function loadUserNameByEmail(dbClient, emails = []) {
  const uniqueEmails = uniqueValues(emails);
  if (uniqueEmails.length === 0) {
    return new Map();
  }

  try {
    const { data, error } = await dbClient
      .from("users")
      .select("email,full_name,display_name")
      .in("email", uniqueEmails);

    if (error) throw error;
    return new Map((data || []).map((user) => [user.email, resolveAssistantUserDisplayName(user)]));
  } catch {
    return new Map();
  }
}

async function loadUserNameById(dbClient, userIds = []) {
  const uniqueUserIds = uniqueValues(userIds);
  if (uniqueUserIds.length === 0) {
    return new Map();
  }

  try {
    const { data, error } = await dbClient
      .from("users")
      .select("id,email,full_name,display_name")
      .in("id", uniqueUserIds);

    if (error) throw error;
    return new Map((data || []).map((user) => [user.id, resolveAssistantUserDisplayName(user)]));
  } catch {
    return new Map();
  }
}

function resolveAssistantUserDisplayName(user) {
  return user?.display_name || user?.full_name || user?.email || null;
}

async function loadCompanyNameById(dbClient, companyIds = []) {
  const uniqueCompanyIds = uniqueValues(companyIds);
  if (uniqueCompanyIds.length === 0) {
    return new Map();
  }

  try {
    const { data, error } = await dbClient
      .from("companies")
      .select("id,name")
      .in("id", uniqueCompanyIds);

    if (error) throw error;
    return new Map((data || []).map((company) => [company.id, company.name || company.id]));
  } catch {
    return new Map();
  }
}

async function loadProjectNameById(dbClient, projectIds = []) {
  const uniqueProjectIds = uniqueValues(projectIds);
  if (uniqueProjectIds.length === 0) {
    return new Map();
  }

  try {
    const { data, error } = await dbClient
      .from("projects")
      .select("id,name")
      .in("id", uniqueProjectIds);

    if (error) throw error;
    return new Map((data || []).map((project) => [project.id, project.name || project.id]));
  } catch {
    return new Map();
  }
}

async function loadEventsById(dbClient, eventIds = []) {
  const uniqueEventIds = uniqueValues(eventIds);
  if (uniqueEventIds.length === 0) {
    return new Map();
  }

  try {
    const { data, error } = await dbClient
      .from("events")
      .select("id,title,location,start_datetime,end_datetime,status,owner_project_id,owner_company_id")
      .in("id", uniqueEventIds);

    if (error) throw error;
    return new Map((data || []).map((event) => [event.id, event]));
  } catch {
    return new Map();
  }
}

async function loadEventProjectIdByEventId(dbClient, eventIds = []) {
  const uniqueEventIds = uniqueValues(eventIds);
  if (uniqueEventIds.length === 0) {
    return new Map();
  }

  const { data, error } = await dbClient
    .from("events")
    .select("id,owner_project_id")
    .in("id", uniqueEventIds);

  if (error) throw error;
  return new Map((data || []).map((event) => [event.id, event.owner_project_id || null]));
}

async function loadMessageProjectIdByMessageId(dbClient, messageIds = []) {
  const uniqueMessageIds = uniqueValues(messageIds);
  if (uniqueMessageIds.length === 0) {
    return new Map();
  }

  const { data, error } = await dbClient
    .from("messages")
    .select("id,project_id")
    .in("id", uniqueMessageIds);

  if (error) throw error;
  return new Map((data || []).map((message) => [message.id, message.project_id || null]));
}

function formatAssistantNotifications({
  contextType,
  contextId,
  notifications = [],
  eventProjectById = new Map(),
  messageProjectById = new Map(),
}) {
  return {
    context_type: contextType,
    context_id: contextId,
    notifications: notifications.map((notification) => ({
      id: notification.id,
      type: notification.type,
      title: notification.title,
      summary: previewText(notification.message, 160),
      is_read: notification.is_read === true,
      created_date: notification.created_date,
      path: buildNotificationTarget(notification, { eventProjectById, messageProjectById }),
    })),
  };
}

function isNotificationRelevantToProject(notification, projectId, eventProjectById, messageProjectById) {
  if (!notification?.related_event_id) {
    return false;
  }

  if (DIRECT_PROJECT_NOTIFICATION_TYPES.has(notification.type)) {
    return notification.related_event_id === projectId;
  }

  if (EVENT_BASED_NOTIFICATION_TYPES.has(notification.type)) {
    return eventProjectById.get(notification.related_event_id) === projectId;
  }

  if (notification.type === "message_mention") {
    return messageProjectById.get(notification.related_event_id) === projectId;
  }

  return false;
}

async function listRecentUpdates(dbClient, appUser, contextType, contextId, options = {}) {
  const limit = clampLimit(options?.limit, 5, 10);
  let updates = [];

  if (contextType === "project") {
    const [documentsResult, messagesResult, changesResult, milestonesResult] = await Promise.all([
      dbClient.from("project_documents").select("id,name,description,updated_date").eq("project_id", contextId).order("updated_date", { ascending: false }).limit(limit),
      dbClient.from("messages").select("id,content,sender_name,created_date").eq("project_id", contextId).order("created_date", { ascending: false }).limit(limit),
      dbClient.from("change_requests").select("id,title,status,updated_date").eq("project_id", contextId).order("updated_date", { ascending: false }).limit(limit),
      dbClient.from("milestones").select("id,title,status,updated_date,target_date").eq("project_id", contextId).order("updated_date", { ascending: false }).limit(limit),
    ]);

    if (documentsResult.error) throw documentsResult.error;
    if (messagesResult.error) throw messagesResult.error;
    if (changesResult.error) throw changesResult.error;
    if (milestonesResult.error) throw milestonesResult.error;

    updates = [
      ...(documentsResult.data || []).map((document) => ({
        type: "document",
        title: document.name,
        summary: previewText(document.description || "Documento aggiornato", 140),
        created_date: document.updated_date,
        path: buildProjectDocumentsPath(contextId),
      })),
      ...(messagesResult.data || []).map((message) => ({
        type: "message",
        title: message.sender_name || "Nuovo messaggio",
        summary: previewText(message.content, 140),
        created_date: message.created_date,
        path: `${buildProjectPath(contextId)}&tab=info&section=chat`,
      })),
      ...(changesResult.data || []).map((change) => ({
        type: "change_request",
        title: change.title,
        summary: `Stato: ${change.status}`,
        created_date: change.updated_date,
        path: `${buildProjectPath(contextId)}&tab=lavori&section=changes`,
      })),
      ...(milestonesResult.data || []).map((milestone) => ({
        type: "milestone",
        title: milestone.title,
        summary: `Stato: ${milestone.status}${milestone.target_date ? ` · Target ${milestone.target_date}` : ""}`,
        created_date: milestone.updated_date,
        path: `${buildProjectPath(contextId)}&tab=lavori&section=milestones`,
      })),
    ];
  } else if (contextType === "company") {
    const [documentsResult, workSessionsResult, channelsResult] = await Promise.all([
      dbClient.from("project_documents").select("id,name,description,updated_date").eq("company_id", contextId).order("updated_date", { ascending: false }).limit(limit),
      dbClient.from("work_sessions").select("id,user_email,note,started_at,ended_at").eq("company_id", contextId).order("started_at", { ascending: false }).limit(limit),
      dbClient.from("channels").select("id,name,description,updated_date").eq("company_id", contextId).order("updated_date", { ascending: false }).limit(limit),
    ]);

    if (documentsResult.error) throw documentsResult.error;
    if (workSessionsResult.error) throw workSessionsResult.error;
    if (channelsResult.error) throw channelsResult.error;

    updates = [
      ...(documentsResult.data || []).map((document) => ({
        type: "document",
        title: document.name,
        summary: previewText(document.description || "Documento societa aggiornato", 140),
        created_date: document.updated_date,
        path: buildCompanyPath(contextId),
      })),
      ...(workSessionsResult.data || []).map((session) => ({
        type: "work_session",
        title: session.user_email || "Timbratura",
        summary: previewText(session.note || (session.ended_at ? "Sessione chiusa" : "Sessione aperta"), 140),
        created_date: session.started_at,
        path: `${buildCompanyPath(contextId)}&tab=operativita&section=all`,
      })),
      ...(channelsResult.data || []).map((channel) => ({
        type: "channel",
        title: channel.name,
        summary: previewText(channel.description || "Canale societa aggiornato", 140),
        created_date: channel.updated_date,
        path: `${buildCompanyPath(contextId)}&tab=operativita&section=chat`,
      })),
    ];
  } else {
    if (!appUser?.email) {
      return {
        context_type: contextType,
        context_id: contextId,
        updates: [],
      };
    }

    const notificationsResult = await dbClient
      .from("notifications")
      .select("id,type,title,message,created_date,context_company_id,related_event_id")
      .eq("user_email", appUser.email)
      .order("created_date", { ascending: false })
      .limit(limit);

    if (notificationsResult.error) throw notificationsResult.error;

    updates = (notificationsResult.data || []).map((notification) => ({
      type: notification.type,
      title: notification.title,
      summary: previewText(notification.message, 140),
      created_date: notification.created_date,
      path: buildNotificationTarget(notification),
    }));
  }

  return {
    context_type: contextType,
    context_id: contextId,
    updates: updates
      .sort((left, right) => String(right.created_date || "").localeCompare(String(left.created_date || "")))
      .slice(0, limit),
  };
}

async function getContextNotes(dbClient, contextType, contextId, options = {}) {
  const limit = clampLimit(options?.limit, 5, 10);

  if (contextType === "project") {
    const [commentsResult, progressResult, documentsResult] = await Promise.all([
      dbClient.from("document_comments").select("id,document_id,comment,author_name,created_date").eq("project_id", contextId).order("created_date", { ascending: false }).limit(limit),
      dbClient.from("progress_statements").select("id,sequence_number,notes,updated_date").eq("project_id", contextId).not("notes", "is", null).order("updated_date", { ascending: false }).limit(limit),
      dbClient.from("project_documents").select("id,name").eq("project_id", contextId),
    ]);

    if (commentsResult.error) throw commentsResult.error;
    if (progressResult.error) throw progressResult.error;
    if (documentsResult.error) throw documentsResult.error;

    const documentNameById = new Map((documentsResult.data || []).map((document) => [document.id, document.name]));
    const notes = [
      ...(commentsResult.data || []).map((comment) => ({
        type: "document_comment",
        title: documentNameById.get(comment.document_id) || "Commento documento",
        summary: `${comment.author_name || "Utente"}: ${previewText(comment.comment, 160)}`,
        created_date: comment.created_date,
        path: buildProjectDocumentsPath(contextId),
      })),
      ...(progressResult.data || []).map((statement) => ({
        type: "progress_statement_note",
        title: `SAL #${statement.sequence_number}`,
        summary: previewText(statement.notes, 160),
        created_date: statement.updated_date,
        path: `${buildProjectPath(contextId)}&tab=economia&section=progress`,
      })),
    ];

    return {
      context_type: contextType,
      context_id: contextId,
      notes: notes
        .sort((left, right) => String(right.created_date || "").localeCompare(String(left.created_date || "")))
        .slice(0, limit),
    };
  }

  if (contextType === "company") {
    const workSessionsResult = await dbClient
      .from("work_sessions")
      .select("id,user_email,note,started_at")
      .eq("company_id", contextId)
      .not("note", "is", null)
      .order("started_at", { ascending: false })
      .limit(limit);

    if (workSessionsResult.error) throw workSessionsResult.error;

    return {
      context_type: contextType,
      context_id: contextId,
      notes: (workSessionsResult.data || []).map((session) => ({
        type: "work_session_note",
        title: session.user_email || "Nota operativa",
        summary: previewText(session.note, 160),
        created_date: session.started_at,
        path: `${buildCompanyPath(contextId)}&tab=operativita&section=all`,
      })),
    };
  }

  return {
    context_type: contextType,
    context_id: contextId,
    notes: [],
  };
}

async function requestChatCompletion(messages) {
  if (MODEL_PROVIDER === "gemini") {
    throw new Error("requestChatCompletion should not be used with the Gemini provider");
  }

  const response = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_CHAT_MODEL,
      temperature: 0.2,
      messages,
      tools: ASSISTANT_TOOL_DEFINITIONS,
      tool_choice: "auto",
    }),
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(payload?.error?.message || payload?.message || "OpenAI chat completion failed");
  }

  return payload?.choices?.[0]?.message || null;
}

async function requestGeminiCompletion({ appUser, contextType, contextId, uiMode, routePath, routeSearch, userMessage, historyMessages, ragMatches, toolCalls }) {
  const requestBody = {
    systemInstruction: {
      parts: [{ text: buildSystemPrompt({ appUser, contextType, contextId, uiMode, routePath, routeSearch, ragMatches }) }],
    },
    contents: buildGeminiContents({ historyMessages, userMessage, toolCalls, ragMatches }),
  };

  let lastError = null;

  for (const modelName of getGeminiModelCandidates()) {
    const response = await fetch(
      `${GEMINI_BASE_URL}/models/${encodeURIComponent(modelName)}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      },
    );

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      const errorMessage = payload?.error?.message || payload?.message || "Gemini generateContent failed";
      if (shouldRetryGeminiModel(modelName, errorMessage)) {
        console.warn(`Gemini model ${modelName} unavailable, retrying with fallback model.`);
        lastError = new Error(errorMessage);
        continue;
      }

      throw new Error(errorMessage);
    }

    const candidate = payload?.candidates?.[0];
    const parts = Array.isArray(candidate?.content?.parts) ? candidate.content.parts : [];
    const text = parts
      .map((part) => (typeof part?.text === "string" ? part.text : ""))
      .join("")
      .trim();

    if (text) {
      return text;
    }

    if (payload?.promptFeedback?.blockReason) {
      throw new Error(`Gemini blocked the request: ${payload.promptFeedback.blockReason}`);
    }

    return "";
  }

  throw lastError || new Error("Gemini generateContent failed");
}

function getGeminiModelCandidates() {
  return Array.from(new Set([
    GEMINI_MODEL,
    DEFAULT_GEMINI_MODEL,
  ].filter(Boolean)));
}

function shouldRetryGeminiModel(modelName, errorMessage) {
  if (!errorMessage || modelName === DEFAULT_GEMINI_MODEL) {
    return false;
  }

  return /is not found for api version|is not supported|not found/i.test(String(errorMessage));
}

function buildSystemPrompt({ appUser, contextType, contextId, uiMode = "normal", routePath = "", routeSearch = "", ragMatches }) {
  const assistantChatScope = deriveAssistantChatScope(appUser);
  const routeInfo = describeAssistantRoute(routePath, routeSearch, contextType, contextId, uiMode);
  const ragBlock = ragMatches.length > 0
    ? [
        "Relevant semantic context snippets:",
        ...ragMatches.map((match, index) => `${index + 1}. ${match.title || match.source_type}: ${previewText(match.content, 220)}`),
      ].join("\n")
    : "No semantic snippets were found for this request.";

  return [
    ...ASSISTANT_PROMPT_PROFILE_LINES,
    `Current assistant conversation scope type: ${assistantChatScope?.type || "personal"}.`,
    `Current assistant conversation scope id: ${assistantChatScope?.id || "unknown"}.`,
    `Current assistant focus context type: ${contextType}.`,
    `Current assistant focus context id: ${contextId}.`,
    `Current UI mode: ${normalizeAssistantUiMode(uiMode)}.`,
    `Current route: ${routeInfo.full_path}.`,
    `Current route project id: ${routeInfo.project_id || "none"}.`,
    `Current user email: ${appUser?.email || "unknown"}.`,
    ragBlock,
  ].join("\n\n");
}

function buildDeterministicReply({ contextType, userMessage, ragMatches, toolCalls }) {
  const sections = [];
  const normalizedMessage = String(userMessage || "").toLowerCase();
  const wantsOverview = /riepilog|summary|overview|quadro|situazion/.test(normalizedMessage);
  const wantsNotes = /nota|note|comment|commento|progress|sal|annot/i.test(normalizedMessage);

  if (wantsOverview) {
    sections.push(
      contextType === "project"
        ? "## Quadro cantiere"
        : contextType === "company"
          ? "## Quadro societa"
          : "## Quadro personale",
    );
  }

  toolCalls.forEach((toolCall) => {
    const rawResults = safeJsonParse(toolCall.results, {});
    if (toolCall.name === "get_current_context_state") {
      sections.push("\n## Contesto attivo");
      sections.push(`- Contesto: ${rawResults.context?.label || rawResults.context_type || "n/d"}${rawResults.context?.name ? ` · ${rawResults.context.name}` : ""}`);
      if (rawResults.focus_context?.label) {
        sections.push(`- Focus corrente: ${rawResults.focus_context.label}${rawResults.focus_context?.name ? ` · ${rawResults.focus_context.name}` : ""}`);
      } else if (rawResults.route?.project_name) {
        sections.push(`- Cantiere aperto: ${rawResults.route.project_name}`);
      }
      sections.push(`- Modalita UI: ${rawResults.ui_mode || "n/d"}`);
      if (rawResults.acting_as?.role || rawResults.acting_as?.membership_role) {
        sections.push(`- Ruolo operativo: ${[rawResults.acting_as.role, rawResults.acting_as.membership_role].filter(Boolean).join(" · ")}`);
      }
      if (rawResults.route?.label) {
        sections.push(`- Pagina corrente: ${rawResults.route.label}${rawResults.route.tab ? ` · tab ${rawResults.route.tab}` : ""}${rawResults.route.section ? ` · sezione ${rawResults.route.section}` : ""}`);
      }
    }

    if (toolCall.name === "get_context_capabilities") {
      const capabilities = Array.isArray(rawResults?.capabilities) ? rawResults.capabilities : [];
      if (capabilities.length > 0) {
        sections.push("\n## Capacita del contesto");
        const enabled = capabilities.filter((capability) => capability.access_level === "enabled").slice(0, 4);
        const limited = capabilities.filter((capability) => capability.access_level === "limited").slice(0, 4);
        const disabled = capabilities.filter((capability) => capability.access_level === "disabled").slice(0, 4);

        enabled.forEach((capability) => {
          const suffix = capability.navigation?.path ? ` ([Apri](${capability.navigation.path}))` : "";
          sections.push(`- Disponibile: ${capability.name}${suffix}`);
        });
        limited.forEach((capability) => {
          const details = capability.limits?.length ? ` · ${capability.limits.join(" · ")}` : "";
          const suffix = capability.navigation?.path ? ` ([Apri](${capability.navigation.path}))` : "";
          sections.push(`- Limitata: ${capability.name}${details}${suffix}`);
        });
        disabled.forEach((capability) => {
          const suffix = capability.navigation?.path ? ` ([Apri](${capability.navigation.path}))` : "";
          sections.push(`- Bloccata: ${capability.name}${suffix}`);
        });
      }
    }

    if (toolCall.name === "explain_feature_availability") {
      sections.push("\n## Disponibilita funzione");
      sections.push(`- Funzione: ${rawResults.feature_name || rawResults.feature_key || "n/d"}`);
      sections.push(`- Stato: ${rawResults.access_level || "n/d"}`);
      if (rawResults.message) {
        sections.push(`- Motivo: ${rawResults.message}`);
      }
      if (rawResults.navigation?.path) {
        sections.push(`- Dove guardare: [${rawResults.navigation.label || "Apri sezione"}](${rawResults.navigation.path})`);
      }
    }

    if (toolCall.name === "search_context_entities") {
      const results = Array.isArray(rawResults?.results) ? rawResults.results : [];
      if (results.length > 0) {
        sections.push(`\n## Ricerca nel contesto${rawResults.query ? ` · ${rawResults.query}` : ""}`);
        results.slice(0, 6).forEach((result) => {
          const suffix = result.path ? ` ([Apri](${result.path}))` : "";
          sections.push(`- ${result.title}: ${result.summary || result.entity_type}${suffix}`);
        });
      }
    }

    if (toolCall.name === "get_navigation_help") {
      sections.push("\n## Navigazione");
      sections.push(`- Destinazione: ${rawResults.label || rawResults.topic_key || "Sezione richiesta"}`);
      if (rawResults.explanation) {
        sections.push(`- Indicazione: ${rawResults.explanation}`);
      }
      if (rawResults.navigation?.path) {
        sections.push(`- Apri: [${rawResults.navigation.label || "Apri sezione"}](${rawResults.navigation.path})`);
      }
    }

    if (toolCall.name === "list_pending_invites") {
      const invites = Array.isArray(rawResults?.invites) ? rawResults.invites : [];
      if (invites.length > 0) {
        sections.push("\n## Inviti aperti");
        invites.slice(0, 6).forEach((invite) => {
          const suffix = invite.path ? ` ([Apri](${invite.path}))` : "";
          sections.push(`- ${invite.title}: ${invite.summary || invite.status}${suffix}`);
        });
      }
    }

    if (toolCall.name === "list_my_memberships") {
      const memberships = Array.isArray(rawResults?.memberships) ? rawResults.memberships : [];
      if (memberships.length > 0) {
        sections.push("\n## Membership e ruoli");
        memberships.slice(0, 8).forEach((membership) => {
          const currentMarker = membership.is_current_context ? " · contesto attivo" : "";
          const suffix = membership.path ? ` ([Apri](${membership.path}))` : "";
          sections.push(`- ${membership.name}: ${membership.role || membership.membership_type}${currentMarker}${suffix}`);
        });
      }
    }

    if (toolCall.name === "list_pending_decisions") {
      const decisions = Array.isArray(rawResults?.decisions) ? rawResults.decisions : [];
      if (decisions.length > 0) {
        sections.push("\n## Decisioni in sospeso");
        decisions.slice(0, 6).forEach((decision) => {
          const suffix = decision.path ? ` ([Apri](${decision.path}))` : "";
          sections.push(`- ${decision.title}: ${decision.summary || decision.status}${suffix}`);
        });
      }
    }

    if (toolCall.name === "get_today_deadlines") {
      const deadlines = Array.isArray(rawResults?.deadlines) ? rawResults.deadlines : [];
      if (deadlines.length > 0) {
        sections.push("\n## Scadenze di oggi");
        deadlines.slice(0, 6).forEach((deadline) => {
          const typeLabel = deadline.deadline_type === "due_today" ? "Scade oggi" : deadline.deadline_type === "in_progress" ? "Gia in corso" : null;
          const fragments = [typeLabel, deadline.project_name, deadline.assignment, deadline.due_date ? `Scadenza ${deadline.due_date}` : null].filter(Boolean).join(" · ");
          const suffix = deadline.path ? ` ([Apri](${deadline.path}))` : "";
          sections.push(`- ${deadline.title}: ${fragments}${suffix}`);
        });
      }
    }

    if (toolCall.name === "list_blocked_tasks") {
      const tasks = Array.isArray(rawResults?.tasks) ? rawResults.tasks : [];
      if (tasks.length > 0) {
        sections.push("\n## Task bloccate");
        tasks.slice(0, 6).forEach((task) => {
          const fragments = [task.project_name, task.blocked_by ? `In attesa di ${task.blocked_by}` : null, task.impact].filter(Boolean).join(" · ");
          const suffix = task.path ? ` ([Apri](${task.path}))` : "";
          sections.push(`- ${task.title}: ${task.blocked_reason || fragments}${task.blocked_reason && fragments ? ` · ${fragments}` : ""}${suffix}`);
        });
      }
    }

    if (toolCall.name === "get_task_detail" && rawResults?.found && rawResults?.task) {
      sections.push("\n## Dettaglio task");
      sections.push(`- Task: ${rawResults.task.title}`);
      sections.push(`- Stato: ${rawResults.task.status || "n/d"}`);
      if (rawResults.task.assignment) {
        sections.push(`- Assegnazione: ${rawResults.task.assignment}`);
      }
      if (rawResults.task.project_name) {
        sections.push(`- Cantiere: ${rawResults.task.project_name}`);
      }
      if (rawResults.task.due_date) {
        sections.push(`- Scadenza: ${rawResults.task.due_date}`);
      }
      if (rawResults.task.block?.is_blocked) {
        sections.push(`- Blocco: ${rawResults.task.block.reason || "Task bloccata"}${rawResults.task.block.blocked_by ? ` · In attesa di ${rawResults.task.block.blocked_by}` : ""}`);
      }
      if (rawResults.task.navigation?.path) {
        sections.push(`- Apri task: [${rawResults.task.navigation.label || "Apri task"}](${rawResults.task.navigation.path})`);
      }
    }

    if (toolCall.name === "list_context_milestones") {
      const milestones = Array.isArray(rawResults?.milestones) ? rawResults.milestones : [];
      if (milestones.length > 0) {
        sections.push("\n## Milestone");
        milestones.slice(0, 6).forEach((milestone) => {
          const fragments = [milestone.status, milestone.project_name, milestone.target_date ? `Target ${milestone.target_date}` : null, milestone.linked_tasks_count ? `${milestone.completed_tasks_count}/${milestone.linked_tasks_count} task` : null].filter(Boolean).join(" · ");
          const suffix = milestone.path ? ` ([Apri](${milestone.path}))` : "";
          sections.push(`- ${milestone.title}: ${fragments}${suffix}`);
        });
      }
    }

    if (toolCall.name === "get_milestone_detail" && rawResults?.found && rawResults?.milestone) {
      sections.push("\n## Dettaglio milestone");
      sections.push(`- Milestone: ${rawResults.milestone.title}`);
      sections.push(`- Stato: ${rawResults.milestone.status || "n/d"}`);
      if (rawResults.milestone.project_name) {
        sections.push(`- Cantiere: ${rawResults.milestone.project_name}`);
      }
      if (rawResults.milestone.target_date) {
        sections.push(`- Target: ${rawResults.milestone.target_date}`);
      }
      if (Number.isFinite(Number(rawResults.milestone.linked_tasks_count))) {
        sections.push(`- Task collegate: ${rawResults.milestone.completed_tasks_count || 0}/${rawResults.milestone.linked_tasks_count}`);
      }
      if (rawResults.milestone.navigation?.path) {
        sections.push(`- Apri milestone: [${rawResults.milestone.navigation.label || "Apri milestone"}](${rawResults.milestone.navigation.path})`);
      }
    }

    if (toolCall.name === "list_context_change_requests") {
      const changeRequests = Array.isArray(rawResults?.change_requests) ? rawResults.change_requests : [];
      if (changeRequests.length > 0) {
        sections.push("\n## Varianti");
        changeRequests.slice(0, 6).forEach((request) => {
          const fragments = [request.status, request.project_name, request.assignment, request.cost_impact ? `€${request.cost_impact}` : null, request.time_impact_days ? `+${request.time_impact_days} giorni` : null].filter(Boolean).join(" · ");
          const suffix = request.path ? ` ([Apri](${request.path}))` : "";
          sections.push(`- ${request.title}: ${fragments}${suffix}`);
        });
      }
    }

    if (toolCall.name === "get_change_request_detail" && rawResults?.found && rawResults?.change_request) {
      sections.push("\n## Dettaglio variante");
      sections.push(`- Variante: ${rawResults.change_request.title}`);
      sections.push(`- Stato: ${rawResults.change_request.status || "n/d"}`);
      if (rawResults.change_request.project_name) {
        sections.push(`- Cantiere: ${rawResults.change_request.project_name}`);
      }
      if (rawResults.change_request.assignment) {
        sections.push(`- Assegnazione: ${rawResults.change_request.assignment}`);
      }
      if (rawResults.change_request.cost_impact) {
        sections.push(`- Impatto costi: €${rawResults.change_request.cost_impact}`);
      }
      if (rawResults.change_request.time_impact_days) {
        sections.push(`- Impatto tempi: +${rawResults.change_request.time_impact_days} giorni`);
      }
      if (rawResults.change_request.response_note) {
        sections.push(`- Risposta: ${rawResults.change_request.response_note}`);
      }
      if (rawResults.change_request.navigation?.path) {
        sections.push(`- Apri variante: [${rawResults.change_request.navigation.label || "Apri variante"}](${rawResults.change_request.navigation.path})`);
      }
    }

    if (toolCall.name === "list_context_disputes") {
      const disputes = Array.isArray(rawResults?.disputes) ? rawResults.disputes : [];
      if (disputes.length > 0) {
        sections.push("\n## Dispute");
        disputes.slice(0, 6).forEach((dispute) => {
          const fragments = [dispute.status, dispute.category, dispute.project_name, dispute.amount_impact != null ? `€${dispute.amount_impact}` : null, dispute.time_impact_days != null ? `+${dispute.time_impact_days} giorni` : null].filter(Boolean).join(" · ");
          const suffix = dispute.path ? ` ([Apri](${dispute.path}))` : "";
          sections.push(`- ${dispute.title}: ${fragments}${suffix}`);
        });
      }
    }

    if (toolCall.name === "get_dispute_detail" && rawResults?.found && rawResults?.dispute) {
      sections.push("\n## Dettaglio disputa");
      sections.push(`- Disputa: ${rawResults.dispute.title}`);
      sections.push(`- Stato: ${rawResults.dispute.status || "n/d"}`);
      if (rawResults.dispute.project_name) {
        sections.push(`- Cantiere: ${rawResults.dispute.project_name}`);
      }
      if (rawResults.dispute.category) {
        sections.push(`- Categoria: ${rawResults.dispute.category}`);
      }
      if (rawResults.dispute.related_task?.title) {
        sections.push(`- Task collegata: ${rawResults.dispute.related_task.title}`);
      }
      if (rawResults.dispute.related_change_request?.title) {
        sections.push(`- Variante collegata: ${rawResults.dispute.related_change_request.title}`);
      }
      if (Array.isArray(rawResults.dispute.timeline)) {
        sections.push(`- Timeline: ${rawResults.dispute.timeline.length} eventi`);
      }
      if (Array.isArray(rawResults.dispute.evidence_items)) {
        sections.push(`- Evidenze: ${rawResults.dispute.evidence_items.length}`);
      }
      if (rawResults.dispute.navigation?.path) {
        sections.push(`- Apri disputa: [${rawResults.dispute.navigation.label || "Apri disputa"}](${rawResults.dispute.navigation.path})`);
      }
    }

    if (toolCall.name === "get_event_detail" && rawResults?.found && rawResults?.event) {
      sections.push("\n## Dettaglio evento");
      sections.push(`- Evento: ${rawResults.event.title}`);
      sections.push(`- Stato: ${rawResults.event.status || "n/d"}`);
      if (rawResults.event.start_datetime) {
        sections.push(`- Inizio: ${rawResults.event.start_datetime}`);
      }
      if (rawResults.event.end_datetime) {
        sections.push(`- Fine: ${rawResults.event.end_datetime}`);
      }
      if (rawResults.event.location) {
        sections.push(`- Luogo: ${rawResults.event.location}`);
      }
      if (rawResults.event.project_name) {
        sections.push(`- Cantiere: ${rawResults.event.project_name}`);
      }
      if (rawResults.event.creator_name) {
        sections.push(`- Creato da: ${rawResults.event.creator_name}`);
      }
      if (rawResults.event.counts?.participants != null) {
        sections.push(`- Partecipanti: ${rawResults.event.counts.participants}${rawResults.event.counts.conflicts ? ` · ${rawResults.event.counts.conflicts} con conflitti` : ""}`);
      }
      if (rawResults.event.navigation?.path) {
        sections.push(`- Apri evento: [${rawResults.event.navigation.label || "Apri evento"}](${rawResults.event.navigation.path})`);
      }
    }

    if (toolCall.name === "get_operational_day_brief") {
      sections.push("\n## Brief operativo del giorno");
      sections.push(`- Oggi: ${rawResults.date}`);
      if (rawResults.summary) {
        sections.push(`- Task in scadenza: ${rawResults.summary.tasks_due_today || 0}`);
        sections.push(`- Task in corso: ${rawResults.summary.tasks_in_progress || 0}`);
        sections.push(`- Task bloccate: ${rawResults.summary.blocked_tasks || 0}`);
        sections.push(`- Eventi di oggi: ${rawResults.summary.events_today || 0}`);
        sections.push(`- Dispute aperte: ${rawResults.summary.open_disputes || 0}`);
      }
      if (rawResults.navigation?.path) {
        sections.push(`- Apri contesto: [${rawResults.navigation.label || "Apri contesto"}](${rawResults.navigation.path})`);
      }
    }

    if (toolCall.name === "list_accessible_projects") {
      const projects = Array.isArray(rawResults?.projects) ? rawResults.projects : [];
      if (projects.length > 0) {
        sections.push("\n## Cantieri rilevanti");
        projects.slice(0, 5).forEach((project) => {
          const details = [project.status, project.address].filter(Boolean).join(" · ");
          const suffix = project.path ? ` ([Apri](${project.path}))` : "";
          sections.push(`- ${project.name}: ${details || "Cantiere disponibile"}${suffix}`);
        });
      }
    }

    if (toolCall.name === "get_project_summary" && rawResults?.available) {
      sections.push(`- Cantiere: ${rawResults.project?.name || "Senza nome"}`);
      sections.push(`- Stato: ${rawResults.project?.status || "n/d"}`);
      if (rawResults.owner?.label) {
        sections.push(`- Committente: ${rawResults.owner.label}`);
      }
      sections.push(`- Attivita aperte: ${rawResults.counts?.tasks_open ?? 0}`);
      sections.push(`- Partecipanti attivi: ${rawResults.counts?.participants ?? 0}`);
      if (rawResults.project?.path) {
        sections.push(`- Apri cantiere: [Vai al cantiere](${rawResults.project.path})`);
      }
    }

    if (toolCall.name === "list_recent_updates") {
      const updates = Array.isArray(rawResults?.updates) ? rawResults.updates : [];
      if (updates.length > 0) {
        sections.push("\n## Aggiornamenti recenti");
        updates.slice(0, 5).forEach((update) => {
          const suffix = update.path ? ` ([Apri](${update.path}))` : "";
          sections.push(`- ${update.title}: ${update.summary}${suffix}`);
        });
      }
    }

    if (toolCall.name === "list_context_tasks") {
      const tasks = Array.isArray(rawResults?.tasks) ? rawResults.tasks : [];
      if (tasks.length > 0) {
        sections.push("\n## Attivita rilevanti");
        tasks.slice(0, 5).forEach((task) => {
          const fragments = [task.status, task.project_name, task.due_date ? `Scadenza ${task.due_date}` : null, task.assignment].filter(Boolean).join(" · ");
          const suffix = task.path ? ` ([Apri](${task.path}))` : "";
          sections.push(`- ${task.title}: ${fragments}${suffix}`);
        });
      }
    }

    if (toolCall.name === "list_context_schedule") {
      const schedule = Array.isArray(rawResults?.schedule) ? rawResults.schedule : [];
      if (schedule.length > 0) {
        sections.push("\n## Agenda");
        schedule.slice(0, 5).forEach((item) => {
          const fragments = [item.status, item.start_datetime, item.location].filter(Boolean).join(" · ");
          const suffix = item.path ? ` ([Apri](${item.path}))` : "";
          sections.push(`- ${item.title}: ${fragments}${suffix}`);
        });
      }
    }

    if (toolCall.name === "list_context_participants") {
      const participants = Array.isArray(rawResults?.participants) ? rawResults.participants : [];
      const candidates = Array.isArray(rawResults?.candidates) ? rawResults.candidates : [];
      if (rawResults?.ambiguous && candidates.length > 0) {
        sections.push("\n## Cantiere da chiarire");
        sections.push("- Ho trovato piu cantieri compatibili con la richiesta. Specifica quale vuoi aprire.");
        candidates.slice(0, 5).forEach((candidate) => {
          const label = candidate.project_name || candidate.company_name || candidate.project_id || candidate.company_id || "Contesto";
          const suffix = candidate.path ? ` ([Apri](${candidate.path}))` : "";
          sections.push(`- ${label}${suffix}`);
        });
      } else if (participants.length > 0) {
        sections.push(rawResults.scope === "company" ? "\n## Team societa" : "\n## Partecipanti");
        if (rawResults.target_project?.name) {
          sections.push(`- Cantiere: ${rawResults.target_project.name}${rawResults.target_project.address ? ` · ${rawResults.target_project.address}` : ""}${rawResults.target_project.path ? ` ([Apri](${rawResults.target_project.path}))` : ""}`);
        }
        participants.slice(0, 6).forEach((participant) => {
          const fragments = [participant.role, participant.profession, participant.status].filter(Boolean).join(" · ");
          const suffix = participant.path ? ` ([Apri](${participant.path}))` : "";
          sections.push(`- ${participant.name}: ${fragments}${suffix}`);
        });
      } else if (rawResults?.message) {
        sections.push("\n## Partecipanti");
        sections.push(`- ${rawResults.message}`);
      }
    }

    if (toolCall.name === "list_context_notifications") {
      const notifications = Array.isArray(rawResults?.notifications) ? rawResults.notifications : [];
      if (notifications.length > 0) {
        sections.push("\n## Notifiche");
        notifications.slice(0, 5).forEach((notification) => {
          const prefix = notification.is_read ? "" : "[Da leggere] ";
          const suffix = notification.path ? ` ([Apri](${notification.path}))` : "";
          sections.push(`- ${prefix}${notification.title}: ${notification.summary}${suffix}`);
        });
      }
    }

    if (toolCall.name === "list_context_channels") {
      const channels = Array.isArray(rawResults?.channels) ? rawResults.channels : [];
      if (channels.length > 0) {
        sections.push("\n## Canali");
        channels.slice(0, 6).forEach((channel) => {
          const fragments = [channel.type, channel.scope_label, channel.unread_count ? `${channel.unread_count} non letti` : null, channel.last_message?.created_date ? `Ultimo aggiornamento ${channel.last_message.created_date}` : null].filter(Boolean).join(" · ");
          const suffix = channel.path ? ` ([Apri](${channel.path}))` : "";
          sections.push(`- ${channel.display_name || channel.name}: ${fragments || "Canale disponibile"}${suffix}`);
        });
      }
    }

    if (toolCall.name === "get_channel_detail" && rawResults?.found && rawResults?.channel) {
      sections.push("\n## Dettaglio canale");
      sections.push(`- Canale: ${rawResults.channel.display_name || rawResults.channel.name}`);
      sections.push(`- Tipo: ${rawResults.channel.type || "n/d"}`);
      if (rawResults.channel.scope_label) {
        sections.push(`- Contesto: ${rawResults.channel.scope_label}`);
      }
      if (rawResults.channel.access_mode) {
        sections.push(`- Visibilita: ${rawResults.channel.access_mode}`);
      }
      if (rawResults.channel.member_count != null) {
        sections.push(`- Membri: ${rawResults.channel.member_count}`);
      }
      if (rawResults.channel.unread_count != null) {
        sections.push(`- Non letti per te: ${rawResults.channel.unread_count}`);
      }
      if (rawResults.channel.last_message?.summary) {
        sections.push(`- Ultimo messaggio: ${rawResults.channel.last_message.summary}`);
      }
      if (rawResults.channel.navigation?.path) {
        sections.push(`- Apri canale: [${rawResults.channel.navigation.label || "Apri chat"}](${rawResults.channel.navigation.path})`);
      }
    }

    if (toolCall.name === "list_context_messages") {
      const messages = Array.isArray(rawResults?.messages) ? rawResults.messages : [];
      if (messages.length > 0) {
        sections.push("\n## Messaggi rilevanti");
        messages.slice(0, 6).forEach((message) => {
          const fragments = [message.channel_name, message.sender_name, message.is_unread ? "Non letto" : null, message.is_mention ? "Ti menziona" : null, message.created_date].filter(Boolean).join(" · ");
          const suffix = message.path ? ` ([Apri](${message.path}))` : "";
          sections.push(`- ${message.summary}: ${fragments}${suffix}`);
        });
      }
    }

    if (toolCall.name === "get_message_detail" && rawResults?.found && rawResults?.message) {
      sections.push("\n## Dettaglio messaggio");
      sections.push(`- Autore: ${rawResults.message.sender_name || rawResults.message.sender_email || "n/d"}`);
      if (rawResults.message.channel_name) {
        sections.push(`- Canale: ${rawResults.message.channel_name}`);
      }
      if (rawResults.message.created_date) {
        sections.push(`- Data: ${rawResults.message.created_date}`);
      }
      if (rawResults.message.summary) {
        sections.push(`- Contenuto: ${rawResults.message.summary}`);
      }
      if (rawResults.message.mentions?.length) {
        sections.push(`- Mention e riferimenti: ${rawResults.message.mentions.length}`);
      }
      if (rawResults.message.navigation?.path) {
        sections.push(`- Apri chat: [${rawResults.message.navigation.label || "Apri chat"}](${rawResults.message.navigation.path})`);
      }
    }

    if (toolCall.name === "list_mentions_and_followups") {
      const mentions = Array.isArray(rawResults?.mentions) ? rawResults.mentions : [];
      const followups = Array.isArray(rawResults?.followups) ? rawResults.followups : [];
      if (mentions.length > 0 || followups.length > 0) {
        sections.push("\n## Mention e follow-up");
        mentions.slice(0, 4).forEach((mention) => {
          const suffix = mention.path ? ` ([Apri](${mention.path}))` : "";
          sections.push(`- Mention in ${mention.channel_name}: ${mention.summary}${suffix}`);
        });
        followups.slice(0, 4).forEach((followup) => {
          const suffix = followup.path ? ` ([Apri](${followup.path}))` : "";
          sections.push(`- Follow-up ${followup.channel_name}: ${followup.unread_count} non letti${followup.last_message_summary ? ` · ${followup.last_message_summary}` : ""}${suffix}`);
        });
      }
    }

    if (toolCall.name === "get_notification_preferences") {
      const entries = Array.isArray(rawResults?.entries) ? rawResults.entries : [];
      if (entries.length > 0) {
        sections.push("\n## Preferenze notifiche");
        if (rawResults.summary) {
          sections.push(`- Notifiche in-app attive: ${rawResults.summary.notification_enabled_count || 0}/${rawResults.summary.total_actions || entries.length}`);
          sections.push(`- Email attive: ${rawResults.summary.email_enabled_count || 0}/${rawResults.summary.total_actions || entries.length}`);
        }
        entries.slice(0, 6).forEach((entry) => {
          sections.push(`- ${entry.label}: app ${entry.notification ? "on" : "off"} · email ${entry.email ? "on" : "off"}`);
        });
      }
    }

    if (toolCall.name === "list_context_documents") {
      const documents = Array.isArray(rawResults?.documents) ? rawResults.documents : [];
      if (documents.length > 0) {
        sections.push("\n## Documenti rilevanti");
        documents.slice(0, 6).forEach((document) => {
          const fragments = [document.document_status, document.scope_label, document.revision_number ? `Rev ${document.revision_number}` : null, document.category, document.discipline, document.work_area].filter(Boolean).join(" · ");
          const suffix = document.path ? ` ([Apri](${document.path}))` : "";
          sections.push(`- ${document.name}: ${fragments || "Documento disponibile"}${suffix}`);
        });
      }
    }

    if (toolCall.name === "search_context_documents") {
      const documents = Array.isArray(rawResults?.documents) ? rawResults.documents : [];
      if (documents.length > 0) {
        sections.push(`\n## Ricerca documenti${rawResults.query ? ` · ${rawResults.query}` : ""}`);
        documents.slice(0, 6).forEach((document) => {
          const fragments = [document.document_status, document.scope_label, document.revision_number ? `Rev ${document.revision_number}` : null, document.match_reason].filter(Boolean).join(" · ");
          const suffix = document.path ? ` ([Apri](${document.path}))` : "";
          sections.push(`- ${document.name}: ${fragments}${suffix}`);
        });
      }
    }

    if (toolCall.name === "get_document_detail" && rawResults?.found && rawResults?.document) {
      sections.push("\n## Dettaglio documento");
      sections.push(`- Documento: ${rawResults.document.name}`);
      sections.push(`- Stato: ${rawResults.document.document_status || "n/d"}`);
      if (rawResults.document.scope_label) {
        sections.push(`- Contesto: ${rawResults.document.scope_label}`);
      }
      if (rawResults.document.category) {
        sections.push(`- Categoria: ${rawResults.document.category}`);
      }
      if (rawResults.document.revision_number) {
        sections.push(`- Revisione: ${rawResults.document.revision_number}${rawResults.document.is_current_revision ? " · corrente" : ""}`);
      }
      if (rawResults.document.metadata_line) {
        sections.push(`- Metadati: ${rawResults.document.metadata_line}`);
      }
      if (rawResults.document.description) {
        sections.push(`- Descrizione: ${rawResults.document.description}`);
      }
      if (rawResults.document.counts) {
        sections.push(`- Commenti: ${rawResults.document.counts.comments || 0} · Approvazioni: ${rawResults.document.counts.approvals || 0} · Eventi revisione: ${rawResults.document.counts.revision_events || 0}`);
      }
      if (rawResults.document.navigation?.path) {
        sections.push(`- Apri documenti: [${rawResults.document.navigation.label || "Apri documenti"}](${rawResults.document.navigation.path})`);
      }
    }

    if (toolCall.name === "get_document_revision_history" && rawResults?.found && rawResults?.document) {
      sections.push("\n## Storico revisioni documento");
      sections.push(`- Documento: ${rawResults.document.name}`);
      sections.push(`- Totale revisioni: ${rawResults.counts?.revisions || 0}`);
      if (rawResults.current_revision?.name) {
        sections.push(`- Revisione corrente: Rev ${rawResults.current_revision.revision_number || 1} · ${rawResults.current_revision.name}`);
      }
      const revisions = Array.isArray(rawResults?.revisions) ? rawResults.revisions : [];
      revisions.slice(0, 6).forEach((revision) => {
        sections.push(`- Rev ${revision.revision_number || 1}: ${revision.name} · ${revision.document_status || "n/d"}${revision.is_current_revision ? " · corrente" : ""}`);
      });
    }

    if (toolCall.name === "get_document_workflow_status" && rawResults?.found && rawResults?.document) {
      sections.push("\n## Stato workflow documento");
      sections.push(`- Documento: ${rawResults.document.name}`);
      sections.push(`- Stato attuale: ${rawResults.current_status || rawResults.document.document_status || "n/d"}`);
      sections.push(`- Workflow formale attivo: ${rawResults.formal_workflow_available ? "si" : "no"}`);
      if (rawResults.workflow_note) {
        sections.push(`- Nota: ${rawResults.workflow_note}`);
      }
      if (rawResults.approval_summary) {
        sections.push(`- Approvazioni: ${rawResults.approval_summary.pending || 0} pending · ${rawResults.approval_summary.approved || 0} approved · ${rawResults.approval_summary.rejected || 0} rejected`);
      }
    }

    if (toolCall.name === "list_document_comments") {
      const comments = Array.isArray(rawResults?.comments) ? rawResults.comments : [];
      if (comments.length > 0) {
        sections.push("\n## Commenti documento");
        comments.slice(0, 6).forEach((comment) => {
          sections.push(`- ${comment.author_name || comment.author_email || "Utente"}: ${comment.comment_preview}${comment.created_date ? ` · ${comment.created_date}` : ""}`);
        });
      }
    }

    if (toolCall.name === "list_document_approvals") {
      const approvals = Array.isArray(rawResults?.approvals) ? rawResults.approvals : [];
      if (approvals.length > 0) {
        sections.push("\n## Approvazioni documento");
        approvals.slice(0, 6).forEach((approval) => {
          const fragments = [approval.status, approval.requested_by_email, approval.reviewed_by_email, approval.reviewed_date].filter(Boolean).join(" · ");
          sections.push(`- ${approval.id}: ${fragments}${approval.review_note ? ` · ${approval.review_note}` : ""}`);
        });
      }
    }

    if (toolCall.name === "list_document_revision_events") {
      const events = Array.isArray(rawResults?.events) ? rawResults.events : [];
      if (events.length > 0) {
        sections.push("\n## Eventi revisione documento");
        events.slice(0, 6).forEach((event) => {
          sections.push(`- ${event.event_type}: ${event.note || event.summary || "Evento registrato"}${event.created_date ? ` · ${event.created_date}` : ""}`);
        });
      }
    }

    if (toolCall.name === "get_context_finance_snapshot") {
      if (rawResults?.totals) {
        sections.push("\n## Snapshot economia");
        sections.push(`- Budget pianificato: ${formatAssistantCurrencyAmount(rawResults.totals.planned_budget, rawResults.currency)}`);
        sections.push(`- Costi registrati: ${formatAssistantCurrencyAmount(rawResults.totals.recorded_costs, rawResults.currency)}`);
        sections.push(`- Manodopera stimata: ${formatAssistantCurrencyAmount(rawResults.totals.derived_labor, rawResults.currency)}`);
        sections.push(`- Forecast: ${formatAssistantCurrencyAmount(rawResults.totals.forecast, rawResults.currency)}`);
        if (rawResults.totals.approved_variations || rawResults.totals.open_disputes_amount) {
          sections.push(`- Varianti approvate: ${formatAssistantCurrencyAmount(rawResults.totals.approved_variations, rawResults.currency)} · Dispute aperte: ${formatAssistantCurrencyAmount(rawResults.totals.open_disputes_amount, rawResults.currency)}`);
        }
      }
      const projectSnapshots = Array.isArray(rawResults?.projects) ? rawResults.projects : [];
      projectSnapshots.slice(0, 5).forEach((projectSnapshot) => {
        sections.push(`- ${projectSnapshot.project_name}: budget ${formatAssistantCurrencyAmount(projectSnapshot.planned_budget, projectSnapshot.currency)} · costi ${formatAssistantCurrencyAmount(projectSnapshot.recorded_costs, projectSnapshot.currency)} · watchpoint ${projectSnapshot.watchpoints_count || 0}${projectSnapshot.path ? ` ([Apri](${projectSnapshot.path}))` : ""}`);
      });
    }

    if (toolCall.name === "list_budget_watchpoints") {
      const watchpoints = Array.isArray(rawResults?.watchpoints) ? rawResults.watchpoints : [];
      if (watchpoints.length > 0) {
        sections.push("\n## Budget line critiche");
        watchpoints.slice(0, 6).forEach((watchpoint) => {
          sections.push(`- ${watchpoint.title}: ${watchpoint.watchpoint_status_label} · ${formatAssistantCurrencyAmount(watchpoint.actual_amount, watchpoint.currency)} su ${formatAssistantCurrencyAmount(watchpoint.planned_amount, watchpoint.currency)}${watchpoint.project_name ? ` · ${watchpoint.project_name}` : ""}${watchpoint.path ? ` ([Apri](${watchpoint.path}))` : ""}`);
        });
      }
    }

    if (toolCall.name === "list_cost_entries") {
      const entries = Array.isArray(rawResults?.entries) ? rawResults.entries : [];
      if (entries.length > 0) {
        sections.push("\n## Costi registrati");
        entries.slice(0, 6).forEach((entry) => {
          sections.push(`- ${entry.description}: ${formatAssistantCurrencyAmount(entry.amount, entry.currency)} · ${entry.cost_type || "n/d"} · ${entry.status || "n/d"}${entry.entry_date ? ` · ${entry.entry_date}` : ""}${entry.project_name ? ` · ${entry.project_name}` : ""}${entry.path ? ` ([Apri](${entry.path}))` : ""}`);
        });
      }
    }

    if (toolCall.name === "list_context_labor_rates") {
      const rates = Array.isArray(rawResults?.rates) ? rawResults.rates : [];
      if (rates.length > 0) {
        sections.push("\n## Tariffe manodopera");
        rates.slice(0, 6).forEach((rate) => {
          sections.push(`- ${rate.company_name || rate.company_id || "Societa"}${rate.user_email ? ` · ${rate.user_email}` : ""}: ${formatAssistantCurrencyAmount(rate.hourly_cost, rate.currency)}/h · ${rate.scope_label || "contesto rilevante"}${rate.valid_from ? ` · dal ${rate.valid_from}` : ""}${rate.valid_to ? ` al ${rate.valid_to}` : ""}${rate.path ? ` ([Apri](${rate.path}))` : ""}`);
        });
      }
    }

    if (toolCall.name === "get_project_financial_settings" && rawResults?.found && rawResults?.project && rawResults?.settings) {
      sections.push("\n## Impostazioni economiche progetto");
      sections.push(`- Progetto: ${rawResults.project.name}`);
      sections.push(`- Valuta: ${rawResults.settings.currency || "EUR"}`);
      sections.push(`- Budget: ${rawResults.settings.budget_tracking_mode_label || rawResults.settings.budget_tracking_mode || "n/d"}`);
      sections.push(`- Visibilita: ${rawResults.settings.financial_visibility_label || rawResults.settings.financial_visibility || "n/d"}`);
      sections.push(`- Manodopera: ${rawResults.settings.labor_cost_method_label || rawResults.settings.labor_cost_method || "n/d"}`);
      sections.push(`- SAL: ${rawResults.settings.enable_progress_statements_label || (rawResults.settings.enable_progress_statements ? "attivo" : "disattivo")}`);
      if (rawResults.defaults_applied) {
        sections.push("- Origine: valori di default del progetto");
      }
      if (rawResults.path) {
        sections.push(`- Apri economia: [Economia di commessa](${rawResults.path})`);
      }
    }

    if (toolCall.name === "list_progress_statements") {
      const statements = Array.isArray(rawResults?.statements) ? rawResults.statements : [];
      if (statements.length > 0) {
        sections.push("\n## SAL accessibili");
        statements.slice(0, 6).forEach((statement) => {
          sections.push(`- SAL #${statement.sequence_number || "?"}: ${statement.status_label || statement.status || "n/d"} · ${statement.statement_date || "data n/d"} · da pagare ${formatAssistantCurrencyAmount(statement.amount_to_pay, statement.currency)}${statement.project_name ? ` · ${statement.project_name}` : ""}${statement.path ? ` ([Apri](${statement.path}))` : ""}`);
        });
      }
    }

    if (toolCall.name === "get_progress_statement_detail" && rawResults?.found && rawResults?.statement) {
      sections.push("\n## Dettaglio SAL");
      sections.push(`- SAL #${rawResults.statement.sequence_number || "?"} · ${rawResults.statement.statement_date || "data n/d"}`);
      sections.push(`- Stato: ${rawResults.statement.status_label || rawResults.statement.status || "n/d"}`);
      if (rawResults.statement.project_name) {
        sections.push(`- Progetto: ${rawResults.statement.project_name}`);
      }
      sections.push(`- Maturato: ${formatAssistantCurrencyAmount(rawResults.statement.amount_matured, rawResults.statement.currency)}`);
      sections.push(`- Anticipi: ${formatAssistantCurrencyAmount(rawResults.statement.advances_paid, rawResults.statement.currency)}`);
      sections.push(`- Da pagare: ${formatAssistantCurrencyAmount(rawResults.statement.amount_to_pay, rawResults.statement.currency)}`);
      if (rawResults.statement.notes) {
        sections.push(`- Note: ${rawResults.statement.notes}`);
      }
      if (rawResults.statement.path) {
        sections.push(`- Apri economia: [Economia di commessa](${rawResults.statement.path})`);
      }
    }

    if (toolCall.name === "list_progress_statement_notes") {
      const notes = Array.isArray(rawResults?.notes) ? rawResults.notes : [];
      if (notes.length > 0) {
        sections.push("\n## Note SAL");
        notes.slice(0, 6).forEach((note) => {
          sections.push(`- SAL #${note.sequence_number || "?"}${note.project_name ? ` · ${note.project_name}` : ""}: ${note.note_preview || note.note || "Nota disponibile"}${note.statement_date ? ` · ${note.statement_date}` : ""}${note.path ? ` ([Apri](${note.path}))` : ""}`);
        });
      }
    }

    if (toolCall.name === "list_project_company_commercials") {
      const commercials = Array.isArray(rawResults?.commercials) ? rawResults.commercials : [];
      if (commercials.length > 0) {
        sections.push("\n## Accordi economici");
        commercials.slice(0, 6).forEach((commercial) => {
          sections.push(`- ${commercial.company_name || commercial.company_id || "Societa"}: ${commercial.contract_type_label || commercial.contract_type || "accordo"} · contratto ${formatAssistantCurrencyAmount(commercial.contract_amount, null)} · varianti ${formatAssistantCurrencyAmount(commercial.approved_variations_amount, null)}${commercial.project_name ? ` · ${commercial.project_name}` : ""}${commercial.path ? ` ([Apri](${commercial.path}))` : ""}`);
        });
      }
    }

    if (toolCall.name === "list_context_work_sessions") {
      const sessions = Array.isArray(rawResults?.sessions) ? rawResults.sessions : [];
      if (sessions.length > 0) {
        sections.push("\n## Timbrature");
        sessions.slice(0, 6).forEach((session) => {
          sections.push(`- ${session.user_email || "Operatore"}: ${session.status === "open" ? "in corso" : "chiusa"}${session.duration_hours != null ? ` · ${session.duration_hours}h` : ""}${session.started_at ? ` · ${session.started_at}` : ""}${session.project_name ? ` · ${session.project_name}` : session.company_name ? ` · ${session.company_name}` : ""}${session.path ? ` ([Apri](${session.path}))` : ""}`);
        });
      }
    }

    if (toolCall.name === "get_my_profile_summary" && rawResults?.found && rawResults?.profile) {
      sections.push("\n## Il mio profilo");
      sections.push(`- Nome: ${rawResults.profile.display_name || rawResults.profile.full_name || rawResults.profile.email}`);
      sections.push(`- Email: ${rawResults.profile.email}`);
      if (rawResults.profile.phone) {
        sections.push(`- Telefono: ${rawResults.profile.phone}`);
      }
      sections.push(`- Contesto attivo: ${rawResults.profile.active_context || "personal"}`);
      if (rawResults.profile.active_company_name) {
        sections.push(`- Societa attiva: ${rawResults.profile.active_company_name}`);
      }
      sections.push(`- Membership attive: ${rawResults.counts?.memberships || 0} · Inviti in attesa: ${rawResults.counts?.pending_invites || 0}`);
      if (rawResults.navigation?.path) {
        sections.push(`- Apri profilo: [${rawResults.navigation.label || "Impostazioni"}](${rawResults.navigation.path})`);
      }
    }

    if (toolCall.name === "get_personal_workspace_brief") {
      sections.push("\n## Workspace personale");
      sections.push(`- Notifiche non lette: ${rawResults.counts?.unread_notifications || 0}`);
      sections.push(`- Inviti in attesa: ${rawResults.counts?.pending_invites || 0}`);
      sections.push(`- Task aperte: ${rawResults.counts?.open_tasks || 0}`);
      sections.push(`- Eventi in arrivo: ${rawResults.counts?.upcoming_events || 0}`);
      const tasks = Array.isArray(rawResults?.tasks) ? rawResults.tasks : [];
      tasks.slice(0, 3).forEach((task) => {
        sections.push(`- Task: ${task.title}${task.project_name ? ` · ${task.project_name}` : ""}${task.path ? ` ([Apri](${task.path}))` : ""}`);
      });
      const events = Array.isArray(rawResults?.events) ? rawResults.events : [];
      events.slice(0, 3).forEach((event) => {
        sections.push(`- Evento: ${event.title}${event.start_datetime ? ` · ${event.start_datetime}` : ""}${event.path ? ` ([Apri](${event.path}))` : ""}`);
      });
    }

    if (toolCall.name === "list_company_projects") {
      const projects = Array.isArray(rawResults?.projects) ? rawResults.projects : [];
      if (projects.length > 0) {
        sections.push("\n## Cantieri della societa");
        if (rawResults.target_company?.company_name) {
          sections.push(`- Societa: ${rawResults.target_company.company_name}`);
        }
        projects.slice(0, 6).forEach((project) => {
          const fragments = [project.status, project.pricing_status, project.sponsor_company_name ? `Sponsor ${project.sponsor_company_name}` : null].filter(Boolean).join(" · ");
          sections.push(`- ${project.name}: ${fragments || "Cantiere accessibile"}${project.path ? ` ([Apri](${project.path}))` : ""}`);
        });
      }
    }

    if (toolCall.name === "list_company_members") {
      const members = Array.isArray(rawResults?.members) ? rawResults.members : [];
      if (members.length > 0) {
        sections.push("\n## Membri societa");
        members.slice(0, 8).forEach((member) => {
          const fragments = [member.role, member.profession, member.status].filter(Boolean).join(" · ");
          sections.push(`- ${member.name}: ${fragments}${member.path ? ` ([Apri](${member.path}))` : ""}`);
        });
      }
    }

    if (toolCall.name === "list_company_channels") {
      const channels = Array.isArray(rawResults?.channels) ? rawResults.channels : [];
      if (channels.length > 0) {
        sections.push("\n## Canali societa");
        channels.slice(0, 6).forEach((channel) => {
          const fragments = [channel.type, channel.unread_count ? `${channel.unread_count} non letti` : null, channel.last_message?.created_date ? `Ultimo aggiornamento ${channel.last_message.created_date}` : null].filter(Boolean).join(" · ");
          sections.push(`- ${channel.display_name || channel.name}: ${fragments || "Canale disponibile"}${channel.path ? ` ([Apri](${channel.path}))` : ""}`);
        });
      }
    }

    if (toolCall.name === "list_company_documents") {
      const documents = Array.isArray(rawResults?.documents) ? rawResults.documents : [];
      if (documents.length > 0) {
        sections.push("\n## Documenti societa");
        documents.slice(0, 6).forEach((document) => {
          const fragments = [document.document_status, document.category, document.revision_number ? `Rev ${document.revision_number}` : null, document.project_name].filter(Boolean).join(" · ");
          sections.push(`- ${document.name}: ${fragments}${document.path ? ` ([Apri](${document.path}))` : ""}`);
        });
      }
    }

    if (toolCall.name === "get_company_subscription_status" && rawResults?.found && rawResults?.subscription) {
      sections.push("\n## Piano societa");
      sections.push(`- Societa: ${rawResults.target_company?.company_name || rawResults.company_context_id || "n/d"}`);
      sections.push(`- Piano: ${rawResults.subscription.plan_label || rawResults.subscription.plan_code || "n/d"}`);
      sections.push(`- Stato billing: ${rawResults.subscription.billing_status_label || rawResults.subscription.billing_status || "n/d"}`);
      if (rawResults.subscription.billing_cycle_label) {
        sections.push(`- Ciclo: ${rawResults.subscription.billing_cycle_label}`);
      }
      if (rawResults.subscription.current_period_end) {
        sections.push(`- Fine periodo corrente: ${rawResults.subscription.current_period_end}`);
      }
      sections.push(`- Sponsorship attive: ${rawResults.counts?.active_sponsorships || 0}`);
      if (rawResults.navigation?.path) {
        sections.push(`- Apri billing: [${rawResults.navigation.label || "Billing societa"}](${rawResults.navigation.path})`);
      }
    }

    if (toolCall.name === "get_project_sponsorship_status" && rawResults?.found && rawResults?.project) {
      sections.push("\n## Sponsorship progetto");
      sections.push(`- Progetto: ${rawResults.project.name}`);
      sections.push(`- Stato: ${rawResults.pricing?.status_label || rawResults.pricing?.status || "n/d"}`);
      if (rawResults.pricing?.sponsor_company_name) {
        sections.push(`- Sponsor attuale: ${rawResults.pricing.sponsor_company_name}`);
      }
      sections.push(`- La societa attiva puo sponsorizzare: ${rawResults.sponsorship_access?.can_sponsor_projects ? "si" : "no"}`);
      if (rawResults.navigation?.path) {
        sections.push(`- Apri progetto: [${rawResults.navigation.label || "Apri progetto"}](${rawResults.navigation.path})`);
      }
    }

    if (toolCall.name === "get_context_notes") {
      const notes = Array.isArray(rawResults?.notes) ? rawResults.notes : [];
      if (notes.length > 0) {
        sections.push("\n## Note utili");
        notes.slice(0, 4).forEach((note) => {
          const suffix = note.path ? ` ([Apri](${note.path}))` : "";
          sections.push(`- ${note.title}: ${note.summary}${suffix}`);
        });
      }
    }
  });

  if (ragMatches.length > 0 && (wantsOverview || wantsNotes || sections.length === 0)) {
    sections.push("\n## Memoria semantica");
    ragMatches.slice(0, 3).forEach((match) => {
      sections.push(`- ${match.title || match.source_type}: ${previewText(match.content, 180)}`);
    });
  }

  if (sections.length === 0) {
    sections.push(
      contextType === "project"
        ? "## Quadro cantiere"
        : contextType === "company"
          ? "## Quadro societa"
          : "## Quadro personale",
    );
    sections.push(`- Non ho trovato abbastanza dati strutturati per rispondere a: ${userMessage}`);
  }

  return sections.join("\n").replace(/^\n+/, "");
}

function normalizeAssistantContent(content) {
  let normalizedContent = "";

  if (typeof content === "string") {
    normalizedContent = content;
  } else if (Array.isArray(content)) {
    normalizedContent = content
      .map((part) => {
        if (typeof part === "string") return part;
        if (part?.type === "text") return part.text || "";
        return "";
      })
      .join("");
  }

  return normalizeAssistantInternalLinks(normalizedContent);
}

function normalizeAssistantInternalLinks(content) {
  const normalizedContent = String(content || "");
  if (!normalizedContent) {
    return "";
  }

  return normalizedContent.replace(/\]\(([^)\s]+)\)/g, (match, href) => {
    const normalizedHref = normalizeAssistantInternalHref(href);
    return normalizedHref ? `](${normalizedHref})` : match;
  });
}

function normalizeAssistantInternalHref(href) {
  const normalizedHref = String(href || "").trim();
  if (!normalizedHref) {
    return null;
  }

  if (/^\/app(?:\/|$)/i.test(normalizedHref)) {
    return normalizedHref;
  }

  try {
    const parsedUrl = new URL(normalizedHref);
    if (!/^\/app(?:\/|$)/i.test(parsedUrl.pathname)) {
      return null;
    }

    return `${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`;
  } catch {
    return null;
  }
}

function buildGeminiContents({ historyMessages = [], userMessage, toolCalls = [], ragMatches = [] }) {
  const contents = historyMessages
    .slice(-10)
    .filter((message) => message?.content)
    .map((message) => ({
      role: message.role === "assistant" ? "model" : "user",
      parts: [{ text: String(message.content) }],
    }));

  const toolContextBlock = toolCalls.length > 0
    ? [
        "Structured assistant context:",
        ...toolCalls.map((toolCall, index) => {
          const results = safeJsonParse(toolCall.results, toolCall.results);
          return `${index + 1}. ${toolCall.name}: ${typeof results === "string" ? results : JSON.stringify(results)}`;
        }),
      ].join("\n")
    : "";

  const semanticContextBlock = ragMatches.length > 0
    ? [
        "Semantic memory:",
        ...ragMatches.map((match, index) => `${index + 1}. ${match.title || match.source_type}: ${previewText(match.content, 240)}`),
      ].join("\n")
    : "";

  contents.push({
    role: "user",
    parts: [{
      text: [
        `User request: ${userMessage}`,
        toolContextBlock,
        semanticContextBlock,
      ].filter(Boolean).join("\n\n"),
    }],
  });

  return contents;
}

function summarizeFeatureConfig(config) {
  if (!config || typeof config !== "object" || Array.isArray(config)) {
    return [];
  }

  const limits = [];

  if (Array.isArray(config.allowed_channels)) {
    limits.push(`Allowed channels: ${config.allowed_channels.join(", ")}`);
  } else if (typeof config.allowed_channels === "string") {
    limits.push(`Allowed channels: ${config.allowed_channels}`);
  }

  if (config.mode) {
    limits.push(`Mode: ${config.mode}`);
  }

  if (Number.isFinite(Number(config.max_owned_non_sponsored_projects))) {
    limits.push(`Max owned non-sponsored projects: ${config.max_owned_non_sponsored_projects}`);
  }

  if (Array.isArray(config.owned_non_sponsored_allowed_invites)) {
    limits.push(`Allowed invites: ${config.owned_non_sponsored_allowed_invites.join(", ")}`);
  }

  if (config.can_upgrade === true) {
    limits.push("Upgrade available from the current UI");
  }

  if (config.can_manage_subscription === true) {
    limits.push("Subscription can be managed directly");
  }

  if (config.auto_sponsor_on_create === true) {
    limits.push("Owned projects are auto-sponsored on creation");
  }

  if (config.economy_linked === false) {
    limits.push("Economy-linked flows are not available");
  }

  return limits;
}

function inferFeatureKeyFromText(value, contextType) {
  const normalizedValue = String(value || "").trim();
  if (!normalizedValue) {
    return null;
  }

  const normalizedFeatureKey = normalizeFeatureKey(normalizedValue);
  if (normalizedFeatureKey) {
    return normalizedFeatureKey;
  }

  return FEATURE_ALIAS_RULES.find((rule) => {
    if (Array.isArray(rule.contextTypes) && !rule.contextTypes.includes(contextType)) {
      return false;
    }

    return rule.pattern.test(normalizedValue);
  })?.featureKey || null;
}

function normalizeFeatureKey(value) {
  const normalizedValue = String(value || "").trim().toLowerCase();
  if (!normalizedValue) {
    return null;
  }

  if (/^(company|project)_[a-z0-9_]+$/.test(normalizedValue)) {
    return normalizedValue;
  }

  return null;
}

function resolveExpectedFeatureScopeType(featureMeta, featureKey) {
  if (featureMeta?.scope_type) {
    return featureMeta.scope_type;
  }

  if (featureKey.startsWith("company_")) {
    return "company";
  }

  if (featureKey.startsWith("project_")) {
    return "project";
  }

  return null;
}

function buildFeatureAvailabilityExplanation({ featureName, contextType, featureAccess, pricingStatus }) {
  const accessLevel = featureAccess?.access_level || "disabled";

  if (accessLevel === "enabled") {
    return {
      access_level: accessLevel,
      available: true,
      reason_code: "enabled",
      message: `${featureName} is fully available in the current ${contextType} context.`,
    };
  }

  if (accessLevel === "limited") {
    const limits = summarizeFeatureConfig(featureAccess?.config);
    return {
      access_level: accessLevel,
      available: true,
      reason_code: "limited_by_plan",
      message: limits.length > 0
        ? `${featureName} is available with limits in the current ${contextType} context. ${limits.join(". ")}.`
        : `${featureName} is available with limits in the current ${contextType} context.`,
    };
  }

  if (contextType === "project" && pricingStatus?.status === "blocked_for_sponsor_loss") {
    return {
      access_level: accessLevel,
      available: false,
      reason_code: pricingStatus?.reason_code || "blocked_for_sponsor_loss",
      message: `${featureName} is blocked because the project lost sponsorship while the owner still has another unsponsored project. Premium project features are currently hidden or disabled.`,
    };
  }

  if (featureAccess?.plan_code === "free") {
    return {
      access_level: accessLevel,
      available: false,
      reason_code: "plan_disabled",
      message: `${featureName} is not available on the current free ${contextType} plan.`,
    };
  }

  return {
    access_level: accessLevel,
    available: false,
    reason_code: "disabled",
    message: `${featureName} is not available in the current ${contextType} context.`,
  };
}

function buildWrongContextExplanation(featureName, expectedScopeType) {
  if (expectedScopeType === "project") {
    return `${featureName} is a project capability. Open the relevant worksite context to use or inspect it.`;
  }

  if (expectedScopeType === "company") {
    return `${featureName} is a company capability. Switch to the relevant company context to use or inspect it.`;
  }

  return `${featureName} is not available in the current assistant context.`;
}

function getAssistantRouteProjectId(routePath, routeSearch) {
  const normalizedPath = String(routePath || "").trim();
  if (!normalizedPath) {
    return null;
  }

  const operationalMatch = normalizedPath.match(/\/operativa\/progetto\/([^/?#]+)/i);
  if (operationalMatch?.[1]) {
    try {
      return decodeURIComponent(operationalMatch[1]);
    } catch {
      return operationalMatch[1];
    }
  }

  if (/\/ProjectDetail$/i.test(normalizedPath)) {
    const searchParams = new URLSearchParams(normalizeRouteSearch(routeSearch));
    const projectId = String(searchParams.get("id") || "").trim();
    return projectId || null;
  }

  return null;
}

function describeAssistantRoute(routePath, routeSearch, contextType, contextId, uiMode) {
  const normalizedPath = String(routePath || "").trim() || buildDefaultContextPath(contextType, contextId, uiMode);
  const normalizedSearch = normalizeRouteSearch(routeSearch);
  const searchParams = new URLSearchParams(normalizedSearch);
  const projectId = getAssistantRouteProjectId(normalizedPath, normalizedSearch);

  let pageKey = "unknown";
  let label = normalizedPath;

  if (/\/operativa\/progetto\/[^/?#]+$/i.test(normalizedPath)) {
    pageKey = "operative_project_workspace";
    label = "Workspace operativo cantiere";
  } else if (/\/operativa(?:\/|$)/i.test(normalizedPath)) {
    pageKey = "operative_workspace";
    label = "Area operativa";
  } else if (/\/ProjectDetail$/i.test(normalizedPath)) {
    pageKey = "project_detail";
    label = "Scheda cantiere";
  } else if (/\/CompanyDetail$/i.test(normalizedPath)) {
    pageKey = "company_detail";
    label = "Scheda societa";
  } else if (/\/Dashboard$/i.test(normalizedPath)) {
    pageKey = "dashboard";
    label = "Dashboard";
  } else if (/\/Calendar$/i.test(normalizedPath)) {
    pageKey = "calendar";
    label = "Calendario";
  } else if (/\/Notifications$/i.test(normalizedPath)) {
    pageKey = "notifications";
    label = "Notifiche";
  } else if (/\/Settings$/i.test(normalizedPath)) {
    pageKey = "settings";
    label = "Impostazioni";
  }

  return {
    path: normalizedPath,
    search: normalizedSearch,
    full_path: `${normalizedPath}${normalizedSearch}`,
    page_key: pageKey,
    label,
    project_id: projectId,
    tab: searchParams.get("tab") || null,
    section: searchParams.get("section") || null,
    ui_mode: normalizeAssistantUiMode(uiMode),
  };
}

function normalizeRouteSearch(routeSearch) {
  const normalizedSearch = String(routeSearch || "").trim();
  if (!normalizedSearch) return "";
  return normalizedSearch.startsWith("?") ? normalizedSearch : `?${normalizedSearch}`;
}

function buildDefaultContextPath(contextType, contextId, uiMode) {
  if (contextType === "project") {
    if (normalizeAssistantUiMode(uiMode) === "operational") {
      return `/app/operativa/progetto/${encodeURIComponent(contextId)}`;
    }
    return buildProjectPath(contextId);
  }

  if (contextType === "company") {
    return buildCompanyPath(contextId);
  }

  return "/app/Dashboard";
}

function buildFeatureNavigationHint(featureKey, contextType, contextId) {
  const hint = FEATURE_NAVIGATION_HINTS[featureKey];
  if (!hint) {
    return {
      label: contextType === "project" ? "Scheda cantiere" : contextType === "company" ? "Scheda societa" : "Dashboard",
      path: buildDefaultContextPath(contextType, contextId, "normal"),
    };
  }

  return {
    label: hint.label,
    path: hint.buildPath(contextId),
  };
}

function humanizeFeatureKey(featureKey) {
  return String(featureKey || "feature")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

async function loadAccessibleTasks(dbClient, appUser, contextType, contextId, options = {}) {
  const contextProjects = await getContextProjects(dbClient, appUser, contextType, contextId);
  const projectNameById = new Map(contextProjects.map((project) => [project.id, project.name]));
  const projectIds = Array.from(projectNameById.keys());
  if (projectIds.length === 0) {
    return [];
  }

  const limit = Math.min(Math.max(Number(options?.limit) || 25, 1), 100);
  const normalizedStatus = normalizeTaskStatus(options?.status);

  let tasksQuery = dbClient
    .from("tasks")
    .select("id,project_id,milestone_id,title,description,status,due_date,room_area,assigned_participant_id,assigned_participant_type,assigned_user_email,assigned_user_name,assigned_company_id,assigned_company_name,blocked_by_email,blocked_by_name,blocked_reason,blocked_date")
    .in("project_id", projectIds);

  if (options?.taskId) {
    tasksQuery = tasksQuery.eq("id", String(options.taskId).trim());
  }

  if (normalizedStatus) {
    tasksQuery = tasksQuery.eq("status", normalizedStatus);
  } else if (options?.includeCompleted !== true) {
    tasksQuery = tasksQuery.neq("status", "completed");
  }

  const orderColumn = options?.taskId ? "id" : "due_date";
  const { data, error } = await tasksQuery
    .order(orderColumn, { ascending: true, nullsFirst: false })
    .limit(limit);

  if (error) throw error;

  return (data || []).map((task) => ({
    ...task,
    project_name: projectNameById.get(task.project_id) || null,
  }));
}

async function loadAccessibleMilestones(dbClient, appUser, contextType, contextId, options = {}) {
  const contextProjects = await getContextProjects(dbClient, appUser, contextType, contextId);
  const projectNameById = new Map(contextProjects.map((project) => [project.id, project.name]));
  const projectIds = Array.from(projectNameById.keys());
  if (projectIds.length === 0) {
    return [];
  }

  const limit = Math.min(Math.max(Number(options?.limit) || 25, 1), 100);
  const normalizedStatus = normalizeMilestoneStatus(options?.status);

  let milestonesQuery = dbClient
    .from("milestones")
    .select("id,project_id,title,description,start_date,target_date,status,completion_date,order_index")
    .in("project_id", projectIds);

  if (options?.milestoneId) {
    milestonesQuery = milestonesQuery.eq("id", String(options.milestoneId).trim());
  }

  if (normalizedStatus) {
    milestonesQuery = milestonesQuery.eq("status", normalizedStatus);
  }

  const { data, error } = await milestonesQuery
    .order("target_date", { ascending: true, nullsFirst: false })
    .order("order_index", { ascending: true, nullsFirst: false })
    .limit(limit);

  if (error) throw error;

  return (data || []).map((milestone) => ({
    ...milestone,
    project_name: projectNameById.get(milestone.project_id) || null,
  }));
}

async function loadAccessibleChangeRequests(dbClient, appUser, contextType, contextId, options = {}) {
  const contextProjects = await getContextProjects(dbClient, appUser, contextType, contextId);
  const projectNameById = new Map(contextProjects.map((project) => [project.id, project.name]));
  const projectIds = Array.from(projectNameById.keys());
  if (projectIds.length === 0) {
    return [];
  }

  const limit = Math.min(Math.max(Number(options?.limit) || 25, 1), 100);
  const normalizedStatus = normalizeChangeRequestStatus(options?.status);

  let changeRequestsQuery = dbClient
    .from("change_requests")
    .select("id,project_id,title,description,status,assigned_participant_id,assigned_participant_type,assigned_user_email,assigned_user_name,assigned_company_id,assigned_company_name,cost_impact,time_impact_days,requested_by_email,requested_by_name,response_note,responded_at,created_date,updated_date")
    .in("project_id", projectIds);

  if (options?.changeRequestId) {
    changeRequestsQuery = changeRequestsQuery.eq("id", String(options.changeRequestId).trim());
  }

  if (normalizedStatus) {
    changeRequestsQuery = changeRequestsQuery.eq("status", normalizedStatus);
  }

  const { data, error } = await changeRequestsQuery
    .order("updated_date", { ascending: false, nullsFirst: false })
    .order("created_date", { ascending: false, nullsFirst: false })
    .limit(limit);

  if (error) throw error;

  return (data || []).map((changeRequest) => ({
    ...changeRequest,
    project_name: projectNameById.get(changeRequest.project_id) || null,
  }));
}

async function loadAccessibleDisputes(dbClient, appUser, contextType, contextId, options = {}) {
  const contextProjects = await getContextProjects(dbClient, appUser, contextType, contextId);
  const projectNameById = new Map(contextProjects.map((project) => [project.id, project.name]));
  const projectIds = Array.from(projectNameById.keys());
  if (projectIds.length === 0) {
    return [];
  }

  const limit = Math.min(Math.max(Number(options?.limit) || 25, 1), 100);
  const normalizedStatus = normalizeDisputeStatus(options?.status);

  let disputesQuery = dbClient
    .from("dispute_cases")
    .select("id,project_id,task_id,change_request_id,opened_by_participant_id,against_participant_id,category,status,title,summary,amount_impact,time_impact_days,resolution_note,resolved_at,created_date,updated_date")
    .in("project_id", projectIds);

  if (options?.disputeId) {
    disputesQuery = disputesQuery.eq("id", String(options.disputeId).trim());
  }

  if (normalizedStatus) {
    disputesQuery = disputesQuery.eq("status", normalizedStatus);
  }

  const { data, error } = await disputesQuery
    .order("updated_date", { ascending: false, nullsFirst: false })
    .order("created_date", { ascending: false, nullsFirst: false })
    .limit(limit);

  if (error) throw error;

  return (data || []).map((dispute) => ({
    ...dispute,
    project_name: projectNameById.get(dispute.project_id) || null,
  }));
}

async function loadAccessibleEvents(dbClient, appUser, contextType, contextId, options = {}) {
  const limit = Math.min(Math.max(Number(options?.limit) || 25, 1), 100);
  const includePast = options?.includePast === true;
  const includeCancelled = options?.includeCancelled === true;
  const minEndDate = new Date().toISOString();
  const eventMap = new Map();

  const addEvents = (events = []) => {
    events.forEach((event) => {
      if (event?.id) {
        eventMap.set(event.id, event);
      }
    });
  };

  const applyEventFilters = (query) => {
    let filteredQuery = includeCancelled
      ? query.in("status", ["scheduled", "pending_confirmation", "cancelled"])
      : query.in("status", ["scheduled", "pending_confirmation"]);
    if (!includePast) {
      filteredQuery = filteredQuery.gte("end_datetime", minEndDate);
    }
    if (options?.eventId) {
      filteredQuery = filteredQuery.eq("id", String(options.eventId).trim());
    }
    return filteredQuery;
  };

  if (contextType === "project") {
    const { data, error } = await applyEventFilters(
      dbClient
        .from("events")
        .select("id,title,description,location,start_datetime,end_datetime,status,owner_type,owner_user_id,owner_project_id,owner_company_id,creator_name,creator_email")
        .eq("owner_project_id", contextId),
    )
      .order("start_datetime", { ascending: true })
      .limit(limit);

    if (error) throw error;
    addEvents(data || []);
  } else if (contextType === "company") {
    const [ownedEventsResult, participantLinksResult] = await Promise.all([
      applyEventFilters(
        dbClient
          .from("events")
          .select("id,title,description,location,start_datetime,end_datetime,status,owner_type,owner_user_id,owner_project_id,owner_company_id,creator_name,creator_email")
          .eq("owner_company_id", contextId),
      )
        .order("start_datetime", { ascending: true })
        .limit(limit),
      dbClient
        .from("event_participants")
        .select("event_id,status")
        .eq("participant_type", "company")
        .eq("company_id", contextId)
        .in("status", ["pending", "accepted"]),
    ]);

    if (ownedEventsResult.error) throw ownedEventsResult.error;
    if (participantLinksResult.error) throw participantLinksResult.error;

    addEvents(ownedEventsResult.data || []);

    const participantEventIds = uniqueValues((participantLinksResult.data || []).map((participant) => participant.event_id))
      .filter((eventId) => !eventMap.has(eventId));

    if (participantEventIds.length > 0) {
      const { data, error } = await applyEventFilters(
        dbClient
          .from("events")
          .select("id,title,description,location,start_datetime,end_datetime,status,owner_type,owner_user_id,owner_project_id,owner_company_id,creator_name,creator_email")
          .in("id", participantEventIds),
      )
        .order("start_datetime", { ascending: true })
        .limit(limit);

      if (error) throw error;
      addEvents(data || []);
    }
  } else {
    const personalEventsQuery = appUser?.id
      ? applyEventFilters(
        dbClient
          .from("events")
          .select("id,title,description,location,start_datetime,end_datetime,status,owner_type,owner_user_id,owner_project_id,owner_company_id,creator_name,creator_email")
          .eq("owner_type", "personal")
          .eq("owner_user_id", appUser.id),
      )
          .order("start_datetime", { ascending: true })
          .limit(limit)
      : Promise.resolve({ data: [], error: null });

    const [ownedEventsResult, participantLinksResult] = await Promise.all([
      personalEventsQuery,
      appUser?.email
        ? dbClient
          .from("event_participants")
          .select("event_id,status")
          .eq("participant_type", "user")
          .eq("user_email", appUser.email)
          .in("status", ["pending", "accepted"])
        : Promise.resolve({ data: [], error: null }),
    ]);

    if (ownedEventsResult.error) throw ownedEventsResult.error;
    if (participantLinksResult.error) throw participantLinksResult.error;

    addEvents(ownedEventsResult.data || []);

    const participantEventIds = uniqueValues((participantLinksResult.data || []).map((participant) => participant.event_id))
      .filter((eventId) => !eventMap.has(eventId));

    if (participantEventIds.length > 0) {
      const { data, error } = await applyEventFilters(
        dbClient
          .from("events")
          .select("id,title,description,location,start_datetime,end_datetime,status,owner_type,owner_user_id,owner_project_id,owner_company_id,creator_name,creator_email")
          .in("id", participantEventIds),
      )
        .order("start_datetime", { ascending: true })
        .limit(limit);

      if (error) throw error;
      addEvents(data || []);
    }
  }

  const rows = Array.from(eventMap.values())
    .sort((left, right) => String(left.start_datetime || "9999-12-31T00:00:00Z").localeCompare(String(right.start_datetime || "9999-12-31T00:00:00Z")))
    .slice(0, limit);
  const [projectNameById, companyNameById] = await Promise.all([
    loadProjectNameById(dbClient, rows.map((event) => event.owner_project_id)),
    loadCompanyNameById(dbClient, rows.map((event) => event.owner_company_id)),
  ]);

  return rows.map((event) => ({
    ...event,
    owner_project_name: projectNameById.get(event.owner_project_id) || null,
    owner_company_name: companyNameById.get(event.owner_company_id) || null,
  }));
}

async function loadProjectParticipantsById(dbClient, participantIds = []) {
  const uniqueParticipantIds = uniqueValues(participantIds);
  if (uniqueParticipantIds.length === 0) {
    return new Map();
  }

  try {
    const { data, error } = await dbClient
      .from("project_participants")
      .select("id,participant_type,user_email,company_id,company_name,project_role,status")
      .in("id", uniqueParticipantIds);

    if (error) throw error;
    return new Map((data || []).map((participant) => [participant.id, participant]));
  } catch {
    return new Map();
  }
}

async function loadCompanyMembersById(dbClient, memberIds = []) {
  const uniqueMemberIds = uniqueValues(memberIds);
  if (uniqueMemberIds.length === 0) {
    return new Map();
  }

  try {
    const { data, error } = await dbClient
      .from("company_members")
      .select("id,company_id,user_email,role,profession,company_member_role,status")
      .in("id", uniqueMemberIds);

    if (error) throw error;
    return new Map((data || []).map((member) => [member.id, member]));
  } catch {
    return new Map();
  }
}

async function loadAssistantAccessibleCompanyIds(dbClient, appUser, contextType, contextId) {
  if (contextType === "project") {
    return uniqueValues([appUser?.active_company_id]);
  }

  if (contextType === "company") {
    return uniqueValues([contextId]);
  }

  if (!appUser?.email) {
    return uniqueValues([appUser?.active_company_id]);
  }

  try {
    const { data, error } = await dbClient
      .from("company_members")
      .select("company_id,status")
      .eq("user_email", appUser.email)
      .in("status", ["active", "invited"]);

    if (error) throw error;
    return uniqueValues([appUser?.active_company_id, ...(data || []).map((member) => member.company_id)]);
  } catch {
    return uniqueValues([appUser?.active_company_id]);
  }
}

async function loadAccessibleChannels(dbClient, appUser, contextType, contextId, options = {}) {
  const limit = Math.min(Math.max(Number(options?.limit) || 25, 1), 150);
  const channelId = String(options?.channelId || "").trim() || null;
  const normalizedChannelType = normalizeChannelType(options?.channelType);
  const [companyIds, accessMode] = await Promise.all([
    loadAssistantAccessibleCompanyIds(dbClient, appUser, contextType, contextId),
    getChatAccessModeForContext(dbClient, contextType, contextId),
  ]);
  const userEmail = appUser?.email || null;
  const channelSelect = "id,project_id,company_id,name,type,description,is_direct,participant_ids,created_by_email";
  const memberSelect = "id,channel_id,project_id,participant_id,user_email,company_id,last_read_at";
  let channelRows = [];
  let scopedMemberships = [];

  if (contextType === "project") {
    const [channelsResult, membershipsResult] = await Promise.all([
      dbClient
        .from("channels")
        .select(channelSelect)
        .eq("project_id", contextId)
        .limit(limit * 3),
      dbClient
        .from("channel_members")
        .select(memberSelect)
        .eq("project_id", contextId)
        .limit(800),
    ]);

    if (channelsResult.error) throw channelsResult.error;
    if (membershipsResult.error) throw membershipsResult.error;
    channelRows = channelsResult.data || [];
    scopedMemberships = membershipsResult.data || [];
  } else if (contextType === "company") {
    const [channelsResult, membershipsResult] = await Promise.all([
      dbClient
        .from("channels")
        .select(channelSelect)
        .eq("company_id", contextId)
        .limit(limit * 3),
      dbClient
        .from("channel_members")
        .select(memberSelect)
        .eq("company_id", contextId)
        .limit(800),
    ]);

    if (channelsResult.error) throw channelsResult.error;
    if (membershipsResult.error) throw membershipsResult.error;
    channelRows = channelsResult.data || [];
    scopedMemberships = membershipsResult.data || [];
  } else {
    const [userMembershipsResult, companyMembershipsResult] = await Promise.all([
      userEmail
        ? dbClient
          .from("channel_members")
          .select(memberSelect)
          .eq("user_email", userEmail)
          .limit(800)
        : Promise.resolve({ data: [], error: null }),
      companyIds.length > 0
        ? dbClient
          .from("channel_members")
          .select(memberSelect)
          .in("company_id", companyIds)
          .limit(800)
        : Promise.resolve({ data: [], error: null }),
    ]);

    if (userMembershipsResult.error) throw userMembershipsResult.error;
    if (companyMembershipsResult.error) throw companyMembershipsResult.error;

    scopedMemberships = dedupeAssistantItems([
      ...(userMembershipsResult.data || []),
      ...(companyMembershipsResult.data || []),
    ], (membership) => membership.id);

    const candidateChannelIds = uniqueValues(scopedMemberships.map((membership) => membership.channel_id));
    const filteredChannelIds = channelId ? candidateChannelIds.filter((id) => id === channelId) : candidateChannelIds;
    if (filteredChannelIds.length === 0) {
      return [];
    }

    const channelsResult = await dbClient
      .from("channels")
      .select(channelSelect)
      .in("id", filteredChannelIds)
      .limit(limit * 3);

    if (channelsResult.error) throw channelsResult.error;
    channelRows = channelsResult.data || [];
  }

  const membershipsByChannelId = new Map();
  scopedMemberships.forEach((membership) => {
    const current = membershipsByChannelId.get(membership.channel_id) || [];
    current.push(membership);
    membershipsByChannelId.set(membership.channel_id, current);
  });

  const isAllowedByAccessMode = (channel) => {
    if (accessMode !== "general_only") return true;
    if (contextType === "project") return channel.type === "general";
    if (contextType === "company") return channel.type === "company";
    return true;
  };

  const filteredChannels = (channelRows || []).filter((channel) => {
    if (channelId && channel.id !== channelId) return false;
    if (normalizedChannelType && channel.type !== normalizedChannelType) return false;
    if (!isAllowedByAccessMode(channel)) return false;
    const memberships = membershipsByChannelId.get(channel.id) || [];
    return memberships.some((membership) => matchesAssistantChannelAccess(membership, userEmail, companyIds));
  });

  const accessibleChannelIds = filteredChannels.map((channel) => channel.id);
  if (accessibleChannelIds.length === 0) {
    return [];
  }

  const [allMembershipsResult, messagesResult] = await Promise.all([
    dbClient
      .from("channel_members")
      .select(memberSelect)
      .in("channel_id", accessibleChannelIds)
      .limit(1000),
    dbClient
      .from("messages")
      .select("id,channel_id,project_id,company_id,content,sender_email,sender_name,sender_context_type,sender_company_id,sender_company_name,mentioned_user_emails,mentioned_task_ids,mentioned_milestone_ids,mentioned_change_request_ids,mentioned_document_ids,created_date")
      .in("channel_id", accessibleChannelIds)
      .order("created_date", { ascending: false })
      .limit(channelId ? 160 : Math.min(Math.max(accessibleChannelIds.length * 20, 80), 500)),
  ]);

  if (allMembershipsResult.error) throw allMembershipsResult.error;
  if (messagesResult.error) throw messagesResult.error;

  const allMemberships = allMembershipsResult.data || [];
  const allMessages = messagesResult.data || [];
  const [projectParticipantsById, companyMembersById, userNameByEmail, companyNameById, projectNameById] = await Promise.all([
    loadProjectParticipantsById(dbClient, allMemberships.filter((membership) => membership.project_id && membership.participant_id).map((membership) => membership.participant_id)),
    loadCompanyMembersById(dbClient, allMemberships.filter((membership) => !membership.project_id && membership.participant_id).map((membership) => membership.participant_id)),
    loadUserNameByEmail(dbClient, [...allMemberships.map((membership) => membership.user_email), ...allMessages.map((message) => message.sender_email)]),
    loadCompanyNameById(dbClient, [...filteredChannels.map((channel) => channel.company_id), ...allMemberships.map((membership) => membership.company_id), ...allMessages.map((message) => message.sender_company_id)]),
    loadProjectNameById(dbClient, [...filteredChannels.map((channel) => channel.project_id), ...allMessages.map((message) => message.project_id)]),
  ]);

  const enrichedMembershipsByChannelId = new Map();
  allMemberships.forEach((membership) => {
    const projectParticipant = membership.project_id ? projectParticipantsById.get(membership.participant_id) : null;
    const companyMember = !membership.project_id ? companyMembersById.get(membership.participant_id) : null;
    const role = projectParticipant?.project_role || [companyMember?.role, companyMember?.company_member_role || companyMember?.profession].filter(Boolean).join(" · ") || null;
    const status = projectParticipant?.status || companyMember?.status || null;
    const displayLabel = membership.user_email
      ? userNameByEmail.get(membership.user_email) || membership.user_email
      : membership.company_id
        ? companyNameById.get(membership.company_id) || membership.company_id
        : membership.participant_id || membership.id;

    const current = enrichedMembershipsByChannelId.get(membership.channel_id) || [];
    current.push({
      ...membership,
      role,
      status,
      display_label: displayLabel,
      is_current_user: matchesAssistantChannelAccess(membership, userEmail, companyIds),
    });
    enrichedMembershipsByChannelId.set(membership.channel_id, current);
  });

  const messagesByChannelId = new Map();
  allMessages.forEach((message) => {
    const current = messagesByChannelId.get(message.channel_id) || [];
    current.push({
      ...message,
      summary: summarizeAssistantMessageContent(message.content),
    });
    messagesByChannelId.set(message.channel_id, current);
  });

  const channels = filteredChannels.map((channel) => {
    const memberships = enrichedMembershipsByChannelId.get(channel.id) || [];
    const channelMessages = messagesByChannelId.get(channel.id) || [];
    const currentMembership = selectCurrentAssistantChannelMembership(memberships, userEmail, companyIds);
    const lastReadAt = currentMembership?.last_read_at ? new Date(currentMembership.last_read_at) : new Date(0);
    const unreadCount = channelMessages.filter((message) => {
      if (!message?.created_date || message.sender_email === userEmail) return false;
      return new Date(message.created_date) > lastReadAt;
    }).length;
    const lastMessage = channelMessages[0] || null;
    const projectName = projectNameById.get(channel.project_id) || null;
    const companyName = companyNameById.get(channel.company_id) || null;

    return {
      ...channel,
      project_name: projectName,
      company_name: companyName,
      scope_label: buildAssistantChannelScopeLabel(channel, projectNameById, companyNameById),
      access_mode: accessMode,
      memberships,
      current_membership: currentMembership,
      member_count: memberships.length,
      unread_count: unreadCount,
      last_message: lastMessage,
      display_name: buildAssistantChannelDisplayName(channel, memberships, userEmail, companyIds, userNameByEmail, companyNameById),
      path: buildChannelNavigationPath(contextType, contextId, channel, options?.uiMode),
    };
  });

  return options?.unreadOnly === true
    ? channels.filter((channel) => Number(channel.unread_count || 0) > 0)
    : channels;
}

async function loadAccessibleMessages(dbClient, appUser, contextType, contextId, options = {}) {
  const limit = Math.min(Math.max(Number(options?.limit) || 50, 1), 220);
  const channelId = String(options?.channelId || "").trim() || null;
  const channels = await loadAccessibleChannels(dbClient, appUser, contextType, contextId, {
    limit: 120,
    channelId,
    uiMode: options?.uiMode,
  });

  if (channels.length === 0) {
    return [];
  }

  let messagesQuery = dbClient
    .from("messages")
    .select("id,channel_id,project_id,company_id,content,sender_email,sender_name,sender_context_type,sender_company_id,sender_company_name,mentioned_user_emails,mentioned_task_ids,mentioned_milestone_ids,mentioned_change_request_ids,mentioned_document_ids,created_date")
    .in("channel_id", channels.map((channel) => channel.id));

  if (options?.messageId) {
    messagesQuery = messagesQuery.eq("id", String(options.messageId).trim());
  }

  const { data, error } = await messagesQuery
    .order("created_date", { ascending: false })
    .limit(limit);

  if (error) throw error;

  const channelById = new Map(channels.map((channel) => [channel.id, channel]));

  return (data || [])
    .map((message) => {
      const channel = channelById.get(message.channel_id);
      if (!channel) return null;
      const lastReadAt = channel.current_membership?.last_read_at ? new Date(channel.current_membership.last_read_at) : new Date(0);
      const isUnread = message.sender_email !== appUser?.email && new Date(message.created_date) > lastReadAt;
      const isMention = Array.isArray(message.mentioned_user_emails) && appUser?.email
        ? message.mentioned_user_emails.includes(appUser.email)
        : false;

      return {
        ...message,
        summary: summarizeAssistantMessageContent(message.content),
        channel_name: channel.display_name || channel.name,
        channel_type: channel.type,
        project_name: channel.project_name || null,
        company_name: channel.company_name || null,
        is_unread: isUnread,
        is_mention: isMention,
        mentions_count: Array.isArray(message.mentioned_user_emails) ? message.mentioned_user_emails.length : 0,
        artifact_count: countAssistantMessageArtifacts(message),
        path: channel.path,
      };
    })
    .filter(Boolean)
    .filter((message) => (options?.unreadOnly === true ? message.is_unread : true))
    .filter((message) => (options?.mentionedOnly === true ? message.is_mention : true));
}

async function loadMilestoneTaskStats(dbClient, milestoneIds = []) {
  const uniqueMilestoneIds = uniqueValues(milestoneIds);
  if (uniqueMilestoneIds.length === 0) {
    return new Map();
  }

  const { data, error } = await dbClient
    .from("tasks")
    .select("milestone_id,status")
    .in("milestone_id", uniqueMilestoneIds)
    .limit(500);

  if (error) throw error;

  const statsByMilestoneId = new Map();
  (data || []).forEach((task) => {
    const currentStats = statsByMilestoneId.get(task.milestone_id) || { total: 0, completed: 0 };
    currentStats.total += 1;
    if (task.status === "completed") {
      currentStats.completed += 1;
    }
    statsByMilestoneId.set(task.milestone_id, currentStats);
  });

  return statsByMilestoneId;
}

function isTaskRelevantToActiveUser(task, appUser) {
  const activeCompanyId = appUser?.active_company_id || null;
  const assignedToUser = task.assigned_user_email && appUser?.email && task.assigned_user_email === appUser.email;
  const assignedToCompany = task.assigned_company_id && activeCompanyId && task.assigned_company_id === activeCompanyId;
  const unassigned = !task.assigned_participant_id;
  return assignedToUser || assignedToCompany || unassigned;
}

function buildTaskImpactSummary(task, todayKey) {
  if (task?.due_date && task.due_date < todayKey) {
    return "overdue";
  }

  if (task?.due_date === todayKey) {
    return "due_today";
  }

  if (task?.status === "blocked") {
    return "blocked_flow";
  }

  return "pending";
}

async function resolveAccessibleDocument(dbClient, appUser, contextType, contextId, options = {}) {
  const documentId = String(options?.documentId || "").trim();
  if (documentId) {
    const documents = await loadAccessibleDocuments(dbClient, appUser, contextType, contextId, {
      documentId,
      limit: 1,
      currentOnly: options?.currentOnly !== false,
      includeArchived: true,
    });

    if (documents[0]) {
      return {
        matched_by: "document_id",
        document: documents[0],
      };
    }
  }

  const documentHint = String(options?.documentHint || "").trim();
  if (!documentHint) {
    return null;
  }

  const documents = await loadAccessibleDocuments(dbClient, appUser, contextType, contextId, {
    limit: 160,
    currentOnly: options?.currentOnly !== false,
    includeArchived: true,
  });

  const rankedDocuments = documents
    .map((document) => ({
      document,
      score: computeAssistantSearchScore([
        document.name,
        document.description,
        document.category,
        document.discipline,
        document.work_area,
        document.project_phase,
        document.scope_label,
        document.project_name,
        document.company_name,
        document.document_status,
        ...(Array.isArray(document.document_tags) ? document.document_tags : []),
      ], documentHint),
    }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score || compareAssistantDocuments(left.document, right.document));

  if (!rankedDocuments[0]) {
    return null;
  }

  return {
    matched_by: "document_hint",
    document: rankedDocuments[0].document,
  };
}

async function resolveAccessibleTask(dbClient, appUser, contextType, contextId, options = {}) {
  const taskId = String(options?.taskId || "").trim();
  if (taskId) {
    const taskRows = await loadAccessibleTasks(dbClient, appUser, contextType, contextId, {
      taskId,
      limit: 1,
      includeCompleted: true,
    });

    if (taskRows[0]) {
      return {
        matched_by: "task_id",
        task: taskRows[0],
      };
    }
  }

  const taskHint = String(options?.taskHint || "").trim();
  if (!taskHint) {
    return null;
  }

  const taskRows = await loadAccessibleTasks(dbClient, appUser, contextType, contextId, {
    limit: 60,
    includeCompleted: true,
  });

  const rankedTasks = taskRows
    .map((task) => ({
      task,
      score: computeAssistantSearchScore([
        task.title,
        task.description,
        task.project_name,
        task.room_area,
        task.assigned_company_name,
        task.assigned_user_name,
        task.assigned_user_email,
        task.blocked_reason,
      ], taskHint),
    }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score || String(left.task.title || "").localeCompare(String(right.task.title || "")));

  if (!rankedTasks[0]) {
    return null;
  }

  return {
    matched_by: "task_hint",
    task: rankedTasks[0].task,
  };
}

async function resolveAccessibleMilestone(dbClient, appUser, contextType, contextId, options = {}) {
  const milestoneId = String(options?.milestoneId || "").trim();
  if (milestoneId) {
    const milestoneRows = await loadAccessibleMilestones(dbClient, appUser, contextType, contextId, {
      milestoneId,
      limit: 1,
    });

    if (milestoneRows[0]) {
      return {
        matched_by: "milestone_id",
        milestone: milestoneRows[0],
      };
    }
  }

  const milestoneHint = String(options?.milestoneHint || "").trim();
  if (!milestoneHint) {
    return null;
  }

  const milestoneRows = await loadAccessibleMilestones(dbClient, appUser, contextType, contextId, {
    limit: 80,
  });

  const rankedMilestones = milestoneRows
    .map((milestone) => ({
      milestone,
      score: computeAssistantSearchScore([
        milestone.title,
        milestone.description,
        milestone.project_name,
        milestone.status,
      ], milestoneHint),
    }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score || String(left.milestone.title || "").localeCompare(String(right.milestone.title || "")));

  if (!rankedMilestones[0]) {
    return null;
  }

  return {
    matched_by: "milestone_hint",
    milestone: rankedMilestones[0].milestone,
  };
}

async function resolveAccessibleChangeRequest(dbClient, appUser, contextType, contextId, options = {}) {
  const changeRequestId = String(options?.changeRequestId || "").trim();
  if (changeRequestId) {
    const changeRequests = await loadAccessibleChangeRequests(dbClient, appUser, contextType, contextId, {
      changeRequestId,
      limit: 1,
    });

    if (changeRequests[0]) {
      return {
        matched_by: "change_request_id",
        changeRequest: changeRequests[0],
      };
    }
  }

  const changeRequestHint = String(options?.changeRequestHint || "").trim();
  if (!changeRequestHint) {
    return null;
  }

  const changeRequests = await loadAccessibleChangeRequests(dbClient, appUser, contextType, contextId, {
    limit: 80,
  });

  const rankedChangeRequests = changeRequests
    .map((changeRequest) => ({
      changeRequest,
      score: computeAssistantSearchScore([
        changeRequest.title,
        changeRequest.description,
        changeRequest.project_name,
        changeRequest.assigned_company_name,
        changeRequest.assigned_user_name,
        changeRequest.assigned_user_email,
        changeRequest.requested_by_name,
        changeRequest.response_note,
        changeRequest.status,
      ], changeRequestHint),
    }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score || String(left.changeRequest.title || "").localeCompare(String(right.changeRequest.title || "")));

  if (!rankedChangeRequests[0]) {
    return null;
  }

  return {
    matched_by: "change_request_hint",
    changeRequest: rankedChangeRequests[0].changeRequest,
  };
}

async function resolveAccessibleDispute(dbClient, appUser, contextType, contextId, options = {}) {
  const disputeId = String(options?.disputeId || "").trim();
  if (disputeId) {
    const disputes = await loadAccessibleDisputes(dbClient, appUser, contextType, contextId, {
      disputeId,
      limit: 1,
    });

    if (disputes[0]) {
      return {
        matched_by: "dispute_id",
        dispute: disputes[0],
      };
    }
  }

  const disputeHint = String(options?.disputeHint || "").trim();
  if (!disputeHint) {
    return null;
  }

  const disputes = await loadAccessibleDisputes(dbClient, appUser, contextType, contextId, {
    limit: 80,
  });

  const rankedDisputes = disputes
    .map((dispute) => ({
      dispute,
      score: computeAssistantSearchScore([
        dispute.title,
        dispute.summary,
        dispute.project_name,
        dispute.category,
        dispute.status,
        dispute.resolution_note,
      ], disputeHint),
    }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score || String(left.dispute.title || "").localeCompare(String(right.dispute.title || "")));

  if (!rankedDisputes[0]) {
    return null;
  }

  return {
    matched_by: "dispute_hint",
    dispute: rankedDisputes[0].dispute,
  };
}

async function resolveAccessibleEvent(dbClient, appUser, contextType, contextId, options = {}) {
  const eventId = String(options?.eventId || "").trim();
  if (eventId) {
    const events = await loadAccessibleEvents(dbClient, appUser, contextType, contextId, {
      eventId,
      limit: 1,
      includePast: true,
      includeCancelled: true,
    });

    if (events[0]) {
      return {
        matched_by: "event_id",
        event: events[0],
      };
    }
  }

  const eventHint = String(options?.eventHint || "").trim();
  if (!eventHint) {
    return null;
  }

  const events = await loadAccessibleEvents(dbClient, appUser, contextType, contextId, {
    limit: 80,
    includePast: true,
    includeCancelled: true,
  });

  const rankedEvents = events
    .map((event) => ({
      event,
      score: computeAssistantSearchScore([
        event.title,
        event.description,
        event.location,
        event.creator_name,
        event.creator_email,
        event.owner_project_name,
        event.owner_company_name,
      ], eventHint),
    }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score || String(left.event.title || "").localeCompare(String(right.event.title || "")));

  if (!rankedEvents[0]) {
    return null;
  }

  return {
    matched_by: "event_hint",
    event: rankedEvents[0].event,
  };
}

async function resolveAccessibleChannel(dbClient, appUser, contextType, contextId, options = {}) {
  const channelId = String(options?.channelId || "").trim();
  if (channelId) {
    const channels = await loadAccessibleChannels(dbClient, appUser, contextType, contextId, {
      channelId,
      limit: 1,
      uiMode: options?.uiMode,
    });

    if (channels[0]) {
      return {
        matched_by: "channel_id",
        channel: channels[0],
      };
    }
  }

  const channelHint = String(options?.channelHint || "").trim();
  if (!channelHint) {
    return null;
  }

  const channels = await loadAccessibleChannels(dbClient, appUser, contextType, contextId, {
    limit: 120,
    uiMode: options?.uiMode,
  });

  const rankedChannels = channels
    .map((channel) => ({
      channel,
      score: computeAssistantSearchScore([
        channel.display_name,
        channel.name,
        channel.description,
        channel.scope_label,
        channel.project_name,
        channel.company_name,
        channel.type,
      ], channelHint),
    }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score || String(left.channel.display_name || left.channel.name || "").localeCompare(String(right.channel.display_name || right.channel.name || "")));

  if (!rankedChannels[0]) {
    return null;
  }

  return {
    matched_by: "channel_hint",
    channel: rankedChannels[0].channel,
  };
}

async function resolveAccessibleMessage(dbClient, appUser, contextType, contextId, options = {}) {
  const messageId = String(options?.messageId || "").trim();
  if (messageId) {
    const messages = await loadAccessibleMessages(dbClient, appUser, contextType, contextId, {
      messageId,
      limit: 1,
      uiMode: options?.uiMode,
    });

    if (messages[0]) {
      return {
        matched_by: "message_id",
        message: messages[0],
      };
    }
  }

  const messageHint = String(options?.messageHint || "").trim();
  if (!messageHint) {
    return null;
  }

  const messages = await loadAccessibleMessages(dbClient, appUser, contextType, contextId, {
    limit: 180,
    uiMode: options?.uiMode,
  });

  const rankedMessages = messages
    .map((message) => ({
      message,
      score: computeAssistantSearchScore([
        message.summary,
        message.sender_name,
        message.sender_email,
        message.channel_name,
        message.project_name,
        message.company_name,
      ], messageHint),
    }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score || String(right.message.created_date || "").localeCompare(String(left.message.created_date || "")));

  if (!rankedMessages[0]) {
    return null;
  }

  return {
    matched_by: "message_hint",
    message: rankedMessages[0].message,
  };
}

function compareTodayDeadlineTasks(left, right) {
  const leftWeight = left?.due_date ? 0 : left?.status === "in_progress" ? 1 : 2;
  const rightWeight = right?.due_date ? 0 : right?.status === "in_progress" ? 1 : 2;
  if (leftWeight !== rightWeight) {
    return leftWeight - rightWeight;
  }

  return String(left?.due_date || "9999-12-31").localeCompare(String(right?.due_date || "9999-12-31"))
    || String(left?.title || "").localeCompare(String(right?.title || ""));
}

function compareBlockedTasks(left, right) {
  return String(right?.blocked_date || "").localeCompare(String(left?.blocked_date || ""))
    || String(left?.due_date || "9999-12-31").localeCompare(String(right?.due_date || "9999-12-31"))
    || String(left?.title || "").localeCompare(String(right?.title || ""));
}

function compareAssistantDisputes(left, right) {
  const statusOrder = {
    open: 0,
    awaiting_response: 1,
    in_review: 2,
    escalated: 3,
    resolved: 4,
    closed_no_agreement: 5,
  };

  const leftWeight = statusOrder[left?.status] ?? 99;
  const rightWeight = statusOrder[right?.status] ?? 99;
  if (leftWeight !== rightWeight) {
    return leftWeight - rightWeight;
  }

  return String(right?.updated_date || right?.created_date || "").localeCompare(String(left?.updated_date || left?.created_date || ""))
    || String(left?.title || "").localeCompare(String(right?.title || ""));
}

function compareAssistantMilestones(left, right) {
  const statusOrder = {
    in_progress: 0,
    pending: 1,
    delayed: 2,
    completed: 3,
  };

  const leftWeight = statusOrder[left?.status] ?? 99;
  const rightWeight = statusOrder[right?.status] ?? 99;
  if (leftWeight !== rightWeight) {
    return leftWeight - rightWeight;
  }

  return String(left?.target_date || left?.start_date || "9999-12-31").localeCompare(String(right?.target_date || right?.start_date || "9999-12-31"))
    || Number(left?.order_index || 0) - Number(right?.order_index || 0)
    || String(left?.title || "").localeCompare(String(right?.title || ""));
}

function compareAssistantChangeRequests(left, right) {
  const statusOrder = {
    pending: 0,
    clarification_needed: 1,
    approved: 2,
    rejected: 3,
  };

  const leftWeight = statusOrder[left?.status] ?? 99;
  const rightWeight = statusOrder[right?.status] ?? 99;
  if (leftWeight !== rightWeight) {
    return leftWeight - rightWeight;
  }

  return String(right?.updated_date || right?.created_date || "").localeCompare(String(left?.updated_date || left?.created_date || ""))
    || String(left?.title || "").localeCompare(String(right?.title || ""));
}

function describeChangeRequestAssignment(changeRequest) {
  return changeRequest.assigned_company_name || changeRequest.assigned_user_name || changeRequest.assigned_user_email || null;
}

function normalizeAssistantEntityTypes(values = []) {
  const allowedTypes = new Set(["project", "task", "document", "participant", "event", "membership"]);
  return uniqueValues((values || []).map((value) => String(value || "").trim().toLowerCase()))
    .filter((value) => allowedTypes.has(value));
}

function computeAssistantSearchScore(fields = [], query = "") {
  const normalizedFields = normalizeAssistantSearchText(fields.join(" "));
  if (!normalizedFields) {
    return 0;
  }

  const normalizedQuery = normalizeAssistantSearchText(query);
  const tokens = tokenizeAssistantSearchQuery(query);
  let score = 0;

  if (normalizedQuery && normalizedFields.includes(normalizedQuery)) {
    score += 5;
  }

  tokens.forEach((token) => {
    if (normalizedFields.includes(token)) {
      score += 1;
    }
  });

  return score;
}

function normalizeAssistantSearchText(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function tokenizeAssistantSearchQuery(value) {
  const stopWords = new Set([
    "cerca",
    "trova",
    "find",
    "search",
    "lookup",
    "mostra",
    "dammi",
    "fammi",
    "vedere",
    "dove",
    "trovo",
    "come",
    "arrivo",
    "apro",
    "pagina",
    "sezione",
    "nel",
    "nella",
    "della",
    "delle",
    "degli",
    "dei",
    "con",
    "per",
    "che",
    "una",
    "uno",
    "miei",
    "mie",
    "mio",
    "mia",
    "contesto",
  ]);

  return uniqueValues(
    normalizeAssistantSearchText(value)
      .split(/\s+/)
      .filter((token) => token.length >= 3 && !stopWords.has(token)),
  );
}

function buildDefaultNavigationSuggestions(contextType, contextId) {
  return [
    {
      label: contextType === "project" ? "Scheda cantiere" : contextType === "company" ? "Scheda societa" : "Dashboard",
      path: buildDefaultContextPath(contextType, contextId, "normal"),
    },
    {
      label: "Notifiche",
      path: "/app/Notifications",
    },
    {
      label: "Calendario",
      path: "/app/Calendar",
    },
  ];
}

function getAssistantDocumentSelectFields() {
  return "id,project_id,company_id,name,description,file_url,file_path,file_type,file_size,uploaded_by_email,uploaded_by_name,category,parent_document_id,root_document_id,revision_number,is_current_revision,document_status,discipline,work_area,project_phase,document_tags,model_format,created_date,updated_date";
}

async function loadAccessibleDocuments(dbClient, appUser, contextType, contextId, options = {}) {
  const limit = Math.min(Math.max(Number(options?.limit) || 25, 1), 220);
  const normalizedStatus = normalizeDocumentStatus(options?.status);
  const currentOnly = options?.currentOnly !== false;
  const includeArchived = options?.includeArchived === true;
  const documentId = String(options?.documentId || "").trim() || null;
  const selectFields = getAssistantDocumentSelectFields();
  const documentMap = new Map();
  const addDocuments = (documents = []) => {
    documents.forEach((document) => {
      if (document?.id) {
        documentMap.set(document.id, document);
      }
    });
  };

  const applyDocumentFilters = (query) => {
    let filteredQuery = query;
    if (documentId) {
      filteredQuery = filteredQuery.eq("id", documentId);
    }
    if (normalizedStatus) {
      filteredQuery = filteredQuery.eq("document_status", normalizedStatus);
    } else if (!includeArchived) {
      filteredQuery = filteredQuery.neq("document_status", "archived");
    }
    if (currentOnly) {
      filteredQuery = filteredQuery.neq("is_current_revision", false);
    }
    return filteredQuery;
  };

  if (contextType === "project") {
    const { data, error } = await applyDocumentFilters(
      dbClient
        .from("project_documents")
        .select(selectFields)
        .eq("project_id", contextId),
    )
      .order("updated_date", { ascending: false, nullsFirst: false })
      .order("created_date", { ascending: false, nullsFirst: false })
      .limit(limit);

    if (error) throw error;
    addDocuments(data || []);
  } else if (contextType === "company") {
    const { data, error } = await applyDocumentFilters(
      dbClient
        .from("project_documents")
        .select(selectFields)
        .eq("company_id", contextId),
    )
      .order("updated_date", { ascending: false, nullsFirst: false })
      .order("created_date", { ascending: false, nullsFirst: false })
      .limit(limit);

    if (error) throw error;
    addDocuments(data || []);
  } else {
    const [projects, companyIds] = await Promise.all([
      getContextProjects(dbClient, appUser, contextType, contextId),
      loadAssistantAccessibleCompanyIds(dbClient, appUser, contextType, contextId),
    ]);
    const projectIds = projects.map((project) => project.id);

    const [projectDocumentsResult, companyDocumentsResult] = await Promise.all([
      projectIds.length > 0
        ? applyDocumentFilters(
          dbClient
            .from("project_documents")
            .select(selectFields)
            .in("project_id", projectIds),
        )
          .order("updated_date", { ascending: false, nullsFirst: false })
          .order("created_date", { ascending: false, nullsFirst: false })
          .limit(limit)
        : Promise.resolve({ data: [], error: null }),
      companyIds.length > 0
        ? applyDocumentFilters(
          dbClient
            .from("project_documents")
            .select(selectFields)
            .in("company_id", companyIds),
        )
          .order("updated_date", { ascending: false, nullsFirst: false })
          .order("created_date", { ascending: false, nullsFirst: false })
          .limit(limit)
        : Promise.resolve({ data: [], error: null }),
    ]);

    if (projectDocumentsResult.error) throw projectDocumentsResult.error;
    if (companyDocumentsResult.error) throw companyDocumentsResult.error;
    addDocuments(projectDocumentsResult.data || []);
    addDocuments(companyDocumentsResult.data || []);
  }

  const rows = Array.from(documentMap.values())
    .sort(compareAssistantDocuments)
    .slice(0, limit);
  const [projectNameById, companyNameById] = await Promise.all([
    loadProjectNameById(dbClient, rows.map((document) => document.project_id)),
    loadCompanyNameById(dbClient, rows.map((document) => document.company_id)),
  ]);

  return rows.map((document) => ({
    ...document,
    project_name: projectNameById.get(document.project_id) || null,
    company_name: companyNameById.get(document.company_id) || null,
    scope_label: document.project_id
      ? projectNameById.get(document.project_id) || document.project_id
      : document.company_id
        ? companyNameById.get(document.company_id) || document.company_id
        : null,
    path: buildDocumentNavigationPath(document, contextType, contextId),
  }));
}

async function loadDocumentRevisionChain(dbClient, document, contextType, contextId) {
  const rootId = document?.root_document_id || document?.id;
  if (!rootId) {
    return [];
  }

  const { data, error } = await dbClient
    .from("project_documents")
    .select(getAssistantDocumentSelectFields())
    .eq("root_document_id", rootId)
    .order("revision_number", { ascending: false, nullsFirst: false })
    .order("created_date", { ascending: false, nullsFirst: false })
    .limit(80);

  if (error) throw error;

  const rows = (data || []).length > 0 ? (data || []) : [document];
  const [projectNameById, companyNameById] = await Promise.all([
    loadProjectNameById(dbClient, rows.map((row) => row.project_id)),
    loadCompanyNameById(dbClient, rows.map((row) => row.company_id)),
  ]);

  return rows.map((row) => ({
    ...row,
    project_name: projectNameById.get(row.project_id) || null,
    company_name: companyNameById.get(row.company_id) || null,
    scope_label: row.project_id
      ? projectNameById.get(row.project_id) || row.project_id
      : row.company_id
        ? companyNameById.get(row.company_id) || row.company_id
        : null,
    path: buildDocumentNavigationPath(row, contextType, contextId),
  }));
}

async function loadContextDocuments(dbClient, appUser, contextType, contextId, options = {}) {
  return loadAccessibleDocuments(dbClient, appUser, contextType, contextId, {
    limit: clampLimit(options?.limit, 10, 50),
    currentOnly: true,
    includeArchived: false,
  });
}

async function resolveAccessibleFinanceProjects(dbClient, appUser, contextType, contextId, options = {}) {
  const projects = await getContextProjects(dbClient, appUser, contextType, contextId);
  const projectId = String(options?.projectId || "").trim();
  if (projectId) {
    return projects.filter((project) => project.id === projectId);
  }

  const projectHint = String(options?.projectHint || "").trim();
  if (!projectHint) {
    return projects;
  }

  return projects
    .map((project) => ({
      project,
      score: computeAssistantSearchScore([
        project.name,
        project.id,
        project.city,
        project.address,
      ], projectHint),
    }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score || String(left.project?.name || "").localeCompare(String(right.project?.name || "")))
    .map((entry) => entry.project);
}

async function resolveAccessibleFinanceProject(dbClient, appUser, contextType, contextId, options = {}) {
  const projectId = String(options?.projectId || "").trim();
  const projectHint = String(options?.projectHint || "").trim();
  const projects = await resolveAccessibleFinanceProjects(dbClient, appUser, contextType, contextId, options);

  if (projects.length === 0) {
    return null;
  }

  if (projectId) {
    return {
      matched_by: "project_id",
      project: projects[0],
    };
  }

  if (projectHint) {
    return {
      matched_by: "project_hint",
      project: projects[0],
    };
  }

  if (contextType === "project") {
    return {
      matched_by: "current_project",
      project: projects[0],
    };
  }

  if (projects.length === 1) {
    return {
      matched_by: "single_accessible_project",
      project: projects[0],
    };
  }

  return {
    ambiguous: true,
    candidates: projects.slice(0, 6).map((project) => ({
      project_id: project.id,
      project_name: project.name || project.id,
      path: FEATURE_NAVIGATION_HINTS.project_finance.buildPath(project.id),
    })),
  };
}

async function loadAssistantFinanceScopeData(dbClient, projects) {
  const projectIds = projects.map((project) => project.id).filter(Boolean);
  if (projectIds.length === 0) {
    return {
      settingsByProjectId: new Map(),
      budgetLinesByProjectId: new Map(),
      costEntriesByProjectId: new Map(),
      workSessionsByProjectId: new Map(),
      changeRequestsByProjectId: new Map(),
      disputesByProjectId: new Map(),
      progressStatementsByProjectId: new Map(),
      projectCompanyIdsByProjectId: new Map(),
      laborRates: [],
      companyNameById: new Map(),
      budgetLineById: new Map(),
    };
  }

  const [settingsResult, budgetLinesResult, costEntriesResult, workSessionsResult, changeRequestsResult, disputesResult, progressStatementsResult, projectParticipantsResult] = await Promise.all([
    dbClient
      .from("project_financial_settings")
      .select("id,project_id,currency,budget_tracking_mode,labor_cost_method,financial_visibility,enable_progress_statements")
      .in("project_id", projectIds),
    dbClient
      .from("budget_lines")
      .select("id,project_id,code,title,category,amount_planned,company_id,status,notes,created_date,updated_date")
      .in("project_id", projectIds),
    dbClient
      .from("cost_entries")
      .select("id,project_id,budget_line_id,company_id,cost_type,description,amount,quantity,unit_cost,entry_date,source_type,source_id,status,notes,created_date,updated_date")
      .in("project_id", projectIds),
    dbClient
      .from("work_sessions")
      .select("id,project_id,company_id,user_email,started_at,ended_at,note,entry_type,manual_reason,source_mode,created_date")
      .in("project_id", projectIds),
    dbClient
      .from("change_requests")
      .select("id,project_id,title,status,cost_impact,updated_date")
      .in("project_id", projectIds),
    dbClient
      .from("dispute_cases")
      .select("id,project_id,title,status,amount_impact,updated_date")
      .in("project_id", projectIds),
    dbClient
      .from("progress_statements")
      .select("id,project_id,sequence_number,statement_date,amount_matured,advances_paid,amount_to_pay,status,notes,updated_date")
      .in("project_id", projectIds),
    dbClient
      .from("project_participants")
      .select("project_id,participant_type,company_id,status")
      .in("project_id", projectIds)
      .eq("status", "active"),
  ]);

  if (settingsResult.error) throw settingsResult.error;
  if (budgetLinesResult.error) throw budgetLinesResult.error;
  if (costEntriesResult.error) throw costEntriesResult.error;
  if (workSessionsResult.error) throw workSessionsResult.error;
  if (changeRequestsResult.error) throw changeRequestsResult.error;
  if (disputesResult.error) throw disputesResult.error;
  if (progressStatementsResult.error) throw progressStatementsResult.error;
  if (projectParticipantsResult.error) throw projectParticipantsResult.error;

  const budgetLines = budgetLinesResult.data || [];
  const costEntries = costEntriesResult.data || [];
  const workSessions = workSessionsResult.data || [];
  const projectCompanyIdsByProjectId = groupActiveProjectCompanyIds(projectParticipantsResult.data || []);
  const companyIds = Array.from(new Set([
    ...budgetLines.map((row) => row.company_id),
    ...costEntries.map((row) => row.company_id),
    ...workSessions.map((row) => row.company_id),
    ...Array.from(projectCompanyIdsByProjectId.values()).flat(),
  ].filter(Boolean)));
  const laborRatesResult = companyIds.length > 0
    ? await dbClient
      .from("labor_rates")
      .select("id,company_id,project_id,user_email,company_member_role,hourly_cost,valid_from,valid_to,notes")
      .in("company_id", companyIds)
      .order("valid_from", { ascending: false })
    : { data: [], error: null };

  if (laborRatesResult.error) throw laborRatesResult.error;

  return {
    settingsByProjectId: new Map((settingsResult.data || []).map((row) => [row.project_id, row])),
    budgetLinesByProjectId: groupAssistantRowsByProjectId(budgetLines),
    costEntriesByProjectId: groupAssistantRowsByProjectId(costEntries),
    workSessionsByProjectId: groupAssistantRowsByProjectId(workSessions),
    changeRequestsByProjectId: groupAssistantRowsByProjectId(changeRequestsResult.data || []),
    disputesByProjectId: groupAssistantRowsByProjectId(disputesResult.data || []),
    progressStatementsByProjectId: groupAssistantRowsByProjectId(progressStatementsResult.data || []),
    projectCompanyIdsByProjectId,
    laborRates: laborRatesResult.data || [],
    companyNameById: await loadCompanyNameById(dbClient, companyIds),
    budgetLineById: new Map(budgetLines.map((row) => [row.id, row])),
  };
}

function groupAssistantRowsByProjectId(rows = []) {
  const grouped = new Map();
  rows.forEach((row) => {
    const projectId = row?.project_id;
    if (!projectId) return;
    if (!grouped.has(projectId)) {
      grouped.set(projectId, []);
    }
    grouped.get(projectId).push(row);
  });
  return grouped;
}

function groupActiveProjectCompanyIds(rows = []) {
  const grouped = new Map();
  rows.forEach((row) => {
    if (row?.participant_type !== "company" || !row?.company_id || !row?.project_id) {
      return;
    }
    if (!grouped.has(row.project_id)) {
      grouped.set(row.project_id, []);
    }
    const companyIds = grouped.get(row.project_id);
    if (!companyIds.includes(row.company_id)) {
      companyIds.push(row.company_id);
    }
  });
  return grouped;
}

function getDefaultAssistantProjectFinancialSettings() {
  return {
    currency: "EUR",
    budget_tracking_mode: "simple",
    labor_cost_method: "from_work_sessions",
    financial_visibility: "project_full",
    enable_progress_statements: false,
  };
}

function getAssistantProjectFinanceScope(project, financeData, appUser) {
  const settings = {
    ...getDefaultAssistantProjectFinancialSettings(),
    ...(financeData.settingsByProjectId.get(project.id) || {}),
  };
  const scopedCompanyId = settings.financial_visibility === "company_scoped"
    ? String(appUser?.active_company_id || "").trim() || null
    : null;
  const budgetLines = filterAssistantFinanceRows(financeData.budgetLinesByProjectId.get(project.id) || [], scopedCompanyId)
    .filter((line) => line.status !== "archived");
  const costEntries = filterAssistantFinanceRows(financeData.costEntriesByProjectId.get(project.id) || [], scopedCompanyId);
  const workSessions = filterAssistantFinanceRows(financeData.workSessionsByProjectId.get(project.id) || [], scopedCompanyId);
  const laborRates = scopedCompanyId
    ? financeData.laborRates.filter((rate) => rate.company_id === scopedCompanyId)
    : financeData.laborRates;

  return {
    settings,
    scopedCompanyId,
    budgetLines,
    costEntries,
    workSessions,
    laborRates,
    changeRequests: financeData.changeRequestsByProjectId.get(project.id) || [],
    disputes: financeData.disputesByProjectId.get(project.id) || [],
    progressStatements: financeData.progressStatementsByProjectId.get(project.id) || [],
  };
}

function buildAssistantProjectFinanceSnapshot(project, financeData, appUser) {
  const scopedData = getAssistantProjectFinanceScope(project, financeData, appUser);
  const plannedBudget = scopedData.budgetLines.reduce((sum, line) => sum + Number(line.amount_planned || 0), 0);
  const recordedCosts = scopedData.costEntries.reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
  const derivedLabor = computeAssistantDerivedLaborTotal(scopedData);
  const approvedVariations = scopedData.changeRequests
    .filter((item) => item.status === "approved")
    .reduce((sum, item) => sum + Number(item.cost_impact || 0), 0);
  const openDisputesAmount = scopedData.disputes
    .filter((item) => item.status !== "resolved")
    .reduce((sum, item) => sum + Number(item.amount_impact || 0), 0);
  const watchpoints = buildAssistantBudgetWatchpoints({
    project,
    settings: scopedData.settings,
    budgetLines: scopedData.budgetLines,
    costEntries: scopedData.costEntries,
    companyNameById: financeData.companyNameById,
  });

  return {
    project_id: project.id,
    project_name: project.name || project.id,
    currency: scopedData.settings.currency || "EUR",
    planned_budget: plannedBudget,
    recorded_costs: recordedCosts,
    derived_labor: derivedLabor,
    forecast: recordedCosts + Math.max(plannedBudget - recordedCosts, 0),
    approved_variations: approvedVariations,
    open_disputes_amount: openDisputesAmount,
    sal: computeAssistantSalReport(scopedData.progressStatements),
    labor_sync_preview: computeAssistantLaborSyncPreview(scopedData),
    watchpoints_count: watchpoints.length,
    watchpoints,
    settings: {
      currency: scopedData.settings.currency || "EUR",
      budget_tracking_mode: scopedData.settings.budget_tracking_mode || "simple",
      labor_cost_method: scopedData.settings.labor_cost_method || "from_work_sessions",
      financial_visibility: scopedData.settings.financial_visibility || "project_full",
      enable_progress_statements: Boolean(scopedData.settings.enable_progress_statements),
    },
    counts: {
      budget_lines: scopedData.budgetLines.length,
      cost_entries: scopedData.costEntries.length,
      work_sessions: scopedData.workSessions.length,
      progress_statements: scopedData.progressStatements.length,
    },
    path: FEATURE_NAVIGATION_HINTS.project_finance.buildPath(project.id),
  };
}

function buildAssistantProjectFinanceCostEntries(project, financeData, appUser) {
  const scopedData = getAssistantProjectFinanceScope(project, financeData, appUser);
  return scopedData.costEntries.map((entry) => ({
    id: entry.id,
    project_id: project.id,
    project_name: project.name || project.id,
    company_id: entry.company_id || null,
    company_name: financeData.companyNameById.get(entry.company_id) || null,
    budget_line_id: entry.budget_line_id || null,
    budget_line_title: financeData.budgetLineById.get(entry.budget_line_id)?.title || null,
    description: entry.description,
    amount: Number(entry.amount || 0),
    currency: scopedData.settings.currency || "EUR",
    cost_type: entry.cost_type || null,
    status: entry.status || null,
    entry_date: entry.entry_date || null,
    source_type: entry.source_type || null,
    source_id: entry.source_id || null,
    notes: entry.notes || null,
    path: FEATURE_NAVIGATION_HINTS.project_finance.buildPath(project.id),
  }));
}

function buildAssistantProjectLaborRateEntries(project, financeData, appUser) {
  const scopedData = getAssistantProjectFinanceScope(project, financeData, appUser);
  const configuredCompanyIds = financeData.projectCompanyIdsByProjectId.get(project.id) || [];
  const visibleCompanyIds = scopedData.scopedCompanyId
    ? [scopedData.scopedCompanyId]
    : configuredCompanyIds;

  return scopedData.laborRates
    .filter((rate) => !rate.project_id || rate.project_id === project.id)
    .filter((rate) => visibleCompanyIds.length === 0 || visibleCompanyIds.includes(rate.company_id))
    .map((rate) => ({
      id: rate.id,
      project_id: rate.project_id || project.id,
      project_name: project.name || project.id,
      project_names: project.name ? [project.name] : [],
      company_id: rate.company_id,
      company_name: financeData.companyNameById.get(rate.company_id) || rate.company_id || null,
      user_email: rate.user_email || null,
      hourly_cost: Number(rate.hourly_cost || 0),
      currency: scopedData.settings.currency || "EUR",
      valid_from: rate.valid_from || null,
      valid_to: rate.valid_to || null,
      scope_type: rate.project_id ? "project" : "company",
      scope_label: rate.project_id ? (project.name || project.id) : "tariffa societa",
      path: FEATURE_NAVIGATION_HINTS.project_finance.buildPath(project.id),
    }));
}

function buildAssistantProjectProgressStatements(project, financeData, appUser) {
  const scopedData = getAssistantProjectFinanceScope(project, financeData, appUser);
  return scopedData.progressStatements.map((statement) => ({
    id: statement.id,
    project_id: project.id,
    project_name: project.name || project.id,
    sequence_number: Number(statement.sequence_number || 0) || null,
    statement_date: statement.statement_date || null,
    status: statement.status || "draft",
    status_label: describeAssistantProgressStatementStatus(statement.status || "draft"),
    amount_matured: Number(statement.amount_matured || 0),
    advances_paid: Number(statement.advances_paid || 0),
    amount_to_pay: Number(statement.amount_to_pay || 0),
    notes: statement.notes || null,
    notes_preview: previewText(statement.notes, 180),
    currency: scopedData.settings.currency || "EUR",
    progress_enabled: Boolean(scopedData.settings.enable_progress_statements),
    path: FEATURE_NAVIGATION_HINTS.project_finance.buildPath(project.id),
  }));
}

async function resolveAccessibleProgressStatement(dbClient, appUser, contextType, contextId, options = {}) {
  const projects = await resolveAccessibleFinanceProjects(dbClient, appUser, contextType, contextId, {
    projectId: options?.projectId,
    projectHint: options?.projectHint,
  });

  if (projects.length === 0) {
    return null;
  }

  const financeData = await loadAssistantFinanceScopeData(dbClient, projects);
  const statements = projects
    .flatMap((project) => buildAssistantProjectProgressStatements(project, financeData, appUser))
    .sort(compareAssistantProgressStatements);
  const statementId = String(options?.statementId || "").trim();

  if (statementId) {
    const statement = statements.find((entry) => entry.id === statementId);
    if (!statement) return null;
    return {
      matched_by: "statement_id",
      statement,
    };
  }

  const statementHint = String(options?.statementHint || "").trim();
  if (statementHint) {
    const rankedStatements = statements
      .map((statement) => ({
        statement,
        score: computeAssistantSearchScore([
          `SAL ${statement.sequence_number || ""}`,
          `SAL #${statement.sequence_number || ""}`,
          statement.statement_date,
          statement.project_name,
          statement.status,
          statement.status_label,
          statement.notes,
        ], statementHint),
      }))
      .filter((entry) => entry.score > 0)
      .sort((left, right) => right.score - left.score || compareAssistantProgressStatements(left.statement, right.statement));

    if (rankedStatements[0]) {
      return {
        matched_by: "statement_hint",
        statement: rankedStatements[0].statement,
      };
    }
  }

  if (statements.length === 1) {
    return {
      matched_by: "single_accessible_statement",
      statement: statements[0],
    };
  }

  return statements.length > 1
    ? {
        ambiguous: true,
        candidates: statements.slice(0, 6).map((statement) => ({
          statement_id: statement.id,
          project_id: statement.project_id,
          project_name: statement.project_name,
          sequence_number: statement.sequence_number,
          statement_date: statement.statement_date,
          path: statement.path,
        })),
      }
    : null;
}

function filterAssistantFinanceRows(rows = [], scopedCompanyId) {
  if (!scopedCompanyId) return rows;
  return rows.filter((row) => !row?.company_id || row.company_id === scopedCompanyId);
}

function computeAssistantDerivedLaborTotal(scopedData) {
  if (scopedData.settings.labor_cost_method !== "from_work_sessions") {
    return scopedData.costEntries
      .filter((entry) => entry.cost_type === "labor")
      .reduce((sum, entry) => sum + Number(entry.amount || 0), 0);
  }

  return scopedData.workSessions.reduce((sum, session) => {
    if (!session?.ended_at || !session?.company_id) return sum;
    const hours = parseAssistantWorkSessionHours(session);
    if (hours <= 0) return sum;
    const rate = pickAssistantLaborRate(scopedData.laborRates, session.started_at, session.company_id, session.user_email);
    if (!rate) return sum;
    return sum + (hours * Number(rate.hourly_cost || 0));
  }, 0);
}

function computeAssistantLaborSyncPreview(scopedData) {
  if (scopedData.settings.labor_cost_method !== "from_work_sessions") {
    return { count: 0, amount: 0 };
  }

  const existingSourceIds = new Set(
    scopedData.costEntries
      .filter((entry) => entry.source_type === "work_session" && entry.source_id)
      .map((entry) => entry.source_id),
  );

  const candidates = scopedData.workSessions
    .filter((session) => session.id && session.ended_at && !existingSourceIds.has(session.id))
    .map((session) => {
      const hours = parseAssistantWorkSessionHours(session);
      const rate = pickAssistantLaborRate(scopedData.laborRates, session.started_at, session.company_id, session.user_email);
      if (hours <= 0 || !rate) return null;
      const amount = hours * Number(rate.hourly_cost || 0);
      return amount > 0 ? { amount } : null;
    })
    .filter(Boolean);

  return {
    count: candidates.length,
    amount: candidates.reduce((sum, item) => sum + Number(item.amount || 0), 0),
  };
}

function computeAssistantSalReport(progressStatements = []) {
  return {
    count: progressStatements.length,
    total_matured: progressStatements.reduce((sum, item) => sum + Number(item.amount_matured || 0), 0),
    total_advances: progressStatements.reduce((sum, item) => sum + Number(item.advances_paid || 0), 0),
    total_to_pay: progressStatements.reduce((sum, item) => sum + Number(item.amount_to_pay || 0), 0),
    approved_count: progressStatements.filter((item) => item.status === "approved").length,
  };
}

function buildAssistantBudgetWatchpoints({ project, settings, budgetLines = [], costEntries = [], companyNameById }) {
  const directActualByBudgetLineId = new Map();
  const fallbackActualByCategoryCompany = new Map();

  costEntries.forEach((entry) => {
    const amount = Number(entry.amount || 0);
    if (!amount) return;
    if (entry.budget_line_id) {
      directActualByBudgetLineId.set(entry.budget_line_id, Number(directActualByBudgetLineId.get(entry.budget_line_id) || 0) + amount);
      return;
    }

    const scopedKey = `${entry.cost_type || "unknown"}::${entry.company_id || "*"}`;
    fallbackActualByCategoryCompany.set(scopedKey, Number(fallbackActualByCategoryCompany.get(scopedKey) || 0) + amount);
    if (entry.company_id) {
      const globalKey = `${entry.cost_type || "unknown"}::*`;
      fallbackActualByCategoryCompany.set(globalKey, Number(fallbackActualByCategoryCompany.get(globalKey) || 0) + amount);
    }
  });

  return budgetLines
    .map((line) => {
      const plannedAmount = Number(line.amount_planned || 0);
      const directActual = Number(directActualByBudgetLineId.get(line.id) || 0);
      const fallbackActual = directActual > 0
        ? 0
        : Number(fallbackActualByCategoryCompany.get(`${line.category || "unknown"}::${line.company_id || "*"}`) || 0);
      const actualAmount = directActual + fallbackActual;
      let watchpointStatus = null;
      if (plannedAmount <= 0 && actualAmount > 0) {
        watchpointStatus = "unplanned_costs";
      } else if (actualAmount > plannedAmount) {
        watchpointStatus = "over_budget";
      } else if (plannedAmount > 0 && actualAmount >= (plannedAmount * 0.9)) {
        watchpointStatus = "at_risk";
      }

      if (!watchpointStatus) {
        return null;
      }

      return {
        id: line.id,
        project_id: project.id,
        project_name: project.name || project.id,
        title: line.title,
        code: line.code || null,
        category: line.category || null,
        company_id: line.company_id || null,
        company_name: companyNameById.get(line.company_id) || null,
        planned_amount: plannedAmount,
        actual_amount: actualAmount,
        variance_amount: actualAmount - plannedAmount,
        watchpoint_status: watchpointStatus,
        watchpoint_status_label: describeAssistantBudgetWatchpointStatus(watchpointStatus),
        currency: settings.currency || "EUR",
        notes: line.notes || null,
        path: FEATURE_NAVIGATION_HINTS.project_finance.buildPath(project.id),
      };
    })
    .filter(Boolean);
}

function parseAssistantWorkSessionHours(session) {
  if (!session?.started_at || !session?.ended_at) return 0;
  const start = new Date(session.started_at);
  const end = new Date(session.ended_at);
  const diffHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
  return Number.isFinite(diffHours) && diffHours > 0 ? diffHours : 0;
}

function toAssistantDateOnly(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

function pickAssistantLaborRate(rates = [], sessionDate, companyId, userEmail) {
  const day = toAssistantDateOnly(sessionDate);
  if (!day) return null;

  const candidates = rates.filter((rate) => {
    if (rate.company_id !== companyId) return false;
    if (rate.user_email && rate.user_email !== userEmail) return false;
    if (rate.valid_from && rate.valid_from > day) return false;
    if (rate.valid_to && rate.valid_to < day) return false;
    return true;
  });

  if (candidates.length === 0) return null;

  return [...candidates].sort((left, right) => {
    if (left.user_email && !right.user_email) return -1;
    if (!left.user_email && right.user_email) return 1;
    if (left.valid_from === right.valid_from) return 0;
    return left.valid_from > right.valid_from ? -1 : 1;
  })[0];
}

function compareAssistantMemberships(left, right) {
  const statusOrder = {
    active: 0,
    invited: 1,
  };

  const leftWeight = statusOrder[left?.status] ?? 99;
  const rightWeight = statusOrder[right?.status] ?? 99;
  if (leftWeight !== rightWeight) {
    return leftWeight - rightWeight;
  }

  return String(left?.name || "").localeCompare(String(right?.name || ""));
}

function compareAssistantInvites(left, right) {
  const inviteTypeOrder = {
    project_invite: 0,
    company_membership: 1,
    event_invite: 2,
  };

  const leftWeight = inviteTypeOrder[left?.invite_type] ?? 99;
  const rightWeight = inviteTypeOrder[right?.invite_type] ?? 99;
  if (leftWeight !== rightWeight) {
    return leftWeight - rightWeight;
  }

  return String(left?.title || "").localeCompare(String(right?.title || ""));
}

function compareAssistantDecisions(left, right) {
  const decisionTypeOrder = {
    invite_response: 0,
    document_approval: 1,
    change_request: 2,
    dispute_case: 3,
    event_confirmation: 4,
  };

  const leftWeight = decisionTypeOrder[left?.decision_type] ?? 99;
  const rightWeight = decisionTypeOrder[right?.decision_type] ?? 99;
  if (leftWeight !== rightWeight) {
    return leftWeight - rightWeight;
  }

  return String(left?.title || "").localeCompare(String(right?.title || ""));
}

function dedupeAssistantItems(items = [], buildKey) {
  const seen = new Set();
  return (items || []).filter((item) => {
    const key = buildKey(item);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function safeJsonParse(rawValue, fallback) {
  if (typeof rawValue !== "string") {
    return rawValue ?? fallback;
  }

  try {
    return JSON.parse(rawValue);
  } catch {
    return fallback;
  }
}

function clampLimit(value, fallback = 5, max = 10) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.min(Math.max(Math.trunc(numeric), 1), max);
}

function normalizeTaskStatus(value) {
  return ["not_started", "in_progress", "completed", "blocked"].includes(value) ? value : null;
}

function normalizeMilestoneStatus(value) {
  return ["pending", "in_progress", "completed", "delayed"].includes(value) ? value : null;
}

function normalizeChangeRequestStatus(value) {
  return ["pending", "approved", "rejected", "clarification_needed"].includes(value) ? value : null;
}

function normalizeDisputeStatus(value) {
  return ["open", "awaiting_response", "in_review", "resolved", "closed_no_agreement", "escalated"].includes(value) ? value : null;
}

function normalizeDocumentStatus(value) {
  return ["draft", "in_review", "approved", "rejected", "superseded", "archived"].includes(value) ? value : null;
}

function normalizeDocumentApprovalStatus(value) {
  return ["pending", "approved", "rejected"].includes(value) ? value : null;
}

function normalizeCostEntryType(value) {
  return ["labor", "materials", "equipment", "subcontract", "indirect", "extra", "adjustment"].includes(value) ? value : null;
}

function normalizeCostEntryStatus(value) {
  return ["recorded", "approved", "contested"].includes(value) ? value : null;
}

function normalizeProgressStatementStatus(value) {
  return ["draft", "approved", "cancelled"].includes(value) ? value : null;
}

function normalizeChannelType(value) {
  return ["general", "company", "direct", "custom"].includes(value) ? value : null;
}

const DOCUMENT_WORKFLOW_CURRENT_STATE_NOTE = "Lo stato documento oggi e un metadato del record con storico revisioni e approval ledger disponibili, ma senza un workflow approvativo formale governato dal backend.";

async function getChatAccessModeForContext(dbClient, contextType, contextId) {
  if (contextType === "project") {
    const featureAccess = await resolveFeatureAccessForContext(dbClient, contextType, contextId, "project_chat");
    return featureAccess?.access_level === "enabled" ? "full" : "general_only";
  }

  if (contextType === "company") {
    const featureAccess = await resolveFeatureAccessForContext(dbClient, contextType, contextId, "company_chat");
    return featureAccess?.access_level === "enabled" ? "full" : "general_only";
  }

  return "full";
}

function matchesAssistantChannelAccess(membership, userEmail, companyIds = []) {
  if (!membership) return false;
  if (userEmail && membership.user_email === userEmail) return true;
  if (membership.company_id && companyIds.includes(membership.company_id)) return true;
  return false;
}

function selectCurrentAssistantChannelMembership(memberships = [], userEmail, companyIds = []) {
  return memberships.find((membership) => userEmail && membership.user_email === userEmail)
    || memberships.find((membership) => membership.company_id && companyIds.includes(membership.company_id))
    || null;
}

function buildAssistantChannelScopeLabel(channel, projectNameById, companyNameById) {
  if (channel?.project_id) {
    return projectNameById.get(channel.project_id) || channel.project_id;
  }
  if (channel?.company_id) {
    return companyNameById.get(channel.company_id) || channel.company_id;
  }
  return null;
}

function buildAssistantChannelDisplayName(channel, memberships = [], userEmail, companyIds = [], userNameByEmail, companyNameById) {
  if (channel?.type === "direct") {
    const otherMembership = memberships.find((membership) => {
      if (userEmail && membership.user_email === userEmail) return false;
      if (membership.company_id && companyIds.includes(membership.company_id)) return false;
      return true;
    }) || memberships[0];

    if (otherMembership?.user_email) {
      return userNameByEmail.get(otherMembership.user_email) || otherMembership.user_email;
    }
    if (otherMembership?.company_id) {
      return companyNameById.get(otherMembership.company_id) || otherMembership.company_id;
    }
  }

  if (channel?.name) {
    return channel.name;
  }

  if (channel?.company_id) {
    return companyNameById.get(channel.company_id) || channel.company_id;
  }

  return channel?.id || "Canale";
}

function stripStructuredMessageMarkup(value) {
  return String(value || "")
    .replace(/@\[([^\]]+)\]\(([^)]+)\)/g, "$1")
    .replace(/#\[([^\]]+)\]\(([^)]+)\)/g, "$1");
}

function summarizeAssistantMessageContent(value) {
  return previewText(stripStructuredMessageMarkup(value), 180);
}

function countAssistantMessageArtifacts(message) {
  return [
    message?.mentioned_task_ids,
    message?.mentioned_milestone_ids,
    message?.mentioned_change_request_ids,
    message?.mentioned_document_ids,
  ].reduce((total, current) => total + (Array.isArray(current) ? current.length : 0), 0);
}

function compareAssistantChannels(left, right) {
  const leftUnread = Number(left?.unread_count || 0);
  const rightUnread = Number(right?.unread_count || 0);
  if (leftUnread !== rightUnread) {
    return rightUnread - leftUnread;
  }

  const typeOrder = {
    general: 0,
    company: 1,
    direct: 2,
    custom: 3,
  };
  const leftTypeWeight = typeOrder[left?.type] ?? 99;
  const rightTypeWeight = typeOrder[right?.type] ?? 99;
  if (leftTypeWeight !== rightTypeWeight) {
    return leftTypeWeight - rightTypeWeight;
  }

  const lastMessageOrder = String(right?.last_message?.created_date || "").localeCompare(String(left?.last_message?.created_date || ""));
  if (lastMessageOrder !== 0) {
    return lastMessageOrder;
  }

  return String(left?.display_name || left?.name || "").localeCompare(String(right?.display_name || right?.name || ""));
}

function compareAssistantMessages(left, right) {
  const leftPriority = left?.is_mention ? 0 : left?.is_unread ? 1 : 2;
  const rightPriority = right?.is_mention ? 0 : right?.is_unread ? 1 : 2;
  if (leftPriority !== rightPriority) {
    return leftPriority - rightPriority;
  }

  return String(right?.created_date || "").localeCompare(String(left?.created_date || ""));
}

function compareAssistantChannelFollowups(left, right) {
  const leftUnread = Number(left?.unread_count || 0);
  const rightUnread = Number(right?.unread_count || 0);
  if (leftUnread !== rightUnread) {
    return rightUnread - leftUnread;
  }

  return String(right?.last_message?.created_date || "").localeCompare(String(left?.last_message?.created_date || ""));
}

function compareAssistantDocuments(left, right) {
  const leftCurrent = left?.is_current_revision === false ? 1 : 0;
  const rightCurrent = right?.is_current_revision === false ? 1 : 0;
  if (leftCurrent !== rightCurrent) {
    return leftCurrent - rightCurrent;
  }

  return String(right?.updated_date || right?.created_date || "").localeCompare(String(left?.updated_date || left?.created_date || ""))
    || Number(right?.revision_number || 1) - Number(left?.revision_number || 1)
    || String(left?.name || "").localeCompare(String(right?.name || ""));
}

function compareAssistantFinanceProjects(left, right) {
  return Number(right?.watchpoints_count || 0) - Number(left?.watchpoints_count || 0)
    || Number(right?.planned_budget || 0) - Number(left?.planned_budget || 0)
    || String(left?.project_name || "").localeCompare(String(right?.project_name || ""));
}

function compareAssistantBudgetWatchpoints(left, right) {
  const severity = { over_budget: 0, unplanned_costs: 1, at_risk: 2 };
  return Number(severity[left?.watchpoint_status] ?? 99) - Number(severity[right?.watchpoint_status] ?? 99)
    || Number(right?.variance_amount || 0) - Number(left?.variance_amount || 0)
    || String(left?.project_name || "").localeCompare(String(right?.project_name || ""))
    || String(left?.title || "").localeCompare(String(right?.title || ""));
}

function compareAssistantCostEntries(left, right) {
  return String(right?.entry_date || right?.created_date || "").localeCompare(String(left?.entry_date || left?.created_date || ""))
    || Number(right?.amount || 0) - Number(left?.amount || 0)
    || String(left?.description || "").localeCompare(String(right?.description || ""));
}

function compareAssistantLaborRates(left, right) {
  const leftScope = left?.scope_type === "project" ? 0 : 1;
  const rightScope = right?.scope_type === "project" ? 0 : 1;
  return leftScope - rightScope
    || String(left?.company_name || left?.company_id || "").localeCompare(String(right?.company_name || right?.company_id || ""))
    || (left?.user_email ? 0 : 1) - (right?.user_email ? 0 : 1)
    || String(right?.valid_from || "").localeCompare(String(left?.valid_from || ""));
}

function compareAssistantProgressStatements(left, right) {
  return String(right?.statement_date || "").localeCompare(String(left?.statement_date || ""))
    || Number(right?.sequence_number || 0) - Number(left?.sequence_number || 0)
    || String(left?.project_name || "").localeCompare(String(right?.project_name || ""));
}

function compareAssistantCommercials(left, right) {
  return String(left?.project_name || "").localeCompare(String(right?.project_name || ""))
    || String(left?.company_name || left?.company_id || "").localeCompare(String(right?.company_name || right?.company_id || ""));
}

function compareAssistantWorkSessions(left, right) {
  return String(right?.started_at || "").localeCompare(String(left?.started_at || ""))
    || String(left?.user_email || "").localeCompare(String(right?.user_email || ""));
}

function describeAssistantBudgetWatchpointStatus(status) {
  if (status === "over_budget") return "oltre budget";
  if (status === "unplanned_costs") return "costi non pianificati";
  if (status === "at_risk") return "vicino al limite";
  return status || "criticita";
}

function describeAssistantBudgetTrackingMode(value) {
  if (value === "cost_code") return "codici costo";
  return "semplice";
}

function describeAssistantFinancialVisibility(value) {
  if (value === "company_scoped") return "limitata alla societa attiva";
  return "visibile su tutto il progetto";
}

function describeAssistantLaborCostMethod(value) {
  if (value === "manual") return "manuale";
  return "da timbrature";
}

function describeAssistantSalToggle(value) {
  return value ? "attivo" : "disattivo";
}

function describeAssistantProgressStatementStatus(value) {
  if (value === "approved") return "approvato";
  if (value === "cancelled") return "annullato";
  return "bozza";
}

function describeAssistantContractType(value) {
  if (value === "lump_sum") return "a corpo";
  if (value === "unit_price") return "a misura";
  if (value === "time_and_material") return "tempo e materiali";
  return value || null;
}

function buildAssistantLaborRateScopeLabel(rate) {
  if (rate?.scope_type === "project" && rate?.project_name) {
    return rate.project_name;
  }
  const projectNames = Array.isArray(rate?.project_names) ? rate.project_names.filter(Boolean) : [];
  if (projectNames.length > 1) {
    return `${projectNames.length} progetti`;
  }
  if (projectNames.length === 1) {
    return projectNames[0];
  }
  return "tariffa societa";
}

function formatAssistantCurrencyAmount(value, currency) {
  const amount = Number(value || 0);
  const normalizedCurrency = String(currency || "").trim().toUpperCase();
  if (normalizedCurrency.length === 3) {
    try {
      return new Intl.NumberFormat("it-IT", {
        style: "currency",
        currency: normalizedCurrency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
    } catch {
      // Fallback below.
    }
  }

  return new Intl.NumberFormat("it-IT", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function buildAssistantDocumentMetadataLine(document) {
  return [
    document?.file_type,
    document?.discipline,
    document?.work_area,
    document?.project_phase,
    Array.isArray(document?.document_tags) && document.document_tags.length > 0 ? `tag ${document.document_tags.join(", ")}` : null,
  ].filter(Boolean).join(" · ") || null;
}

function describeAssistantDocumentMatch(document, query) {
  const normalizedQuery = normalizeAssistantSearchText(query);
  if (!normalizedQuery) return null;
  if (normalizeAssistantSearchText(document?.name).includes(normalizedQuery)) return "nome";
  if (Array.isArray(document?.document_tags) && document.document_tags.some((tag) => normalizeAssistantSearchText(tag).includes(normalizedQuery))) return "tag";
  if (normalizeAssistantSearchText(document?.discipline).includes(normalizedQuery)) return "disciplina";
  if (normalizeAssistantSearchText(document?.work_area).includes(normalizedQuery)) return "area";
  if (normalizeAssistantSearchText(document?.project_phase).includes(normalizedQuery)) return "fase";
  return "testo rilevante";
}

function summarizeAssistantRevisionEvent(event) {
  if (event?.note) {
    return previewText(event.note, 160);
  }

  const afterStatus = event?.payload?.after?.document_status;
  const beforeStatus = event?.payload?.before?.document_status;
  if (beforeStatus || afterStatus) {
    return [beforeStatus ? `da ${beforeStatus}` : null, afterStatus ? `a ${afterStatus}` : null].filter(Boolean).join(" ");
  }

  return previewText(JSON.stringify(event?.payload || {}), 160);
}

function mergeAssistantNotificationPreferences(storedPreferences) {
  const defaults = {
    project_invite: { notification: true, email: true },
    company_invite: { notification: true, email: true },
    company_plan_activated: { notification: true, email: true },
    company_plan_changed: { notification: true, email: true },
    company_plan_canceled: { notification: true, email: true },
    task_assigned: { notification: true, email: false },
    task_status_changed: { notification: true, email: false },
    change_request_assigned: { notification: true, email: true },
    change_request_status_changed: { notification: true, email: false },
    milestone_status_changed: { notification: true, email: false },
    event_invite: { notification: true, email: true },
    event_updated: { notification: true, email: true },
    event_cancelled: { notification: true, email: true },
    message_mention: { notification: true, email: false },
    document_comment: { notification: true, email: false },
    project_sponsorship_activated: { notification: true, email: true },
    project_sponsorship_revoked: { notification: true, email: true },
    dispute_opened: { notification: true, email: true },
    dispute_status_changed: { notification: true, email: true },
    dispute_commented: { notification: true, email: false },
  };

  return {
    ...defaults,
    ...(storedPreferences || {}),
  };
}

function describeAssistantNotificationPreference(actionKey) {
  const labels = {
    project_invite: "Invito a nuovo cantiere",
    company_invite: "Invito a nuova societa",
    company_plan_activated: "Piano societa attivato",
    company_plan_changed: "Piano societa modificato",
    company_plan_canceled: "Abbonamento societa disdetto",
    task_assigned: "Assegnazione task",
    task_status_changed: "Cambio stato task",
    change_request_assigned: "Assegnazione richiesta di modifica",
    change_request_status_changed: "Cambio stato richiesta di modifica",
    milestone_status_changed: "Cambio stato milestone",
    event_invite: "Invito ad evento",
    event_updated: "Evento aggiornato",
    event_cancelled: "Evento cancellato",
    message_mention: "Menzione in un messaggio",
    document_comment: "Commento su documento",
    project_sponsorship_activated: "Sponsorship cantiere attivata",
    project_sponsorship_revoked: "Sponsorship cantiere revocata",
    dispute_opened: "Nuova disputa aperta",
    dispute_status_changed: "Cambio stato disputa",
    dispute_commented: "Nuovo commento in disputa",
  };

  return labels[actionKey] || humanizeFeatureKey(actionKey);
}

function describeAssistantNotificationPreferenceGroup(actionKey) {
  if (["project_invite", "task_assigned", "task_status_changed", "change_request_assigned", "change_request_status_changed", "milestone_status_changed"].includes(actionKey)) {
    return "Gestione cantieri";
  }
  if (["company_invite", "company_plan_activated", "company_plan_changed", "company_plan_canceled"].includes(actionKey)) {
    return "Gestione societa";
  }
  if (["project_sponsorship_activated", "project_sponsorship_revoked"].includes(actionKey)) {
    return "Piano cantiere";
  }
  if (["event_invite", "event_updated", "event_cancelled"].includes(actionKey)) {
    return "Calendario ed eventi";
  }
  if (["message_mention", "document_comment"].includes(actionKey)) {
    return "Comunicazioni";
  }
  if (["dispute_opened", "dispute_status_changed", "dispute_commented"].includes(actionKey)) {
    return "Gestione dispute";
  }
  return "Altro";
}

function compareAssistantProjects(left, right) {
  const projectStatusOrder = {
    in_progress: 0,
    planning: 1,
    on_hold: 2,
    completed: 3,
  };

  const leftWeight = projectStatusOrder[left?.status] ?? 99;
  const rightWeight = projectStatusOrder[right?.status] ?? 99;

  if (leftWeight !== rightWeight) {
    return leftWeight - rightWeight;
  }

  return String(left?.name || "").localeCompare(String(right?.name || ""));
}

function compareAssistantParticipants(left, right) {
  const statusOrder = {
    active: 0,
    invited: 1,
  };

  const leftWeight = statusOrder[left?.status] ?? 99;
  const rightWeight = statusOrder[right?.status] ?? 99;

  if (leftWeight !== rightWeight) {
    return leftWeight - rightWeight;
  }

  return String(left?.user_email || left?.company_id || "").localeCompare(String(right?.user_email || right?.company_id || ""));
}

function describeTaskAssignment(task) {
  return task.assigned_company_name || task.assigned_user_name || task.assigned_user_email || null;
}

function countByField(items = [], fieldName) {
  return items.reduce((accumulator, item) => {
    const key = item?.[fieldName] || "unknown";
    accumulator[key] = (accumulator[key] || 0) + 1;
    return accumulator;
  }, {});
}

function uniqueValues(values = []) {
  return Array.from(new Set((values || []).filter(Boolean)));
}

function normalizeAssistantUiMode(uiMode) {
  return ASSISTANT_UI_MODES.includes(uiMode) ? uiMode : "normal";
}

function previewText(value, maxLength = 160) {
  const normalized = String(value || "").replace(/\s+/g, " ").trim();
  if (!normalized) return "";
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 1).trim()}...`;
}

function isOpenDisputeStatus(status) {
  return ["open", "awaiting_response", "in_review", "escalated"].includes(String(status || "").trim());
}

function isEventScheduledOnDate(event, dateKey) {
  const startDate = String(event?.start_datetime || "").slice(0, 10);
  const endDate = String(event?.end_datetime || event?.start_datetime || "").slice(0, 10);
  if (!startDate) {
    return false;
  }
  return dateKey >= startDate && dateKey <= endDate;
}

function describeProjectParticipantLabel(participant, userNameByEmail, companyNameById) {
  if (!participant) return null;
  if (participant.participant_type === "company") {
    return companyNameById.get(participant.company_id) || participant.company_name || participant.company_id || null;
  }
  return userNameByEmail.get(participant.user_email) || participant.user_email || null;
}

function describeEventParticipantLabel(participant, userNameByEmail, companyNameById) {
  if (!participant) return null;
  if (participant.participant_type === "company") {
    return companyNameById.get(participant.company_id) || participant.company_id || null;
  }
  return userNameByEmail.get(participant.user_email) || participant.user_email || null;
}

function buildDisputeEvidenceSummary(item, eventsById = new Map()) {
  const labels = {
    task: "Task",
    change_request: "Variante",
    message: "Messaggio",
    document_comment: "Commento documento",
    event: "Evento",
    manual_note: "Nota manuale",
  };
  const prefix = labels[item?.source_type] || "Evidenza";

  if (item?.source_type === "event" && item?.source_id && eventsById.get(item.source_id)?.title) {
    return `${prefix}: ${eventsById.get(item.source_id).title}`;
  }
  if (item?.snapshot?.title) {
    return `${prefix}: ${item.snapshot.title}`;
  }
  if (item?.note) {
    return `${prefix}: ${previewText(item.note, 140)}`;
  }
  return prefix;
}

function buildProjectPath(projectId) {
  return `/app/ProjectDetail?id=${encodeURIComponent(projectId)}`;
}

function buildProjectTasksPath(projectId) {
  return `${buildProjectPath(projectId)}&tab=lavori&section=tasks`;
}

function buildProjectTaskDetailPath(projectId, taskId) {
  return `${buildProjectTasksPath(projectId)}&itemId=task-${encodeURIComponent(taskId)}`;
}

function buildProjectMilestonesPath(projectId) {
  return `${buildProjectPath(projectId)}&tab=lavori&section=milestones`;
}

function buildProjectMilestoneDetailPath(projectId, milestoneId) {
  return `${buildProjectMilestonesPath(projectId)}&itemId=milestone-${encodeURIComponent(milestoneId)}`;
}

function buildProjectChangeRequestsPath(projectId) {
  return `${buildProjectPath(projectId)}&tab=lavori&section=changes`;
}

function buildProjectChangeRequestDetailPath(projectId, changeRequestId) {
  return `${buildProjectChangeRequestsPath(projectId)}&itemId=change-${encodeURIComponent(changeRequestId)}`;
}

function buildProjectDisputesPath(projectId) {
  return `${buildProjectPath(projectId)}&tab=lavori&section=disputes`;
}

function buildProjectDisputeDetailPath(projectId, disputeId) {
  return `${buildProjectDisputesPath(projectId)}&itemId=dispute-${encodeURIComponent(disputeId)}`;
}

function buildProjectDocumentsPath(projectId) {
  return `/app/ProjectDetail?id=${encodeURIComponent(projectId)}&tab=info&section=documents`;
}

function buildCompanyDocumentsPath(companyId) {
  return `${buildCompanyPath(companyId)}&tab=operativita&section=documenti`;
}

function buildDocumentNavigationPath(document, contextType, contextId) {
  if (contextType === "company" && (document?.company_id === contextId || (!document?.project_id && document?.company_id))) {
    return buildCompanyDocumentsPath(document.company_id || contextId);
  }
  if (contextType === "project" && (document?.project_id === contextId || (!document?.company_id && document?.project_id))) {
    return buildProjectDocumentsPath(document.project_id || contextId);
  }
  if (document?.project_id) {
    return buildProjectDocumentsPath(document.project_id);
  }
  if (document?.company_id) {
    return buildCompanyDocumentsPath(document.company_id);
  }
  if (contextType === "project") {
    return buildProjectDocumentsPath(contextId);
  }
  if (contextType === "company") {
    return buildCompanyDocumentsPath(contextId);
  }
  return "/app/Notifications";
}

function buildProjectChatPath(projectId) {
  return `${buildProjectPath(projectId)}&tab=info&section=chat`;
}

function buildCompanyChatPath(companyId) {
  return `${buildCompanyPath(companyId)}&tab=operativita&section=chat`;
}

function buildChannelNavigationPath(contextType, contextId, channel, uiMode) {
  if (normalizeAssistantUiMode(uiMode) === "operational") {
    if (channel?.project_id) {
      return `/app/operativa/progetto/${encodeURIComponent(channel.project_id)}?tab=chat`;
    }
    if (contextType === "project") {
      return `/app/operativa/progetto/${encodeURIComponent(contextId)}?tab=chat`;
    }
    if (channel?.company_id || contextType === "company") {
      return "/app/operativa/societa?tab=chat";
    }
  }

  if (channel?.project_id) {
    return buildProjectChatPath(channel.project_id);
  }
  if (channel?.company_id) {
    return buildCompanyChatPath(channel.company_id);
  }
  if (contextType === "project") {
    return buildProjectChatPath(contextId);
  }
  if (contextType === "company") {
    return buildCompanyChatPath(contextId);
  }

  return "/app/Notifications";
}

function buildEventNavigationPath(contextType, contextId, event) {
  if (contextType === "project") {
    return buildProjectPath(contextId || event?.owner_project_id);
  }

  return "/app/Calendar";
}

function buildOperationalDayBriefPath(contextType, contextId, uiMode) {
  if (normalizeAssistantUiMode(uiMode) === "operational") {
    if (contextType === "project") {
      return `/app/operativa/progetto/${encodeURIComponent(contextId)}`;
    }
    return "/app/operativa/riepilogo";
  }

  return buildDefaultContextPath(contextType, contextId, uiMode);
}

function buildDisputeEvidencePath(projectId, item) {
  if (!projectId || !item?.source_type || !item?.source_id) {
    return buildProjectDisputesPath(projectId);
  }

  if (item.source_type === "task") {
    return buildProjectTaskDetailPath(projectId, item.source_id);
  }
  if (item.source_type === "change_request") {
    return buildProjectChangeRequestDetailPath(projectId, item.source_id);
  }
  if (item.source_type === "event") {
    return "/app/Calendar";
  }

  return buildProjectDisputesPath(projectId);
}

function buildCompanyPath(companyId) {
  return `/app/CompanyDetail?id=${encodeURIComponent(companyId)}`;
}

function buildNotificationTarget(notification, options = {}) {
  const messageProjectById = options.messageProjectById || new Map();

  if (!notification?.type) return null;

  switch (notification.type) {
    case "project_invite":
    case "project_sponsorship_activated":
    case "project_sponsorship_revoked":
      return notification.related_event_id ? buildProjectPath(notification.related_event_id) : null;
    case "event_invite":
    case "event_cancelled":
    case "event_updated":
    case "conflict_resolved":
      return "/app/Calendar";
    case "message_mention": {
      const projectId = messageProjectById.get(notification.related_event_id);
      return projectId ? `${buildProjectPath(projectId)}&tab=info&section=chat` : "/app/Notifications";
    }
    case "task_status_changed":
      return notification.related_event_id ? buildProjectTasksPath(notification.related_event_id) : "/app/Notifications";
    case "dispute_opened":
    case "dispute_status_changed":
    case "dispute_commented":
      return notification.related_event_id ? `${buildProjectPath(notification.related_event_id)}&tab=lavori&section=disputes` : "/app/Notifications";
    case "company_plan_activated":
    case "company_plan_changed":
    case "company_plan_canceled":
      return notification.context_company_id ? `${buildCompanyPath(notification.context_company_id)}&tab=billing` : null;
    default:
      return "/app/Notifications";
  }
}