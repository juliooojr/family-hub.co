create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  timezone text not null default 'America/Sao_Paulo',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, endpoint)
);

create table if not exists public.routine_notification_deliveries (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.routine_tasks(id) on delete cascade,
  subscription_id uuid not null references public.push_subscriptions(id) on delete cascade,
  scheduled_date date not null,
  delivered_at timestamptz not null default now(),
  unique (task_id, subscription_id, scheduled_date)
);

create index if not exists push_subscriptions_user_idx on public.push_subscriptions (user_id);
create index if not exists routine_notification_deliveries_date_idx on public.routine_notification_deliveries (scheduled_date desc);

alter table public.push_subscriptions enable row level security;
alter table public.routine_notification_deliveries enable row level security;

create policy "members manage own push subscriptions"
  on public.push_subscriptions for all to authenticated
  using (public.is_family_member(family_id) and user_id = auth.uid())
  with check (public.is_family_member(family_id) and user_id = auth.uid());

create policy "members read own notification deliveries"
  on public.routine_notification_deliveries for select to authenticated
  using (exists (
    select 1 from public.push_subscriptions
    where push_subscriptions.id = routine_notification_deliveries.subscription_id
      and push_subscriptions.user_id = auth.uid()
  ));

drop trigger if exists touch_push_subscriptions_updated_at on public.push_subscriptions;
create trigger touch_push_subscriptions_updated_at
before update on public.push_subscriptions
for each row execute function public.touch_routine_updated_at();
