-- Rollback manual da migration multi-familia.
--
-- Use somente se a migration multi-familia precisar ser revertida.
-- Este rollback tenta voltar o modelo de banco para o estado anterior SEM
-- apagar dados operacionais de Financeiro, Compras ou Tarefas.
--
-- Importante:
-- 1. Volte tambem o codigo da aplicacao para uma versao anterior a branch
--    codex/multi-familia-convites.
-- 2. Este arquivo remove convites e funcoes novas, restaura roles antigos
--    ('admin'/'member') e recria o trigger antigo para Julio/Carol.
-- 3. Ele NAO apaga familias novas criadas em teste. Se quiser limpar familias
--    de teste, faça isso manualmente depois de conferir ids e impactos.

drop policy if exists "admins can view family invites" on public.family_invites;
drop policy if exists "admins can create family invites" on public.family_invites;
drop policy if exists "admins can update family invites" on public.family_invites;
drop policy if exists "admins can delete family invites" on public.family_invites;

drop policy if exists "owners and admins can update non-owner members" on public.family_members;
drop policy if exists "owners can remove non-owner members" on public.family_members;

drop table if exists public.family_invites;

drop function if exists public.create_family_for_current_user(text);
drop function if exists public.create_family_invite(uuid, text, text);
drop function if exists public.get_family_invite(text);
drop function if exists public.accept_family_invite(text);
drop function if exists public.update_family_name(uuid, text);
drop function if exists public.remove_family_member(uuid);
drop function if exists public.is_family_admin(uuid);
drop function if exists public.is_family_owner(uuid);

update public.family_members
set role = 'admin',
    updated_at = now()
where role = 'owner';

alter table public.family_members
  drop constraint if exists family_members_role_check;

alter table public.family_members
  add constraint family_members_role_check
  check (role in ('admin', 'member'));

drop policy if exists "members can view their family" on public.families;
drop policy if exists "members can view family members" on public.family_members;

create policy "members can view their family"
  on public.families for select to authenticated
  using (public.is_family_member(id));

create policy "members can view family members"
  on public.family_members for select to authenticated
  using (public.is_family_member(family_id));

alter table public.shopping_lists
  drop constraint if exists shopping_lists_responsible_check;

update public.shopping_lists
set responsible = 'Família'
where responsible not in ('Família', 'Julio', 'Carol');

alter table public.shopping_lists
  add constraint shopping_lists_responsible_check
  check (responsible in ('Família', 'Julio', 'Carol'));

alter table public.finance_transactions
  drop constraint if exists finance_transactions_responsible_check;

update public.finance_transactions
set responsible = 'Família',
    updated_at = now()
where responsible not in ('Família', 'Julio', 'Carol');

alter table public.finance_transactions
  add constraint finance_transactions_responsible_check
  check (responsible in ('Família', 'Julio', 'Carol'));

alter table public.finance_bills
  drop constraint if exists finance_bills_responsible_check;

update public.finance_bills
set responsible = 'Família',
    updated_at = now()
where responsible not in ('Família', 'Julio', 'Carol');

alter table public.finance_bills
  add constraint finance_bills_responsible_check
  check (responsible in ('Família', 'Julio', 'Carol'));

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

  select id into family_uuid
  from public.families
  where name = 'Família Julio & Carol'
  order by created_at asc
  limit 1;

  if family_uuid is null then
    insert into public.families (name)
    values ('Família Julio & Carol')
    returning id into family_uuid;
  end if;

  insert into public.family_members (family_id, user_id, name, email, role, avatar_url)
  values (
    family_uuid,
    new.id,
    case when lower(new.email) = 'juliojr0410@gmail.com' then 'Julio' else 'Carol' end,
    lower(new.email),
    'admin',
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (family_id, user_id) do update
  set name = excluded.name,
      email = excluded.email,
      role = 'admin',
      avatar_url = excluded.avatar_url,
      updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_authorized_user_created on auth.users;
create trigger on_authorized_user_created
after insert on auth.users
for each row execute function public.add_authorized_family_member();
