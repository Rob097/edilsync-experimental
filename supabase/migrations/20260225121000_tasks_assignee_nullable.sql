alter table public.tasks
  alter column assigned_participant_id drop not null,
  alter column assigned_participant_type drop not null;
