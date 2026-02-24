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
  ChangeRequest: 'change_requests',
  Channel: 'channels',
  ChannelMember: 'channel_members',
  Company: 'companies',
  CompanyMember: 'company_members',
  DocumentComment: 'document_comments',
  Event: 'events',
  EventParticipant: 'event_participants',
  Message: 'messages',
  Milestone: 'milestones',
  Notification: 'notifications',
  NotificationPreference: 'notification_preferences',
  Project: 'projects',
  ProjectDocument: 'project_documents',
  ProjectMessage: 'project_messages',
  ProjectParticipant: 'project_participants',
  Task: 'tasks',
  User: 'users',
};

const USER_UPDATABLE_FIELDS = new Set([
  'full_name',
  'display_name',
  'phone',
  'role',
  'company_ids',
  'admin_company_ids',
  'project_ids',
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

const getUserRecord = async () => {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw userError || new Error('User not authenticated');
  }

  const { data: existing, error: existingError } = await supabase
    .from('users')
    .select('*')
    .eq('email', user.email)
    .maybeSingle();

  if (existingError) throw existingError;

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
    role: 'user',
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

  if (insertError) throw insertError;
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

const functions = {
  invoke: async (name, body) => {
    const { data, error } = await supabase.functions.invoke(name, { body });
    if (error) throw error;
    return data;
  },
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
        file_url: data.publicUrl,
        file_path: filePath,
      };
    },
  },
};

const agents = {
  listConversations: async ({ agent_name }) => {
    const me = await getUserRecord();
    const { data, error } = await supabase
      .from('assistant_conversations')
      .select('*')
      .eq('user_email', me.email)
      .eq('agent_name', agent_name)
      .order('updated_date', { ascending: false });
    if (error) throw error;
    return data || [];
  },
  getConversation: async (id) => {
    const me = await getUserRecord();
    const { data, error } = await supabase
      .from('assistant_conversations')
      .select('*')
      .eq('id', id)
      .eq('user_email', me.email)
      .single();
    if (error) throw error;
    return data;
  },
  createConversation: async ({ agent_name, metadata }) => {
    const me = await getUserRecord();
    const { data, error } = await supabase
      .from('assistant_conversations')
      .insert({
        user_email: me.email,
        agent_name,
        metadata: metadata || {},
        messages: [],
      })
      .select('*')
      .single();
    if (error) throw error;
    return data;
  },
  addMessage: async (conversation, message) => {
    const current = await agents.getConversation(conversation.id);
    const messages = Array.isArray(current.messages) ? [...current.messages] : [];
    messages.push({
      id: crypto.randomUUID(),
      role: message.role,
      content: message.content,
      created_date: new Date().toISOString(),
    });

    messages.push({
      id: crypto.randomUUID(),
      role: 'assistant',
      content:
        'Assistente non ancora configurato in Supabase. Fornisci i dettagli di edilsync_assistant per completare questa parte.',
      created_date: new Date().toISOString(),
    });

    const { data, error } = await supabase
      .from('assistant_conversations')
      .update({ messages })
      .eq('id', conversation.id)
      .select('*')
      .single();
    if (error) throw error;
    return data;
  },
  subscribeToConversation: (conversationId, callback) => {
    const channel = supabase
      .channel(`assistant:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'assistant_conversations',
          filter: `id=eq.${conversationId}`,
        },
        async () => {
          const convo = await agents.getConversation(conversationId);
          callback(convo);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
  getWhatsAppConnectURL: () => '#',
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
  integrations,
  agents,
  appLogs,
};
