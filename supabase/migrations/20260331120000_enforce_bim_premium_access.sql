create or replace function public.enforce_bim_document_premium_access()
returns trigger
language plpgsql
as $$
declare
  normalized_model text := lower(coalesce(new.model_format, new.file_type, ''));
  feature_access jsonb;
  access_level text;
begin
  if normalized_model not in ('ifc', 'glb', 'gltf') then
    return new;
  end if;

  if new.project_id is not null then
    feature_access := public.resolve_project_feature_access(new.project_id, 'project_documents');
  elsif new.company_id is not null then
    feature_access := public.resolve_company_feature_access(new.company_id, 'company_documents');
  else
    raise exception using
      message = 'BIM documents require a valid scope',
      detail = 'IFC, GLB, and GLTF files must belong to a project or company context.';
  end if;

  access_level := coalesce(feature_access ->> 'access_level', 'disabled');

  if access_level <> 'enabled' then
    raise exception using
      message = 'BIM documents require premium access',
      detail = 'IFC, GLB, and GLTF files are allowed only for Pro company documents or sponsored project documents.';
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_bim_document_premium_access_trigger on public.project_documents;

create trigger enforce_bim_document_premium_access_trigger
before insert or update of file_type, model_format, project_id, company_id
on public.project_documents
for each row
execute function public.enforce_bim_document_premium_access();