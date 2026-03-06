begin;

alter table public.companies
  add column if not exists company_type text;

update public.companies
set company_type = coalesce(company_type, 'general_contractor');

alter table public.companies
  alter column company_type set default 'general_contractor';

alter table public.company_members
  add column if not exists company_member_role text;

update public.company_members
set company_member_role = coalesce(
  company_member_role,
  case
    when role = 'admin' then 'owner_admin'
    when profession in ('architect', 'engineer', 'surveyor', 'designer') then 'technical_office'
    when profession = 'accountant' then 'backoffice'
    when profession = 'owner_admin' then 'owner_admin'
    when profession = 'project_manager' then 'project_manager'
    when profession = 'site_manager' then 'site_manager'
    when profession = 'crew_leader' then 'crew_leader'
    when profession = 'technical_office' then 'technical_office'
    when profession = 'safety_manager' then 'safety_manager'
    when profession = 'worker' then 'worker'
    when profession = 'backoffice' then 'backoffice'
    when profession = 'external_consultant' then 'external_consultant'
    else 'worker'
  end
);

alter table public.company_members
  alter column company_member_role set default 'worker';

update public.users
set role = 'normal'
where role = 'user';

alter table public.users
  alter column role set default 'normal';

commit;
