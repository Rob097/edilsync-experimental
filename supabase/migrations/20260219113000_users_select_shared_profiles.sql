begin;

drop policy if exists users_select on public.users;

create policy users_select on public.users
for select
to authenticated
using (
  email = public.current_user_email()
  or public.is_admin()
  or company_ids && public.current_company_ids()
  or project_ids && public.current_project_ids()
  or email in (
    select cm.user_email
    from public.company_members cm
    where cm.company_id = any(public.current_company_ids())
      and cm.status in ('active', 'invited')
      and cm.user_email is not null
  )
  or email in (
    select pp.user_email
    from public.project_participants pp
    where pp.project_id = any(public.current_project_ids())
      and pp.status in ('active', 'invited')
      and pp.user_email is not null
  )
);

commit;
