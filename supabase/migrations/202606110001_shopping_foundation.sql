create extension if not exists pgcrypto;

create table if not exists public.families (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.family_members (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  role text not null check (role in ('admin', 'member')) default 'member',
  avatar_url text,
  created_at timestamptz not null default now(),
  unique (family_id, user_id)
);

create table if not exists public.shopping_lists (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  emoji text not null default '🛒',
  name text not null check (char_length(trim(name)) between 1 and 100),
  scheduled_date date,
  responsible text not null default 'Família',
  status text not null check (status in ('active', 'archived')) default 'active',
  created_at timestamptz not null default now(),
  archived_at timestamptz
);

create table if not exists public.shopping_items (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references public.shopping_lists(id) on delete cascade,
  family_id uuid not null references public.families(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 160),
  checked boolean not null default false,
  checked_at timestamptz,
  created_at timestamptz not null default now(),
  unique (list_id, name)
);

create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  action text not null,
  table_name text not null,
  record_id uuid,
  payload jsonb,
  created_at timestamptz not null default now()
);

create index if not exists shopping_lists_family_status_date_idx
  on public.shopping_lists (family_id, status, scheduled_date asc nulls last);
create index if not exists shopping_items_list_name_idx
  on public.shopping_items (list_id, lower(name));
create index if not exists audit_log_family_created_idx
  on public.audit_log (family_id, created_at desc);

create or replace function public.is_family_member(target_family_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.family_members
    where family_id = target_family_id
      and user_id = auth.uid()
  );
$$;

revoke all on function public.is_family_member(uuid) from public;
grant execute on function public.is_family_member(uuid) to authenticated;

alter table public.families enable row level security;
alter table public.family_members enable row level security;
alter table public.shopping_lists enable row level security;
alter table public.shopping_items enable row level security;
alter table public.audit_log enable row level security;

create policy "members can view their family"
  on public.families for select to authenticated
  using (public.is_family_member(id));

create policy "members can view family members"
  on public.family_members for select to authenticated
  using (public.is_family_member(family_id));

create policy "members can read shopping lists"
  on public.shopping_lists for select to authenticated
  using (public.is_family_member(family_id));
create policy "members can create shopping lists"
  on public.shopping_lists for insert to authenticated
  with check (public.is_family_member(family_id));
create policy "members can update shopping lists"
  on public.shopping_lists for update to authenticated
  using (public.is_family_member(family_id))
  with check (public.is_family_member(family_id));
create policy "members can delete shopping lists"
  on public.shopping_lists for delete to authenticated
  using (public.is_family_member(family_id));

create policy "members can read shopping items"
  on public.shopping_items for select to authenticated
  using (public.is_family_member(family_id));
create policy "members can create shopping items"
  on public.shopping_items for insert to authenticated
  with check (
    public.is_family_member(family_id)
    and exists (
      select 1 from public.shopping_lists
      where id = list_id and family_id = shopping_items.family_id
    )
  );
create policy "members can update shopping items"
  on public.shopping_items for update to authenticated
  using (public.is_family_member(family_id))
  with check (public.is_family_member(family_id));
create policy "members can delete shopping items"
  on public.shopping_items for delete to authenticated
  using (public.is_family_member(family_id));

create policy "members can read audit log"
  on public.audit_log for select to authenticated
  using (public.is_family_member(family_id));

create or replace function public.audit_shopping_change()
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

drop trigger if exists audit_shopping_lists on public.shopping_lists;
create trigger audit_shopping_lists
after insert or update or delete on public.shopping_lists
for each row execute function public.audit_shopping_change();

drop trigger if exists audit_shopping_items on public.shopping_items;
create trigger audit_shopping_items
after insert or update or delete on public.shopping_items
for each row execute function public.audit_shopping_change();

do $$
declare
  family_uuid uuid;
begin
  select id into family_uuid from public.families where name = 'Família Julio & Carol' limit 1;
  if family_uuid is null then
    insert into public.families (name) values ('Família Julio & Carol') returning id into family_uuid;
  end if;

  insert into public.family_members (family_id, user_id, name, role, avatar_url)
  select
    family_uuid,
    users.id,
    case
      when lower(users.email) = 'juliojr0410@gmail.com' then 'Julio'
      when lower(users.email) = 'carolinneagro@gmail.com' then 'Carol'
      else coalesce(users.raw_user_meta_data ->> 'full_name', split_part(users.email, '@', 1))
    end,
    'admin',
    users.raw_user_meta_data ->> 'avatar_url'
  from auth.users as users
  where lower(users.email) in ('juliojr0410@gmail.com', 'carolinneagro@gmail.com')
  on conflict (family_id, user_id) do update
  set name = excluded.name,
      avatar_url = excluded.avatar_url;
end $$;

create or replace function public.add_authorized_family_member()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  family_uuid uuid;
begin
  if lower(new.email) not in ('juliojr0410@gmail.com', 'carolinneagro@gmail.com') then
    return new;
  end if;

  select id into family_uuid from public.families where name = 'Família Julio & Carol' limit 1;
  insert into public.family_members (family_id, user_id, name, role, avatar_url)
  values (
    family_uuid,
    new.id,
    case when lower(new.email) = 'juliojr0410@gmail.com' then 'Julio' else 'Carol' end,
    'admin',
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (family_id, user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_authorized_user_created on auth.users;
create trigger on_authorized_user_created
after insert on auth.users
for each row execute function public.add_authorized_family_member();
