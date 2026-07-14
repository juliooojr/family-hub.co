alter table public.routine_notification_deliveries
  add column if not exists scheduled_time time;

update public.routine_notification_deliveries
set scheduled_time = (delivered_at at time zone 'America/Sao_Paulo')::time
where scheduled_time is null;

alter table public.routine_notification_deliveries
  alter column scheduled_time set not null;

do $$
declare
  constraint_name text;
begin
  select conname into constraint_name
  from pg_constraint
  where conrelid = 'public.routine_notification_deliveries'::regclass
    and contype = 'u'
    and pg_get_constraintdef(oid) = 'UNIQUE (task_id, subscription_id, scheduled_date)'
  limit 1;

  if constraint_name is not null then
    execute format('alter table public.routine_notification_deliveries drop constraint %I', constraint_name);
  end if;
end;
$$;

alter table public.routine_notification_deliveries
  add constraint routine_notification_deliveries_task_subscription_schedule_key
  unique (task_id, subscription_id, scheduled_date, scheduled_time);
