import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { afterEach, describe, expect, test } from 'vitest';
import { assertQaSupabaseUrl } from '../helpers/qa-target.js';

const requiredEnvNames = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY'];
const hasRemoteQaEnv = process.env.RUN_REMOTE_QA_INTEGRATION === '1'
  && requiredEnvNames.every((envName) => Boolean(process.env[envName]));

const describeIfRemoteQa = hasRemoteQaEnv ? describe : describe.skip;

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (process.env.RUN_REMOTE_QA_INTEGRATION === '1' && supabaseUrl) {
  assertQaSupabaseUrl(supabaseUrl, 'SUPABASE_URL');
}

const adminClient = hasRemoteQaEnv
  ? createClient(supabaseUrl, supabaseServiceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } })
  : null;

const createAnonClient = () => createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const createSuffix = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const invokeFunctionAsUser = async (functionName, accessToken, payload) => {
  const response = await fetch(`${supabaseUrl}/functions/v1/${functionName}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload ?? {}),
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.error || `${functionName} failed with status ${response.status}`);
  }

  return data;
};

describeIfRemoteQa('QA branch edge workflows', () => {
  const cleanups = [];

  const registerCleanup = (cleanup) => {
    cleanups.unshift(cleanup);
  };

  afterEach(async () => {
    for (const cleanup of cleanups.splice(0)) {
      await cleanup();
    }
  });

  const createAuthUser = async (label) => {
    const suffix = createSuffix();
    const email = `qa-${label}-${suffix}@edilsync.test`;
    const password = `EdilSync!${suffix}Aa`;

    const { data, error } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: `QA ${label}`,
      },
    });

    if (error) throw error;

    registerCleanup(async () => {
      await adminClient.from('users').delete().eq('email', email);
      await adminClient.auth.admin.deleteUser(data.user.id);
    });

    return {
      id: data.user.id,
      email,
      password,
    };
  };

  const signIn = async ({ email, password }) => {
    const anonClient = createAnonClient();
    const { data, error } = await anonClient.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data.session.access_token;
  };

  const cleanupProjectGraph = async (projectId) => {
    await adminClient.from('ai_messages').delete().eq('context_type', 'project').eq('context_id', projectId);
    await adminClient.from('ai_chats').delete().eq('context_type', 'project').eq('context_id', projectId);
    await adminClient.from('embeddings').delete().eq('context_type', 'project').eq('context_id', projectId);
    await adminClient.from('ai_embedding_sync_state').delete().eq('context_type', 'project').eq('context_id', projectId);
    await adminClient.from('document_comments').delete().eq('project_id', projectId);
    await adminClient.from('project_documents').delete().eq('project_id', projectId);
    await adminClient.from('channel_members').delete().eq('project_id', projectId);
    await adminClient.from('channels').delete().eq('project_id', projectId);
    await adminClient.from('tasks').delete().eq('project_id', projectId);
    await adminClient.from('project_company_commercials').delete().eq('project_id', projectId);
    await adminClient.from('progress_statements').delete().eq('project_id', projectId);
    await adminClient.from('cost_entries').delete().eq('project_id', projectId);
    await adminClient.from('work_sessions').delete().eq('project_id', projectId);
    await adminClient.from('labor_rates').delete().eq('project_id', projectId);
    await adminClient.from('budget_lines').delete().eq('project_id', projectId);
    await adminClient.from('project_financial_settings').delete().eq('project_id', projectId);
    await adminClient.from('project_sponsorships').delete().eq('project_id', projectId);
    await adminClient.from('project_participants').delete().eq('project_id', projectId);
    await adminClient.from('projects').delete().eq('id', projectId);
  };

  const cleanupCompanyGraph = async (companyId) => {
    await adminClient.from('channel_members').delete().eq('company_id', companyId);
    await adminClient.from('channels').delete().eq('company_id', companyId);
    await adminClient.from('company_subscriptions').delete().eq('company_id', companyId);
    await adminClient.from('company_members').delete().eq('company_id', companyId);
    await adminClient.from('companies').delete().eq('id', companyId);
  };

  const createCompanyAsUser = async (label, accessToken, email) => {
    const payload = await invokeFunctionAsUser('createCompanyWithInitialization', accessToken, {
      name: `QA ${label} Company ${createSuffix()}`,
      company_type: 'general_contractor',
      address: `Via QA ${label} 1, Milano`,
      email,
    });

    registerCleanup(async () => {
      await cleanupCompanyGraph(payload.company.id);
    });

    return payload.company;
  };

  const setUserCompanyContext = async (email, companyId) => {
    const { error } = await adminClient
      .from('users')
      .update({ active_context: 'company', active_company_id: companyId })
      .eq('email', email);

    if (error) throw error;
  };

  const setCompanyPaidSubscription = async (companyId) => {
    const { error } = await adminClient
      .from('company_subscriptions')
      .update({
        plan_code: 'paid',
        billing_status: 'active',
        billing_cycle: 'monthly',
        currency: 'EUR',
      })
      .eq('company_id', companyId);

    if (error) throw error;
  };

  const createCompanyOwnedProject = async ({ accessToken, homeownerEmail, namePrefix = 'Company Project' }) => {
    registerCleanup(async () => {
      await adminClient.from('users').delete().eq('email', homeownerEmail);
    });

    const payload = await invokeFunctionAsUser('createProjectWithContext', accessToken, {
      name: `QA ${namePrefix} ${createSuffix()}`,
      address: 'Via QA Cantiere 20, Bergamo',
      description: 'Remote QA company-context project fixture',
      status: 'planning',
      my_role: 'contractor',
      homeowner_email: homeownerEmail,
    });

    registerCleanup(async () => {
      await cleanupProjectGraph(payload.project.id);
    });

    return payload.project;
  };

  test('createCompanyWithInitialization creates the company baseline graph', async () => {
    const user = await createAuthUser('company');
    const accessToken = await signIn(user);
    const companyName = `QA Company ${createSuffix()}`;

    const payload = await invokeFunctionAsUser('createCompanyWithInitialization', accessToken, {
      name: companyName,
      company_type: 'general_contractor',
      address: 'Via QA 1, Milano',
      email: user.email,
    });

    expect(payload.success).toBe(true);
    expect(payload.company?.id).toBeTruthy();
    expect(payload.company?.name).toBe(companyName);

    registerCleanup(async () => {
      await cleanupCompanyGraph(payload.company.id);
    });

    const { data: membership } = await adminClient
      .from('company_members')
      .select('role, status, user_email')
      .eq('company_id', payload.company.id)
      .eq('user_email', user.email)
      .maybeSingle();

    const { data: subscription } = await adminClient
      .from('company_subscriptions')
      .select('plan_code, billing_status')
      .eq('company_id', payload.company.id)
      .maybeSingle();

    const { data: channels } = await adminClient
      .from('channels')
      .select('name, type')
      .eq('company_id', payload.company.id);

    expect(membership).toMatchObject({ role: 'admin', status: 'active', user_email: user.email });
    expect(subscription).toMatchObject({ plan_code: 'free', billing_status: 'free' });
    expect(channels?.some((channel) => channel.name === 'General' && channel.type === 'company')).toBe(true);
  });

  test('createProjectWithContext creates a personal homeowner project', async () => {
    const user = await createAuthUser('project');
    const accessToken = await signIn(user);
    const projectName = `QA Personal Project ${createSuffix()}`;

    const payload = await invokeFunctionAsUser('createProjectWithContext', accessToken, {
      name: projectName,
      address: 'Via QA Cantiere 12, Bergamo',
      description: 'Remote QA integration project fixture',
      status: 'planning',
    });

    expect(payload.success).toBe(true);
    expect(payload.project?.id).toBeTruthy();
    expect(payload.project?.owner_type).toBe('personal');

    registerCleanup(async () => {
      await cleanupProjectGraph(payload.project.id);
    });

    const { data: participant } = await adminClient
      .from('project_participants')
      .select('participant_type, project_role, status, user_email')
      .eq('project_id', payload.project.id)
      .eq('user_email', user.email)
      .maybeSingle();

    const { data: channels } = await adminClient
      .from('channels')
      .select('name, type')
      .eq('project_id', payload.project.id);

    expect(participant).toMatchObject({
      participant_type: 'personal',
      project_role: 'homeowner',
      status: 'active',
      user_email: user.email,
    });
    expect(channels?.some((channel) => channel.name === 'General' && channel.type === 'general')).toBe(true);
  });

  test('createProjectWithContext invites homeowner when a company creates as contractor', async () => {
    const contractorUser = await createAuthUser('contractor');
    const accessToken = await signIn(contractorUser);
    const homeownerEmail = `qa-homeowner-invite-${createSuffix()}@edilsync.test`;

    const companyPayload = await invokeFunctionAsUser('createCompanyWithInitialization', accessToken, {
      name: `QA Contractor Company ${createSuffix()}`,
      company_type: 'general_contractor',
      address: 'Via QA Impresa 21, Brescia',
      email: contractorUser.email,
    });

    registerCleanup(async () => {
      await cleanupCompanyGraph(companyPayload.company.id);
      await adminClient.from('users').delete().eq('email', homeownerEmail);
    });

    await adminClient
      .from('users')
      .update({ active_context: 'company', active_company_id: companyPayload.company.id })
      .eq('email', contractorUser.email);

    const projectPayload = await invokeFunctionAsUser('createProjectWithContext', accessToken, {
      name: `QA Contractor Project ${createSuffix()}`,
      address: 'Via QA Contractor 9, Verona',
      description: 'Company-context project creation for QA integration coverage',
      status: 'planning',
      my_role: 'contractor',
      homeowner_email: homeownerEmail,
    });

    expect(projectPayload.success).toBe(true);
    expect(projectPayload.project?.owner_type).toBe('company');
    expect(projectPayload.project?.owner_company_id).toBe(companyPayload.company.id);
    expect(projectPayload.invited_homeowner?.user_email).toBe(homeownerEmail);

    registerCleanup(async () => {
      await cleanupProjectGraph(projectPayload.project.id);
    });

    const { data: invitedHomeowner } = await adminClient
      .from('project_participants')
      .select('participant_type, project_role, status, user_email')
      .eq('project_id', projectPayload.project.id)
      .eq('user_email', homeownerEmail)
      .maybeSingle();

    expect(invitedHomeowner).toMatchObject({
      participant_type: 'personal',
      project_role: 'homeowner',
      status: 'invited',
      user_email: homeownerEmail,
    });
  });

  test('respondProjectParticipantInvite accepts a company invite for an active company member', async () => {
    const projectOwner = await createAuthUser('invite-accept-owner');
    const invitedCompanyAdmin = await createAuthUser('invite-accept-company-admin');
    const projectOwnerAccessToken = await signIn(projectOwner);
    const invitedCompanyAccessToken = await signIn(invitedCompanyAdmin);

    const invitedCompany = await createCompanyAsUser('Invite Accept Target', invitedCompanyAccessToken, invitedCompanyAdmin.email);

    const projectPayload = await invokeFunctionAsUser('createProjectWithContext', projectOwnerAccessToken, {
      name: `QA Invite Accept Project ${createSuffix()}`,
      address: 'Via QA Invite 44, Milano',
      description: 'QA integration coverage for company invite acceptance.',
      status: 'planning',
    });

    registerCleanup(async () => {
      await cleanupProjectGraph(projectPayload.project.id);
    });

    const participantId = randomUUID();
    const { error: participantInsertError } = await adminClient
      .from('project_participants')
      .insert({
        id: participantId,
        project_id: projectPayload.project.id,
        participant_type: 'company',
        company_id: invitedCompany.id,
        user_email: invitedCompanyAdmin.email,
        project_role: 'contractor',
        status: 'invited',
        can_invite: false,
      });

    if (participantInsertError) throw participantInsertError;

    const response = await invokeFunctionAsUser('respondProjectParticipantInvite', invitedCompanyAccessToken, {
      participant_id: participantId,
      status: 'active',
    });

    expect(response.success).toBe(true);
    expect(response.participant?.id).toBe(participantId);
    expect(response.participant?.status).toBe('active');

    const { data: updatedParticipant, error: updatedParticipantError } = await adminClient
      .from('project_participants')
      .select('id, status, participant_type, company_id')
      .eq('id', participantId)
      .maybeSingle();

    if (updatedParticipantError) throw updatedParticipantError;

    expect(updatedParticipant).toMatchObject({
      id: participantId,
      status: 'active',
      participant_type: 'company',
      company_id: invitedCompany.id,
    });
  });

  test('inviteProjectParticipantWithValidation blocks personal invites when sponsorship was lost', async () => {
    const ownerUser = await createAuthUser('sponsor-loss-owner');
    const accessToken = await signIn(ownerUser);
    const ownerCompany = await createCompanyAsUser('Sponsor Loss Owner', accessToken, ownerUser.email);

    await setUserCompanyContext(ownerUser.email, ownerCompany.id);

    const blockedProject = await createCompanyOwnedProject({
      accessToken,
      homeownerEmail: `qa-blocked-homeowner-${createSuffix()}@edilsync.test`,
      namePrefix: 'Blocked Sponsor Project',
    });

    const siblingProjectId = `qa-unsponsored-sibling-${createSuffix()}`;
    const { error: siblingProjectError } = await adminClient
      .from('projects')
      .insert({
        id: siblingProjectId,
        name: `QA Unsponsored Sibling ${createSuffix()}`,
        address: 'Via QA Sibling 3, Brescia',
        description: 'Unsponsored sibling project used to reproduce sponsor-loss pricing.',
        status: 'planning',
        owner_type: 'company',
        owner_company_id: ownerCompany.id,
        owner_user_id: ownerUser.id,
      });

    if (siblingProjectError) throw siblingProjectError;

    registerCleanup(async () => {
      await adminClient.from('projects').delete().eq('id', siblingProjectId);
    });

    const { error: sponsorshipInsertError } = await adminClient
      .from('project_sponsorships')
      .insert({
        project_id: blockedProject.id,
        sponsor_company_id: ownerCompany.id,
        status: 'ended',
        started_at: '2026-04-01T08:00:00.000Z',
        ended_at: '2026-04-10T08:00:00.000Z',
      });

    if (sponsorshipInsertError) throw sponsorshipInsertError;

    const pricingStatus = await adminClient.rpc('resolve_project_pricing_status', {
      target_project_id: blockedProject.id,
    });

    expect(pricingStatus.error).toBeNull();
    expect(pricingStatus.data?.status).toBe('blocked_for_sponsor_loss');
    expect(pricingStatus.data?.can_only_invite_companies).toBe(true);

    const response = await fetch(`${supabaseUrl}/functions/v1/inviteProjectParticipantWithValidation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        project_id: blockedProject.id,
        participant_type: 'personal',
        project_role: 'homeowner',
        user_email: `qa-late-homeowner-${createSuffix()}@edilsync.test`,
      }),
    });

    const payload = await response.json();

    expect(response.status).toBe(403);
    expect(payload.error).toBe('A blocked worksite can invite only companies until sponsorship is restored');
  });

  test('chat-agent retrieves project document context on QA with user-scoped RAG', async () => {
    const user = await createAuthUser('assistant-rag');
    const accessToken = await signIn(user);
    const marker = `marker-assistente-qa-${createSuffix()}`;

    const projectPayload = await invokeFunctionAsUser('createProjectWithContext', accessToken, {
      name: `QA Assistant Project ${createSuffix()}`,
      address: 'Via QA Assistente 18, Bergamo',
      description: 'Remote QA assistant retrieval fixture',
      status: 'planning',
    });

    registerCleanup(async () => {
      await cleanupProjectGraph(projectPayload.project.id);
    });

    const { error: documentInsertError } = await adminClient
      .from('project_documents')
      .insert({
        project_id: projectPayload.project.id,
        name: 'Scheda verifica assistente QA',
        description: `Marker assistente QA retrieval: ${marker}. Documento di prova per il recupero semantico del cantiere.`,
        file_url: `https://example.com/${marker}.pdf`,
        file_type: 'pdf',
        uploaded_by_email: user.email,
        uploaded_by_name: 'QA Assistant',
        category: 'report',
        document_status: 'approved',
        revision_number: 1,
        is_current_revision: true,
      });

    if (documentInsertError) throw documentInsertError;

    const result = await invokeFunctionAsUser('chat-agent', accessToken, {
      context_type: 'project',
      context_id: projectPayload.project.id,
      ui_mode: 'normal',
      stream: false,
      message: 'Quale marker assistente QA retrieval compare nei documenti di questo cantiere? Riporta il marker esatto.',
    });

    expect(result.chat?.id).toBeTruthy();
    expect(result.assistantMessage?.content).toContain(marker);
    expect(Number(result.assistantMessage?.metadata?.rag_matches_count || 0)).toBeGreaterThan(0);
  }, 30000);

  test('chat-agent surfaces project read tools for tasks, schedule, participants and notifications on QA', async () => {
    const ownerUser = await createAuthUser('assistant-read-tools-owner');
    const companyAdminUser = await createAuthUser('assistant-read-tools-company-admin');
    const ownerAccessToken = await signIn(ownerUser);
    const companyAdminAccessToken = await signIn(companyAdminUser);
    const taskTitle = `QA Task Assistant ${createSuffix()}`;
    const eventTitle = `QA Event Assistant ${createSuffix()}`;
    const notificationTitle = `QA Notification Assistant ${createSuffix()}`;

    const participantCompany = await createCompanyAsUser('Assistant Read Tools', companyAdminAccessToken, companyAdminUser.email);

    const projectPayload = await invokeFunctionAsUser('createProjectWithContext', ownerAccessToken, {
      name: `QA Assistant Read Tools Project ${createSuffix()}`,
      address: 'Via QA Assistente Tool 22, Milano',
      description: 'Remote QA assistant read tools fixture',
      status: 'planning',
    });

    registerCleanup(async () => {
      await cleanupProjectGraph(projectPayload.project.id);
    });

    const { error: participantInsertError } = await adminClient
      .from('project_participants')
      .insert({
        project_id: projectPayload.project.id,
        participant_type: 'company',
        company_id: participantCompany.id,
        user_email: companyAdminUser.email,
        project_role: 'contractor',
        status: 'active',
        can_invite: true,
      });

    if (participantInsertError) throw participantInsertError;

    const { error: taskInsertError } = await adminClient
      .from('tasks')
      .insert({
        project_id: projectPayload.project.id,
        title: taskTitle,
        description: 'Task fixture for assistant read tools QA coverage.',
        status: 'in_progress',
        due_date: '2026-05-10',
        room_area: 'Cucina',
        assigned_company_id: participantCompany.id,
        assigned_company_name: participantCompany.name,
        assigned_participant_type: 'company',
      });

    if (taskInsertError) throw taskInsertError;

    const { data: insertedEvent, error: eventInsertError } = await adminClient
      .from('events')
      .insert({
        title: eventTitle,
        description: 'Event fixture for assistant read tools QA coverage.',
        location: 'Cantiere Milano',
        start_datetime: '2026-05-08T08:30:00.000Z',
        end_datetime: '2026-05-08T09:30:00.000Z',
        owner_type: 'project',
        owner_project_id: projectPayload.project.id,
        status: 'scheduled',
        creator_email: ownerUser.email,
        creator_name: 'QA Assistant Owner',
      })
      .select('id')
      .single();

    if (eventInsertError) throw eventInsertError;

    registerCleanup(async () => {
      await adminClient.from('event_participants').delete().eq('event_id', insertedEvent.id);
      await adminClient.from('events').delete().eq('id', insertedEvent.id);
    });

    const { error: notificationInsertError } = await adminClient
      .from('notifications')
      .insert({
        user_email: ownerUser.email,
        context_type: 'personal',
        type: 'project_sponsorship_activated',
        title: notificationTitle,
        message: 'Notification fixture for assistant read tools QA coverage.',
        related_event_id: projectPayload.project.id,
        is_read: false,
      });

    if (notificationInsertError) throw notificationInsertError;

    registerCleanup(async () => {
      await adminClient.from('notifications').delete().eq('user_email', ownerUser.email).eq('title', notificationTitle);
    });

    const result = await invokeFunctionAsUser('chat-agent', ownerAccessToken, {
      context_type: 'project',
      context_id: projectPayload.project.id,
      ui_mode: 'normal',
      stream: false,
      message: 'Elenca task aperti, prossimi eventi, partecipanti e notifiche rilevanti di questo cantiere. Riporta i nomi esatti.',
    });

    const toolCallNames = (result.assistantMessage?.tool_calls || []).map((toolCall) => toolCall.name);

    expect(toolCallNames).toContain('list_context_tasks');
    expect(toolCallNames).toContain('list_context_schedule');
    expect(toolCallNames).toContain('list_context_participants');
    expect(toolCallNames).toContain('list_context_notifications');

    const parsedToolResults = Object.fromEntries((result.assistantMessage?.tool_calls || []).map((toolCall) => [
      toolCall.name,
      JSON.parse(toolCall.results),
    ]));

    expect(parsedToolResults.list_context_tasks?.tasks?.some((task) => task.title === taskTitle)).toBe(true);
    expect(parsedToolResults.list_context_schedule?.schedule?.some((item) => item.title === eventTitle)).toBe(true);
    expect(parsedToolResults.list_context_participants?.participants?.some((participant) => participant.name === participantCompany.name)).toBe(true);
    expect(parsedToolResults.list_context_notifications?.notifications?.some((notification) => notification.title === notificationTitle)).toBe(true);
  }, 30000);

  test('chat-agent surfaces current context state and effective capabilities on QA', async () => {
    const user = await createAuthUser('assistant-context-capabilities');
    const accessToken = await signIn(user);

    const projectPayload = await invokeFunctionAsUser('createProjectWithContext', accessToken, {
      name: `QA Assistant Context Project ${createSuffix()}`,
      address: 'Via QA Assistente Contesto 31, Torino',
      description: 'Remote QA assistant context and capability fixture',
      status: 'planning',
    });

    registerCleanup(async () => {
      await cleanupProjectGraph(projectPayload.project.id);
    });

    const result = await invokeFunctionAsUser('chat-agent', accessToken, {
      context_type: 'project',
      context_id: projectPayload.project.id,
      ui_mode: 'operational',
      route_path: `/app/operativa/progetto/${projectPayload.project.id}`,
      route_search: '?tab=lavori&section=tasks',
      stream: false,
      message: 'Dimmi in che contesto stai rispondendo adesso, che pagina ho aperta e quali funzioni sono disponibili, limitate o bloccate qui.',
    });

    const toolCallNames = (result.assistantMessage?.tool_calls || []).map((toolCall) => toolCall.name);

    expect(toolCallNames).toContain('get_current_context_state');
    expect(toolCallNames).toContain('get_context_capabilities');

    const parsedToolResults = Object.fromEntries((result.assistantMessage?.tool_calls || []).map((toolCall) => [
      toolCall.name,
      JSON.parse(toolCall.results),
    ]));

    expect(parsedToolResults.get_current_context_state?.context_type).toBe('personal');
    expect(parsedToolResults.get_current_context_state?.focus_context_type).toBe('project');
    expect(parsedToolResults.get_current_context_state?.focus_context?.name).toBe(projectPayload.project.name);
    expect(parsedToolResults.get_current_context_state?.ui_mode).toBe('operational');
    expect(parsedToolResults.get_current_context_state?.route?.page_key).toBe('operative_project_workspace');
    expect(parsedToolResults.get_current_context_state?.route?.tab).toBe('lavori');
    expect(parsedToolResults.get_current_context_state?.route?.section).toBe('tasks');

    const capabilities = parsedToolResults.get_context_capabilities?.capabilities || [];
    expect(capabilities.some((capability) => capability.feature_key === 'project_tasks' && capability.access_level === 'enabled')).toBe(true);
    expect(capabilities.some((capability) => capability.feature_key === 'project_documents' && capability.access_level === 'limited')).toBe(true);
    expect(capabilities.some((capability) => capability.feature_key === 'project_finance' && capability.access_level === 'disabled')).toBe(true);
  }, 30000);

  test('chat-agent explains why project finance is blocked on a free unsponsored worksite on QA', async () => {
    const user = await createAuthUser('assistant-feature-availability');
    const accessToken = await signIn(user);

    const projectPayload = await invokeFunctionAsUser('createProjectWithContext', accessToken, {
      name: `QA Assistant Availability Project ${createSuffix()}`,
      address: 'Via QA Assistente Availability 17, Bologna',
      description: 'Remote QA assistant feature availability fixture',
      status: 'planning',
    });

    registerCleanup(async () => {
      await cleanupProjectGraph(projectPayload.project.id);
    });

    const result = await invokeFunctionAsUser('chat-agent', accessToken, {
      context_type: 'project',
      context_id: projectPayload.project.id,
      ui_mode: 'normal',
      route_path: '/app/ProjectDetail',
      route_search: `?id=${projectPayload.project.id}&tab=economia`,
      stream: false,
      message: 'Perche non posso vedere la finanza di questo cantiere?',
    });

    const toolCallNames = (result.assistantMessage?.tool_calls || []).map((toolCall) => toolCall.name);

    expect(toolCallNames).toContain('explain_feature_availability');

    const explainToolResult = JSON.parse((result.assistantMessage?.tool_calls || []).find((toolCall) => toolCall.name === 'explain_feature_availability')?.results || '{}');

    expect(explainToolResult.feature_key).toBe('project_finance');
    expect(explainToolResult.access_level).toBe('disabled');
    expect(explainToolResult.reason_code).toBe('plan_disabled');
    expect(explainToolResult.plan_code).toBe('free');
    expect(explainToolResult.pricing?.status).toBe('unsponsored');
  }, 30000);

  test('chat-agent surfaces today deadlines, blocked tasks and task detail on QA', async () => {
    const user = await createAuthUser('assistant-task-detail');
    const accessToken = await signIn(user);
    const todayIsoDate = new Date().toISOString().slice(0, 10);
    const todayTaskTitle = `QA Oggi Task ${createSuffix()}`;
    const blockedTaskTitle = `QA Bloccata Task ${createSuffix()}`;

    const projectPayload = await invokeFunctionAsUser('createProjectWithContext', accessToken, {
      name: `QA Assistant Task Detail Project ${createSuffix()}`,
      address: 'Via QA Assistente Task 41, Genova',
      description: 'Remote QA assistant task-detail fixture',
      status: 'planning',
    });

    registerCleanup(async () => {
      await cleanupProjectGraph(projectPayload.project.id);
    });

    const { error: todayTaskInsertError } = await adminClient
      .from('tasks')
      .insert({
        project_id: projectPayload.project.id,
        title: todayTaskTitle,
        description: 'Task in scadenza oggi per il test assistant.',
        status: 'not_started',
        due_date: todayIsoDate,
        assigned_user_email: user.email,
        assigned_user_name: user.email,
        room_area: 'Piano terra',
      });

    if (todayTaskInsertError) throw todayTaskInsertError;

    const { error: blockedTaskInsertError } = await adminClient
      .from('tasks')
      .insert({
        project_id: projectPayload.project.id,
        title: blockedTaskTitle,
        description: 'Task bloccata per verificare dettaglio e lista blocchi dell assistente.',
        status: 'blocked',
        due_date: '2026-05-03',
        assigned_user_email: user.email,
        assigned_user_name: user.email,
        blocked_reason: 'In attesa del rilievo strutturale',
        blocked_by_name: 'Direzione lavori',
        blocked_date: '2026-04-20T08:30:00.000Z',
        room_area: 'Copertura',
      });

    if (blockedTaskInsertError) throw blockedTaskInsertError;

    const result = await invokeFunctionAsUser('chat-agent', accessToken, {
      context_type: 'project',
      context_id: projectPayload.project.id,
      ui_mode: 'normal',
      route_path: '/app/ProjectDetail',
      route_search: `?id=${projectPayload.project.id}&tab=lavori&section=tasks`,
      stream: false,
      message: `Quali attivita scadono oggi? Elenca anche le task bloccate e dammi il dettaglio della task ${blockedTaskTitle}.`,
    });

    const toolCallNames = (result.assistantMessage?.tool_calls || []).map((toolCall) => toolCall.name);

    expect(toolCallNames).toContain('get_today_deadlines');
    expect(toolCallNames).toContain('list_blocked_tasks');
    expect(toolCallNames).toContain('get_task_detail');

    const parsedToolResults = Object.fromEntries((result.assistantMessage?.tool_calls || []).map((toolCall) => [
      toolCall.name,
      JSON.parse(toolCall.results),
    ]));

    expect(parsedToolResults.get_today_deadlines?.deadlines?.some((task) => task.title === todayTaskTitle && task.deadline_type === 'due_today')).toBe(true);
    expect(parsedToolResults.list_blocked_tasks?.tasks?.some((task) => task.title === blockedTaskTitle && task.blocked_reason.includes('rilievo strutturale'))).toBe(true);
    expect(parsedToolResults.get_task_detail?.task?.title).toBe(blockedTaskTitle);
    expect(parsedToolResults.get_task_detail?.task?.block?.is_blocked).toBe(true);
    expect(parsedToolResults.get_task_detail?.task?.block?.blocked_by).toBe('Direzione lavori');
  }, 30000);

  test('chat-agent surfaces milestones and change request details on QA', async () => {
    const user = await createAuthUser('assistant-milestones-changes');
    const accessToken = await signIn(user);
    const milestoneTitle = `QA Milestone Assistente ${createSuffix()}`;
    const linkedTaskTitle = `QA Task Milestone ${createSuffix()}`;
    const changeRequestTitle = `QA Variante Assistente ${createSuffix()}`;

    const company = await createCompanyAsUser('Assistant Milestone', accessToken, user.email);
    await setCompanyPaidSubscription(company.id);
    await setUserCompanyContext(user.email, company.id);

    const projectPayload = {
      project: await createCompanyOwnedProject({
        accessToken,
        homeownerEmail: `qa-milestone-homeowner-${createSuffix()}@edilsync.test`,
        namePrefix: 'Assistant Milestone Project',
      }),
    };

    const { data: milestoneRecord, error: milestoneInsertError } = await adminClient
      .from('milestones')
      .insert({
        project_id: projectPayload.project.id,
        title: milestoneTitle,
        description: 'Milestone usata per testare elenco e dettaglio assistant.',
        start_date: '2026-05-01',
        target_date: '2026-05-20',
        status: 'in_progress',
        order_index: 1,
      })
      .select('id,title')
      .single();

    if (milestoneInsertError) throw milestoneInsertError;

    const { error: linkedTaskInsertError } = await adminClient
      .from('tasks')
      .insert({
        project_id: projectPayload.project.id,
        milestone_id: milestoneRecord.id,
        title: linkedTaskTitle,
        description: 'Task collegata alla milestone per il test assistant.',
        status: 'in_progress',
        due_date: '2026-05-19',
        assigned_user_email: user.email,
        assigned_user_name: user.email,
      });

    if (linkedTaskInsertError) throw linkedTaskInsertError;

    const changeRequestId = randomUUID();
    const { error: changeRequestInsertError } = await adminClient
      .from('change_requests')
      .insert({
        id: changeRequestId,
        project_id: projectPayload.project.id,
        title: changeRequestTitle,
        description: 'Variante usata per testare elenco e dettaglio assistant.',
        status: 'approved',
        cost_impact: 1250,
        time_impact_days: 4,
        assigned_user_email: user.email,
        assigned_user_name: user.email,
        requested_by_email: user.email,
        requested_by_name: user.email,
        response_note: 'Approvata con aggiornamento del cronoprogramma.',
        responded_at: '2026-05-02T09:00:00.000Z',
      });

    if (changeRequestInsertError) throw changeRequestInsertError;

    registerCleanup(async () => {
      await adminClient.from('tasks').delete().eq('project_id', projectPayload.project.id).eq('milestone_id', milestoneRecord.id);
      await adminClient.from('change_requests').delete().eq('id', changeRequestId);
      await adminClient.from('milestones').delete().eq('id', milestoneRecord.id);
    });

    const result = await invokeFunctionAsUser('chat-agent', accessToken, {
      context_type: 'project',
      context_id: projectPayload.project.id,
      ui_mode: 'normal',
      route_path: '/app/ProjectDetail',
      route_search: `?id=${projectPayload.project.id}&tab=lavori&section=milestones`,
      stream: false,
      message: `Elenca le milestone di questo cantiere, dammi il dettaglio della milestone ${milestoneTitle}, poi elenca le richieste di modifica e dammi il dettaglio della variante ${changeRequestTitle}.`,
    });

    const toolCallNames = (result.assistantMessage?.tool_calls || []).map((toolCall) => toolCall.name);

    expect(toolCallNames).toContain('list_context_milestones');
    expect(toolCallNames).toContain('get_milestone_detail');
    expect(toolCallNames).toContain('list_context_change_requests');
    expect(toolCallNames).toContain('get_change_request_detail');

    const parsedToolResults = Object.fromEntries((result.assistantMessage?.tool_calls || []).map((toolCall) => [
      toolCall.name,
      JSON.parse(toolCall.results),
    ]));

    expect(parsedToolResults.list_context_milestones?.milestones?.some((milestone) => milestone.title === milestoneTitle && milestone.linked_tasks_count === 1)).toBe(true);
    expect(parsedToolResults.get_milestone_detail?.milestone?.title).toBe(milestoneTitle);
    expect(parsedToolResults.get_milestone_detail?.milestone?.linked_tasks?.some((task) => task.title === linkedTaskTitle)).toBe(true);
    expect(parsedToolResults.list_context_change_requests?.change_requests?.some((request) => request.title === changeRequestTitle && request.cost_impact === 1250)).toBe(true);
    expect(parsedToolResults.get_change_request_detail?.change_request?.title).toBe(changeRequestTitle);
    expect(parsedToolResults.get_change_request_detail?.change_request?.response_note).toContain('cronoprogramma');
  }, 30000);

  test('chat-agent surfaces disputes, event detail and operational day brief on QA', async () => {
    const user = await createAuthUser('assistant-disputes-events');
    const accessToken = await signIn(user);
    const todayIsoDate = new Date().toISOString().slice(0, 10);
    const todayTaskTitle = `QA Brief Oggi ${createSuffix()}`;
    const blockedTaskTitle = `QA Brief Bloccata ${createSuffix()}`;
    const disputeTitle = `QA Disputa Assistente ${createSuffix()}`;
    const eventTitle = `QA Evento Assistente ${createSuffix()}`;
    const conflictEventTitle = `QA Evento Conflitto ${createSuffix()}`;

    const projectPayload = await invokeFunctionAsUser('createProjectWithContext', accessToken, {
      name: `QA Assistant Dispute Project ${createSuffix()}`,
      address: 'Via QA Assistente Dispute 4, Torino',
      description: 'Remote QA assistant dispute, event and day-brief fixture',
      status: 'planning',
    });

    registerCleanup(async () => {
      await cleanupProjectGraph(projectPayload.project.id);
    });

    const { data: ownerParticipant, error: ownerParticipantError } = await adminClient
      .from('project_participants')
      .select('id')
      .eq('project_id', projectPayload.project.id)
      .eq('user_email', user.email)
      .maybeSingle();

    if (ownerParticipantError) throw ownerParticipantError;
    if (!ownerParticipant?.id) throw new Error('Missing owner participant for dispute fixture');

    const { error: todayTaskInsertError } = await adminClient
      .from('tasks')
      .insert({
        project_id: projectPayload.project.id,
        title: todayTaskTitle,
        description: 'Task di oggi per verificare il brief operativo assistant.',
        status: 'in_progress',
        due_date: todayIsoDate,
        assigned_user_email: user.email,
        assigned_user_name: user.email,
      });

    if (todayTaskInsertError) throw todayTaskInsertError;

    const { data: blockedTask, error: blockedTaskInsertError } = await adminClient
      .from('tasks')
      .insert({
        project_id: projectPayload.project.id,
        title: blockedTaskTitle,
        description: 'Task bloccata per verificare dispute e brief assistant.',
        status: 'blocked',
        due_date: todayIsoDate,
        assigned_user_email: user.email,
        assigned_user_name: user.email,
        blocked_reason: 'In attesa conferma fornitore',
        blocked_by_name: 'Capocantiere QA',
        blocked_date: `${todayIsoDate}T08:15:00.000Z`,
      })
      .select('id,title')
      .single();

    if (blockedTaskInsertError) throw blockedTaskInsertError;

    const { data: conflictEvent, error: conflictEventInsertError } = await adminClient
      .from('events')
      .insert({
        title: conflictEventTitle,
        description: 'Evento confliggente per verificare il dettaglio evento assistant.',
        location: 'Sala riunioni QA',
        start_datetime: `${todayIsoDate}T08:30:00.000Z`,
        end_datetime: `${todayIsoDate}T09:00:00.000Z`,
        owner_type: 'project',
        owner_project_id: projectPayload.project.id,
        status: 'scheduled',
        creator_email: user.email,
        creator_name: user.email,
      })
      .select('id,title')
      .single();

    if (conflictEventInsertError) throw conflictEventInsertError;

    const { data: primaryEvent, error: primaryEventInsertError } = await adminClient
      .from('events')
      .insert({
        title: eventTitle,
        description: 'Evento principale per verificare dettaglio e brief assistant.',
        location: 'Cantiere Torino',
        start_datetime: `${todayIsoDate}T10:00:00.000Z`,
        end_datetime: `${todayIsoDate}T11:00:00.000Z`,
        owner_type: 'project',
        owner_project_id: projectPayload.project.id,
        status: 'scheduled',
        creator_email: user.email,
        creator_name: user.email,
      })
      .select('id,title')
      .single();

    if (primaryEventInsertError) throw primaryEventInsertError;

    const { error: participantInsertError } = await adminClient
      .from('event_participants')
      .insert({
        event_id: primaryEvent.id,
        participant_type: 'user',
        user_id: user.id,
        user_email: user.email,
        status: 'pending',
        has_conflict: true,
        conflict_event_id: conflictEvent.id,
      });

    if (participantInsertError) throw participantInsertError;

    const { data: disputeRecord, error: disputeInsertError } = await adminClient
      .from('dispute_cases')
      .insert({
        project_id: projectPayload.project.id,
        task_id: blockedTask.id,
        opened_by_participant_id: ownerParticipant.id,
        category: 'delay',
        status: 'open',
        title: disputeTitle,
        summary: 'Disputa aperta per ritardo fornitore e impatto sulla programmazione.',
        amount_impact: 900,
        time_impact_days: 2,
      })
      .select('id,title')
      .single();

    if (disputeInsertError) throw disputeInsertError;

    const { error: disputeEventInsertError } = await adminClient
      .from('dispute_events')
      .insert([
        {
          dispute_case_id: disputeRecord.id,
          project_id: projectPayload.project.id,
          actor_participant_id: ownerParticipant.id,
          event_type: 'opened',
          note: 'Apertura disputa dal test assistant QA.',
        },
        {
          dispute_case_id: disputeRecord.id,
          project_id: projectPayload.project.id,
          actor_participant_id: ownerParticipant.id,
          event_type: 'commented',
          note: 'Serve una risposta entro fine giornata.',
        },
      ]);

    if (disputeEventInsertError) throw disputeEventInsertError;

    const { error: disputeEvidenceInsertError } = await adminClient
      .from('dispute_evidence_items')
      .insert({
        dispute_case_id: disputeRecord.id,
        project_id: projectPayload.project.id,
        source_type: 'task',
        source_id: blockedTask.id,
        snapshot: {
          title: blockedTaskTitle,
          status: 'blocked',
          blocked_reason: 'In attesa conferma fornitore',
        },
        note: 'Evidenza generata dalla task bloccata.',
      });

    if (disputeEvidenceInsertError) throw disputeEvidenceInsertError;

    registerCleanup(async () => {
      await adminClient.from('dispute_evidence_items').delete().eq('dispute_case_id', disputeRecord.id);
      await adminClient.from('dispute_events').delete().eq('dispute_case_id', disputeRecord.id);
      await adminClient.from('dispute_cases').delete().eq('id', disputeRecord.id);
      await adminClient.from('event_participants').delete().in('event_id', [primaryEvent.id, conflictEvent.id]);
      await adminClient.from('events').delete().in('id', [primaryEvent.id, conflictEvent.id]);
    });

    const result = await invokeFunctionAsUser('chat-agent', accessToken, {
      context_type: 'project',
      context_id: projectPayload.project.id,
      ui_mode: 'normal',
      route_path: '/app/ProjectDetail',
      route_search: `?id=${projectPayload.project.id}&tab=lavori&section=disputes`,
      stream: false,
      message: `Elenca le dispute di questo cantiere, dammi il dettaglio della disputa ${disputeTitle}, poi dammi il dettaglio dell evento ${eventTitle} e fammi un brief operativo di oggi.`,
    });

    const toolCallNames = (result.assistantMessage?.tool_calls || []).map((toolCall) => toolCall.name);

    expect(toolCallNames).toContain('list_context_disputes');
    expect(toolCallNames).toContain('get_dispute_detail');
    expect(toolCallNames).toContain('get_event_detail');
    expect(toolCallNames).toContain('get_operational_day_brief');

    const parsedToolResults = Object.fromEntries((result.assistantMessage?.tool_calls || []).map((toolCall) => [
      toolCall.name,
      JSON.parse(toolCall.results),
    ]));

    expect(parsedToolResults.list_context_disputes?.disputes?.some((dispute) => dispute.title === disputeTitle && dispute.path?.includes(`itemId=dispute-${disputeRecord.id}`))).toBe(true);
    expect(parsedToolResults.get_dispute_detail?.dispute?.title).toBe(disputeTitle);
    expect(parsedToolResults.get_dispute_detail?.dispute?.related_task?.title).toBe(blockedTaskTitle);
    expect(parsedToolResults.get_dispute_detail?.dispute?.timeline?.some((entry) => entry.event_type === 'commented')).toBe(true);
    expect(parsedToolResults.get_dispute_detail?.dispute?.evidence_items?.some((entry) => entry.source_type === 'task')).toBe(true);
    expect(parsedToolResults.get_dispute_detail?.dispute?.navigation?.path).toBe(`/app/ProjectDetail?id=${projectPayload.project.id}&tab=lavori&section=disputes&itemId=dispute-${disputeRecord.id}`);

    expect(parsedToolResults.get_event_detail?.event?.title).toBe(eventTitle);
    expect(parsedToolResults.get_event_detail?.event?.counts?.participants).toBeGreaterThanOrEqual(1);
    expect(parsedToolResults.get_event_detail?.event?.participants?.some((participant) => participant.conflict_event?.title === conflictEventTitle)).toBe(true);
    expect(parsedToolResults.get_event_detail?.event?.navigation?.path).toBe(`/app/ProjectDetail?id=${projectPayload.project.id}`);

    expect(parsedToolResults.get_operational_day_brief?.summary?.tasks_due_today).toBeGreaterThanOrEqual(1);
    expect(parsedToolResults.get_operational_day_brief?.summary?.blocked_tasks).toBeGreaterThanOrEqual(1);
    expect(parsedToolResults.get_operational_day_brief?.summary?.events_today).toBeGreaterThanOrEqual(1);
    expect(parsedToolResults.get_operational_day_brief?.summary?.open_disputes).toBeGreaterThanOrEqual(1);
    expect(parsedToolResults.get_operational_day_brief?.tasks_due_today?.some((task) => task.title === todayTaskTitle)).toBe(true);
  }, 30000);

  test('chat-agent searches context entities and returns navigation help on QA', async () => {
    const user = await createAuthUser('assistant-navigation-search');
    const accessToken = await signIn(user);
    const documentMarker = `QA Documento Ricerca ${createSuffix()}`;

    const projectPayload = await invokeFunctionAsUser('createProjectWithContext', accessToken, {
      name: `QA Assistant Navigation Project ${createSuffix()}`,
      address: 'Via QA Assistente Navigazione 9, Padova',
      description: 'Remote QA assistant navigation and search fixture',
      status: 'planning',
    });

    registerCleanup(async () => {
      await cleanupProjectGraph(projectPayload.project.id);
    });

    const { error: documentInsertError } = await adminClient
      .from('project_documents')
      .insert({
        project_id: projectPayload.project.id,
        name: documentMarker,
        description: 'Documento usato per verificare la ricerca nel contesto del cantiere.',
        file_url: `https://example.com/${createSuffix()}.pdf`,
        file_type: 'pdf',
        uploaded_by_email: user.email,
        uploaded_by_name: 'QA Assistant Search',
        category: 'report',
        document_status: 'in_review',
        revision_number: 1,
        is_current_revision: true,
      });

    if (documentInsertError) throw documentInsertError;

    const result = await invokeFunctionAsUser('chat-agent', accessToken, {
      context_type: 'project',
      context_id: projectPayload.project.id,
      ui_mode: 'normal',
      route_path: '/app/ProjectDetail',
      route_search: `?id=${projectPayload.project.id}&tab=info&section=documents`,
      stream: false,
      message: `Cerca ${documentMarker} nel contesto e dimmi dove trovo i documenti di questo cantiere.`,
    });

    const toolCallNames = (result.assistantMessage?.tool_calls || []).map((toolCall) => toolCall.name);

    expect(toolCallNames).toContain('search_context_entities');
    expect(toolCallNames).toContain('get_navigation_help');

    const parsedToolResults = Object.fromEntries((result.assistantMessage?.tool_calls || []).map((toolCall) => [
      toolCall.name,
      JSON.parse(toolCall.results),
    ]));

    expect(parsedToolResults.search_context_entities?.results?.some((entry) => entry.entity_type === 'document' && entry.title === documentMarker)).toBe(true);
    expect(parsedToolResults.get_navigation_help?.topic_key).toBe('project_documents');
    expect(parsedToolResults.get_navigation_help?.navigation?.path).toBe(`/app/ProjectDetail?id=${projectPayload.project.id}&tab=info&section=documents`);
  }, 30000);

  test('chat-agent surfaces pending invites, memberships and pending decisions on QA', async () => {
    const user = await createAuthUser('assistant-pending-context');
    const ownerUser = await createAuthUser('assistant-pending-owner');
    const accessToken = await signIn(user);
    const ownerAccessToken = await signIn(ownerUser);

    const company = await createCompanyAsUser('Assistant Pending', accessToken, user.email);
    await setUserCompanyContext(user.email, company.id);

    const projectPayload = await invokeFunctionAsUser('createProjectWithContext', ownerAccessToken, {
      name: `QA Pending Decision Project ${createSuffix()}`,
      address: 'Via QA Pending 14, Firenze',
      description: 'Remote QA pending assistant fixture',
      status: 'planning',
    });

    registerCleanup(async () => {
      await cleanupProjectGraph(projectPayload.project.id);
    });

    const invitedMemberEmail = `qa-company-invite-${createSuffix()}@edilsync.test`;
    const { error: invitedMemberInsertError } = await adminClient
      .from('company_members')
      .insert({
        company_id: company.id,
        user_email: invitedMemberEmail,
        role: 'member',
        profession: 'technical_office',
        company_member_role: 'technical_office',
        status: 'invited',
      });

    if (invitedMemberInsertError) throw invitedMemberInsertError;

    registerCleanup(async () => {
      await adminClient.from('company_members').delete().eq('company_id', company.id).eq('user_email', invitedMemberEmail);
    });

    const { error: participantInsertError } = await adminClient
      .from('project_participants')
      .insert({
        project_id: projectPayload.project.id,
        participant_type: 'company',
        company_id: company.id,
        user_email: user.email,
        project_role: 'contractor',
        status: 'invited',
        can_invite: false,
      });

    if (participantInsertError) throw participantInsertError;

    const changeRequestId = randomUUID();
    const { error: changeInsertError } = await adminClient
      .from('change_requests')
      .insert({
        id: changeRequestId,
        project_id: projectPayload.project.id,
        title: `QA Pending Change ${createSuffix()}`,
        description: 'Variante da gestire nel test QA dell assistente.',
        status: 'pending',
        assigned_participant_type: 'company',
        assigned_company_id: company.id,
        assigned_company_name: company.name,
      });

    if (changeInsertError) throw changeInsertError;

    registerCleanup(async () => {
      await adminClient.from('change_requests').delete().eq('id', changeRequestId);
    });

    const { data: pendingEvent, error: eventInsertError } = await adminClient
      .from('events')
      .insert({
        title: `QA Pending Event ${createSuffix()}`,
        description: 'Evento societa in attesa di conferma per il test assistant.',
        location: 'Sede QA Firenze',
        start_datetime: '2026-06-02T09:00:00.000Z',
        end_datetime: '2026-06-02T10:00:00.000Z',
        owner_type: 'company',
        owner_company_id: company.id,
        status: 'pending_confirmation',
        creator_email: user.email,
        creator_name: 'QA Pending Company',
      })
      .select('id,title')
      .single();

    if (eventInsertError) throw eventInsertError;

    registerCleanup(async () => {
      await adminClient.from('events').delete().eq('id', pendingEvent.id);
    });

    const result = await invokeFunctionAsUser('chat-agent', accessToken, {
      context_type: 'company',
      context_id: company.id,
      ui_mode: 'normal',
      route_path: '/app/CompanyDetail',
      route_search: `?id=${company.id}`,
      stream: false,
      message: 'Mostrami inviti aperti, le mie membership e le decisioni in sospeso che richiedono attenzione in questa societa.',
    });

    const toolCallNames = (result.assistantMessage?.tool_calls || []).map((toolCall) => toolCall.name);

    expect(toolCallNames).toContain('list_pending_invites');
    expect(toolCallNames).toContain('list_my_memberships');
    expect(toolCallNames).toContain('list_pending_decisions');

    const parsedToolResults = Object.fromEntries((result.assistantMessage?.tool_calls || []).map((toolCall) => [
      toolCall.name,
      JSON.parse(toolCall.results),
    ]));

    expect(parsedToolResults.list_pending_invites?.invites?.some((invite) => invite.invite_type === 'project_invite' && invite.title.includes(projectPayload.project.name))).toBe(true);
    expect(parsedToolResults.list_pending_invites?.invites?.some((invite) => invite.invite_type === 'company_membership' && invite.title.includes(company.name))).toBe(true);
    expect(parsedToolResults.list_my_memberships?.memberships?.some((membership) => membership.membership_type === 'company_membership' && membership.name === company.name && membership.status === 'active')).toBe(true);

    const decisions = parsedToolResults.list_pending_decisions?.decisions || [];
    expect(decisions.some((decision) => decision.decision_type === 'invite_response')).toBe(true);
    expect(decisions.some((decision) => decision.decision_type === 'change_request')).toBe(true);
    expect(decisions.some((decision) => decision.decision_type === 'event_confirmation' && decision.title === pendingEvent.title)).toBe(true);
  }, 30000);

  test('notifyTaskBlockedResponsible creates company-context notifications for the blocking company admins', async () => {
    const ownerUser = await createAuthUser('task-owner');
    const blockingAdmin = await createAuthUser('task-blocking-admin');
    const ownerAccessToken = await signIn(ownerUser);
    const blockingAccessToken = await signIn(blockingAdmin);

    const ownerCompany = await createCompanyAsUser('Task Owner', ownerAccessToken, ownerUser.email);
    const blockingCompany = await createCompanyAsUser('Task Blocking', blockingAccessToken, blockingAdmin.email);

    await setUserCompanyContext(ownerUser.email, ownerCompany.id);
    await setUserCompanyContext(blockingAdmin.email, blockingCompany.id);

    const project = await createCompanyOwnedProject({
      accessToken: ownerAccessToken,
      homeownerEmail: `qa-task-homeowner-${createSuffix()}@edilsync.test`,
      namePrefix: 'Task Notification Project',
    });

    const { error: participantInsertError } = await adminClient
      .from('project_participants')
      .insert({
        project_id: project.id,
        participant_type: 'company',
        project_role: 'subcontractor',
        company_id: blockingCompany.id,
        status: 'active',
        can_invite: false,
        invited_by_company_id: ownerCompany.id,
      });

    if (participantInsertError) throw participantInsertError;

    const result = await invokeFunctionAsUser('notifyTaskBlockedResponsible', ownerAccessToken, {
      project_id: project.id,
      blocked_by_type: 'company',
      blocked_by_company_id: blockingCompany.id,
      title: 'Task blocked on site',
      message: 'The plumbing task is waiting on the subcontractor decision.',
      email_subject: 'Task blocked',
      email_body: 'The plumbing task is waiting on the subcontractor decision.',
    });

    expect(result.success).toBe(true);
    expect(result.recipient_count).toBe(1);
    expect(result.delivered_count).toBeGreaterThanOrEqual(0);
    expect(result.delivered_count).toBeLessThanOrEqual(result.recipient_count);
  }, 15000);
});