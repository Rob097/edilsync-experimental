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
  });
});