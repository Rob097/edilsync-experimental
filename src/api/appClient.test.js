import { beforeEach, describe, expect, it, vi } from 'vitest';

// Scenario IDs: auth.bootstrap.creates-public-user-record, auth.bootstrap.recovers-from-conflicting-user-insert, auth.signin.accepts-valid-password

const { createClientMock, mockState, resetMockState } = vi.hoisted(() => {
  const createClientMock = vi.fn();
  const mockState = {
    authUser: null,
    authUserError: null,
    signInError: null,
    existingUserResponses: [],
    updateErrors: [],
    insertResponses: [],
    insertPayloads: [],
    session: null,
  };

  const resetMockState = () => {
    mockState.authUser = null;
    mockState.authUserError = null;
    mockState.signInError = null;
    mockState.existingUserResponses = [];
    mockState.updateErrors = [];
    mockState.insertResponses = [];
    mockState.insertPayloads = [];
    mockState.session = null;
  };

  return { createClientMock, mockState, resetMockState };
});

vi.mock('@supabase/supabase-js', () => ({
  createClient: createClientMock,
}));

vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co');
vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'anon-key');

const buildSupabaseMock = () => {
  const update = vi.fn((payload) => ({
    eq: vi.fn(async () => ({ data: null, error: mockState.updateErrors.shift() || null, payload })),
  }));

  const insert = vi.fn((payload) => {
    mockState.insertPayloads.push(payload);
    return {
      select: vi.fn(() => ({
        single: vi.fn(async () => {
          const next = mockState.insertResponses.shift() || { data: null, error: null };
          return next;
        }),
      })),
    };
  });

  const select = vi.fn(() => ({
    eq: vi.fn(() => ({
      maybeSingle: vi.fn(async () => {
        const next = mockState.existingUserResponses.shift() || { data: null, error: null };
        return next;
      }),
    })),
  }));

  return {
    auth: {
      getUser: vi.fn(async () => ({
        data: { user: mockState.authUser },
        error: mockState.authUserError,
      })),
      signInWithPassword: vi.fn(async () => ({ error: mockState.signInError })),
      signUp: vi.fn(async () => ({ data: { session: null }, error: null })),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
      signOut: vi.fn(async () => ({ error: null })),
      signInWithOAuth: vi.fn(async () => ({ error: null })),
      getSession: vi.fn(async () => ({ data: { session: mockState.session }, error: null })),
      refreshSession: vi.fn(async () => ({ data: { session: mockState.session }, error: null })),
    },
    from: vi.fn(() => ({
      select,
      update,
      insert,
    })),
    rpc: vi.fn(async () => ({ ok: true })),
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(async () => ({ error: null })),
        getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'https://example.supabase.co/storage/v1/object/public/project-files/test' } })),
        createSignedUrl: vi.fn(async () => ({ data: { signedUrl: 'https://example.supabase.co/storage/v1/object/sign/project-files/test' }, error: null })),
      })),
    },
  };
};

const supabaseMock = buildSupabaseMock();
createClientMock.mockReturnValue(supabaseMock);

const fetchMock = vi.fn();
vi.stubGlobal('fetch', fetchMock);

const { appClient } = await import('./appClient');

describe('appClient auth bootstrap', () => {
  beforeEach(() => {
    resetMockState();
    createClientMock.mockClear();
    Object.values(supabaseMock.auth).forEach((mockFn) => mockFn.mockClear?.());
    supabaseMock.from.mockClear();
    supabaseMock.rpc.mockClear();
    fetchMock.mockReset();
  });

  it('returns an existing user and binds auth_user_id when missing', async () => {
    mockState.authUser = {
      id: 'auth-user-1',
      email: 'qa-existing@edilsync.test',
      user_metadata: { full_name: 'QA Existing' },
    };
    mockState.existingUserResponses = [
      {
        data: { id: 'public-user-1', email: 'qa-existing@edilsync.test', auth_user_id: null },
        error: null,
      },
    ];
    mockState.updateErrors = [null];

    const user = await appClient.auth.me();

    expect(user).toMatchObject({ id: 'public-user-1', email: 'qa-existing@edilsync.test' });
    expect(supabaseMock.from).toHaveBeenCalledWith('users');
  });

  it('creates a public.users record with the normalized default payload when missing', async () => {
    mockState.authUser = {
      id: 'auth-user-2',
      email: 'qa-new@edilsync.test',
      user_metadata: { full_name: 'QA New User', display_name: 'QA New' },
    };
    mockState.existingUserResponses = [{ data: null, error: null }];
    mockState.insertResponses = [
      {
        data: {
          id: 'public-user-2',
          email: 'qa-new@edilsync.test',
          role: 'normal',
          active_context: 'personal',
        },
        error: null,
      },
    ];

    const user = await appClient.auth.me();

    expect(user).toMatchObject({
      id: 'public-user-2',
      email: 'qa-new@edilsync.test',
      role: 'normal',
      active_context: 'personal',
    });
    expect(mockState.insertPayloads).toEqual([
      expect.objectContaining({
        auth_user_id: 'auth-user-2',
        email: 'qa-new@edilsync.test',
        full_name: 'QA New User',
        display_name: 'QA New',
        role: 'normal',
        active_context: 'personal',
        company_ids: [],
        admin_company_ids: [],
        project_ids: [],
      }),
    ]);
  });

  it('recovers from duplicate insert conflicts by re-reading the existing row', async () => {
    mockState.authUser = {
      id: 'auth-user-3',
      email: 'qa-conflict@edilsync.test',
      user_metadata: { name: 'QA Conflict' },
    };
    mockState.existingUserResponses = [
      { data: null, error: null },
      {
        data: { id: 'public-user-3', email: 'qa-conflict@edilsync.test', auth_user_id: 'auth-user-3' },
        error: null,
      },
    ];
    mockState.insertResponses = [
      {
        data: null,
        error: { status: 409, code: '23505', message: 'duplicate key value violates unique constraint' },
      },
    ];

    const user = await appClient.auth.me();

    expect(user).toMatchObject({ id: 'public-user-3', email: 'qa-conflict@edilsync.test' });
    expect(mockState.insertPayloads).toHaveLength(1);
  });

  it('signs in with password and returns the bootstrapped user record', async () => {
    mockState.authUser = {
      id: 'auth-user-4',
      email: 'qa-login@edilsync.test',
      user_metadata: { full_name: 'QA Login' },
    };
    mockState.existingUserResponses = [
      {
        data: { id: 'public-user-4', email: 'qa-login@edilsync.test', auth_user_id: 'auth-user-4' },
        error: null,
      },
    ];

    const user = await appClient.auth.signInWithPassword({
      email: 'qa-login@edilsync.test',
      password: 'EdilSync!123',
    });

    expect(supabaseMock.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'qa-login@edilsync.test',
      password: 'EdilSync!123',
    });
    expect(user).toMatchObject({ id: 'public-user-4', email: 'qa-login@edilsync.test' });
  });

  it('throws when no authenticated user is available', async () => {
    mockState.authUser = null;

    await expect(appClient.auth.me()).rejects.toThrow('User not authenticated');
  });

  it('streams edge function events with the bearer token when a session is available', async () => {
    mockState.session = {
      access_token: 'stream-token',
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      refresh_token: 'refresh-token',
    };

    fetchMock.mockResolvedValueOnce(new Response(
      [
        'event: delta',
        'data: {"content":"Ciao"}',
        '',
        'event: done',
        'data: {"content":"Ciao mondo"}',
        '',
      ].join('\n'),
      {
        status: 200,
        headers: {
          'Content-Type': 'text/event-stream',
        },
      },
    ));

    const deltas = [];
    const donePayloads = [];

    await appClient.functions.stream('chat-agent', { message: 'ciao' }, {
      onDelta: (payload) => deltas.push(payload),
      onDone: (payload) => donePayloads.push(payload),
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://example.supabase.co/functions/v1/chat-agent',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer stream-token',
          Accept: 'text/event-stream',
          apikey: 'anon-key',
        }),
      }),
    );
    expect(deltas).toEqual([{ content: 'Ciao' }]);
    expect(donePayloads).toEqual([{ content: 'Ciao mondo' }]);
  });
});