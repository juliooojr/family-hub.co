-- Permite que um evento termine no dia seguinte, inclusive em ocorrencias recorrentes.
alter table public.calendar_events
  add column if not exists ends_next_day boolean not null default false;

alter table public.calendar_event_overrides
  add column if not exists ends_next_day boolean;

alter table public.calendar_events
  drop constraint if exists calendar_events_check1,
  add constraint calendar_events_valid_end_time
    check (all_day or end_time is null or ends_next_day or end_time > start_time);

alter table public.calendar_event_overrides
  drop constraint if exists calendar_event_overrides_check1,
  add constraint calendar_event_overrides_valid_end_time
    check (end_time is null or start_time is null or ends_next_day or end_time > start_time);
