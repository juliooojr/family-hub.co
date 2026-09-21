-- Agenda familiar: eventos, participantes, excecoes de recorrencia, RLS, auditoria e Realtime.
create table if not exists public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete restrict,
  name text not null check (char_length(trim(name)) between 1 and 120),
  description text,
  location text,
  audience text not null check (audience in ('family', 'selected', 'self')),
  all_day boolean not null default false,
  starts_on date not null,
  start_time time,
  end_time time,
  ends_next_day boolean not null default false,
  recurrence text not null default 'none' check (recurrence in ('none', 'daily', 'weekly', 'biweekly', 'monthly', 'yearly')),
  recurrence_until date,
  reminder_minutes integer check (reminder_minutes is null or reminder_minutes in (0, 15, 60, 1440)),
  reminder_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (all_day or start_time is not null),
  check (all_day or end_time is null or ends_next_day or end_time > start_time),
  check (recurrence <> 'none' or recurrence_until is null),
  check (recurrence_until is null or recurrence_until >= starts_on),
  check (reminder_minutes is null or reminder_at is null)
);

create table if not exists public.calendar_event_participants (
  event_id uuid not null references public.calendar_events(id) on delete cascade,
  family_id uuid not null references public.families(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  reminder_minutes integer check (reminder_minutes is null or reminder_minutes in (0, 15, 60, 1440)),
  reminder_at timestamptz,
  created_at timestamptz not null default now(),
  primary key (event_id, user_id),
  check (reminder_minutes is null or reminder_at is null)
);

create table if not exists public.calendar_event_overrides (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.calendar_events(id) on delete cascade,
  family_id uuid not null references public.families(id) on delete cascade,
  occurrence_date date not null,
  cancelled boolean not null default false,
  name text check (name is null or char_length(trim(name)) between 1 and 120),
  description text,
  location text,
  all_day boolean,
  starts_on date,
  start_time time,
  end_time time,
  ends_next_day boolean,
  updated_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (event_id, occurrence_date),
  check (all_day is not false or start_time is not null),
  check (end_time is null or start_time is null or ends_next_day or end_time > start_time)
);

create table if not exists public.calendar_notification_deliveries (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.calendar_events(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  subscription_id uuid not null references public.push_subscriptions(id) on delete cascade,
  occurrence_date date not null,
  reminder_minutes integer,
  reminder_at timestamptz,
  delivery_key text not null,
  created_at timestamptz not null default now(),
  unique (event_id, user_id, subscription_id, delivery_key),
  check (reminder_minutes is null or reminder_at is null)
);

create index if not exists calendar_events_family_date_idx on public.calendar_events (family_id, starts_on);
create index if not exists calendar_events_creator_idx on public.calendar_events (created_by, starts_on);
create index if not exists calendar_participants_user_idx on public.calendar_event_participants (user_id, event_id);
create index if not exists calendar_overrides_event_date_idx on public.calendar_event_overrides (event_id, occurrence_date);

alter table public.calendar_events enable row level security;
alter table public.calendar_event_participants enable row level security;
alter table public.calendar_event_overrides enable row level security;
alter table public.calendar_notification_deliveries enable row level security;

create or replace function public.can_view_calendar_event(target_event_id uuid)
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.calendar_events event
    where event.id = target_event_id
      and public.is_family_member(event.family_id)
      and (
        event.created_by = auth.uid()
        or event.audience = 'family'
        or exists (select 1 from public.calendar_event_participants participant where participant.event_id = event.id and participant.user_id = auth.uid())
      )
  );
$$;

create or replace function public.is_calendar_participant(target_event_id uuid)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.calendar_event_participants where event_id = target_event_id and user_id = auth.uid()); $$;

create or replace function public.can_manage_calendar_event(target_event_id uuid)
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.calendar_events event
    where event.id = target_event_id
      and (event.created_by = auth.uid() or public.is_family_admin(event.family_id))
  );
$$;

revoke all on function public.can_view_calendar_event(uuid) from public;
revoke all on function public.can_manage_calendar_event(uuid) from public;
revoke all on function public.is_calendar_participant(uuid) from public;
grant execute on function public.can_view_calendar_event(uuid) to authenticated;
grant execute on function public.can_manage_calendar_event(uuid) to authenticated;
grant execute on function public.is_calendar_participant(uuid) to authenticated;

create policy "members view visible calendar events" on public.calendar_events for select to authenticated
using (public.is_family_member(family_id) and (created_by = auth.uid() or audience = 'family' or public.is_calendar_participant(id) or public.is_family_admin(family_id)));
create policy "members create calendar events" on public.calendar_events for insert to authenticated
with check (public.is_family_member(family_id) and created_by = auth.uid());
create policy "creators and admins update calendar events" on public.calendar_events for update to authenticated
using (created_by = auth.uid() or public.is_family_admin(family_id))
with check (public.is_family_member(family_id) and (created_by = auth.uid() or public.is_family_admin(family_id)));
create policy "creators and admins delete calendar events" on public.calendar_events for delete to authenticated
using (created_by = auth.uid() or public.is_family_admin(family_id));

create policy "members view participants of visible events" on public.calendar_event_participants for select to authenticated
using (public.can_view_calendar_event(event_id));
create policy "creators and admins add participants" on public.calendar_event_participants for insert to authenticated
with check (public.can_manage_calendar_event(event_id) and public.is_family_member(family_id) and exists (
  select 1 from public.family_members member where member.family_id = calendar_event_participants.family_id and member.user_id = calendar_event_participants.user_id
));
create policy "creators and admins update participants" on public.calendar_event_participants for update to authenticated
using (public.can_manage_calendar_event(event_id)) with check (public.can_manage_calendar_event(event_id));
create policy "creators and admins delete participants" on public.calendar_event_participants for delete to authenticated
using (public.can_manage_calendar_event(event_id));

create policy "members view overrides of visible events" on public.calendar_event_overrides for select to authenticated
using (public.can_view_calendar_event(event_id));
create policy "creators and admins add overrides" on public.calendar_event_overrides for insert to authenticated
with check (public.can_manage_calendar_event(event_id) and updated_by = auth.uid());
create policy "creators and admins update overrides" on public.calendar_event_overrides for update to authenticated
using (public.can_manage_calendar_event(event_id)) with check (public.can_manage_calendar_event(event_id) and updated_by = auth.uid());
create policy "creators and admins delete overrides" on public.calendar_event_overrides for delete to authenticated
using (public.can_manage_calendar_event(event_id));

create policy "users view own calendar deliveries" on public.calendar_notification_deliveries for select to authenticated using (user_id = auth.uid());

create or replace function public.touch_calendar_updated_at()
returns trigger language plpgsql security definer set search_path = public as $$
begin new.updated_at := now(); return new; end;
$$;
create trigger touch_calendar_events_updated_at before update on public.calendar_events for each row execute function public.touch_calendar_updated_at();
create trigger touch_calendar_overrides_updated_at before update on public.calendar_event_overrides for each row execute function public.touch_calendar_updated_at();

create or replace function public.audit_calendar_change()
returns trigger language plpgsql security definer set search_path = public as $$
declare source_row jsonb; old_row jsonb; source_family_id uuid; source_record_id uuid;
begin
  source_row := case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end;
  old_row := case when tg_op = 'UPDATE' then to_jsonb(old) else null end;
  source_family_id := (source_row ->> 'family_id')::uuid;
  source_record_id := (source_row ->> 'id')::uuid;
  insert into public.audit_log (family_id, user_id, action, table_name, record_id, payload)
  values (source_family_id, auth.uid(), lower(tg_op), tg_table_name, source_record_id,
    case when tg_op = 'UPDATE' then jsonb_build_object('old', old_row, 'new', source_row) else source_row end);
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;
create trigger audit_calendar_events after insert or update or delete on public.calendar_events for each row execute function public.audit_calendar_change();

do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'calendar_events') then
    alter publication supabase_realtime add table public.calendar_events;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'calendar_event_participants') then
    alter publication supabase_realtime add table public.calendar_event_participants;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'calendar_event_overrides') then
    alter publication supabase_realtime add table public.calendar_event_overrides;
  end if;
end $$;
