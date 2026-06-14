update public.shopping_lists
set responsible = 'Família'
where responsible not in ('Família', 'Julio', 'Carol');

alter table public.shopping_lists
  drop constraint if exists shopping_lists_responsible_check;

alter table public.shopping_lists
  add constraint shopping_lists_responsible_check
  check (responsible in ('Família', 'Julio', 'Carol'));
