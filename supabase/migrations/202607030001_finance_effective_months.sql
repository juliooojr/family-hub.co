alter table public.finance_bills
  add column if not exists end_date date check (end_date is null or extract(day from end_date) = 1);

alter table public.finance_budgets
  add column if not exists start_date date not null default date '2026-01-01' check (extract(day from start_date) = 1),
  add column if not exists end_date date check (end_date is null or extract(day from end_date) = 1);

alter table public.finance_budgets
  drop constraint if exists finance_budgets_family_id_category_key;

create index if not exists finance_bills_family_effective_idx
  on public.finance_bills (family_id, start_date, end_date);

create index if not exists finance_budgets_family_effective_idx
  on public.finance_budgets (family_id, category, start_date, end_date);

create unique index if not exists finance_budgets_family_category_start_uidx
  on public.finance_budgets (family_id, lower(category), start_date);
