-- Refinamentos da gestao familiar.
-- Convites continuam expirando em 48 horas na funcao create_family_invite.

create or replace function public.update_family_name(
  target_family_id uuid,
  new_family_name text
)
returns public.families
language plpgsql
security definer
set search_path = public
as $$
declare
  clean_name text := trim(new_family_name);
  updated_family public.families;
begin
  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  if not public.is_family_admin(target_family_id) then
    raise exception 'FORBIDDEN';
  end if;

  if char_length(clean_name) < 2 or char_length(clean_name) > 80 then
    raise exception 'INVALID_FAMILY_NAME';
  end if;

  update public.families
  set name = clean_name,
      updated_at = now()
  where id = target_family_id
  returning * into updated_family;

  return updated_family;
end;
$$;

create or replace function public.remove_family_member(target_member_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  target_member public.family_members;
  requester_role text;
begin
  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  select * into target_member
  from public.family_members
  where id = target_member_id;

  if target_member.id is null then
    raise exception 'MEMBER_NOT_FOUND';
  end if;

  if target_member.user_id = auth.uid() then
    raise exception 'CANNOT_REMOVE_SELF';
  end if;

  if target_member.role = 'owner' then
    raise exception 'CANNOT_REMOVE_OWNER';
  end if;

  select role into requester_role
  from public.family_members
  where family_id = target_member.family_id
    and user_id = auth.uid();

  if requester_role = 'owner' then
    delete from public.family_members where id = target_member.id;
    return target_member.family_id;
  end if;

  if requester_role = 'admin' and target_member.role = 'member' then
    delete from public.family_members where id = target_member.id;
    return target_member.family_id;
  end if;

  raise exception 'FORBIDDEN';
end;
$$;

revoke all on function public.update_family_name(uuid, text) from public;
revoke all on function public.remove_family_member(uuid) from public;
grant execute on function public.update_family_name(uuid, text) to authenticated;
grant execute on function public.remove_family_member(uuid) to authenticated;
