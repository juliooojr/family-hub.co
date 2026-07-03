alter table public.shopping_items
  add column if not exists estimated_price numeric(12,2)
  check (estimated_price is null or estimated_price >= 0);
