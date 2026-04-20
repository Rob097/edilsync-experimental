import { expect } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import { appendFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { assertQaSupabaseUrl } from '../../helpers/qa-target.js';

const requiredEnvNames = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY'];

export const hasRemoteQaEnv = requiredEnvNames.every((envName) => Boolean(process.env[envName]));

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (supabaseUrl) {
  assertQaSupabaseUrl(supabaseUrl, 'SUPABASE_URL');
}
const authStorageKey = supabaseUrl ? `sb-${new URL(supabaseUrl).host.split('.')[0]}-auth-token` : '';
const isRemoteQaRun = process.env.EDILSYNC_REMOTE_QA === '1';
const authenticatedShellTimeoutMs = Number(
  process.env.PLAYWRIGHT_AUTHENTICATED_SHELL_TIMEOUT || (isRemoteQaRun ? '45000' : '15000'),
);

const adminClient = hasRemoteQaEnv
  ? createClient(supabaseUrl, supabaseServiceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } })
  : null;

const createSuffix = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const defaultTourState = {
  onboarding_completed: true,
  onboarding_dismissed: true,
  projects_completed: true,
  projects_dismissed: true,
  companies_completed: true,
  companies_dismissed: true,
};

function recordTestActivity(type: string, payload: Record<string, unknown>) {
  const activityFile = process.env.EDILSYNC_TEST_ACTIVITY_FILE;
  if (!activityFile) return;

  mkdirSync(dirname(activityFile), { recursive: true });
  appendFileSync(activityFile, `${JSON.stringify({
    timestamp: new Date().toISOString(),
    type,
    ...payload,
  })}\n`);
}

export async function signInForAccessToken(email: string, password: string) {
  const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await anonClient.auth.signInWithPassword({ email, password });
  if (error) throw error;
  if (!data.session?.access_token) {
    throw new Error('Missing access token after QA sign-in.');
  }

  return data.session.access_token;
}

export async function invokeFunctionAsUser(functionName: string, accessToken: string, payload?: Record<string, unknown>) {
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
}

export async function createConfirmedQaUser(label: string) {
  if (!adminClient) {
    throw new Error('Missing SUPABASE_URL, SUPABASE_ANON_KEY, or SUPABASE_SERVICE_ROLE_KEY for QA E2E tests.');
  }

  const suffix = createSuffix();
  const email = `qa-e2e-${label}-${suffix}@edilsync.test`;
  const password = `EdilSync!${suffix}Aa`;
  const fullName = `QA E2E ${label}`;
  const { data, error } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      display_name: fullName,
    },
  });

  if (error) throw error;

  const { error: profileError } = await adminClient.from('users').insert({
    auth_user_id: data.user.id,
    email,
    full_name: fullName,
    display_name: fullName,
    role: 'normal',
    company_ids: [],
    admin_company_ids: [],
    project_ids: [],
    active_context: 'personal',
    active_company_id: null,
    tour_state: defaultTourState,
    created_by: email,
  });

  if (profileError) {
    await adminClient.auth.admin.deleteUser(data.user.id);
    throw profileError;
  }

  recordTestActivity('user.created', {
    label,
    email,
    userId: data.user.id,
  });

  return {
    id: data.user.id,
    email,
    password,
  };
}

export async function createCompanyViaApi({
  accessToken,
  label,
  email,
}: {
  accessToken: string;
  label: string;
  email: string;
}) {
  const result = await invokeFunctionAsUser('createCompanyWithInitialization', accessToken, {
    name: `QA ${label} Company ${createSuffix()}`,
    company_type: 'general_contractor',
    address: `Via QA ${label} 1, Milano`,
    email,
  });

  recordTestActivity('company.created', {
    label,
    companyId: result.company.id,
    companyName: result.company.name,
    ownerEmail: email,
  });

  return result.company;
}

export async function createProjectViaApi({
  accessToken,
  label,
  myRole = 'homeowner',
  homeownerEmail = null,
}: {
  accessToken: string;
  label: string;
  myRole?: 'homeowner' | 'contractor';
  homeownerEmail?: string | null;
}) {
  const result = await invokeFunctionAsUser('createProjectWithContext', accessToken, {
    name: `QA ${label} Project ${createSuffix()}`,
    address: `Via QA ${label} 1, Milano`,
    description: `QA browser regression setup for ${label}.`,
    status: 'planning',
    my_role: myRole,
    homeowner_email: homeownerEmail,
  });

  recordTestActivity('project.created', {
    label,
    projectId: result.project.id,
    projectName: result.project.name,
    myRole,
    homeownerEmail,
  });

  return result.project;
}

export async function createProjectRecordDirect({
  name,
  address,
  description,
  ownerType = 'company',
  ownerCompanyId = null,
  ownerUserId = null,
  status = 'planning',
}: {
  name: string;
  address: string;
  description?: string | null;
  ownerType?: 'personal' | 'company';
  ownerCompanyId?: string | null;
  ownerUserId?: string | null;
  status?: 'planning' | 'in_progress' | 'on_hold' | 'completed';
}) {
  if (!adminClient) {
    throw new Error('Missing admin client for QA E2E setup.');
  }

  const { data, error } = await adminClient
    .from('projects')
    .insert({
      name,
      address,
      description: description || null,
      status,
      owner_type: ownerType,
      owner_company_id: ownerType === 'company' ? ownerCompanyId : null,
      owner_user_id: ownerType === 'personal' ? ownerUserId : null,
      created_by: 'qa_e2e',
    })
    .select('*')
    .single();

  if (error) throw error;

  recordTestActivity('project.direct.created', {
    projectId: data.id,
    name,
    ownerType,
    ownerCompanyId,
    ownerUserId,
  });

  return data;
}

export async function getProjectRecord(projectId: string) {
  if (!adminClient) {
    throw new Error('Missing admin client for QA E2E setup.');
  }

  const { data, error } = await adminClient
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    throw new Error(`Project not found: ${projectId}.`);
  }

  return data;
}

export async function addActiveCompanyMember({
  companyId,
  userId,
  email,
  role = 'member',
  profession = 'worker',
  companyMemberRole = 'worker',
}: {
  companyId: string;
  userId: string;
  email: string;
  role?: string;
  profession?: string;
  companyMemberRole?: string;
}) {
  if (!adminClient) {
    throw new Error('Missing admin client for QA E2E setup.');
  }

  const { error } = await adminClient.from('company_members').insert({
    company_id: companyId,
    user_id: userId,
    user_email: email,
    role,
    profession,
    company_member_role: companyMemberRole,
    status: 'active',
  });

  if (error) throw error;
}

export async function updateCompanyMemberStatus({
  companyId,
  email,
  status,
  userId = null,
}: {
  companyId: string;
  email: string;
  status: 'invited' | 'active' | 'declined' | 'removed';
  userId?: string | null;
}) {
  if (!adminClient) {
    throw new Error('Missing admin client for QA E2E setup.');
  }

  const updates: Record<string, unknown> = { status };
  if (userId) {
    updates.user_id = userId;
  }

  const { error } = await adminClient
    .from('company_members')
    .update(updates)
    .eq('company_id', companyId)
    .eq('user_email', email);

  if (error) throw error;
}

export async function getCompanyMember({
  companyId,
  email,
}: {
  companyId: string;
  email: string;
}) {
  if (!adminClient) {
    throw new Error('Missing admin client for QA E2E setup.');
  }

  const { data, error } = await adminClient
    .from('company_members')
    .select('*')
    .eq('company_id', companyId)
    .eq('user_email', email)
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    throw new Error(`Company member not found for ${email} in ${companyId}.`);
  }

  return data;
}

export async function createCompanyChannel({
  companyId,
  name,
  createdByEmail,
  type = 'custom',
  description = null,
}: {
  companyId: string;
  name: string;
  createdByEmail: string;
  type?: 'company' | 'custom';
  description?: string | null;
}) {
  if (!adminClient) {
    throw new Error('Missing admin client for QA E2E setup.');
  }

  const payload = {
    project_id: null,
    company_id: companyId,
    name,
    type,
    description,
    created_by_email: createdByEmail,
  };

  const { data, error } = await adminClient
    .from('channels')
    .insert(payload)
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

export async function addCompanyChannelMember({
  channelId,
  companyId,
  participantId,
  userEmail,
}: {
  channelId: string;
  companyId: string;
  participantId: string;
  userEmail: string;
}) {
  if (!adminClient) {
    throw new Error('Missing admin client for QA E2E setup.');
  }

  const { error } = await adminClient.from('channel_members').insert({
    channel_id: channelId,
    project_id: null,
    participant_id: participantId,
    user_email: userEmail,
    company_id: companyId,
    last_read_at: new Date().toISOString(),
  });

  if (error) throw error;
}

export async function createNotificationRecord({
  userEmail,
  contextType,
  type,
  title,
  message,
  relatedEventId = null,
  contextCompanyId = null,
  isRead = false,
}: {
  userEmail: string;
  contextType: 'personal' | 'company';
  type: string;
  title: string;
  message: string;
  relatedEventId?: string | null;
  contextCompanyId?: string | null;
  isRead?: boolean;
}) {
  if (!adminClient) {
    throw new Error('Missing admin client for QA E2E setup.');
  }

  const { data, error } = await adminClient
    .from('notifications')
    .insert({
      user_email: userEmail,
      context_type: contextType,
      context_company_id: contextCompanyId,
      type,
      title,
      message,
      related_event_id: relatedEventId,
      is_read: isRead,
    })
    .select('*')
    .single();

  if (error) throw error;

  recordTestActivity('notification.created', {
    notificationId: data.id,
    userEmail,
    contextType,
    type,
    title,
  });

  return data;
}

export async function createEventRecord({
  title,
  creatorEmail,
  creatorName,
  ownerType = 'personal',
  ownerUserId = null,
  ownerProjectId = null,
  ownerCompanyId = null,
}: {
  title: string;
  creatorEmail: string;
  creatorName: string;
  ownerType?: 'personal' | 'company' | 'project';
  ownerUserId?: string | null;
  ownerProjectId?: string | null;
  ownerCompanyId?: string | null;
}) {
  if (!adminClient) {
    throw new Error('Missing admin client for QA E2E setup.');
  }

  const startDate = new Date(Date.now() + 60 * 60 * 1000);
  const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);

  const { data, error } = await adminClient
    .from('events')
    .insert({
      title,
      description: `QA event for ${title}`,
      start_datetime: startDate.toISOString(),
      end_datetime: endDate.toISOString(),
      owner_type: ownerType,
      owner_user_id: ownerType === 'personal' ? ownerUserId : null,
      owner_company_id: ownerType === 'company' ? ownerCompanyId : null,
      owner_project_id: ownerType === 'project' ? ownerProjectId : null,
      status: 'scheduled',
      creator_email: creatorEmail,
      creator_name: creatorName,
      created_by: creatorEmail,
    })
    .select('*')
    .single();

  if (error) throw error;

  recordTestActivity('event.created', {
    eventId: data.id,
    title,
    ownerType,
    creatorEmail,
  });

  return data;
}

export async function createEventParticipantRecord({
  eventId,
  participantType,
  status = 'pending',
  userId = null,
  userEmail = null,
  companyId = null,
  createdByEmail = null,
}: {
  eventId: string;
  participantType: 'user' | 'company';
  status?: 'pending' | 'accepted' | 'declined';
  userId?: string | null;
  userEmail?: string | null;
  companyId?: string | null;
  createdByEmail?: string | null;
}) {
  if (!adminClient) {
    throw new Error('Missing admin client for QA E2E setup.');
  }

  const { data, error } = await adminClient
    .from('event_participants')
    .insert({
      event_id: eventId,
      participant_type: participantType,
      status,
      user_id: participantType === 'user' ? userId : null,
      user_email: participantType === 'user' ? userEmail : null,
      company_id: participantType === 'company' ? companyId : null,
      created_by: createdByEmail,
    })
    .select('*')
    .single();

  if (error) throw error;

  recordTestActivity('event.participant.created', {
    eventId,
    participantType,
    status,
    userEmail,
    companyId,
  });

  return data;
}

export async function getEventRecord(eventId: string) {
  if (!adminClient) {
    throw new Error('Missing admin client for QA E2E setup.');
  }

  const { data, error } = await adminClient
    .from('events')
    .select('*')
    .eq('id', eventId)
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    throw new Error(`Event not found: ${eventId}.`);
  }

  return data;
}

export async function getEventRecordByTitle({
  title,
  creatorEmail = null,
}: {
  title: string;
  creatorEmail?: string | null;
}) {
  if (!adminClient) {
    throw new Error('Missing admin client for QA E2E setup.');
  }

  let query = adminClient
    .from('events')
    .select('*')
    .eq('title', title)
    .order('created_date', { ascending: false })
    .limit(1);

  if (creatorEmail) {
    query = query.eq('creator_email', creatorEmail);
  }

  const { data, error } = await query.maybeSingle();

  if (error) throw error;
  if (!data) {
    throw new Error(`Event not found for title ${title}.`);
  }

  return data;
}

export async function getEventParticipantRecord({
  eventId,
  userEmail = null,
  companyId = null,
}: {
  eventId: string;
  userEmail?: string | null;
  companyId?: string | null;
}) {
  if (!adminClient) {
    throw new Error('Missing admin client for QA E2E setup.');
  }

  let query = adminClient
    .from('event_participants')
    .select('*')
    .eq('event_id', eventId);

  if (userEmail) {
    query = query.eq('user_email', userEmail);
  }

  if (companyId) {
    query = query.eq('company_id', companyId);
  }

  const { data, error } = await query.maybeSingle();

  if (error) throw error;
  if (!data) {
    throw new Error(`Event participant not found for event ${eventId}.`);
  }

  return data;
}

export async function createProjectSponsorshipRecord({
  projectId,
  sponsorCompanyId,
  status = 'active',
  startedAt = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  endedAt = null,
  activationSource = 'manual',
}: {
  projectId: string;
  sponsorCompanyId: string;
  status?: 'active' | 'ended';
  startedAt?: string;
  endedAt?: string | null;
  activationSource?: 'manual' | 'auto';
}) {
  if (!adminClient) {
    throw new Error('Missing admin client for QA E2E setup.');
  }

  const { data, error } = await adminClient
    .from('project_sponsorships')
    .insert({
      project_id: projectId,
      sponsor_company_id: sponsorCompanyId,
      status,
      started_at: startedAt,
      ended_at: endedAt,
      activation_source: activationSource,
      created_by: 'qa_e2e',
    })
    .select('*')
    .single();

  if (error) throw error;

  recordTestActivity('project.sponsorship.created', {
    projectId,
    sponsorCompanyId,
    status,
  });

  return data;
}

export async function upsertCompanySubscription({
  companyId,
  planCode,
  billingStatus,
  billingCycle = null,
  stripeCustomerId = null,
  stripeSubscriptionId = null,
  stripeProductId = null,
  stripePriceId = null,
  currentPeriodStart = null,
  currentPeriodEnd = null,
  cancelAtPeriodEnd = false,
  canceledAt = null,
}: {
  companyId: string;
  planCode: 'free' | 'paid';
  billingStatus: 'free' | 'active' | 'incomplete' | 'past_due' | 'canceled' | 'unpaid';
  billingCycle?: 'monthly' | 'yearly' | null;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  stripeProductId?: string | null;
  stripePriceId?: string | null;
  currentPeriodStart?: string | null;
  currentPeriodEnd?: string | null;
  cancelAtPeriodEnd?: boolean;
  canceledAt?: string | null;
}) {
  if (!adminClient) {
    throw new Error('Missing admin client for QA E2E setup.');
  }

  const { data, error } = await adminClient
    .from('company_subscriptions')
    .upsert({
      company_id: companyId,
      plan_code: planCode,
      billing_status: billingStatus,
      billing_cycle: billingCycle,
      currency: 'EUR',
      stripe_customer_id: stripeCustomerId,
      stripe_subscription_id: stripeSubscriptionId,
      stripe_product_id: stripeProductId,
      stripe_price_id: stripePriceId,
      current_period_start: currentPeriodStart,
      current_period_end: currentPeriodEnd,
      cancel_at_period_end: cancelAtPeriodEnd,
      canceled_at: canceledAt,
      created_by: 'qa_e2e',
    }, { onConflict: 'company_id' })
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

export async function getCompanySubscription(companyId: string) {
  if (!adminClient) {
    throw new Error('Missing admin client for QA E2E setup.');
  }

  const { data, error } = await adminClient
    .from('company_subscriptions')
    .select('*')
    .eq('company_id', companyId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function cleanupNotificationsForUser(email: string) {
  if (!adminClient) return;
  await adminClient.from('notifications').delete().eq('user_email', email);
}

export async function cleanupNotificationPreferencesForUser(email: string) {
  if (!adminClient) return;
  await adminClient.from('notification_preferences').delete().eq('user_email', email);
}

export async function getUserRecordByEmail(email: string) {
  if (!adminClient) {
    throw new Error('Missing admin client for QA E2E setup.');
  }

  const { data, error } = await adminClient
    .from('users')
    .select('*')
    .eq('email', email)
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    throw new Error(`User not found for email ${email}.`);
  }

  return data;
}

export async function getNotificationPreferenceByEmail(email: string) {
  if (!adminClient) {
    throw new Error('Missing admin client for QA E2E setup.');
  }

  const { data, error } = await adminClient
    .from('notification_preferences')
    .select('*')
    .eq('user_email', email)
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    throw new Error(`Notification preferences not found for ${email}.`);
  }

  return data;
}

export async function cleanupEvent(eventId: string) {
  if (!adminClient) return;
  await adminClient.from('event_participants').delete().eq('event_id', eventId);
  await adminClient.from('events').delete().eq('id', eventId);
}

export async function setUserContext({
  email,
  activeContext,
  activeCompanyId = null,
  companyIds = [],
  adminCompanyIds = [],
  projectIds = [],
}: {
  email: string;
  activeContext: 'personal' | 'company';
  activeCompanyId?: string | null;
  companyIds?: string[];
  adminCompanyIds?: string[];
  projectIds?: string[];
}) {
  if (!adminClient) {
    throw new Error('Missing admin client for QA E2E setup.');
  }

  const { error } = await adminClient
    .from('users')
    .update({
      active_context: activeContext,
      active_company_id: activeCompanyId,
      company_ids: companyIds,
      admin_company_ids: adminCompanyIds,
      project_ids: projectIds,
      tour_state: defaultTourState,
    })
    .eq('email', email);

  if (error) throw error;

  recordTestActivity('user.context.updated', {
    email,
    activeContext,
    activeCompanyId,
    companyIds,
    adminCompanyIds,
    projectIds,
  });
}

export async function setUserRole({
  email,
  role,
}: {
  email: string;
  role: 'admin' | 'normal';
}) {
  if (!adminClient) {
    throw new Error('Missing admin client for QA E2E setup.');
  }

  const { error } = await adminClient.from('users').update({ role }).eq('email', email);
  if (error) throw error;

  recordTestActivity('user.role.updated', {
    email,
    role,
  });
}

export async function addProjectCompanyParticipant({
  projectId,
  companyId,
  projectRole,
  status = 'active',
  canInvite = false,
}: {
  projectId: string;
  companyId: string;
  projectRole: 'contractor' | 'subcontractor' | 'architect' | 'engineer' | 'surveyor' | 'designer' | 'consultant' | 'supplier';
  status?: 'active' | 'invited' | 'declined' | 'removed';
  canInvite?: boolean;
}) {
  if (!adminClient) {
    throw new Error('Missing admin client for QA E2E setup.');
  }

  const { data, error } = await adminClient
    .from('project_participants')
    .insert({
      project_id: projectId,
      participant_type: 'company',
      company_id: companyId,
      project_role: projectRole,
      status,
      can_invite: canInvite,
    })
    .select('*')
    .single();

  if (error) throw error;

  recordTestActivity('project.participant.created', {
    projectId,
    companyId,
    projectRole,
    status,
    canInvite,
  });

  return data;
}

export async function addProjectPersonalParticipant({
  projectId,
  userId,
  email,
  projectRole,
  status = 'active',
  canInvite = false,
}: {
  projectId: string;
  userId: string;
  email: string;
  projectRole: 'homeowner' | 'contractor' | 'subcontractor' | 'architect' | 'engineer' | 'surveyor' | 'designer' | 'consultant' | 'supplier';
  status?: 'active' | 'invited' | 'declined' | 'removed';
  canInvite?: boolean;
}) {
  if (!adminClient) {
    throw new Error('Missing admin client for QA E2E setup.');
  }

  const { data, error } = await adminClient
    .from('project_participants')
    .insert({
      project_id: projectId,
      participant_type: 'personal',
      user_id: userId,
      user_email: email,
      project_role: projectRole,
      status,
      can_invite: canInvite,
      created_by: 'qa_e2e',
    })
    .select('*')
    .single();

  if (error) throw error;

  recordTestActivity('project.personal-participant.created', {
    projectId,
    userId,
    email,
    projectRole,
    status,
    canInvite,
  });

  return data;
}

export async function getProjectParticipantRecord({
  projectId,
  companyId,
}: {
  projectId: string;
  companyId: string;
}) {
  if (!adminClient) {
    throw new Error('Missing admin client for QA E2E setup.');
  }

  const { data, error } = await adminClient
    .from('project_participants')
    .select('*')
    .eq('project_id', projectId)
    .eq('participant_type', 'company')
    .eq('company_id', companyId)
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    throw new Error(`Project participant not found for company ${companyId} in ${projectId}.`);
  }

  return data;
}

export async function getProjectPersonalParticipantRecord({
  projectId,
  email,
}: {
  projectId: string;
  email: string;
}) {
  if (!adminClient) {
    throw new Error('Missing admin client for QA E2E setup.');
  }

  const { data, error } = await adminClient
    .from('project_participants')
    .select('*')
    .eq('project_id', projectId)
    .eq('participant_type', 'personal')
    .eq('user_email', email)
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    throw new Error(`Project personal participant not found for ${email} in ${projectId}.`);
  }

  return data;
}

export async function updateProjectPersonalParticipantStatus({
  projectId,
  email,
  status,
  userId = null,
}: {
  projectId: string;
  email: string;
  status: 'invited' | 'active' | 'declined' | 'removed';
  userId?: string | null;
}) {
  if (!adminClient) {
    throw new Error('Missing admin client for QA E2E setup.');
  }

  const updates: Record<string, unknown> = { status };
  if (userId) {
    updates.user_id = userId;
  }

  const { error } = await adminClient
    .from('project_participants')
    .update(updates)
    .eq('project_id', projectId)
    .eq('participant_type', 'personal')
    .eq('user_email', email);

  if (error) throw error;
}

export async function createTaskRecordDirect({
  projectId,
  title,
  createdBy,
  description = null,
  status = 'not_started',
  assignedParticipantId = null,
  assignedParticipantType = null,
  assignedUserEmail = null,
  assignedUserName = null,
  assignedCompanyId = null,
  assignedCompanyName = null,
  roomArea = null,
  dueDate = null,
}: {
  projectId: string;
  title: string;
  createdBy: string;
  description?: string | null;
  status?: 'not_started' | 'in_progress' | 'completed' | 'blocked';
  assignedParticipantId?: string | null;
  assignedParticipantType?: 'personal' | 'company' | null;
  assignedUserEmail?: string | null;
  assignedUserName?: string | null;
  assignedCompanyId?: string | null;
  assignedCompanyName?: string | null;
  roomArea?: string | null;
  dueDate?: string | null;
}) {
  if (!adminClient) {
    throw new Error('Missing admin client for QA E2E setup.');
  }

  const { data, error } = await adminClient
    .from('tasks')
    .insert({
      project_id: projectId,
      title,
      description,
      status,
      assigned_participant_id: assignedParticipantId,
      assigned_participant_type: assignedParticipantType,
      assigned_user_email: assignedUserEmail,
      assigned_user_name: assignedUserName,
      assigned_company_id: assignedCompanyId,
      assigned_company_name: assignedCompanyName,
      room_area: roomArea,
      due_date: dueDate,
      created_by: createdBy,
    })
    .select('*')
    .single();

  if (error) throw error;

  recordTestActivity('task.direct.created', {
    taskId: data.id,
    projectId,
    title,
    createdBy,
    status,
  });

  return data;
}

export async function createMilestoneRecordDirect({
  projectId,
  title,
  description = null,
  startDate = null,
  targetDate = null,
  status = 'pending',
}: {
  projectId: string;
  title: string;
  description?: string | null;
  startDate?: string | null;
  targetDate?: string | null;
  status?: 'pending' | 'in_progress' | 'completed' | 'at_risk' | 'delayed';
}) {
  if (!adminClient) {
    throw new Error('Missing admin client for QA E2E setup.');
  }

  const { data, error } = await adminClient
    .from('milestones')
    .insert({
      project_id: projectId,
      title,
      description,
      start_date: startDate,
      target_date: targetDate,
      status,
      created_by: 'qa_e2e',
    })
    .select('*')
    .single();

  if (error) throw error;

  recordTestActivity('milestone.direct.created', {
    milestoneId: data.id,
    projectId,
    title,
    status,
  });

  return data;
}

export async function createDisputeCaseDirect({
  projectId,
  title,
  summary,
  category = 'other',
  status = 'open',
  openedByParticipantId = null,
  taskId = null,
  amountImpact = null,
  timeImpactDays = null,
}: {
  projectId: string;
  title: string;
  summary: string;
  category?: 'scope' | 'cost' | 'delay' | 'quality' | 'payment' | 'other';
  status?: 'open' | 'awaiting_response' | 'in_review' | 'resolved' | 'closed_no_agreement' | 'escalated';
  openedByParticipantId?: string | null;
  taskId?: string | null;
  amountImpact?: number | null;
  timeImpactDays?: number | null;
}) {
  if (!adminClient) {
    throw new Error('Missing admin client for QA E2E setup.');
  }

  const { data, error } = await adminClient
    .from('dispute_cases')
    .insert({
      project_id: projectId,
      task_id: taskId,
      opened_by_participant_id: openedByParticipantId,
      category,
      status,
      title,
      summary,
      amount_impact: amountImpact,
      time_impact_days: timeImpactDays,
    })
    .select('*')
    .single();

  if (error) throw error;

  recordTestActivity('dispute.direct.created', {
    disputeId: data.id,
    projectId,
    title,
    status,
    taskId,
  });

  return data;
}

export async function createDisputeEventDirect({
  disputeCaseId,
  projectId,
  eventType,
  note = null,
  actorParticipantId = null,
  payload = null,
}: {
  disputeCaseId: string;
  projectId: string;
  eventType: 'opened' | 'commented' | 'status_changed' | 'resolved' | 'escalated';
  note?: string | null;
  actorParticipantId?: string | null;
  payload?: Record<string, unknown> | null;
}) {
  if (!adminClient) {
    throw new Error('Missing admin client for QA E2E setup.');
  }

  const { data, error } = await adminClient
    .from('dispute_events')
    .insert({
      dispute_case_id: disputeCaseId,
      project_id: projectId,
      actor_participant_id: actorParticipantId,
      event_type: eventType,
      note,
      payload,
    })
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

export async function createProjectDocumentDirect({
  name,
  uploadedByEmail,
  projectId = null,
  companyId = null,
  description = null,
  category = 'other',
  fileType = 'png',
  fileUrl = '/images/hero-image.png',
  filePath = null,
  fileSize = 1024,
  uploadedByName = null,
  documentStatus = 'draft',
  modelFormat = null,
}: {
  name: string;
  uploadedByEmail: string;
  projectId?: string | null;
  companyId?: string | null;
  description?: string | null;
  category?: string;
  fileType?: string;
  fileUrl?: string;
  filePath?: string | null;
  fileSize?: number;
  uploadedByName?: string | null;
  documentStatus?: string;
  modelFormat?: string | null;
}) {
  if (!adminClient) {
    throw new Error('Missing admin client for QA E2E setup.');
  }

  const { data, error } = await adminClient
    .from('project_documents')
    .insert({
      project_id: projectId,
      company_id: companyId,
      name,
      description,
      file_url: fileUrl,
      file_path: filePath,
      file_type: fileType,
      file_size: fileSize,
      uploaded_by_email: uploadedByEmail,
      uploaded_by_name: uploadedByName,
      category,
      document_status: documentStatus,
      model_format: modelFormat,
      is_current_revision: true,
    })
    .select('*')
    .single();

  if (error) throw error;

  recordTestActivity('document.direct.created', {
    documentId: data.id,
    projectId,
    companyId,
    name,
    fileType,
  });

  return data;
}

export async function getTaskRecordByTitle({
  projectId,
  title,
}: {
  projectId: string;
  title: string;
}) {
  if (!adminClient) {
    throw new Error('Missing admin client for QA E2E setup.');
  }

  const { data, error } = await adminClient
    .from('tasks')
    .select('*')
    .eq('project_id', projectId)
    .eq('title', title)
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    throw new Error(`Task not found for ${title} in ${projectId}.`);
  }

  return data;
}

export async function getLatestWorkSessionForUser({
  companyId,
  email,
}: {
  companyId: string;
  email: string;
}) {
  if (!adminClient) {
    throw new Error('Missing admin client for QA E2E setup.');
  }

  const { data, error } = await adminClient
    .from('work_sessions')
    .select('*')
    .eq('company_id', companyId)
    .eq('user_email', email)
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    throw new Error(`Work session not found for ${email} in ${companyId}.`);
  }

  return data;
}

export async function getMilestoneRecordByTitle({
  projectId,
  title,
}: {
  projectId: string;
  title: string;
}) {
  if (!adminClient) {
    throw new Error('Missing admin client for QA E2E setup.');
  }

  const { data, error } = await adminClient
    .from('milestones')
    .select('*')
    .eq('project_id', projectId)
    .eq('title', title)
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    throw new Error(`Milestone not found for ${title} in ${projectId}.`);
  }

  return data;
}

export async function getDisputeCaseByTitle({
  projectId,
  title,
}: {
  projectId: string;
  title: string;
}) {
  if (!adminClient) {
    throw new Error('Missing admin client for QA E2E setup.');
  }

  const { data, error } = await adminClient
    .from('dispute_cases')
    .select('*')
    .eq('project_id', projectId)
    .eq('title', title)
    .order('created_date', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    throw new Error(`Dispute not found for ${title} in ${projectId}.`);
  }

  return data;
}

export async function getDisputeCaseByTaskId({
  projectId,
  taskId,
}: {
  projectId: string;
  taskId: string;
}) {
  if (!adminClient) {
    throw new Error('Missing admin client for QA E2E setup.');
  }

  const { data, error } = await adminClient
    .from('dispute_cases')
    .select('*')
    .eq('project_id', projectId)
    .eq('task_id', taskId)
    .order('created_date', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    throw new Error(`Dispute not found for task ${taskId} in ${projectId}.`);
  }

  return data;
}

export async function listDisputeEvents({
  disputeCaseId,
  eventType = null,
}: {
  disputeCaseId: string;
  eventType?: 'opened' | 'commented' | 'status_changed' | 'resolved' | 'escalated' | null;
}) {
  if (!adminClient) {
    throw new Error('Missing admin client for QA E2E setup.');
  }

  let query = adminClient
    .from('dispute_events')
    .select('*')
    .eq('dispute_case_id', disputeCaseId)
    .order('created_date', { ascending: true });

  if (eventType) {
    query = query.eq('event_type', eventType);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function getDisputeEvidenceRecord({
  disputeCaseId,
  sourceType = null,
}: {
  disputeCaseId: string;
  sourceType?: string | null;
}) {
  if (!adminClient) {
    throw new Error('Missing admin client for QA E2E setup.');
  }

  let query = adminClient
    .from('dispute_evidence_items')
    .select('*')
    .eq('dispute_case_id', disputeCaseId)
    .order('created_date', { ascending: false })
    .limit(1);

  if (sourceType) {
    query = query.eq('source_type', sourceType);
  }

  const { data, error } = await query.maybeSingle();

  if (error) throw error;
  if (!data) {
    throw new Error(`Dispute evidence not found for ${disputeCaseId}.`);
  }

  return data;
}

export async function getChannelRecord({
  projectId = null,
  companyId = null,
  name = null,
  type = null,
}: {
  projectId?: string | null;
  companyId?: string | null;
  name?: string | null;
  type?: 'general' | 'company' | 'direct' | 'custom' | null;
}) {
  if (!adminClient) {
    throw new Error('Missing admin client for QA E2E setup.');
  }

  let query = adminClient.from('channels').select('*');

  if (projectId) {
    query = query.eq('project_id', projectId);
  }

  if (companyId) {
    query = query.eq('company_id', companyId);
  }

  if (name) {
    query = query.eq('name', name);
  }

  if (type) {
    query = query.eq('type', type);
  }

  const { data, error } = await query
    .order('created_date', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    throw new Error('Channel not found for the provided filters.');
  }

  return data;
}

export async function listChannelMembers(channelId: string) {
  if (!adminClient) {
    throw new Error('Missing admin client for QA E2E setup.');
  }

  const { data, error } = await adminClient
    .from('channel_members')
    .select('*')
    .eq('channel_id', channelId)
    .order('created_date', { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function getMessageRecordByContent({
  content,
  projectId = null,
  companyId = null,
}: {
  content: string;
  projectId?: string | null;
  companyId?: string | null;
}) {
  if (!adminClient) {
    throw new Error('Missing admin client for QA E2E setup.');
  }

  let query = adminClient
    .from('messages')
    .select('*')
    .eq('content', content)
    .order('created_date', { ascending: false })
    .limit(1);

  if (projectId) {
    query = query.eq('project_id', projectId);
  }

  if (companyId) {
    query = query.eq('company_id', companyId);
  }

  const { data, error } = await query.maybeSingle();

  if (error) throw error;
  if (!data) {
    throw new Error('Message not found for the provided content.');
  }

  return data;
}

export async function getProjectDocumentRecordByName({
  name,
  projectId = null,
  companyId = null,
}: {
  name: string;
  projectId?: string | null;
  companyId?: string | null;
}) {
  if (!adminClient) {
    throw new Error('Missing admin client for QA E2E setup.');
  }

  let query = adminClient
    .from('project_documents')
    .select('*')
    .eq('name', name)
    .order('created_date', { ascending: false })
    .limit(1);

  if (projectId) {
    query = query.eq('project_id', projectId);
  }

  if (companyId) {
    query = query.eq('company_id', companyId);
  }

  const { data, error } = await query.maybeSingle();

  if (error) throw error;
  if (!data) {
    throw new Error(`Document not found for ${name}.`);
  }

  return data;
}

export async function getDocumentCommentRecord({
  documentId,
  comment,
}: {
  documentId: string;
  comment: string;
}) {
  if (!adminClient) {
    throw new Error('Missing admin client for QA E2E setup.');
  }

  const { data, error } = await adminClient
    .from('document_comments')
    .select('*')
    .eq('document_id', documentId)
    .eq('comment', comment)
    .order('created_date', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    throw new Error(`Document comment not found for ${documentId}.`);
  }

  return data;
}

export async function openUserMenu(page: Page) {
  await page.locator('[data-tour="user-menu-trigger"]').click();
}

export async function waitForAuthenticatedShell(page: Page, timeout = authenticatedShellTimeoutMs) {
  const authInput = page.locator('#signin-email');
  const userMenuTrigger = page.locator('[data-tour="user-menu-trigger"]');

  await expect.poll(async () => {
    const authVisible = (await authInput.count()) > 0 && (await authInput.first().isVisible());
    const userMenuVisible = (await userMenuTrigger.count()) > 0 && (await userMenuTrigger.first().isVisible());
    const userMenuEnabled = userMenuVisible && (await userMenuTrigger.first().isEnabled());

    return {
      authVisible,
      userMenuVisible,
      userMenuEnabled,
    };
  }, {
    timeout,
    intervals: [250, 500, 1000, 2000, 5000],
  }).toEqual({
    authVisible: false,
    userMenuVisible: true,
    userMenuEnabled: true,
  });
}

export async function waitForDialogToClose(dialog: Locator, timeout = 10000) {
  await expect.poll(async () => {
    const dialogStates = await dialog.evaluateAll((elements) => elements.map((element) => {
      const dialogElement = element as HTMLElement;
      const computedStyle = window.getComputedStyle(dialogElement);
      const isVisible = !dialogElement.hidden
        && computedStyle.display !== 'none'
        && computedStyle.visibility !== 'hidden'
        && computedStyle.opacity !== '0'
        && dialogElement.getClientRects().length > 0;

      return {
        ariaHidden: dialogElement.getAttribute('aria-hidden'),
        dataState: dialogElement.getAttribute('data-state'),
        isConnected: dialogElement.isConnected,
        isVisible,
      };
    }));

    if (dialogStates.length === 0) return true;

    return dialogStates.every((state) => (
      !state.isConnected
      || state.dataState === 'closed'
      || state.ariaHidden === 'true'
      || !state.isVisible
    ));
  }, { timeout }).toBe(true);
}

export async function switchContextThroughUi(page: Page, targetLabel: RegExp | string) {
  const contextSwitcher = page.locator('[data-tour="context-switcher"]:visible');
  const contextTrigger = contextSwitcher.getByRole('button');

  await expect(contextTrigger).toBeVisible();
  await contextTrigger.click();

  const menuItem = page.locator('[role="menuitem"]').filter({ hasText: targetLabel }).first();
  if (await menuItem.count()) {
    await menuItem.click();
  } else {
    await page.getByText(targetLabel).last().click();
  }

  const confirmDialog = page.getByRole('dialog', { name: /switch work context|cambiare contesto di lavoro/i });
  await expect(confirmDialog).toBeVisible();

  const navigationPromise = page.waitForNavigation({ waitUntil: 'domcontentloaded' });
  await confirmDialog.getByRole('button', { name: /conferma|confirm/i }).click();
  await navigationPromise;

  await waitForAuthenticatedShell(page);
  await expect(page.locator('[data-tour="context-switcher"]:visible')).toContainText(targetLabel);
}

export async function cleanupQaUser(userId: string, email: string) {
  if (!adminClient) return;
  await adminClient.from('notification_preferences').delete().eq('user_email', email);
  await adminClient.from('users').delete().eq('email', email);
  await adminClient.auth.admin.deleteUser(userId);
}

export async function cleanupUserRecordByEmail(email: string) {
  if (!adminClient) return;
  await adminClient.from('notification_preferences').delete().eq('user_email', email);
  await adminClient.from('users').delete().eq('email', email);
}

export async function cleanupProjectGraph(projectId: string) {
  if (!adminClient) return;
  await adminClient.from('document_comments').delete().eq('project_id', projectId);
  await adminClient.from('messages').delete().eq('project_id', projectId);
  await adminClient.from('channel_members').delete().eq('project_id', projectId);
  await adminClient.from('channels').delete().eq('project_id', projectId);
  await adminClient.from('dispute_evidence_items').delete().eq('project_id', projectId);
  await adminClient.from('dispute_events').delete().eq('project_id', projectId);
  await adminClient.from('dispute_cases').delete().eq('project_id', projectId);
  await adminClient.from('project_documents').delete().eq('project_id', projectId);
  await adminClient.from('milestones').delete().eq('project_id', projectId);
  await adminClient.from('change_requests').delete().eq('project_id', projectId);
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
}

export async function cleanupCompanyGraph(companyId: string) {
  if (!adminClient) return;
  await adminClient.from('document_comments').delete().eq('company_id', companyId);
  await adminClient.from('messages').delete().eq('company_id', companyId);
  await adminClient.from('channel_members').delete().eq('company_id', companyId);
  await adminClient.from('channels').delete().eq('company_id', companyId);
  await adminClient.from('project_documents').delete().eq('company_id', companyId);
  await adminClient.from('company_subscriptions').delete().eq('company_id', companyId);
  await adminClient.from('company_members').delete().eq('company_id', companyId);
  await adminClient.from('companies').delete().eq('id', companyId);
}

export async function clearProjectSponsorships(projectId: string) {
  if (!adminClient) return;
  await adminClient.from('project_sponsorships').delete().eq('project_id', projectId);
}

export async function signInThroughUi(page: Page, email: string, password: string) {
  recordTestActivity('user.signin.started', {
    email,
  });

  await page.goto('/app');
  await page.locator('#signin-email').fill(email);
  await page.locator('#signin-password').fill(password);

  const authResponsePromise = page.waitForResponse(
    (response) =>
      response.request().method() === 'POST' &&
      response.url().includes('/auth/v1/token?grant_type=password'),
  );

  await page.getByRole('button', { name: /entra|sign in/i }).click();

  const authResponse = await authResponsePromise;
  expect(authResponse.ok()).toBeTruthy();

  await page.waitForFunction(
    (storageKey) => {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return false;

      try {
        return Boolean(JSON.parse(raw)?.access_token);
      } catch {
        return false;
      }
    },
    authStorageKey,
  );

  recordTestActivity('user.signin.completed', {
    email,
  });
}