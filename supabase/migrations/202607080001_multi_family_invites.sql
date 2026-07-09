create extension if not exists pgcrypto;

alter table public.families
  add column if not exists created_by uuid references auth.users(id) on delete set null,
  add column if not exists updated_at timestamptz not null default now();

alter table public.family_members
  add column if not exists email text,
  add column if not exists updated_at timestamptz not null default now();

alter table public.family_members
  alter column name drop not null;

update public.family_members as member
set email = lower(users.email),
    avatar_url = coalesce(member.avatar_url, users.raw_user_meta_data ->> 'avatar_url'),
    updated_at = now()
from auth.users as users
where member.user_id = users.id
  and member.email is null;

alter table public.family_members
  drop constraint if exists family_members_role_check;

alter table public.family_members
  add constraint family_members_role_check
  check (role in ('owner', 'admin', 'member'));

do $$
declare
  family_uuid uuid;
  julio_uuid uuid;
  carol_uuid uuid;
begin
  select id into family_uuid
  from public.families
  where name = 'Família Julio & Carol'
  order by created_at asc
  limit 1;

  if family_uuid is null then
    select family_id into family_uuid
    from public.family_members
    group by family_id
    order by count(*) desc
    limit 1;
  end if;

  if family_uuid is null then
    insert into public.families (name)
    values ('Família Julio & Carol')
    returning id into family_uuid;
  end if;

  select id into julio_uuid from auth.users where lower(email) = 'juliojr0410@gmail.com' limit 1;
  select id into carol_uuid from auth.users where lower(email) = 'carolinneagro@gmail.com' limit 1;

  if julio_uuid is not null then
    insert into public.family_members (family_id, user_id, name, email, role, avatar_url)
    select family_uuid, users.id, 'Julio', lower(users.email), 'owner', users.raw_user_meta_data ->> 'avatar_url'
    from auth.users as users
    where users.id = julio_uuid
    on conflict (family_id, user_id) do update
    set name = coalesce(public.family_members.name, excluded.name),
        email = excluded.email,
        role = 'owner',
        avatar_url = coalesce(public.family_members.avatar_url, excluded.avatar_url),
        updated_at = now();

    update public.families
    set created_by = coalesce(created_by, julio_uuid),
        updated_at = now()
    where id = family_uuid;
  end if;

  if carol_uuid is not null then
    insert into public.family_members (family_id, user_id, name, email, role, avatar_url)
    select family_uuid, users.id, 'Carol', lower(users.email), 'admin', users.raw_user_meta_data ->> 'avatar_url'
    from auth.users as users
    where users.id = carol_uuid
    on conflict (family_id, user_id) do update
    set name = coalesce(public.family_members.name, excluded.name),
        email = excluded.email,
        role = case when public.family_members.role = 'owner' then 'owner' else 'admin' end,
        avatar_url = coalesce(public.family_members.avatar_url, excluded.avatar_url),
        updated_at = now();
  end if;
end $$;

alter table public.family_members
  alter column email set not null;

create index if not exists family_members_user_idx
  on public.family_members (user_id);
create index if not exists family_members_family_role_idx
  on public.family_members (family_id, role);
create unique index if not exists family_members_family_email_uidx
  on public.family_members (family_id, lower(email));

create table if not exists public.family_invites (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  email text not null,
  role text not null check (role in ('admin', 'member')),
  token text unique not null default encode(gen_random_bytes(24), 'hex'),
  invited_by uuid references auth.users(id) on delete set null,
  accepted_by uuid references auth.users(id) on delete set null,
  accepted_at timestamptz,
  expires_at timestamptz not null default (now() + interval '48 hours'),
  created_at timestamptz not null default now()
);

create index if not exists family_invites_family_created_idx
  on public.family_invites (family_id, created_at desc);
create index if not exists family_invites_token_idx
  on public.family_invites (token);
create index if not exists family_invites_email_pending_idx
  on public.family_invites (lower(email), accepted_at, expires_at);

alter table public.family_invites enable row level security;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists families_updated_at on public.families;
create trigger families_updated_at
before update on public.families
for each row execute function public.touch_updated_at();

drop trigger if exists family_members_updated_at on public.family_members;
create trigger family_members_updated_at
before update on public.family_members
for each row execute function public.touch_updated_at();

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

create or replace function public.is_family_admin(target_family_id uuid)
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
      and role in ('owner', 'admin')
  );
$$;

create or replace function public.is_family_owner(target_family_id uuid)
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
      and role = 'owner'
  );
$$;

revoke all on function public.is_family_member(uuid) from public;
revoke all on function public.is_family_admin(uuid) from public;
revoke all on function public.is_family_owner(uuid) from public;
grant execute on function public.is_family_member(uuid) to authenticated;
grant execute on function public.is_family_admin(uuid) to authenticated;
grant execute on function public.is_family_owner(uuid) to authenticated;

drop policy if exists "members can view their family" on public.families;
drop policy if exists "members can view family members" on public.family_members;
drop policy if exists "admins can view family invites" on public.family_invites;
drop policy if exists "admins can create family invites" on public.family_invites;
drop policy if exists "admins can update family invites" on public.family_invites;
drop policy if exists "admins can delete family invites" on public.family_invites;

create policy "members can view their family"
  on public.families for select to authenticated
  using (public.is_family_member(id));

create policy "members can view family members"
  on public.family_members for select to authenticated
  using (public.is_family_member(family_id));

create policy "owners and admins can update non-owner members"
  on public.family_members for update to authenticated
  using (
    public.is_family_admin(family_id)
    and role <> 'owner'
  )
  with check (
    public.is_family_admin(family_id)
    and role <> 'owner'
  );

create policy "owners can remove non-owner members"
  on public.family_members for delete to authenticated
  using (
    public.is_family_owner(family_id)
    and role <> 'owner'
  );

create policy "admins can view family invites"
  on public.family_invites for select to authenticated
  using (public.is_family_admin(family_id));

create policy "admins can create family invites"
  on public.family_invites for insert to authenticated
  with check (
    public.is_family_admin(family_id)
    and invited_by = auth.uid()
    and role in ('admin', 'member')
  );

create policy "admins can update family invites"
  on public.family_invites for update to authenticated
  using (public.is_family_admin(family_id))
  with check (public.is_family_admin(family_id));

create policy "admins can delete family invites"
  on public.family_invites for delete to authenticated
  using (public.is_family_admin(family_id));

alter table public.shopping_lists
  drop constraint if exists shopping_lists_responsible_check;

alter table public.shopping_lists
  add constraint shopping_lists_responsible_check
  check (char_length(trim(responsible)) between 1 and 120);

alter table public.finance_transactions
  drop constraint if exists finance_transactions_responsible_check;
alter table public.finance_transactions
  add constraint finance_transactions_responsible_check
  check (char_length(trim(responsible)) between 1 and 120);

alter table public.finance_bills
  drop constraint if exists finance_bills_responsible_check;
alter table public.finance_bills
  add constraint finance_bills_responsible_check
  check (char_length(trim(responsible)) between 1 and 120);

drop trigger if exists on_authorized_user_created on auth.users;
drop function if exists public.add_authorized_family_member();

create or replace function public.create_family_for_current_user(family_name text default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  current_user_email text;
  current_user_name text;
  current_avatar_url text;
  new_family_id uuid;
begin
  if current_user_id is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  select
    lower(email),
    coalesce(raw_user_meta_data ->> 'full_name', split_part(email, '@', 1)),
    raw_user_meta_data ->> 'avatar_url'
  into current_user_email, current_user_name, current_avatar_url
  from auth.users
  where id = current_user_id;

  select family_id into new_family_id
  from public.family_members
  where user_id = current_user_id
  order by created_at asc
  limit 1;

  if new_family_id is not null then
    return new_family_id;
  end if;

  insert into public.families (name, created_by)
  values (
    coalesce(nullif(trim(family_name), ''), 'Família de ' || split_part(current_user_name, ' ', 1)),
    current_user_id
  )
  returning id into new_family_id;

  insert into public.family_members (family_id, user_id, name, email, role, avatar_url)
  values (new_family_id, current_user_id, current_user_name, current_user_email, 'owner', current_avatar_url)
  on conflict (family_id, user_id) do nothing;

  return new_family_id;
end;
$$;

create or replace function public.create_family_invite(
  target_family_id uuid,
  invite_email text,
  invite_role text
)
returns public.family_invites
language plpgsql
security definer
set search_path = public
as $$
declare
  clean_email text := lower(trim(invite_email));
  created_invite public.family_invites;
begin
  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  if not public.is_family_admin(target_family_id) then
    raise exception 'FORBIDDEN';
  end if;

  if clean_email = '' or clean_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'INVALID_EMAIL';
  end if;

  if invite_role not in ('admin', 'member') then
    raise exception 'INVALID_ROLE';
  end if;

  if exists (
    select 1 from public.family_members
    where family_id = target_family_id and lower(email) = clean_email
  ) then
    raise exception 'ALREADY_MEMBER';
  end if;

  update public.family_invites
  set accepted_at = coalesce(accepted_at, now())
  where family_id = target_family_id
    and lower(email) = clean_email
    and accepted_at is null
    and expires_at < now();

  insert into public.family_invites (family_id, email, role, invited_by, expires_at)
  values (target_family_id, clean_email, invite_role, auth.uid(), now() + interval '48 hours')
  returning * into created_invite;

  return created_invite;
end;
$$;

create or replace function public.get_family_invite(invite_token text)
returns table (
  id uuid,
  family_id uuid,
  family_name text,
  email text,
  role text,
  accepted_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    invite.id,
    invite.family_id,
    families.name as family_name,
    invite.email,
    invite.role,
    invite.accepted_at,
    invite.expires_at,
    invite.created_at
  from public.family_invites invite
  join public.families on families.id = invite.family_id
  where invite.token = invite_token
  limit 1;
$$;

create or replace function public.accept_family_invite(invite_token text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  current_user_email text;
  current_user_name text;
  current_avatar_url text;
  invite_row public.family_invites;
begin
  if current_user_id is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  select
    lower(email),
    coalesce(raw_user_meta_data ->> 'full_name', split_part(email, '@', 1)),
    raw_user_meta_data ->> 'avatar_url'
  into current_user_email, current_user_name, current_avatar_url
  from auth.users
  where id = current_user_id;

  select * into invite_row
  from public.family_invites
  where token = invite_token
  limit 1;

  if invite_row.id is null then
    raise exception 'INVITE_NOT_FOUND';
  end if;

  if invite_row.accepted_at is not null then
    raise exception 'INVITE_ACCEPTED';
  end if;

  if invite_row.expires_at <= now() then
    raise exception 'INVITE_EXPIRED';
  end if;

  if lower(invite_row.email) <> current_user_email then
    raise exception 'EMAIL_MISMATCH';
  end if;

  insert into public.family_members (family_id, user_id, name, email, role, avatar_url)
  values (
    invite_row.family_id,
    current_user_id,
    current_user_name,
    current_user_email,
    invite_row.role,
    current_avatar_url
  )
  on conflict (family_id, user_id) do update
  set name = coalesce(public.family_members.name, excluded.name),
      email = excluded.email,
      role = case when public.family_members.role = 'owner' then 'owner' else excluded.role end,
      avatar_url = coalesce(public.family_members.avatar_url, excluded.avatar_url),
      updated_at = now();

  update public.family_invites
  set accepted_by = current_user_id,
      accepted_at = now()
  where id = invite_row.id
    and accepted_at is null;

  return invite_row.family_id;
end;
$$;

revoke all on function public.create_family_for_current_user(text) from public;
revoke all on function public.create_family_invite(uuid, text, text) from public;
revoke all on function public.get_family_invite(text) from public;
revoke all on function public.accept_family_invite(text) from public;
grant execute on function public.create_family_for_current_user(text) to authenticated;
grant execute on function public.create_family_invite(uuid, text, text) to authenticated;
grant execute on function public.get_family_invite(text) to anon, authenticated;
grant execute on function public.accept_family_invite(text) to authenticated;
