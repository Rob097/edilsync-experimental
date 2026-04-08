begin;

create or replace function public.protect_user_authorization_fields()
returns trigger
language plpgsql
set search_path = public, auth
as $$
declare
  request_role text := coalesce(auth.jwt() ->> 'role', auth.role());
begin
  if request_role = 'service_role' or public.is_admin() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.auth_user_id is not null and new.auth_user_id <> auth.uid() then
      raise exception using errcode = '42501', message = 'auth_user_id is server-managed';
    end if;

    if coalesce(new.company_ids, '{}'::text[]) <> '{}'::text[]
      or coalesce(new.admin_company_ids, '{}'::text[]) <> '{}'::text[]
      or coalesce(new.project_ids, '{}'::text[]) <> '{}'::text[] then
      raise exception using errcode = '42501', message = 'Membership fields are managed server-side';
    end if;

    if new.role = 'admin' then
      raise exception using errcode = '42501', message = 'role is server-managed';
    end if;

    return new;
  end if;

  if new.auth_user_id is distinct from old.auth_user_id then
    raise exception using errcode = '42501', message = 'auth_user_id is server-managed';
  end if;

  if new.role is distinct from old.role then
    raise exception using errcode = '42501', message = 'role is server-managed';
  end if;

  if new.company_ids is distinct from old.company_ids
    or new.admin_company_ids is distinct from old.admin_company_ids
    or new.project_ids is distinct from old.project_ids then
    raise exception using errcode = '42501', message = 'Membership fields are managed server-side';
  end if;

  return new;
end;
$$;

drop trigger if exists protect_user_authorization_fields_trigger on public.users;

create trigger protect_user_authorization_fields_trigger
before insert or update on public.users
for each row
execute function public.protect_user_authorization_fields();

commit;