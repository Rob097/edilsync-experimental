begin;

alter function public.set_audit_fields()
  set search_path = public;

commit;
