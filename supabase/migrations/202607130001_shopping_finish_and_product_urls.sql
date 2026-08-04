alter table public.shopping_items
  add column if not exists product_url text
  check (product_url is null or (char_length(product_url) <= 2048 and product_url ~ '^https?://'));

create or replace function public.finish_shopping_list(
  target_list_id uuid,
  move_pending_items boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  source_list public.shopping_lists;
  next_list_id uuid;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;

  select * into source_list from public.shopping_lists
  where id = target_list_id for update;

  if source_list.id is null then raise exception 'LIST_NOT_FOUND'; end if;
  if not public.is_family_member(source_list.family_id) then raise exception 'FORBIDDEN'; end if;
  if source_list.status <> 'active' then raise exception 'LIST_ALREADY_FINISHED'; end if;

  if move_pending_items and exists (
    select 1 from public.shopping_items where list_id = source_list.id and checked = false
  ) then
    insert into public.shopping_lists (family_id, emoji, name, scheduled_date, responsible)
    values (source_list.family_id, source_list.emoji, source_list.name || ' - Pendentes', current_date + 7, source_list.responsible)
    returning id into next_list_id;

    update public.shopping_items
    set list_id = next_list_id, checked = false, checked_at = null
    where list_id = source_list.id and checked = false;
  end if;

  update public.shopping_lists set status = 'archived', archived_at = now()
  where id = source_list.id;

  return next_list_id;
end;
$$;

revoke all on function public.finish_shopping_list(uuid, boolean) from public;
grant execute on function public.finish_shopping_list(uuid, boolean) to authenticated;
