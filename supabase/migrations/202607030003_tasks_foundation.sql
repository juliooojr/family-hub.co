create table if not exists public.routine_tasks (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  emoji text not null default '✓',
  name text not null check (char_length(trim(name)) between 1 and 100),
  description text,
  goal_type text not null check (goal_type in ('check', 'quantity')) default 'check',
  goal_value numeric(10,2) not null default 1 check (goal_value > 0),
  goal_unit text,
  quick_values numeric[] not null default array[]::numeric[],
  frequency text not null check (frequency in ('daily', 'weekly', 'biweekly', 'monthly')) default 'daily',
  weekdays int[] check (
    weekdays is null
    or (
      array_length(weekdays, 1) between 1 and 7
      and weekdays <@ array[0,1,2,3,4,5,6]
    )
  ),
  start_date date not null default current_date,
  notification_enabled boolean not null default false,
  notification_time time,
  status text not null check (status in ('active', 'archived')) default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.routine_entries (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.routine_tasks(id) on delete cascade,
  family_id uuid not null references public.families(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  entry_date date not null,
  value numeric(10,2) not null default 0 check (value >= 0),
  completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (task_id, entry_date)
);

create index if not exists routine_tasks_user_status_idx
  on public.routine_tasks (user_id, status, start_date);
create index if not exists routine_tasks_family_user_idx
  on public.routine_tasks (family_id, user_id);
create index if not exists routine_entries_user_date_idx
  on public.routine_entries (user_id, entry_date desc);
create index if not exists routine_entries_task_date_idx
  on public.routine_entries (task_id, entry_date desc);

alter table public.routine_tasks enable row level security;
alter table public.routine_entries enable row level security;

create policy "members manage own routine tasks"
  on public.routine_tasks for all to authenticated
  using (public.is_family_member(family_id) and user_id = auth.uid())
  with check (public.is_family_member(family_id) and user_id = auth.uid());

create policy "members manage own routine entries"
  on public.routine_entries for all to authenticated
  using (public.is_family_member(family_id) and user_id = auth.uid())
  with check (
    public.is_family_member(family_id)
    and user_id = auth.uid()
    and exists (
      select 1 from public.routine_tasks
      where id = routine_entries.task_id
        and family_id = routine_entries.family_id
        and user_id = auth.uid()
    )
  );

create or replace function public.touch_routine_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists touch_routine_tasks_updated_at on public.routine_tasks;
create trigger touch_routine_tasks_updated_at
before update on public.routine_tasks
for each row execute function public.touch_routine_updated_at();

drop trigger if exists touch_routine_entries_updated_at on public.routine_entries;
create trigger touch_routine_entries_updated_at
before update on public.routine_entries
for each row execute function public.touch_routine_updated_at();

create or replace function public.audit_routine_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  source_row jsonb;
  source_family_id uuid;
  source_record_id uuid;
begin
  source_row := case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end;
  source_family_id := (source_row ->> 'family_id')::uuid;
  source_record_id := (source_row ->> 'id')::uuid;

  insert into public.audit_log (family_id, user_id, action, table_name, record_id, payload)
  values (source_family_id, auth.uid(), lower(tg_op), tg_table_name, source_record_id, source_row);

  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

drop trigger if exists audit_routine_tasks on public.routine_tasks;
create trigger audit_routine_tasks
after insert or update or delete on public.routine_tasks
for each row execute function public.audit_routine_change();

drop trigger if exists audit_routine_entries on public.routine_entries;
create trigger audit_routine_entries
after insert or update or delete on public.routine_entries
for each row execute function public.audit_routine_change();
