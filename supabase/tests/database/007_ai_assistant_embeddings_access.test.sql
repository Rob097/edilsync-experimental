begin;

create extension if not exists pgtap with schema extensions;

select case when (
  to_regclass('public.embeddings') is not null
  and to_regprocedure('public.match_context_embeddings(double precision[], text, text, integer)') is not null
  and to_regprocedure('public.can_read_assistant_embedding_source(text, text, text, text)') is not null
) then 1 else 0 end as assistant_schema_ready \gset

\if :assistant_schema_ready

create or replace function pg_temp.unit_embedding()
returns double precision[]
language sql
as $$
  select array_prepend(1::double precision, array_fill(0::double precision, array[3071]));
$$;

select plan(8);

select set_config('request.jwt.claim.role', 'service_role', true);
select set_config('request.jwt.claims', '{"role":"service_role"}', true);

insert into public.users (
  id,
  auth_user_id,
  email,
  full_name,
  role,
  active_context,
  active_company_id,
  company_ids,
  admin_company_ids,
  project_ids,
  created_by
) values
  (
    'qa-ai-embed-user-company',
    'a1111111-1111-4111-8111-111111111111',
    'qa-ai-embed-company@example.com',
    'QA AI Embed Company User',
    'normal',
    'company',
    'qa-ai-embed-company',
    array['qa-ai-embed-company'],
    '{}'::text[],
    array['qa-ai-embed-project'],
    'qa-pgtap'
  ),
  (
    'qa-ai-embed-user-architect',
    'a2222222-2222-4222-8222-222222222222',
    'qa-ai-embed-architect@example.com',
    'QA AI Embed Architect User',
    'normal',
    'personal',
    null,
    '{}'::text[],
    '{}'::text[],
    array['qa-ai-embed-project'],
    'qa-pgtap'
  );

insert into public.companies (
  id,
  name,
  company_type,
  vat_number,
  address,
  email,
  description,
  created_by
) values (
  'qa-ai-embed-company',
  'QA AI Embed Company',
  'general_contractor',
  'ITQAAIEMBED01',
  'Via QA Embed 10, Milano',
  'qa-ai-embed-company@example.com',
  'Company fixture for assistant embedding access tests.',
  'qa-pgtap'
);

insert into public.projects (
  id,
  name,
  address,
  description,
  status,
  owner_type,
  owner_company_id,
  created_by
) values (
  'qa-ai-embed-project',
  'QA AI Embed Project',
  'Via QA Embed 11, Bergamo',
  'Project fixture for assistant embedding access tests.',
  'in_progress',
  'company',
  'qa-ai-embed-company',
  'qa-pgtap'
);

insert into public.project_participants (
  id,
  project_id,
  participant_type,
  user_email,
  company_id,
  project_role,
  status,
  can_invite,
  created_by
) values
  (
    'qa-ai-embed-project-company-participant',
    'qa-ai-embed-project',
    'company',
    'qa-ai-embed-company@example.com',
    'qa-ai-embed-company',
    'contractor',
    'active',
    false,
    'qa-pgtap'
  ),
  (
    'qa-ai-embed-project-architect-participant',
    'qa-ai-embed-project',
    'personal',
    'qa-ai-embed-architect@example.com',
    null,
    'architect',
    'active',
    false,
    'qa-pgtap'
  );

insert into public.project_documents (
  id,
  project_id,
  name,
  description,
  file_url,
  category,
  created_by
) values (
  'qa-ai-embed-document',
  'qa-ai-embed-project',
  'QA AI Embed Document',
  'Documento tecnico per test embeddings assistant.',
  'https://example.com/qa-ai-embed-document.pdf',
  'drawing',
  'qa-pgtap'
);

insert into public.document_comments (
  id,
  document_id,
  project_id,
  comment,
  author_email,
  author_name,
  created_by
) values (
  'qa-ai-embed-comment',
  'qa-ai-embed-document',
  'qa-ai-embed-project',
  'Commento tecnico sul dettaglio esecutivo.',
  'qa-ai-embed-company@example.com',
  'QA Embed Company User',
  'qa-pgtap'
);

insert into public.progress_statements (
  id,
  project_id,
  sequence_number,
  statement_date,
  status,
  notes,
  created_by
) values (
  'qa-ai-embed-progress',
  'qa-ai-embed-project',
  1,
  current_date,
  'draft',
  'Nota economica riservata del SAL.',
  'qa-pgtap'
);

insert into public.work_sessions (
  id,
  company_id,
  user_email,
  project_id,
  started_at,
  ended_at,
  note,
  entry_type,
  source_mode,
  created_by
) values (
  'qa-ai-embed-work-session',
  'qa-ai-embed-company',
  'qa-ai-embed-company@example.com',
  'qa-ai-embed-project',
  now() - interval '2 hours',
  now() - interval '1 hour',
  'Nota operativa interna di cantiere.',
  'live',
  'operational',
  'qa-pgtap'
);

insert into public.embeddings (
  id,
  context_type,
  context_id,
  source_type,
  source_id,
  title,
  content,
  content_hash,
  metadata,
  embedding,
  created_by
) values
  (
    'qa-ai-embed-row-document',
    'project',
    'qa-ai-embed-project',
    'project_document',
    'qa-ai-embed-document',
    'QA AI Embed Document',
    'Documento: QA AI Embed Document',
    'hash-doc',
    '{"kind":"document"}'::jsonb,
    pg_temp.unit_embedding()::extensions.halfvec(3072),
    'qa-pgtap'
  ),
  (
    'qa-ai-embed-row-comment',
    'project',
    'qa-ai-embed-project',
    'document_comment',
    'qa-ai-embed-comment',
    'QA AI Embed Comment',
    'Commento: Commento tecnico sul dettaglio esecutivo.',
    'hash-comment',
    '{"kind":"comment"}'::jsonb,
    pg_temp.unit_embedding()::extensions.halfvec(3072),
    'qa-pgtap'
  ),
  (
    'qa-ai-embed-row-progress',
    'project',
    'qa-ai-embed-project',
    'progress_statement_note',
    'qa-ai-embed-progress',
    'QA AI Embed Progress',
    'SAL 1: Nota economica riservata del SAL.',
    'hash-progress',
    '{"kind":"progress"}'::jsonb,
    pg_temp.unit_embedding()::extensions.halfvec(3072),
    'qa-pgtap'
  ),
  (
    'qa-ai-embed-row-work-session',
    'project',
    'qa-ai-embed-project',
    'work_session_note',
    'qa-ai-embed-work-session',
    'QA AI Embed Work Session',
    'Work session: Nota operativa interna di cantiere.',
    'hash-work-session',
    '{"kind":"work_session"}'::jsonb,
    pg_temp.unit_embedding()::extensions.halfvec(3072),
    'qa-pgtap'
  );

set local role authenticated;
select set_config('request.jwt.claim.role', 'authenticated', true);

select set_config(
  'request.jwt.claims',
  '{"role":"authenticated","sub":"a1111111-1111-4111-8111-111111111111","email":"qa-ai-embed-company@example.com"}',
  true
);

select is(
  (select count(*)::integer from public.embeddings where context_type = 'project' and context_id = 'qa-ai-embed-project'),
  4,
  'company-context project user can read all assistant embeddings allowed by the underlying source records'
);

select is(
  (select count(*)::integer from public.match_context_embeddings(pg_temp.unit_embedding(), 'project', 'qa-ai-embed-project', 10)),
  4,
  'match_context_embeddings returns all visible project matches for the company-context user'
);

select set_config(
  'request.jwt.claims',
  '{"role":"authenticated","sub":"a2222222-2222-4222-8222-222222222222","email":"qa-ai-embed-architect@example.com"}',
  true
);

select ok(
  public.can_read_assistant_embedding_source('project', 'qa-ai-embed-project', 'project_document', 'qa-ai-embed-document'),
  'personal project participant can read project-document embeddings when the source document is visible'
);

select ok(
  public.can_read_assistant_embedding_source('project', 'qa-ai-embed-project', 'document_comment', 'qa-ai-embed-comment'),
  'personal project participant can read document-comment embeddings when the source comment is visible'
);

select ok(
  not public.can_read_assistant_embedding_source('project', 'qa-ai-embed-project', 'progress_statement_note', 'qa-ai-embed-progress'),
  'personal project participant without finance access cannot read progress-statement embeddings'
);

select ok(
  not public.can_read_assistant_embedding_source('project', 'qa-ai-embed-project', 'work_session_note', 'qa-ai-embed-work-session'),
  'personal project participant without company membership cannot read work-session embeddings'
);

select is(
  (select count(*)::integer from public.embeddings where context_type = 'project' and context_id = 'qa-ai-embed-project'),
  2,
  'embeddings RLS exposes only the source records still visible to the personal project participant'
);

select is(
  (select count(*)::integer from public.match_context_embeddings(pg_temp.unit_embedding(), 'project', 'qa-ai-embed-project', 10)),
  2,
  'match_context_embeddings filters hidden sources out of retrieval results for the personal project participant'
);

select * from finish();

\else

select plan(1);

select pass(
  'Assistant embedding access test skipped because the local Supabase bootstrap does not include the assistant embedding schema yet'
);

select * from finish();

\endif

rollback;