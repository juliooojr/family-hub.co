-- Preserva os estados anterior e novo para que o feed diferencie conclusoes
-- relevantes de edicoes comuns, sem criar uma segunda trilha de auditoria.
create or replace function public.audit_shopping_change()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  source_row jsonb := case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end;
begin
  insert into public.audit_log (family_id, user_id, action, table_name, record_id, payload)
  values (
    (source_row ->> 'family_id')::uuid,
    auth.uid(),
    lower(tg_op),
    tg_table_name,
    (source_row ->> 'id')::uuid,
    jsonb_build_object('old', case when tg_op = 'INSERT' then null else to_jsonb(old) end, 'new', case when tg_op = 'DELETE' then null else to_jsonb(new) end)
  );
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

create or replace function public.audit_finance_change()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  source_row jsonb := case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end;
begin
  insert into public.audit_log (family_id, user_id, action, table_name, record_id, payload)
  values (
    (source_row ->> 'family_id')::uuid,
    auth.uid(),
    lower(tg_op),
    tg_table_name,
    nullif(source_row ->> 'id', '')::uuid,
    jsonb_build_object('old', case when tg_op = 'INSERT' then null else to_jsonb(old) end, 'new', case when tg_op = 'DELETE' then null else to_jsonb(new) end)
  );
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

create or replace function public.audit_routine_change()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  source_row jsonb := case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end;
begin
  insert into public.audit_log (family_id, user_id, action, table_name, record_id, payload)
  values (
    (source_row ->> 'family_id')::uuid,
    auth.uid(),
    lower(tg_op),
    tg_table_name,
    (source_row ->> 'id')::uuid,
    jsonb_build_object('old', case when tg_op = 'INSERT' then null else to_jsonb(old) end, 'new', case when tg_op = 'DELETE' then null else to_jsonb(new) end)
  );
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;
