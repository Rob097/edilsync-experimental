import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

const ENTITY_TO_TABLE = {
  AiChat: 'ai_chats',
  AiMessage: 'ai_messages',
  BudgetLine: 'budget_lines',
  ChangeRequest: 'change_requests',
  Channel: 'channels',
  ChannelMember: 'channel_members',
  Company: 'companies',
  CompanyMember: 'company_members',
  CompanySubscription: 'company_subscriptions',
  CostEntry: 'cost_entries',
  DisputeCase: 'dispute_cases',
  DisputeEvent: 'dispute_events',
  DisputeEvidenceItem: 'dispute_evidence_items',
  DocumentComment: 'document_comments',
  DocumentRevisionEvent: 'document_revision_events',
  DocumentApproval: 'document_approvals',
  Event: 'events',
  EventParticipant: 'event_participants',
  LaborRate: 'labor_rates',
  Message: 'messages',
  Milestone: 'milestones',
  Notification: 'notifications',
  NotificationPreference: 'notification_preferences',
  Project: 'projects',
  ProjectCompanyCommercials: 'project_company_commercials',
  ProjectDocument: 'project_documents',
  ProjectFinancialSettings: 'project_financial_settings',
  ProjectMessage: 'project_messages',
  ProjectParticipant: 'project_participants',
  ProjectSponsorship: 'project_sponsorships',
  ProgressStatement: 'progress_statements',
  Task: 'tasks',
  WorkSession: 'work_sessions',
  User: 'users',
};

const USER_UPDATABLE_FIELDS = new Set([
  'full_name',
  'display_name',
  'phone',
  'active_context',
  'active_company_id',
  'tour_state',
]);

const parseOrder = (orderBy) => {
  if (!orderBy) return { column: 'created_date', ascending: false };
  if (orderBy.startsWith('-')) {
    return { column: orderBy.slice(1), ascending: false };
  }
  return { column: orderBy, ascending: true };
};

const applyFilters = (query, filters = {}) => {
  let nextQuery = query;
  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || value === null) continue;
    if (Array.isArray(value)) {
      nextQuery = nextQuery.in(key, value);
    } else {
      nextQuery = nextQuery.eq(key, value);
    }
  }
  return nextQuery;
};

const getExistingUserRecordByEmail = async (email) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .maybeSingle();

  if (error) throw error;
  return data;
};

const isUserInsertConflict = (error) =>
  error?.status === 409 || error?.code === '23505' || /duplicate|conflict/i.test(error?.message || '');

const getUserRecord = async () => {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw userError || new Error('User not authenticated');
  }

  const existing = await getExistingUserRecordByEmail(user.email);

  if (existing) {
    if (!existing.auth_user_id) {
      const { error: bindError } = await supabase
        .from('users')
        .update({ auth_user_id: user.id })
        .eq('id', existing.id);
      if (bindError) throw bindError;
    }
    return existing;
  }

  const payload = {
    auth_user_id: user.id,
    email: user.email,
    full_name: user.user_metadata?.full_name || user.user_metadata?.name || null,
    display_name: user.user_metadata?.display_name || user.user_metadata?.name || null,
    role: 'normal',
    company_ids: [],
    admin_company_ids: [],
    project_ids: [],
    active_context: 'personal',
  };

  const { data: inserted, error: insertError } = await supabase
    .from('users')
    .insert(payload)
    .select('*')
    .single();

  if (insertError) {
    if (isUserInsertConflict(insertError)) {
      const conflictedRecord = await getExistingUserRecordByEmail(user.email);
      if (conflictedRecord) {
        return conflictedRecord;
      }
    }

    throw insertError;
  }

  return inserted;
};

const createEntityClient = (entityName) => {
  const table = ENTITY_TO_TABLE[entityName];
  if (!table) throw new Error(`Unknown entity: ${entityName}`);

  return {
    list: async (orderBy = '-created_date', limit) => {
      const order = parseOrder(orderBy);
      let query = supabase.from(table).select('*').order(order.column, { ascending: order.ascending });
      if (limit) query = query.limit(limit);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    filter: async (filters = {}, orderBy = '-created_date', limit) => {
      const order = parseOrder(orderBy);
      let query = supabase.from(table).select('*');
      query = applyFilters(query, filters);
      query = query.order(order.column, { ascending: order.ascending });
      if (limit) query = query.limit(limit);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    create: async (payload) => {
      const withAudit = { ...payload };
      if (!withAudit.created_by) {
        try {
          withAudit.created_by = (await getUserRecord()).email;
        } catch {
          withAudit.created_by = null;
        }
      }
      const { data, error } = await supabase.from(table).insert(withAudit).select('*').single();
      if (error) throw error;
      return data;
    },
    update: async (id, payload) => {
      const { data, error } = await supabase.from(table).update(payload).eq('id', id).select('*').single();
      if (error) throw error;
      return data;
    },
    delete: async (id) => {
      const { error } = await supabase.from(table).delete().eq('id', id);
      if (error) throw error;
      return { id };
    },
  };
};

const entities = new Proxy(
  {},
  {
    get: (_, entityName) => createEntityClient(entityName),
  },
);

const auth = {
  me: async () => getUserRecord(),
  signInWithPassword: async ({ email, password }) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return getUserRecord();
  },
  signUpWithPassword: async ({ email, password }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) throw error;

    if (!data.session) {
      return {
        requiresEmailConfirmation: true,
      };
    }

    const user = await getUserRecord();
    return {
      requiresEmailConfirmation: false,
      user,
    };
  },
  onAuthStateChange: (callback) => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      callback(event, session);
    });

    return () => subscription.unsubscribe();
  },
  updateMe: async (payload) => {
    const me = await getUserRecord();

    const sanitizedPayload = Object.fromEntries(
      Object.entries(payload || {}).filter(([key]) => USER_UPDATABLE_FIELDS.has(key)),
    );

    const { data, error } = await supabase
      .from('users')
      .update(sanitizedPayload)
      .eq('id', me.id)
      .select('*')
      .single();
    if (error) throw error;
    return data;
  },
  logout: async (redirectTo) => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    if (redirectTo) window.location.href = redirectTo;
  },
  redirectToLogin: async (redirectTo) => {
    const provider = import.meta.env.VITE_SUPABASE_AUTH_PROVIDER || 'google';
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: redirectTo || window.location.href },
    });
    if (error) throw error;
  },
};

const getFunctionInvokeHeaders = async () => {
  const {
    data: { session: initialSession },
    error,
  } = await supabase.auth.getSession();

  if (error) throw error;

  let session = initialSession;

  const expiresSoon = session?.expires_at
    ? session.expires_at * 1000 <= Date.now() + 60 * 1000
    : false;

  if (session?.refresh_token && expiresSoon) {
    const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession({
      refresh_token: session.refresh_token,
    });

    if (refreshError) throw refreshError;
    session = refreshed.session;
  }

  if (!session?.access_token) {
    return undefined;
  }

  return {
    Authorization: `Bearer ${session.access_token}`,
  };
};

const parseFunctionResponse = async (response) => {
  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    return response.json().catch(() => null);
  }

  const text = await response.text().catch(() => '');
  return text || null;
};

const parseSsePayload = (rawPayload) => {
  if (!rawPayload) return null;

  try {
    return JSON.parse(rawPayload);
  } catch {
    return rawPayload;
  }
};

const dispatchSseEvent = (rawEvent, handlers) => {
  if (!rawEvent) return null;

  let eventName = 'message';
  const dataLines = [];

  rawEvent.split(/\r?\n/).forEach((line) => {
    if (line.startsWith('event:')) {
      eventName = line.slice(6).trim() || 'message';
      return;
    }

    if (line.startsWith('data:')) {
      dataLines.push(line.slice(5).trimStart());
    }
  });

  if (dataLines.length === 0) {
    return null;
  }

  const payload = parseSsePayload(dataLines.join('\n'));
  handlers.onEvent?.({ event: eventName, payload });

  if (eventName === 'delta') {
    handlers.onDelta?.(payload);
  }

  if (eventName === 'tool') {
    handlers.onTool?.(payload);
  }

  if (eventName === 'done') {
    handlers.onDone?.(payload);
  }

  if (eventName === 'error') {
    handlers.onError?.(payload);
  }

  return { event: eventName, payload };
};

const consumeSseBuffer = (buffer, handlers, flush = false) => {
  let nextBuffer = buffer;

  while (true) {
    const delimiterIndex = nextBuffer.indexOf('\n\n');
    if (delimiterIndex === -1) {
      break;
    }

    const rawEvent = nextBuffer.slice(0, delimiterIndex).trim();
    if (rawEvent) {
      dispatchSseEvent(rawEvent, handlers);
    }

    nextBuffer = nextBuffer.slice(delimiterIndex + 2);
  }

  if (flush) {
    const trailingEvent = nextBuffer.trim();
    if (trailingEvent) {
      dispatchSseEvent(trailingEvent, handlers);
    }
    return '';
  }

  return nextBuffer;
};

const functions = {
  invoke: async (name, body) => {
    const authHeaders = await getFunctionInvokeHeaders();
    const response = await fetch(`${supabaseUrl}/functions/v1/${name}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: supabaseAnonKey,
        ...(authHeaders || {}),
      },
      body: JSON.stringify(body ?? {}),
    });

    const payload = await parseFunctionResponse(response);

    if (!response.ok) {
      const message = typeof payload === 'string'
        ? payload
        : payload?.error || payload?.message || `Function ${name} failed with status ${response.status}`;
      throw new Error(message);
    }

    return payload;
  },
  stream: async (name, body, handlers = {}) => {
    const authHeaders = await getFunctionInvokeHeaders();
    const response = await fetch(`${supabaseUrl}/functions/v1/${name}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
        apikey: supabaseAnonKey,
        ...(authHeaders || {}),
      },
      body: JSON.stringify(body ?? {}),
    });

    if (!response.ok) {
      const payload = await parseFunctionResponse(response);
      const message = typeof payload === 'string'
        ? payload
        : payload?.error || payload?.message || `Function ${name} failed with status ${response.status}`;
      throw new Error(message);
    }

    if (!response.body) {
      const payload = await parseFunctionResponse(response);
      handlers.onDone?.(payload);
      return payload;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, '\n');
      buffer = consumeSseBuffer(buffer, handlers);
    }

    buffer += decoder.decode().replace(/\r\n/g, '\n');
    consumeSseBuffer(buffer, handlers, true);
    handlers.onComplete?.();
    return null;
  },
};

const rpc = async (name, params = {}) => {
  const { data, error } = await supabase.rpc(name, params);
  if (error) throw error;
  return data;
};

const absolutizeStorageUrl = (url) => {
  if (!url) return null;
  try {
    return new URL(url, supabaseUrl).toString();
  } catch {
    return url;
  }
};

const integrations = {
  Core: {
    UploadFile: async ({ file }) => {
      if (!file) throw new Error('Missing file');
      const filePath = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
      const { error: uploadError } = await supabase.storage
        .from('project-files')
        .upload(filePath, file, { upsert: false });
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('project-files').getPublicUrl(filePath);
      return {
        file_url: absolutizeStorageUrl(data.publicUrl),
        file_path: filePath,
      };
    },
    GetSignedFileUrl: async ({ filePath, expiresIn = 3600 }) => {
      if (!filePath) return null;
      const { data, error } = await supabase.storage
        .from('project-files')
        .createSignedUrl(filePath, expiresIn);
      if (error) throw error;
      return absolutizeStorageUrl(data?.signedUrl) || null;
    },
    ResolveFileAccessUrl: async ({ filePath, fallbackUrl, expiresIn = 3600 }) => {
      if (filePath) {
        try {
          const signedUrl = await integrations.Core.GetSignedFileUrl({ filePath, expiresIn });
          if (signedUrl) return signedUrl;
        } catch {
          // Fall back to legacy public URL for existing records.
        }
      }
      return absolutizeStorageUrl(fallbackUrl) || null;
    },
  },
};

const appLogs = {
  logUserInApp: async (pageName) => {
    const me = await getUserRecord();
    const { error } = await supabase.from('app_logs').insert({
      user_email: me.email,
      page_name: pageName,
    });
    if (error) throw error;
  },
};

export const appClient = {
  entities,
  auth,
  functions,
  rpc,
  integrations,
  appLogs,
};
