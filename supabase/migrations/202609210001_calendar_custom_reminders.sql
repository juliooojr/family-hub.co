-- Lembretes de Agenda em data e horario absolutos, compativeis com bases existentes.
alter table public.calendar_events
  add column if not exists reminder_at timestamptz;

alter table public.calendar_event_participants
  add column if not exists reminder_at timestamptz;

alter table public.calendar_notification_deliveries
  add column if not exists reminder_at timestamptz,
  add column if not exists delivery_key text;

update public.calendar_notification_deliveries
set delivery_key = 'relative:' || occurrence_date::text || ':' || reminder_minutes::text
where delivery_key is null;

alter table public.calendar_notification_deliveries
  alter column reminder_minutes drop not null,
  alter column delivery_key set not null;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'calendar_events_single_reminder_kind') then
    alter table public.calendar_events add constraint calendar_events_single_reminder_kind
      check (reminder_minutes is null or reminder_at is null);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'calendar_participants_single_reminder_kind') then
    alter table public.calendar_event_participants add constraint calendar_participants_single_reminder_kind
      check (reminder_minutes is null or reminder_at is null);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'calendar_deliveries_single_reminder_kind') then
    alter table public.calendar_notification_deliveries add constraint calendar_deliveries_single_reminder_kind
      check (reminder_minutes is null or reminder_at is null);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'calendar_deliveries_unique_key') then
    alter table public.calendar_notification_deliveries add constraint calendar_deliveries_unique_key
      unique (event_id, user_id, subscription_id, delivery_key);
  end if;
end $$;
