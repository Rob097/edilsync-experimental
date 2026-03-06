begin;

alter table public.project_documents
  add column if not exists company_id text;

create index if not exists idx_project_documents_company_id
  on public.project_documents(company_id);

alter table public.project_documents
  alter column project_id drop not null;

alter table public.project_documents
  drop constraint if exists project_documents_scope_check;

alter table public.project_documents
  add constraint project_documents_scope_check
  check (
    (project_id is not null and company_id is null)
    or (project_id is null and company_id is not null)
  );

alter table public.document_comments
  add column if not exists company_id text;

create index if not exists idx_document_comments_company_id
  on public.document_comments(company_id);

alter table public.document_comments
  alter column project_id drop not null;

alter table public.document_comments
  drop constraint if exists document_comments_scope_check;

alter table public.document_comments
  add constraint document_comments_scope_check
  check (
    (project_id is not null and company_id is null)
    or (project_id is null and company_id is not null)
  );

drop policy if exists docs_create on public.project_documents;
drop policy if exists docs_read on public.project_documents;
drop policy if exists docs_update on public.project_documents;
drop policy if exists docs_delete on public.project_documents;

create policy docs_create on public.project_documents for insert to authenticated with check (
  project_id = any(public.current_project_ids())
  or company_id = any(public.current_company_ids())
  or created_by = public.current_user_email()
);

create policy docs_read on public.project_documents for select to authenticated using (
  project_id = any(public.current_project_ids())
  or company_id = any(public.current_company_ids())
  or created_by = public.current_user_email()
  or public.is_admin()
);

create policy docs_update on public.project_documents for update to authenticated using (
  created_by = public.current_user_email()
) with check (
  created_by = public.current_user_email()
);

create policy docs_delete on public.project_documents for delete to authenticated using (
  created_by = public.current_user_email()
);

drop policy if exists comments_create on public.document_comments;
drop policy if exists comments_read on public.document_comments;
drop policy if exists comments_update on public.document_comments;
drop policy if exists comments_delete on public.document_comments;

create policy comments_create on public.document_comments for insert to authenticated with check (
  project_id = any(public.current_project_ids())
  or company_id = any(public.current_company_ids())
  or created_by = public.current_user_email()
);

create policy comments_read on public.document_comments for select to authenticated using (
  project_id = any(public.current_project_ids())
  or company_id = any(public.current_company_ids())
  or created_by = public.current_user_email()
  or public.is_admin()
);

create policy comments_update on public.document_comments for update to authenticated using (
  created_by = public.current_user_email()
) with check (
  created_by = public.current_user_email()
);

create policy comments_delete on public.document_comments for delete to authenticated using (
  created_by = public.current_user_email()
);

commit;
