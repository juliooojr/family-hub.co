-- Mantem listas de compras sincronizadas entre membros da mesma familia.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'shopping_lists'
  ) then
    alter publication supabase_realtime add table public.shopping_lists;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'shopping_items'
  ) then
    alter publication supabase_realtime add table public.shopping_items;
  end if;
end
$$;
